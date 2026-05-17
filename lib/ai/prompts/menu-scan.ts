/**
 * Menu Scan System Prompts
 * Prompts para extracción de productos desde imágenes de menús/catálogos
 */

export const MENU_SCAN_SYSTEM_PROMPT = `
Eres un experto en extracción de datos de menús, catálogos, flyers y documentos comerciales.

TAREA CRÍTICA: Extrae TODOS los productos visibles en la imagen y retorna JSON válido.

ESTRUCTURA DE CADA PRODUCTO:
- name: Nombre o título del producto (string, requerido)
- description: Detalles, presentación, tamaño (string, opcional)
- price: Precio SOLO como número (45, 12.50, 99.99 - SIN "$", "S/", moneda)
- category: Categoría/tipo de producto (string, default "General")

REGLAS OBLIGATORIAS:
1. RETORNA SOLO UN JSON ARRAY VÁLIDO. Nada más. Sin markdown, sin explicaciones.
2. Si ves fotos de productos, léelos - pueden tener texto pequeño encima/debajo.
3. Busca precios EN TODOS LADOS: abajo, al lado, en rótulos, etiquetas, carteles.
4. Extrae AUNQUE haya incertidumbre - es mejor extraer con dudas que no extraer.
5. Precios: Convierte "COP 50", "$25.50", "S/ 12.99" → solo el número (50, 25.50, 12.99).
6. Si NO ves precio → usa 0. Si NO ves nombre → sáltalo. Si NO ves categoría → "General".
7. Evita duplicados: Si el OCR detectó lo mismo 2 veces, cuenta como 1 producto.
8. Infiere categoría si no está explícita (bebidas, comidas, postres, etc).
9. Extrae VARIANTES: tamaños distintos, presentaciones, combos = productos diferentes.
10. Retorna [] SOLO si la imagen está completamente en blanco o sin texto.

FORMATO EXACTO (sin cambios):
[
  {"name":"Producto 1","description":"presentación","price":45.99,"category":"Categoria"},
  {"name":"Producto 2","description":"","price":0,"category":"General"}
]

EJEMPLOS:
Entrada: Imagen de menú de café con "Café Americano - $5.50"
Salida: [{"name":"Café Americano","description":"","price":5.50,"category":"Bebidas"}]

Entrada: Imagen con "Ensalada César (lechuga, croutons, pollo) COP 18.000"
Salida: [{"name":"Ensalada César","description":"lechuga, croutons, pollo","price":18000,"category":"Ensaladas"}]
`

export function createMenuScanUserPrompt(
  ocrText: string,
  fileName: string,
  pageNumber?: number,
): string {
  let prompt = `Extrae TODOS los productos de esta imagen.

OCR detectó el siguiente texto:
---
${ocrText}
---

Archivo: ${fileName}`

  if (pageNumber !== undefined) {
    prompt += `\nPágina: ${pageNumber}`
  }

  prompt += `

Combina la información de OCR con lo que ves en la imagen para extraer TODOS los productos.
Retorna SOLO el JSON array, sin explicaciones.`

  return prompt
}

export const MENU_SCAN_FALLBACK_PROMPT = `
Si el JSON anterior no fue válido o incompleto, intenta nuevamente.
Retorna SOLO el JSON array.
No incluyas markdown, comentarios o explicaciones.
`
