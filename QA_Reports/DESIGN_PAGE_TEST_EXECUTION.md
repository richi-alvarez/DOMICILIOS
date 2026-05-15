# 🧪 Ejecución de Pruebas - Diseño de Página
**Instrucciones para ejecutar pruebas manuales**

---

## 🚀 Requisitos Previos

```bash
# 1. Asegurar que Docker esté corriendo
docker-compose ps

# 2. Asegurar que la app está corriendo
# Debe ver: "▲ Next.js 15.2.3" en terminal

# 3. Tener las credenciales listas (ver QA_DESIGN_PAGE_FIX_2026_05_15.md)
```

---

## 📖 Test 1: Subir Imagen de Fondo

### Ejecución Manual

1. **Navegar a la página de diseño**
   ```
   URL: http://localhost:3000/app/catalogs/70ee255c-aa0f-48b4-a1cc-74e2c19d1242/design
   
   Login si es necesario:
   - Email: restaurant.free@test.com
   - Password: RestaurantFree@2026
   ```

2. **Acceder a Ajustes de Fondo**
   - En panel izquierdo, verificar que "Bloques" está seleccionado
   - Ver bloque "🎯 Sección de Presentación" (debe estar expandido)
   - Scroll hacia abajo en el panel
   - Encontrar sección "Ajustes de Fondo"
   - Click en "Ajustes de Fondo" para expandir

3. **Seleccionar Tipo Imagen**
   - Dropdown "Tipo de Fondo" debe mostrar opciones
   - Seleccionar "Imagen"
   - Debe aparecer sección "Imagen de Fondo"

4. **Subir Imagen**
   - Click en botón azul "Subir imagen"
   - Se abre file picker
   - Seleccionar cualquier imagen (JPG, PNG, GIF)
   - **Esperado:** Botón muestra "⟳ Subiendo..." con spinner
   - **Esperado:** Imagen aparece en preview (lado derecho)
   - **Esperado:** Botón cambia a "Cambiar imagen"

5. **Verificar en Preview**
   - Lado derecho: debe verse la imagen como fondo
   - Texto debe estar visible encima
   - URL debe mostrar: `https://domicilios.app/s/restaurant-free`

### Resultado
- [ ] Imagen se cargó exitosamente
- [ ] Preview muestra la imagen
- [ ] Botón ahora dice "Cambiar imagen"
- [ ] Botón rojo "✕" apareció

---

## 📖 Test 2: Cambiar Overlay (Oscuro/Claro)

### Ejecución Manual

**Prerequisito:** Test 1 debe estar completado (imagen cargada)

1. **Encontrar Ajustes de Overlay**
   - En "Ajustes de Fondo", scroll hacia abajo
   - Debe ver "Opacidad de Superposición" (slider)
   - Debe ver "Tipo de Superposición" (dos botones)

2. **Probar Modo Oscuro**
   - Click en botón "Aa Oscuro"
   - **Esperado:** Botón se vuelve oscuro (fondo negro, texto blanco)
   - **Esperado:** En preview, aparece capa oscura sobre la imagen
   - **Esperado:** Texto sigue visible pero más oscuro el fondo

3. **Probar Modo Claro**
   - Click en botón "Aa Claro"
   - **Esperado:** Botón se vuelve claro (fondo gris, texto negro)
   - **Esperado:** En preview, aparece capa clara sobre la imagen
   - **Esperado:** Efecto contrario al modo oscuro

4. **Probar Slider de Opacidad**
   - Mover slider hacia la izquierda (0%)
   - **Esperado:** Overlay casi transparente, se ve imagen limpia
   - Mover slider hacia la derecha (100%)
   - **Esperado:** Overlay sólido, apenas se ve imagen
   - Mover slider al 50%
   - **Esperado:** Balance intermedio

### Resultado
- [ ] Botón Oscuro se activó correctamente
- [ ] Botón Claro se activó correctamente
- [ ] Slider de opacidad funciona en tiempo real
- [ ] Preview actualiza al cambiar

---

## 📖 Test 3: Ingresar URL de Video

### Ejecución Manual

1. **Cambiar Tipo de Fondo a Video**
   - En "Ajustes de Fondo" → Dropdown "Tipo de Fondo"
   - Seleccionar "Video"
   - **Esperado:** Campo "URL del Video" aparece

2. **Ingresar URL**
   - Click en campo de texto (placeholder: "https://...")
   - Copiar y pegar URL válida:
     ```
     https://www.youtube.com/embed/dQw4w9WgXcQ
     ```
   - Presionar Enter o click fuera
   - **Esperado:** URL se guarda en el campo

3. **Verificar en Preview**
   - Lado derecho debe intentar mostrar video
   - Nota: El preview actual solo muestra video en modo ligero

### Resultado
- [ ] Campo acepta URL de video
- [ ] URL persiste después de hacer click fuera
- [ ] No hay errores en consola

---

## 📖 Test 4: Guardar Cambios

### Ejecución Manual (Crítico)

**Prerequisito:** Haber hecho cambios en cualquier bloque (Tests 1-3)

1. **Localizar Botón Guardar**
   - Arriba a la derecha, hay botón azul
   - Debe decir "Guardar" o "Globe Guardar"

2. **Click en Guardar**
   - Click en botón azul "Guardar"
   - **Esperado:** Botón muestra "⟳ Guardando..." con spinner
   - **Esperado:** Botón está disabled (no se puede hacer click)

3. **Esperar Confirmación**
   - Esperar 1-2 segundos
   - **Esperado:** Botón cambia a "✓ Guardado" (verde, con checkmark)
   - **Esperado:** No hay error en consola

