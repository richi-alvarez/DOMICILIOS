# 🏗️ Multi-Provider AI Architecture

Arquitectura escalable y profesional para gestión inteligente de múltiples proveedores de IA con reintentos automáticos y selección optim de proveedores por tarea.

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Capa de Aplicación                        │
│  (Componentes React, Server Actions, APIs)                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              Capa de Servicios (Services)                     │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │CatalogGeneration │  │MenuExtraction    │  + Otros        │
│  │Service           │  │Service           │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
┌───────────▼──────────────────────▼──────────────────────────┐
│             Capa de Estrategia de Reintentos                │
│  ┌─────────────────────────────────────────────────┐        │
│  │ RetryStrategy (Reintentos con Fallback)         │        │
│  │ - Selecciona IA por tarea                       │        │
│  │ - Prueba proveedor principal                    │        │
│  │ - Fallback automático a alternativas            │        │
│  │ - Backoff exponencial                           │        │
│  └──────────────────┬──────────────────────────────┘        │
└─────────────────────┼─────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────┐
│        Capa de Recomendaciones & Configuración             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │TaskRecommend.    │  │AIConfig          │               │
│  │- IA por tarea    │  │- Preferencias    │               │
│  │- Modelos óptimos │  │- Env vars        │               │
│  │- Costos est.     │  │- Validación      │               │
│  └──────────────────┘  └──────────────────┘               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           Capa de Factory & Providers                     │
│  ┌─────────────────────────────────────────────┐        │
│  │  AIProviderFactory                          │        │
│  │  - Crea instancias de proveedores           │        │
│  │  - Gestiona caché                           │        │
│  │  - Fallback automático                      │        │
│  │  - Validación de configuración              │        │
│  └──────────────┬───────────────────────────────┘        │
└─────────────────┼────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌────▼────┐   ┌────▼────┐
│Anthro │    │  OpenAI  │   │ Gemini   │
│pic    │    │          │   │          │
│Claude │    │ GPT-4    │   │ Flash    │
└───────┘    │ GPT-3.5  │   │ Pro      │
             └──────────┘   └──────────┘
```

## 🎯 Componentes Principales

### 1. **AIProvider Interface** (`types/ai-provider.ts`)
- Define contrato para todos los proveedores
- Estandariza input/output
- Manejo consistente de errores

```typescript
interface AIProvider {
  name: string
  isConfigured(): boolean
  generate(options): Promise<AIGenerationResponse>
  validateConfig(): boolean
}
```

### 2. **Proveedores Específicos** (`providers/`)
- `AnthropicProvider`: Claude con óptimo OCR
- `OpenAIProvider`: GPT-4 para calidad premium
- `GeminiProvider`: Flash para velocidad/costo

Cada uno:
- Adapta SDK específico del proveedor
- Maneja errores propios
- Retorna respuesta unificada

### 3. **AIProviderFactory** (`factory.ts`)
- **Patrón Factory**: Crea instancias bajo demanda
- Caché de singletons
- Validación automática de configuración

```typescript
AIProviderFactory.getProvider('anthropic')
AIProviderFactory.getConfiguredProvider('anthropic', ['openai', 'gemini'])
AIProviderFactory.listProviders()
```

### 4. **TaskRecommendations** (`task-recommendations.ts`)
- Recomienda mejor IA para cada tipo de tarea
- Modelos óptimos por proveedor
- Estimación de costos

```typescript
const recommendation = getTaskRecommendation('menu-extraction')
// {
//   primary: 'anthropic',
//   fallbacks: ['gemini', 'openai'],
//   requiresVision: true
// }
```

### 5. **RetryStrategy** (`retry-strategy.ts`)
- **Patrón Strategy + Retry**: Reintentos inteligentes
- Intenta con IA recomendada primero
- Fallback automático a alternativas
- Backoff exponencial

```typescript
const result = await retryStrategy.executeWithRetry(
  'menu-extraction',
  { systemPrompt, userMessage },
  { maxAttempts: 3, verbose: true }
)
// Intenta: anthropic → gemini → openai
// Reporta: intentos, proveedores usados, tiempo
```

### 6. **PromptsService** (`prompts-service.ts`)
- Centraliza todos los prompts del sistema
- Prompts reutilizables y consistentes
- Fácil de mantener y versionar

```typescript
PromptsService.getCatalogGenerationSystemPrompt()
PromptsService.getMenuExtractionSystemPrompt()
PromptsService.getProductDescriptionUserMessage(...)
```

### 7. **Servicios de Aplicación**
- **CatalogGenerationService**: Generación inteligente de catálogos
- **MenuExtractionService**: Extracción de menús con vision
- Otros por agregar

## 🔄 Flujos de Ejecución

### Flujo 1: Generación de Catálogo con Reintentos

```
Usuario solicita catálogo
    ↓
generateCatalog()
    ↓
RetryStrategy.executeWithRetry('catalog-generation')
    ├─ Recomendación: Gemini (rápido, barato)
    ├─ Intento 1: Gemini ✓ ÉXITO → Retorna resultado
    (Sin llegar a fallbacks)
    
  Si Gemini fallara:
    ├─ Intento 2: OpenAI
    │   Si fallara:
    │   ├─ Intento 3: Anthropic
    │       Si fallara:
    │       └─ Error: Todos los intentos fallaron
