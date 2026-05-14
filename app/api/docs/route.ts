import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const docs = {
    version: '1.0',
    baseUrl: 'https://domicilios.app/api/v1',
    endpoints: {
      catalogs: {
        'GET /catalogs/:slug': {
          description: 'Obtener información del catálogo',
          parameters: {
            slug: 'Slug único del catálogo',
          },
          response: {
            id: 'UUID',
            slug: 'string',
            name: 'string',
            description: 'string',
            currency: 'string (COP, USD, etc)',
            categories: [
              {
                id: 'UUID',
                name: 'string',
                slug: 'string',
              },
            ],
            products: [
              {
                id: 'UUID',
                name: 'string',
                price: 'integer (cents)',
                stock: 'integer',
              },
            ],
          },
          example: 'GET /catalogs/mitienda',
        },
        'GET /catalogs/:slug/products': {
          description: 'Listar productos del catálogo',
          parameters: {
            slug: 'Slug del catálogo',
            page: 'integer (default: 1)',
            limit: 'integer (default: 20, max: 100)',
          },
          response: {
            data: [
              {
                id: 'UUID',
                name: 'string',
                price: 'integer',
                stock: 'integer',
                variants: 'array',
              },
            ],
            pagination: {
              page: 'integer',
              limit: 'integer',
              total: 'integer',
            },
          },
          example: 'GET /catalogs/mitienda/products?page=1&limit=20',
        },
      },
      orders: {
        'POST /orders': {
          description: 'Crear una orden',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            catalogSlug: 'string (required)',
            customerName: 'string (required)',
            customerEmail: 'string (required)',
            customerPhone: 'string (required)',
            items: [
              {
                productId: 'UUID',
                quantity: 'integer',
                variantLabel: 'string (optional)',
              },
            ],
            deliveryType: "string ('pickup', 'delivery')",
            deliveryAddress: 'object (required for delivery type)',
          },
          response: {
            id: 'UUID',
            code: 'string (pedido-XXXXX)',
            status: 'string',
            createdAt: 'ISO 8601 date',
          },
          example: {
            method: 'POST',
            url: '/orders',
            body: {
              catalogSlug: 'mitienda',
              customerName: 'Juan Pérez',
              customerEmail: 'juan@example.com',
              customerPhone: '+57 300 123 4567',
              items: [
                {
                  productId: 'uuid-xxx',
                  quantity: 2,
                },
              ],
              deliveryType: 'pickup',
            },
          },
        },
      },
      webhooks: {
        description:
          'Los webhooks se configuran en el dashboard. Eventos disponibles: order.created, order.updated, order.delivered',
        'order.created': {
          event: 'order.created',
          payload: {
            id: 'UUID',
            code: 'string',
            catalogId: 'UUID',
            customer: {
              name: 'string',
              email: 'string',
              phone: 'string',
            },
            items: 'array',
            totals: 'object',
            createdAt: 'ISO 8601 date',
          },
        },
      },
    },
    authentication: {
      description: 'API pública - sin autenticación requerida',
      note: 'Los webhooks usan HMAC-SHA256 para verificación de firma',
    },
    examples: {
      curl_get_catalog: `curl https://domicilios.app/api/v1/catalogs/mitienda`,
      curl_create_order: `curl -X POST https://domicilios.app/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -d '{
    "catalogSlug": "mitienda",
    "customerName": "Juan",
    "customerEmail": "juan@example.com",
    "customerPhone": "+57 300 123 4567",
    "items": [{"productId": "uuid", "quantity": 1}],
    "deliveryType": "pickup"
  }'`,
    },
    rateLimits: {
      description: 'Sin límite de rate limit actualmente',
      note: 'Se puede implementar en producción si es necesario',
    },
  }

  return NextResponse.json(docs)
}
