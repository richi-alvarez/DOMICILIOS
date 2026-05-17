/**
 * Validators Module Index
 * Exporta toda la funcionalidad de validación
 */

export {
  ProductSchema,
  ProductsSchema,
  validateAndNormalizeProducts,
  parsePrice,
  normalizeCategory,
} from './product.schema'

export type { Product, Products } from './product.schema'
