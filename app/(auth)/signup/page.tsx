import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SignUpForm } from './signup-form'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Crea tu cuenta gratis</CardTitle>
        <CardDescription>Sin tarjeta de crédito · Tu catálogo en minutos</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  )
}
