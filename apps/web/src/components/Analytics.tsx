'use client';
import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-CCRGTEXZGG';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ── Helpers para tracking de eventos ──────────────────────────────────────────
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Eventos predefinidos para conversiones
export const analytics = {
  // Conversiones principales
  signUp: (method: string = 'email', plan?: string) =>
    trackEvent('sign_up', { method, plan }),

  login: (method: string = 'email') =>
    trackEvent('login', { method }),

  startTrial: (plan: string, billingCycle: string) =>
    trackEvent('start_trial', { plan, billing_cycle: billingCycle }),

  // Pedidos online
  viewCatalog: (tenantSlug: string) =>
    trackEvent('view_catalog', { tenant_slug: tenantSlug }),

  addToCart: (productId: string, productName: string, price: number, tenantSlug: string) =>
    trackEvent('add_to_cart', {
      currency: 'CRC',
      value: price,
      items: [{ item_id: productId, item_name: productName, price }],
      tenant_slug: tenantSlug,
    }),

  beginCheckout: (value: number, itemCount: number, tenantSlug: string) =>
    trackEvent('begin_checkout', {
      currency: 'CRC',
      value,
      num_items: itemCount,
      tenant_slug: tenantSlug,
    }),

  purchase: (orderNumber: string, value: number, type: 'pickup' | 'delivery', tenantSlug: string) =>
    trackEvent('purchase', {
      transaction_id: orderNumber,
      currency: 'CRC',
      value,
      delivery_type: type,
      tenant_slug: tenantSlug,
    }),

  // Pagos de suscripción
  selectPlan: (plan: string, price: number, billingCycle: string) =>
    trackEvent('select_plan', { plan, value: price, currency: 'USD', billing_cycle: billingCycle }),

  paymentMethodSelected: (method: 'sinpe' | 'pagadito', plan: string) =>
    trackEvent('payment_method_selected', { method, plan }),

  subscriptionActivated: (plan: string, method: string, value: number) =>
    trackEvent('subscription_activated', { plan, method, value, currency: 'USD' }),

  // Engagement
  openManual: () => trackEvent('open_manual'),
  openChat:   () => trackEvent('open_chat'),
  clickCTA:   (ctaName: string, location: string) => trackEvent('cta_click', { cta_name: ctaName, location }),
  searchCatalog: (query: string, results: number) => trackEvent('search', { search_term: query, results_count: results }),
};

// ── Component para tracking de pageviews en SPA ───────────────────────────────
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', GA_ID, { page_path: url });
  }, [pathname, searchParams]);

  return null;
}

// ── Component principal ───────────────────────────────────────────────────────
export function Analytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: true,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsTracker/>
      </Suspense>
    </>
  );
}
