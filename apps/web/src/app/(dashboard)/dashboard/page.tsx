'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import {
  TrendingUp, TrendingDown, ShoppingCart,
  Package, Users, AlertTriangle, ArrowRight,
  BarChart2, Zap, Clock,
} from 'lucide-react';

// ── Mini sparkline SVG ────────────────────────────────
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 120, H = height;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  }).join(' ');
  const fillPoints = `0,${H} ${points} ${W},${H}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {/* Punto final */}
      <circle cx={(data.length - 1) / (data.length - 1) * W} cy={H - ((data[data.length - 1] - min) / range) * H * 0.85 - H * 0.075} r="3" fill={color} />
    </svg>
  );
}

// ── Mini bar chart ────────────────────────────────────
function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (!data || data.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
      Sin datos
    </div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%', borderRadius: '3px 3px 0 0',
            background: i === data.length - 1 ? color : `${color}50`,
            height: `${Math.max((d.value / max) * 68, 4)}px`,
            transition: 'height .3s ease',
            minHeight: '4px',
          }} />
          <span style={{ fontSize: '9px', color: 'var(--dax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────
function KPICard({
  label, value, sub, color, icon: Icon, trend, trendValue, sparkData, loading,
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: any; trend?: 'up' | 'down' | 'neutral';
  trendValue?: string; sparkData?: number[]; loading?: boolean;
}) {
  return (
    <div className="dax-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {/* Orb decorativo */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: `${color}12`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} strokeWidth={1.8} />
        </div>
        {trend && trendValue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '8px', background: trend === 'up' ? 'var(--dax-success-bg)' : trend === 'down' ? 'var(--dax-danger-bg)' : 'var(--dax-surface-2)' }}>
            {trend === 'up' ? <TrendingUp size={11} color="var(--dax-success)" /> : trend === 'down' ? <TrendingDown size={11} color="var(--dax-danger)" /> : null}
            <span style={{ fontSize: '11px', fontWeight: 700, color: trend === 'up' ? 'var(--dax-success)' : trend === 'down' ? 'var(--dax-danger)' : 'var(--dax-text-muted)' }}>
              {trendValue}
            </span>
          </div>
        )}
      </div>

      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>
        {label}
      </p>
      <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '4px' }}>
        {loading ? <span style={{ color: 'var(--dax-border)', fontSize: '20px' }}>—</span> : value}
      </p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{sub}</p>}

      {sparkData && sparkData.length > 1 && (
        <div style={{ marginTop: '12px' }}>
          <Sparkline data={sparkData} color={color} />
        </div>
      )}
    </div>
  );
}

// ── Página ────────────────────────────────────────────
export default function DashboardPage() {
  const { user, tenant, formatCurrency, industry } = useAuth();
  const { stats, summary, analytics, recentSales, lowStock, isLoading } = useDashboard();

  if (!user || !tenant) return null;

  // Datos de ventas por hora (últimas 7 horas) para sparkline
  const hourlyData = analytics?.hourlySales?.map((h: any) => Number(h.total ?? 0)) ?? [0, 0, 0, 0, 0, 0, 0];

  // Ventas últimos 7 días para bar chart
  const weeklyData = analytics?.weeklySales?.map((d: any) => ({
    label: new Date(d.date).toLocaleDateString('es-CR', { weekday: 'short' }),
    value: Number(d.total ?? 0),
  })) ?? [];

  // Top productos
  const topProducts = analytics?.topProducts?.slice(0, 5) ?? [];

  // Calcular tendencia vs ayer
  const revenueToday = Number(summary?.revenueToday ?? 0);
  const revenueYesterday = Number(summary?.revenueYesterday ?? 0);
  const revenueTrend = revenueYesterday > 0
    ? ((revenueToday - revenueYesterday) / revenueYesterday * 100).toFixed(1)
    : null;

  const salesToday = summary?.salesToday ?? 0;
  const salesYesterday = summary?.salesYesterday ?? 0;
  const salesTrend = salesYesterday > 0
    ? ((salesToday - salesYesterday) / salesYesterday * 100).toFixed(1)
    : null;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>
            {greeting}, {user.firstName} 👋
          </h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>
            {tenant.name} · {new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <a href="/pos" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
          color: '#fff', borderRadius: '10px',
          textDecoration: 'none', fontSize: '13px', fontWeight: 700,
          boxShadow: '0 3px 12px rgba(255,92,53,.3)',
          transition: 'all .18s',
        }}>
          <Zap size={14} /> Abrir POS
        </a>
      </div>

      {/* ── Alerta stock bajo ── */}
      {lowStock.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px', marginBottom: '20px',
          background: 'rgba(240,160,48,.08)',
          border: '1px solid rgba(240,160,48,.2)',
          borderRadius: 'var(--dax-radius-md)',
        }}>
          <AlertTriangle size={15} color="#F0A030" />
          <p style={{ fontSize: '13px', color: '#F0A030', fontWeight: 600, flex: 1 }}>
            {lowStock.length} producto{lowStock.length !== 1 ? 's' : ''} con stock bajo
          </p>
          <a href="/inventory" style={{ fontSize: '12px', color: '#F0A030', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            Ver <ArrowRight size={12} />
          </a>
        </div>
      )}

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <KPICard
          label="Ventas hoy"
          value={formatCurrency(revenueToday)}
          sub={revenueYesterday > 0 ? `Ayer: ${formatCurrency(revenueYesterday)}` : 'Sin datos de ayer'}
          color="#FF5C35"
          icon={TrendingUp}
          trend={revenueTrend ? (Number(revenueTrend) >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={revenueTrend ? `${Number(revenueTrend) >= 0 ? '+' : ''}${revenueTrend}%` : undefined}
          sparkData={hourlyData}
          loading={isLoading}
        />
        <KPICard
          label="Transacciones hoy"
          value={salesToday}
          sub={salesYesterday > 0 ? `Ayer: ${salesYesterday}` : undefined}
          color="#5AAAF0"
          icon={ShoppingCart}
          trend={salesTrend ? (Number(salesTrend) >= 0 ? 'up' : 'down') : 'neutral'}
          trendValue={salesTrend ? `${Number(salesTrend) >= 0 ? '+' : ''}${salesTrend}%` : undefined}
          loading={isLoading}
        />
        <KPICard
          label="Productos activos"
          value={stats?.totalProducts ?? 0}
          sub={`${stats?.totalUsers ?? 0} usuarios`}
          color="#3DBF7F"
          icon={Package}
          loading={isLoading}
        />
        <KPICard
          label="Ticket promedio"
          value={salesToday > 0 ? formatCurrency(revenueToday / salesToday) : formatCurrency(0)}
          sub="Por transacción hoy"
          color="#A78BFA"
          icon={BarChart2}
          loading={isLoading}
        />
      </div>

      {/* ── Gráficas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px', marginBottom: '24px' }}>

        {/* Ventas últimos 7 días */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Ventas · 7 días</p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Últimos 7 días</p>
            </div>
            <a href="/analytics" style={{ fontSize: '11px', color: '#FF5C35', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Ver más <ArrowRight size={11} />
            </a>
          </div>
          {weeklyData.length > 0 ? (
            <MiniBarChart data={weeklyData} color="#FF5C35" />
          ) : (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
              Sin ventas recientes
            </div>
          )}
          {weeklyData.length > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Total semana</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF5C35' }}>
                {formatCurrency(weeklyData.reduce((acc: number, d: { label: string; value: number }) => acc + d.value, 0))}
              </span>
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Top productos</p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Más vendidos hoy</p>
            </div>
            <a href="/sales" style={{ fontSize: '11px', color: '#FF5C35', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Ver más <ArrowRight size={11} />
            </a>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
              Sin ventas hoy
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topProducts.map((p: any, i: number) => {
                const max = topProducts[0]?.quantity ?? 1;
                const pct = (p.quantity / max) * 100;
                return (
                  <div key={p.productId ?? i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: i === 0 ? '#FF5C35' : 'var(--dax-text-muted)', minWidth: '14px' }}>#{i + 1}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF5C35', flexShrink: 0 }}>×{p.quantity}</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--dax-surface-2)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? '#FF5C35' : 'var(--dax-border)', borderRadius: '2px', transition: 'width .4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ventas recientes */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Ventas recientes</p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Últimas transacciones</p>
            </div>
            <a href="/sales" style={{ fontSize: '11px', color: '#FF5C35', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Ver todas <ArrowRight size={11} />
            </a>
          </div>
          {!recentSales?.data?.length ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
              Sin ventas recientes
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {recentSales.data.slice(0, 6).map((sale: any) => {
                const mins = Math.floor((Date.now() - new Date(sale.createdAt).getTime()) / 60000);
                const timeStr = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
                const methodColors: Record<string, string> = { cash: '#3DBF7F', card: '#5AAAF0', transfer: '#A78BFA', mixed: '#F0A030' };
                const methodLabels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'SINPE', mixed: 'Mixto' };
                return (
                  <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--dax-border-soft)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${methodColors[sale.paymentMethod] ?? '#FF5C35'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShoppingCart size={12} color={methodColors[sale.paymentMethod] ?? '#FF5C35'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1.2 }}>
                        {sale.items?.length ?? 0} item{sale.items?.length !== 1 ? 's' : ''}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
                        {methodLabels[sale.paymentMethod] ?? sale.paymentMethod} · {timeStr} atrás
                      </p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', flexShrink: 0 }}>
                      {formatCurrency(Number(sale.total))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Accesos rápidos ── */}
      <div className="dax-card" style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '12px' }}>
          Accesos rápidos
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { href: '/pos',       label: '⚡ POS',          primary: true  },
            { href: '/products',  label: 'Productos',       primary: false },
            { href: '/inventory', label: 'Inventario',      primary: false },
            { href: '/sales',     label: 'Ventas',          primary: false },
            { href: '/analytics', label: 'Analytics',       primary: false },
            { href: '/branches',  label: 'Sucursales',      primary: false },
            { href: '/settings',  label: 'Configuración',   primary: false },
          ].map(link => (
            <a key={link.href} href={link.href} style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: link.primary ? 700 : 500,
              textDecoration: 'none',
              background: link.primary ? '#FF5C35' : 'var(--dax-surface-2)',
              color: link.primary ? '#fff' : 'var(--dax-text-secondary)',
              border: link.primary ? 'none' : '1px solid var(--dax-border)',
              transition: 'all .15s',
            }}
              onMouseEnter={e => {
                if (!link.primary) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-navy-400)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!link.primary) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-secondary)';
                }
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}