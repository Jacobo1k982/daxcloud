'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from './Logo';
import { ProfileModal } from './ProfileModal';
import {
  LayoutDashboard, ShoppingCart, BarChart2,
  Package, Warehouse, GitBranch, Settings, LogOut,
  ChefHat, Pill, Scissors, Shirt, Leaf, Utensils,
  TrendingUp, Barcode,
} from 'lucide-react';

const NAV_BASE = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/pos',       label: 'POS',        icon: ShoppingCart },
  { href: '/sales',     label: 'Ventas',     icon: TrendingUp },
  { href: '/products',  label: 'Productos',  icon: Package },
  { href: '/inventory', label: 'Inventario', icon: Warehouse },
  { href: '/analytics', label: 'Analytics',  icon: BarChart2 },
];

const NAV_INDUSTRY: Record<string, { href: string; label: string; icon: any }[]> = {
  restaurant:  [{ href: '/restaurant', label: 'Restaurante', icon: Utensils }],
  bakery:      [{ href: '/bakery',     label: 'Panadería',   icon: ChefHat }],
  pharmacy:    [{ href: '/pharmacy',   label: 'Farmacia',    icon: Pill }],
  salon:       [{ href: '/salon',      label: 'Peluquería',  icon: Scissors }],
  clothing:    [{ href: '/clothing',   label: 'Ropa',        icon: Shirt }],
  produce:     [{ href: '/produce',    label: 'Verdulería',  icon: Leaf }],
  supermarket: [{ href: '/products',   label: 'Catálogo',    icon: Barcode }],
  general:     [],
};

const NAV_MANAGEMENT = [
  { href: '/branches',  label: 'Sucursales',    icon: GitBranch },
  { href: '/settings',  label: 'Configuración', icon: Settings },
];

const INDUSTRY_COLOR: Record<string, string> = {
  restaurant:  '#F97316', bakery:      '#FF5C35',
  pharmacy:    '#5AAAF0', salon:       '#A78BFA',
  clothing:    '#EAB308', produce:     '#22C55E',
  supermarket: '#5AAAF0', general:     '#FF5C35',
};

const INDUSTRY_LABEL: Record<string, string> = {
  restaurant:  'Restaurante', bakery:      'Panadería',
  pharmacy:    'Farmacia',    salon:       'Peluquería',
  clothing:    'Ropa',        produce:     'Verdulería',
  supermarket: 'Supermercado', general:    'General',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout, industry } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const industryModules = NAV_INDUSTRY[industry] ?? [];
  const industryColor   = INDUSTRY_COLOR[industry] ?? '#FF5C35';
  const industryLabel   = INDUSTRY_LABEL[industry] ?? 'General';

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <a href={href} style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '8px 10px', borderRadius: 'var(--dax-radius-md)',
        fontSize: '13px', fontWeight: active ? 600 : 400,
        color: active ? '#FF5C35' : 'var(--dax-text-muted)',
        background: active ? 'rgba(255,92,53,0.10)' : 'transparent',
        textDecoration: 'none', transition: 'all .15s',
        whiteSpace: 'nowrap', marginBottom: '1px',
      }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,0.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-secondary)'; }}}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}}
      >
        <Icon size={15} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? '#FF5C35' : 'inherit', flexShrink: 0 }} />
        {label}
      </a>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--dax-navy-900)', justifyContent: 'space-between' }}>

        {/* ── Top ── */}
        <div>
          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--dax-border)', marginBottom: '8px' }}>
            <Logo size="sm" />
          </div>

          {/* Badge industria */}
          {industry && industry !== 'general' && (
            <div style={{ padding: '0 12px', marginBottom: '10px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '6px', background: `${industryColor}15`, border: `1px solid ${industryColor}30` }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: industryColor, flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: industryColor, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  {industryLabel}
                </span>
              </div>
            </div>
          )}

          {/* Nav principal */}
          <div style={{ padding: '0 8px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dax-navy-400)', padding: '0 10px', marginBottom: '4px' }}>
              Principal
            </p>
            {NAV_BASE.map(item => <NavLink key={item.href} {...item} />)}
          </div>

          {/* Módulo industria */}
          {industryModules.length > 0 && (
            <div style={{ padding: '0 8px', marginTop: '14px' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: industryColor, opacity: .7, padding: '0 10px', marginBottom: '4px' }}>
                {industryLabel}
              </p>
              {industryModules.map(item => <NavLink key={item.href} {...item} />)}
            </div>
          )}

          {/* Gestión */}
          <div style={{ padding: '0 8px', marginTop: '14px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dax-navy-400)', padding: '0 10px', marginBottom: '4px' }}>
              Gestión
            </p>
            {NAV_MANAGEMENT.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        </div>

        {/* ── Bottom ── */}
        <div style={{ borderTop: '1px solid var(--dax-border)', padding: '12px 12px 16px' }}>

          {/* Avatar clickeable → abre modal de perfil */}
          <button
            onClick={() => setShowProfile(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: 'var(--dax-radius-md)',
              background: 'var(--dax-surface-2)',
              border: '1px solid transparent',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all .15s', fontFamily: 'var(--font-primary)',
              marginBottom: '4px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,92,53,.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,92,53,.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.background = 'var(--dax-surface-2)'; }}
          >
            {/* Avatar con dot activo */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'linear-gradient(135deg, rgba(255,92,53,.25), rgba(255,61,31,.15))',
                border: '1px solid rgba(255,92,53,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF5C35' }}>
                  {user?.firstName?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              {/* Dot verde activo */}
              <div style={{
                position: 'absolute', bottom: '-1px', right: '-1px',
                width: '9px', height: '9px', borderRadius: '50%',
                background: '#3DBF7F',
                border: '1.5px solid var(--dax-navy-900)',
                boxShadow: '0 0 5px rgba(61,191,127,.5)',
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                {tenant?.name}
              </p>
            </div>

            {/* Indicador de acción */}
            <span style={{ fontSize: '14px', color: 'var(--dax-text-muted)', flexShrink: 0, lineHeight: 1 }}>⋯</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', background: 'transparent', border: 'none',
              borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 500,
              color: 'var(--dax-text-muted)', cursor: 'pointer', transition: 'all .15s',
              fontFamily: 'var(--font-primary)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,80,80,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* Modal de perfil */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}