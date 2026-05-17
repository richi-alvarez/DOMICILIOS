import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Iniciar Sesión' }

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>Accede a tu panel de WaStore</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
