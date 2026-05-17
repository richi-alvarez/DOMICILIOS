/**
 * Product Validation Schemas
 * Zod schemas para validar y normalizar datos de productos
 */

import { z } from 'zod'

/**
 * Schema para un producto individual
 */
export const ProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name is too long')
    .transform((val) => val.trim()),

  description: z
    .string()
    .optional()
    .default('')
    .transform((val) => val?.trim() || ''),

  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(999999, 'Price is too high')
    .default(0),

  category: z
    .string()
    .max(100)
    .default('General')
    .transform((val) => val.trim() || 'General'),

  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional(),
})

export type Product = z.infer<typeof ProductSchema>

/**
 * Schema para array de productos
 */
export const ProductsSchema = z.array(ProductSchema)

export type Products = z.infer<typeof ProductsSchema>

/**
 * Valida y normaliza un JSON crudo de productos
 * Intenta auto-reparación de errores comunes
 */
export function validateAndNormalizeProducts(raw: unknown): Product[] {
  try {
    return ProductsSchema.parse(raw)
  } catch (error) {
    // Intenta auto-reparación si es un array
    if (Array.isArray(raw)) {
      const repaired = raw
        .map((item) => {
          if (typeof item !== 'object' || !item) return null

          const repaired = {
            name: String(item.name || item.title || 'Producto')
              .trim()
              .substring(0, 200),
            description: String(item.description || item.details || '')
              .trim()
              .substring(0, 500),
            price: parsePrice(item.price),
            category: String(item.category || item.type || 'General')
              .trim()
              .substring(0, 100),
          }

          // Valida mínimo: debe tener nombre
          if (!repaired.name || repaired.name === 'Producto') {
            return null
          }

          return repaired
        })
        .filter(Boolean) as unknown[]

      try {
        return ProductsSchema.parse(repaired)
      } catch {
        // Si falla reparación, retorna array vacío
        return []
      }
    }

    // Si no es array, retorna vacío
    return []
  }
}

/**
 * Parsea precio desde diferentes formatos
 */
export function parsePrice(value: unknown): number {
  // Ya es número
  if (typeof value === 'number') {
    return Math.max(0, value)
  }

  // Es string - busca números
  if (typeof value === 'string') {
    // Elimina símbolos de moneda comunes
    const cleaned = value
      .replace(/[$€£¥₽₹₩₪₦₨₱₲₴₵₶₷₸₹₺₻₼₽]/g, '')
      .replace(/COP|USD|EUR|MXN|PEN|ARS|CLP|COL|S\/|./g, '')
      .trim()

    // Busca números (incluyendo decimales)
    const match = cleaned.match(/\d+[.,]?\d*/)
    if (match) {
      // Convierte coma por punto si es necesario
      const numStr = match[0].replace(',', '.')
      const num = parseFloat(numStr)
      return isNaN(num) ? 0 : Math.max(0, num)
    }

    return 0
  }

  return 0
}

/**
 * Normaliza nombre de categoría
 */
export function normalizeCategory(raw: string): string {
  const categoryMap: Record<string, string> = {
    // Bebidas
    bebida: 'Bebidas',
    bebidas: 'Bebidas',
    drink: 'Bebidas',
    drinks: 'Bebidas',
    coffee: 'Bebidas',
    café: 'Bebidas',
    jugo: 'Bebidas',
    zumo: 'Bebidas',

    // Comidas principales
    comida: 'Comidas',
    platillo: 'Platillos',
    plate: 'Platillos',
    main: 'Platillos',
    entrée: 'Platillos',

    // Ensaladas
    ensalada: 'Ensaladas',
    salad: 'Ensaladas',

    // Postres
    postre: 'Postres',
    dessert: 'Postres',
    sweet: 'Postres',
    candy: 'Postres',

    // Acompañamientos
    lado: 'Acompañamientos',
    side: 'Acompañamientos',
    acompañamiento: 'Acompañamientos',

    // Sándwiches
    sandwich: 'Sándwiches',
    sándwich: 'Sándwiches',
    burger: 'Sándwiches',
    hamburgesa: 'Sándwiches',

    // Pizzas
    pizza: 'Pizzas',
    pie: 'Pizzas',

    // Sopas
    sopa: 'Sopas',
    soup: 'Sopas',
    caldo: 'Sopas',
  }

  const lower = raw.toLowerCase().trim()

  for (const [key, normalized] of Object.entries(categoryMap)) {
    if (lower.includes(key)) {
      return normalized
    }
  }

  // Retorna el original si no encontró match
  return raw.trim() || 'General'
}
