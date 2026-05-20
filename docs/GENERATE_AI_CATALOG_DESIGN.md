# Generar Catálogo con IA - Documentación Completa

## Descripción General

Este sistema permite generar catálogos con diseño profesional automáticamente usando IA. El flujo incluye:
1. Recopilación de datos del negocio
2. Generación de estructura de catálogo con IA
3. Descarga de imágenes profesionales
4. Guardado en base de datos
5. Previsualization en editor de diseño

## Arquitectura

### 1. Ruta API
**Endpoint:** `POST /api/catalogs/[id]/generate-ai-design`

**Parámetros:**
```json
{
  "businessName": "string",
  "businessType": "string", 
  "businessDescription": "string"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Catalog generated with AI design successfully",
  "catalogId": "uuid"
}
```

**Ubicación:** `/app/api/catalogs/[id]/generate-ai-design/route.ts`

### 2. Servicio de Generación
**Archivo:** `/lib/actions/catalogs/generate-ai-catalog-design.ts`

**Función:** `generateAICatalogWithDesign(catalogId, businessData)`

**Flujo:**
1. Valida que el catálogo exista y pertenezca al usuario
2. Llama a Claude IA con prompt estructurado
3. Descarga imágenes usando Unsplash API
4. Crea categorías, productos y bloques
5. Guarda el tema en la BD

### 3. Hook de Cliente
**Archivo:** `/lib/hooks/use-generate-ai-design.ts`

**Uso:**
```typescript
const { isLoading, error, success, generateDesign } = useGenerateAIDesign()

await generateDesign({
  catalogId: 'uuid',
  businessName: 'Mi Negocio',
  businessType: 'restaurant',
  businessDescription: 'Descripción del negocio...'
})
```

### 4. Componente Modal
**Archivo:** `/components/app/generate-ai-design-modal.tsx`

**Props:**
```typescript
interface GenerateAIDesignModalProps {
  catalogId: string
  catalogName?: string
  isOpen: boolean
  onClose: () => void
}
```

## Estructura de Base de Datos

### Tabla: `catalogs`
- `aiPrompt`: texto del prompt enviado a IA (opcional)
- `themeJson`: configuración de colores y fuentes guardada

### Tabla: `categories`
- Se crea automáticamente (1 categoría generada)
- `name`, `slug`, `catalogId`, `position`, `active`

### Tabla: `products`
- Se crean hasta 3 productos de ejemplo
- `name`, `description`, `price`, `imagesJson`, `catalogId`, `categoryId`
- `imagesJson` contiene URLs a las imágenes descargadas

### Tabla: `blocks`
Se crean 3 bloques de diseño:
1. **presentation**: Banner con imagen generada
2. **catalog**: Grid de productos
3. **cart**: Carrito de compras

## Almacenamiento de Imágenes

**Ruta:** `/public/catalogs/[catalogId]/`

**Nomenclatura:**
- `banner.jpg` - Banner principal
- `producto_body_[nombre].jpg` - Imagen principal del producto
- `producto_carrusel_[nombre].jpg` - Imagen para carrusel

**Ejemplo:**
```
/public/catalogs/uuid-123/
├── banner.jpg
├── producto_body_hamburguesa-clasica.jpg
├── producto_carrusel_hamburguesa-clasica.jpg
├── producto_body_pizza-margherita.jpg
└── producto_carrusel_pizza-margherita.jpg
```

## Prompt de IA

**Sistema:** Define las reglas y estructura esperada
**Usuario:** Contiene datos del negocio

**Estructura esperada de respuesta JSON:**
```json
{
  "catalogName": "string",
  "description": "string (máx 150 caracteres)",
  "theme": {
    "primaryColor": "#hexcode",
    "secondaryColor": "#hexcode",
    "buttonPrimaryColor": "#hexcode",
    "buttonSecondaryColor": "#hexcode",
    "font": "poppins|inter|lato|raleway|nunito",
    "borderRadius": "none|sm|full"
  },
  "banner": {
    "title": "string",
    "subtitle": "string (máx 120 caracteres)",
    "imageQuery": "descriptive query for professional image search",
    "ctaText": "string",
    "overlayOpacity": 40,
    "overlayType": "dark|light"
  },
  "category": {
    "name": "string",
    "slug": "string (lowercase, hyphenated)"
  },
  "products": [
    {
      "name": "string",
      "description": "string (máx 100 caracteres)",
      "price": number,
      "bodyImageQuery": "descriptive query for product main image",
      "carouselImageQuery": "descriptive query for product carousel/slider image"
    }
  ]
}
```

## Tipos de Negocio Soportados

- `restaurant` - 🍽️ Restaurante
- `cafe` - ☕ Cafetería  
- `bakery` - 🥐 Panadería
- `pizzeria` - 🍕 Pizzería
- `pharmacy` - 💊 Farmacia
- `store` - 🛍️ Tienda
- `beauty` - 💄 Belleza
- `gym` - 💪 Gimnasio
- `florist` - 🌸 Floristería
- `other` - 🏪 Otro

## Variables de Entorno Requeridas

```env
UNSPLASH_ACCESS_KEY=tu_clave_unsplash
ANTHROPIC_API_KEY=tu_clave_anthropic
```

## Flujo de Uso

1. **Usuario** accede a `/app/catalogs/[id]/design`
2. **Hace clic** en botón "Generar con IA"
3. **Se abre** modal con formulario
4. **Completa** datos del negocio
5. **Hace clic** en "Generar Catálogo con IA"
6. **Sistema:**
   - Valida datos (client-side)
   - Envía POST a `/api/catalogs/[id]/generate-ai-design`
   - IA genera estructura
   - Descarga imágenes
   - Crea categorías, productos, bloques
   - Guarda tema
   - Revalidata página
7. **Página** se actualiza mostrando nuevo diseño

## Manejo de Errores

### Error 401 - No autenticado
- Usuario no tiene sesión activa

### Error 403 - Prohibido
- Catálogo no pertenece a la organización del usuario

### Error 404 - No encontrado
- Catálogo no existe

### Error 400 - Datos incompletos
- Faltan campos requeridos en el request

### Error 500 - Error de servidor
- Fallo en generación con IA
- Fallo en descarga de imágenes
- Fallo en creación de BD

## Testing

### Test E2E (Playwright)
```bash
npm run test:e2e -- tests/generate-ai-design.spec.ts
```

### Test Manual
1. Crear nuevo catálogo
2. Ir a página de diseño
3. Clic en "Generar con IA"
4. Llenar formulario con datos de prueba
5. Enviar
6. Verificar que se crean categorías, productos e imágenes
7. Verificar que se actualizan los colores y fuentes
8. Verificar que se ve el nuevo diseño

## Limitaciones y Notas

- **Máximo 3 productos** por generación (según requisito)
- **Exactamente 1 categoría** por generación
- Las imágenes se descargan de Unsplash API
- Requiere conexión a Internet para descargar imágenes
- El prompt es enviado a Anthropic Claude
- Los datos se guardan en PostgreSQL
- Las imágenes se almacenan en `/public/catalogs/`

## Próximas Mejoras

- [ ] Permitir regenerar solo imágenes
- [ ] Permitir customizar el prompt antes de enviar
- [ ] Guardar histórico de generaciones
- [ ] Permitir más de 3 productos
- [ ] Integración con más proveedores de imágenes
- [ ] Generación de descripciones SEO automáticas
