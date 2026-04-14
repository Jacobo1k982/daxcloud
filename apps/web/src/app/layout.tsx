import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300','400','500','600','700','800','900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://daxcloud.shop'),
  title: {
    default: 'DaxCloud — Sistema POS para América Latina',
    template: '%s | DaxCloud POS',
  },
  description: 'Sistema POS multi-industria para América Latina. Gestiona ventas, inventario y sucursales desde un solo lugar. Restaurante, farmacia, peluquería, tienda y más. 14 días gratis.',
  keywords: [
    'sistema POS', 'punto de venta', 'POS América Latina', 'software ventas',
    'inventario', 'facturación', 'restaurante POS', 'farmacia POS',
    'POS Costa Rica', 'POS México', 'POS Colombia',
    'sistema de ventas', 'caja registradora', 'SINPE móvil',
    'daxcloud', 'multi-sucursal', 'multi-industria',
  ],
  authors: [{ name: 'jacana-dev', url: 'https://jacana-dev.com' }],
  creator: 'jacana-dev',
  publisher: 'DaxCloud',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CR',
    url: 'https://daxcloud.shop',
    siteName: 'DaxCloud POS',
    title: 'DaxCloud — Sistema POS para América Latina',
    description: 'Gestiona ventas, inventario y sucursales desde un solo sistema. Multi-industria, multi-moneda. 14 días gratis, sin tarjeta.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DaxCloud POS — Sistema multi-industria para América Latina',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DaxCloud — Sistema POS para América Latina',
    description: 'Gestiona ventas, inventario y sucursales. Multi-industria, 14 días gratis.',
    images: ['/og-image.png'],
    creator: '@jacanadev',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://daxcloud.shop',
    languages: {
      'es-CR': 'https://daxcloud.shop',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={outfit.variable}>
      <head>
        <meta name="theme-color" content="#FF5C35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={outfit.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
