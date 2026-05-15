'use client'

import { useState, useTransition } from 'react'
import { Shield, User, Eye, Trash2, Mail, UserPlus, Clock, X, Crown } from 'lucide-react'
import { inviteMember, cancelInvite, removeMember, changeMemberRole } from '@/lib/actions/team'
import type { TeamMember, PendingInvite } from '@/lib/actions/team'
import { cn } from '@/lib/utils'

const ROLE_META: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Propietario', description: 'Acceso total', icon: Crown, color: 'bg-amber-100 text-amber-700' },
  admin: { label: 'Admin', description: 'Gestionar catálogos y equipo', icon: Shield, color: 'bg-primary-100 text-primary-700' },
  editor: { label: 'Editor', description: 'Editar productos y pedidos', icon: User, color: 'bg-blue-100 text-blue-700' },
  viewer: { label: 'Visualizador', description: 'Solo lectura', icon: Eye, color: 'bg-warm-200 text-warm-700' },
}

interface TeamManagerProps {
  team: {
    members: TeamMember[]
    invites: PendingInvite[]
    orgName: string
    planCode: string
    collaboratorLimit: number
    currentCount: number
  } | null
}

export function TeamManager({ team }: TeamManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor')

  if (!team) {
    return (
      <div className="rounded-2xl border border-warm-200 p-12 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-warm-300" />
        <p className="text-sm text-night-400">No se pudo cargar el equipo.</p>
      </div>
    )
  }

  const { members, invites, collaboratorLimit, currentCount, planCode } = team
  const atLimit = collaboratorLimit !== -1 && currentCount >= collaboratorLimit
  const canInvite = !atLimit

  function flash(msg: string, type: 'success' | 'error') {
    if (type === 'success') { setSuccess(msg); setError(null) }
    else { setError(msg); setSuccess(null) }
    setTimeout(() => { setSuccess(null); setError(null) }, 4000)
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('email', inviteEmail)
    fd.set('role', inviteRole)
    startTransition(async () => {
      const res = await inviteMember(fd)
      if (res.error) flash(res.error, 'error')
      else { flash('Invitación enviada', 'success'); setInviteEmail('') }
    })
  }

  function handleCancelInvite(id: string) {
    startTransition(async () => {
      const res = await cancelInvite(id)
      if (res.error) flash(res.error, 'error')
      else flash('Invitación cancelada', 'success')
    })
  }

  function handleRemove(userId: string, name: string | null) {
    if (!confirm(`¿Eliminar a ${name ?? 'este miembro'} del equipo?`)) return
    startTransition(async () => {
      const res = await removeMember(userId)
      if (res.error) flash(res.error, 'error')
      else flash('Miembro eliminado', 'success')
    })
  }

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      const res = await changeMemberRole(userId, newRole)
      if (res.error) flash(res.error, 'error')
      else flash('Rol actualizado', 'success')
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">
      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm text-red-700 animate-in slide-in-from-top-2">
          <X className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm text-lime-700 animate-in slide-in-from-top-2">
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Invite form */}
      <div className="rounded-2xl border border-warm-200 bg-white p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-night-800">Invitar colaborador</h2>
            <p className="mt-1 text-xs sm:text-sm text-night-400">
              {currentCount} / {collaboratorLimit === -1 ? '∞' : collaboratorLimit} colaboradores usados
              <span className="ml-2 rounded-full bg-warm-100 px-2 py-0.5 text-xs capitalize text-warm-600">{planCode}</span>
            </p>
          </div>
          <UserPlus className="hidden h-5 w-5 shrink-0 text-warm-400 sm:block" />
        </div>

        {atLimit ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs sm:p-4 sm:text-sm text-amber-700">
            Llegaste al límite de colaboradores. <a href="/app/billing" className="font-semibold underline">Actualiza tu plan</a> para agregar más.
          </div>
        ) : (
          <form onSubmit={handleInvite} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_minmax(140px,_1fr)_auto]">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-night-600">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@empresa.com"
                  className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm text-night-800 placeholder:text-warm-400 focus:border-primary-400 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-night-600">Rol</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2.5 text-sm text-night-800 focus:border-primary-400 focus:bg-white focus:outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>
              <div className="flex items-end sm:pt-0">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Enviar invitación</span>
                  <span className="sm:hidden">Invitar</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Active members */}
      <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden">
        <div className="border-b border-warm-100 px-4 sm:px-6 py-4">
          <h2 className="font-display text-lg font-bold text-night-800">Miembros activos</h2>
        </div>
        <ul className="divide-y divide-warm-100">
          {members.map((member) => {
            const roleMeta = ROLE_META[member.role] ?? ROLE_META['viewer']
            const RoleIcon = roleMeta.icon
            return (
              <li key={member.userId} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                    {member.image ? (
                      <img src={member.image} alt={member.name ?? ''} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      (member.name?.charAt(0) ?? member.email.charAt(0)).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-night-800">{member.name ?? member.email}</p>
                    <p className="truncate text-xs text-night-400">{member.email}</p>
                  </div>
                </div>

                {/* Role + Actions */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  {member.isOwner ? (
                    <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', ROLE_META['owner'].color)}>
                      <Crown className="h-3 w-3" />
                      <span className="hidden sm:inline">Propietario</span>
                      <span className="sm:hidden">Prop.</span>
                    </span>
                  ) : (
                    <>
                      <select
                        defaultValue={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        disabled={isPending}
                        className="rounded-lg border border-warm-200 bg-warm-50 px-2 py-1 text-xs font-semibold text-night-700 focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viz.</option>
                      </select>
                      <button
                        onClick={() => handleRemove(member.userId, member.name)}
                        disabled={isPending}
                        className="shrink-0 rounded-lg p-1.5 text-warm-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        title="Eliminar miembro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden">
          <div className="border-b border-warm-100 px-4 sm:px-6 py-4">
            <h2 className="font-display text-lg font-bold text-night-800">Invitaciones pendientes</h2>
          </div>
          <ul className="divide-y divide-warm-100">
            {invites.map((invite) => {
              const roleMeta = ROLE_META[invite.role] ?? ROLE_META['viewer']
              return (
                <li key={invite.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warm-100">
                      <Clock className="h-5 w-5 text-warm-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-night-700">{invite.email}</p>
                      <p className="text-xs text-night-400">
                        Expira {new Date(invite.expiresAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', roleMeta.color)}>
                      {roleMeta.label}
                    </span>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={isPending}
                      className="shrink-0 rounded-lg p-1.5 text-warm-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      title="Cancelar invitación"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Role legend */}
      <div className="rounded-2xl border border-warm-100 bg-warm-50 p-4 sm:p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-warm-500">Niveles de acceso</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(['admin', 'editor', 'viewer'] as const).map((role) => {
            const meta = ROLE_META[role]
            const Icon = meta.icon
            return (
              <div key={role} className="flex items-start gap-3 rounded-lg bg-white p-3 sm:p-4">
                <span className={cn('mt-0.5 shrink-0 rounded-full p-1', meta.color)}>
                  <Icon className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-night-700">{meta.label}</p>
                  <p className="text-xs text-night-400">{meta.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}
