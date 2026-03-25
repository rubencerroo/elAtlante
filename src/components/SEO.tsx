import { Helmet } from 'react-helmet-async';

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
}: SEOProps) => {
  const siteName = 'El Atlante de San Cristóbal';
  const fullTitle = title && title !== siteName ? `${title} | ${siteName}` : siteName;
  const domain = 'https://elatlantedesancristobal.com';
  const fullCanonical = canonical ? `${domain}${canonical}` : domain;

  return (
    <Helmet>
      {/* Base metadata */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={ogTitle || fullTitle} />
      {ogDescription && <meta property="og:description" content={ogDescription || description} />}
      <meta property="og:url" content={fullCanonical} />
      {ogImage && <meta property="og:image" content={`${domain}${ogImage}`} />}

      {/* Twitter */}
      <meta name="twitter:title" content={twitterTitle || ogTitle || fullTitle} />
      {twitterDescription && (
        <meta name="twitter:description" content={twitterDescription || ogDescription || description} />
      )}
      {twitterImage && <meta name="twitter:image" content={`${domain}${twitterImage}`} />}
    </Helmet>
  );
};

export default SEO;
