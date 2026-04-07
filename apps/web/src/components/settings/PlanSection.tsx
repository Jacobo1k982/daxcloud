'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PLANS as PLAN_DATA } from '@/lib/plans';
import {
  Check, X, AlertTriangle, CreditCard,
  Calendar, Receipt, Zap, ArrowRight,
  Shield, Star, Crown,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────
interface PlanDetail {
  name: string; monthlyPrice: number; annualPrice: number;
  annualMonthly: number; color: string; popular: boolean;
  description: string; limit: string;
  features: readonly { text: string; included: boolean }[];
}

interface Subscription {
  plan?: { name: string };
  status?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  lastFour?: string;
  cardBrand?: string;
  trialEndsAt?: string;
}

// ── Datos ────────────────────────────────────────────
const PLAN_DETAILS = Object.fromEntries(
  PLAN_DATA.map(p => [p.name, {
    name:          p.label,
    monthlyPrice:  p.monthlyPrice,
    annualPrice:   p.annualPrice,
    annualMonthly: p.annualMonthly,
    color:         p.color,
    popular:       p.popular,
    description:   p.desc,
    limit:         p.limit,
    features:      p.features,
  }])
) as Record<string, PlanDetail>;

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Activa',    color: '#3DBF7F', bg: 'rgba(61,191,127,.1)'  },
  trialing:  { label: 'Trial',     color: '#5AAAF0', bg: 'rgba(90,170,240,.1)'  },
  past_due:  { label: 'Vencida',   color: '#F0A030', bg: 'rgba(240,160,48,.1)'  },
  cancelled: { label: 'Cancelada', color: '#E05050', bg: 'rgba(224,80,80,.1)'   },
};

const PLAN_ICONS: Record<string, any> = {
  starter: Shield,
  growth:  Star,
  scale:   Crown,
};

// ── Helpers ──────────────────────────────────────────
function fmtUSD(n: number) {
  return `$${n.toLocaleString('en-US')} USD`;
}

function fmtDate(d?: string, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CR', opts ?? { day: '2-digit', month: 'long', year: 'numeric' });
}

// ══════════════════════════════════════════════════════
// MODAL: CAMBIAR PLAN
// ══════════════════════════════════════════════════════
interface ChangePlanModalProps {
  planKey: string;
  planDetail: PlanDetail;
  onClose: () => void;
  onChangePlan: (name: string) => void;
  isPending: boolean;
  changingTo: string | null;
}

