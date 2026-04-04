'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  AlertTriangle, Users, Clock, CreditCard, BarChart2,
} from 'lucide-react';

const PERIODS = [
  { value: 'today',   label: 'Hoy' },
  { value: 'week',    label: '7 días' },
  { value: 'month',   label: 'Este mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year',    label: 'Este año' },
];

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#3DBF7F', card: '#5AAAF0',
  transfer: '#F0A030', mixed: '#FF5C35',
};

const CORAL = '#FF5C35';
const CORAL_SOFT = 'rgba(255,92,53,.12)';

export default function AnalyticsPage() {
  const { formatCurrency, hasFeature } = useAuth();
  const [period, setPeriod] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/dashboard?period=${period}`);
      return data;
    },
  });

  if (!hasFeature('analytics')) {
    return (
      <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '80px' }}>
        <BarChart2 size={48} color="var(--dax-coral)" style={{ margin: '0 auto 20px' }} />
        <h1 style={{ fontSize: '22px', marginBottom: '10px' }}>Analytics avanzado</h1>
        <p style={{ color: 'var(--dax-text-muted)', fontSize: '14px', marginBottom: '28px' }}>
          Actualiza a Growth o Scale para acceder a reportes y analytics en tiempo real.
        </p>
        <a href="/settings" className="dax-btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Ver planes →
        </a>
      </div>
    );
  }

  const s = data?.summary;

  const statCards = s ? [
    {
      label: 'Ingresos',
      value: formatCurrency(s.revenue),
      change: s.revenueChange,
      icon: TrendingUp,
      color: CORAL,
    },
    {
      label: 'Ventas',
      value: s.salesCount.toLocaleString(),
      change: s.salesChange,
      icon: ShoppingCart,
      color: '#5AAAF0',
    },
    {
      label: 'Ticket promedio',
      value: formatCurrency(s.avgTicket),
      change: null,
      icon: CreditCard,
      color: '#3DBF7F',
    },
    {
      label: 'Descuentos dados',
      value: formatCurrency(s.totalDiscount),
      change: null,
      icon: TrendingDown,
      color: '#F0A030',
    },
  ] : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontSize: '13px', fontWeight: 700, color: p.color ?? CORAL }}>
            {p.name === 'revenue' || p.name === 'Ingresos' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', marginBottom: '4px' }}>Analytics</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Métricas y rendimiento de tu negocio</p>
        </div>

        {/* Selector de período */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: 'var(--dax-radius-lg)', padding: '4px', flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all .15s',
                background: period === p.value ? CORAL : 'transparent',
                color: period === p.value ? '#fff' : 'var(--dax-text-muted)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="dax-card" style={{ padding: '24px', height: '110px', background: 'var(--dax-surface-2)' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="dax-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)' }}>{card.label}</p>
                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--dax-radius-md)', background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={card.color} />
                    </div>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '6px' }}>{card.value}</p>
                  {card.change !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {card.change >= 0
                        ? <TrendingUp size={12} color="var(--dax-success)" />
                        : <TrendingDown size={12} color="var(--dax-danger)" />}
                      <span style={{ fontSize: '11px', fontWeight: 600, color: card.change >= 0 ? 'var(--dax-success)' : 'var(--dax-danger)' }}>
                        {card.change >= 0 ? '+' : ''}{card.change}%
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>vs período anterior</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Gráfica de ventas por período */}
          <div className="dax-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Ingresos por día</p>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Evolución de ventas en el período</p>
              </div>
            </div>
            {data?.salesByPeriod?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.salesByPeriod} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <defs>
                    <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CORAL} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CORAL} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--dax-text-muted)' }} tickLine={false} axisLine={false}
                    tickFormatter={d => { const [,m,day] = d.split('-'); return `${day}/${m}`; }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--dax-text-muted)' }} tickLine={false} axisLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Ingresos" stroke={CORAL} strokeWidth={2} fill="url(#coralGrad)" dot={false} activeDot={{ r: 4, fill: CORAL }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Sin datos en este período</p>
              </div>
            )}
          </div>

          {/* Grid: Top productos + Métodos de pago */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>

            {/* Top productos */}
            <div className="dax-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Package size={16} color={CORAL} />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Productos más vendidos</p>
              </div>
              {data?.topProducts?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.topProducts.slice(0, 7).map((p: any, i: number) => {
                    const maxRevenue = data.topProducts[0].revenue;
                    const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={p.productId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? CORAL : 'var(--dax-text-muted)', minWidth: '16px' }}>#{i+1}</span>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: CORAL }}>{formatCurrency(p.revenue)}</p>
                            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{p.quantity} uds</p>
                          </div>
                        </div>
                        <div style={{ height: '3px', background: 'var(--dax-surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? CORAL : 'var(--dax-border)', borderRadius: '2px', transition: 'width .5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>Sin datos</p>
              )}
            </div>

            {/* Métodos de pago */}
            <div className="dax-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <CreditCard size={16} color={CORAL} />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Métodos de pago</p>
              </div>
              {data?.paymentMethods?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={data.paymentMethods} dataKey="count" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
                          {data.paymentMethods.map((m: any) => (
                            <Cell key={m.method} fill={PAYMENT_COLORS[m.method] ?? CORAL} />
                          ))}
                        </Pie>
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div style={{ background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: '8px', padding: '8px 12px' }}>
                              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{d.label}</p>
                              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{d.count} ventas · {d.percentage}%</p>
                            </div>
                          );
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.paymentMethods.map((m: any) => (
                      <div key={m.method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PAYMENT_COLORS[m.method] ?? CORAL, flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{m.label}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{m.percentage}%</span>
                          <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginLeft: '6px' }}>({m.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>Sin datos</p>
              )}
            </div>
          </div>

          {/* Hora pico */}
          <div className="dax-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Clock size={16} color={CORAL} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Hora pico de ventas</p>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Distribución de ventas por hora del día</p>
              </div>
            </div>
            {data?.peakHours?.some((h: any) => h.count > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.peakHours} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--dax-text-muted)' }} tickLine={false} axisLine={false}
                    tickFormatter={l => l.split(':')[0]} interval={1} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Ventas" radius={[3,3,0,0]}>
                    {data.peakHours.map((h: any, i: number) => {
                      const max = Math.max(...data.peakHours.map((x: any) => x.count));
                      const isMax = h.count === max && max > 0;
                      return <Cell key={i} fill={isMax ? CORAL : 'var(--dax-surface-3)'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Sin datos en este período</p>
              </div>
            )}
          </div>

          {/* Grid: Sucursales + Cajeros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>

            {/* Rendimiento por sucursal */}
            <div className="dax-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <BarChart2 size={16} color={CORAL} />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Rendimiento por sucursal</p>
              </div>
              {data?.branchPerformance?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.branchPerformance.map((b: any, i: number) => (
                    <div key={b.branchId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{b.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{b.salesCount} ventas · Ticket avg {formatCurrency(b.avgTicket)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: CORAL }}>{formatCurrency(b.revenue)}</p>
                          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{b.percentage}%</p>
                        </div>
                      </div>
                      <div style={{ height: '4px', background: 'var(--dax-surface-2)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${b.percentage}%`, background: i === 0 ? CORAL : `rgba(255,92,53,${.7 - i*.15})`, borderRadius: '2px', transition: 'width .6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>Sin datos</p>
              )}
            </div>

            {/* Top cajeros */}
            <div className="dax-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Users size={16} color={CORAL} />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Cajeros más activos</p>
              </div>
              {data?.topCashiers?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.topCashiers.map((c: any, i: number) => (
                    <div key={c.userId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i === 0 ? CORAL_SOFT : 'var(--dax-surface-3)', border: `1px solid ${i === 0 ? 'var(--dax-coral-border)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: i === 0 ? CORAL : 'var(--dax-text-muted)' }}>
                            {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{c.salesCount} ventas</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: CORAL }}>{formatCurrency(c.revenue)}</p>
                        <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>avg {formatCurrency(c.avgTicket)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>Sin datos</p>
              )}
            </div>
          </div>

          {/* Stock crítico */}
          {data?.criticalStock?.length > 0 && (
            <div className="dax-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <AlertTriangle size={16} color="var(--dax-warning)" />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Alertas de inventario</p>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{data.criticalStock.length} producto{data.criticalStock.length !== 1 ? 's' : ''} con stock crítico</p>
                </div>
              </div>
              <div className="dax-table-wrap">
                <table className="dax-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Sucursal</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'center' }}>Stock actual</th>
                      <th style={{ textAlign: 'center' }}>Mínimo</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.criticalStock.map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{item.productName}</p>
                          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.sku}</p>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{item.branchName}</td>
                        <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.category}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: item.status === 'out' ? 'var(--dax-danger)' : 'var(--dax-warning)' }}>
                            {item.quantity}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.minStock}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`dax-badge ${item.status === 'out' ? 'dax-badge-danger' : 'dax-badge-warning'}`}>
                            {item.status === 'out' ? 'Agotado' : 'Stock bajo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <a href="/inventory" className="dax-btn-secondary" style={{ textDecoration: 'none', fontSize: '12px', padding: '8px 16px' }}>
                  Gestionar inventario →
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}