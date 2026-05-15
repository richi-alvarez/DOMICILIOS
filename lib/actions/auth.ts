'use server'

import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db, users, organizations, memberships, verificationTokens } from '@/db'
import { signUpSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth'
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export type ActionResult = { success: true; message?: string } | { success: false; error: string }

export async function signUpWithCredentials(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    terms: formData.get('terms') === 'on',
  }

  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return { success: false, error: first.message }
  }

  const { name, email, password } = parsed.data

  // Verificar si el email ya existe
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return { success: false, error: 'Ya existe una cuenta con este correo' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Crear usuario
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id })

  if (!user) return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' }

  // Crear organización + membership
  const [org] = await db
    .insert(organizations)
    .values({ ownerUserId: user.id, name: `Negocio de ${name}`, type: 'merchant', status: 'active' })
    .returning({ id: organizations.id })

  if (!org) {
    return { success: false, error: 'Error al crear la organización. Intenta de nuevo.' }
  }

  try {
    await db.insert(memberships).values({ userId: user.id, organizationId: org.id, role: 'owner' })
  } catch (err) {
    return { success: false, error: 'Error al configurar permisos. Intenta de nuevo.' }
  }

  // Generar token de verificación
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  })

  // Enviar emails (no bloquear si falla)
  try {
    await sendVerificationEmail(email, token)
    await sendWelcomeEmail(email, name)
  } catch {
    // Log silencioso — el usuario igual se registra
  }

  // Sign in automático
  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: 'Error al iniciar sesión automático. Inicia sesión manualmente.' }
    }
  }

  return { success: true, message: 'Cuenta creada. Revisa tu correo para verificarla.' }
}

export async function loginWithCredentials(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Completa todos los campos' }
  }

  try {
    await signIn('credentials', { email, password, redirect: false })
    return { success: true }
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Correo o contraseña incorrectos' }
        default:
          return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' }
      }
    }
    return { success: false, error: 'Error inesperado. Intenta de nuevo.' }
  }
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get('email') }
  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { email } = parsed.data
  const user = await db.query.users.findFirst({ where: eq(users.email, email) })

  // Siempre responder igual para no revelar si el email existe
  if (!user) {
    return { success: true, message: 'Si el correo existe, recibirás las instrucciones en breve.' }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1h

  // Reemplazar token anterior si existe
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `reset:${email}`))
  await db.insert(verificationTokens).values({
    identifier: `reset:${email}`,
    token,
    expires,
  })

  try {
    await sendPasswordResetEmail(email, token)
  } catch {
    return { success: false, error: 'Error al enviar el correo. Intenta de nuevo.' }
  }

  return { success: true, message: 'Si el correo existe, recibirás las instrucciones en breve.' }
}

export async function resetPassword(token: string, formData: FormData): Promise<ActionResult> {
  const raw = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // Buscar token
  const record = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, token),
  })

  if (!record) return { success: false, error: 'Enlace inválido o expirado' }
  if (record.expires < new Date()) return { success: false, error: 'El enlace ha expirado. Solicita uno nuevo.' }

  const email = record.identifier.replace('reset:', '')
  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.email, email))
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

  return { success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
}

export async function verifyEmail(token: string): Promise<ActionResult> {
  const record = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, token),
  })

  if (!record) return { success: false, error: 'Enlace inválido o ya utilizado' }
  if (record.expires < new Date()) return { success: false, error: 'El enlace ha expirado. Regístrate de nuevo.' }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, record.identifier))

  await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

  return { success: true, message: '¡Correo verificado! Ya puedes usar todas las funciones.' }
}
