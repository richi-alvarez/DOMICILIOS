import { z } from 'zod'

// Catalog validation
export const CreateCatalogSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
  slug: z.string()
    .min(1, 'Slug required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description too long').optional().default(''),
  language: z.enum(['es', 'en']).default('es'),
  currency: z.enum(['USD', 'COP', 'MXN']).default('COP'),
})

export const UpdateCatalogSchema = CreateCatalogSchema.partial()

// Product validation
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional().default(''),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category required').max(100, 'Category too long'),
  sku: z.string().max(50, 'SKU too long').optional(),
  image: z.string().url('Invalid image URL').optional(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

// Order validation
export const CreateOrderSchema = z.object({
  catalogSlug: z.string().min(1, 'Catalog required'),
  customerName: z.string().min(1, 'Name required').max(100, 'Name too long'),
  customerEmail: z.string().email('Invalid email'),
  customerPhone: z.string().max(20, 'Phone too long'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID required'),
      quantity: z.number().int().positive('Quantity must be positive'),
    }),
    { message: 'Items must be an array' }
  ).min(1, 'At least one item required'),
  deliveryType: z.enum(['pickup', 'delivery']).default('pickup'),
  deliveryAddress: z.string().optional(),
})

// AI Generation validation
export const GenerateAICatalogSchema = z.object({
  businessName: z.string().min(1, 'Business name required').max(200, 'Name too long'),
  businessType: z.string().min(1, 'Business type required').max(100, 'Type too long'),
  description: z.string().min(10, 'Description too short').max(1000, 'Description too long'),
  language: z.enum(['es', 'en']).default('es'),
})

// Menu scan validation
export const MenuScanSchema = z.object({
  catalogId: z.string().min(1, 'Catalog ID required'),
  imageUrl: z.string().url('Invalid image URL'),
  imageBase64: z.string().optional(),
})

// User sign up validation
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
})

// User login validation
export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export type CreateCatalogInput = z.infer<typeof CreateCatalogSchema>
export type UpdateCatalogInput = z.infer<typeof UpdateCatalogSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type GenerateAICatalogInput = z.infer<typeof GenerateAICatalogSchema>
export type MenuScanInput = z.infer<typeof MenuScanSchema>
export type SignUpInput = z.infer<typeof SignUpSchema>
export type LoginInput = z.infer<typeof LoginSchema>
