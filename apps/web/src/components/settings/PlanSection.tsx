'use client';

import { useState }       from 'react';
import { createPortal }   from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api }            from '@/lib/api';
import { PLANS }          from '@/lib/plans';
import {
  Check, X, AlertTriangle, CreditCard,
  Calendar, Receipt, Zap, ArrowRight,
  Shield, Star, Crown, Clock, Loader2,
  RefreshCw, Gift,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Subscription {
  id?:                  string;
  plan?:                { name: string; displayName?: string; priceMonthly?: number };
  status?:              string;
  currentPeriodStart?:  string;
  currentPeriodEnd?:    string;
  cancelAtPeriodEnd?:   boolean;
  lastFour?:            string;
  cardBrand?:           string;
  trialEndsAt?:         string;
}

// ── Configuración visual ──────────────────────────────────────────────────────
const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Activa',     color: '#3DBF7F', bg: 'rgba(61,191,127,.12)'  },
  trialing:  { label: 'Trial',      color: '#5AAAF0', bg: 'rgba(90,170,240,.12)'  },
  past_due:  { label: 'Vencida',    color: '#F0A030', bg: 'rgba(240,160,48,.12)'  },
  cancelled: { label: 'Cancelada',  color: '#E05050', bg: 'rgba(224,80,80,.12)'   },
};

