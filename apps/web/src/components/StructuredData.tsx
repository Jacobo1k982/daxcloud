// Agrega este componente en apps/web/src/app/page.tsx
// Justo antes del cierre del div principal o dentro del <head> via metadata

// Uso: <StructuredData /> dentro del componente LandingPage

export function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DaxCloud POS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: 'Sistema POS multi-industria para América Latina. Gestiona ventas, inventario y sucursales desde un solo sistema.',
    url: 'https://daxcloud.shop',
    screenshot: 'https://daxcloud.shop/og-image.png',
    featureList: [
      'POS adaptativo por industria',
      'Control de inventario en tiempo real',
      'Multi-sucursal',
      'Analytics y reportes',
      'Módulo de restaurante con mesas',
      'Módulo de farmacia con lotes',
      'Módulo de peluquería con agenda',
      'Pago con SINPE Móvil',
      'Multi-moneda América Latina',
    ],
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '29',
      highPrice: '99',
      priceCurrency: 'USD',
      offerCount: '3',
    },
    author: {
      '@type': 'Organization',
      name: 'jacana-dev',
      url: 'https://jacana-dev.com',
    },
    inLanguage: 'es',
    availableLanguage: 'es',
    countriesSupported: 'CR, MX, CO, GT, HN, NI, PA, SV, DO, PE, CL, AR, BR, ES, US',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
