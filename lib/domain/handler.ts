'use server'

import { db } from '@/db'
import { catalogs } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_DOMAIN = 'domicilios.app'
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'blog', 's', 'auth', 'status', 'docs']

export async function getCatalogByDomain(hostname: string): Promise<{ slug: string; id: string } | null> {
  if (!hostname) return null

  // Si es subdominio personalizado (ej: miagenicia.domicilios.app)
  const parts = hostname.split('.')
  if (hostname.endsWith(`.${DEFAULT_DOMAIN}`)) {
    const subdomain = parts[0]

    // Evitar subdominos reservados
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return null
    }

    // Buscar catálogo por slug (el slug es el subdominio)
    const catalog = await db
      .select({ slug: catalogs.slug, id: catalogs.id })
      .from(catalogs)
      .where(eq(catalogs.slug, subdomain))
      .limit(1)

    return catalog.length > 0 ? catalog[0] : null
  }

  // Si es un dominio personalizado completo (ej: mitienda.com)
  const catalog = await db
    .select({ slug: catalogs.slug, id: catalogs.id })
    .from(catalogs)
    .where(eq(catalogs.domain, hostname))
    .limit(1)

  return catalog.length > 0 ? catalog[0] : null
}

export async function isValidCustomDomain(domain: string): Promise<boolean> {
  // Validar formato de dominio
  const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
  if (!domainRegex.test(domain)) return false

  // No permitir dominios reservados
  if (domain.includes(DEFAULT_DOMAIN)) return false

  // No permitir localhost
  if (domain.includes('localhost')) return false

  return true
}

export async function getDNSRecordForDomain(domain: string): Promise<{ type: string; name: string; value: string }> {
  return {
    type: 'CNAME',
    name: domain,
    value: `${DEFAULT_DOMAIN}.`,
  }
}