4. **Verificar Persistencia**
   - Presionar F5 para recargar página
   - Esperar a que cargue
   - Volver a `/app/catalogs/[id]/design`
   - **CRÍTICO:** Los cambios deben estar ahí

5. **Verificar en BD (Opcional)**
   - Abrir PgAdmin: http://localhost:5050
   - Conectar a base de datos
   - Ir a `blocks` table
   - Buscar catalog_id = [ID_DEL_CATALOGO]
   - El campo `config_json` debe tener los cambios

### Resultado
- [ ] Botón mostró "Guardando..."
- [ ] Botón cambió a "Guardado"
- [ ] Sin errores en consola
- [ ] Después de F5, cambios persisten
- [ ] (Opcional) BD actualizada

---

## 📖 Test 5: Eliminar Imagen

### Ejecución Manual

**Prerequisito:** Test 1 debe estar completado (imagen cargada)

1. **Localizar Botón Eliminar**
   - En "Ajustes de Fondo" → "Imagen de Fondo"
   - Debe haber imagen preview
   - Debe haber botón rojo "✕" al lado de "Cambiar imagen"

2. **Click en ✕**
   - Click en botón rojo "✕"
   - **Esperado:** Imagen desaparece del preview
   - **Esperado:** Botón rojo "✕" desaparece
   - **Esperado:** Botón "Cambiar imagen" cambia a "Subir imagen"

3. **Verificar Preview**
   - Lado derecho: imagen debe desaparecer
   - Solo debe verse fondo de color (o texto sin fondo)

### Resultado
- [ ] Imagen se eliminó de preview
- [ ] Botones actualizaron correctamente
- [ ] Preview actualiza sin errores

---

## 📖 Test 6: Cambiar Opacidad de Overlay

### Ejecución Manual

**Prerequisito:** Test 2 debe estar completado (overlay funciona)

1. **Localizar Slider**
   - En "Ajustes de Fondo" → "Opacidad de Superposición"
   - Slider con rango 0-100
   - Muestra número actual (ej: "40%")

2. **Mover Slider a Mínimo (0%)**
   - Drag slider todo a la izquierda
   - **Esperado:** Número muestra "0%"
   - **Esperado:** En preview, overlay casi transparente
   - **Esperado:** Imagen se ve completamente clara

3. **Mover Slider a Máximo (100%)**
   - Drag slider todo a la derecha
   - **Esperado:** Número muestra "100%"
   - **Esperado:** En preview, overlay sólido
   - **Esperado:** Apenas se ve la imagen

4. **Posición Intermedia (50%)**
   - Drag slider al medio
   - **Esperado:** Número muestra "50%"
   - **Esperado:** Balance en preview

### Resultado
- [ ] Slider funciona suavemente
- [ ] Preview actualiza en tiempo real
- [ ] Número se actualiza correctamente
- [ ] Rango 0-100 funciona

---

## 🎬 Prueba Completa (Flujo Completo)

Si quieres ejecutar todas las pruebas de una vez:

```
1. Login con restaurant.free@test.com / RestaurantFree@2026
   ↓
2. Navegar a /app/catalogs/70ee255c-aa0f-48b4-a1cc-74e2c19d1242/design
   ↓
3. Expandir bloque "Sección de Presentación"
   ↓
4. Subir imagen de fondo ✅ Test 1
   ↓
5. Cambiar overlay Oscuro/Claro ✅ Test 2
   ↓
6. Ajustar opacidad ✅ Test 6
   ↓
7. Cambiar a Video y pegar URL ✅ Test 3
   ↓
8. Click "Guardar" ✅ Test 4
   ↓
9. F5 Recargar y verificar ✅ Test 4 (Persistencia)
   ↓
10. Volver y eliminar imagen ✅ Test 5
   ↓
11. Click "Guardar" nuevamente
    ↓
    ✅ PRUEBAS COMPLETADAS
```

---

## 📊 Checklist Final

### Funcionalidad
- [ ] Subir imagen funciona
- [ ] Eliminar imagen funciona
- [ ] Overlay oscuro/claro funciona
- [ ] Slider de opacidad funciona
- [ ] URL de video se puede ingresar
- [ ] Botón "Guardar" funciona
- [ ] Cambios persisten después de recargar

### UX/Feedback
- [ ] Spinner aparece durante upload
- [ ] "Guardando..." muestra durante proceso
- [ ] "✓ Guardado" confirma éxito
- [ ] Botones disabled cuando no se pueden usar
- [ ] No hay errores en consola
- [ ] Errores se muestran al usuario

### Performance
- [ ] Upload no es muy lento (<5 segundos)
- [ ] Preview actualiza en tiempo real
- [ ] Sin lag al cambiar sliders
- [ ] Recargar página es rápido

---

## 🆘 Troubleshooting

### Problema: Botón "Guardar" no funciona
```
1. Verificar que app esté corriendo
2. Abrir DevTools (F12)
3. Ver pestaña "Console"
4. Reportar cualquier error rojo
```

### Problema: Imagen no aparece en preview
```
1. Verificar que archivo sea imagen válida
2. Revisar tamaño (debe ser < 10MB)
3. Probar con otro archivo
4. Ver console para errores
```

### Problema: Cambios no persisten después de recargar
```
1. Click "Guardar" debe mostrar "✓ Guardado"
2. Verificar no hay errores en console
3. Revisar Network tab (F12) para requests fallidos
4. Verificar BD con PgAdmin
```

---

**Fecha:** 2026-05-15  
**Versión:** 1.0  
**Última Actualización:** Design Page Fix
