'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  ShoppingCart,
  Package,
  Warehouse,
  LayoutDashboard,
  BarChart2,
  GitBranch,
  Settings,
  LogOut,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { ChefHat } from 'lucide-react';
import { Pill } from 'lucide-react';
import { Scissors } from 'lucide-react';
import { Shirt } from 'lucide-react';
import { Leaf } from 'lucide-react';
import { Utensils } from 'lucide-react';

const mainItems = [
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/inventory', label: 'Inventario', icon: Warehouse },
];

const moreItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Ventas', icon: BarChart2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/bakery',    label: 'Panadería', icon: ChefHat },
  { href: '/pharmacy',  label: 'Farmacia',     icon: Pill },
  { href: '/salon', label: 'Peluquería', icon: Scissors },
  { href: '/clothing', label: 'Ropa', icon: Shirt },
  { href: '/produce', label: 'Verdulería', icon: Leaf },
  { href: '/restaurant', label: 'Restaurante', icon: Utensils },
  { href: '/branches', label: 'Sucursales', icon: GitBranch },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Overlay del menú more */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 60,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Panel more — sube desde abajo */}
      <div style={{
        position: 'fixed',
        bottom: showMore ? '72px' : '-300px',
        left: 0, right: 0,
        background: 'var(--dax-surface)',
        borderTop: '1px solid var(--dax-border)',
        borderRadius: '20px 20px 0 0',
        zIndex: 70,
        padding: '12px 16px 8px',
        transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--dax-border)', margin: '0 auto 16px' }} />

        {/* Info usuario */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>{tenant?.name}</p>
          </div>
          <button
            onClick={() => setShowMore(false)}
            style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Items adicionales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
          {moreItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  padding: '12px 8px', borderRadius: 'var(--dax-radius-lg)',
                  background: active ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                  border: `1px solid ${active ? 'var(--dax-coral-border)' : 'transparent'}`,
                  textDecoration: 'none', transition: 'all 0.15s ease',
                }}
              >
                <Icon size={20} color={active ? 'var(--dax-coral)' : 'var(--dax-text-tertiary)'} strokeWidth={1.8} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: active ? 'var(--dax-coral)' : 'var(--dax-text-muted)', textAlign: 'center', lineHeight: '1.2' }}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={() => { logout(); setShowMore(false); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', borderRadius: 'var(--dax-radius-md)',
            background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,0.15)',
            cursor: 'pointer', color: 'var(--dax-danger)', fontSize: '13px', fontWeight: 600,
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      {/* Barra inferior principal */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '72px',
        background: 'var(--dax-surface)',
        borderTop: '1px solid var(--dax-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 80,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {mainItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '8px 20px', borderRadius: 'var(--dax-radius-lg)',
                textDecoration: 'none', transition: 'all 0.15s ease',
                flex: 1,
              }}
            >
              <div style={{
                width: '40px', height: '28px',
                borderRadius: '14px',
                background: active ? 'var(--dax-coral-soft)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}>
                <Icon size={20} color={active ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span style={{
                fontSize: '10px', fontWeight: active ? 700 : 400,
                color: active ? 'var(--dax-coral)' : 'var(--dax-text-muted)',
                transition: 'all 0.15s ease',
              }}>
                {item.label}
              </span>
            </a>
          );
        })}

        {/* Botón ··· */}
        <button
          onClick={() => setShowMore(!showMore)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '8px 20px', borderRadius: 'var(--dax-radius-lg)',
            background: 'none', border: 'none', cursor: 'pointer',
            flex: 1, transition: 'all 0.15s ease',
          }}
        >
          <div style={{
            width: '40px', height: '28px',
            borderRadius: '14px',
            background: showMore ? 'var(--dax-coral-soft)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MoreHorizontal size={20} color={showMore ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: '10px', fontWeight: showMore ? 700 : 400, color: showMore ? 'var(--dax-coral)' : 'var(--dax-text-muted)' }}>
            Más
          </span>
        </button>
      </nav>
    </>
  );
}