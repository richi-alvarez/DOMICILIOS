# 📁 Estructura del Sistema Multi-Provider AI

## 🎯 ¿Qué fue creado?

Un sistema profesional, escalable y mantenible para gestionar múltiples proveedores de IA con:

✅ Soporte para Anthropic, OpenAI, Google Gemini
✅ Selección inteligente de IA por tipo de tarea
✅ Reintentos automáticos con fallback
✅ Prompts centralizados y reutilizables
✅ Métricas de uso y costos
✅ Manejo robusto de errores
✅ Configuración flexible por entorno

## 📁 Árbol de Archivos

```
lib/ai/
├── types/
│   └── ai-provider.ts              # Interfaces base
├── providers/
│   ├── anthropic-provider.ts       # Claude Implementation
│   ├── openai-provider.ts          # GPT Implementation
│   ├── gemini-provider.ts          # Gemini Implementation
│   └── index.ts                    # Exports
├── factory.ts                      # AIProviderFactory
├── config.ts                       # AIConfig
├── task-recommendations.ts         # Recomendaciones por tarea
├── retry-strategy.ts               # RetryStrategy con fallbacks
├── prompts-service.ts              # PromptsService (centralizado)
├── catalog-generation-service.ts   # Servicio de catálogos
├── menu-extraction-service.ts      # Servicio de extracción
├── README.md                       # Documentación general
├── ARCHITECTURE.md                 # Arquitectura detallada
├── USAGE_EXAMPLES.md               # Ejemplos de uso
└── STRUCTURE_SUMMARY.md            # Este archivo
```

## 🔧 Componentes Principales

### 1. Core Types (`types/ai-provider.ts`)

```typescript
interface AIProvider {
  name: string
  isConfigured(): boolean
  generate(options): Promise<AIGenerationResponse>
  validateConfig(): boolean
}

interface AIGenerationResponse {
  success: boolean
  content?: string
  error?: string
  usage?: { inputTokens: number; outputTokens: number }
}

type SupportedProvider = 'anthropic' | 'openai' | 'gemini'
```

### 2. Providers Concretos

#### AnthropicProvider
- Usa `@anthropic-ai/sdk`
- Modelos: Claude Opus, Sonnet, Haiku
- Mejor para: OCR, análisis complejo

#### OpenAIProvider
- Usa `openai` SDK
- Modelos: GPT-4, GPT-3.5-turbo
- Mejor para: Calidad premium

#### GeminiProvider
- Usa `@google/generative-ai`
- Modelos: Gemini 2.0 Flash, 1.5 Pro
- Mejor para: Velocidad, costo

### 3. Factory Pattern (`factory.ts`)

```typescript
class AIProviderFactory {
  static getProvider(name: SupportedProvider): AIProvider
  static getConfiguredProvider(preferred, fallbacks): AIProvider
  static listProviders(): Provider[]
  static hasAnyProvider(): boolean
}
```

### 4. Recomendaciones por Tarea (`task-recommendations.ts`)

Define para cada tipo de tarea:
- IA recomendada
- Fallbacks
- Modelos óptimos
- Estimación de costos

```typescript
const recommendation = getTaskRecommendation('menu-extraction')
// { primary: 'anthropic', fallbacks: ['gemini', 'openai'], ... }
```

### 5. Estrategia de Reintentos (`retry-strategy.ts`)

Ejecuta con reintentos inteligentes:
1. Intenta con IA recomendada
2. Si falla, prueba fallbacks
3. Backoff exponencial entre intentos
4. Retorna métricas de ejecución

```typescript
const result = await retryStrategy.executeWithRetry(
  'catalog-generation',
  options,
  { maxAttempts: 3, delayMs: 500 }
)
// Resultado incluye: attempts, providersUsed, timeMs
```

### 6. Prompts Centralizados (`prompts-service.ts`)

Proporciona prompts reutilizables:
- `getCatalogGenerationSystemPrompt()`
- `getMenuExtractionSystemPrompt()`
- `getProductDescriptionSystemPrompt()`
- Y más...

### 7. Servicios de Aplicación

#### CatalogGenerationService
Genera estructura de catálogos con:
- Reintentos automáticos
- Selección inteligente de IA
- Métricas de ejecución

