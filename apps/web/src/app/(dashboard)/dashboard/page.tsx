'use client';

import { useState, useCallback } from 'react';
import { useAuth }      from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  Users, AlertTriangle, ArrowRight, BarChart2,
  Zap, Clock, RefreshCw, Target, CreditCard,
  Wallet, Smartphone, ArrowUpRight, Award,
  ChevronRight,
} from 'lucide-react';

// ── Utilidades ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const PERIOD_LABELS: Record<string, string> = {
  today:   'Hoy',
  week:    '7 días',
  month:   'Este mes',
  quarter: 'Trimestre',
  year:    'Este año',
};

const PAYMENT_COLORS: Record<string, string> = {
  cash:     '#3DBF7F',
  card:     '#5AAAF0',
  transfer: '#A78BFA',
  mixed:    '#F0A030',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'SINPE',
  mixed:    'Mixto',
};

const PAYMENT_ICONS: Record<string, any> = {
  cash:     Wallet,
  card:     CreditCard,
  transfer: Smartphone,
  mixed:    ArrowUpRight,
};

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 44 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max   = Math.max(...data);
  const min   = Math.min(...data);
  const range = max - min || 1;
  const W = 120, H = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  });
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
}

// ── Bar chart ventas ──────────────────────────────────────────────────────────
function SalesBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (!data?.length) return (
    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
      Sin datos para este período
    </div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '90px', padding: '0 2px' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const pct    = Math.max((d.value / max) * 78, 3);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%', justifyContent: 'flex-end' }}
            title={`${d.label}: ${d.value}`}>
            <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: isLast ? color : `${color}45`, height: `${pct}px`, transition: 'height .4s ease', minHeight: '3px' }} />
            <span style={{ fontSize: '8px', color: isLast ? color : 'var(--dax-text-muted)', fontWeight: isLast ? 700 : 400, whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Horas pico heatmap ────────────────────────────────────────────────────────
function PeakHoursChart({ data }: { data: { hour: number; count: number }[] }) {
  if (!data?.length) return (
    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
      Sin datos
    </div>
  );
  const max = Math.max(...data.map(d => d.count), 1);
  const hours = Array.from({ length: 24 }, (_, h) => {
    const found = data.find(d => d.hour === h);
    return { hour: h, count: found?.count ?? 0 };
  });
  return (
    <div>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
        {hours.map(h => {
          const intensity = h.count / max;
          return (
            <div
              key={h.hour}
              title={`${h.hour}:00 — ${h.count} ventas`}
              style={{
                flex: 1, height: '28px', borderRadius: '3px',
                background: intensity > 0
                  ? `rgba(255,92,53,${0.1 + intensity * 0.85})`
                  : 'var(--dax-surface-3)',
                transition: 'background .3s',
                cursor: 'default',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {[0, 6, 12, 18, 23].map(h => (
          <span key={h} style={{ fontSize: '9px', color: 'var(--dax-text-muted)' }}>{h}h</span>
        ))}
      </div>
    </div>
  );
}

// ── Donut de métodos de pago ──────────────────────────────────────────────────
function PaymentDonut({ data }: { data: { method: string; count: number; total: number }[] }) {
  if (!data?.length) return (
    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
      Sin ventas
    </div>
  );
  const total = data.reduce((s, d) => s + d.count, 0);
  let offset  = 0;
  const R = 28, C = 2 * Math.PI * R;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
        <circle cx="36" cy="36" r={R} fill="none" stroke="var(--dax-surface-3)" strokeWidth="8" />
        {data.map((d, i) => {
          const pct  = d.count / total;
          const dash = pct * C;
          const gap  = C - dash;
          const seg  = (
            <circle
              key={i}
              cx="36" cy="36" r={R}
              fill="none"
              stroke={PAYMENT_COLORS[d.method] ?? '#888'}
              strokeWidth="8"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray .5s ease' }}
            />
          );
          offset += dash;
          return seg;
        })}
        <text x="36" y="40" textAnchor="middle" style={{ fontSize: '13px', fontWeight: 800, fill: 'var(--dax-text-primary)', fontFamily: 'sans-serif' }}>
          {total}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
        {data.map(d => {
          const pct  = Math.round((d.count / total) * 100);
          const Icon = PAYMENT_ICONS[d.method] ?? ShoppingCart;
          return (
            <div key={d.method} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PAYMENT_COLORS[d.method] ?? '#888', flexShrink: 0 }} />
              <Icon size={10} color={PAYMENT_COLORS[d.method] ?? '#888'} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)', flex: 1 }}>
                {PAYMENT_LABELS[d.method] ?? d.method}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: PAYMENT_COLORS[d.method] ?? '#888' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color, icon: Icon, trend, trendValue, sparkData, loading }: {
  label: string; value: string | number; sub?: string;
  color: string; icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string; sparkData?: number[]; loading?: boolean;
}) {
  return (
    <div className="dax-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '88px', height: '88px', borderRadius: '50%', background: `${color}10`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} strokeWidth={1.8} />
        </div>
        {trend && trendValue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '8px', background: trend === 'up' ? 'var(--dax-success-bg)' : trend === 'down' ? 'var(--dax-danger-bg)' : 'var(--dax-surface-2)' }}>
            {trend === 'up'   && <TrendingUp   size={10} color="var(--dax-success)" />}
            {trend === 'down' && <TrendingDown  size={10} color="var(--dax-danger)"  />}
            <span style={{ fontSize: '11px', fontWeight: 700, color: trend === 'up' ? 'var(--dax-success)' : trend === 'down' ? 'var(--dax-danger)' : 'var(--dax-text-muted)' }}>
              {trendValue}
            </span>
          </div>
        )}
      </div>

      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '5px' }}>{label}</p>
      <p style={{ fontSize: '27px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '3px' }}>
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, tenant, formatCurrency } = useAuth();
  const [period, setPeriod] = useState('today');

  const {
    summary, salesByPeriod, topProducts, paymentMethods,
    peakHours, topCashiers, criticalStock, recentSales,
    tenantStats, isLoading, refetch,
  } = useDashboard(period);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refetch]);

  if (!user || !tenant) return null;

  const now      = new Date();
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  const revenue     = Number(summary?.revenue ?? 0);
  const salesCount  = summary?.salesCount ?? 0;
  const avgTicket   = Number(summary?.avgTicket ?? 0);
  const revChange   = summary?.revenueChange ?? 0;
  const salesChange = summary?.salesChange ?? 0;

  // Sparkline de ventas por período
  const sparkData = Array.isArray(salesByPeriod)
    ? salesByPeriod.map((d: any) => Number(d.total ?? d.revenue ?? 0))
    : [];

  // Ventas para bar chart
  const barData = Array.isArray(salesByPeriod)
    ? salesByPeriod.map((d: any) => ({
        label: d.label ?? d.date?.slice(5) ?? '',
        value: Number(d.total ?? d.revenue ?? 0),
      }))
    : [];

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: '1280px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {greeting}, {user.firstName} 👋
          </h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>
            {tenant.name} · {now.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector de período */}
          <div style={{ display: 'flex', background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '3px', border: '1px solid var(--dax-border)' }}>
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                style={{
                  padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background:  period === key ? 'var(--dax-surface)' : 'transparent',
                  color:       period === key ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)',
                  fontSize:    '12px', fontWeight: period === key ? 700 : 400,
                  transition:  'all .15s',
                  boxShadow:   period === key ? '0 1px 4px rgba(0,0,0,.12)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            style={{ width: '36px', height: '36px', borderRadius: '9px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin .7s linear infinite' : 'none' }} />
          </button>

          <a href="/pos" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 700, boxShadow: '0 3px 12px rgba(255,92,53,.3)', transition: 'all .18s', whiteSpace: 'nowrap' }}>
            <Zap size={14} /> Abrir POS
          </a>
        </div>
      </div>

      {/* ── Alertas ── */}
      {(criticalStock as any[]).length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '20px', background: 'rgba(240,160,48,.08)', border: '1px solid rgba(240,160,48,.2)', borderRadius: '10px' }}>
          <AlertTriangle size={15} color="#F0A030" />
          <p style={{ fontSize: '13px', color: '#F0A030', fontWeight: 600, flex: 1 }}>
            {(criticalStock as any[]).length} producto{(criticalStock as any[]).length !== 1 ? 's' : ''} con stock crítico o agotado
          </p>
          <a href="/inventory" style={{ fontSize: '12px', color: '#F0A030', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            Ver ahora <ChevronRight size={12} />
          </a>
        </div>
      )}

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <KPICard
          label="Ingresos"
          value={formatCurrency(revenue)}
          sub={`${PERIOD_LABELS[period]} · cambio vs anterior`}
          color="#FF5C35"
          icon={TrendingUp}
          trend={revChange > 0 ? 'up' : revChange < 0 ? 'down' : 'neutral'}
          trendValue={`${revChange > 0 ? '+' : ''}${revChange.toFixed(1)}%`}
          sparkData={sparkData}
          loading={isLoading}
        />
        <KPICard
          label="Transacciones"
          value={salesCount}
          sub={salesChange !== 0 ? `${salesChange > 0 ? '+' : ''}${salesChange.toFixed(1)}% vs anterior` : 'Sin comparativa'}
          color="#5AAAF0"
          icon={ShoppingCart}
          trend={salesChange > 0 ? 'up' : salesChange < 0 ? 'down' : 'neutral'}
          trendValue={`${salesChange > 0 ? '+' : ''}${salesChange.toFixed(1)}%`}
          loading={isLoading}
        />
        <KPICard
          label="Ticket promedio"
          value={formatCurrency(avgTicket)}
          sub="Por transacción"
          color="#A78BFA"
          icon={Target}
          loading={isLoading}
        />
        <KPICard
          label="Productos activos"
          value={tenantStats?.totalProducts ?? 0}
          sub={`${tenantStats?.totalUsers ?? 0} usuarios en el sistema`}
          color="#3DBF7F"
          icon={Package}
          loading={isLoading}
        />
      </div>

      {/* ── Fila 2: gráficas principales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', marginBottom: '20px' }}>

        {/* Ventas por período */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
                Ventas · {PERIOD_LABELS[period]}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                Total: {formatCurrency(barData.reduce((s, d) => s + d.value, 0))}
              </p>
            </div>
            <a href="/analytics" style={{ fontSize: '11px', color: '#FF5C35', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Analytics <ArrowRight size={11} />
            </a>
          </div>
          <SalesBarChart data={barData} color="#FF5C35" />
        </div>

        {/* Métodos de pago */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Métodos de pago</p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{PERIOD_LABELS[period]}</p>
            </div>
          </div>
          <PaymentDonut data={paymentMethods as any[]} />
          {(paymentMethods as any[]).length > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--dax-border)' }}>
              {(paymentMethods as any[]).slice(0, 3).map((m: any) => (
                <div key={m.method} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{PAYMENT_LABELS[m.method] ?? m.method}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: PAYMENT_COLORS[m.method] ?? '#888' }}>{formatCurrency(Number(m.total ?? 0))}</span>
                </div>
              ))}
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
          {!(recentSales as any)?.data?.length ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
              Sin ventas recientes
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {(recentSales as any).data.slice(0, 6).map((sale: any) => {
                const color = PAYMENT_COLORS[sale.paymentMethod] ?? '#FF5C35';
                return (
                  <div key={sale.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--dax-border-soft)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShoppingCart size={12} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1.2 }}>
                        {sale.items?.length ?? 0} ítem{sale.items?.length !== 1 ? 's' : ''}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
                        {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod} · {timeAgo(sale.createdAt)}
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

      {/* ── Fila 3: top productos, cajeros, horas pico ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '20px' }}>

        {/* Top productos */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Top productos</p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Más vendidos · {PERIOD_LABELS[period]}</p>
            </div>
            <a href="/sales" style={{ fontSize: '11px', color: '#FF5C35', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Ver más <ArrowRight size={11} />
            </a>
          </div>
          {!(topProducts as any[]).length ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
              Sin ventas en este período
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(topProducts as any[]).slice(0, 6).map((p: any, i: number) => {
                const max = (topProducts as any[])[0]?.quantity ?? 1;
                const pct = (p.quantity / max) * 100;
                const colors = ['#FF5C35', '#5AAAF0', '#3DBF7F', '#A78BFA', '#F0A030', '#EC4899'];
                const c = colors[i % colors.length];
                return (
                  <div key={p.productId ?? i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '6px', background: `${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: c, flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                          {p.name}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: c }}>×{p.quantity}</span>
                        {p.revenue && <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)', display: 'block' }}>{formatCurrency(Number(p.revenue))}</span>}
                      </div>
                    </div>
                    <div style={{ height: '3px', background: 'var(--dax-surface-3)', borderRadius: '99px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: '99px', transition: 'width .5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top cajeros */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Top cajeros</p>
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Rendimiento · {PERIOD_LABELS[period]}</p>
          </div>
          {!(topCashiers as any[]).length ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
              Sin datos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(topCashiers as any[]).slice(0, 5).map((c: any, i: number) => (
                <div key={c.userId ?? i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i === 0 ? 'rgba(255,92,53,.15)' : 'var(--dax-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: i === 0 ? '1.5px solid rgba(255,92,53,.3)' : '1px solid var(--dax-border)' }}>
                    {i === 0 ? <Award size={14} color="#FF5C35" /> : <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)' }}>{i + 1}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.firstName} {c.lastName}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{c.salesCount} ventas</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: i === 0 ? '#FF5C35' : 'var(--dax-text-secondary)', flexShrink: 0 }}>
                    {formatCurrency(Number(c.total ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Horas pico */}
        <div className="dax-card" style={{ padding: '20px 22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Horas pico</p>
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Actividad por hora del día</p>
          </div>
          <PeakHoursChart data={peakHours as any[]} />
          {(peakHours as any[]).length > 0 && (() => {
            const top = [...(peakHours as any[])].sort((a, b) => b.count - a.count).slice(0, 3);
            return (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--dax-border)' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>
                  Horarios más activos
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {top.map((h: any) => (
                    <div key={h.hour} style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,92,53,.1)', border: '1px solid rgba(255,92,53,.2)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF5C35' }}>{h.hour}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Accesos rápidos ── */}
      <div className="dax-card" style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '12px' }}>
          Accesos rápidos
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { href: '/pos',       label: '⚡ POS',         primary: true  },
            { href: '/products',  label: 'Productos',      primary: false },
            { href: '/inventory', label: 'Inventario',     primary: false },
            { href: '/sales',     label: 'Ventas',         primary: false },
            { href: '/analytics', label: 'Analytics',      primary: false },
            { href: '/branches',  label: 'Sucursales',     primary: false },
            { href: '/settings',  label: 'Configuración',  primary: false },
          ].map(link => (
            <a key={link.href} href={link.href} style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
              fontWeight: link.primary ? 700 : 500, textDecoration: 'none',
              background: link.primary ? '#FF5C35' : 'var(--dax-surface-2)',
              color:      link.primary ? '#fff' : 'var(--dax-text-secondary)',
              border:     link.primary ? 'none' : '1px solid var(--dax-border)',
              transition: 'all .15s',
            }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
