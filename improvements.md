# 🔍 Revisión Completa — El Atlante

Auditoría completa del proyecto: código fuente, base de datos Supabase, seguridad, UX y flujos funcionales (cliente, dueño, camarero).

---

## 🔴 CRÍTICOS — Seguridad

### 2. Archivo `.env` NO incluido en `.gitignore`
**Archivo:** `.gitignore`

El archivo `.env` contiene credenciales reales (URL de Supabase, clave anon) y **no está excluido** del control de versiones. Si el repo se publica, las credenciales se exponen.

**Solución:** Añadir `.env` a `.gitignore` inmediatamente.

---

### 3. Claves de Supabase hardcodeadas como fallback
**Archivo:** `supabase.ts:3-4`
```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sftdoiuqacbenefqewcr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ZUOdcZC0vO9CxPYhdTGdOA_vFcl5zYn';
```
**Impacto:** Las claves reales están en el código fuente compilado, incluso sin el `.env`.

**Solución:** Eliminar los valores fallback. Si las env vars no están configuradas, fallar con un error claro.

---

### 4. RLS Policies completamente abiertas en Supabase
**Tablas afectadas:** `reservations`, `client_meta`, `feedback`

| Tabla | Política | Problema |
|---|---|---|
| `reservations` | `Public full access on reservations` (`ALL`, `USING(true)`, `WITH CHECK(true)`) | Cualquier usuario anónimo puede **leer, editar y borrar** TODAS las reservas |
| `client_meta` | `Public full access on client_meta` (`ALL`, `USING(true)`, `WITH CHECK(true)`) | Datos de clientes (alergias, notas, etc.) completamente expuestos |
| `feedback` | `Allow anonymous inserts` (`INSERT`, `WITH CHECK(true)`) | Permite spam masivo de feedback |

**Impacto:** Un atacante puede acceder a la URL de Supabase desde el código fuente y manipular directamente todos los datos de la BBDD sin autenticación.

**Solución:** Implementar RLS con roles adecuados. Al mínimo: SELECT público en reservaciones (para el sistema), pero INSERT/UPDATE/DELETE restringido a roles autenticados.

---

### 5. CORS abierto a todo (`*`) en cloud functions
**Archivo:** `send-confirmation.ts:10`
```ts
'Access-Control-Allow-Origin': '*',
```
**Solución:** Restringir al dominio del proyecto.

---

### 6. Sin protección real de rutas admin
**Archivos:** `AdminPanel.tsx:61`, `WaiterPanel.tsx:72`

Solo se verifica `sessionStorage.admin_role`:
```ts
if (sessionStorage.getItem('admin_role') !== 'owner') navigate('/admin');
```
Cualquier usuario puede setear `sessionStorage.admin_role = 'owner'` en la consola del navegador y acceder al panel.

**Solución:** Implementar autenticación real del lado del servidor.

---

## 🟠 BUGS — Errores funcionales

### 7. ⚡ Enum de preferencia desincronizado (BBDD vs Frontend)
**Problema crítico:** La base de datos tiene el tipo enum `reservation_preference` con **3 valores**:
- `Indiferente`, `Interior`, `Terraza exterior`

Pero el frontend ofrece **4 opciones** (en `Reservations.tsx:304`, `AdminPanel.tsx:768`):
- `Indiferente`, `Interior`, **`Mesas altas`**, `Terraza exterior`

**Impacto:** Si un cliente selecciona "Mesas altas", la inserción en Supabase **fallará** con un error de constraint violation.

**Solución:** Añadir `Mesas altas` al enum en la BBDD, o actualizar el frontend para coincidir con la BBDD.

---

### 8. Parsing de invitados incorrecto en formulario de reservas
**Archivo:** `Reservations.tsx:84,91`
```ts
const guestCount = parseInt(formData.guests);
// formData.guests puede ser "2 Personas" → parseInt("2 Personas") = 2 ✓
// Pero el valor por defecto es "2 Personas", no "2"
```
Aunque `parseInt` funciona con "2 Personas" → 2, los valores de los `<option>` son realmente `"1"`, `"2"`, etc. Sin embargo, el **valor por defecto** en `useState` es `'2 Personas'` (línea 13), que no coincide con ningún `value` del `<option>` (que usan `"1"`, `"2"`, etc.).

**Impacto:** El select podría no mostrar correctamente la opción seleccionada por defecto y podría enviar un valor incorrecto.

**Solución:** Cambiar el valor por defecto a `'2'` en vez de `'2 Personas'`.

---

