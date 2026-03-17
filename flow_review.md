# Informe de Revisión de Flow - El Atlante

He realizado una revisión exhaustiva de los flujos de **Camarero** y **Cliente**, analizando el código fuente (`WaiterPanel.tsx`, `Reservations.tsx`, `reservationStore.ts`), la base de datos en Supabase y verificando el comportamiento en el navegador.

## 🚨 Problemas Críticos Encontrados

### 1. Pérdida de Datos al Sentar desde Lista de Espera
**Descripción**: Tal como sospechabas, al sentar a un cliente que está en la lista de espera, el sistema pierde su nombre y teléfono.
- **Causa**: La función `handleSeatFromWaitlist` en `WaiterPanel.tsx` llama a `addWalkIn(guests, tableNumber)`, la cual crea una reserva nueva con el nombre genérico "Walk-in HH:MM" y teléfono "Walk-in". Luego, la reserva original de la lista de espera se marca como cancelada.
- **Impacto**: Se pierde el rastro del cliente en el CRM y las estadísticas muestran una cancelación y un walk-in en lugar de una reserva sentada.

### 2. Falta de Validación de Horarios y Días
**Descripción**: El flujo de cliente permite realizar reservas en cualquier fecha y hora.
- **Causa**: El componente `Reservations.tsx` usa inputs de tipo `date` y `time` sin validaciones contra el horario real del restaurante o días de cierre.
- **Impacto**: Los clientes podrían reservar a las 4:00 AM o en días que el restaurante está cerrado, generando frustración.

## ⚠️ Problemas de Experiencia y Consistencia

### 3. Falta de Visibilidad de la Lista de Espera en el Panel de Dueño
**Descripción**: El "Kanban" del `AdminPanel.tsx` no muestra la columna de "En Espera".
- **Impacto**: El dueño/administrador no tiene visibilidad en tiempo real de cuánta gente hay esperando físicamente en el local desde su panel global.

### 4. Limitación en el Número de Comensales (Web)
**Descripción**: En el formulario web, al seleccionar "Más de 4", el sistema guarda internamente siempre `5`.
- **Impacto**: Grupos de 6, 8 o más personas no pueden indicar su número real de comensales a menos que lo escriban en notas (y el sistema no lo contabiliza bien para la ocupación).

### 5. Doble Reserva No Controlada
**Descripción**: No existe una validación que impida que un mismo número de teléfono o email haga múltiples reservas para el mismo momento.
- **Impacto**: Vulnerabilidad a spam o errores de usuario que bloquean disponibilidad real.

### 6. Flujo de Confirmación por Email (Feedback)
**Descripción**: El botón de confirmación en el email redirige directamente al sitio web tras actualizar el estado.
- **Gaps**: Si hay un error en la actualización, el usuario no recibe un mensaje claro de error; simplemente es redirigido.

## 🔍 Otros Detalles Técnicos

- **Nomenclatura**: La tabla `reservations` usa `is_walk_in` para marcar si fue una entrada directa, lo cual es correcto, pero se aplica también a la lista de espera, lo cual es debatible (técnicamente son walk-ins que esperan).
- **Notas de CRM**: Las notas de alergias y preferencias se guardan correctamente en `client_meta`, pero el flujo de "sentar" (punto 1) rompe la conexión al no usar el teléfono correcto.

---
**Nota**: No se han realizado cambios en el código siguiendo tus instrucciones. Este documento sirve como diagnóstico para las siguientes fases de desarrollo.
