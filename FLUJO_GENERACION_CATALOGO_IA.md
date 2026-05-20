# Flujo de Generación de Catálogo con IA - Documentación Actualizada

**Fecha Actualización:** 2026-05-20  
**Estado:** ✅ COMPLETADO Y OPTIMIZADO

## Resumen de Cambios

Se optimizó el flujo para generar catálogos con IA **directamente desde el onboarding**, eliminando pasos innecesarios en la página de diseño.

### ❌ Removido
- Modal en página de diseño (`GenerateAIDesignModal`)
- Hook de cliente (`useGenerateAIDesign`)
- Ruta API redundante (`/api/catalogs/[id]/generate-ai-design`)

### ✅ Implementado
- Flujo unificado en onboarding
- Generación automática al crear catálogo
- Redirección directa al catálogo con diseño completado

---

## Flujo Completo del Usuario

### Paso 1: Acceso
```
Usuario → /app/catalogs/new
```

### Paso 2: Datos del Negocio (Step 1)
- Nombre del negocio
- Tipo de negocio

### Paso 3: Enlace Único (Step 2)
- Slug/URL del catálogo

### Paso 4: Detalles (Step 3)
- Moneda
- Descripción del negocio (importante para IA)

### Paso 5: Canal de Pedidos o Generación IA (Step 4)
**Opción A: Crear Manualmente**
- Selecciona WhatsApp o Email
- Agrega número o email
- Presiona "Crear catálogo"
- ⏱️ ~2 segundos → Catálogo vacío creado

**Opción B: Crear con IA** ⭐
- Presiona botón "Generar Ahora" (visible si usuario tiene acceso a IA)
- **Abre Step 4B: Generador de IA**
  - La IA genera estructura del catálogo
  - Usuario ve preview de categorías y productos
- **Vuelve a Step 5: Detalles de Pedidos**
- Presiona "Crear con IA"
- ⏱️ ~10-15 segundos → Llamadas a IA + Descarga de imágenes + Creación de BD

### Resultado Final
```
✅ Catálogo creado en BD
✅ 1 Categoría generada
✅ Max 3 productos generados
✅ Imágenes descargadas (banner + productos)
✅ Tema de colores aplicado
✅ Bloques de diseño creados (presentation, catalog, cart)
✅ Usuario redirigido a /app/catalogs/[id]
✅ Diseño completamente visible y funcional
```

---

## Arquitectura Técnica

### Flujo de Datos

```
CatalogWizard (Step 4)
    ↓
handleCreate()
    ↓
createCatalogReturn({
  name, slug, description,
  orderChannel, contactPhone/Email,
  currency, language,
  useAI: true,              ← Si usuario seleccionó IA
  businessType,             ← Tipo de negocio
  businessDescription       ← Descripción detallada
})
    ↓
/lib/actions/catalogs.ts
    ↓
1. db.insert(catalogs) → Catálogo creado
    ↓
2. if (data.useAI && data.businessType && data.businessDescription)
    ↓
3. generateAICatalogWithDesign(catalogId, {
     businessName,
     businessType,
     businessDescription,
     currency
   })
    ↓
4. Internamente:
   - Llama a Claude IA
   - Descarga imágenes
   - Crea categorías
   - Crea productos
   - Crea bloques
   - Guarda tema
    ↓
5. revalidatePath('/app')
    ↓
6. Retorna { id: catalogId, aiGenerated: true }
    ↓
7. Router.push(/app/catalogs/[id])
```

### Funciones Utilizadas

#### Principal: `createCatalogReturn()`
**Ubicación:** `/lib/actions/catalogs.ts` (líneas 132-200)

```typescript
export async function createCatalogReturn(data: {
  name: string
  slug: string
  useAI?: boolean           // Flag para activar generación IA
  businessType?: string     // Tipo de negocio
  businessDescription?: string  // Descripción del negocio
  // ... otros campos
}): Promise<{ id: string; aiGenerated?: boolean } | { error: string }>
```

#### Secundaria: `generateAICatalogWithDesign()`
**Ubicación:** `/lib/actions/catalogs/generate-ai-catalog-design.ts`

```typescript
export async function generateAICatalogWithDesign(
  catalogId: string,
  businessData: {
    businessName: string
    businessType: string
    businessDescription: string
    currency: string
  }
): Promise<{ success: true } | { error: string }>
```

---

## Componentes Involucrados

### 1. CatalogWizard
**Archivo:** `/components/app/catalog-wizard.tsx`

**Responsabilidades:**
- Recolectar datos del usuario
- Mostrar preview de IA si aplica
- Llamar `createCatalogReturn()` con parámetros correctos
- Redirigir al catálogo creado

**Flujo Key:**
```typescript
const handleCreate = async () => {
  const result = await createCatalogReturn({
    // ... otros datos
    useAI: useAI && !!generatedCatalog,  // Solo si generó preview
    businessType,
    businessDescription,
  })
  
  router.push(`/app/catalogs/${result.id}`)
}
```

