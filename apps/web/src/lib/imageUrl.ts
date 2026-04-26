/**
 * Construye la URL completa de una imagen de producto.
 * Nginx sirve los uploads en /uploads/ (sin /api/)
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // Ya es una URL absoluta
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api")
    .replace(/\/api\/?$/, ""); // https://daxcloud.shop

  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  // /uploads/products/uuid.jpg → https://daxcloud.shop/uploads/products/uuid.jpg
  // NO agregar /api/ porque Nginx sirve uploads directamente
  return `${base}${path}`;
}