const PLAN_ICONS: Record<string, any> = {
  starter: Shield,
  growth:  Star,
  scale:   Crown,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d?: string, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CR', opts ?? {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function trialDaysLeft(trialEndsAt?: string): number | null {
  if (!trialEndsAt) return null;
  const diff = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000);
  return Math.max(0, diff);
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL: CAMBIAR PLAN
// ══════════════════════════════════════════════════════════════════════════════
function ChangePlanModal({ currentPlanKey, onClose, onChangePlan, isPending, changingTo }: {
  currentPlanKey: string;
  onClose:        () => void;
  onChangePlan:   (name: string) => void;
  isPending:      boolean;
  changingTo:     string | null;
}) {
  const [annual, setAnnual] = useState(false);

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: '940px', margin: 'auto', animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#F0F4FF', margin: '0 0 4px', letterSpacing: '-.02em' }}>
              Elige tu plan
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(176,208,240,.6)', margin: 0 }}>
              Sin contratos · Cancela cuando quieras · Precios en USD
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer', color: 'rgba(176,208,240,.7)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Toggle mensual / anual */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', padding: '10px 20px', background: 'rgba(15,25,36,.9)', borderRadius: '40px', border: '1px solid rgba(30,58,95,.6)' }}>
            <span style={{ fontSize: '13px', fontWeight: annual ? 400 : 700, color: !annual ? '#F0F4FF' : 'rgba(176,208,240,.4)', transition: 'all .2s' }}>Mensual</span>
            <div
              onClick={() => setAnnual(p => !p)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', background: annual ? '#FF5C35' : 'rgba(30,58,95,.8)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}
            >
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

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {PLANS.map(plan => {
            const isCurrent  = plan.name === currentPlanKey;
            const price      = annual ? plan.annualMonthly : plan.monthlyPrice;
            const isChanging = changingTo === plan.name && isPending;
            const saving     = plan.monthlyPrice * 12 - plan.annualPrice;
            const Icon       = PLAN_ICONS[plan.name] ?? Shield;

            return (
              <div key={plan.name} style={{
                borderRadius: '20px', padding: '28px 24px',
                background: isCurrent
                  ? `linear-gradient(145deg, ${plan.color}18, ${plan.color}06)`
                  : plan.popular
                    ? 'linear-gradient(145deg, rgba(255,92,53,.06), rgba(15,25,36,.95))'
                    : 'rgba(22,34,53,.85)',
                border:    `1.5px solid ${isCurrent ? plan.color : plan.popular ? 'rgba(255,92,53,.3)' : 'rgba(30,58,95,.5)'}`,
                position:  'relative',
                backdropFilter: 'blur(12px)',
                transition: 'all .2s',
              }}>
                {(isCurrent || plan.popular) && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: isCurrent ? plan.color : '#FF5C35', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '.06em', textTransform: 'uppercase', boxShadow: `0 4px 12px ${isCurrent ? plan.color : '#FF5C35'}50` }}>
                    {isCurrent ? '✓ Plan actual' : '⚡ Popular'}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', marginTop: isCurrent || plan.popular ? '8px' : '0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${plan.color}30`, flexShrink: 0 }}>
                    <Icon size={18} color={plan.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#F0F4FF', margin: 0 }}>{plan.label}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(176,208,240,.5)', margin: 0 }}>{plan.limit}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '38px', fontWeight: 900, color: plan.color, lineHeight: 1, letterSpacing: '-.02em' }}>${price}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(176,208,240,.5)', marginBottom: '6px' }}>/mes</span>
                  </div>
                  {annual
                    ? <p style={{ fontSize: '11px', color: '#3DBF7F', fontWeight: 600 }}>${plan.annualPrice}/año · ahorras ${saving}</p>
                    : <p style={{ fontSize: '11px', color: 'rgba(176,208,240,.4)' }}>${plan.monthlyPrice * 12}/año facturado mensual</p>
                  }
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '22px' }}>
                  {plan.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '17px', height: '17px', borderRadius: '50%', background: feat.included ? `${plan.color}20` : 'rgba(30,58,95,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {feat.included
                          ? <Check size={9} color={plan.color} strokeWidth={3} />
                          : <X size={8} color="rgba(113,128,150,.5)" strokeWidth={2} />}
                      </div>
                      <span style={{ fontSize: '12px', color: feat.included ? 'rgba(240,244,255,.8)' : 'rgba(113,128,150,.4)', textDecoration: feat.included ? 'none' : 'line-through' }}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { if (!isCurrent && !isPending) onChangePlan(plan.name); }}
                  disabled={isCurrent || isPending}
                  style={{
                    width: '100%', padding: '12px',
                    background: isCurrent ? 'rgba(30,58,95,.3)' : isChanging ? 'rgba(30,58,95,.5)' : plan.popular ? `linear-gradient(135deg, ${plan.color}, #FF3D1F)` : `${plan.color}20`,
                    border:     `1.5px solid ${isCurrent ? 'rgba(30,58,95,.4)' : plan.color}`,
                    borderRadius: '12px',
                    color:  isCurrent ? 'rgba(113,128,150,.6)' : isChanging ? 'rgba(113,128,150,.6)' : plan.popular ? '#fff' : plan.color,
                    fontSize: '13px', fontWeight: 700,
                    cursor:   isCurrent || isPending ? 'default' : 'pointer',
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  {isChanging
                    ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Cambiando...</>
                    : isCurrent ? '✓ Plan actual'
                    : <>{plan.cta} <ArrowRight size={13} /></>
                  }
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(113,128,150,.6)', textAlign: 'center', marginTop: '20px' }}>
          Cambio efectivo inmediatamente · Sin contratos · Precios en dólares (USD)
        </p>
      </div>
    </div>,
    document.body
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL: CANCELAR
// ══════════════════════════════════════════════════════════════════════════════
function CancelModal({ subscription, onClose, onConfirm, isPending }: {
  subscription: Subscription;
  onClose:      () => void;
  onConfirm:    () => void;
  isPending:    boolean;
}) {
  const [confirmText, setConfirmText] = useState('');

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}
    >
      <div className="dax-card" style={{ width: '100%', maxWidth: '460px', padding: '32px', animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Cancelar suscripción</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>

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
        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="CANCELAR" className="dax-input" style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }} />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Volver</button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'CANCELAR' || isPending}
            style={{
              flex: 1, padding: '11px', borderRadius: '12px', border: `1.5px solid ${confirmText === 'CANCELAR' ? '#E05050' : 'rgba(30,58,95,.4)'}`,
              background: confirmText === 'CANCELAR' ? '#E05050' : 'rgba(30,58,95,.4)',
              color: confirmText === 'CANCELAR' ? '#fff' : 'var(--dax-text-muted)',
              fontSize: '13px', fontWeight: 700,
              cursor: confirmText !== 'CANCELAR' || isPending ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
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

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export function PlanSection({ showToast }: {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const queryClient = useQueryClient();
  const [showChangePlan,  setShowChangePlan]  = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [changingTo,      setChangingTo]      = useState<string | null>(null);

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ['billing-subscription'],
    queryFn:  async () => { const { data } = await api.get('/billing/subscription'); return data; },
    retry: 1,
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['billing-invoices'],
    queryFn:  async () => { const { data } = await api.get('/billing/invoices'); return data; },
  });

  const changePlanMutation = useMutation({
    mutationFn: async (planName: string) => api.post('/billing/change-plan', { planName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
      setShowChangePlan(false);
      setChangingTo(null);
      showToast('Plan actualizado correctamente');
    },
    onError: (err: any) => {
      setChangingTo(null);
      showToast(err.response?.data?.message ?? 'Error al cambiar plan', 'error');
    },
  });

  const trialMutation = useMutation({
    mutationFn: async () => api.post('/billing/start-trial'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      showToast('Trial de 15 días activado — ¡disfruta DaxCloud!');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al activar trial', 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => api.put('/billing/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      setShowCancelModal(false);
      showToast('Suscripción programada para cancelarse al final del período');
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '40px', color: 'var(--dax-text-muted)', fontSize: '13px' }}>
      <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} />
      Cargando suscripción...
    </div>
  );

  const planKey    = subscription?.plan?.name    ?? 'starter';
  const planData   = PLANS.find(p => p.name === planKey) ?? PLANS[0];
  const statusInfo = STATUS_INFO[subscription?.status ?? 'active'] ?? STATUS_INFO.active;
  const PlanIcon   = PLAN_ICONS[planKey] ?? Shield;
  const daysLeft   = trialDaysLeft(subscription?.trialEndsAt ?? undefined);
  const saving     = planData.monthlyPrice * 12 - planData.annualPrice;
  const savingPct  = Math.round((saving / (planData.monthlyPrice * 12)) * 100);
  const isTrial    = subscription?.status === 'trialing';
  const isActive   = subscription?.status === 'active';

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '760px' }}>

        {/* ── Banner trial activo ── */}
        {isTrial && daysLeft !== null && (
          <div style={{
            borderRadius: '14px', padding: '18px 20px',
            background:   daysLeft <= 3 ? 'rgba(224,80,80,.06)' : 'rgba(90,170,240,.06)',
            border:       `1px solid ${daysLeft <= 3 ? 'rgba(224,80,80,.25)' : 'rgba(90,170,240,.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: daysLeft <= 3 ? 'rgba(224,80,80,.12)' : 'rgba(90,170,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={18} color={daysLeft <= 3 ? '#E05050' : '#5AAAF0'} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: daysLeft <= 3 ? '#E05050' : '#5AAAF0', marginBottom: '2px' }}>
                  {daysLeft === 0
                    ? 'Tu trial ha vencido'
                    : `${daysLeft} día${daysLeft !== 1 ? 's' : ''} de prueba restantes`
                  }
                </p>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                  {daysLeft <= 3
                    ? 'Activa un plan para no perder acceso a tu negocio'
                    : `Trial termina el ${fmtDate(subscription?.trialEndsAt, { day: '2-digit', month: 'long' })}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowChangePlan(true)}
              className="dax-btn-primary"
              style={{ fontSize: '13px', padding: '10px 20px', flexShrink: 0 }}
            >
              Activar plan →
            </button>
          </div>
        )}

        {/* ── Banner sin trial / nueva cuenta ── */}
        {!isTrial && !isActive && (
          <div style={{
            borderRadius: '14px', padding: '18px 20px',
            background: 'rgba(61,191,127,.06)',
            border: '1px solid rgba(61,191,127,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(61,191,127,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Gift size={18} color="#3DBF7F" />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#3DBF7F', marginBottom: '2px' }}>
                  Prueba DaxCloud gratis por 15 días
                </p>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                  Sin tarjeta de crédito · Cancela cuando quieras
                </p>
              </div>
            </div>
            <button
              onClick={() => trialMutation.mutate()}
              disabled={trialMutation.isPending}
              className="dax-btn-primary"
              style={{ fontSize: '13px', padding: '10px 20px', flexShrink: 0, background: '#3DBF7F', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {trialMutation.isPending
                ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Activando...</>
                : <><Gift size={13} /> Iniciar trial gratis</>
              }
            </button>
          </div>
        )}

        {/* ── Banner cancelación pendiente ── */}
        {subscription?.cancelAtPeriodEnd && (
          <div style={{ borderRadius: '14px', padding: '16px 20px', background: 'rgba(240,160,48,.06)', border: '1px solid rgba(240,160,48,.2)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={18} color="#F0A030" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0A030', marginBottom: '3px' }}>
                Tu suscripción se cancelará el {fmtDate(subscription?.currentPeriodEnd)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Puedes reactivarla antes de esa fecha sin perder tus datos.</p>
            </div>
            <button
              onClick={() => reactivateMutation.mutate()}
              disabled={reactivateMutation.isPending}
              className="dax-btn-primary"
              style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {reactivateMutation.isPending
                ? <Loader2 size={12} style={{ animation: 'spin .7s linear infinite' }} />
                : <><RefreshCw size={12} /> Reactivar</>
              }
            </button>
          </div>
        )}

        {/* ── Tarjeta del plan actual ── */}
        <div style={{
          borderRadius: '20px', padding: '28px',
          background: `linear-gradient(145deg, ${planData.color}12, ${planData.color}04, var(--dax-surface-2))`,
          border: `1.5px solid ${planData.color}30`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decoración */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: `${planData.color}08`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${planData.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${planData.color}30`, flexShrink: 0 }}>
                <PlanIcon size={24} color={planData.color} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: 'var(--dax-text-primary)', margin: 0, letterSpacing: '-.02em' }}>
                    {planData.label}
                  </p>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: statusInfo.color, background: statusInfo.bg, padding: '3px 10px', borderRadius: '20px' }}>
                    {statusInfo.label}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', margin: 0 }}>
                  {planData.desc} · {planData.limit}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 900, color: planData.color, lineHeight: 1, letterSpacing: '-.02em' }}>
                  ${planData.monthlyPrice}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>/mes USD</span>
              </div>
              <p style={{ fontSize: '11px', color: '#3DBF7F', fontWeight: 600, margin: 0 }}>
                o ${planData.annualMonthly}/mes anual · ahorra {savingPct}%
              </p>
            </div>
          </div>

          {/* Info de facturación */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {[
              {
                icon: Calendar,
                label: isTrial ? 'Trial termina' : 'Próxima renovación',
                value: isTrial
                  ? fmtDate(subscription?.trialEndsAt, { day: '2-digit', month: 'short', year: 'numeric' })
                  : fmtDate(subscription?.currentPeriodEnd, { day: '2-digit', month: 'short', year: 'numeric' }),
              },
              {
                icon: Calendar,
                label: 'Miembro desde',
                value: fmtDate(subscription?.currentPeriodStart, { day: '2-digit', month: 'short', year: 'numeric' }),
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
                <div key={i} style={{ background: 'var(--dax-surface)', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${planData.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color={planData.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features del plan */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>
              Incluido en tu plan
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '7px' }}>
              {planData.features.map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--dax-surface)', borderRadius: '10px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: feat.included ? `${planData.color}20` : 'var(--dax-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {feat.included
                      ? <Check size={9} color={planData.color} strokeWidth={3} />
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
              onClick={() => setShowChangePlan(true)}
              className="dax-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Zap size={14} /> Cambiar plan
            </button>
            {!subscription?.cancelAtPeriodEnd && isActive && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="dax-btn-secondary"
                style={{ color: 'var(--dax-danger)', borderColor: 'rgba(224,80,80,.3)', fontSize: '13px' }}
              >
                Cancelar suscripción
              </button>
            )}
          </div>
        </div>

        {/* ── Historial de facturas ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Receipt size={15} color="var(--dax-coral)" />
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Historial de facturación</p>
          </div>

          {invoices.length === 0 ? (
            <div style={{ padding: '32px', background: 'var(--dax-surface-2)', borderRadius: '14px', textAlign: 'center' }}>
              <Receipt size={28} color="var(--dax-text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
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
                  {invoices.map((invoice: any) => (
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
          currentPlanKey={planKey}
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
        @keyframes modalIn { from { opacity:0; transform:scale(.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
