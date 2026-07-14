'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
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
        signIn('google', { callbackUrl: '/app' })
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

function FacebookButton() {
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
        signIn('facebook', { callbackUrl: '/app' })
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.97.93-1.97 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"
            fill="#1877F2"
          />
        </svg>
      )}
      {t('auth.facebook')}
    </Button>
  )
}

export function LoginForm() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/app'
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Mostrar error de URL (ej. OAuth fallido)
  const urlError = searchParams.get('error')
  const urlErrorMsg =
    urlError === 'OAuthAccountNotLinked'
      ? t('auth.errors.oauthNotLinked')
      : urlError
        ? t('auth.errors.generic')
        : null

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  const onSubmit = handleSubmit((data) => {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        setServerError(t('auth.errors.invalidCredentials'))
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    })
  })

  const displayError = serverError ?? urlErrorMsg

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <GoogleButton />
      <FacebookButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-warm-200" />
        <span className="text-xs text-warm-400">{t('auth.orEmail')}</span>
        <div className="h-px flex-1 bg-warm-200" />
      </div>

      {displayError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Link href="/password-forgot" className="text-xs text-primary-500 hover:underline">
            {t('auth.login.forgot')}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.login.passwordPlaceholder')}
            autoComplete="current-password"
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

      <Button type="submit" className="w-full" disabled={!isValid || isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('auth.login.submit')}
      </Button>

      <p className="text-center text-sm text-warm-500">
        {t('auth.login.noAccount')}{' '}
        <Link href="/signup" className="font-medium text-primary-500 hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </form>
  )
}