function ChangePlanModal({ planKey, planDetail, onClose, onChangePlan, isPending, changingTo }: ChangePlanModalProps) {
  const [annual, setAnnual] = useState(false);

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '920px', margin: 'auto', animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#F0F4FF', margin: '0 0 4px', letterSpacing: '-.02em' }}>
              Elige tu plan
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(176,208,240,.6)', margin: 0 }}>
              Plan actual: <strong style={{ color: '#F0F4FF' }}>{planDetail.name}</strong> · {fmtUSD(planDetail.monthlyPrice)}/mes
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer', color: 'rgba(176,208,240,.7)', display: 'flex', padding: '8px', borderRadius: '10px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Toggle mensual / anual */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', padding: '10px 20px', background: 'rgba(15,25,36,.9)', borderRadius: '40px', border: '1px solid rgba(30,58,95,.6)' }}>
            <span style={{ fontSize: '13px', fontWeight: annual ? 400 : 700, color: !annual ? '#F0F4FF' : 'rgba(176,208,240,.4)', transition: 'all .2s' }}>Mensual</span>
            <div onClick={() => setAnnual(p => !p)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: annual ? '#FF5C35' : 'rgba(30,58,95,.8)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '3px', left: annual ? '20px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: annual ? 700 : 400, color: annual ? '#F0F4FF' : 'rgba(176,208,240,.4)', transition: 'all .2s' }}>Anual</span>
            {annual && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#3DBF7F', background: 'rgba(61,191,127,.15)', border: '1px solid rgba(61,191,127,.25)', padding: '3px 10px', borderRadius: '20px' }}>
                2 meses gratis
              </span>
            )}
          </div>
        </div>

        {/* Cards de planes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {PLAN_DATA.map(plan => {
            const isCurrent  = plan.name === planKey;
            const price      = annual ? plan.annualMonthly : plan.monthlyPrice;
            const isChanging = changingTo === plan.name && isPending;
            const saving     = plan.monthlyPrice * 12 - plan.annualPrice;
            const Icon       = PLAN_ICONS[plan.name] ?? Shield;

            return (
              <div key={plan.name} style={{
                borderRadius: '20px',
                padding: '28px 24px',
                background: isCurrent
                  ? `linear-gradient(145deg, ${plan.color}18, ${plan.color}08)`
                  : plan.popular
                    ? 'linear-gradient(145deg, rgba(255,92,53,.06), rgba(15,25,36,.95))'
                    : 'rgba(22,34,53,.85)',
                border: `1.5px solid ${isCurrent ? plan.color : plan.popular ? 'rgba(255,92,53,.3)' : 'rgba(30,58,95,.5)'}`,
                position: 'relative',
                backdropFilter: 'blur(12px)',
                transition: 'all .2s',
              }}>

                {/* Badge */}
                {(isCurrent || plan.popular) && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: isCurrent ? plan.color : '#FF5C35', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '.06em', textTransform: 'uppercase', boxShadow: `0 4px 12px ${isCurrent ? plan.color : '#FF5C35'}50` }}>
                    {isCurrent ? '✓ Plan actual' : '⚡ Popular'}
                  </div>
                )}

                {/* Icono y nombre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', marginTop: isCurrent || plan.popular ? '8px' : '0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${plan.color}30` }}>
                    <Icon size={18} color={plan.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#F0F4FF', margin: 0, letterSpacing: '-.01em' }}>{plan.label}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(176,208,240,.5)', margin: 0 }}>{plan.limit}</p>
                  </div>
                </div>

                {/* Precio */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '38px', fontWeight: 900, color: plan.color, lineHeight: 1, letterSpacing: '-.02em' }}>${price}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(176,208,240,.5)', marginBottom: '6px', fontWeight: 400 }}>/mes</span>
                  </div>
                  {annual ? (
                    <p style={{ fontSize: '11px', color: '#3DBF7F', fontWeight: 600 }}>
                      ${plan.annualPrice}/año · ahorras ${saving}
                    </p>
                  ) : (
                    <p style={{ fontSize: '11px', color: 'rgba(176,208,240,.4)' }}>
                      ${plan.monthlyPrice * 12}/año facturado mensual
                    </p>
                  )}
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: feat.included ? `${plan.color}20` : 'rgba(30,58,95,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {feat.included
                          ? <Check size={10} color={plan.color} strokeWidth={3} />
                          : <X size={9} color="rgba(113,128,150,.5)" strokeWidth={2} />}
                      </div>
                      <span style={{ fontSize: '12px', color: feat.included ? 'rgba(240,244,255,.8)' : 'rgba(113,128,150,.5)', textDecoration: feat.included ? 'none' : 'line-through' }}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => { if (!isCurrent && !isPending) onChangePlan(plan.name); }}
                  disabled={isCurrent || isPending}
                  style={{
                    width: '100%', padding: '12px',
                    background: isCurrent
                      ? 'rgba(30,58,95,.3)'
                      : isChanging
                        ? 'rgba(30,58,95,.5)'
                        : plan.popular
                          ? `linear-gradient(135deg, ${plan.color}, #FF3D1F)`
                          : `${plan.color}20`,
                    border: `1.5px solid ${isCurrent ? 'rgba(30,58,95,.4)' : plan.color}`,
                    borderRadius: '12px',
                    color: isCurrent ? 'rgba(113,128,150,.6)' : isChanging ? 'rgba(113,128,150,.6)' : plan.popular ? '#fff' : plan.color,
                    fontSize: '13px', fontWeight: 700,
                    cursor: isCurrent || isPending ? 'default' : 'pointer',
                    fontFamily: 'var(--font-primary)', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    letterSpacing: '.02em',
                  }}
                >
                  {isChanging ? (
                    <><span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(30,58,95,.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Cambiando...</>
                  ) : isCurrent ? '✓ Plan actual' : (
                    <>Cambiar a {plan.label} <ArrowRight size={13} /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(113,128,150,.6)', textAlign: 'center', marginTop: '20px' }}>
          Cambio efectivo inmediatamente · Sin contratos · Precios en dólares estadounidenses (USD)
        </p>
      </div>
    </div>,
    document.body
  );
}

// ══════════════════════════════════════════════════════
// MODAL: CANCELAR
// ══════════════════════════════════════════════════════
interface CancelModalProps {
  subscription: Subscription;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function CancelModal({ subscription, onClose, onConfirm, isPending }: CancelModalProps) {
  const [confirmText, setConfirmText] = useState('');

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dax-card" style={{ width: '100%', maxWidth: '460px', padding: '32px', animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Cancelar suscripción</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Warning */}
        <div style={{ background: 'rgba(224,80,80,.06)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} color="#E05050" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '13px', color: '#E05050', fontWeight: 700, marginBottom: '6px' }}>¿Seguro que quieres cancelar?</p>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.6 }}>
              Tu suscripción permanecerá activa hasta el{' '}
              <strong style={{ color: 'var(--dax-text-primary)' }}>{fmtDate(subscription?.currentPeriodEnd)}</strong>.
              Después perderás acceso a las funciones premium.
            </p>
          </div>
        </div>

        {/* Pérdidas */}
        <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>Perderás acceso a</p>
          {['Analytics avanzado', 'Módulos de industria', 'Soporte prioritario', 'Exportación de reportes'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <X size={11} color="#E05050" />
              <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
          Escribe <strong style={{ color: 'var(--dax-text-primary)' }}>CANCELAR</strong> para confirmar:
        </p>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="CANCELAR"
          className="dax-input"
          style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Volver</button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'CANCELAR' || isPending}
            style={{
              flex: 1, padding: '11px',
              background: confirmText === 'CANCELAR' ? '#E05050' : 'rgba(30,58,95,.4)',
              border: `1.5px solid ${confirmText === 'CANCELAR' ? '#E05050' : 'rgba(30,58,95,.4)'}`,
              borderRadius: '12px',
              color: confirmText === 'CANCELAR' ? '#fff' : 'var(--dax-text-muted)',
              fontSize: '13px', fontWeight: 700,
              cursor: confirmText !== 'CANCELAR' || isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-primary)', transition: 'all .2s',
            }}
          >
            {isPending ? 'Cancelando...' : 'Confirmar cancelación'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ══════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════
export function PlanSection({ showToast }: {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const queryClient = useQueryClient();
  const [showChangePlan,  setShowChangePlan]  = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [changingTo,      setChangingTo]      = useState<string | null>(null);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => { const { data } = await api.get('/billing/subscription'); return data as Subscription; },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: async () => { const { data } = await api.get('/billing/invoices'); return data; },
  });

  const changePlanMutation = useMutation({
    mutationFn: async (planName: string) => api.post('/billing/change-plan', { planName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
      setShowChangePlan(false);
      setChangingTo(null);
      showToast('Plan actualizado correctamente.');
    },
    onError: (err: any) => {
      setChangingTo(null);
      showToast(err.response?.data?.message ?? 'Error al cambiar plan', 'error');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => api.put('/billing/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      setShowCancelModal(false);
      showToast('Suscripción programada para cancelarse al final del período.');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al cancelar', 'error'),
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => api.put('/billing/reactivate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      showToast('Suscripción reactivada correctamente');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al reactivar', 'error'),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '32px', color: 'var(--dax-text-muted)', fontSize: '13px' }}>
      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--dax-border)', borderTopColor: 'var(--dax-coral)', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
      Cargando suscripción...
    </div>
  );

  const planKey    = subscription?.plan?.name ?? 'starter';
  const planDetail = PLAN_DETAILS[planKey] ?? PLAN_DETAILS['starter'];
  const statusInfo = STATUS_INFO[subscription?.status ?? 'active'];
  const PlanIcon   = PLAN_ICONS[planKey] ?? Shield;
  const saving     = planDetail.monthlyPrice * 12 - planDetail.annualPrice;
  const savingPct  = Math.round((saving / (planDetail.monthlyPrice * 12)) * 100);

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Banner trial */}
        {subscription?.status === 'trialing' && trialDaysLeft !== null && (
          <div style={{
            borderRadius: '14px', padding: '16px 20px',
            background: trialDaysLeft <= 3 ? 'rgba(224,80,80,.06)' : 'rgba(240,160,48,.06)',
            border: `1px solid ${trialDaysLeft <= 3 ? 'rgba(224,80,80,.2)' : 'rgba(240,160,48,.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: trialDaysLeft <= 3 ? '#E05050' : '#F0A030', marginBottom: '3px' }}>
                {trialDaysLeft <= 3 ? '⚠️' : '🎯'} <strong>{trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''}</strong> de prueba restantes
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                Activa un plan para no perder acceso · Sin compromiso de permanencia
              </p>
            </div>
            <button onClick={() => setShowChangePlan(true)} className="dax-btn-primary" style={{ fontSize: '12px', padding: '9px 18px', flexShrink: 0 }}>
              Activar plan →
            </button>
          </div>
        )}

        {/* Banner cancelación pendiente */}
        {subscription?.cancelAtPeriodEnd && (
          <div style={{ borderRadius: '14px', padding: '16px 20px', background: 'rgba(240,160,48,.06)', border: '1px solid rgba(240,160,48,.2)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={18} color="#F0A030" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0A030', marginBottom: '3px' }}>
                Tu suscripción se cancelará el {fmtDate(subscription?.currentPeriodEnd)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Puedes reactivarla antes sin perder tus datos.</p>
            </div>
            <button onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending} className="dax-btn-primary" style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}>
              {reactivateMutation.isPending ? '...' : 'Reactivar'}
            </button>
          </div>
        )}

        {/* Tarjeta del plan actual — diseño premium */}
        <div style={{
          borderRadius: '20px', padding: '28px',
          background: `linear-gradient(145deg, ${planDetail.color}12, ${planDetail.color}04, var(--dax-surface-2))`,
          border: `1.5px solid ${planDetail.color}30`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decoración de fondo */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: `${planDetail.color}08`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', right: '60px', width: '80px', height: '80px', borderRadius: '50%', background: `${planDetail.color}05`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${planDetail.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${planDetail.color}30`, flexShrink: 0 }}>
                <PlanIcon size={24} color={planDetail.color} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: 'var(--dax-text-primary)', margin: 0, letterSpacing: '-.02em' }}>{planDetail.name}</p>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: statusInfo.color, background: statusInfo.bg, padding: '3px 10px', borderRadius: '20px' }}>
                    {statusInfo.label}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', margin: 0 }}>{planDetail.description} · {planDetail.limit}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 900, color: planDetail.color, lineHeight: 1, letterSpacing: '-.02em' }}>${planDetail.monthlyPrice}</span>
                <span style={{ fontSize: '13px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>/mes USD</span>
              </div>
              <p style={{ fontSize: '11px', color: '#3DBF7F', fontWeight: 600, margin: '0 0 2px' }}>
                o ${planDetail.annualMonthly}/mes anual · ahorra ${saving} ({savingPct}%)
              </p>
            </div>
          </div>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {[
              {
                icon: Calendar,
                label: subscription?.status === 'trialing' ? 'Trial termina' : 'Próxima renovación',
                value: subscription?.status === 'trialing' ? fmtDate(subscription?.trialEndsAt, { day: '2-digit', month: 'short', year: 'numeric' }) : fmtDate(subscription?.currentPeriodEnd, { day: '2-digit', month: 'short', year: 'numeric' }),
              },
              {
                icon: Calendar,
                label: 'Desde',
                value: fmtDate(subscription?.currentPeriodStart, { day: '2-digit', month: 'short', year: 'numeric' }),
              },
              {
                icon: CreditCard,
                label: 'Método de pago',
                value: subscription?.lastFour ? `${subscription.cardBrand ?? 'Tarjeta'} ···· ${subscription.lastFour}` : 'No configurado',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} style={{ background: 'var(--dax-surface)', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${planDetail.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color={planDetail.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features incluidas */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>Incluido en tu plan</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '7px' }}>
              {planDetail.features.map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--dax-surface)', borderRadius: '10px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: feat.included ? `${planDetail.color}20` : 'var(--dax-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {feat.included
                      ? <Check size={9} color={planDetail.color} strokeWidth={3} />
                      : <X size={9} color="var(--dax-text-muted)" strokeWidth={2} />}
                  </div>
                  <span style={{ fontSize: '12px', color: feat.included ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)', textDecoration: feat.included ? 'none' : 'line-through' }}>
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowChangePlan(true)} className="dax-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} /> Cambiar plan
            </button>
            {!subscription?.cancelAtPeriodEnd && subscription?.status !== 'trialing' && (
              <button type="button" onClick={() => setShowCancelModal(true)} className="dax-btn-secondary" style={{ color: 'var(--dax-danger)', borderColor: 'rgba(224,80,80,.3)', fontSize: '13px' }}>
                Cancelar suscripción
              </button>
            )}
          </div>
        </div>

        {/* Historial de facturas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Receipt size={15} color="var(--dax-coral)" />
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Historial de facturación</p>
          </div>
          {(invoices as any[]).length === 0 ? (
            <div style={{ padding: '32px', background: 'var(--dax-surface-2)', borderRadius: '14px', textAlign: 'center' }}>
              <Receipt size={28} color="var(--dax-text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: .25 }} />
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-muted)', marginBottom: '4px' }}>Sin facturas aún</p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', opacity: .7 }}>Las facturas aparecerán al activar tu suscripción paga.</p>
            </div>
          ) : (
            <div className="dax-table-wrap">
              <table className="dax-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoices as any[]).map((invoice: any) => (
                    <tr key={invoice.id}>
                      <td style={{ fontSize: '13px' }}>{invoice.description ?? 'Suscripción mensual'}</td>
                      <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>
                        {fmtDate(invoice.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: invoice.status === 'paid' ? '#3DBF7F' : '#F0A030', background: invoice.status === 'paid' ? 'rgba(61,191,127,.1)' : 'rgba(240,160,48,.1)', padding: '3px 10px', borderRadius: '20px' }}>
                          {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--dax-text-primary)', fontSize: '13px' }}>
                        ${Number(invoice.amount).toFixed(2)} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showChangePlan && typeof window !== 'undefined' && (
        <ChangePlanModal
          planKey={planKey}
          planDetail={planDetail}
          onClose={() => setShowChangePlan(false)}
          onChangePlan={name => { setChangingTo(name); changePlanMutation.mutate(name); }}
          isPending={changePlanMutation.isPending}
          changingTo={changingTo}
        />
      )}
      {showCancelModal && typeof window !== 'undefined' && (
        <CancelModal
          subscription={subscription ?? {}}
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => cancelMutation.mutate()}
          isPending={cancelMutation.isPending}
        />
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}