'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Check, Zap, ArrowRight, Loader2,
  RefreshCw, Calendar, FileText, Shield, ChevronRight,
  Smartphone, AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PLANS } from '@/lib/plans';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Subscription {
  id: string;
  status: 'active' | 'trialing' | 'cancelled' | 'past_due';
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  plan: { name: string; displayName: string; priceMonthly: number; priceAnnual?: number };
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  paidAt?: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtMoney(n: number, currency = 'USD') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency }).format(n);
}
function daysLeft(d?: string) {
  if (!d) return 0;
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

// ── Badge de estado ───────────────────────────────────────────────────────────
function StatusBadge({ status, trialEndsAt }: { status: string; trialEndsAt?: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    active:    { label: 'Activo',      color: '#3DBF7F', bg: 'rgba(61,191,127,.12)',  icon: CheckCircle },
    trialing:  { label: `Trial · ${daysLeft(trialEndsAt)}d`, color: '#5AAAF0', bg: 'rgba(90,170,240,.12)', icon: Clock },
    cancelled: { label: 'Cancelado',   color: '#E05050', bg: 'rgba(224,80,80,.12)',   icon: AlertCircle },
    past_due:  { label: 'Vencido',     color: '#F0A030', bg: 'rgba(240,160,48,.12)',  icon: AlertCircle },
  };
  const c = cfg[status] ?? cfg.active;
  const Icon = c.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '20px', background: c.bg, border: `1px solid ${c.color}30`, fontSize: '12px', fontWeight: 700, color: c.color }}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}

// ── Plan Card (selector) ──────────────────────────────────────────────────────
function PlanOption({ plan, annual, selected, current, onSelect }: {
  plan: typeof PLANS[number]; annual: boolean; selected: boolean; current: boolean; onSelect: () => void;
}) {
  const price = annual ? plan.annualMonthly : plan.monthlyPrice;
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '16px', borderRadius: '14px', cursor: 'pointer', transition: 'all .2s',
        background: selected ? `${plan.color}08` : 'rgba(22,34,53,0.5)',
        border: `1.5px solid ${selected ? plan.color : current ? 'rgba(255,92,53,.3)' : 'rgba(30,58,95,0.5)'}`,
        position: 'relative',
      }}
    >
      {current && (
        <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '9px', fontWeight: 700, color: '#FF5C35', background: 'rgba(255,92,53,.1)', border: '1px solid rgba(255,92,53,.2)', padding: '2px 8px', borderRadius: '6px', letterSpacing: '.04em' }}>
          PLAN ACTUAL
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${plan.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: plan.color, boxShadow: `0 0 8px ${plan.color}` }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>{plan.label}</p>
            <p style={{ fontSize: '11px', color: '#3A6A9A', marginTop: '2px' }}>{plan.desc}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '20px', fontWeight: 800, color: selected ? plan.color : '#F0F4FF', lineHeight: 1 }}>${price}</p>
          <p style={{ fontSize: '10px', color: '#2A5280' }}>/mes</p>
        </div>
      </div>
    </div>
  );
}

