'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PLANS as PLAN_DATA } from '@/lib/plans';
import {
  Check, X, AlertTriangle, CreditCard,
  Calendar, Receipt, Zap, ArrowRight,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────
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

// ── Datos de planes ───────────────────────────────────
const PLAN_DETAILS = Object.fromEntries(
  PLAN_DATA.map(p => [p.name, {
    name: p.label,
    monthlyPrice: p.monthlyPrice,
    annualPrice: p.annualPrice,
    annualMonthly: p.annualMonthly,
    color: p.color,
    popular: p.popular,
    description: p.desc,
    limit: p.limit,
    features: p.features,
  }])
) as Record<string, PlanDetail>;

const STATUS_INFO: Record<string, { label: string; badge: string }> = {
  active: { label: 'Activa', badge: 'dax-badge-success' },
  trialing: { label: 'Trial', badge: 'dax-badge-info' },
  past_due: { label: 'Vencida', badge: 'dax-badge-warning' },
  cancelled: { label: 'Cancelada', badge: 'dax-badge-danger' },
};

// ── Formateo de moneda ────────────────────────────────
function fmtPrice(amount: number) {
  return `₡${amount.toLocaleString('es-CR')}`;
}

function fmtDate(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtDateShort(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ══════════════════════════════════════════════════════
// Modal: Cambiar plan (FUERA del componente principal)
// ══════════════════════════════════════════════════════
interface ChangePlanModalProps {
  planKey: string;
  planDetail: PlanDetail;
  onClose: () => void;
  onChangePlan: (planName: string) => void;
  isPending: boolean;
  changingTo: string | null;
}

function ChangePlanModal({
  planKey, planDetail, onClose, onChangePlan, isPending, changingTo,
}: ChangePlanModalProps) {
  const [annual, setAnnual] = useState(false);

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 9999, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
        overflowY: 'auto', backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dax-card" style={{
        width: '100%', maxWidth: '820px', padding: '32px',
        margin: 'auto', animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 4px' }}>Cambiar plan</h2>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>
              Plan actual: <strong style={{ color: 'var(--dax-text-primary)' }}>{planDetail.name}</strong>
              {' · '}{fmtPrice(planDetail.monthlyPrice)}/mes
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Toggle mensual/anual */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '24px', padding: '12px 16px',
          background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)',
        }}>
          <span style={{ fontSize: '13px', color: !annual ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)', fontWeight: !annual ? 700 : 400 }}>
            Mensual
          </span>
          <div
            onClick={() => setAnnual(p => !p)}
            style={{
              width: '40px', height: '22px', borderRadius: '11px',
              background: annual ? '#FF5C35' : 'var(--dax-surface-3)',
              position: 'relative', cursor: 'pointer', transition: 'background .2s',
              border: `1px solid ${annual ? 'rgba(255,92,53,.5)' : 'var(--dax-border)'}`,
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: '2px',
              left: annual ? '18px' : '2px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#fff', transition: 'left .2s cubic-bezier(.4,0,.2,1)',
              boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            }} />
          </div>
          <span style={{ fontSize: '13px', color: annual ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)', fontWeight: annual ? 700 : 400 }}>
            Anual
          </span>
          {annual && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--dax-success)',
              background: 'var(--dax-success-bg)',
              border: '1px solid rgba(61,191,127,.2)',
              padding: '2px 8px', borderRadius: '6px',
            }}>
              2 meses gratis
            </span>
          )}
        </div>

        {/* Cards de planes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {PLAN_DATA.map(plan => {
            const isCurrent = plan.name === planKey;
            const price = annual ? plan.annualMonthly : plan.monthlyPrice;
            const isChanging = changingTo === plan.name && isPending;
            const saving = plan.monthlyPrice * 12 - plan.annualPrice;

            return (
              <div key={plan.name} style={{
                border: `2px solid ${isCurrent ? plan.color : 'var(--dax-border)'}`,
                borderRadius: 'var(--dax-radius-lg)', padding: '20px',
                background: isCurrent ? `${plan.color}08` : 'var(--dax-surface-2)',
                position: 'relative', transition: 'all .15s',
              }}>
                {(isCurrent || plan.popular) && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: isCurrent ? plan.color : '#FF5C35',
                    color: '#fff', fontSize: '9px', fontWeight: 700,
                    padding: '2px 10px', borderRadius: '8px',
                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px',
                  }}>
                    {isCurrent ? 'Plan actual' : <><Zap size={8} /> Popular</>}
                  </div>
                )}

                <div style={{ marginBottom: '16px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: plan.color }} />
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{plan.label}</p>
                  </div>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: plan.color, lineHeight: 1, marginBottom: '2px' }}>
                    {fmtPrice(price)}
                    <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', fontWeight: 400 }}>/mes</span>
                  </p>
                  {annual ? (
                    <p style={{ fontSize: '10px', color: 'var(--dax-success)', fontWeight: 600 }}>
                      {fmtPrice(plan.annualPrice)}/año · ahorras {fmtPrice(saving)}
                    </p>
                  ) : (
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
                      {fmtPrice(plan.monthlyPrice * 12)}/año facturado mensual
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{plan.limit}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  {plan.features.filter(f => f.included).slice(0, 5).map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Check size={11} color={plan.color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)' }}>{feat.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => { if (!isCurrent && !isPending) onChangePlan(plan.name); }}
                  disabled={isCurrent || isPending}
                  style={{
                    width: '100%', padding: '10px',
                    background: isCurrent
                      ? 'transparent'
                      : isChanging
                        ? 'rgba(30,58,95,.5)'
                        : plan.popular
                          ? `linear-gradient(135deg, ${plan.color}, #FF3D1F)`
                          : `${plan.color}15`,
                    border: `1.5px solid ${isCurrent ? 'var(--dax-border)' : plan.color}`,
                    borderRadius: 'var(--dax-radius-md)',
                    color: isCurrent
                      ? 'var(--dax-text-muted)'
                      : isChanging
                        ? 'var(--dax-text-muted)'
                        : plan.popular ? '#fff' : plan.color,
                    fontSize: '12px', fontWeight: 700,
                    cursor: isCurrent ? 'default' : isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-primary)', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  }}
                >
                  {isChanging ? (
                    <>
                      <span style={{ width: '11px', height: '11px', borderRadius: '50%', border: '2px solid rgba(30,58,95,.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                      Cambiando...
                    </>
                  ) : isCurrent ? 'Plan actual' : (
                    <>Cambiar a {plan.label} <ArrowRight size={11} /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', textAlign: 'center', marginTop: '16px' }}>
          El cambio es efectivo inmediatamente · Sin contratos de largo plazo · Precios en colones costarricenses
        </p>
      </div>
    </div>,
    document.body
  );
}

// ══════════════════════════════════════════════════════
// Modal: Cancelar suscripción (FUERA del componente principal)
// ══════════════════════════════════════════════════════
interface CancelModalProps {
  subscription: Subscription;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function CancelModal({ subscription, onClose, onConfirm, isPending }: CancelModalProps) {
  const [confirmCancel, setConfirmCancel] = useState('');

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 9999, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dax-card" style={{
        width: '100%', maxWidth: '440px', padding: '32px',
        animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Cancelar suscripción</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{
          background: 'var(--dax-danger-bg)',
          border: '1px solid rgba(224,80,80,.2)',
          borderRadius: 'var(--dax-radius-md)',
          padding: '14px', marginBottom: '20px',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} color="var(--dax-danger)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '13px', color: 'var(--dax-danger)', fontWeight: 600, marginBottom: '4px' }}>
              ¿Seguro que quieres cancelar?
            </p>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.6 }}>
              Tu suscripción permanecerá activa hasta el{' '}
              <strong style={{ color: 'var(--dax-text-primary)' }}>
                {fmtDate(subscription?.currentPeriodEnd)}
              </strong>.
              Después perderás acceso a las funciones del plan.
            </p>
          </div>
        </div>

        {/* Lo que perderás */}
        <div style={{
          background: 'var(--dax-surface-2)',
          borderRadius: 'var(--dax-radius-md)',
          padding: '14px', marginBottom: '20px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Perderás acceso a:
          </p>
          {['Analytics avanzado', 'Módulos de industria', 'Soporte prioritario', 'Exportación de reportes'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <X size={11} color="var(--dax-danger)" />
              <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
          Escribe <strong style={{ color: 'var(--dax-text-primary)' }}>CANCELAR</strong> para confirmar:
        </p>
        <input
          value={confirmCancel}
          onChange={e => setConfirmCancel(e.target.value)}
          placeholder="CANCELAR"
          className="dax-input"
          style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmCancel !== 'CANCELAR' || isPending}
            className="dax-btn-primary"
            style={{
              flex: 1,
              background: 'var(--dax-danger)',
              borderColor: 'var(--dax-danger)',
              opacity: confirmCancel !== 'CANCELAR' ? .5 : 1,
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
// Componente principal
// ══════════════════════════════════════════════════════
export function PlanSection({ showToast }: {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const queryClient = useQueryClient();
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [changingTo, setChangingTo] = useState<string | null>(null);

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
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px', color: 'var(--dax-text-muted)', fontSize: '13px' }}>
      <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--dax-border)', borderTopColor: 'var(--dax-coral)', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
      Cargando suscripción...
    </div>
  );

  const planKey = subscription?.plan?.name ?? 'starter';
  const planDetail = PLAN_DETAILS[planKey] ?? PLAN_DETAILS['starter'];
  const statusInfo = STATUS_INFO[subscription?.status ?? 'active'];
  const saving = planDetail.monthlyPrice * 12 - planDetail.annualPrice;
  const savingPct = Math.round((saving / (planDetail.monthlyPrice * 12)) * 100);

  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Banner trial activo */}
        {subscription?.status === 'trialing' && trialDaysLeft !== null && (
          <div style={{
            background: trialDaysLeft <= 3 ? 'rgba(224,80,80,.08)' : 'rgba(240,160,48,.08)',
            border: `1px solid ${trialDaysLeft <= 3 ? 'rgba(224,80,80,.2)' : 'rgba(240,160,48,.2)'}`,
            borderRadius: 'var(--dax-radius-md)', padding: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: trialDaysLeft <= 3 ? 'var(--dax-danger)' : 'var(--dax-warning)', marginBottom: '3px' }}>
                {trialDaysLeft <= 3 ? '⚠️' : '🎯'} Te quedan <strong>{trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''}</strong> de prueba gratuita
              </p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                Activa tu plan para no perder acceso · Sin compromiso de permanencia
              </p>
            </div>
            <button
              onClick={() => setShowChangePlan(true)}
              className="dax-btn-primary"
              style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}
            >
              Activar plan →
            </button>
          </div>
        )}

        {/* Banner cancelación pendiente */}
        {subscription?.cancelAtPeriodEnd && (
          <div style={{
            background: 'var(--dax-warning-bg)',
            border: '1px solid rgba(240,160,48,.25)',
            borderRadius: 'var(--dax-radius-md)', padding: '16px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <AlertTriangle size={18} color="var(--dax-warning)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-warning)', marginBottom: '4px' }}>
                Tu suscripción se cancelará el {fmtDate(subscription?.currentPeriodEnd)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                Puedes reactivarla antes de esa fecha sin perder tus datos.
              </p>
            </div>
            <button
              onClick={() => reactivateMutation.mutate()}
              disabled={reactivateMutation.isPending}
              className="dax-btn-primary"
              style={{ fontSize: '12px', padding: '8px 14px', flexShrink: 0 }}
            >
              {reactivateMutation.isPending ? '...' : 'Reactivar'}
            </button>
          </div>
        )}

        {/* Plan actual */}
        <div style={{
          background: 'var(--dax-surface-2)',
          borderRadius: 'var(--dax-radius-lg)', padding: '24px',
          border: `2px solid ${planDetail.color}20`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: planDetail.color, boxShadow: `0 0 6px ${planDetail.color}60` }} />
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dax-text-muted)' }}>
                  Plan actual
                </p>
              </div>
              <p style={{ fontSize: '30px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1, letterSpacing: '-.01em' }}>
                {planDetail.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{planDetail.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: planDetail.color, lineHeight: 1 }}>
                {fmtPrice(planDetail.monthlyPrice)}
                <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)', fontWeight: 400 }}>/mes</span>
              </p>
              <p style={{ fontSize: '11px', color: 'var(--dax-success)', marginTop: '3px', fontWeight: 600 }}>
                o {fmtPrice(planDetail.annualMonthly)}/mes anual · ahorras {fmtPrice(saving)} ({savingPct}%)
              </p>
              <span className={`dax-badge ${statusInfo.badge}`} style={{ marginTop: '6px', display: 'inline-block' }}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            {[
              {
                icon: Calendar,
                label: subscription?.status === 'trialing' ? 'Trial termina' : 'Próxima renovación',
                value: subscription?.status === 'trialing'
                  ? fmtDateShort(subscription?.trialEndsAt)
                  : fmtDateShort(subscription?.currentPeriodEnd),
              },
              {
                icon: Calendar,
                label: 'Período actual desde',
                value: fmtDateShort(subscription?.currentPeriodStart),
              },
              {
                icon: CreditCard,
                label: 'Método de pago',
                value: subscription?.lastFour
                  ? `${subscription.cardBrand ?? 'Tarjeta'} ···· ${subscription.lastFour}`
                  : 'No configurado',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} style={{ background: 'var(--dax-surface)', borderRadius: 'var(--dax-radius-md)', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Icon size={15} color="var(--dax-coral)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '3px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features incluidas */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-secondary)', marginBottom: '12px' }}>
            Incluido en tu plan
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '7px' }}>
            {planDetail.features.map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                <div style={{ width: '17px', height: '17px', borderRadius: '50%', background: feat.included ? 'var(--dax-success-bg)' : 'var(--dax-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {feat.included
                    ? <Check size={9} color="var(--dax-success)" strokeWidth={2.5} />
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
          <button
            type="button"
            onClick={() => setShowChangePlan(true)}
            className="dax-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={14} /> Cambiar plan
          </button>
          {!subscription?.cancelAtPeriodEnd && subscription?.status !== 'trialing' && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="dax-btn-secondary"
              style={{ color: 'var(--dax-danger)', borderColor: 'rgba(224,80,80,.3)' }}
            >
              Cancelar suscripción
            </button>
          )}
        </div>

        {/* Historial de facturas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Receipt size={16} color="var(--dax-coral)" />
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>
              Historial de facturación
            </p>
          </div>
          {(invoices as any[]).length === 0 ? (
            <div style={{ padding: '28px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', textAlign: 'center' }}>
              <Receipt size={28} color="var(--dax-text-muted)" style={{ margin: '0 auto 8px', display: 'block', opacity: .3 }} />
              <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>No hay facturas aún</p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
                Las facturas aparecerán aquí una vez actives tu suscripción paga.
              </p>
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
                        {fmtDateShort(invoice.createdAt)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`dax-badge ${invoice.status === 'paid' ? 'dax-badge-success' : 'dax-badge-warning'}`}>
                          {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                        {fmtPrice(Number(invoice.amount))} {invoice.currency}
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
          onChangePlan={(name) => { setChangingTo(name); changePlanMutation.mutate(name); }}
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
          from { opacity: 0; transform: scale(.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}