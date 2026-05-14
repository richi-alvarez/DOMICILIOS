'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useTransition, useState, Suspense } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { resetPassword } from '@/lib/actions/auth'

function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isPending, startTransition] = useTransition()
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-sm text-warm-500">Enlace inválido. Solicita uno nuevo desde la pantalla de recuperación.</p>
        <Link href="/password-forgot" className="text-sm font-medium text-primary-500 hover:underline">
          Solicitar enlace →
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
          <CheckCircle2 className="h-7 w-7 text-lime-600" />
        </div>
        <h3 className="font-bold text-night-800">¡Contraseña actualizada!</h3>
        <p className="text-sm text-warm-500">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <Button asChild className="mt-2">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = handleSubmit((data) => {
    setError(null)
    const fd = new FormData()
    fd.append('password', data.password)
    fd.append('confirmPassword', data.confirmPassword)
    startTransition(async () => {
      const result = await resetPassword(token, fd)
      if (result.success) {
        setDone(true)
      } else {
        setError(result.error)
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPwd ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            {...register('password')}
            className="pr-10"
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400">
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repite la contraseña"
            {...register('confirmPassword')}
            className="pr-10"
          />
          <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400">
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={!isValid || isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Actualizar contraseña
      </Button>
    </form>
  )
}

export default function PasswordResetPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
          <Lock className="h-6 w-6 text-primary-500" />
        </div>
        <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
        <CardDescription>Elige una contraseña segura para tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <ResetForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
