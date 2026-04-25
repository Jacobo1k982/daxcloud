import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkOnly, NetworkFirst, CacheFirst } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (string | { url: string; revision?: string | null })[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // Socket.io — nunca cachear
    {
      matcher: ({ url }) => url.pathname.startsWith("/socket.io/"),
      handler: new NetworkOnly(),
    },
    // Dominios externos — nunca cachear
    {
      matcher: ({ url }) => url.origin !== self.location.origin,
      handler: new NetworkOnly(),
    },
    // API — nunca cachear
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    // Imágenes subidas — cache con red primero para siempre tener la última versión
    {
      matcher: ({ url }) => url.pathname.startsWith("/uploads/"),
      handler: new NetworkFirst({
        cacheName: "uploads-cache",
        networkTimeoutSeconds: 5,
      }),
    },
    // Páginas del dashboard — siempre red primero
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/dashboard") ||
        url.pathname.startsWith("/pos") ||
        url.pathname.startsWith("/products") ||
        url.pathname.startsWith("/inventory") ||
        url.pathname.startsWith("/analytics") ||
        url.pathname.startsWith("/clients") ||
        url.pathname.startsWith("/sales") ||
        url.pathname.startsWith("/settings"),
      handler: new NetworkFirst({
        cacheName: "dashboard-cache",
        networkTimeoutSeconds: 5,
      }),
    },
    // Assets estáticos — cache primero
    ...defaultCache,
  ],
});

serwist.addEventListeners();
