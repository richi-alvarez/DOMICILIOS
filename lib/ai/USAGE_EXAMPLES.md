# 💡 Ejemplos de Uso - Multi-Provider AI System

## 🚀 Inicio Rápido

### 1. Generar Catálogo

```typescript
import { CatalogGenerationService } from '@/lib/ai/catalog-generation-service'

const result = await CatalogGenerationService.generateCatalog({
  businessName: 'Café Artesanal',
  businessDescription: 'Café de especialidad con pasteles caseros...',
  businessType: 'cafe',
})

if (result.success) {
  console.log(`✓ Exitoso con ${result.provider}`)
  console.log(`  Intentos: ${result.attempts}`)
  console.log(`  Providers: ${result.providersUsed?.join(' → ')}`)
  console.log(`  Tiempo: ${result.timeMs}ms`)
}
```

### 2. Extraer Productos de Menú

```typescript
import { MenuExtractionService } from '@/lib/ai/menu-extraction-service'

const result = await MenuExtractionService.extractFromImage(
  base64ImageData,
  'image/jpeg',
  { verbose: true }
)

if (result.success) {
  console.log(`✓ ${result.totalProducts} productos extraídos`)
  console.log(`  Categorías: ${result.categories.join(', ')}`)
  console.log(`  Confianza: ${(result.confidence * 100).toFixed(1)}%`)
  
  const stats = MenuExtractionService.calculatePriceStats(result.products)
  console.log(`  Precios: $${stats.min} - $${stats.max}`)
}
```

### 3. Reintentos Manuales

```typescript
import { retryStrategy } from '@/lib/ai/retry-strategy'

const result = await retryStrategy.executeWithRetry(
  'catalog-generation',
  { systemPrompt: '...', userMessage: '...' },
  { maxAttempts: 3, verbose: true }
)
```

### 4. Forzar Proveedor Específico

```typescript
// Solo usar OpenAI (GPT-4)
const result = await MenuExtractionService.extractFromImage(
  base64,
  'image/jpeg',
  { customProvider: 'openai' }
)
```

## 🛠️ Configuración

```bash
# .env.local
AI_PROVIDER=anthropic
AI_FALLBACK_PROVIDERS=openai,gemini
AI_DEFAULT_MAX_TOKENS=2048
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

## ✅ Mejores Prácticas

- Usar servicios (CatalogGenerationService) que manejan reintentos
- Validar configuración al inicio
- Habilitar verbose en desarrollo
- Implementar logging para auditoría
- Manejar errores específicos

## 📊 Matriz: ¿Qué IA para cada tarea?

| Tarea | Primary | Razón |
|-------|---------|-------|
| Catálogo | Gemini | 3x más rápido, 10x barato |
| Menú/OCR | Anthropic | Mejor OCR |
| Imágenes | Gemini | Vision rápido |
| Contenido | Anthropic | Texto coherente |
