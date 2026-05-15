import 'server-only'

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { users } from '@/db'

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
      allowDangerousEmailAccountLinking: true,
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
      console.log('\n[SIGNIN CALLBACK] === INICIO ===')
      console.log('[SIGNIN CALLBACK] User:', {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        image: user?.image,
      })
      console.log('[SIGNIN CALLBACK] Account:', {
        provider: account?.provider,
        type: account?.type,
        providerAccountId: account?.providerAccountId,
      })
      console.log('[SIGNIN CALLBACK] Profile (Google):', {
        id: profile?.id,
        email: profile?.email,
        name: profile?.name,
      })
      console.log('[SIGNIN CALLBACK] === FIN === (permitiendo login)\n')
      return true
    },

    async jwt({ token, user, account }) {
      console.log('\n[JWT CALLBACK] === INICIO ===')
      console.log('[JWT CALLBACK] Entrada:', { userId: user?.id, provider: account?.provider })
      if (user) {
        token.id = user.id
        console.log('[JWT] Token actualizado con user.id:', user.id)
      }
      if (account?.provider !== 'credentials' && user?.id && process.env.DATABASE_URL) {
        try {
          console.log('[JWT] Creando organización para nuevo usuario OAuth:', user.id)
          const { eq } = await import('drizzle-orm')
          const { db, memberships, organizations } = await getDb()
          const existing = await db.query.memberships.findFirst({
            where: eq(memberships.userId, user.id),
          })
          if (!existing) {
            await createDefaultOrg(user.id, user.name ?? 'Mi Negocio', db, organizations, memberships)
            console.log('[JWT] Organización creada exitosamente')
          }
        } catch (error) {
          console.log('[JWT] Error creando organización:', error)
        }
      }
      console.log('[JWT CALLBACK] Token final:', {
        id: token?.id,
        email: token?.email,
        hasId: !!token?.id,
      })
      console.log('[JWT CALLBACK] === FIN ===\n')
      return token
    },

    async session({ session, token }) {
      console.log('\n[SESSION CALLBACK] === INICIO ===')
      console.log('[SESSION CALLBACK] Session user antes:', {
        email: session.user?.email,
        id: (session.user as any)?.id,
      })
      console.log('[SESSION CALLBACK] Token:', {
        id: token?.id,
        email: token?.email,
        sub: token?.sub,
      })
      if (token?.id) {
        session.user.id = token.id as string
        console.log('[SESSION CALLBACK] Session actualizado con usuario ID:', token.id)
      } else {
        console.log('[SESSION CALLBACK] ⚠️  Token no tiene ID!')
      }
      console.log('[SESSION CALLBACK] Session user después:', {
        email: session.user?.email,
        id: (session.user as any)?.id,
      })
      console.log('[SESSION CALLBACK] === FIN ===\n')
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async createUser({ user }) {
      console.log('[EVENT] Nuevo usuario creado:', user.id, user.email)
      if (user.id && process.env.DATABASE_URL) {
        try {
          console.log('[EVENT] Creando organización por defecto para:', user.email)
          const { db, organizations, memberships } = await getDb()
          await createDefaultOrg(user.id, user.name ?? 'Mi Negocio', db, organizations, memberships)
          console.log('[EVENT] Organización creada exitosamente')
        } catch (error) {
          console.log('[EVENT] Error creando organización:', error)
        }
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
