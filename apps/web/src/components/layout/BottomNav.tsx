'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  ShoppingCart, Package, Warehouse, LayoutDashboard,
  BarChart2, GitBranch, Settings, LogOut, X,
  MoreHorizontal, ChefHat, Pill, Scissors,
  Shirt, Leaf, Utensils, TrendingUp, Barcode,
  Users, Activity, Layers,
} from 'lucide-react';
import { NotificationBellMobile } from './NotificationBell';

const INDUSTRY_MODULE: Record<string, { href: string; label: string; icon: React.ElementType }> = {
  bakery: { href: '/bakery', label: 'Panadería', icon: ChefHat },
  pharmacy: { href: '/pharmacy', label: 'Farmacia', icon: Pill },
  salon: { href: '/salon', label: 'Peluquería', icon: Scissors },
  clothing: { href: '/clothing', label: 'Ropa', icon: Shirt },
  produce: { href: '/produce', label: 'Verdulería', icon: Leaf },
  restaurant: { href: '/restaurant', label: 'Restaurante', icon: Utensils },
  supermarket: { href: '/products', label: 'Catálogo', icon: Barcode },
};

// Todos los items del panel "Más" en orden fijo
const ALL_MORE_ITEMS: { href: string; label: string; icon: React.ElementType }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Ventas', icon: TrendingUp },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/analytics', label: 'Reportes', icon: Activity },
  { href: '/branches', label: 'Sucursales', icon: GitBranch },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, tenant, logout, industry } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  // Agrega módulo de industria si existe y no está ya en la lista
  const industryModule = industry ? INDUSTRY_MODULE[industry] : null;
  const moreItems = industryModule && !ALL_MORE_ITEMS.find(i => i.href === industryModule.href)
    ? [ALL_MORE_ITEMS[0], industryModule, ...ALL_MORE_ITEMS.slice(1)]
    : ALL_MORE_ITEMS;

  const mainItems: { href: string; label: string; icon: React.ElementType }[] = [
    { href: '/pos', label: 'POS', icon: ShoppingCart },
    { href: '/products', label: 'Productos', icon: Package },
    { href: '/inventory', label: 'Inventario', icon: Warehouse },
  ];

  // Inicial del usuario para el avatar
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <>
      {/* Overlay */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60, backdropFilter: 'blur(6px)' }}
        />
      )}

      {/* ── Panel "Más" ── */}
      <div style={{
        position: 'fixed',
        bottom: showMore ? '72px' : '-500px',
        left: 0, right: 0,
        background: 'var(--dax-surface)',
        borderTop: '1px solid var(--dax-border)',
        borderRadius: '24px 24px 0 0',
        zIndex: 70,
        padding: '0 0 8px',
        transition: 'bottom 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 -8px 32px rgba(0,0,0,.25)',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--dax-border)' }} />
        </div>

        {/* Header usuario */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Avatar */}
            <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: 'linear-gradient(135deg, rgba(255,92,53,.25), rgba(255,61,31,.15))', border: '1.5px solid rgba(255,92,53,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dax-coral)' }}>{initials}</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '3px' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{tenant?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMore(false)}
            style={{ background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', cursor: 'pointer', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Separador */}
        <div style={{ height: '1px', background: 'var(--dax-border)', margin: '0 16px 14px' }} />

        {/* Grid de items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '0 16px', marginBottom: '14px' }}>
          {moreItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px',
                  padding: '14px 8px', borderRadius: '14px',
                  background: active ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                  border: `1.5px solid ${active ? 'var(--dax-coral-border)' : 'var(--dax-border)'}`,
                  textDecoration: 'none', transition: 'all 0.15s ease',
                  boxShadow: active ? '0 2px 8px rgba(255,92,53,.15)' : 'none',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: active ? 'rgba(255,92,53,.15)' : 'var(--dax-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={active ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} strokeWidth={active ? 2.2 : 1.8} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, color: active ? 'var(--dax-coral)' : 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* Botón cerrar sesión */}
        <div style={{ padding: '0 16px' }}>
          <button
            onClick={() => { logout(); setShowMore(false); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,.2)', cursor: 'pointer', color: 'var(--dax-danger)', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-primary)' }}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── Barra inferior principal ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '72px',
        background: 'var(--dax-surface)',
        borderTop: '1px solid var(--dax-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 80,
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(10px)',
      }}>
        {mainItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 0', textDecoration: 'none', flex: 1 }}
            >
              <div style={{ width: '44px', height: '28px', borderRadius: '14px', background: active ? 'var(--dax-coral-soft)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                <Icon size={21} color={active ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400, color: active ? 'var(--dax-coral)' : 'var(--dax-text-muted)' }}>
                {item.label}
              </span>
            </a>
          );
        })}

        <NotificationBellMobile />

        {/* Botón ··· */}
        <button
          onClick={() => setShowMore(!showMore)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}
        >
          <div style={{ width: '44px', height: '28px', borderRadius: '14px', background: showMore ? 'var(--dax-coral-soft)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
            <MoreHorizontal size={21} color={showMore ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: '10px', fontWeight: showMore ? 700 : 400, color: showMore ? 'var(--dax-coral)' : 'var(--dax-text-muted)' }}>
            Más
          </span>
        </button>
      </nav>
    </>
  );
}


