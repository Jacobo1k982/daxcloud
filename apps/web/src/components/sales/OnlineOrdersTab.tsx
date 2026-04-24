'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  ShoppingBag, Clock, ChefHat, CheckCircle, Truck, Store,
  Phone, MapPin, FileText, RefreshCw, ExternalLink, Copy,
  Bell, Package, User,
} from 'lucide-react';

interface OnlineOrder {
  id: string;
  orderNumber: string;
  status: string;
  type: 'pickup' | 'delivery';
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  items: { productId: string; name: string; price: number; quantity: number }[];
  total: number;
  createdAt: string;
  branch?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  new:       { label: 'Nuevo',      color: 'var(--dax-coral)', bg: 'var(--dax-coral-soft)',   icon: Bell       },
  preparing: { label: 'Preparando', color: 'var(--dax-amber)', bg: 'var(--dax-warning-bg)', icon: ChefHat    },
  ready:     { label: 'Listo',      color: 'var(--dax-blue)', bg: 'var(--dax-info-bg)', icon: CheckCircle },
  delivered: { label: 'Entregado',  color: 'var(--dax-success)', bg: 'var(--dax-success-bg)', icon: Truck      },
  cancelled: { label: 'Cancelado',  color: 'var(--dax-danger)', bg: 'var(--dax-danger-bg)',  icon: Package    },
};

