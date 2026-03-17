# Auditoría y Mejoras SEO - El Atlante de San Cristóbal

Este documento detalla el estado actual del SEO del proyecto y las mejoras recomendadas para optimizar la visibilidad en motores de búsqueda y la apariencia en redes sociales.

## 1. Estado Actual (Resumen)

*   **Puntos Positivos:**
    *   Configuración básica de `lang="es"`.
    *   Presencia de `title` y `description` base en `index.html`.
    *   Uso de etiquetas semánticas básicas (`h1`, `h2`).
    *   Imágenes de platos con texto alternativo (`alt`).
    *   Carga de fuentes optimizada y diseño responsive.

*   **Áreas de Mejora:**
    *   Ausencia de etiquetas **Open Graph** y **Twitter Cards**.
    *   Falta de archivos esenciales: `robots.txt` y `sitemap.xml`.
    *   No hay gestión dinámica de metadatos por página (títulos únicos para /reservar, /aviso-legal, etc.).
    *   Falta de **Datos Estructurados (JSON-LD)** para negocios locales (Restaurante).
    *   La pantalla de "Coming Soon" puede afectar el indexado si no se gestiona correctamente.

---

## 2. Mejoras Recomendadas

### A. Metadatos y Redes Sociales (Etiquetas Meta)
Actualmente, el sitio carece de previsualizaciones ricas cuando se comparte en WhatsApp, Facebook o Twitter.

**Acciones:**
1.  Añadir etiquetas Open Graph a `index.html`:
    ```html
    <meta property="og:title" content="El Atlante de San Cristóbal | Sabor del Mar" />
    <meta property="og:description" content="Tradición pesquera y producto Km 0 en un entorno inigualable frente al Atlántico. ¡Reserva tu mesa!" />
    <meta property="og:image" content="/og-image.jpg" />
    <meta property="og:url" content="https://elatlante.com" />
    <meta property="og:type" content="website" />
    ```
2.  Añadir etiquetas Twitter Card:
    ```html
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="El Atlante de San Cristóbal" />
    <meta name="twitter:description" content="Sabor del mar en el corazón de San Cristóbal." />
    ```

### B. Gestión Dinámica (React Helmet)
El título del navegador siempre es el mismo. Cada página debería tener su propio título.

**Acción:**
*   Instalar `react-helmet-async` y configurar títulos dinámicos:
    *   Home: `El Atlante | Sabor del Mar en San Cristóbal`
    *   Reservas: `Reservar Mesa | El Atlante de San Cristóbal`
    *   Legal: `Aviso Legal | El Atlante`

### C. Archivos de Indexación
Google necesita guías para rastrear el sitio de manera eficiente.

**Acciones:**
1.  Crear `public/robots.txt`:
    ```text
    User-agent: *
    Allow: /
    Disallow: /admin/
    Sitemap: https://elatlante.com/sitemap.xml
    ```
2.  Crear `public/sitemap.xml` listando las rutas principales (`/`, `/reservar`, `/aviso-legal`, etc.).

### D. Datos Estructurados (JSON-LD)
Esto permite que Google muestre "fragmentos enriquecidos" (estrellas, horario, precio) directamente en los resultados de búsqueda.

**Acción:** Añadir un script de tipo `application/ld+json` en la Home:
```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "El Atlante de San Cristóbal",
  "image": "https://elatlante.com/logo.png",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Calle Marina, 81",
    "addressLocality": "Las Palmas de Gran Canaria",
    "postalCode": "35001",
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 28.0934, 
    "longitude": -15.4165
  },
  "url": "https://elatlante.com",
  "telephone": "+34928584422",
  "servesCuisine": "Canaria, Pescado, Mariscos",
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Thursday", "Friday", "Saturday"],
      "opens": "12:30",
      "closes": "23:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "12:30",
      "closes": "16:30"
    }
  ]
}
```

### E. Optimización de Contenido y Semántica
1.  **Jerarquía de Encabezados**: Revisar que solo haya un `h1` por página. En la Home es correcto, pero hay que asegurar que en `/reservar` el título principal sea un `h1`.
2.  **Atributos Alt**: Revisar imágenes decorativas. Si son puramente visuales, `alt=""`. Si aportan contenido (como los platos), usar descripciones ricas: `alt="Plato de Pulpo a la Carmela con pimientos"`.
3.  **Enlaces Internos**: Asegurar que todos los enlaces usen el componente `Link` de `react-router-dom` para mantener la SPA sin recargas, lo cual mejora la métrica de navegación.

---

## 3. Próximos Pasos Sugeridos

1.  Generar una imagen de previsualización (OG Image) de 1200x630px.
2.  Implementar `react-helmet-async`.
3.  Desplegar los archivos `robots.txt` y `sitemap.xml`.
4.  Validar el sitio en [Google Search Console](https://search.google.com/search-console).
