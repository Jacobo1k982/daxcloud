'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface MixedPayments {
  cash?:     number;
  card?:     number;
  transfer?: number;
}

interface Sale {
  id:            string;
  total:         number;
  subtotal:      number;
  discount:      number;
  tax:           number;
  status:        string;
  paymentMethod: string;
  mixedPayments: MixedPayments | null;
  createdAt:     string;
  notes:         string;
  branch: { id: string; name: string };
  user:   { firstName: string; lastName: string; email: string };
  items: {
    id:       string;
    quantity: number;
    unitPrice: number;
    discount:  number;
    subtotal:  number;
    product:  { name: string; sku: string };
  }[];
}

const paymentLabels: Record<string, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia',
  mixed:    'Mixto',
};

const paymentIcons: Record<string, string> = {
  cash:     '💵',
  card:     '💳',
  transfer: '📱',
  mixed:    '🔀',
};

const paymentColors: Record<string, string> = {
  cash:     '#22C55E',
  card:     '#5AAAF0',
  transfer: '#A78BFA',
};

const statusLabels: Record<string, string> = {
  completed: 'Completada',
  cancelled: 'Cancelada',
  refunded:  'Reembolsada',
};

export default function SalesPage() {
  const { formatCurrency, hasFeature } = useAuth();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate:   '',
    branchId:  '',
    page:      1,
  });

  const canExport  = hasFeature('export_reports');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn:  async () => { const { data } = await api.get('/branches'); return data; },
  });

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', filters],
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate)   params.append('endDate',   filters.endDate);
      if (filters.branchId)  params.append('branchId',  filters.branchId);
      params.append('page',  String(filters.page));
      params.append('limit', '20');
      const { data } = await api.get(`/sales?${params.toString()}`);
      return data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['sales-summary', filters.branchId],
    queryFn:  async () => {
      const { data } = await api.get(`/sales/summary${filters.branchId ? `?branchId=${filters.branchId}` : ''}`);
      return data;
    },
  });

  const sales: Sale[] = salesData?.data ?? [];
  const total         = salesData?.total ?? 0;
  const totalPages    = Math.ceil(total / 20);

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Ventas</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Historial de transacciones</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canExport && <button className="dax-btn-secondary">Exportar</button>}
          <a href="/pos" className="dax-btn-primary" style={{ textDecoration: 'none' }}>Abrir POS</a>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="dax-card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Ventas hoy</p>
          <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--dax-text-primary)' }}>
            {formatCurrency(summary?.revenueToday ?? 0)}
          </p>
        </div>
        <div className="dax-card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Transacciones hoy</p>
          <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--dax-text-primary)' }}>
            {summary?.salesToday ?? 0}
          </p>
        </div>
        <div className="dax-card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Total registros</p>
          <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Syne, sans-serif', color: 'var(--dax-text-primary)' }}>
            {total}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="dax-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Desde</label>
            <input className="dax-input" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value, page: 1 })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Hasta</label>
            <input className="dax-input" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value, page: 1 })} />
          </div>
          {branches.length > 1 && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Sucursal</label>
              <select className="dax-input" value={filters.branchId} onChange={e => setFilters({ ...filters, branchId: e.target.value, page: 1 })}>
                <option value="">Todas</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => setFilters({ startDate: '', endDate: '', branchId: '', page: 1 })} className="dax-btn-ghost" style={{ alignSelf: 'flex-end' }}>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="dax-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dax-border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>
            {isLoading ? 'Cargando...' : `${total} venta${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="dax-table-wrap">
          <table className="dax-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Sucursal</th>
                <th>Cajero</th>
                <th>Pago</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>Cargando ventas...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>No hay ventas en este período.</td></tr>
              ) : (
                sales.map((sale: Sale) => (
                  <tr key={sale.id}>
                    <td style={{ color: 'var(--dax-text-secondary)', fontSize: '12px' }}>
                      {new Date(sale.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <br />
                      <span style={{ color: 'var(--dax-text-muted)' }}>
                        {new Date(sale.createdAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ color: 'var(--dax-text-secondary)' }}>{sale.branch?.name ?? '-'}</td>
                    <td style={{ color: 'var(--dax-text-secondary)' }}>{sale.user?.firstName} {sale.user?.lastName}</td>
                    <td>
                      {/* Badge de método de pago con ícono */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '13px' }}>{paymentIcons[sale.paymentMethod] ?? '💰'}</span>
                        <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>
                          {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
                        </span>
                      </div>
                      {/* Mini desglose mixto en la tabla */}
                      {sale.paymentMethod === 'mixed' && sale.mixedPayments && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {Object.entries(sale.mixedPayments)
                            .filter(([, v]) => Number(v) > 0)
                            .map(([k, v]) => (
                              <span key={k} style={{ fontSize: '9px', background: `${paymentColors[k] ?? '#999'}20`, color: paymentColors[k] ?? '#999', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                {paymentIcons[k]} {formatCurrency(Number(v))}
                              </span>
                            ))
                          }
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`dax-badge ${sale.status === 'completed' ? 'dax-badge-success' : sale.status === 'cancelled' ? 'dax-badge-danger' : 'dax-badge-warning'}`}>
                        {statusLabels[sale.status] ?? sale.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                      {formatCurrency(Number(sale.total))}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => setSelectedSale(sale)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-coral)', fontSize: '12px', fontWeight: 700 }}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--dax-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
              Página {filters.page} de {totalPages}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))} disabled={filters.page === 1} className="dax-btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>Anterior</button>
              <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))} disabled={filters.page >= totalPages} className="dax-btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal detalle de venta ── */}
      {selectedSale && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '540px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Detalle de venta</h2>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
                  {new Date(selectedSale.createdAt).toLocaleString('es-CR')}
                </p>
              </div>
              <button onClick={() => setSelectedSale(null)} style={{ background: 'none', border: 'none', color: 'var(--dax-text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            {/* Info venta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Sucursal', value: selectedSale.branch?.name },
                { label: 'Cajero',   value: `${selectedSale.user?.firstName} ${selectedSale.user?.lastName}` },
                { label: 'Estado',   value: statusLabels[selectedSale.status] },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>{item.label}</p>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                </div>
              ))}

              {/* Método de pago — ocupa toda la columna si es mixto */}
              <div style={{
                background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '12px',
                gridColumn: selectedSale.paymentMethod === 'mixed' ? '1 / -1' : undefined,
              }}>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>Método de pago</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: selectedSale.paymentMethod === 'mixed' ? '10px' : 0 }}>
                  <span style={{ fontSize: '16px' }}>{paymentIcons[selectedSale.paymentMethod] ?? '💰'}</span>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>
                    {paymentLabels[selectedSale.paymentMethod]}
                  </p>
                </div>

                {/* Desglose mixto completo */}
                {selectedSale.paymentMethod === 'mixed' && selectedSale.mixedPayments && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(selectedSale.mixedPayments)
                      .filter(([, v]) => Number(v) > 0)
                      .map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: `${paymentColors[k] ?? '#999'}12`, borderRadius: '8px', border: `1px solid ${paymentColors[k] ?? '#999'}25` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>{paymentIcons[k]}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>
                              {paymentLabels[k]}
                            </span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: paymentColors[k] ?? '#999' }}>
                            {formatCurrency(Number(v))}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '12px' }}>Productos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedSale.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dax-text-primary)' }}>{item.product.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                        {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                        {item.discount > 0 && <span style={{ color: 'var(--dax-warning)', marginLeft: '8px' }}>-{formatCurrency(Number(item.discount))}</span>}
                      </p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                      {formatCurrency(Number(item.subtotal))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>Subtotal</span>
                <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>{formatCurrency(Number(selectedSale.subtotal))}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>Descuento</span>
                  <span style={{ fontSize: '13px', color: 'var(--dax-warning)' }}>-{formatCurrency(Number(selectedSale.discount))}</span>
                </div>
              )}
              {selectedSale.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>Impuesto</span>
                  <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>{formatCurrency(Number(selectedSale.tax))}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dax-coral)' }}>{formatCurrency(Number(selectedSale.total))}</span>
              </div>
            </div>

            {selectedSale.notes && (
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '16px', fontStyle: 'italic' }}>
                Nota: {selectedSale.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
