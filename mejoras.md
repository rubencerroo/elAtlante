# Mejoras Sugeridas para El Atlante

## 1. Experiencia del Cliente (UX/UI y Funcionalidad)
*   **Menú Interactivo en lugar de PDF**: La sección "Carta" actualmente enlaza a un archivo PDF (`carta_es.pdf`). Crear una página de menú web interactiva nativa (con componentes de React) mejoraría significativamente la usabilidad en dispositivos móviles, el SEO y la accesibilidad para usuarios con lectores de pantalla.
*   **Formulario de Reserva**:
    *   **Inconsistencia de Lógica**: El formulario mostró el estado "Cerrado este día" mientras que la página de inicio indicaba que el restaurante estaba abierto. Existe una discrepancia entre el horario mostrado comercialmente y la lógica estricta de bloqueo de reservas que debe depurarse.
    *   **Inicialización de Fecha**: El campo de seleccion de fecha de la reserva aparece vacío por defecto. Debería inicializarse con el día actual (o el próximo disponible) para un flujo de reserva más rápido.
    *   **Accesibilidad Táctil**: El *checkbox* de aceptación de políticas y términos es demasiado pequeño en su área de pulsación (hitbox), lo que dificulta su selección en pantallas táctiles.
*   **Contraste del Hero (Página Principal)**: El título blanco sobre la imagen de fondo principal puede perder legibilidad según el dispositivo y la carga de brillo de la foto. Se sugiere añadir una leve sombra de texto (*text-shadow*) o un *overlay* (capa oscura semi-transparente) detrás del texto hero.

## 2. Panel de Staff (Administrador y Camarero)
*   **Contraste Crítico en "Mesa Rápida"**: En el modal de "Mesa Rápida" del panel de camareros, el botón de "Sentar ahora" presenta un contraste muy bajo (texto oscuro sobre un verde oscuro). Esto supone un riesgo de visibilidad en un entorno de restaurante rápido e iluminado.
*   **Micro-tipografía en Zonas**: Las etiquetas de algunas zonas en los mapas/paneles táctiles tienen un tamaño de fuente excesivamente pequeño (aprox. 9px), lo que dificulta una lectura ágil en tablets posadas sobre las barras o estaciones.
*   **Consistencia de Modos (Claro vs Oscuro)**: El panel de staff utiliza exclusivamente un modo oscuro mientras que el sitio del cliente es claro. Es vital asegurar que cualquier componente compartido de interfaz (ej. dropdowns, inputs genéricos) se renderice debidamente dependiendo de si se carga en el admin o en la web del cliente.
*   **Error Crítico RLS (Supabase)**: Según reportes de logs de la aplicación de admin, ocurre un error de "recursión infinita (infinite recursion)" en las políticas Row Level Security (RLS) de Supabase, específicamente al acceder a la tabla de `staff_profiles`. Esto requiere una revisión inmediata de las políticas en SQL para evitar cuelgues de sesión.

## 3. Arquitectura y Base de Datos (Supabase)
*   **Falta de Entidad de Mesas (`tables`)**: La tabla `reservations` guarda `table_number` (Integer) y `assigned_tables` (Text), pero no hay una tabla real `tables` en la base de datos (DB). Toda la gestión de capacidad y asignación vive en lógica estática de frontend. Crear una tabla `tables` independiente (ID, número, capacidad máxima, ubicación (interior/terraza)) permitiría comprobaciones de aforo dinámicas y sorting real en la base de datos.
*   **Normalización de Clientes (`client_meta`)**: Aunque `client_meta` usa acertadamente `phone` como Primary Key, mantiene una columna duplicada u opcional de `email`. Para evitar inconsistencias cuando un cliente vuelva a reservar, es mejor centralizar los datos fijos del usuario.
*   **Falta de Auditoría de Estados**: La tabla de reservas solo tiene un campo estático `status` ('pending', 'seated', etc). Creando una tabla extra de `reservation_status_logs` se podría calcular métricas vitales: tiempo medio esperando mesa, duración promedio de la comida (desde *seated* hasta *completed*), etc.
*   **Uso conflictivo de Text para asignaciones**: La columna `assigned_tables` guarda los datos como Texto (String) en vez de un array nativo de la base de datos (ej. Integer[]). Esto hace complicado y poco eficiente el filtrado por SQL de si una mesa concreta está ocupada o no consultando las reservas.
