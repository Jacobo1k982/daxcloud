import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/login', '/pricing'],
        disallow: [
          '/dashboard',
          '/pos',
          '/products',
          '/inventory',
          '/sales',
          '/analytics',
          '/clients',
          '/branches',
          '/settings',
          '/restaurant',
          '/salon',
          '/pharmacy',
          '/bakery',
          '/clothing',
          '/produce',
          '/admin',
        ],
      },
    ],
    sitemap: 'https://daxcloud.shop/sitemap.xml',
    host: 'https://daxcloud.shop',
  };
}