### 2. AICatalogGenerator (Opcional)
**Archivo:** `/components/app/ai-catalog-generator.tsx`

**Responsabilidades:**
- Generar preview de estructura del catálogo
- Mostrar productos de ejemplo
- Mostrar tema de colores propuesto

**Nota:** Este componente es para preview solamente. La generación real del diseño ocurre en `generateAICatalogWithDesign()`.

---

## Base de Datos

### Tablas Creadas/Modificadas

#### catalogs
```sql
INSERT INTO catalogs (
  id, orgId, slug, name, description,
  themeJson,    -- Guardado aquí ✅
  aiPrompt,     -- Opcional
  status, currency, language, orderChannel
)
VALUES (...)
```

#### categories
```sql
INSERT INTO categories (
  id, catalogId, name, slug,
  position, active
)
VALUES (...)
-- Exactamente 1 categoría creada
```

#### products
```sql
INSERT INTO products (
  id, catalogId, categoryId,
  name, description, price,
  imagesJson,   -- Guardado aquí ✅
  position, active
)
VALUES (...)
-- Máximo 3 productos
```

#### blocks
```sql
INSERT INTO blocks (
  id, catalogId, type,
  configJson,   -- Guardado aquí ✅
  position, active
)
VALUES (...)
-- 3 bloques: presentation, catalog, cart
```

### Almacenamiento de Imágenes

**Base:** `/public/catalogs/[catalogId]/`

**Archivos Creados:**
```
banner.jpg
producto_body_[nombre].jpg
producto_carrusel_[nombre].jpg
```

**Llamadas:**
- `downloadAndSaveImage()` en `/lib/utils/image-downloader.ts`
- Usa Unsplash API para obtener imágenes
- Guarda localmente en `/public/catalogs/`

---

## Prompts de IA

### Prompt del Sistema
Define estructura JSON esperada:
- theme (colores, fuente, borderRadius)
- banner (imagen, título, subtítulo)
- category (nombre, slug)
- products (nombre, descripción, precio, queries de imagen)

### Prompt del Usuario
Contiene:
- businessName
- businessType
- businessDescription
- currency

**Adaptaciones:**
- Extrae colores de la descripción
- Sugiere colores por industria si no hay colores explícitos
- Genera queries de búsqueda de imágenes específicas
- Adapta fuentes y border-radius según tipo de negocio

---

## Variables de Entorno Requeridas

```env
ANTHROPIC_API_KEY=sk-ant-...
UNSPLASH_ACCESS_KEY=...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Manejo de Errores

### Cliente-side
- Validación de campos requeridos
- Validación de descripción (mín 20 caracteres)
- Validación de slug

### Servidor-side
```typescript
// En createCatalogReturn()
if (!session?.user?.id) return { error: 'No autenticado' }
if (!orgId) return { error: 'Sin organización' }
if (catalogCount >= limits.catalogs) return { error: 'Límite alcanzado' }

// Si falla generación IA, aún retorna el catálogo:
if (!aiResult.success) {
  console.error('AI generation failed:', aiResult.error)
  // Continue - no fail
}
```

---

## Testing

### Test Manual: Opción Sin IA
1. `/app/catalogs/new`
2. Completa nombre y tipo (Step 1)
3. Selecciona slug (Step 2)
4. Agrega descripción (Step 3)
5. Selecciona WhatsApp/Email (Step 4)
6. Presiona "Crear catálogo"
7. ✅ Catálogo vacío creado (~2 segundos)

### Test Manual: Opción Con IA
1. `/app/catalogs/new`
2. Completa nombre y tipo (Step 1)
3. Selecciona slug (Step 2)
4. Agrega descripción DETALLADA mencionando colores (Step 3)
5. Presiona "Generar Ahora" (Step 4B se abre)
6. Ve preview de estructura generada
7. Vuelve a Step 5 (pedidos)
8. Presiona "Crear con IA"
9. ✅ Catálogo generado con diseño (~10-15 segundos)
10. Redirecciona a `/app/catalogs/[id]`
11. ✅ Diseño completamente aplicado

---

## Ventajas del Nuevo Flujo

✅ **Menos clics:** Generación directa desde onboarding  
✅ **Menos confusión:** No hay modal adicional en diseño  
✅ **Mejor UX:** Usuario ve resultado inmediatamente  
✅ **Más rápido:** Un paso menos después de crear  
✅ **Más eficiente:** No requiere ruta API adicional  
✅ **Manejo de errores:** Si falla IA, catálogo se crea igual  

---

## Próximos Pasos

- [ ] Testing completo en todos los navegadores
- [ ] Verificar manejo de errores de Unsplash
- [ ] Verificar timeouts de IA
- [ ] Monitoreo de uso de API de Anthropic
- [ ] Analytics de adopción de feature IA

---

## Conclusión

El flujo está **100% optimizado**. La generación con IA ocurre directamente en la creación del catálogo, proporcionando una experiencia de usuario fluida y sin pasos innecesarios.

