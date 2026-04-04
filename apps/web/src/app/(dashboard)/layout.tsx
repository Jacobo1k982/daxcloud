'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useHydration } from '@/hooks/useHydration';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/layout/NotificationPanel';

// ── Ícono nube SVG inline ─────────────────────────────
function CloudIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloudNavGrad" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="45%" stopColor="#FF5C35" />
          <stop offset="100%" stopColor="#00C8D4" />
        </linearGradient>
      </defs>
      <path
        d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z"
        fill="none"
        stroke="url(#cloudNavGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { user, tenant } = useAuth();
  const router = useRouter();
  const hydrated = useHydration();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.push('/login');
  }, [hydrated, isAuthenticated]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dax-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', animation: 'fadeIn .4s ease' }}>
          <CloudIcon size={48} />
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '12px', marginTop: '16px', letterSpacing: '.1em' }}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--dax-bg)' }}>

      {/* ── Sidebar desktop ── */}
      {!isMobile && (
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div
            className="dax-sidebar"
            style={{
              position: 'fixed', top: 0, left: 0,
              height: '100vh', width: '220px',
              padding: '0',
              overflowY: 'auto',
            }}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* ── Contenido principal ── */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? '72px' : '0' }}>

        {/* ── Topbar móvil ── */}
        {isMobile && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 40,
            height: '52px',
            background: 'var(--dax-navy-900)',
            borderBottom: '1px solid var(--dax-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}>
            <NotificationBell />
            {/* Nube + nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CloudIcon size={32} />
              <div>
                <p style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--dax-text-primary)',
                  lineHeight: 1,
                }}>
                  {tenant?.name ?? 'DaxCloud'}
                </p>
                <p style={{
                  fontSize: '10px',
                  color: 'var(--dax-text-muted)',
                  lineHeight: 1,
                  marginTop: '2px',
                }}>
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>

            {/* Avatar inicial */}
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '9px',
              background: 'rgba(255,92,53,0.15)',
              border: '1px solid rgba(255,92,53,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF5C35' }}>
                {user?.firstName?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>
        )}

        <main style={{ minHeight: isMobile ? 'calc(100vh - 52px - 72px)' : '100vh' }}>
          {children}
        </main>
      </div>

      {/* ── Bottom nav móvil ── */}
      {isMobile && <BottomNav />}
    </div>
  );
}