### 9. Conflicto en la lógica de dark mode
**Archivos:** `index.html:13-19` vs `Header.tsx:12-20`

Hay **dos sistemas compitiendo** para controlar el dark mode:
- `index.html`: Script inline que usa `prefers-color-scheme` para añadir/quitar clase `dark`
- `Header.tsx`: Lee/escribe `localStorage.theme` y gestiona la clase `dark`

Si el usuario cambia el tema en el Header, funciona. Pero al cargar la página, el script de `index.html` ignora la preferencia guardada en `localStorage.theme` y sigue el sistema operativo.

**Solución:** Unificar: usar el script de `index.html` para respetar `localStorage.theme` si existe, con fallback a `prefers-color-scheme`.

---

### 10. `handleSeatFromWaitlist` sobrescribe datos del cliente
**Archivo:** `WaiterPanel.tsx:141-153`

Al sentar a alguien de la lista de espera, **se sobrescriben** el nombre, teléfono y email con valores genéricos:
```ts
name: walkInName,    // "Walk-in 14:30"
phone: 'Walk-in',
email: '',
```
Pero el cliente ya tiene nombre y datos de la lista de espera.

**Impacto:** Se pierde la información del cliente.

**Solución:** No sobrescribir `name`/`phone`/`email`.

---

### 11. Función `getWeeklyComparison` carga TODAS las reservas
**Archivo:** `reservationStore.ts:384-386`
```ts
const { data, error } = await supabase
    .from('reservations')
    .select('date, status');
```
Sin filtro de fecha, carga todas las reservas de la base de datos y las filtra en el cliente.

**Impacto:** Performance pobre con muchos datos.

**Solución:** Filtrar en la query de Supabase con `.gte('date', startOfLastWeek)`.

---

### 12. `getNoShowRate` calcula sobre TODA la historia
**Archivo:** `reservationStore.ts:413-420`

Similar al anterior: carga todas las reservas y calcula el ratio globalmente, no por periodo.

---

### 13. `getClientProfiles` carga TODAS las reservas
**Archivo:** `reservationStore.ts:425-428`

Carga todo el historial sin paginación ni filtro.

---

### 14. `addWalkIn` no incluye `email` en la inserción
**Archivo:** `reservationStore.ts:180-193`

El campo `email` no se incluye, quedando como `null` en la BBDD. Esto impide la asociación CRM que usa email como clave.

---

### 15. Dead code en `addToWaitList`
**Archivo:** `reservationStore.ts:236-240`

El bloque `if (phone && phone !== 'Walk-in' && !newR.is_walk_in)` nunca se ejecuta porque `is_walk_in` siempre es `true` en esta función, y el cuerpo del if está vacío.

---

## 🟡 MEJORAS DE UX/UI

### 16. © 2024 en el footer — debería ser 2025 o 2026
**Archivo:** `Footer.tsx:38`
```html
<p>© 2024 El Atlante de San Cristóbal</p>
```
**Solución:** Usar `new Date().getFullYear()` para que sea dinámico.

---

### 17. No hay ruta 404 / catch-all
**Archivo:** `App.tsx:113-122`

Si un usuario navega a una URL inexistente (ej: `/contacto`), no se muestra nada, solo una página en blanco.

**Solución:** Añadir `<Route path="*" element={<NotFound />} />`.

---

### 18. No hay meta description en `index.html`
**Archivo:** `index.html`

Falta el tag `<meta name="description">` para SEO.

---

### 19. HTML lang="en" debería ser "es"
**Archivo:** `index.html:2`
```html
<html lang="en">
```
El sitio está completamente en español.

---

### 20. Navegación móvil sin menú hamburguesa
**Archivo:** `Header.tsx:84`
```html
<nav className="hidden md:flex …">
```
En móvil los links de navegación (Inicio, Carta, Nosotros) están completamente ocultos. No hay menú hamburger.

**Impacto:** En móvil solo se ven el logo, toggle de dark mode y botón Reservar.

---

### 21. El formulario de reserva no valida fecha pasada correctamente
**Archivo:** `Reservations.tsx:264`

El atributo `min` se establece con `new Date().toISOString().split('T')[0]`, pero la zona horaria del usuario podría no coincidir con la del restaurante (Atlantic/Canary). Si es medianoche en otra zona pero no en Canarias, podría permitir/bloquear fechas incorrectamente.

---

### 22. No hay indicación de carga al hacer submit de reserva
**Archivo:** `Reservations.tsx:346`

El formulario no muestra loading state al enviar, el usuario podría hacer múltiples clicks.

---

