import fs from 'fs'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

export async function downloadAndSaveImage(
  query: string,
  catalogId: string,
  filename: string
): Promise<string> {
  try {
    let imageUrl: string

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY

    if (unsplashKey) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${unsplashKey}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          imageUrl = data.urls.regular
        } else {
          throw new Error('Unsplash API failed')
        }
      } catch {
        imageUrl = `https://source.unsplash.com/featured/1200x600/?${encodeURIComponent(query)}`
      }
    } else {
      imageUrl = `https://source.unsplash.com/featured/1200x600/?${encodeURIComponent(query)}`
    }

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`)
    }

    const buffer = await imageResponse.arrayBuffer()

    const catalogDir = path.join(process.cwd(), 'public', 'catalogs', catalogId)
    await mkdir(catalogDir, { recursive: true })

    const filePath = path.join(catalogDir, `${filename}.jpg`)
    await writeFile(filePath, Buffer.from(buffer))

    return `/catalogs/${catalogId}/${filename}.jpg`
  } catch (error) {
    console.error(`Error downloading image for query "${query}":`, error)
    throw new Error(`Failed to download and save image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
