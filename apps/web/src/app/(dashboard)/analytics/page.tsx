'use client';

import { useState, useMemo } from 'react';
import { useQuery }          from '@tanstack/react-query';
import { useAuth }           from '@/hooks/useAuth';
import { api }               from '@/lib/api';
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Package, Users, BarChart2, PieChart, Clock, Star,
  AlertTriangle, Download, RefreshCw, Calendar,
  ChevronUp, ChevronDown, Minus, ArrowRight,
  Loader2, FileText, Filter, GitBranch,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
}

function fmtDateFull(d: string) {
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

const PERIOD_OPTS = [
  { value: 'today',   label: 'Hoy'        },
  { value: 'week',    label: '7 días'     },
  { value: 'month',   label: 'Este mes'   },
  { value: 'quarter', label: 'Trimestre'  },
  { value: 'year',    label: 'Este año'   },
  { value: 'custom',  label: 'Rango...'   },
];

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#3DBF7F', card: '#5AAAF0', transfer: '#A78BFA', mixed: '#F0A030',
};

const CATEGORY_COLORS = ['#FF5C35','#5AAAF0','#3DBF7F','#A78BFA','#F0A030','#EC4899','#14B8A6','#F97316'];

// ── Mini gráfico de barras SVG ────────────────────────────────────────────────
function SparkBar({ data, color = '#FF5C35', height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max  = Math.max(...data, 1);
  const w    = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = (v / max) * height;
        return (
          <rect key={i} x={i * w + w * 0.1} y={height - h} width={w * 0.8} height={h}
            fill={color} opacity={0.7} rx={1} />
        );
      })}
    </svg>
  );
}

// ── Gráfico de línea SVG ──────────────────────────────────────────────────────
function LineChart({ data, color = '#FF5C35', height = 120 }: { data: { date: string; revenue: number }[]; color?: string; height?: number }) {
  if (!data.length) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>Sin datos</div>;

  const max    = Math.max(...data.map(d => d.revenue), 1);
  const width  = 600;
  const pad    = 8;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad + innerH - (d.revenue / max) * innerH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />)}
    </svg>
  );
}

// ── Gráfico de barras horizontales ────────────────────────────────────────────
function HorizontalBar({ value, max, color, label, secondary }: { value: number; max: number; color: string; label: string; secondary?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{secondary}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--dax-surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width .5s ease' }} />
      </div>
    </div>
  );
}