#### MenuExtractionService
Extrae productos de imágenes:
- Validación de datos
- Agrupamiento por categoría
- Cálculo de estadísticas
- Reintentos automáticos

## 🔄 Flujo Integrado

```
Usuario → Action → Service → RetryStrategy → AIFactory → Providers
                    ↓
                PromptsService
                    ↓
                TaskRecommendations
                    ↓
                AIConfig
```

## 📊 Secuencia de Reintentos

```
generateCatalog()
├─ getTaskRecommendation('catalog-generation')
│  └─ { primary: 'gemini', fallbacks: ['openai', 'anthropic'] }
├─ retryStrategy.executeWithRetry(...)
│  ├─ Intento 1: Gemini ✓ SUCCESS
│  │  └─ return { success: true, attempts: 1, ... }
│  
│  Si Gemini fallara:
│  ├─ Intento 2: OpenAI
│  ├─ Intento 3: Anthropic
│  └─ Si todos fallan: return { success: false, error: '...', ... }
```

## 🎯 Casos de Uso Implementados

### ✅ Catálogo Automático
- Usuario completa formulario
- Sistema selecciona Gemini (más rápido)
- Genera estructura con reintentos

### ✅ Extracción de Menú
- Usuario sube imagen
- Sistema selecciona Anthropic (mejor OCR)
- Extrae productos con fallback automático

### ✅ Validación Inteligente
- Valida ambiente al inicio
- Muestra providers disponibles
- Sugiere optimizaciones de costo

## 🔐 Seguridad Implementada

✅ API keys nunca en cliente (server-side only)
✅ Validación de inputs en PromptsService
✅ Manejo seguro de errores sin exponer detalles
✅ Configuración por variables de entorno
✅ Logging de intentos para auditoría

## 📈 Métricas Disponibles

Cada ejecución reporta:
- `attempts`: Número de intentos realizados
- `providersUsed`: Orden de providers probados
- `timeMs`: Tiempo total de ejecución
- `usage`: Tokens consumidos
- `provider`: Provider que completó la tarea

## 🛠️ Extensibilidad

Para agregar nuevo proveedor (ej: Claude):

1. Crear `lib/ai/providers/claude-provider.ts`
```typescript
export class ClaudeProvider implements AIProvider {
  name = 'claude'
  isConfigured(): boolean { ... }
  async generate(options): Promise<AIGenerationResponse> { ... }
}
```

2. Registrar en Factory:
```typescript
// factory.ts
this.providers.set('claude', new ClaudeProvider())
```

3. Actualizar tipos:
```typescript
// types/ai-provider.ts
export type SupportedProvider = '...' | 'claude'
```

4. Agregar a recomendaciones:
```typescript
// task-recommendations.ts
TASK_RECOMMENDATIONS['task-name'] = {
  primary: 'claude',
  ...
}
```

## 📊 Comparativa de Proveedores

| Aspecto | Anthropic | OpenAI | Gemini |
|---------|-----------|--------|--------|
| OCR | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Velocidad | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Costo | $ | $$ | $0.001 |
| Modelos | 3 | 3 | 3 |
| Vision | ✅ | ✅ | ✅ |

## ✨ Características Destacadas

1. **Selección Inteligente**: Recomendaciones automáticas por tarea
2. **Reintentos Automáticos**: Fallback sin intervención del usuario
3. **Centralización**: Prompts y configuración en un solo lugar
4. **Métricas**: Seguimiento completo de ejecuciones
5. **Escalabilidad**: Fácil agregar nuevos proveedores
6. **Type Safety**: TypeScript strict en todos lados
7. **Production Ready**: Error handling robusto

## 📚 Documentación Disponible

- `README.md` - Overview y configuración rápida
- `ARCHITECTURE.md` - Diseño detallado y patrones
- `USAGE_EXAMPLES.md` - Ejemplos prácticos
- `STRUCTURE_SUMMARY.md` - Este archivo

## 🚀 Próximas Mejoras

- [ ] Rate limiting automático
- [ ] Caching de resultados
- [ ] Streaming de respuestas
- [ ] Modelos locales (Ollama)
- [ ] Monitoreo en tiempo real
- [ ] Dashboard de métricas
- [ ] Auto-scaling por carga
