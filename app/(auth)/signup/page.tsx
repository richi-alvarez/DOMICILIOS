import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getT } from '@/lib/i18n/server'
import { SignUpForm } from './signup-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('auth.signup.metaTitle') }
}

export default async function SignupPage() {
  const t = await getT()
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('auth.signup.title')}</CardTitle>
        <CardDescription>{t('auth.signup.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  )
}
