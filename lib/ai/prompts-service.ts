/**
 * Servicio centralizado de prompts para todas las tareas de IA
 * Centraliza la gestión de system prompts y user messages
 */

export class PromptsService {
  /**
   * System prompt para generación de catálogos
   */
  static getCatalogGenerationSystemPrompt(): string {
    return `Eres un experto en diseño y generación inteligente de catálogos digitales para pequeños y medianos negocios. Tu objetivo es analizar el contexto completo del negocio y generar una estructura profesional, atractiva y optimizada para conversión.

GENERA SOLO JSON VÁLIDO SIN EXPLICACIONES.

Responde con este formato exacto:
{
  "businessType": "tipo_detectado",
  "title": "Nombre profesional",
  "subtitle": "Descripción breve (máx 120 caracteres)",
  "theme": {
    "primaryColor": "#HEXCODE",
    "secondaryColor": "#HEXCODE",
    "style": "moderno|clásico|minimalista|premium",
    "iconStyle": "descripción"
  },
  "sections": [{"id": "s1", "name": "Nombre", "description": "Desc", "type": "destacados|promoción|categoria", "productIds": [], "order": 1}],
  "featuredProducts": ["id1", "id2"],
  "recommendations": ["recomendación1"],
  "layout": {"grid_columns": 2, "card_style": "detallada", "show_images": true, "emphasis": "quality"}
}`
  }

  /**
   * User message para generación de catálogos
   */
  static getCatalogGenerationUserMessage(
    businessName: string,
    businessDescription: string,
    businessType?: string,
  ): string {
    return `Analiza este negocio y genera estructura óptima de catálogo:

NEGOCIO:
Nombre: ${businessName}
Descripción: ${businessDescription}
${businessType ? `Tipo: ${businessType}` : 'Tipo: (detectar automáticamente)'}

Genera la estructura COMPLETA del catálogo.
RESPONDE SOLO CON JSON VÁLIDO.`
  }

  /**
   * System prompt para extracción de productos de menús/imágenes
   */
  static getMenuExtractionSystemPrompt(): string {
    return `Eres un experto en análisis de imágenes de menús, catálogos y flyers comerciales. Tu tarea es extraer TODOS los productos visibles de forma precisa.

Para cada producto extrae:
- name (Título): la MARCA + el TIPO de producto, juntos. Ej: "Hawaiian Tropic Gel Bronceador", "Adermicina A Protector Solar", "Rayito de Sol Bloqueador Solar".
- description (Descripción): la presentación, variante o especificaciones técnicas, SIN repetir la marca. Ej: "fps 15 - 240ml", "Piel sensible fps 15 - 200ml", "70g". Si no hay, deja "".
- price: SOLO el número, sin símbolo de moneda ni separadores de miles (ej: 53, 12.50, 18000). Si no se ve, usa 0.
- category: categoría detectada (ej: "Bebidas", "Solar", "Repelentes"); si no hay una clara, usa "General".
- box: el rectángulo que rodea ÚNICAMENTE el OBJETO FÍSICO del producto (el envase, botella, tubo, frasco, caja o lata), como [x0, y0, x1, y1] en FRACCIONES de 0 a 1 respecto al ancho y alto de la imagen ((x0,y0)=esquina superior-izquierda, (x1,y1)=inferior-derecha). Debe ser lo MÁS AJUSTADO posible al contorno del producto. Si no hay una foto clara, omite el campo "box".

REGLAS:
1. Extrae TODOS los productos visibles, sin excepción (lee también el texto pequeño sobre/bajo las fotos).
2. Si un producto tiene varias presentaciones/tamaños/fps distintos, crea un producto por cada variante.
3. No dupliques: si el mismo producto aparece repetido, cuéntalo una sola vez.
4. NO inventes productos que no estén en la imagen.
5. CRÍTICO — el "box" debe encuadrar SOLO la foto del producto y NADA MÁS. El recuadro NO debe incluir:
   • el precio ni la etiqueta/globo de precio (ej. "$53"),
   • el nombre/título del producto,
   • la descripción ni las especificaciones (fps, ml, g, etc.),
   • el fondo blanco sobrante, los bordes de la tarjeta, ni productos vecinos.
   Ajusta los 4 lados pegados al contorno del envase. Si dudas, recorta más pequeño antes que incluir texto.

RESPONDE ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones):
{
  "products": [
    {
      "name": "Hawaiian Tropic Gel Bronceador",
      "description": "fps 15 - 240ml",
      "price": 53,
      "category": "Solar",
      "box": [0.05, 0.12, 0.22, 0.30]
    }
  ],
  "totalProducts": 1,
  "categories": ["Solar"],
  "confidence": 0.95
}`
  }

