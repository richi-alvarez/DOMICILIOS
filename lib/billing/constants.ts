export type PlanCode = 'free' | 'basic' | 'pro' | 'business'

export interface PlanLimits {
  catalogs: number
  products: number
  ordersPerMonth: number
  collaborators: number
  customDomain: boolean
  analytics: boolean
  aiFeatures: boolean
}

export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  free: {
    catalogs: 1,
    products: 30,
    ordersPerMonth: 30,
    collaborators: 1,
    customDomain: false,
    analytics: false,
    aiFeatures: false,
  },
  basic: {
    catalogs: 1,
    products: 100,
    ordersPerMonth: 300,
    collaborators: 2,
    customDomain: false,
    analytics: false,
    aiFeatures: false,
  },
  pro: {
    catalogs: 5,
    products: -1,
    ordersPerMonth: -1,
    collaborators: 5,
    customDomain: true,
    analytics: true,
    aiFeatures: false,
  },
  business: {
    catalogs: -1,
    products: -1,
    ordersPerMonth: -1,
    collaborators: 20,
    customDomain: true,
    analytics: true,
    aiFeatures: true,
  },
}

export const PLAN_NAMES: Record<PlanCode, string> = {
  free: 'Gratis',
  basic: 'Basic',
  pro: 'Pro',
  business: 'Business',
}

export const PLAN_COLORS: Record<PlanCode, string> = {
  free: 'bg-warm-200 text-warm-700',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-primary-100 text-primary-700',
  business: 'bg-lime-100 text-lime-700',
}

export function formatLimit(value: number): string {
  return value === -1 ? '∞' : String(value)
}

export function isAtLimit(used: number, limit: number): boolean {
  return limit !== -1 && used >= limit
}

export function usagePercent(used: number, limit: number): number {
  if (limit === -1) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}
