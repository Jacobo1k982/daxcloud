'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import {
  ShoppingCart, TrendingUp, DollarSign, Search,
  Filter, Download, X, RefreshCw, Eye, Loader2,
  Wallet, CreditCard, Smartphone, ArrowUpRight,
  User, MapPin, Calendar, FileText, Package,
  ChevronLeft, ChevronRight, Zap, Receipt,
} from 'lucide-react';



interface MixedPayments { cash?: number; card?: number; transfer?: number; }
interface Sale {
  id: string; total: number; subtotal: number; discount: number; tax: number;
  status: string; paymentMethod: string; mixedPayments: MixedPayments | null;
  createdAt: string; notes: string;
  branch: { id: string; name: string };
  user:   { firstName: string; lastName: string };
  client?: { firstName: string; lastName: string; companyName?: string; isCompany?: boolean };
  items: { id: string; quantity: number; unitPrice: number; discount: number; subtotal: number; product: { name: string; sku: string } }[];
}

const PAYMENT_LABELS:  Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'SINPE', mixed: 'Mixto' };
const PAYMENT_COLORS:  Record<string, string> = { cash: '#3DBF7F', card: '#5AAAF0', transfer: '#A78BFA', mixed: '#F0A030' };
const PAYMENT_ICONS:   Record<string, any>    = { cash: Wallet, card: CreditCard, transfer: Smartphone, mixed: ArrowUpRight };
const STATUS_LABELS:   Record<string, string> = { completed: 'Completada', cancelled: 'Cancelada', refunded: 'Reembolsada' };
const STATUS_COLORS:   Record<string, string> = { completed: '#3DBF7F', cancelled: '#E05050', refunded: '#F0A030' };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

