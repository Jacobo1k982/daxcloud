'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth }   from '@/hooks/useAuth';
import { api }       from '@/lib/api';
import {
  Plus, X, Search, Phone, Mail, CreditCard,
  ShoppingBag, User, Trash2, Pencil, Eye,
  Users, AlertTriangle, Check, Loader2,
  Calendar, FileText, DollarSign, RefreshCw,
  Building2, Star, Gift, TrendingUp, Hash,
  MapPin, ChevronUp,
} from 'lucide-react';

// ── Config de niveles ─────────────────────────────────────────────────────────
const LOYALTY_LEVELS: Record<string, { label: string; color: string; bg: string; icon: string; minSpent: number }> = {
  bronze:   { label: 'Bronce',  color: '#CD7F32', bg: 'rgba(205,127,50,.12)',  icon: '🥉', minSpent: 0      },
  silver:   { label: 'Plata',   color: '#9CA3AF', bg: 'rgba(156,163,175,.12)', icon: '🥈', minSpent: 50000  },
  gold:     { label: 'Oro',     color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  icon: '🥇', minSpent: 150000 },
  platinum: { label: 'Platino', color: '#8B5CF6', bg: 'rgba(139,92,246,.12)',  icon: '💎', minSpent: 300000 },
};

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '6px' }}>
    {children}{required && <span style={{ color: 'var(--dax-coral)', marginLeft: '3px' }}>*</span>}
  </label>
);

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LoyaltyBadge({ level }: { level: string }) {
  const cfg = LOYALTY_LEVELS[level] ?? LOYALTY_LEVELS.bronze;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: '20px', border: `1px solid ${cfg.color}30` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Avatar({ client, size = 40 }: { client: any; size?: number }) {
  const name   = client.isCompany ? (client.companyName || client.firstName) : client.firstName;
  const initials = name?.[0]?.toUpperCase() ?? '?';
  const colors = ['#FF5C35','#5AAAF0','#3DBF7F','#A78BFA','#F0A030','#EC4899'];
  const color  = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: client.isCompany ? '10px' : '50%', background: `${color}20`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {client.isCompany
        ? <Building2 size={size * 0.4} color={color} />
        : <span style={{ fontSize: size * 0.32, fontWeight: 700, color }}>{initials}</span>
      }
    </div>
  );
}