### 23. El selector de hora no restringe rango
**Archivo:** `Reservations.tsx:271-272`

El `<input type="time">` permite seleccionar cualquier hora (00:00-23:59). Debería limitar al rango de apertura (12:30-23:00 o 12:30-16:30 para domingos).

---

### 24. Kanban del AdminPanel con solo 4 columnas visibles (de 5 definidas)
**Archivo:** `AdminPanel.tsx:310`
```html
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
```
`KANBAN_COLUMNS` tiene 5 columnas, pero el grid solo muestra 4 en XL (`xl:grid-cols-4`). La 5ª columna se apila debajo.

**Solución:** Cambiar a `xl:grid-cols-5`.

---

### 25. Iconos de preferencia incompletos en WaiterPanel
**Archivo:** `WaiterPanel.tsx:463`
```ts
{r.preference === 'Terraza exterior' ? '☀️ Terraza' : r.preference === 'Interior' ? '🏠 Interior' : '🔄'}
```
"Mesas altas" no tiene icono específico, muestra solo 🔄.

---

## 🔵 MEJORAS TÉCNICAS / Código

### 26. Font "Work Sans" cargada dos veces
**Archivos:** `index.html:10` y `index.css:1`

Ambos cargan la misma fuente de Google Fonts, lo que ralentiza la carga.

**Solución:** Eliminar la carga duplicada de `index.html` (basta con la del CSS que es procesada por Vite).

---

### 27. Material Symbols Outlined importado pero sin uso
**Archivo:** `index.css:2`
```css
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined…");
```
No se encontró ningún uso de esta fuente de iconos en el proyecto. Los iconos inline usan SVGs.

**Impacto:** Descarga innecesaria de ~400KB.

---

### 28. Archivos de starter no eliminados
**Archivos:**
- `src/assets/react.svg`
- `src/assets/vite.svg`
- `src/assets/hero.png` (no referenciado en el código)

Son archivos residuales de la plantilla de Vite que no se usan.

---

### 29. `AdminPanel.tsx` es un archivo monolítico de 800 líneas
Contiene 5 componentes (`AdminPanel`, `KanbanView`, `KanbanCard`, `DashboardView`, `CRMView`, `ManualReservationModal`) en un solo archivo.

**Solución:** Separar en archivos individuales bajo un directorio `admin/`.

---

### 30. Tipo `any` usado en muchos lugares
**Archivos:** `reservationStore.ts:60`, `AdminPanel.tsx:691`, y otros.

```ts
function mapToReservation(data: any): Reservation { … }
```
**Solución:** Generar tipos TypeScript desde Supabase con `mcp_supabase-mcp-server_generate_typescript_types` y usarlos.

---

### 31. Índice no utilizado en la BBDD
**Tabla:** `reservations`
**Índice:** `idx_reservations_phone`

El advisor de Supabase reporta que este índice nunca ha sido usado.

**Solución:** Evaluar si es necesario. Si no, eliminarlo para reducir overhead de escritura.

---

### 32. `favicon.ico` de 721 bytes + `favicon.png` de 721 bytes
Probablemente son el mismo archivo en diferente formato. Verificar que los favicons son correctos y representan la marca.

---

### 33. Falta de `apple-touch-icon.png` en `/public`
**Referencia:** `App.tsx:52`
```ts
appleIcon.setAttribute('href', '/apple-touch-icon.png');
```
Pero este archivo no existe en `/public`. Solo existe `pwa-192x192.png`.

---

### 34. PWA scope limitado a `/admin/`
**Archivo:** `vite.config.ts:19-20`
```ts
scope: '/admin/',
start_url: '/admin/',
```
Si un usuario intenta instalar la PWA desde la Home, la app se abriría directamente en `/admin/`. Esto puede ser intencional, pero debería documentarse.

---

## 📊 Resumen por categoría

| Categoría | Cantidad | Severidad |
|---|---|---|
| 🔴 Seguridad | 6 | Crítica |
| 🟠 Bugs | 9 | Alta |
| 🟡 UX/UI | 10 | Media |
| 🔵 Técnicas/Código | 9 | Baja-Media |
| **Total** | **34** | — |

---

## 🎯 Prioridad recomendada

1. **Inmediato:** Añadir `.env` a `.gitignore`, quitar PINs visibles de la UI
2. **Urgente:** Arreglar enum `Mesas altas` (reservas fallan), implementar RLS adecuado
3. **Importante:** Unificar dark mode, arreglar `handleSeatFromWaitlist`, añadir ruta 404
4. **Mejora:** Optimizar queries, separar componentes, eliminar assets no usados
