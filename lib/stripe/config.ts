import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-04-22.dahlia',
})

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
export const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ''
