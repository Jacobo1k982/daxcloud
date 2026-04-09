/**
 * Construye la URL completa de una imagen de producto.
 *
 * Casos:
 *  - URL externa (https://...) → se devuelve tal cual
 *  - URL relativa del API (/uploads/products/...) → se prefija con la base del API
 *  - null/undefined → devuelve null
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // Ya es una URL absoluta (externa o CDN)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // URL relativa del servidor — construir con base del API
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api')
    .replace(/\/api\/?$/, ''); // quita el /api del final: https://daxcloud.shop

  // /uploads/products/uuid.jpg → https://daxcloud.shop/api/uploads/products/uuid.jpg
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${apiBase}/api${path}`;
}
