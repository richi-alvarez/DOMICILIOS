/**
 * Advanced Deduplication & Multi-language Detection
 * Deduplicación fuzzy y detección automática de idioma
 */

import type { Product } from '@/lib/validators'

/**
 * Calcula similitud Levenshtein entre dos strings
 * Retorna 0-1 (1 = idéntico)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1

  const len1 = s1.length
  const len2 = s2.length

  const matrix: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0))

  for (let i = 0; i <= len1; i++) matrix[0][i] = i
  for (let j = 0; j <= len2; j++) matrix[j][0] = j

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      )
    }
  }

  const distance = matrix[len2][len1]
  const maxLen = Math.max(len1, len2)
  return 1 - distance / maxLen
}

/**
 * Calcula similitud entre dos productos (fuzzy matching)
 * Considera nombre, descripción, precio
 */
export function productSimilarity(
  p1: Product,
  p2: Product,
  threshold: number = 0.7,
): number {
  // Nombre: peso 0.5
  const nameSimilarity = levenshteinSimilarity(p1.name, p2.name)

  // Precio: peso 0.3 (si están a ±10%, son iguales)
  let priceSimilarity = 1
  if (p1.price > 0 && p2.price > 0) {
    const priceDiff = Math.abs(p1.price - p2.price)
    const priceAvg = (p1.price + p2.price) / 2
    const priceVariance = priceDiff / priceAvg

    if (priceVariance > 0.1) {
      priceSimilarity = Math.max(0, 1 - priceVariance)
    }
  }

  // Descripción: peso 0.2
  let descSimilarity = 1
  if (p1.description && p2.description) {
    descSimilarity = levenshteinSimilarity(p1.description, p2.description)
  }

  const weighted =
    nameSimilarity * 0.5 + priceSimilarity * 0.3 + descSimilarity * 0.2

  return weighted
}

/**
 * Deduplicación avanzada (fuzzy matching)
 * Elimina productos similares con threshold configurable
 */
export function deduplicateAdvanced(
  products: Product[],
  threshold: number = 0.85,
): {
  deduplicated: Product[]
  removed: Array<{ original: Product; duplicate: Product; similarity: number }>
} {
  const deduplicated: Product[] = []
  const removed: Array<{ original: Product; duplicate: Product; similarity: number }> = []

  for (const product of products) {
    let found = false

    for (let i = 0; i < deduplicated.length; i++) {
      const similarity = productSimilarity(product, deduplicated[i], threshold)

      if (similarity > threshold) {
        // Es duplicado - mantiene el que tiene precio más específico
        if (product.price > 0 && (!deduplicated[i].price || product.price < deduplicated[i].price)) {
          removed.push({
            original: deduplicated[i],
            duplicate: product,
            similarity,
          })
          deduplicated[i] = product
        } else {
          removed.push({
            original: deduplicated[i],
            duplicate: product,
            similarity,
          })
        }
        found = true
        break
      }
    }

    if (!found) {
      deduplicated.push(product)
    }
  }

  return { deduplicated, removed }
}

/**
 * Detecta idioma de texto
 * Simple: cuenta idiomas comunes español/inglés
 */
export function detectLanguage(text: string): 'spa' | 'eng' | 'por' | 'fra' {
  const lower = text.toLowerCase()

  // Palabras comunes en español
  const spanishWords = [
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'por',
    'con', 'no', 'una', 'su', 'para', 'al', 'producto', 'precio',
    'postre', 'bebida', 'comida', 'plato', 'ensalada', 'sopa',
  ]

  // Palabras comunes en inglés
  const englishWords = [
    'the', 'and', 'of', 'to', 'in', 'is', 'a', 'for', 'that', 'it',
    'with', 'be', 'at', 'this', 'but', 'product', 'price', 'dessert',
    'drink', 'food', 'dish', 'salad', 'soup', 'menu',
  ]

  let spanishCount = 0
  let englishCount = 0

  for (const word of spanishWords) {
    if (lower.includes(word)) spanishCount++
  }

  for (const word of englishWords) {
    if (lower.includes(word)) englishCount++
  }

  if (englishCount > spanishCount) {
    return 'eng'
  }

  return 'spa'
}

/**
 * Configuración de idiomas por región
 */
export function getLanguageByRegion(region: string): string {
  const languageMap: Record<string, string> = {
    'es-ES': 'spa',
    'es-MX': 'spa',
    'es-AR': 'spa',
    'es-CO': 'spa',
    'en-US': 'eng',
    'en-GB': 'eng',
    'pt-BR': 'por',
    'pt-PT': 'por',
    'fr-FR': 'fra',
  }

  return languageMap[region] || 'spa'
}

/**
 * Normaliza productos para comparación
 * Elimina acentos, espacios extra, etc
 */
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone acentos
    .replace(/[̀-ͯ]/g, '') // Elimina acentos
    .replace(/\s+/g, ' ') // Normaliza espacios
    .trim()
}

/**
 * Agrupa productos por categoría para deduplicación más precisa
 */
export function groupProductsByCategory(products: Product[]): Record<string, Product[]> {
  const grouped: Record<string, Product[]> = {}

  for (const product of products) {
    const category = product.category || 'General'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(product)
  }

  return grouped
}

/**
 * Deduplicación por categoría
 * Más preciso: solo deduplica dentro de misma categoría
 */
export function deduplicateByCategoryAdvanced(
  products: Product[],
  threshold: number = 0.85,
): Product[] {
  const grouped = groupProductsByCategory(products)
  const result: Product[] = []

  for (const category in grouped) {
    const categoryProducts = grouped[category]
    const { deduplicated } = deduplicateAdvanced(categoryProducts, threshold)
    result.push(...deduplicated)
  }

  return result
}