```

### Flujo 2: Extracción de Menú con Vision

```
Usuario sube imagen de menú
    ↓
extractFromImage(imageData)
    ↓
MenuExtractionService.extractFromImage()
    ├─ Recomendación: Anthropic (mejor OCR)
    ├─ Intento 1: Anthropic
    │   ├─ Parsea respuesta
    │   ├─ Valida productos
    │   └─ Retorna estructura con metadatos
    
  Si falla:
    ├─ Intento 2: Gemini (vision rápida)
    ├─ Intento 3: OpenAI (GPT-4 Vision)
```

## ⚙️ Configuración Inteligente

### Variables de Entorno

```bash
# Proveedor preferido globalmente
AI_PROVIDER=anthropic

# Fallbacks globales
AI_FALLBACK_PROVIDERS=openai,gemini

# Configuración por defecto
AI_DEFAULT_MAX_TOKENS=2048
AI_DEFAULT_TEMPERATURE=0.7

# Claves API
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

### Lógica de Selección

```
┌─ ¿Tarea específica tiene recomendación? ┐
│                                         Sí → Usar recomendación
│                                         No ↓
├─ ¿Variable AI_PROVIDER configurada?      
│                                         Sí → Usar preferencia
│                                         No ↓
└─ ¿Algún proveedor configurado?
                                          Sí → Usar primero disponible
                                          No → Error
```

## 📈 Patrones de Diseño Utilizados

### 1. **Factory Pattern**
Crear instancias sin acoplamiento directo

```typescript
const provider = AIProviderFactory.getProvider('anthropic')
// vs.
const provider = new AnthropicProvider() // Acoplado
```

### 2. **Strategy Pattern**
Intercambiar estrategias de ejecución

```typescript
retryStrategy.executeWithRetry(task)      // Automática
retryStrategy.executeWithCustomProviders() // Manual
```

### 3. **Dependency Injection**
Inyectar dependencias en servicios

```typescript
// El servicio recibe providers, no los crea
const result = service.generate({ 
  provider: 'anthropic', 
  ...options 
})
```

### 4. **Configuration Pattern**
Centralizar configuración

```typescript
const model = AIConfig.getDefaultModel('anthropic')
const validation = AIConfig.validateEnvironment()
```

### 5. **Retry Pattern**
Reintentos con backoff exponencial

```typescript
{
  maxAttempts: 3,
  delayMs: 500,
  backoffMultiplier: 2
  // Espera: 500ms → 1000ms → 2000ms
}
```

## 🎯 Casos de Uso

### Caso 1: Generar Catálogo Rápido
```typescript
const result = await CatalogGenerationService.generateCatalog({
  businessName: 'Café',
  businessDescription: '...',
  // Usa Gemini por defecto (más rápido y barato)
})
```

### Caso 2: Extraer Menú Complejo
```typescript
const result = await MenuExtractionService.extractFromImage(
  base64Image,
  'image/jpeg',
  { verbose: true } // Muestra intentos
)
// Intenta: anthropic (mejor OCR) → gemini → openai
```

### Caso 3: Forzar Proveedor Específico
```typescript
const result = await MenuExtractionService.extractFromImage(
  base64Image,
  'image/jpeg',
  { customProvider: 'openai' } // Solo GPT-4
)
```

### Caso 4: Usar Reintentos Manuales
```typescript
const strategy = new RetryStrategy()
const result = await strategy.executeWithCustomProviders(
  ['anthropic', 'gemini', 'openai'],
  { systemPrompt, userMessage }
)
```

## 📊 Matriz de Decisión: ¿Qué IA para cada tarea?

| Tarea | Primary | Razón | Fallbacks |
|-------|---------|-------|-----------|
| Catálogo | Gemini | 3x más rápido, 10x barato | OpenAI, Anthropic |
| Menú/OCR | Anthropic | Mejor OCR, diseños complejos | Gemini, OpenAI |
| Imágenes | Gemini | Vision rápido, económico | Anthropic, OpenAI |
| Contenido | Anthropic | Texto más coherente | OpenAI, Gemini |

## 🔐 Seguridad

✅ API keys nunca expuestas al cliente
✅ Validación de inputs
✅ Manejo seguro de errores
✅ Rate limiting por configurar
✅ Audit logging de intentos

## 📈 Performance Esperado

| Operación | Tiempo | Tokens | Costo |
|-----------|--------|--------|-------|
| Catálogo Gemini | 2-3s | 1000-1500 | ~$0.001 |
| OCR Anthropic | 5-8s | 2000-4000 | ~$0.01 |
| Análisis OpenAI | 4-6s | 1500-3000 | ~$0.005 |

## 🚀 Próximas Mejoras

- [ ] Rate limiting automático
- [ ] Caching inteligente de resultados
- [ ] Métricas por proveedor
- [ ] A/B testing automático
- [ ] Selección dinámica basada en latencia
- [ ] Streaming de respuestas
- [ ] Modelos locales (Ollama)
- [ ] Monitoreo en tiempo real
