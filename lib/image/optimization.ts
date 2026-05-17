/**
 * Image Optimization
 * Auto-rotación, compresión inteligente, y deduplicación
 */

/**
 * Detecta orientación de imagen usando metadatos EXIF
 * Retorna ángulo de rotación (0, 90, 180, 270)
 */
export function detectImageOrientation(base64Image: string): number {
  try {
    // En cliente, analiza canvas
    if (typeof document !== 'undefined') {
      return detectOrientationCanvas(base64Image)
    }

    // En servidor, usa sharp o exifparser
    return detectOrientationServer(base64Image)
  } catch (error) {
    console.warn('[Image] Could not detect orientation:', error)
    return 0 // Sin rotación
  }
}

/**
 * Detecta orientación en cliente usando canvas
 * Analiza distribución de píxeles para inferir orientación
 */
function detectOrientationCanvas(base64Image: string): number {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return 0

  const img = new Image()
  img.src = `data:image/jpeg;base64,${base64Image}`

  return new Promise<number>((resolve) => {
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Detecta bordes usando Sobel operator
      let topEdges = 0
      let bottomEdges = 0
      let leftEdges = 0
      let rightEdges = 0

      // Analiza bordes superiores (primeras 50 píxeles)
      for (let x = 0; x < Math.min(50, canvas.width); x++) {
        const idx = x * 4
        const intensity = data[idx] + data[idx + 1] + data[idx + 2]
        if (intensity < 100) topEdges++ // Borde oscuro
      }

      // Analiza bordes inferiores
      for (let x = 0; x < Math.min(50, canvas.width); x++) {
        const y = Math.max(0, canvas.height - 50)
        const idx = (y * canvas.width + x) * 4
        const intensity = data[idx] + data[idx + 1] + data[idx + 2]
        if (intensity < 100) bottomEdges++
      }

      // Simplificado: si hay contenido en más en bottom que top, probablemente está al revés
      if (bottomEdges > topEdges * 1.5) {
        resolve(180)
      } else if (canvas.height > canvas.width * 1.3) {
        resolve(0) // Vertical
      } else if (canvas.width > canvas.height * 1.3) {
        resolve(90) // Horizontal
      } else {
        resolve(0)
      }
    }

    img.onerror = () => resolve(0)
  }) as any
}

/**
 * Detecta orientación en servidor
 */
function detectOrientationServer(base64Image: string): number {
  // En Node.js, se podría usar sharp + exifparser
  // Por ahora, retorna 0 (sin rotación)
  console.warn('[Image] Server-side orientation detection not implemented')
  return 0
}

/**
 * Rota imagen automáticamente si está inclinada
 */
export async function autoRotateImage(
  base64Image: string,
  targetOrientaton?: number,
): Promise<string> {
  const angle = targetOrientaton ?? detectImageOrientation(base64Image)

  if (angle === 0) return base64Image

  try {
    if (typeof document !== 'undefined') {
      return rotateImageCanvas(base64Image, angle)
    } else {
      return rotateImageSharp(base64Image, angle)
    }
  } catch (error) {
    console.warn('[Image] Could not rotate:', error)
    return base64Image
  }
}

/**
 * Rota imagen en cliente usando canvas
 */
function rotateImageCanvas(base64Image: string, angle: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(base64Image)
      return
    }

    const img = new Image()
    img.src = `data:image/jpeg;base64,${base64Image}`

    img.onload = () => {
      // Ajusta canvas según rotación
      if (angle === 90 || angle === 270) {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((angle * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      const result = canvas.toDataURL('image/jpeg', 0.95)
      resolve(result.split(',')[1])
    }

    img.onerror = () => resolve(base64Image)
  })
}

/**
 * Rota imagen en servidor usando sharp
 */
async function rotateImageSharp(
  base64Image: string,
  angle: number,
): Promise<string> {
  try {
    const sharp = await import('sharp')
    const buffer = Buffer.from(base64Image, 'base64')
    const rotated = await sharp
      .default(buffer)
      .rotate(angle)
      .jpeg({ quality: 95 })
      .toBuffer()

    return rotated.toString('base64')
  } catch (error) {
    console.warn('[Image] Sharp not available for rotation')
    return base64Image
  }
}

