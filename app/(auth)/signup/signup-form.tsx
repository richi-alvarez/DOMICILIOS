'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
import { signUpWithCredentials } from '@/lib/actions/auth'
import { signIn } from 'next-auth/react'
import { useI18n } from '@/lib/i18n/context'

function GoogleButton() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={() => {
        setLoading(true)
        signIn('google', { callbackUrl: '/app/onboarding' })
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      {t('auth.google')}
    </Button>
  )
}

export function SignUpForm() {
  const { t } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { terms: true },
    mode: 'onChange',
  })

  const onSubmit = handleSubmit((data) => {
    setServerError(null)
    const fd = new FormData()
    fd.append('name', data.name)
    fd.append('email', data.email)
    fd.append('password', data.password)
    fd.append('terms', data.terms ? 'on' : 'off')

    startTransition(async () => {
      const result = await signUpWithCredentials(fd)
      if (!result.success) {
        setServerError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/app/onboarding'), 1500)
      }
    })
  })

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
          <CheckCircle2 className="h-7 w-7 text-lime-600" />
        </div>
        <h3 className="text-lg font-bold text-night-800">{t('auth.signup.successTitle')}</h3>
        <p className="text-sm text-warm-500">{t('auth.signup.successDesc')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <GoogleButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-warm-200" />
        <span className="text-xs text-warm-400">{t('auth.orEmail')}</span>
        <div className="h-px flex-1 bg-warm-200" />
      </div>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="name">{t('auth.name')}</Label>
        <Input
          id="name"
          type="text"
          placeholder={t('auth.namePlaceholder')}
          autoComplete="name"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          autoComplete="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.signup.passwordPlaceholder')}
            autoComplete="new-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            className="pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-night-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2.5 text-xs text-warm-500">
        <input
          type="checkbox"
          {...register('terms')}
          className="mt-0.5 h-4 w-4 accent-primary-500"
        />
        <span>
          {t('auth.signup.termsPrefix')}{' '}
          <Link href="/terms" className="text-primary-500 hover:underline">{t('auth.signup.termsLink')}</Link>
          {' '}{t('auth.signup.termsAnd')}{' '}
          <Link href="/privacy" className="text-primary-500 hover:underline">{t('auth.signup.privacyLink')}</Link>
        </span>
      </label>
      {errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}

      <Button type="submit" className="w-full" disabled={!isValid || isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('auth.signup.submit')}
      </Button>

      <p className="text-center text-sm text-warm-500">
        {t('auth.signup.haveAccount')}{' '}
        <Link href="/login" className="font-medium text-primary-500 hover:underline">
          {t('auth.signup.login')}
        </Link>
      </p>
    </form>
  )
}
