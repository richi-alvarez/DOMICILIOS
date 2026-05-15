'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { requestPasswordReset } from '@/lib/actions/auth'

export default function PasswordForgotPage() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const onSubmit = handleSubmit((data) => {
    setError(null)
    const fd = new FormData()
    fd.append('email', data.email)
    startTransition(async () => {
      const result = await requestPasswordReset(fd)
      if (result.success) {
        setDone(true)
      } else {
        setError(result.error)
      }
    })
  })

  if (done) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
            <CheckCircle2 className="h-7 w-7 text-lime-600" />
          </div>
          <h2 className="text-xl font-bold text-night-800">Revisa tu correo</h2>
          <p className="mt-2 text-sm text-warm-500">
            Si tu correo está registrado, recibirás las instrucciones en breve. Revisa también la carpeta de spam.
          </p>
          <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Volver a Iniciar Sesión
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
          <Mail className="h-6 w-6 text-primary-500" />
        </div>
        <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresa tu correo y te enviaremos las instrucciones para restablecer tu contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid || isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar instrucciones
          </Button>

          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-warm-500 hover:text-night-800">
            <ArrowLeft className="h-4 w-4" /> Volver a Iniciar Sesión
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}