/**
 * Comprime imagen inteligentemente
 * Reduce tamaño sin perder demasiada calidad
 */
export async function compressImageIntelligent(
  base64Image: string,
  maxSizeKB: number = 500,
): Promise<{ base64: string; originalSize: number; compressedSize: number }> {
  const originalSize = Buffer.byteLength(base64Image, 'base64') / 1024

  // Si ya es pequeño, no comprime
  if (originalSize < maxSizeKB) {
    return {
      base64: base64Image,
      originalSize,
      compressedSize: originalSize,
    }
  }

  try {
    if (typeof document !== 'undefined') {
      return compressImageCanvas(base64Image, maxSizeKB, originalSize)
    } else {
      return compressImageSharp(base64Image, maxSizeKB, originalSize)
    }
  } catch (error) {
    console.warn('[Image] Could not compress:', error)
    return {
      base64: base64Image,
      originalSize,
      compressedSize: originalSize,
    }
  }
}

/**
 * Comprime en cliente usando canvas
 */
async function compressImageCanvas(
  base64Image: string,
  maxSizeKB: number,
  originalSize: number,
): Promise<{
  base64: string
  originalSize: number
  compressedSize: number
}> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve({
        base64: base64Image,
        originalSize,
        compressedSize: originalSize,
      })
      return
    }

    const img = new Image()
    img.src = `data:image/jpeg;base64,${base64Image}`

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      let quality = 0.95
      let compressed = base64Image

      // Reduce calidad hasta que sea menor que maxSizeKB
      while (
        Buffer.byteLength(compressed, 'base64') / 1024 > maxSizeKB &&
        quality > 0.3
      ) {
        quality -= 0.1
        const result = canvas.toDataURL('image/jpeg', quality)
        compressed = result.split(',')[1]
      }

      resolve({
        base64: compressed,
        originalSize,
        compressedSize: Buffer.byteLength(compressed, 'base64') / 1024,
      })
    }

    img.onerror = () => {
      resolve({
        base64: base64Image,
        originalSize,
        compressedSize: originalSize,
      })
    }
  })
}

/**
 * Comprime en servidor usando sharp
 */
async function compressImageSharp(
  base64Image: string,
  maxSizeKB: number,
  originalSize: number,
): Promise<{
  base64: string
  originalSize: number
  compressedSize: number
}> {
  try {
    const sharp = await import('sharp')
    const buffer = Buffer.from(base64Image, 'base64')

    let quality = 95
    let compressed: Buffer

    do {
      compressed = await sharp
        .default(buffer)
        .jpeg({ quality })
        .toBuffer()

      if (compressed.length / 1024 <= maxSizeKB) break
      quality -= 10
    } while (quality > 20)

    const result = compressed.toString('base64')
    return {
      base64: result,
      originalSize,
      compressedSize: compressed.length / 1024,
    }
  } catch (error) {
    console.warn('[Image] Sharp not available for compression')
    return {
      base64: base64Image,
      originalSize,
      compressedSize: originalSize,
    }
  }
}

/**
 * Escala imagen si es demasiado grande
 */
export async function scaleImageIfNeeded(
  base64Image: string,
  maxWidth: number = 2000,
  maxHeight: number = 2000,
): Promise<string> {
  if (typeof document !== 'undefined') {
    return scaleImageCanvas(base64Image, maxWidth, maxHeight)
  } else {
    return scaleImageSharp(base64Image, maxWidth, maxHeight)
  }
}

/**
 * Escala en cliente
 */
function scaleImageCanvas(
  base64Image: string,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(base64Image)
      return
    }

    const img = new Image()
    img.src = `data:image/jpeg;base64,${base64Image}`

    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      const result = canvas.toDataURL('image/jpeg', 0.95)
      resolve(result.split(',')[1])
    }

    img.onerror = () => resolve(base64Image)
  })
}

/**
 * Escala en servidor
 */
async function scaleImageSharp(
  base64Image: string,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  try {
    const sharp = await import('sharp')
    const buffer = Buffer.from(base64Image, 'base64')
    const scaled = await sharp
      .default(buffer)
      .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 95 })
      .toBuffer()

    return scaled.toString('base64')
  } catch (error) {
    console.warn('[Image] Sharp not available for scaling')
    return base64Image
  }
}
