import { Helmet } from 'react-helmet-async';
import { RESTAURANT_BASE_DATA } from '../utils/seoStructuredData';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: object | object[];
  includeBaseRestaurantSchema?: boolean;
}

const SEO = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData,
  includeBaseRestaurantSchema = false,
}: SEOProps) => {
  const siteName = 'El Atlante de San Cristóbal';
  const defaultDescription = 'Restaurante especializado en pescado fresco y gastronomía canaria en San Cristóbal, Las Palmas. Tradición pesquera y producto Km 0 con terraza frente al mar de Gran Canaria.';
  const fullTitle = title && title !== siteName ? `${title} | ${siteName}` : siteName;
  const domain = 'https://elatlantedesancristobal.com';
  const fullCanonical = canonical ? `${domain}${canonical}` : domain;
  const metaDescription = description || defaultDescription;

  // Prepare structured data
  const schemas = [];
  if (includeBaseRestaurantSchema) {
    schemas.push(RESTAURANT_BASE_DATA);
  }
  if (structuredData) {
    if (Array.isArray(structuredData)) {
      schemas.push(...structuredData);
    } else {
      schemas.push(structuredData);
    }
  }

  return (
    <Helmet>
      {/* Base metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || metaDescription} />
      <meta property="og:url" content={fullCanonical} />
      {ogImage && <meta property="og:image" content={`${domain}${ogImage}`} />}

      {/* Twitter */}
      <meta name="twitter:title" content={twitterTitle || ogTitle || fullTitle} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || metaDescription} />
      {twitterImage && <meta name="twitter:image" content={`${domain}${twitterImage}`} />}

      {/* Structured Data */}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