// ── Modal detalle ─────────────────────────────────────────────────────────────
function SaleDetailModal({ sale, onClose, formatCurrency }: { sale: Sale; onClose: () => void; formatCurrency: (n: number) => string }) {
  const clientName = sale.client
    ? (sale.client.isCompany ? sale.client.companyName : `${sale.client.firstName} ${sale.client.lastName ?? ''}`.trim())
    : null;
  const PayIcon = PAYMENT_ICONS[sale.paymentMethod] ?? ShoppingCart;
  const pColor  = PAYMENT_COLORS[sale.paymentMethod] ?? '#FF5C35';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dax-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,92,53,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={15} color="#FF5C35" />
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Detalle de venta</h2>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', fontFamily: 'monospace' }}>
                #{sale.id.slice(-8).toUpperCase()} · {fmtDate(sale.createdAt)} {fmtTime(sale.createdAt)}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
          </div>

          {/* Info rápida */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
            {[
              { label: 'Sucursal', value: sale.branch?.name ?? '—', icon: MapPin },
              { label: 'Cajero',   value: `${sale.user?.firstName} ${sale.user?.lastName}`, icon: User },
              ...(clientName ? [{ label: 'Cliente', value: clientName, icon: User }] : []),
            ].map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: '9px', padding: '9px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ItemIcon size={12} color="var(--dax-text-muted)" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                  </div>
                </div>
              );
            })}

            {/* Estado */}
            <div style={{ background: `${STATUS_COLORS[sale.status] ?? '#888'}10`, borderRadius: '9px', padding: '9px 12px', border: `1px solid ${STATUS_COLORS[sale.status] ?? '#888'}20` }}>
              <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1px' }}>Estado</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: STATUS_COLORS[sale.status] ?? '#888' }}>{STATUS_LABELS[sale.status] ?? sale.status}</p>
            </div>

            {/* Método de pago */}
            <div style={{ background: `${pColor}10`, borderRadius: '9px', padding: '9px 12px', border: `1px solid ${pColor}20`, gridColumn: sale.paymentMethod === 'mixed' ? '1 / -1' : undefined }}>
              <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Método de pago</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: sale.paymentMethod === 'mixed' ? '8px' : 0 }}>
                <PayIcon size={13} color={pColor} />
                <p style={{ fontSize: '12px', fontWeight: 700, color: pColor }}>{PAYMENT_LABELS[sale.paymentMethod]}</p>
              </div>
              {sale.paymentMethod === 'mixed' && sale.mixedPayments && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(sale.mixedPayments).filter(([, v]) => Number(v) > 0).map(([k, v]) => {
                    const kColor = PAYMENT_COLORS[k] ?? '#888';
                    const KIcon  = PAYMENT_ICONS[k] ?? ShoppingCart;
                    return (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: `${kColor}12`, borderRadius: '7px', border: `1px solid ${kColor}25` }}>
                        <KIcon size={11} color={kColor} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: kColor }}>{formatCurrency(Number(v))}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Productos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '10px' }}>Productos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sale.items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--dax-surface-2)', borderRadius: '9px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,92,53,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={12} color="#FF5C35" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                  <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
                    ×{item.quantity} · {formatCurrency(Number(item.unitPrice))}
                    {item.discount > 0 && <span style={{ color: '#F0A030', marginLeft: '6px' }}>-{formatCurrency(Number(item.discount))}</span>}
                  </p>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', flexShrink: 0 }}>{formatCurrency(Number(item.subtotal))}</p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div style={{ marginTop: '14px', padding: '12px 14px', background: 'var(--dax-surface-2)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Subtotal</span>
              <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{formatCurrency(Number(sale.subtotal))}</span>
            </div>
            {sale.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Descuento</span>
                <span style={{ fontSize: '12px', color: '#F0A030', fontWeight: 600 }}>-{formatCurrency(Number(sale.discount))}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Impuesto</span>
                <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{formatCurrency(Number(sale.tax))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--dax-border)', marginTop: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Total</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#FF5C35' }}>{formatCurrency(Number(sale.total))}</span>
            </div>
          </div>

          {sale.notes && (
            <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(90,170,240,.06)', borderRadius: '8px', border: '1px solid rgba(90,170,240,.15)' }}>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>Nota</p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', fontStyle: 'italic' }}>{sale.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function SalesPage() {
  const { formatCurrency } = useAuth();
  const { token }          = useAuthStore();

  const [selectedSale,   setSelectedSale]   = useState<Sale | null>(null);
  const [search,         setSearch]         = useState('');
  const [paymentFilter,  setPaymentFilter]  = useState('');
  const [exporting,      setExporting]      = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', branchId: '', page: 1 });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn:  async () => { const { data } = await api.get('/branches'); return data; },
  });

  const { data: salesData, isLoading, refetch } = useQuery({
    queryKey: ['sales', filters, paymentFilter],
    queryFn:  async () => {
      const p = new URLSearchParams();
      if (filters.startDate)  p.append('startDate',     filters.startDate);
      if (filters.endDate)    p.append('endDate',       filters.endDate);
      if (filters.branchId)   p.append('branchId',      filters.branchId);
      if (paymentFilter)      p.append('paymentMethod', paymentFilter);
      p.append('page',  String(filters.page));
      p.append('limit', '20');
      const { data } = await api.get(`/sales?${p}`);
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

  const sales:      Sale[]  = salesData?.data ?? [];
  const total:      number  = salesData?.total ?? 0;
  const totalPages: number  = Math.ceil(total / 20);

  // Filtro local por búsqueda
  const filtered = search
    ? sales.filter(s =>
        s.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        s.branch?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.client?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        s.client?.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : sales;

  const handleExport = async () => {
    setExporting(true);
    try {
      const p = new URLSearchParams();
      if (filters.startDate) p.append('startDate', filters.startDate);
      if (filters.endDate)   p.append('endDate',   filters.endDate);
      const res  = await fetch(`${API_URL}/exports/sales?${p}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ventas-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { setExporting(false); }
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', branchId: '', page: 1 });
    setPaymentFilter('');
    setSearch('');
  };

  const STATS = [
    { label: 'Ingresos hoy',       value: formatCurrency(summary?.revenueToday ?? 0),  color: '#FF5C35', icon: DollarSign  },
    { label: 'Transacciones hoy',  value: summary?.salesToday ?? 0,                    color: '#5AAAF0', icon: ShoppingCart },
    { label: 'Ticket promedio',    value: formatCurrency(summary?.avgTicket ?? 0),      color: '#A78BFA', icon: TrendingUp  },
    { label: 'Total registros',    value: total,                                        color: '#3DBF7F', icon: FileText    },
  ];

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 40px)', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Ventas</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Historial completo de transacciones</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => refetch()} style={{ width: '36px', height: '36px', borderRadius: '9px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            {exporting ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Download size={13} />}
            Excel
          </button>
          <a href="/pos" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 700, boxShadow: '0 3px 12px rgba(255,92,53,.3)', whiteSpace: 'nowrap' }}>
            <Zap size={13} /> POS
          </a>
        </div>
      </div>

      {/* Stats — GRID FIJO 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="dax-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${s.color}20` }}>
                <Icon size={18} color={s.color} strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '3px' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="dax-card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Búsqueda */}
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
            <input className="dax-input" placeholder="Buscar cajero, cliente, ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '30px', margin: 0, height: '36px', fontSize: '12px' }} />
          </div>

          {/* Fecha desde */}
          <div style={{ minWidth: '130px' }}>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Desde</p>
            <input className="dax-input" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value, page: 1 })} style={{ margin: 0, height: '36px', fontSize: '12px' }} />
          </div>

          {/* Fecha hasta */}
          <div style={{ minWidth: '130px' }}>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Hasta</p>
            <input className="dax-input" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value, page: 1 })} style={{ margin: 0, height: '36px', fontSize: '12px' }} />
          </div>

          {/* Sucursal */}
          {(branches as any[]).length > 1 && (
            <select className="dax-input" value={filters.branchId} onChange={e => setFilters({ ...filters, branchId: e.target.value, page: 1 })} style={{ margin: 0, height: '36px', fontSize: '12px', minWidth: '140px' }}>
              <option value="">Todas las sucursales</option>
              {(branches as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}

          {/* Método de pago */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--dax-surface-2)', padding: '3px', borderRadius: '9px', border: '1px solid var(--dax-border)' }}>
            {[{ value: '', label: 'Todos' }, { value: 'cash', label: '💵' }, { value: 'card', label: '💳' }, { value: 'transfer', label: '📱' }, { value: 'mixed', label: '🔀' }].map(opt => (
              <button key={opt.value} onClick={() => setPaymentFilter(opt.value)} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: paymentFilter === opt.value ? 700 : 400, background: paymentFilter === opt.value ? 'var(--dax-surface)' : 'transparent', color: paymentFilter === opt.value ? 'var(--dax-coral)' : 'var(--dax-text-muted)', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Limpiar */}
          {(filters.startDate || filters.endDate || filters.branchId || paymentFilter || search) && (
            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 12px', height: '36px', borderRadius: '9px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-muted)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="dax-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
            {isLoading ? 'Cargando...' : `${total} venta${total !== 1 ? 's' : ''}${search ? ` · ${filtered.length} visible${filtered.length !== 1 ? 's' : ''}` : ''}`}
          </p>
        </div>

        <div className="dax-table-wrap">
          <table className="dax-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cajero</th>
                <th>Cliente</th>
                <th>Sucursal</th>
                <th>Método</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Ver</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--dax-text-muted)' }}>
                  <Loader2 size={18} style={{ animation: 'spin .7s linear infinite', margin: '0 auto', display: 'block' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <ShoppingCart size={28} color="var(--dax-text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
                  <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>No hay ventas en este período</p>
                </td></tr>
              ) : filtered.map(sale => {
                const pColor = PAYMENT_COLORS[sale.paymentMethod] ?? '#888';
                const PayIcon = PAYMENT_ICONS[sale.paymentMethod] ?? ShoppingCart;
                const clientName = sale.client
                  ? (sale.client.isCompany ? sale.client.companyName : `${sale.client.firstName} ${sale.client.lastName ?? ''}`.trim())
                  : null;
                return (
                  <tr key={sale.id}>
                    <td>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '2px' }}>{fmtDate(sale.createdAt)}</p>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{fmtTime(sale.createdAt)}</p>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>
                      {sale.user?.firstName} {sale.user?.lastName}
                    </td>
                    <td style={{ fontSize: '12px', color: clientName ? 'var(--dax-text-secondary)' : 'var(--dax-text-muted)' }}>
                      {clientName ?? '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{sale.branch?.name ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `${pColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PayIcon size={11} color={pColor} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: pColor }}>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: STATUS_COLORS[sale.status] ?? '#888', background: `${STATUS_COLORS[sale.status] ?? '#888'}12`, padding: '3px 8px', borderRadius: '20px', display: 'inline-block' }}>
                        {STATUS_LABELS[sale.status] ?? sale.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--dax-text-primary)', fontSize: '13px' }}>
                      {formatCurrency(Number(sale.total))}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => setSelectedSale(sale)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-coral)', fontSize: '11px', fontWeight: 700 }}>
                        <Eye size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--dax-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Página {filters.page} de {totalPages}</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} disabled={filters.page === 1} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-muted)', fontSize: '12px', fontWeight: 600, cursor: filters.page === 1 ? 'not-allowed' : 'pointer', opacity: filters.page === 1 ? .4 : 1 }}>
                <ChevronLeft size={13} /> Anterior
              </button>
              <button onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} disabled={filters.page >= totalPages} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-muted)', fontSize: '12px', fontWeight: 600, cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer', opacity: filters.page >= totalPages ? .4 : 1 }}>
                Siguiente <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedSale && <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} formatCurrency={formatCurrency} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