// ── Heatmap de horas ──────────────────────────────────────────────────────────
function HoursHeatmap({ data }: { data: { hour: number; count: number; revenue: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);

  const getColor = (count: number) => {
    const intensity = count / max;
    if (intensity === 0) return 'var(--dax-surface-2)';
    if (intensity < 0.25) return 'rgba(255,92,53,.15)';
    if (intensity < 0.5)  return 'rgba(255,92,53,.35)';
    if (intensity < 0.75) return 'rgba(255,92,53,.6)';
    return '#FF5C35';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
      {data.map(h => (
        <div key={h.hour} title={`${h.label}: ${h.count} ventas`} style={{ aspectRatio: '1', borderRadius: '4px', background: getColor(h.count), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
          <span style={{ fontSize: '8px', color: h.count / max > 0.5 ? '#fff' : 'var(--dax-text-muted)', fontWeight: 600 }}>{h.hour}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────
function KPICard({ label, value, change, color, icon: Icon, sparkData }: {
  label: string; value: string; change?: number; color: string;
  icon: any; sparkData?: number[];
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="dax-card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {change !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: isPositive ? '#3DBF7F' : '#E05050', background: isPositive ? 'rgba(61,191,127,.1)' : 'rgba(224,80,80,.1)', padding: '2px 7px', borderRadius: '20px' }}>
            {isPositive ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p style={{ fontSize: '22px', fontWeight: 900, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '3px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{label}</p>
      {sparkData && sparkData.length > 0 && (
        <div style={{ marginTop: '8px', opacity: .5 }}>
          <SparkBar data={sparkData} color={color} height={28} />
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { formatCurrency } = useAuth();

  const [period,      setPeriod]      = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [activeTab,   setActiveTab]   = useState<'overview' | 'sales' | 'products' | 'cashiers' | 'stock'>('overview');
  const [exporting,   setExporting]   = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams({ period });
    if (period === 'custom' && customStart) p.append('customStart', customStart);
    if (period === 'custom' && customEnd)   p.append('customEnd',   customEnd);
    return p.toString();
  }, [period, customStart, customEnd]);

  const enabled = period !== 'custom' || (!!customStart && !!customEnd);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-full', params],
    queryFn:  async () => { const { data } = await api.get(`/analytics/dashboard?${params}`); return data; },
    enabled,
  });

  const { data: salesReport } = useQuery({
    queryKey: ['sales-report', params],
    queryFn:  async () => { const { data } = await api.get(`/analytics/sales-report?${params}`); return data; },
    enabled:  enabled && activeTab === 'sales',
  });

  const summary         = data?.summary;
  const salesByPeriod   = data?.salesByPeriod   ?? [];
  const topProducts     = data?.topProducts      ?? [];
  const salesByCategory = data?.salesByCategory  ?? [];
  const paymentMethods  = data?.paymentMethods   ?? [];
  const peakHours       = data?.peakHours        ?? [];
  const topCashiers     = data?.topCashiers       ?? [];
  const criticalStock   = data?.criticalStock     ?? [];
  const branchPerf      = data?.branchPerformance ?? [];

  const sparkData = salesByPeriod.map((d: any) => d.revenue);
  const maxRevenue = Math.max(...topProducts.map((p: any) => p.revenue), 1);
  const maxCashier = Math.max(...topCashiers.map((c: any) => c.revenue), 1);

  // ── Exportar CSV ──────────────────────────────────────────────────────────
  const exportCSV = async () => {
    setExporting(true);
    try {
      const { data: report } = await api.get(`/analytics/sales-report?${params}`);
      const rows = [
        ['ID','Fecha','Hora','Sucursal','Cajero','Cliente','Método pago','Subtotal','Descuento','Impuesto','Total'],
        ...report.map((s: any) => [
          s.id, fmtDateFull(s.date), fmtTime(s.date),
          s.branch, s.cashier, s.client,
          s.paymentMethod, s.subtotal, s.discount, s.tax, s.total,
        ]),
      ];
      const csv     = rows.map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n');
      const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url     = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href        = url;
      a.download    = `reporte-ventas-${period}-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ } finally { setExporting(false); }
  };

  const TABS = [
    { key: 'overview',  label: 'Resumen',    icon: BarChart2  },
    { key: 'sales',     label: 'Ventas',     icon: TrendingUp },
    { key: 'products',  label: 'Productos',  icon: Package    },
    { key: 'cashiers',  label: 'Cajeros',    icon: Users      },
    { key: 'stock',     label: 'Stock',      icon: AlertTriangle },
  ];

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Reportes</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Análisis completo de tu negocio</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => refetch()} style={{ width: '36px', height: '36px', borderRadius: '9px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={exportCSV} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            {exporting ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Download size={13} />}
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros de período */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--dax-surface-2)', padding: '3px', borderRadius: '10px', border: '1px solid var(--dax-border)' }}>
          {PERIOD_OPTS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: period === p.value ? 700 : 400, background: period === p.value ? 'var(--dax-surface)' : 'transparent', color: period === p.value ? 'var(--dax-coral)' : 'var(--dax-text-muted)', transition: 'all .15s', whiteSpace: 'nowrap' }}>
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="date" className="dax-input" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ margin: 0, padding: '7px 10px', fontSize: '12px', width: 'auto' }} />
            <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>→</span>
            <input type="date" className="dax-input" value={customEnd}   onChange={e => setCustomEnd(e.target.value)}   style={{ margin: 0, padding: '7px 10px', fontSize: '12px', width: 'auto' }} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--dax-surface-2)', padding: '3px', borderRadius: '12px', border: '1px solid var(--dax-border)', overflowX: 'auto' }}>
        {TABS.map(t => {
          const Icon   = t.icon;
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ flex: 1, minWidth: '90px', padding: '9px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: active ? 700 : 400, background: active ? 'var(--dax-surface)' : 'transparent', color: active ? 'var(--dax-coral)' : 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all .15s', whiteSpace: 'nowrap' }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '60px', color: 'var(--dax-text-muted)' }}>
          <Loader2 size={20} style={{ animation: 'spin .7s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Calculando reportes...</span>
        </div>
      ) : (
        <>
          {/* ── TAB: RESUMEN ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                <KPICard label="Ingresos totales"  value={formatCurrency(summary?.revenue ?? 0)}     change={summary?.revenueChange}  color="#FF5C35" icon={DollarSign}  sparkData={sparkData} />
                <KPICard label="Ventas realizadas" value={String(summary?.salesCount ?? 0)}           change={summary?.salesChange}    color="#5AAAF0" icon={ShoppingCart} />
                <KPICard label="Ticket promedio"   value={formatCurrency(summary?.avgTicket ?? 0)}    color="#3DBF7F" icon={TrendingUp} />
                <KPICard label="Descuentos dados"  value={formatCurrency(summary?.totalDiscount ?? 0)} color="#F0A030" icon={TrendingDown} />
              </div>

              {/* Gráfico de ventas en el tiempo */}
              <div className="dax-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Ventas en el tiempo</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{salesByPeriod.length} días con datos</p>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 900, color: '#FF5C35' }}>{formatCurrency(summary?.revenue ?? 0)}</p>
                </div>
                <LineChart data={salesByPeriod} color="#FF5C35" height={140} />
                {salesByPeriod.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{fmtDate(salesByPeriod[0]?.date)}</span>
                    <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{fmtDate(salesByPeriod[salesByPeriod.length - 1]?.date)}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Métodos de pago */}
                <div className="dax-card" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '14px' }}>Métodos de pago</p>
                  {paymentMethods.length === 0
                    ? <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '20px' }}>Sin datos</p>
                    : paymentMethods.map((m: any) => (
                    <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PAYMENT_COLORS[m.method] ?? '#888', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>{m.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{m.count} · {m.percentage}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--dax-surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${m.percentage}%`, background: PAYMENT_COLORS[m.method] ?? '#888', borderRadius: '99px' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', minWidth: '80px', textAlign: 'right' }}>{formatCurrency(m.revenue)}</span>
                    </div>
                  ))}
                </div>

                {/* Sucursales */}
                <div className="dax-card" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '14px' }}>Rendimiento por sucursal</p>
                  {branchPerf.length === 0
                    ? <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '20px' }}>Sin datos</p>
                    : branchPerf.map((b: any, i: number) => (
                    <div key={b.branchId} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: i === 0 ? '#FF5C35' : 'var(--dax-surface-3)', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{b.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{formatCurrency(b.revenue)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{b.salesCount} ventas</span>
                        <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Prom: {formatCurrency(b.avgTicket)}</span>
                        <span style={{ fontSize: '10px', color: '#FF5C35', fontWeight: 600 }}>{b.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Horas pico */}
              <div className="dax-card" style={{ padding: '20px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>Horas pico</p>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '14px' }}>Distribución de ventas por hora del día (0–23)</p>
                <HoursHeatmap data={peakHours} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Sin actividad</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {['rgba(255,92,53,.15)','rgba(255,92,53,.35)','rgba(255,92,53,.6)','#FF5C35'].map((c, i) => (
                      <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: c }} />
                    ))}
                    <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Alta actividad</span>
                  </div>
                </div>
              </div>

              {/* Por categoría */}
              {salesByCategory.length > 0 && (
                <div className="dax-card" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '14px' }}>Ventas por categoría</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                    {salesByCategory.map((c: any, i: number) => (
                      <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--dax-surface-2)', borderRadius: '10px', border: `1px solid ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}20` }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.category}</p>
                          <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{c.quantity} uds · {c.percentage}%</p>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}>{formatCurrency(c.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: VENTAS ── */}
          {activeTab === 'sales' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="dax-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Gráfico de ventas diarias</p>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{salesByPeriod.length} días</p>
                </div>
                <LineChart data={salesByPeriod} color="#FF5C35" height={160} />
              </div>

              {/* Tabla detallada de ventas */}
              <div className="dax-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Detalle de ventas</p>
                  <button onClick={exportCSV} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    <Download size={11} /> CSV
                  </button>
                </div>
                <div className="dax-table-wrap">
                  <table className="dax-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Sucursal</th>
                        <th>Cajero</th>
                        <th>Cliente</th>
                        <th>Método</th>
                        <th style={{ textAlign: 'right' }}>Descuento</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!salesReport || salesReport.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)', fontSize: '13px' }}>Sin ventas en este período</td></tr>
                      ) : salesReport.slice(0, 50).map((sale: any) => {
                        const pColor = PAYMENT_COLORS[sale.paymentMethod] ?? '#888';
                        return (
                          <tr key={sale.id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--dax-text-muted)' }}>#{sale.id}</td>
                            <td style={{ fontSize: '11px' }}>
                              <div>{fmtDateFull(sale.date)}</div>
                              <div style={{ color: 'var(--dax-text-muted)', fontSize: '10px' }}>{fmtTime(sale.date)}</div>
                            </td>
                            <td style={{ fontSize: '12px' }}>{sale.branch}</td>
                            <td style={{ fontSize: '12px' }}>{sale.cashier}</td>
                            <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{sale.client}</td>
                            <td>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: pColor, background: `${pColor}15`, padding: '2px 7px', borderRadius: '6px' }}>
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontSize: '12px', color: sale.discount > 0 ? '#F0A030' : 'var(--dax-text-muted)' }}>
                              {sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--dax-text-primary)', fontSize: '13px' }}>
                              {formatCurrency(sale.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {salesReport && salesReport.length > 50 && (
                  <div style={{ padding: '12px 18px', borderTop: '1px solid var(--dax-border)', fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center' }}>
                    Mostrando 50 de {salesReport.length} ventas. Exporta CSV para ver todas.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: PRODUCTOS ── */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="dax-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--dax-border)' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Top productos por ingresos</p>
                </div>
                <div className="dax-table-wrap">
                  <table className="dax-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>SKU</th>
                        <th style={{ textAlign: 'center' }}>Unidades</th>
                        <th style={{ textAlign: 'center' }}>Transacciones</th>
                        <th style={{ textAlign: 'right' }}>Ingresos</th>
                        <th style={{ textAlign: 'right' }}>% del total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>Sin datos</td></tr>
                      ) : topProducts.map((p: any, i: number) => {
                        const totalRev = topProducts.reduce((s: number, x: any) => s + x.revenue, 0);
                        const pct      = totalRev > 0 ? ((p.revenue / totalRev) * 100).toFixed(1) : '0';
                        return (
                          <tr key={p.productId}>
                            <td>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: i < 3 ? '#FF5C35' : 'var(--dax-text-muted)' }}>{i + 1}</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{p.category}</td>
                            <td style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--dax-text-muted)' }}>{p.sku}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.quantity}</td>
                            <td style={{ textAlign: 'center', color: 'var(--dax-text-muted)' }}>{p.transactions}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(p.revenue)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                <div style={{ width: '50px', height: '4px', background: 'var(--dax-surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: '#FF5C35', borderRadius: '99px' }} />
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Por categoría */}
              {salesByCategory.length > 0 && (
                <div className="dax-card" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '16px' }}>Ingresos por categoría</p>
                  {salesByCategory.map((c: any, i: number) => (
                    <HorizontalBar
                      key={c.category}
                      label={c.category}
                      value={c.revenue}
                      max={salesByCategory[0]?.revenue ?? 1}
                      color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                      secondary={`${formatCurrency(c.revenue)} · ${c.percentage}%`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CAJEROS ── */}
          {activeTab === 'cashiers' && (
            <div className="dax-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--dax-border)' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Rendimiento de cajeros</p>
              </div>
              <div className="dax-table-wrap">
                <table className="dax-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cajero</th>
                      <th>Rol</th>
                      <th style={{ textAlign: 'center' }}>Ventas</th>
                      <th style={{ textAlign: 'right' }}>Ticket prom.</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Participación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCashiers.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>Sin datos</td></tr>
                    ) : topCashiers.map((c: any, i: number) => {
                      const initials = c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                      const colors   = ['#FF5C35','#5AAAF0','#3DBF7F','#A78BFA','#F0A030'];
                      const color    = colors[i % colors.length];
                      return (
                        <tr key={c.userId}>
                          <td><span style={{ fontSize: '12px', fontWeight: 700, color: i < 3 ? '#FF5C35' : 'var(--dax-text-muted)' }}>{i + 1}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${color}20`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color }}>{initials}</span>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</span>
                            </div>
                          </td>
                          <td><span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', background: 'var(--dax-surface-2)', padding: '2px 8px', borderRadius: '6px' }}>{c.role}</span></td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.salesCount}</td>
                          <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)', fontSize: '12px' }}>{formatCurrency(c.avgTicket)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#FF5C35' }}>{formatCurrency(c.revenue)}</td>
                          <td style={{ minWidth: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, height: '4px', background: 'var(--dax-surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(c.revenue / maxCashier) * 100}%`, background: color, borderRadius: '99px' }} />
                              </div>
                              <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)', minWidth: '35px', textAlign: 'right' }}>
                                {maxCashier > 0 ? ((c.revenue / maxCashier) * 100).toFixed(0) : 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: STOCK CRÍTICO ── */}
          {activeTab === 'stock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {criticalStock.length === 0 ? (
                <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
                  <Package size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .2 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dax-text-muted)' }}>¡Excelente! No hay productos con stock crítico</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(224,80,80,.06)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '10px' }}>
                    <AlertTriangle size={16} color="var(--dax-danger)" />
                    <p style={{ fontSize: '13px', color: 'var(--dax-danger)', fontWeight: 600 }}>
                      {criticalStock.length} producto{criticalStock.length !== 1 ? 's' : ''} con stock crítico o agotado
                    </p>
                  </div>

                  <div className="dax-card" style={{ overflow: 'hidden' }}>
                    <div className="dax-table-wrap">
                      <table className="dax-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Categoría</th>
                            <th>Sucursal</th>
                            <th style={{ textAlign: 'center' }}>Stock actual</th>
                            <th style={{ textAlign: 'center' }}>Mínimo</th>
                            <th style={{ textAlign: 'center' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {criticalStock.map((item: any) => (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 600 }}>{item.productName}</td>
                              <td style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--dax-text-muted)' }}>{item.sku}</td>
                              <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.category}</td>
                              <td style={{ fontSize: '12px' }}>{item.branchName}</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: item.status === 'out' ? 'var(--dax-danger)' : '#F0A030', fontSize: '16px' }}>{item.quantity}</td>
                              <td style={{ textAlign: 'center', color: 'var(--dax-text-muted)', fontSize: '12px' }}>{item.minStock}</td>
                              <td style={{ textAlign: 'center' }}>
                                {item.status === 'out'
                                  ? <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-danger)', background: 'var(--dax-danger-bg)', padding: '3px 8px', borderRadius: '20px' }}>Agotado</span>
                                  : <span style={{ fontSize: '10px', fontWeight: 700, color: '#F0A030', background: 'var(--dax-warning-bg)', padding: '3px 8px', borderRadius: '20px' }}>Stock bajo</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
