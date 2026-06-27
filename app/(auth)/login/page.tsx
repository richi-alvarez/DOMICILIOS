import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getT } from '@/lib/i18n/server'
import { LoginForm } from './login-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('auth.login.metaTitle') }
}

export default async function LoginPage() {
  const t = await getT()
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('auth.login.title')}</CardTitle>
        <CardDescription>{t('auth.login.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
