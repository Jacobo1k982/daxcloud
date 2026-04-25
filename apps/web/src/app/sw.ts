import { defaultCache } from '@serwist/next/worker';
import { Serwist, NetworkFirst, NetworkOnly, CacheFirst } from 'serwist';

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
    navigationPreload: true,
    runtimeCaching: [
        // ── Imágenes externas — nunca cachear, pasar directo ──
        {
            matcher: ({ url }) => url.origin !== self.location.origin && /\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(url.pathname),
            handler: new NetworkOnly(),
        },
        // ── Cualquier dominio externo — pasar directo ──
        {
            matcher: ({ url }) => url.origin !== self.location.origin,
            handler: new NetworkOnly(),
        },
        // ── API pública del catálogo — cache con red primero ──
        {
            matcher: ({ url }) => url.pathname.startsWith('/api/public/'),
            handler: new NetworkFirst({
                cacheName: 'api-public-cache',
                networkTimeoutSeconds: 10,
            }),
        },
        // ── API autenticada — red siempre ──
        {
            matcher: ({ url }) => url.pathname.startsWith('/api/'),
            handler: new NetworkOnly(),
        },
        // ── Imágenes subidas al servidor ──
        {
            matcher: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: new CacheFirst({
                cacheName: 'uploads-cache',
            }),
        },
        // ── Socket.io — nunca cachear ──
        {
            matcher: ({ url }) => url.pathname.startsWith('/socket.io/'),
            handler: new NetworkOnly(),
        },
        ...defaultCache,
    ],
});

serwist.addEventListeners();