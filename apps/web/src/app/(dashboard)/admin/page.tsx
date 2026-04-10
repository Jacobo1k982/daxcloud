'use client';

import { useState }                  from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth }                    from '@/hooks/useAuth';
import { api }                        from '@/lib/api';
import { getImageUrl }                from '@/lib/imageUrl';
import {
  CheckCircle, XCircle, Clock, Eye,
  RefreshCw, Building2, X,
} from 'lucide-react';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:  { label: 'Pendiente', color: '#F0A030', bg: 'rgba(240,160,48,.1)',  icon: Clock        },
  approved: { label: 'Aprobado',  color: '#22C55E', bg: 'rgba(34,197,94,.1)',   icon: CheckCircle  },
  rejected: { label: 'Rechazado', color: '#E05050', bg: 'rgba(224,80,80,.1)',   icon: XCircle      },
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', growth: 'Growth', scale: 'Scale',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
  const { user }    = useAuth();
  const queryClient = useQueryClient();

  const [filter,     setFilter]     = useState('pending');
  const [selected,   setSelected]   = useState<any | null>(null);
  const [notes,      setNotes]      = useState('');
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  // Verifica que sea admin
  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--dax-text-muted)' }}>
        <p>Acceso restringido</p>
      </div>
    );
  }

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-payment-requests', filter],
    queryFn:  async () => {
      const { data } = await api.get(`/payment-requests?status=${filter}`);
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) =>
      api.put(`/payment-requests/${id}/approve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      setSelected(null);
      setNotes('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) =>
      api.put(`/payment-requests/${id}/reject`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      setSelected(null);
      setNotes('');
    },
  });

  const pendingCount = (requests as any[]).filter((r: any) => r.status === 'pending').length;

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Panel de pagos</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Solicitudes de pago por SINPE</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {pendingCount > 0 && (
            <span style={{ background: '#F0A030', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => refetch()}
            style={{ background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '8px', borderRadius: '8px', display: 'flex' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['pending', 'approved', 'rejected'].map(s => {
          const cfg = STATUS_CFG[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                border:     `1px solid ${filter === s ? cfg.color : 'var(--dax-border)'}`,
                background: filter === s ? cfg.bg : 'transparent',
                color:      filter === s ? cfg.color : 'var(--dax-text-muted)',
                cursor:     'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="dax-card">
        <div className="dax-table-wrap">
          <table className="dax-table">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Plan</th>
                <th>Monto</th>
                <th>Referencia</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'center' }}>Comprobante</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>Cargando...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>No hay solicitudes {filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}</td></tr>
              ) : (
                (requests as any[]).map((req: any) => {
                  const cfg  = STATUS_CFG[req.status] ?? STATUS_CFG.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--dax-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={13} color="var(--dax-text-muted)" />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1 }}>{req.tenant?.name ?? '—'}</p>
                            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{req.tenant?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)' }}>
                          {PLAN_LABELS[req.planName] ?? req.planName}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)', display: 'block' }}>
                          {req.billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                        ${Number(req.amount).toFixed(2)} USD
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--dax-text-secondary)' }}>
                        {req.reference}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                        {fmtDate(req.createdAt)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {req.receiptUrl ? (
                          <button
                            onClick={() => setImgPreview(getImageUrl(req.receiptUrl) ?? req.receiptUrl)}
                            style={{ background: 'rgba(90,170,240,.1)', border: 'none', cursor: 'pointer', color: '#5AAAF0', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={11} /> Ver
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Sin comprobante</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 8px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => { setSelected(req); setNotes(''); }}
                            style={{ background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-text-secondary)', padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600 }}
                          >
                            Revisar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de revisión */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Revisar solicitud</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><X size={16} /></button>
            </div>

            <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Negocio',    value: selected.tenant?.name },
                { label: 'Plan',       value: `${PLAN_LABELS[selected.planName]} (${selected.billingCycle === 'annual' ? 'Anual' : 'Mensual'})` },
                { label: 'Monto',      value: `$${Number(selected.amount).toFixed(2)} USD` },
                { label: 'Referencia', value: selected.reference },
                { label: 'Fecha',      value: fmtDate(selected.createdAt) },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {selected.receiptUrl && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>Comprobante</p>
                <img
                  src={getImageUrl(selected.receiptUrl) ?? selected.receiptUrl}
                  alt="Comprobante"
                  style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--dax-border)', maxHeight: '200px', objectFit: 'contain', background: 'var(--dax-surface-2)' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
                Nota (opcional)
              </label>
              <input
                className="dax-input"
                placeholder="Motivo de aprobación o rechazo..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ margin: 0 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => rejectMutation.mutate({ id: selected.id, notes })}
                disabled={rejectMutation.isPending}
                style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid rgba(224,80,80,.4)', background: 'rgba(224,80,80,.06)', color: '#E05050', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <XCircle size={14} />
                {rejectMutation.isPending ? 'Rechazando...' : 'Rechazar'}
              </button>
              <button
                onClick={() => approveMutation.mutate({ id: selected.id, notes })}
                disabled={approveMutation.isPending}
                style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#22C55E', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(34,197,94,.3)' }}
              >
                <CheckCircle size={14} />
                {approveMutation.isPending ? 'Aprobando...' : 'Aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview comprobante */}
      {imgPreview && (
        <div onClick={() => setImgPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'pointer' }}>
          <img src={imgPreview} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