// ── Modal de pago ─────────────────────────────────────────────────────────────
function PaymentModal({ plan, annual, onClose, onSuccess }: {
  plan: typeof PLANS[number]; annual: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [method, setMethod]   = useState<'pagadito' | 'sinpe' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const amount = annual ? plan.annualPrice : plan.monthlyPrice;
  const label  = annual ? `${plan.label} Anual` : `${plan.label} Mensual`;

  const handlePagadito = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/billing/pagadito/initiate', {
        planName:  plan.name,
        planLabel: label,
        amount,
        currency: 'USD',
        annual,
      });
      sessionStorage.setItem('pagadito_session_token', data.sessionToken);
      sessionStorage.setItem('pagadito_ern', data.ern);
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al conectar con Pagadito. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(4,8,16,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(14,22,36,0.98)', border: '1px solid rgba(30,58,95,0.7)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,.6)' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C35', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Activar plan</p>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F4FF', lineHeight: 1.2 }}>{label}</h2>
          <p style={{ fontSize: '28px', fontWeight: 800, color: plan.color, marginTop: '8px' }}>
            {fmtMoney(amount)} <span style={{ fontSize: '14px', color: '#3A6A9A', fontWeight: 400 }}>USD · {annual ? 'año' : 'mes'}</span>
          </p>
        </div>

        {/* Métodos */}
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#2A5280', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Elige método de pago</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

          {/* Pagadito */}
          <button
            onClick={() => setMethod('pagadito')}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: method === 'pagadito' ? 'rgba(255,107,0,.08)' : 'rgba(22,34,53,0.6)', border: `1.5px solid ${method === 'pagadito' ? 'rgba(255,107,0,.5)' : 'rgba(30,58,95,0.5)'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all .2s', fontFamily: 'Outfit, sans-serif' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,107,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={16} color="#FF6B00" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>Tarjeta de crédito / débito</p>
              <p style={{ fontSize: '11px', color: '#3A6A9A', marginTop: '2px' }}>Visa · Mastercard · Débito — vía Pagadito</p>
            </div>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${method === 'pagadito' ? '#FF6B00' : 'rgba(30,58,95,0.8)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {method === 'pagadito' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B00' }} />}
            </div>
          </button>

          {/* SINPE */}
          <button
            onClick={() => setMethod('sinpe')}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: method === 'sinpe' ? 'rgba(61,191,127,.08)' : 'rgba(22,34,53,0.6)', border: `1.5px solid ${method === 'sinpe' ? 'rgba(61,191,127,.5)' : 'rgba(30,58,95,0.5)'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all .2s', fontFamily: 'Outfit, sans-serif' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(61,191,127,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Smartphone size={16} color="#3DBF7F" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FF', lineHeight: 1 }}>SINPE Móvil</p>
              <p style={{ fontSize: '11px', color: '#3A6A9A', marginTop: '2px' }}>Transferencia bancaria · Costa Rica</p>
            </div>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${method === 'sinpe' ? '#3DBF7F' : 'rgba(30,58,95,0.8)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {method === 'sinpe' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3DBF7F' }} />}
            </div>
          </button>
        </div>

        {/* SINPE info */}
        {method === 'sinpe' && (
          <div style={{ padding: '14px 16px', background: 'rgba(61,191,127,.06)', border: '1px solid rgba(61,191,127,.2)', borderRadius: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#3DBF7F', fontWeight: 700, marginBottom: '6px' }}>Instrucciones SINPE</p>
            <p style={{ fontSize: '12px', color: '#7BBEE8', lineHeight: 1.7 }}>
              Envía <strong style={{ color: '#F0F4FF' }}>{fmtMoney(amount)} USD</strong> al número <strong style={{ color: '#F0F4FF' }}>8790-5876</strong> (Jacobo Gutiérrez).<br />
              Luego envía el comprobante a <strong style={{ color: '#F0F4FF' }}>ventas@daxcloud.shop</strong> con tu correo de cuenta.
            </p>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', background: 'rgba(224,80,80,.08)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '10px', marginBottom: '16px' }}>
            <AlertCircle size={14} color="#E05050" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12px', color: '#E05050', lineHeight: 1.6 }}>{error}</p>
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', background: 'transparent', border: '1px solid rgba(30,58,95,0.6)', borderRadius: '12px', color: '#4A7FAF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            Cancelar
          </button>
          {method === 'pagadito' && (
            <button onClick={handlePagadito} disabled={loading} style={{ flex: 2, padding: '13px', background: loading ? 'rgba(255,107,0,.3)' : 'rgba(255,107,0,.9)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif', transition: 'all .2s' }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Conectando...</> : <>Pagar con Pagadito <ArrowRight size={14} /></>}
            </button>
          )}
          {method === 'sinpe' && (
            <button onClick={onClose} style={{ flex: 2, padding: '13px', background: 'rgba(61,191,127,.15)', border: '1px solid rgba(61,191,127,.3)', borderRadius: '12px', color: '#3DBF7F', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [annual,       setAnnual]       = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showModal,    setShowModal]    = useState(false);
  const [tab,          setTab]          = useState<'plan' | 'invoices'>('plan');

  const load = async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        api.get('/billing/subscription'),
        api.get('/billing/invoices'),
      ]);
      setSubscription(subRes.data);
      setInvoices(invRes.data);
      setSelectedPlan(subRes.data?.plan?.name ?? null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const currentPlan = PLANS.find(p => p.name === subscription?.plan?.name);
  const targetPlan  = PLANS.find(p => p.name === selectedPlan);
  const canUpgrade  = selectedPlan && selectedPlan !== subscription?.plan?.name;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dax-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="var(--dax-coral)" style={{ animation: 'spin .7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dax-bg)', fontFamily: 'Outfit, system-ui, sans-serif', padding: 'clamp(20px,4vw,40px)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-coral)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Configuración</p>
          <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: 'var(--dax-text-primary)', letterSpacing: '-.02em' }}>Plan y facturación</h1>
        </div>

        {/* Resumen suscripción */}
        {subscription && (
          <div style={{ padding: '24px', background: 'rgba(22,34,53,0.6)', border: '1px solid rgba(30,58,95,0.6)', borderRadius: '16px', marginBottom: '28px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dax-text-primary)' }}>
                  Plan {subscription.plan.displayName}
                </p>
                <StatusBadge status={subscription.status} trialEndsAt={subscription.trialEndsAt} />
              </div>
              {subscription.currentPeriodEnd && (
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={11} />
                  {subscription.cancelAtPeriodEnd ? 'Cancela el' : 'Renueva el'} {fmtDate(subscription.currentPeriodEnd)}
                </p>
              )}
              {subscription.status === 'trialing' && subscription.trialEndsAt && (
                <p style={{ fontSize: '12px', color: '#5AAAF0', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={11} />
                  Trial termina el {fmtDate(subscription.trialEndsAt)} · {daysLeft(subscription.trialEndsAt)} días restantes
                </p>
              )}
            </div>
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'transparent', border: '1px solid rgba(30,58,95,0.6)', borderRadius: '9px', color: 'var(--dax-text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(15,25,36,0.8)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
          {(['plan', 'invoices'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: '9px', border: 'none', background: tab === t ? 'rgba(255,92,53,.15)' : 'transparent', color: tab === t ? 'var(--dax-coral)' : 'var(--dax-text-muted)', fontSize: '13px', fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all .2s' }}>
              {t === 'plan' ? 'Mi plan' : 'Facturas'}
            </button>
          ))}
        </div>

        {/* Tab: Plan */}
        {tab === 'plan' && (
          <div>
            {/* Toggle anual/mensual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>Facturación:</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 6px', background: 'rgba(22,34,53,0.7)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: '30px' }}>
                <button onClick={() => setAnnual(false)} style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', background: !annual ? 'rgba(255,92,53,.15)' : 'transparent', color: !annual ? '#FF5C35' : '#2A5280', fontSize: '12px', fontWeight: !annual ? 700 : 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Mensual</button>
                <button onClick={() => setAnnual(true)}  style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', background: annual ? 'rgba(255,92,53,.15)' : 'transparent', color: annual ? '#FF5C35' : '#2A5280', fontSize: '12px', fontWeight: annual ? 700 : 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Anual
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#3DBF7F', background: 'rgba(61,191,127,.1)', border: '1px solid rgba(61,191,127,.2)', padding: '1px 6px', borderRadius: '4px' }}>2 meses gratis</span>
                </button>
              </div>
            </div>

            {/* Lista de planes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {PLANS.map(plan => (
                <PlanOption
                  key={plan.name}
                  plan={plan}
                  annual={annual}
                  selected={selectedPlan === plan.name}
                  current={subscription?.plan?.name === plan.name}
                  onSelect={() => setSelectedPlan(plan.name)}
                />
              ))}
            </div>

            {/* Botón de acción */}
            {canUpgrade && targetPlan && (
              <div style={{ padding: '20px', background: 'rgba(255,92,53,.05)', border: '1px solid rgba(255,92,53,.2)', borderRadius: '14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                    Cambiar a {targetPlan.label} {annual ? 'Anual' : 'Mensual'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>
                    {fmtMoney(annual ? targetPlan.annualPrice : targetPlan.monthlyPrice)} USD · {annual ? 'facturado anualmente' : 'facturado mensualmente'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 16px rgba(255,92,53,.3)', transition: 'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                >
                  Activar plan <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Features del plan seleccionado */}
            {targetPlan && (
              <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(22,34,53,0.4)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: '14px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Incluye en {targetPlan.label}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '8px' }}>
                  {targetPlan.features.filter(f => f.included).map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={12} color={targetPlan.color} strokeWidth={3} />
                      <span style={{ fontSize: '12px', color: '#B8D0E8' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Facturas */}
        {tab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', background: 'rgba(22,34,53,0.4)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: '14px' }}>
                <FileText size={32} color="rgba(30,58,95,0.8)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--dax-text-muted)' }}>No hay facturas aún</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {invoices.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(22,34,53,0.5)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(61,191,127,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={15} color="#3DBF7F" />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1 }}>{inv.description || 'Factura'}</p>
                        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{fmtDate(inv.paidAt || inv.createdAt)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#3DBF7F' }}>{fmtMoney(Number(inv.amount), inv.currency)}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(61,191,127,.1)', border: '1px solid rgba(61,191,127,.2)', color: '#3DBF7F' }}>
                        {inv.status === 'paid' ? 'Pagado' : inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Seguridad */}
        <div style={{ marginTop: '32px', padding: '14px 18px', background: 'rgba(15,25,36,0.5)', border: '1px solid rgba(30,58,95,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={14} color="#2A5280" />
          <p style={{ fontSize: '11px', color: '#2A5280', lineHeight: 1.5 }}>
            Pagos procesados de forma segura por <strong style={{ color: '#3A6A9A' }}>Pagadito</strong>. DaxCloud no almacena datos de tarjetas.
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && targetPlan && (
        <PaymentModal
          plan={targetPlan}
          annual={annual}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