// ── Modal: Crear / Editar cliente ─────────────────────────────────────────────
function ClientFormModal({ client, onClose, onSave, showToast }: {
  client?:   any;
  onClose:   () => void;
  onSave:    () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const isEdit = !!client;
  const [form, setForm] = useState({
    code:        client?.code        ?? '',
    firstName:   client?.firstName   ?? '',
    lastName:    client?.lastName    ?? '',
    isCompany:   client?.isCompany   ?? false,
    companyName: client?.companyName ?? '',
    phone:       client?.phone       ?? '',
    email:       client?.email       ?? '',
    idNumber:    client?.idNumber    ?? '',
    birthDate:   client?.birthDate   ? client.birthDate.slice(0, 10) : '',
    address:     client?.address     ?? '',
    notes:       client?.notes       ?? '',
  });

  const f = useCallback((k: string, v: any) => setForm(p => ({ ...p, [k]: v })), []);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, code: form.code || undefined };
      if (isEdit) return api.put(`/clients/${client.id}`, payload);
      return api.post('/clients', payload);
    },
    onSuccess: () => { showToast(isEdit ? 'Cliente actualizado' : 'Cliente creado'); onSave(); },
    onError:   (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '560px', padding: '28px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 3px' }}>{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{isEdit ? 'Actualiza la información' : 'Completa los datos del cliente'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Toggle empresa */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: form.isCompany ? 'rgba(90,170,240,.08)' : 'var(--dax-surface-2)', borderRadius: '10px', border: `1px solid ${form.isCompany ? 'rgba(90,170,240,.3)' : 'var(--dax-border)'}`, transition: 'all .15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color={form.isCompany ? '#5AAAF0' : 'var(--dax-text-muted)'} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>Es empresa</p>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Activa si es una empresa o negocio</p>
              </div>
            </div>
            <button onClick={() => f('isCompany', !form.isCompany)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: form.isCompany ? '#5AAAF0' : 'var(--dax-surface-3)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: '2px', left: form.isCompany ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--dax-surface)', transition: 'left .2s', display: 'block' }} />
            </button>
          </div>

          {/* Nombre empresa (si aplica) */}
          {form.isCompany && (
            <div>
              <Label required>Nombre de la empresa</Label>
              <input className="dax-input" value={form.companyName} onChange={e => f('companyName', e.target.value)} placeholder="Empresa S.A." autoComplete="off" style={{ margin: 0 }} />
            </div>
          )}

          {/* Código y nombre */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
            <div>
              <Label>Código</Label>
              <div style={{ position: 'relative' }}>
                <Hash size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
                <input className="dax-input" value={form.code} onChange={e => f('code', e.target.value)} placeholder="CLI-001" autoComplete="off" style={{ margin: 0, paddingLeft: '28px' }} />
              </div>
              <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>Opcional, único</p>
            </div>
            <div>
              <Label required>{form.isCompany ? 'Contacto principal' : 'Nombre'}</Label>
              <input className="dax-input" value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="Juan" autoComplete="off" style={{ margin: 0 }} />
            </div>
          </div>

          {/* Apellido */}
          {!form.isCompany && (
            <div>
              <Label>Apellido</Label>
              <input className="dax-input" value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Pérez" autoComplete="off" style={{ margin: 0 }} />
            </div>
          )}

          {/* Teléfono y correo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Label>Teléfono</Label>
              <div style={{ position: 'relative' }}>
                <Phone size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
                <input className="dax-input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="8888-8888" type="tel" style={{ margin: 0, paddingLeft: '28px' }} />
              </div>
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <div style={{ position: 'relative' }}>
                <Mail size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
                <input className="dax-input" value={form.email} onChange={e => f('email', e.target.value)} placeholder="juan@email.com" type="email" style={{ margin: 0, paddingLeft: '28px' }} />
              </div>
            </div>
          </div>

          {/* Cédula y fecha nacimiento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Label>{form.isCompany ? 'Cédula jurídica' : 'Cédula / ID'}</Label>
              <input className="dax-input" value={form.idNumber} onChange={e => f('idNumber', e.target.value)} placeholder={form.isCompany ? '3-101-XXXXXX' : '1-2345-6789'} style={{ margin: 0 }} />
            </div>
            {!form.isCompany && (
              <div>
                <Label>Fecha de nacimiento</Label>
                <input className="dax-input" type="date" value={form.birthDate} onChange={e => f('birthDate', e.target.value)} style={{ margin: 0 }} />
              </div>
            )}
          </div>

          {/* Dirección */}
          <div>
            <Label>Dirección</Label>
            <div style={{ position: 'relative' }}>
              <MapPin size={12} style={{ position: 'absolute', left: '10px', top: '13px', color: 'var(--dax-text-muted)' }} />
              <input className="dax-input" value={form.address} onChange={e => f('address', e.target.value)} placeholder="Provincia, cantón, distrito..." style={{ margin: 0, paddingLeft: '28px' }} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label>Notas</Label>
            <textarea className="dax-input" value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Preferencias, alergias, condiciones especiales..." rows={3} style={{ margin: 0, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.firstName}
              className="dax-btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {mutation.isPending ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Modal: Detalle del cliente ────────────────────────────────────────────────
function ClientDetailModal({ clientId, onClose, onEdit, onDelete, showToast, formatCurrency }: {
  clientId:       string;
  onClose:        () => void;
  onEdit:         (c: any) => void;
  onDelete:       (c: any) => void;
  showToast:      (m: string, t?: 'success' | 'error') => void;
  formatCurrency: (n: number) => string;
}) {
  const queryClient = useQueryClient();
  const [tab,         setTab]         = useState<'info' | 'sales' | 'loyalty' | 'credit'>('info');
  const [creditInput, setCreditInput] = useState('');
  const [payInput,    setPayInput]    = useState('');
  const [pointsInput, setPointsInput] = useState('');
  const [redeemInput, setRedeemInput] = useState('');

  const { data: detail, isLoading } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn:  async () => { const { data } = await api.get(`/clients/${clientId}/sales`); return data; },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['client-stats'] });
  };

  const creditMutation = useMutation({
    mutationFn: async (amount: number) => api.post(`/clients/${clientId}/credit`, { amount }),
    onSuccess:  () => { invalidate(); setCreditInput(''); showToast('Fiado agregado'); },
    onError:    (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const payMutation = useMutation({
    mutationFn: async (amount: number) => api.post(`/clients/${clientId}/pay-credit`, { amount }),
    onSuccess:  () => { invalidate(); setPayInput(''); showToast('Pago registrado'); },
    onError:    (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const addPointsMutation = useMutation({
    mutationFn: async (points: number) => api.post(`/clients/${clientId}/points/add`, { points }),
    onSuccess:  () => { invalidate(); setPointsInput(''); showToast('Puntos agregados'); },
    onError:    (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const redeemMutation = useMutation({
    mutationFn: async (points: number) => api.post(`/clients/${clientId}/points/redeem`, { points }),
    onSuccess:  () => { invalidate(); setRedeemInput(''); showToast('Puntos canjeados'); },
    onError:    (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const client  = detail?.client;
  const stats   = detail?.stats;
  const sales   = detail?.sales   ?? [];
  const loyalty = detail?.loyalty;

  const PAYMENT_LABELS: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'SINPE', mixed: 'Mixto' };
  const PAYMENT_COLORS: Record<string, string> = { cash: '#3DBF7F', card: '#5AAAF0', transfer: '#A78BFA', mixed: '#F0A030' };

  const levelCfg = LOYALTY_LEVELS[client?.loyaltyLevel ?? 'bronze'] ?? LOYALTY_LEVELS.bronze;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '580px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {isLoading ? (
          <div style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--dax-text-muted)' }}>
            <Loader2 size={18} style={{ animation: 'spin .7s linear infinite' }} /> Cargando...
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--dax-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {client && <Avatar client={client} size={52} />}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                        {client?.isCompany ? (client?.companyName ?? client?.firstName) : `${client?.firstName} ${client?.lastName ?? ''}`.trim()}
                      </h2>
                      {client?.loyaltyLevel && <LoyaltyBadge level={client.loyaltyLevel} />}
                    </div>
                    {client?.code && <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--dax-text-muted)', background: 'var(--dax-surface-2)', padding: '1px 6px', borderRadius: '4px' }}>#{client.code}</span>}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {client?.phone && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} />{client.phone}</span>}
                      {client?.email && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={10} />{client.email}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => onEdit(client)} style={{ background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><Pencil size={13} /></button>
                  <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'Compras',    value: stats.totalPurchases,            color: 'var(--dax-blue)' },
                    { label: 'Gastado',    value: formatCurrency(stats.totalSpent), color: 'var(--dax-success)' },
                    { label: 'Ticket prom', value: formatCurrency(stats.avgTicket), color: 'var(--dax-purple)' },
                    { label: 'Puntos',     value: client?.points ?? 0,             color: 'var(--dax-amber)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: `${s.color}10`, borderRadius: '8px', padding: '8px 10px', textAlign: 'center', border: `1px solid ${s.color}20` }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '2px' }}>{s.value}</p>
                      <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Alerta fiado */}
              {Number(client?.creditBalance ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '7px 12px', background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '8px' }}>
                  <AlertTriangle size={13} color="var(--dax-danger)" />
                  <p style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 700 }}>
                    Fiado pendiente: {formatCurrency(Number(client.creditBalance))}
                  </p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--dax-border)', flexShrink: 0 }}>
              {[
                { key: 'info',    label: 'Info',       icon: User       },
                { key: 'sales',   label: 'Compras',    icon: ShoppingBag },
                { key: 'loyalty', label: 'Fidelidad',  icon: Star        },
                { key: 'credit',  label: 'Fiado',      icon: CreditCard  },
              ].map(t => {
                const Icon   = t.icon;
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => setTab(t.key as any)} style={{ flex: 1, padding: '11px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '11px', fontWeight: active ? 700 : 400, color: active ? 'var(--dax-coral)' : 'var(--dax-text-muted)', borderBottom: `2px solid ${active ? 'var(--dax-coral)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all .15s' }}>
                    <Icon size={12} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Contenido */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* Tab: Información */}
              {tab === 'info' && client && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: client.isCompany ? 'Empresa' : 'Nombre completo', value: client.isCompany ? (client.companyName ?? '—') : `${client.firstName} ${client.lastName ?? ''}`.trim(), icon: client.isCompany ? Building2 : User },
                    { label: 'Teléfono',       value: client.phone     ?? '—', icon: Phone    },
                    { label: 'Correo',         value: client.email     ?? '—', icon: Mail     },
                    { label: 'Cédula / ID',    value: client.idNumber  ?? '—', icon: FileText },
                    { label: 'Dirección',      value: client.address   ?? '—', icon: MapPin   },
                    { label: 'Fecha nacim.',   value: client.birthDate ? fmtDate(client.birthDate) : '—', icon: Calendar },
                    { label: 'Cliente desde',  value: fmtDate(client.createdAt), icon: Calendar },
                  ].map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '9px 12px', background: 'var(--dax-surface-2)', borderRadius: '9px' }}>
                        <ItemIcon size={13} color="var(--dax-text-muted)" style={{ marginTop: '1px', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '1px' }}>{item.label}</p>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                  {client.notes && (
                    <div style={{ padding: '10px 12px', background: 'var(--dax-surface-2)', borderRadius: '9px' }}>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>Notas</p>
                      <p style={{ fontSize: '13px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>{client.notes}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => onEdit(client)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <Pencil size={12} /> Editar
                    </button>
                    <button onClick={() => onDelete(client)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(224,80,80,.3)', background: 'rgba(224,80,80,.06)', color: 'var(--dax-danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Compras */}
              {tab === 'sales' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sales.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>
                      <ShoppingBag size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: .2 }} />
                      <p style={{ fontSize: '13px' }}>Sin compras registradas</p>
                    </div>
                  ) : sales.map((sale: any) => {
                    const color = PAYMENT_COLORS[sale.paymentMethod] ?? '#FF5C35';
                    return (
                      <div key={sale.id} style={{ background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--dax-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--dax-text-muted)' }}>#{sale.id.slice(-6).toUpperCase()}</span>
                            <span style={{ fontSize: '10px', background: `${color}15`, color, padding: '1px 6px', borderRadius: '6px', fontWeight: 600 }}>
                              {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1 }}>{formatCurrency(Number(sale.total))}</p>
                            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{fmtDate(sale.createdAt)}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {sale.items?.slice(0, 4).map((item: any, i: number) => (
                            <span key={i} style={{ fontSize: '10px', color: 'var(--dax-text-muted)', background: 'var(--dax-surface)', padding: '2px 7px', borderRadius: '6px', border: '1px solid var(--dax-border)' }}>
                              ×{item.quantity} {item.product?.name}
                            </span>
                          ))}
                          {(sale.items?.length ?? 0) > 4 && <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>+{sale.items.length - 4} más</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Fidelización */}
              {tab === 'loyalty' && client && loyalty && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Nivel actual */}
                  <div style={{ background: levelCfg.bg, border: `1px solid ${levelCfg.color}30`, borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                    <p style={{ fontSize: '32px', marginBottom: '4px' }}>{levelCfg.icon}</p>
                    <p style={{ fontSize: '20px', fontWeight: 900, color: levelCfg.color, marginBottom: '2px' }}>{levelCfg.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Nivel actual</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                      <Star size={14} color={levelCfg.color} />
                      <span style={{ fontSize: '18px', fontWeight: 800, color: levelCfg.color }}>{client.points}</span>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>puntos</span>
                    </div>
                  </div>

                  {/* Progreso al siguiente nivel */}
                  {loyalty.next && (
                    <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--dax-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                          Progreso a {LOYALTY_LEVELS[loyalty.next.key]?.label ?? loyalty.next.label}
                        </p>
                        <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{loyalty.progressPct}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--dax-surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${loyalty.progressPct}%`, background: `linear-gradient(90deg, ${levelCfg.color}, ${LOYALTY_LEVELS[loyalty.next.key]?.color ?? levelCfg.color})`, borderRadius: '99px', transition: 'width .5s ease' }} />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '6px' }}>
                        Faltan {formatCurrency(loyalty.toNextLevel)} en compras para subir de nivel
                      </p>
                    </div>
                  )}

                  {/* Total acumulado */}
                  <div style={{ background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={14} color="#3DBF7F" />
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>Total acumulado</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dax-success)' }}>{formatCurrency(Number(client.totalSpent))}</span>
                  </div>

                  {/* Agregar puntos */}
                  <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--dax-border)' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={13} color="#F0A030" /> Agregar puntos manualmente
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="dax-input" type="number" min="1" placeholder="Cantidad de puntos..." value={pointsInput} onChange={e => setPointsInput(e.target.value)} style={{ margin: 0, flex: 1 }} />
                      <button onClick={() => addPointsMutation.mutate(parseInt(pointsInput))} disabled={addPointsMutation.isPending || !pointsInput || parseInt(pointsInput) <= 0} style={{ padding: '0 16px', borderRadius: '10px', border: 'none', background: 'var(--dax-amber)', color: 'var(--dax-text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {addPointsMutation.isPending ? '...' : 'Agregar'}
                      </button>
                    </div>
                  </div>

                  {/* Canjear puntos */}
                  {client.points > 0 && (
                    <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--dax-border)' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Gift size={13} color="#A78BFA" /> Canjear puntos
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="dax-input" type="number" min="1" max={client.points} placeholder={`Máx. ${client.points} puntos`} value={redeemInput} onChange={e => setRedeemInput(e.target.value)} style={{ margin: 0, flex: 1 }} />
                        <button onClick={() => redeemMutation.mutate(parseInt(redeemInput))} disabled={redeemMutation.isPending || !redeemInput || parseInt(redeemInput) <= 0 || parseInt(redeemInput) > client.points} style={{ padding: '0 16px', borderRadius: '10px', border: 'none', background: '#A78BFA', color: 'var(--dax-text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {redeemMutation.isPending ? '...' : 'Canjear'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Niveles */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>Tabla de niveles</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.entries(LOYALTY_LEVELS).map(([key, lvl]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: client.loyaltyLevel === key ? lvl.bg : 'var(--dax-surface-2)', border: `1px solid ${client.loyaltyLevel === key ? `${lvl.color}30` : 'var(--dax-border)'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{lvl.icon}</span>
                            <span style={{ fontSize: '12px', fontWeight: client.loyaltyLevel === key ? 700 : 400, color: client.loyaltyLevel === key ? lvl.color : 'var(--dax-text-secondary)' }}>{lvl.label}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                            {lvl.minSpent === 0 ? 'Nivel inicial' : `Desde ${formatCurrency(lvl.minSpent)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Fiado */}
              {tab === 'credit' && client && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: Number(client.creditBalance) > 0 ? 'rgba(224,80,80,.06)' : 'rgba(61,191,127,.06)', border: `1px solid ${Number(client.creditBalance) > 0 ? 'rgba(224,80,80,.2)' : 'rgba(61,191,127,.2)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Deuda pendiente</p>
                    <p style={{ fontSize: '28px', fontWeight: 900, color: Number(client.creditBalance) > 0 ? 'var(--dax-danger)' : '#3DBF7F', lineHeight: 1 }}>
                      {formatCurrency(Number(client.creditBalance))}
                    </p>
                  </div>

                  <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--dax-border)' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={13} color="#F0A030" /> Agregar al fiado
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input className="dax-input" type="number" min="0" step="100" placeholder="Monto..." value={creditInput} onChange={e => setCreditInput(e.target.value)} style={{ margin: 0, flex: 1 }} />
                      <button onClick={() => creditMutation.mutate(parseFloat(creditInput))} disabled={creditMutation.isPending || !creditInput || parseFloat(creditInput) <= 0} style={{ padding: '0 16px', borderRadius: '10px', border: 'none', background: 'var(--dax-amber)', color: 'var(--dax-text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {creditMutation.isPending ? '...' : 'Fiar'}
                      </button>
                    </div>
                  </div>

                  {Number(client.creditBalance) > 0 && (
                    <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px', border: '1px solid var(--dax-border)' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={13} color="#3DBF7F" /> Registrar pago
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="dax-input" type="number" min="0" step="100" placeholder="Monto a pagar..." value={payInput} onChange={e => setPayInput(e.target.value)} style={{ margin: 0, flex: 1 }} />
                        <button onClick={() => payMutation.mutate(parseFloat(payInput))} disabled={payMutation.isPending || !payInput || parseFloat(payInput) <= 0} style={{ padding: '0 16px', borderRadius: '10px', border: 'none', background: '#3DBF7F', color: 'var(--dax-text-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {payMutation.isPending ? '...' : 'Pagar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ClientsPage() {
  const { formatCurrency }  = useAuth();
  const queryClient         = useQueryClient();

  const [search,       setSearch]       = useState('');
  const [loyaltyFilter, setLoyaltyFilter] = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [editClient,   setEditClient]   = useState<any | null>(null);
  const [viewId,       setViewId]       = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [page,         setPage]         = useState(1);
  const [toastState,   setToastState]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3000);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients', search, page, loyaltyFilter],
    queryFn:  async () => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search)       p.append('search',  search);
      if (loyaltyFilter) p.append('loyalty', loyaltyFilter);
      const { data } = await api.get(`/clients?${p}`);
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['client-stats'],
    queryFn:  async () => { const { data } = await api.get('/clients/stats'); return data; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
      setDeleteTarget(null);
      showToast('Cliente eliminado');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const clients    = data?.data     ?? [];
  const totalPages = data?.pages    ?? 1;

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: '1100px' }}>

      {/* Toast */}
      {toastState && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '10px', background: toastState.type === 'success' ? '#22C55E' : 'var(--dax-danger)', color: 'var(--dax-text-primary)', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.3)', animation: 'slideUp .2s ease' }}>
          {toastState.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Clientes</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Gestiona tu base de clientes, fiados y fidelización</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => refetch()} style={{ width: '36px', height: '36px', borderRadius: '9px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => { setEditClient(null); setShowForm(true); }} className="dax-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}>
            <Plus size={14} /> Nuevo cliente
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total',      value: stats.total,                           color: 'var(--dax-blue)', icon: Users         },
            { label: 'Activos',    value: stats.active,                          color: 'var(--dax-success)', icon: User          },
            { label: 'Con fiado',  value: stats.withDebt,                        color: 'var(--dax-danger)', icon: AlertTriangle },
            { label: 'Total fiado', value: formatCurrency(stats.totalDebt ?? 0), color: 'var(--dax-amber)', icon: DollarSign    },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="dax-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '1px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Niveles de fidelización */}
      {stats?.byLevel && (
        <div className="dax-card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Distribución por nivel</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(LOYALTY_LEVELS).map(([key, lvl]) => {
              const count = (stats.byLevel as any[]).find((b: any) => b.loyaltyLevel === key)?._count?.id ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setLoyaltyFilter(loyaltyFilter === key ? '' : key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', border: `1px solid ${loyaltyFilter === key ? lvl.color : 'var(--dax-border)'}`, background: loyaltyFilter === key ? lvl.bg : 'var(--dax-surface-2)', cursor: 'pointer', transition: 'all .15s' }}
                >
                  <span style={{ fontSize: '14px' }}>{lvl.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: loyaltyFilter === key ? lvl.color : 'var(--dax-text-secondary)' }}>{lvl.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: loyaltyFilter === key ? lvl.color : 'var(--dax-text-muted)', background: loyaltyFilter === key ? `${lvl.color}20` : 'var(--dax-surface-3)', padding: '1px 7px', borderRadius: '20px' }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '400px' }}>
        <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
        <input className="dax-input" placeholder="Nombre, código, teléfono, correo..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: '34px', margin: 0 }} />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dax-text-muted)', fontSize: '13px', padding: '20px 0' }}>
          <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Cargando...
        </div>
      ) : clients.length === 0 ? (
        <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Users size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .2 }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dax-text-muted)', marginBottom: '4px' }}>
            {search ? `Sin resultados para "${search}"` : 'No hay clientes registrados'}
          </p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="dax-btn-primary" style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={13} /> Agregar primer cliente
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="dax-card" style={{ overflow: 'hidden' }}>
            <div className="dax-table-wrap">
              <table className="dax-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th style={{ textAlign: 'center' }}>Nivel</th>
                    <th style={{ textAlign: 'center' }}>Puntos</th>
                    <th style={{ textAlign: 'center' }}>Compras</th>
                    <th style={{ textAlign: 'right' }}>Fiado</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client: any) => {
                    const hasDebt = Number(client.creditBalance ?? 0) > 0;
                    return (
                      <tr key={client.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Avatar client={client} size={36} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1 }}>
                                  {client.isCompany ? (client.companyName ?? client.firstName) : `${client.firstName} ${client.lastName ?? ''}`.trim()}
                                </p>
                                {client.isCompany && <Building2 size={10} color="var(--dax-text-muted)" />}
                              </div>
                              {client.code && <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--dax-text-muted)' }}>#{client.code}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {client.phone && <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} color="var(--dax-text-muted)" />{client.phone}</span>}
                            {client.email && <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={10} />{client.email}</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <LoyaltyBadge level={client.loyaltyLevel ?? 'bronze'} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Star size={11} color="#F0A030" />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-amber)' }}>{client.points ?? 0}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{client._count?.sales ?? 0}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {hasDebt ? (
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-danger)', background: 'var(--dax-danger-bg)', padding: '2px 8px', borderRadius: '6px' }}>
                              {formatCurrency(Number(client.creditBalance))}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => setViewId(client.id)} style={{ background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-coral)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={11} /> Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-muted)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>Anterior</button>
              <span style={{ padding: '7px 14px', fontSize: '12px', color: 'var(--dax-text-muted)' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-muted)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600 }}>Siguiente</button>
            </div>
          )}
        </>
      )}

      {/* Modales */}
      {(showForm || editClient) && (
        <ClientFormModal
          client={editClient}
          onClose={() => { setShowForm(false); setEditClient(null); }}
          onSave={() => {
            setShowForm(false); setEditClient(null); setViewId(null);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['client-stats'] });
          }}
          showToast={showToast}
        />
      )}

      {viewId && (
        <ClientDetailModal
          clientId={viewId}
          onClose={() => setViewId(null)}
          onEdit={(c) => { setViewId(null); setEditClient(c); }}
          onDelete={(c) => { setViewId(null); setDeleteTarget(c); }}
          showToast={showToast}
          formatCurrency={formatCurrency}
        />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '400px', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dax-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="var(--dax-danger)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>¿Eliminar cliente?</h3>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Se eliminará a <strong style={{ color: 'var(--dax-text-primary)' }}>{deleteTarget.firstName} {deleteTarget.lastName ?? ''}</strong>. Sus compras no se borrarán.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} className="dax-btn-secondary">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} style={{ padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--dax-danger)', color: 'var(--dax-text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {deleteMutation.isPending ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Trash2 size={13} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
