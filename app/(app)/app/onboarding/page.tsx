export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './onboarding-wizard'

export const metadata: Metadata = { title: 'Configura tu tienda' }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-50 px-4 py-12">
      <OnboardingWizard userName={session.user?.name ?? ''} />
    </div>
  )
}
