/**
 * Parsea JSON devuelto por un modelo de IA de forma tolerante.
 *
 * Algunos modelos (p.ej. Gemini) envuelven la respuesta en bloques markdown
 * (```json ... ```) o agregan texto antes/después. Esta función limpia esos
 * envoltorios y extrae el primer objeto/array JSON antes de parsear.
 */
export function parseAIJson<T = unknown>(raw: string): T {
  let text = (raw ?? '').trim()

  // Quitar fences markdown ```json ... ``` o ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  }

  try {
    return JSON.parse(text) as T
  } catch {
    // Fallback: extraer el primer bloque {...} o [...] del texto
    const objMatch = text.match(/[{[][\s\S]*[}\]]/)
    if (objMatch) {
      return JSON.parse(objMatch[0]) as T
    }
    throw new Error('No se encontró JSON válido en la respuesta de la IA')
  }
}
