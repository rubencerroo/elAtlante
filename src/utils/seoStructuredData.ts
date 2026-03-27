import { CONTACT_INFO } from '../constants/contact';

/**
 * Structured Data (JSON-LD) types based on Schema.org
 * Used for improving SEO and Google Search Gallery features.
 */

export interface RestaurantStructuredData {
  '@context': 'https://schema.org';
  '@type': 'Restaurant';
  name: string;
  image: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  url: string;
  telephone: string;
  servesCuisine: string;
  priceRange: string;
  menu: string;
  description: string;
  openingHoursSpecification: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }>;
  acceptsReservations?: string;
  sameAs?: string[];
  potentialAction?: any;
}

export const RESTAURANT_BASE_DATA: RestaurantStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: "El Atlante de San Cristóbal",
  image: "https://elatlantedesancristobal.com/logo-icon.svg",
  address: {
    '@type': 'PostalAddress',
    streetAddress: CONTACT_INFO.address.street,
    addressLocality: "Las Palmas de Gran Canaria",
    postalCode: "35001",
    addressCountry: "ES"
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 28.0934,
    longitude: -15.4165
  },
  url: "https://elatlantedesancristobal.com",
  telephone: CONTACT_INFO.landline.raw,
  servesCuisine: "Canaria, Pescado, Mariscos",
  priceRange: "€€",
  menu: "https://elatlantedesancristobal.com/carta",
  description: "Restaurante especializado en pescado fresco y gastronomía canaria en San Cristóbal, Las Palmas. Tradición pesquera y producto Km 0 con terraza frente al mar.",
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ["Monday", "Thursday", "Friday", "Saturday"],
      opens: "12:30",
      closes: "23:00"
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: "Sunday",
      opens: "12:30",
      closes: "16:30"
    }
  ],
  acceptsReservations: "true",
  sameAs: [
    "https://www.instagram.com/restaurante_elatlante",
    "https://www.facebook.com/elatlantedesancristobal/"
  ],
  potentialAction: {
    "@type": "ReserveAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://elatlantedesancristobal.com/reservar",
      "inLanguage": ["es", "en"],
      "actionPlatform": [
        "https://schema.org/DesktopWebPlatform",
        "https://schema.org/IOSWebPlatform",
        "https://schema.org/AndroidWebPlatform"
      ]
    },
    "result": {
      "@type": "FoodEstablishmentReservation",
      "name": "Reserva tu mesa"
    }
  }
};

/**
 * Generates LocalBusiness structured data
 */
export function getLocalBusinessData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: "El Atlante de San Cristóbal",
    image: "https://elatlantedesancristobal.com/logo-icon.svg",
    "@id": "https://elatlantedesancristobal.com",
    url: "https://elatlantedesancristobal.com",
    telephone: CONTACT_INFO.landline.raw,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT_INFO.address.street,
      addressLocality: "Las Palmas de Gran Canaria",
      postalCode: "35001",
      addressCountry: "ES"
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 28.0934,
      longitude: -15.4165
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ["Monday", "Thursday", "Friday", "Saturday"],
        opens: "12:30",
        closes: "23:00"
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: "Sunday",
        opens: "12:30",
        closes: "16:30"
      }
    ]
  };
}

/**
 * Generates Organization structured data with Logo
 */
export function getOrganizationData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "El Atlante de San Cristóbal",
    url: "https://elatlantedesancristobal.com",
    logo: "https://elatlantedesancristobal.com/logoblack.png",
    sameAs: [
      "https://www.instagram.com/restaurante_elatlante",
      "https://www.facebook.com/elatlantedesancristobal/"
    ]
  };
}

/**
 * Generates WebSite structured data
 */
export function getWebSiteData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "El Atlante de San Cristóbal",
    url: "https://elatlantedesancristobal.com",
    potentialAction: {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://elatlantedesancristobal.com/?s={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Generates BreadcrumbList structured data
 */
export function getBreadcrumbList(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://elatlantedesancristobal.com${item.url}`
    }))
  };
}

/**
 * Generates Menu structured data (simplified)
 */
export function getMenuData(language: 'es' | 'en' = 'es') {
  const pdfFileName = language === 'en' ? 'carta_en.pdf' : 'carta_es.pdf';
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: language === 'en' ? 'Menu - El Atlante' : 'Carta - El Atlante',
    url: `https://elatlantedesancristobal.com/assets/pdf/${pdfFileName}`,
    mainEntityOfPage: "https://elatlantedesancristobal.com/carta",
    hasMenuSection: [
      {
        "@type": "MenuSection",
        "name": language === 'en' ? "Main Courses" : "Platos Principales",
        "description": language === 'en' ? "Fresh fish and local delicacies" : "Pescado fresco y delicias locales"
      }
    ]
  };
}