const STATUS_FLOW: Record<string, string> = {
  new:       'preparing',
  preparing: 'ready',
  ready:     'delivered',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function OrderCard({ order, onUpdateStatus }: { order: OnlineOrder; onUpdateStatus: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.new;
  const Icon = cfg.icon;
  const nextStatus = STATUS_FLOW[order.status];
  const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;

  return (
    <div style={{
      background: 'rgba(10,18,32,0.95)',
      border: `1px solid ${order.status === 'new' ? 'var(--dax-coral-border)' : 'var(--dax-surface-2)'}`,
      borderRadius: '14px',
      overflow: 'hidden',
      transition: 'border-color .2s',
      animation: order.status === 'new' ? 'newOrderPulse 3s ease-in-out infinite' : 'none',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Status icon */}
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cfg.color}30` }}>
          <Icon size={17} color={cfg.color}/>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--dax-text-primary)', letterSpacing: '-.01em' }}>{order.orderNumber}</span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.color}25` }}>{cfg.label}</span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: order.type === 'delivery' ? 'var(--dax-info-bg)' : 'var(--dax-surface-2)', color: order.type === 'delivery' ? '#5AAAF0' : 'var(--dax-white-35)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              {order.type === 'delivery' ? <Truck size={10}/> : <Store size={10}/>}
              {order.type === 'delivery' ? 'Delivery' : 'Pickup'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={11} color="rgba(255,255,255,0.3)"/>
            <span style={{ fontSize: '12px', color: 'var(--dax-white-60)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{order.customerName}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
          <p style={{ fontSize: '16px', fontWeight: 900, color: 'var(--dax-coral)', letterSpacing: '-.02em' }}>{formatCurrency(order.total)}</p>
          <p style={{ fontSize: '10px', color: 'var(--dax-white-25)', marginTop: '1px' }}>{timeAgo(order.createdAt)}</p>
        </div>
      </div>

      {/* Items preview */}
      <div style={{ padding: '0 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '11px', color: 'var(--dax-white-35)', lineHeight: 1.5 }}>
          {order.items.map(i => `${i.quantity}× ${i.name}`).join(' · ')}
        </p>
      </div>

      {/* Expandido */}
      {expanded && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          {/* Desglose items */}
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--dax-white-60)' }}>{item.quantity}× {item.name}</span>
              <span style={{ color: 'var(--dax-white-60)', fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          {/* Info cliente */}
          <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--dax-surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Phone size={12} color="rgba(255,255,255,0.3)"/>
              <span style={{ fontSize: '12px', color: 'var(--dax-white-60)' }}>{order.customerPhone}</span>
            </div>
            {order.customerAddress && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                <MapPin size={12} color="rgba(255,255,255,0.3)" style={{ marginTop: '1px' }}/>
                <span style={{ fontSize: '12px', color: 'var(--dax-white-60)', lineHeight: 1.4 }}>{order.customerAddress}</span>
              </div>
            )}
            {order.notes && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                <FileText size={12} color="rgba(255,255,255,0.3)" style={{ marginTop: '1px' }}/>
                <span style={{ fontSize: '12px', color: 'var(--dax-white-60)', lineHeight: 1.4, fontStyle: 'italic' }}>{order.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => setExpanded(p => !p)} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--dax-white-35)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dax-white-35)')}>
          {expanded ? 'Ocultar' : 'Ver detalle'}
        </button>

        {/* Llamar cliente */}
        <a href={`tel:${order.customerPhone}`} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(90,170,240,0.2)', background: 'var(--dax-info-bg)', color: 'var(--dax-blue)', fontSize: '11px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all .15s' }}>
          <Phone size={11}/> Llamar
        </a>

        <div style={{ flex: 1 }}/>

        {/* Cancelar */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <button onClick={() => onUpdateStatus(order.id, 'cancelled')}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(224,80,80,0.15)', background: 'transparent', color: 'rgba(224,80,80,0.5)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(224,80,80,0.35)'; (e.currentTarget as HTMLElement).style.color='#E07070'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(224,80,80,0.15)'; (e.currentTarget as HTMLElement).style.color='rgba(224,80,80,0.5)'; }}>
            Cancelar
          </button>
        )}

        {/* Avanzar estado */}
        {nextStatus && nextCfg && (
          <button onClick={() => onUpdateStatus(order.id, nextStatus)}
            style={{ padding: '8px 14px', borderRadius: '9px', border: 'none', background: `linear-gradient(135deg,${nextCfg.color},${nextCfg.color}CC)`, color: 'var(--dax-text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 2px 12px ${nextCfg.color}30` }}>
            {nextStatus === 'preparing' && <ChefHat size={13}/>}
            {nextStatus === 'ready'     && <CheckCircle size={13}/>}
            {nextStatus === 'delivered' && <Truck size={13}/>}
            {nextCfg.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function OnlineOrdersTab() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const slug = (user as any)?.tenantSlug ?? '';

  const { data: orders = [], isLoading, refetch } = useQuery<OnlineOrder[]>({
    queryKey: ['online-orders', statusFilter],
    queryFn: async () => {
      const params = statusFilter === 'active'
        ? '?status=new&status=preparing&status=ready'
        : statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/online-orders${params}`);
      return res.data;
    },
    refetchInterval: 15000, // Refresca cada 15s
  });

  const { data: stats } = useQuery({
    queryKey: ['online-orders-stats'],
    queryFn: () => api.get('/online-orders/stats').then(r => r.data),
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/online-orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['online-orders'] });
      qc.invalidateQueries({ queryKey: ['online-orders-stats'] });
    },
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/order/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const FILTERS = [
    { id: 'active',    label: 'Activos',    count: (stats?.new ?? 0) + (stats?.preparing ?? 0) + (stats?.ready ?? 0) },
    { id: 'new',       label: 'Nuevos',     count: stats?.new ?? 0 },
    { id: 'preparing', label: 'Preparando', count: stats?.preparing ?? 0 },
    { id: 'ready',     label: 'Listos',     count: stats?.ready ?? 0 },
    { id: 'delivered', label: 'Entregados', count: null },
    { id: 'all',       label: 'Todos',      count: null },
  ];

  return (
    <div>
      {/* Stats + Link */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Nuevos',      value: stats?.new ?? 0,       color: 'var(--dax-coral)' },
          { label: 'Preparando',  value: stats?.preparing ?? 0, color: 'var(--dax-amber)' },
          { label: 'Listos',      value: stats?.ready ?? 0,     color: 'var(--dax-blue)' },
          { label: 'Hoy',         value: stats?.today ?? 0,     color: 'var(--dax-success)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '16px', background: 'var(--dax-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
            <p style={{ fontSize: '24px', fontWeight: 900, color, letterSpacing: '-.02em', marginBottom: '4px' }}>{value}</p>
            <p style={{ fontSize: '11px', color: 'var(--dax-white-35)', fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Link público */}
      {slug && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--dax-coral-soft)', border: '1px solid rgba(255,92,53,0.15)', borderRadius: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
          <ShoppingBag size={16} color="#FF5C35" style={{ flexShrink: 0 }}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,92,53,0.6)', fontWeight: 600, marginBottom: '2px' }}>Link de pedidos online</p>
            <p style={{ fontSize: '12px', color: 'var(--dax-white-60)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontFamily: 'monospace' }}>
              {typeof window !== 'undefined' ? window.location.origin : 'https://daxcloud.shop'}/order/{slug}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,92,53,0.2)', background: 'transparent', color: 'rgba(255,92,53,0.7)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              <Copy size={11}/> Copiar
            </button>
            <a href={`/order/${slug}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'var(--dax-coral-soft)', color: 'var(--dax-coral)', fontSize: '11px', fontWeight: 700, textDecoration: 'none', transition: 'all .15s' }}>
              <ExternalLink size={11}/> Ver página
            </a>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '16px', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setStatusFilter(f.id)}
            style={{ padding: '6px 13px', borderRadius: '20px', border: `1px solid ${statusFilter === f.id ? 'rgba(255,92,53,0.4)' : 'var(--dax-surface-2)'}`, background: statusFilter === f.id ? 'var(--dax-coral-soft)' : 'transparent', color: statusFilter === f.id ? '#FF5C35' : 'var(--dax-white-35)', fontSize: '12px', fontWeight: statusFilter === f.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {f.label}
            {f.count !== null && f.count > 0 && (
              <span style={{ padding: '1px 6px', borderRadius: '10px', background: statusFilter === f.id ? '#FF5C35' : 'var(--dax-border)', color: statusFilter === f.id ? '#fff' : 'var(--dax-white-60)', fontSize: '10px', fontWeight: 800 }}>{f.count}</span>
            )}
          </button>
        ))}
        <button onClick={() => refetch()} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: 'var(--dax-text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
          <RefreshCw size={11}/> Actualizar
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div style={{ textAlign: 'center' as const, padding: '48px 0' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid rgba(255,92,53,0.2)', borderTopColor: '#FF5C35', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }}/>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>Cargando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center' as const, padding: '56px 24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--dax-coral-soft)', border: '1px solid rgba(255,92,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShoppingBag size={24} color="rgba(255,92,53,0.4)"/>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-white-60)', marginBottom: '6px' }}>Sin pedidos {statusFilter === 'active' ? 'activos' : ''}</p>
          <p style={{ fontSize: '13px', color: 'var(--dax-white-25)', lineHeight: 1.6 }}>
            Comparte el link de tu tienda online para empezar a recibir pedidos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}/>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes newOrderPulse { 0%,100%{border-color:rgba(255,92,53,0.3)} 50%{border-color:rgba(255,92,53,0.65)} }
      `}</style>
    </div>
  );
}
