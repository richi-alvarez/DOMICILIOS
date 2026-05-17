/**
 * PDF to Images Converter
 * Convierte PDFs a imágenes para procesamiento con OCR + Vision AI
 */

export interface PDFConversionOptions {
  /** Escala DPI para la conversión (default: 150) */
  dpi?: number
  /** Formato de salida (default: 'jpeg') */
  format?: 'jpeg' | 'png'
  /** Calidad JPEG 0-100 (default: 85) */
  quality?: number
  /** Número máximo de páginas a procesar (default: null = todas) */
  maxPages?: number | null
}

export interface ConvertedPage {
  /** Imagen en base64 */
  imageBase64: string
  /** Número de página (1-indexed) */
  pageNumber: number
  /** Ancho de la imagen en píxeles */
  width: number
  /** Alto de la imagen en píxeles */
  height: number
  /** Tamaño del archivo en bytes */
  fileSize: number
  /** MIME type */
  mimeType: 'image/jpeg' | 'image/png'
}

export interface ConversionResult {
  /** Array de páginas convertidas */
  pages: ConvertedPage[]
  /** Número total de páginas del PDF */
  totalPages: number
  /** Tiempo de conversión en ms */
  processingTimeMs: number
}

/**
 * Convierte un PDF a imágenes
 * Utiliza pdfjs-dist para extraer páginas como canvas
 */
export async function convertPDFToImages(
  pdfBuffer: Buffer | ArrayBuffer,
  options: PDFConversionOptions = {},
): Promise<ConversionResult> {
  const startTime = Date.now()
  const {
    dpi = 150,
    format = 'jpeg',
    quality = 85,
    maxPages = null,
  } = options

  try {
    // Import dinamico para evitar bundling en cliente
    const pdfjs = await import('pdfjs-dist')

    // Configura worker (para cliente, el worker se carga desde CDN)
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
    }

    // Carga el PDF
    const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise
    const totalPages = pdf.numPages
    const pagesToProcess = maxPages ? Math.min(maxPages, totalPages) : totalPages

    const pages: ConvertedPage[] = []
    const scale = dpi / 72 // PDF estándar es 72 DPI

    // Procesa cada página
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })

        // Crea canvas
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        if (!context) {
          console.warn(`[PDF] No 2D context para página ${pageNum}`)
          continue
        }

        canvas.width = viewport.width
        canvas.height = viewport.height

        // Renderiza página
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        } as any
        await page.render(renderContext).promise

        // Convierte a imagen
        const imageData = canvas.toDataURL(
          format === 'jpeg' ? 'image/jpeg' : 'image/png',
          quality / 100,
        )

        // Extrae base64
        const base64 = imageData.split(',')[1]

        pages.push({
          imageBase64: base64,
          pageNumber: pageNum,
          width: viewport.width,
          height: viewport.height,
          fileSize: Buffer.byteLength(base64, 'base64'),
          mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        })
      } catch (pageError) {
        console.error(`[PDF] Error procesando página ${pageNum}:`, pageError)
        // Continúa con siguiente página
      }
    }

    if (pages.length === 0) {
      throw new Error('No se pudieron extraer imágenes del PDF')
    }

    return {
      pages,
      totalPages,
      processingTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('[PDF] Conversion error:', error.message)
    }
    throw error
  }
}

/**
 * Convierte PDF en Node.js (servidor)
 * Alternativa para usar en server actions sin canvas
 */
export async function convertPDFToImagesServer(
  pdfBuffer: Buffer,
  options: PDFConversionOptions = {},
): Promise<ConversionResult> {
  const startTime = Date.now()
  const { maxPages = null } = options

  try {
    // Para Node.js, usamos pdf-lib para extraer info y pdfjs-dist
    const { PDFDocument } = await import('pdf-lib')
    const pdf = await PDFDocument.load(pdfBuffer)
    const totalPages = pdf.getPageCount()
    const pagesToProcess = maxPages ? Math.min(maxPages, totalPages) : totalPages

    // Nota: pdf-lib no renderiza a imágenes directamente
    // Para servidor, se recomienda usar una herramienta como:
    // - Poppler (pdfimages)
    // - ImageMagick (convert)
    // - CUPS (cupsraster)
    // O usar una API externa como CloudConvert

    console.warn(
      '[PDF] Node.js conversion requiere herramientas externas (Poppler). Usando fallback...',
    )

    // Fallback: retorna páginas vacías, indicando que se necesita procesar diferente
    const pages: ConvertedPage[] = Array.from(
      { length: pagesToProcess },
      (_, i) => ({
        imageBase64: '',
        pageNumber: i + 1,
        width: 0,
        height: 0,
        fileSize: 0,
        mimeType: 'image/jpeg' as const,
      }),
    )

    return {
      pages,
      totalPages,
      processingTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('[PDF] Server conversion error:', error.message)
    }
    throw error
  }
}
