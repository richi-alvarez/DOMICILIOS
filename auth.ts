import 'server-only'

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { users, accounts, sessions, verificationTokens } from '@/db'
import { logger } from '@/lib/monitoring/logger'

async function getDb() {
  const { db, users, organizations, memberships } = await import('@/db')
  return { db, users, organizations, memberships }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  skipCSRFCheck: process.env.NODE_ENV === 'development',

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Permite vincular el login de Google a un usuario ya registrado con el
      // mismo email (p. ej. quien se registró con email/contraseña). Seguro
      // porque Google entrega emails verificados.
      allowDangerousEmailAccountLinking: true,
      // Pide acceso a Google Calendar (modo Citas) y refresh token offline.
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'tu@correo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        logger.info('🔍 Credentials Provider: authorize() called', {
          emailProvided: !!credentials?.email,
          passwordProvided: !!credentials?.password,
        })

        if (!credentials?.email || !credentials?.password) {
          logger.warn('❌ Missing email or password')
          return null
        }

        try {
          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email),
          })

          logger.info('🔍 User lookup result', {
            userFound: !!user,
            hasPasswordHash: !!user?.passwordHash,
            userEmail: user?.email,
          })

          if (!user || !user.passwordHash) {
            logger.warn('❌ User not found or no password hash')
            return null
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)

          logger.info('🔍 Password verification', {
            passwordMatch,
            userId: user.id,
          })

          if (!passwordMatch) {
            logger.warn('❌ Password does not match')
            return null
          }

          logger.info('✅ Auth successful', {
            userId: user.id,
            userEmail: user.email,
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          logger.error('🚨 Auth provider error', {
            error: error instanceof Error ? error.message : String(error),
          })
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      logger.info('👤 SignIn Callback Triggered', {
        provider: account?.provider,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        accountProviderAccountId: account?.providerAccountId,
        profileEmail: (profile as any)?.email,
        profileName: (profile as any)?.name,
        accountKeys: Object.keys(account || {}),
        profileKeys: profile ? Object.keys(profile) : [],
        timestamp: new Date().toISOString(),
      })

      if (account?.provider === 'google') {
        logger.info('🔐 Google OAuth Details', {
          accessToken: account.access_token ? '***REDACTED***' : null,
          refreshToken: account.refresh_token ? '***REDACTED***' : null,
          expiresAt: account.expires_at,
          tokenType: account.type,
          scope: account.scope,
        })

        // El DrizzleAdapter solo vincula (inserta) la cuenta en el PRIMER login.
        // En re-logins la fila ya existe y NextAuth NO actualiza los tokens, así
        // que un access/refresh token expirado se queda para siempre y Google
        // Calendar (modo Citas) deja de funcionar. Persistimos aquí los tokens
        // frescos sobre la cuenta existente. Si aún no existe (primer login), el
        // UPDATE no afecta filas y el adapter la inserta después con estos mismos
        // valores. Solo se incluye refresh_token si Google lo devolvió (lo hace
        // con access_type=offline + prompt=consent).
        if (account.providerAccountId && process.env.DATABASE_URL) {
          try {
            const updates: Record<string, unknown> = {}
            if (account.access_token) updates.access_token = account.access_token
            if (account.refresh_token) updates.refresh_token = account.refresh_token
            if (typeof account.expires_at === 'number') updates.expires_at = account.expires_at
            if (account.scope) updates.scope = account.scope
            if (account.token_type) updates.token_type = account.token_type
            if (account.id_token) updates.id_token = account.id_token

            if (Object.keys(updates).length > 0) {
              const { and } = await import('drizzle-orm')
              await db
                .update(accounts)
                .set(updates)
                .where(
                  and(
                    eq(accounts.provider, 'google'),
                    eq(accounts.providerAccountId, account.providerAccountId),
                  ),
                )
              logger.info('🔄 Google tokens refreshed in DB', {
                providerAccountId: account.providerAccountId,
                hasRefreshToken: !!account.refresh_token,
                scope: account.scope,
              })
            }
          } catch (error) {
            logger.error('❌ Failed to persist Google tokens', error, {
              providerAccountId: account.providerAccountId,
            })
          }
        }
      }

      return true
    },

    async jwt({ token, user, account }) {
      logger.info('🔑 JWT Callback', {
        hasUser: !!user,
        hasAccount: !!account,
        accountProvider: account?.provider,
        tokenId: token.id,
        userId: user?.id,
      })

      if (user) {
        token.id = user.id
        logger.info('✅ Token updated with user ID', { userId: user.id })
      }

      if (account?.provider !== 'credentials' && user?.id && process.env.DATABASE_URL) {
        try {
          logger.info('📊 Creating default organization', {
            userId: user.id,
            provider: account?.provider,
            userName: user.name,
          })

          const { eq } = await import('drizzle-orm')
          const { db, memberships, organizations } = await getDb()
          const existing = await db.query.memberships.findFirst({
            where: eq(memberships.userId, user.id),
          })

          if (!existing) {
            await createDefaultOrg(user.id, user.name ?? 'Mi Negocio', db, organizations, memberships)
            logger.info('✨ Default organization created successfully', { provider: account?.provider })
          } else {
            logger.info('ℹ️ Organization already exists', { userId: user.id, provider: account?.provider })
          }
        } catch (error) {
          logger.error('❌ Failed to create default organization', error, {
            provider: account?.provider,
            userId: user?.id,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
      return token
    },

    async session({ session, token }) {
      logger.info('📱 Session Callback', {
        userEmail: session.user.email,
        tokenHasId: !!token?.id,
        sessionUserHasId: !!session.user.id,
      })

      if (token?.id) {
        session.user.id = token.id as string
        logger.info('✅ Session ID set from token', { userId: token.id })
      } else {
        logger.warn('⚠️ Session token missing user ID', {
          tokenKeys: Object.keys(token || {}),
          token: JSON.stringify(token),
        })
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async createUser({ user }) {
      logger.info('👤 New User Created Event', {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        timestamp: new Date().toISOString(),
      })

      if (user.id && process.env.DATABASE_URL) {
        try {
          logger.info('📊 Creating default organization for new user', { userId: user.id })
          const { db, organizations, memberships } = await getDb()
          await createDefaultOrg(user.id, user.name ?? 'Mi Negocio', db, organizations, memberships)
          logger.info('✨ Default organization created for new user', { userId: user.id })
        } catch (error) {
          logger.error('❌ Failed to create organization for new user', error, {
            userId: user.id,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      } else {
        logger.warn('⚠️ Cannot create default org - no DB URL or user ID', {
          hasUserId: !!user.id,
          hasDbUrl: !!process.env.DATABASE_URL,
        })
      }
    },
  },
})

async function createDefaultOrg(
  userId: string,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any, organizations: any, memberships: any,
) {
  const { eq } = await import('drizzle-orm')
  const existing = await db.query.memberships.findFirst({ where: eq(memberships.userId, userId) })
  if (existing) return

  const [org] = await db
    .insert(organizations)
    .values({ ownerUserId: userId, name, type: 'merchant', status: 'active' })
    .returning({ id: organizations.id })

  if (org) {
    await db.insert(memberships).values({ userId, organizationId: org.id, role: 'owner' })
  }
}
