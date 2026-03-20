<div align="center">
  <img src="./public/screenshots/logo.png" alt="El Atlante Logo" width="200" />
  
  # 🌊 El Atlante
  
  ### *El sabor del Mar en el corazón de San Cristóbal*
  
  [![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.99.2-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![PWA](https://img.shields.io/badge/PWA-Ready-FF6F00?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

  <p align="center">
    <b>Sistema integral de gestión de reservas para el Restaurante El Atlante.</b>
    <br />
    Una experiencia digital premium para clientes y una herramienta potente para el equipo.
  </p>

  ---
  
  <img src="./public/screenshots/mockup.png" alt="El Atlante Mockup" width="100%" />

</div>

## ✨ Características Principales

### 🍽️ Experiencia del Cliente
- **Reservas en Tiempo Real**: Proceso intuitivo y fluido para asegurar tu mesa.
- **Diseño Adaptativo**: Experiencia optimizada para móviles, tablets y escritorio.
- **Personalización**: Opciones para indicar preferencias, eventos especiales y más.
- **Confirmaciones Instantáneas**: Notificaciones automáticas vía email/SMS.

### 📊 Panel de Administración
- **Dashboard de Estadísticas**: Visualización de datos clave, fuentes de reserva y proyecciones.
- **Gestión Kanban**: Control total del estado de las reservas (Confirmadas, Pendientes, Canceladas).
- **Notas de Turno**: Comunicación fluida entre el equipo para cada servicio.
- **Control de Clientes VIP**: Indicadores para mejorar la atención personalizada.

### 🏃 Panel de Camarero (Modo Tablet)
- **Vista Rápida**: Gestión ágil de las reservas del día.
- **Acceso por PIN**: Entrada rápida y segura para el personal en sala.
- **Estado de Mesas**: Supervisión en tiempo real de la capacidad del restaurante.

## 📸 Capturas de Pantalla

````carousel
![Inicio - Experiencia Gastronómica](./public/screenshots/hero.png)
<!-- slide -->
![Reservas - Formulario Premium](./public/screenshots/reservations.png)
<!-- slide -->
![Acceso Rápido - Panel de Staff](./public/screenshots/admin.png)
````

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Estilos**: Tailwind CSS + Framer Motion (Animaciones)
- **Backend & DB**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Estado**: Context API + Custom Hooks
- **Gráficos**: Recharts
- **PWA**: Vite PWA Plugin

## 🚀 Instalación y Desarrollo

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/rubencerroo/elAtlante.git
   cd elAtlante
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz con:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   VITE_COMING_SOON_PASSWORD=password_opcional
   ```

4. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

## 📱 PWA & Offline

El Atlante está configurado como una **Progressive Web App**. Puedes instalarla en cualquier dispositivo móvil o escritorio para un acceso directo y una experiencia similar a una app nativa, con soporte para notificaciones push y carga optimizada.

---
