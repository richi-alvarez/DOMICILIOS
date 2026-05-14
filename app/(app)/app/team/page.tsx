export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { getTeam } from '@/lib/actions/team'
import { TeamManager } from './team-manager'

export const metadata: Metadata = { title: 'Equipo' }

export default async function TeamPage() {
  let team = null
  let dbError = false

  try {
    team = await getTeam()
  } catch {
    dbError = true
  }

  if (dbError) {
    return (
      <div className="px-6 py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-night-900">Equipo</h1>
        <p className="text-sm text-night-400">Configura DATABASE_URL para gestionar el equipo.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-night-900">Equipo</h1>
        <p className="mt-1 text-sm text-night-400">Invita colaboradores y gestiona sus permisos en tu organización.</p>
      </div>
      <TeamManager team={team} />
    </div>
  )
}
