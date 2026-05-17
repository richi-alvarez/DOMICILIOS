/**
 * Image Preprocessing for OCR
 * Mejora imágenes para obtener mejor precisión en OCR
 */

export interface PreprocessOptions {
  /** Aumentar contraste 0-2 (1 = sin cambio, default: 1.2) */
  contrast?: number
  /** Aumentar brillo -100 a 100 (default: 0) */
  brightness?: number
  /** Aumentar nitidez 0-5 (default: 1.5) */
  sharpness?: number
  /** Convertir a escala de grises (default: false) */
  grayscale?: boolean
  /** Binarización automática (default: false) */
  binarize?: boolean
  /** Escala de la imagen 0.5-3 (default: 1) */
  scale?: number
  /** Rotación automática si está inclinada (default: false) */
  autoRotate?: boolean
}

/**
 * Aplica preprocesamiento a una imagen en base64
 */
export async function preprocessImage(
  base64Image: string,
  options: PreprocessOptions = {},
): Promise<string> {
  const {
    contrast = 1.2,
    brightness = 0,
    sharpness = 1.5,
    grayscale = false,
    binarize = false,
    scale = 1,
    autoRotate = false,
  } = options

  try {
    // Para preprocesamiento en cliente, usamos canvas
    // Para servidor, debería usarse sharp o ImageMagick

    if (typeof document !== 'undefined') {
      // Cliente: usa canvas
      return preprocessImageCanvas(base64Image, {
        contrast,
        brightness,
        sharpness,
        grayscale,
        binarize,
        scale,
      })
    } else {
      // Servidor: necesita sharp
      return preprocessImageSharp(base64Image, {
        contrast,
        brightness,
        sharpness,
        grayscale,
        binarize,
        scale,
      })
    }
  } catch (error) {
    console.error('[Preprocessor] Error:', error)
    return base64Image // Retorna original si falla
  }
}

/**
 * Preprocesa imagen usando canvas (cliente)
 */
function preprocessImageCanvas(
  base64Image: string,
  options: Required<Omit<PreprocessOptions, 'autoRotate'>>,
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    console.warn('[Preprocessor] No 2D context available')
    return Promise.resolve(base64Image)
  }

  // Carga la imagen
  const img = new Image()
  img.src = `data:image/jpeg;base64,${base64Image}`

  return new Promise((resolve) => {
    img.onload = () => {
      // Aplica escala
      canvas.width = img.width * options.scale
      canvas.height = img.height * options.scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Aplica transformaciones pixel a pixel
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        // Grayscale
        if (options.grayscale) {
          const gray = r * 0.299 + g * 0.587 + b * 0.114
          data[i] = gray
          data[i + 1] = gray
          data[i + 2] = gray
        }

        // Brillo
        if (options.brightness !== 0) {
          data[i] = Math.min(255, Math.max(0, data[i] + options.brightness))
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + options.brightness))
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + options.brightness))
        }

        // Contraste
        if (options.contrast !== 1) {
          const factor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast))
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128))
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128))
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // Aplicar sharpen kernel (3x3 Laplacian)
      if (options.sharpness > 1) {
        const kernel = [
          0, -1, 0, -1, 4 + (options.sharpness - 1) * 2, -1, 0, -1, 0,
        ]
        imageData = applyKernel(ctx, canvas, imageData, 3, kernel)
        ctx.putImageData(imageData, 0, 0)
      }

      // Binarización
      if (options.binarize) {
        imageData = binarizeImage(imageData)
        ctx.putImageData(imageData, 0, 0)
      }

      // Retorna como base64
      const result = canvas.toDataURL('image/jpeg', 0.95)
      resolve(result.split(',')[1])
    }

    img.onerror = () => {
      console.warn('[Preprocessor] Failed to load image')
      resolve(base64Image)
    }
  })
}

/**
 * Preprocesa imagen usando sharp (servidor)
 */
async function preprocessImageSharp(
  base64Image: string,
  options: Required<Omit<PreprocessOptions, 'autoRotate'>>,
): Promise<string> {
  try {
    // Dynamic import para evitar dependencia en cliente
    const sharp = await import('sharp')

    let pipeline = sharp.default(Buffer.from(base64Image, 'base64'))

    // Escala
    if (options.scale !== 1) {
      const metadata = await pipeline.metadata()
      if (metadata.width && metadata.height) {
        pipeline = pipeline.resize(
          Math.round(metadata.width * options.scale),
          Math.round(metadata.height * options.scale),
        )
      }
    }

    // Conversiones
    if (options.grayscale) {
      pipeline = pipeline.grayscale()
    }

    if (options.brightness !== 0) {
      pipeline = pipeline.modulate({
        brightness: 1 + options.brightness / 100,
      })
    }

    if (options.contrast !== 1) {
      pipeline = pipeline.modulate({
        saturation: options.contrast,
      })
    }

    // Sharpen
    if (options.sharpness > 1) {
      pipeline = pipeline.sharpen({
        sigma: options.sharpness * 0.5,
      })
    }

    const buffer = await pipeline.jpeg({ quality: 95 }).toBuffer()
    return buffer.toString('base64')
  } catch (error) {
    console.warn('[Preprocessor] Sharp not available, returning original')
    return base64Image
  }
}

/**
 * Aplica kernel de convolución para sharpen
 */
function applyKernel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  kernelSize: number,
  kernel: number[],
): ImageData {
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height
  const half = Math.floor(kernelSize / 2)

  const result = ctx.createImageData(imageData)
  const resultData = result.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = x + kx - half
          const py = y + ky - half

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4
            const weight = kernel[ky * kernelSize + kx]

            r += data[idx] * weight
            g += data[idx + 1] * weight
            b += data[idx + 2] * weight
          }
        }
      }

      const idx = (y * width + x) * 4
      resultData[idx] = Math.min(255, Math.max(0, r))
      resultData[idx + 1] = Math.min(255, Math.max(0, g))
      resultData[idx + 2] = Math.min(255, Math.max(0, b))
      resultData[idx + 3] = data[idx + 3] // Alpha
    }
  }

  return result
}

/**
 * Binariza imagen automáticamente usando Otsu's method
 */
function binarizeImage(imageData: ImageData): ImageData {
  const data = imageData.data
  const result = new Uint8ClampedArray(data)

  // Calcula histograma
  const histogram = new Array(256).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    histogram[Math.floor(gray)]++
  }

  // Otsu's method
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]

  let sumB = 0
  let wB = 0
  let maxVar = 0
  let threshold = 0

  for (let i = 0; i < 256; i++) {
    wB += histogram[i]
    if (wB === 0) continue

    const wF = data.length / 4 - wB
    if (wF === 0) break

    sumB += i * histogram[i]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const variance = wB * wF * ((mB - mF) ** 2)

    if (variance > maxVar) {
      maxVar = variance
      threshold = i
    }
  }

  // Aplica threshold
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const bw = gray > threshold ? 255 : 0
    result[i] = bw
    result[i + 1] = bw
    result[i + 2] = bw
  }

  return new ImageData(result, imageData.width, imageData.height)
}
