import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

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
        {
            matcher: ({ url }) => url.pathname.startsWith('/api/public/'),
            handler: new (await import('serwist')).NetworkFirst({
                cacheName: 'api-public-cache',
                networkTimeoutSeconds: 10,
            }),
        },
        {
            matcher: ({ url }) => url.pathname.startsWith('/api/'),
            handler: new (await import('serwist')).NetworkFirst({
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
            }),
        },
        ...defaultCache,
    ],
});

serwist.addEventListeners();