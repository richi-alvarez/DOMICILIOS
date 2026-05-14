'use server'

import { eq, and, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { auth } from '@/auth'
import { db, memberships, invites, users, organizations } from '@/db'
import { getOrgPlan, PLAN_LIMITS, isAtLimit } from '@/lib/billing/limits'
import { sendInviteEmail } from '@/lib/email'
import { z } from 'zod'

const ROLES = ['admin', 'editor', 'viewer'] as const
type InvitableRole = (typeof ROLES)[number]

async function getSessionOrgId() {
  const session = await auth()
  if (!session?.user?.id) return null
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id as string),
  })
  return membership ? { orgId: membership.organizationId, userId: session.user.id as string, role: membership.role } : null
}

export interface TeamMember {
  userId: string
  name: string | null
  email: string
  image: string | null
  role: string
  joinedAt: Date
  isOwner: boolean
}

export interface PendingInvite {
  id: string
  email: string
  role: string
  expiresAt: Date
  createdAt: Date
}

export async function getTeam(): Promise<{ members: TeamMember[]; invites: PendingInvite[]; orgName: string; planCode: string; collaboratorLimit: number; currentCount: number } | null> {
  const ctx = await getSessionOrgId()
  if (!ctx) return null

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, ctx.orgId) })
  if (!org) return null

  const memberRows = await db
    .select({
      userId: memberships.userId,
      role: memberships.role,
      createdAt: memberships.createdAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, ctx.orgId))

  const pendingRows = await db.query.invites.findMany({
    where: eq(invites.orgId, ctx.orgId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  const planCode = await getOrgPlan(ctx.orgId)
  const limit = PLAN_LIMITS[planCode as keyof typeof PLAN_LIMITS]?.collaborators ?? 1

  const members: TeamMember[] = memberRows.map((m) => ({
    userId: m.userId,
    name: m.name,
    email: m.email,
    image: m.image,
    role: m.role,
    joinedAt: m.createdAt,
    isOwner: org.ownerUserId === m.userId,
  }))

  const now = new Date()
  const pending: PendingInvite[] = pendingRows
    .filter((i) => i.expiresAt > now)
    .map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt, createdAt: i.createdAt }))

  return {
    members,
    invites: pending,
    orgName: org.name,
    planCode,
    collaboratorLimit: limit,
    currentCount: members.length,
  }
}

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(ROLES, { required_error: 'Rol inválido' }),
})

export async function inviteMember(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getSessionOrgId()
  if (!ctx) return { error: 'No autenticado' }
  if (!['owner', 'admin'].includes(ctx.role)) return { error: 'Sin permisos' }

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  const { email, role } = parsed.data

  // Plan limit check
  const planCode = await getOrgPlan(ctx.orgId)
  const limit = PLAN_LIMITS[planCode as keyof typeof PLAN_LIMITS]?.collaborators ?? 1
  const memberRows = await db.query.memberships.findMany({
    where: eq(memberships.organizationId, ctx.orgId),
    columns: { userId: true },
  })
  const memberCount = memberRows.length
  if (isAtLimit(memberCount, limit)) return { error: `Tu plan ${planCode} permite máximo ${limit} colaboradores` }

  // Already a member?
  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existingUser) {
    const alreadyMember = await db.query.memberships.findFirst({
      where: and(eq(memberships.userId, existingUser.id), eq(memberships.organizationId, ctx.orgId)),
    })
    if (alreadyMember) return { error: 'Este usuario ya es miembro del equipo' }
  }

  // Delete existing pending invite for same email
  const existing = await db.query.invites.findFirst({
    where: and(eq(invites.orgId, ctx.orgId), eq(invites.email, email)),
  })
  if (existing) await db.delete(invites).where(eq(invites.id, existing.id))

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, ctx.orgId) })

  await db.insert(invites).values({ orgId: ctx.orgId, email, role, token, expiresAt })

  try {
    await sendInviteEmail(email, token, org?.name ?? 'tu equipo', role)
  } catch {
    // fire-and-forget
  }

  revalidatePath('/app/team')
  return { success: true }
}

export async function cancelInvite(inviteId: string): Promise<{ error?: string }> {
  const ctx = await getSessionOrgId()
  if (!ctx) return { error: 'No autenticado' }
  if (!['owner', 'admin'].includes(ctx.role)) return { error: 'Sin permisos' }

  const invite = await db.query.invites.findFirst({ where: eq(invites.id, inviteId) })
  if (!invite || invite.orgId !== ctx.orgId) return { error: 'Invitación no encontrada' }

  await db.delete(invites).where(eq(invites.id, inviteId))
  revalidatePath('/app/team')
  return {}
}

export async function removeMember(targetUserId: string): Promise<{ error?: string }> {
  const ctx = await getSessionOrgId()
  if (!ctx) return { error: 'No autenticado' }
  if (!['owner', 'admin'].includes(ctx.role)) return { error: 'Sin permisos' }
  if (targetUserId === ctx.userId) return { error: 'No puedes eliminarte a ti mismo' }

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, ctx.orgId) })
  if (org?.ownerUserId === targetUserId) return { error: 'No puedes eliminar al propietario' }

  await db.delete(memberships).where(
    and(eq(memberships.userId, targetUserId), eq(memberships.organizationId, ctx.orgId)),
  )
  revalidatePath('/app/team')
  return {}
}

export async function changeMemberRole(targetUserId: string, newRole: string): Promise<{ error?: string }> {
  const ctx = await getSessionOrgId()
  if (!ctx) return { error: 'No autenticado' }
  if (!['owner'].includes(ctx.role)) return { error: 'Solo el propietario puede cambiar roles' }
  if (targetUserId === ctx.userId) return { error: 'No puedes cambiar tu propio rol' }

  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, ctx.orgId) })
  if (org?.ownerUserId === targetUserId) return { error: 'No puedes cambiar el rol del propietario' }

  if (!['admin', 'editor', 'viewer'].includes(newRole)) return { error: 'Rol inválido' }

  await db
    .update(memberships)
    .set({ role: newRole as any })
    .where(and(eq(memberships.userId, targetUserId), eq(memberships.organizationId, ctx.orgId)))

  revalidatePath('/app/team')
  return {}
}

export async function acceptInvite(token: string): Promise<{ error?: string; orgId?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Debes iniciar sesión para aceptar la invitación' }

  const invite = await db.query.invites.findFirst({ where: eq(invites.token, token) })
  if (!invite) return { error: 'Invitación inválida o expirada' }
  if (invite.expiresAt < new Date()) return { error: 'Esta invitación ha expirado' }

  // Check email matches
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id as string) })
  if (!user) return { error: 'Usuario no encontrado' }
  if (user.email.toLowerCase() !== invite.email.toLowerCase())
    return { error: 'Esta invitación es para otro correo' }

  // Already member?
  const already = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, user.id), eq(memberships.organizationId, invite.orgId)),
  })
  if (already) {
    await db.delete(invites).where(eq(invites.id, invite.id))
    return { orgId: invite.orgId }
  }

  await db.insert(memberships).values({
    userId: user.id,
    organizationId: invite.orgId,
    role: invite.role as any,
  })
  await db.delete(invites).where(eq(invites.id, invite.id))

  return { orgId: invite.orgId }
}
