import { auth } from '@/auth'
import { db } from '@/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('\n[DEBUG] === AUTH STATUS CHECK ===')

    // 1. Verificar sesión actual
    const session = await auth()
    console.log('[DEBUG] Session existe:', !!session)
    if (session) {
      console.log('[DEBUG] Session user:', {
        id: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
      })
    }

    // 2. Verificar usuarios en BD
    const users = await db.query.users.findMany()
    console.log(`[DEBUG] Total usuarios en BD: ${users.length}`)
    users.slice(0, 5).forEach((user: any) => {
      console.log('[DEBUG] Usuario:', {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.createdAt,
      })
    })

    // 3. Verificar OAuth accounts
    const accounts = await db.query.accounts.findMany()
    console.log(`[DEBUG] Total OAuth accounts: ${accounts.length}`)
    accounts.slice(0, 5).forEach((account: any) => {
      console.log('[DEBUG] Account:', {
        user_id: account.userId,
        provider: account.provider,
        type: account.type,
      })
    })

    // 4. Verificar sesiones JWT
    const sessions = await db.query.sessions.findMany()
    console.log(`[DEBUG] Total sesiones: ${sessions.length}`)

    // 5. Verificar organizaciones
    const orgs = await db.query.organizations.findMany()
    console.log(`[DEBUG] Total organizaciones: ${orgs.length}`)
    orgs.slice(0, 3).forEach((org: any) => {
      console.log('[DEBUG] Org:', {
        id: org.id,
        name: org.name,
        owner_id: org.ownerUserId,
      })
    })

    console.log('[DEBUG] === END DEBUG ===\n')

    return NextResponse.json({
      session,
      stats: {
        total_users: users.length,
        total_accounts: accounts.length,
        total_sessions: sessions.length,
        total_orgs: orgs.length,
      },
    })
  } catch (error) {
    console.error('[DEBUG ERROR]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
