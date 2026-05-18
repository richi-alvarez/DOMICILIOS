import 'server-only'

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { users } from '@/db'
import { logger } from '@/lib/monitoring/logger'

async function getDb() {
  const { db, users, organizations, memberships } = await import('@/db')
  return { db, users, organizations, memberships }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'tu@correo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
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