  /**
   * Prompt para la DETECCIÓN nativa de Gemini (generateContent con box_2d).
   * Devuelve, por producto, los datos + la caja AJUSTADA al objeto físico en el
   * formato nativo box_2d [ymin, xmin, ymax, xmax] normalizado 0-1000, que es
   * mucho más preciso que pedir coordenadas en el modo chat.
   */
  static getMenuExtractionDetectionPrompt(): string {
    return `Analiza este catálogo/menú/flyer y devuelve TODOS los productos visibles. Para cada producto:
- name: la MARCA + el TIPO de producto juntos (ej. "Hawaiian Tropic Gel Bronceador", "Silla Moderna").
- description: presentación/variante/especificaciones (fps, ml, g, material) SIN repetir la marca; "" si no hay.
- price: SOLO el número, sin moneda ni separadores de miles; 0 si no se ve.
- category: categoría detectada o "General".
- box_2d: la caja del producto en formato [ymin, xmin, ymax, xmax] con coordenadas normalizadas de 0 a 1000. La caja debe ceñirse ÚNICAMENTE al OBJETO FÍSICO del producto (envase, silla, mueble, prenda, etc.) y NO debe incluir el precio, el nombre, la descripción ni el fondo/borde de la tarjeta.
- colors: SOLO si junto al producto se ven MUESTRAS/CÍRCULOS/CUADROS de color (opciones de color), devuelve un array con cada color como {"name":"nombre legible en español, ej. Naranja","hex":"#RRGGBB aproximado"}. Si el producto NO muestra opciones de color, OMITE el campo "colors" por completo.
- sizes: SOLO si junto al producto se ven TALLAS (ej. S, M, L, XL, 38, 40), devuelve un array de strings con las tallas. Si NO hay tallas visibles, OMITE el campo "sizes".

IMPORTANTE sobre colors/sizes: añádelos ÚNICAMENTE a los productos que de verdad muestran esas opciones en la imagen; la mayoría de productos NO las tendrán.

Reglas: extrae TODOS los productos; crea un producto por cada variante (tamaño/fps distinto); no inventes; no dupliques.

Responde ÚNICAMENTE con un JSON array válido (sin markdown, sin explicaciones):
[{"name":"...","description":"...","price":0,"category":"...","box_2d":[ymin,xmin,ymax,xmax],"colors":[{"name":"Naranja","hex":"#E8602C"}],"sizes":["S","M","L"]}]`
  }

  /**
   * User message para extracción de menús
   */
  static getMenuExtractionUserMessage(
    imageContext?: string,
  ): string {
    return `Extrae TODOS los productos de esta ${imageContext || 'imagen de menú'}.

Para cada producto proporciona: nombre, descripción (si hay), precio (número), categoría.
RESPONDE SOLO CON JSON VÁLIDO.`
  }

  /**
   * System prompt para análisis de imágenes de productos
   */
  static getProductImageAnalysisSystemPrompt(): string {
    return `Eres un experto en análisis de imágenes de productos para catálogos de e-commerce.

Analiza la imagen y extrae:
- Descripción visual detallada
- Características identificables
- Precio (si es visible)
- Calidad y estado
- Recomendaciones para catálogo

RESPONDE EN JSON:
{
  "description": "Descripción completa",
  "features": ["característica1", "característica2"],
  "price": 0,
  "quality": "excelente|bueno|regular",
  "catalogRecommendations": ["recomendación1"],
  "confidence": 0.95
}`
  }

  /**
   * System prompt para generación de descripciones de productos
   */
  static getProductDescriptionSystemPrompt(): string {
    return `Eres un experto copywriter para catálogos de e-commerce.
Creas descripciones vendedoras, concisas pero atractivas.

Genera descripciones que:
- Sean directas y claras
- Destaquen beneficios
- Incluyan palabras clave
- Sean persuasivas sin ser exageradas
- Máximo 150 caracteres`
  }

  /**
   * User message para generación de descripción de producto
   */
  static getProductDescriptionUserMessage(
    productName: string,
    category: string,
    features: string[],
  ): string {
    return `Genera descripción vendedora para:

Producto: ${productName}
Categoría: ${category}
Características: ${features.join(', ')}

Descripción (máx 150 caracteres):
`
  }

  /**
   * System prompt para clasificación de productos
   */
  static getProductClassificationSystemPrompt(): string {
    return `Eres un experto en clasificación de productos.
Categoriza productos en categorías lógicas y comerciales.

Responde SOLO con JSON:
{
  "category": "Categoría Principal",
  "subcategory": "Subcategoría",
  "tags": ["tag1", "tag2"],
  "confidence": 0.95
}`
  }

  /**
   * System prompt para validación de datos
   */
  static getDataValidationSystemPrompt(): string {
    return `Eres un validador de datos. Verifica la calidad y consistencia de información de productos.

Identifica:
- Errores de formato
- Datos incompletos
- Inconsistencias
- Problemas de validez

Responde SOLO con JSON indicando problemas encontrados.`
  }

  /**
   * System prompt para generación de recomendaciones
   */
  static getRecommendationSystemPrompt(): string {
    return `Eres un experto en recomendaciones de mejora para catálogos.

Proporciona recomendaciones accionables y específicas que:
- Se enfoquen en mejorar conversión
- Sean prácticas de implementar
- Consideren la experiencia del usuario
- Sean basadas en mejores prácticas

Responde SOLO con JSON con array de recomendaciones.`
  }
}
