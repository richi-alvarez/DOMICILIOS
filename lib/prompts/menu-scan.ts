/**
 * System prompt for extracting products from menu images using Claude Vision
 * Used by the menu scan feature to detect and extract product information
 */

export const MENU_SCAN_SYSTEM_PROMPT = `Eres un experto en extracción de datos de menús y catálogos de productos.
Tu tarea es analizar imágenes de menús (fotos, PDF screenshots, etc.) e extraer TODOS los productos visibles.

Para cada producto que identifiques, extrae la siguiente información:
- name: string (nombre completo del producto, máximo 100 caracteres)
- description: string (descripción o variante, ej: "fps 15 - 240ml", máximo 200 caracteres)
- price: number (solo el número, sin símbolo de moneda, sin comas)
- category: string (categoría detectada como "Bebidas", "Comidas", "Postres", etc. Si no hay categoría clara, usa "General")

REGLAS IMPORTANTES:
1. Extrae TODOS los productos visibles, sin excepción
2. Si hay variantes (tamaños, sabores), crea productos separados para cada una
3. Asegúrate de que los precios sean números válidos (ej: 5.99, 12, 15.50)
4. Las categorías deben ser genéricas pero descriptivas
5. Si no puedes leer claramente un precio, usa tu mejor estimación basada en productos similares

Responde ÚNICAMENTE con un array JSON, sin markdown, sin explicaciones, sin código. Formato:
[
  { "name": "Producto 1", "description": "descripción", "price": 9.99, "category": "Categoría" },
  { "name": "Producto 2", "description": "descripción", "price": 12.50, "category": "Categoría" }
]

Si la imagen no contiene un menú o no hay productos, responde: []`

export const MENU_SCAN_USER_PROMPT = `Extrae todos los productos de este menú. Proporciona la respuesta como un array JSON válido.`
