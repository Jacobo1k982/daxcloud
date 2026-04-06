'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { api } from '@/lib/api';
import {
  ArrowRight, Check, X, Zap,
  Package, Users, BarChart2, Building2,
} from 'lucide-react';

type Step = 'welcome' | 'business' | 'product' | 'team' | 'pos' | 'done';

// ── Barra de progreso ─────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C35', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Paso {current} de {total}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{pct}% completado</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(30,58,95,0.4)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #FF5C35, #FF8C00)',
          borderRadius: '2px',
          transition: 'width .4s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  );
}

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user, tenant, industry } = useAuth();
  const { completeStep } = useOnboarding();
  const [step, setStep] = useState<Step>('welcome');
  const [mounted, setMounted] = useState(false);

  // Producto rápido
  const [productName,  setProductName]  = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [productSaved, setProductSaved] = useState(false);

  // Equipo
  const [teamEmail, setTeamEmail] = useState('');
  const [teamSaved, setTeamSaved] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const steps: Step[] = ['welcome', 'business', 'product', 'team', 'pos', 'done'];
  const stepIndex = steps.indexOf(step);

  const goNext = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const handleSaveProduct = async () => {
    if (!productName.trim() || !productPrice) return;
    setSaving(true);
    try {
      // Obtiene la primera sucursal
      const { data: branches } = await api.get('/branches');
      const branchId = branches?.[0]?.id;

      await api.post('/products', {
        name:     productName,
        price:    Number(productPrice),
        category: 'General',
        branchId,
      });
      completeStep('product');
      setProductSaved(true);
      setTimeout(goNext, 800);
    } catch {
      setSaving(false);
    }
  };

  const handleSkipTeam = () => {
    goNext();
  };

  const handleFinish = () => {
    completeStep('business');
    completeStep('explore');
    onClose();
    router.push('/dashboard');
  };

  const handleGoToPOS = () => {
    completeStep('pos');
    onClose();
    router.push('/pos');
  };

  if (!mounted) return null;

  const INDUSTRY_EMOJI: Record<string, string> = {
    general: '🏪', restaurant: '🍽️', bakery: '🥖',
    pharmacy: '💊', salon: '✂️', clothing: '👗',
    produce: '🥦', supermarket: '🛒',
  };

  const modal = (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'rgba(22,34,53,0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(30,58,95,0.7)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)',
        animation: 'modalIn .3s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* Barra coral superior */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #FF5C35, #FF8C00, #00C8D4)' }} />

        <div style={{ padding: '28px 32px 32px' }}>

          {/* ── BIENVENIDA ── */}
          {step === 'welcome' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', lineHeight: 1 }}>
                {INDUSTRY_EMOJI[industry] ?? '🏪'}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#F0F4FF', marginBottom: '8px', letterSpacing: '-.02em' }}>
                ¡Bienvenido a DaxCloud,<br />{user?.firstName}! 🎉
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--dax-text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                Tu negocio <strong style={{ color: '#F0F4FF' }}>{tenant?.name}</strong> está listo.<br />
                Te guiaremos en 4 pasos rápidos para que aproveches al máximo tus <strong style={{ color: '#FF5C35' }}>14 días gratis</strong>.
              </p>

              {/* Mini checklist visual */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', textAlign: 'left' }}>
                {[
                  { icon: Building2, text: 'Confirma tu negocio',    time: '30 seg' },
                  { icon: Package,   text: 'Agrega tu primer producto', time: '1 min' },
                  { icon: Zap,       text: 'Haz tu primera venta',   time: '2 min' },
                  { icon: BarChart2, text: 'Explora el dashboard',   time: '1 min' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(30,58,95,.3)', borderRadius: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,92,53,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color="#FF5C35" />
                      </div>
                      <span style={{ fontSize: '13px', color: '#B8D0E8', flex: 1 }}>{item.text}</span>
                      <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.time}</span>
                    </div>
                  );
                })}
              </div>

              <button onClick={goNext} style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 4px 20px rgba(255,92,53,.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                Empecemos <ArrowRight size={16} />
              </button>

              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', fontSize: '12px', marginTop: '12px', fontFamily: 'Outfit, sans-serif' }}>
                Saltar por ahora
              </button>
            </div>
          )}

          {/* ── NEGOCIO ── */}
          {step === 'business' && (
            <div style={{ animation: 'fadeUp .3s ease' }}>
              <ProgressBar current={1} total={4} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,92,53,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={20} color="#FF5C35" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F4FF', marginBottom: '2px' }}>Tu negocio</h3>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Confirma que todo está correcto</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  { label: 'Nombre',    value: tenant?.name ?? '—' },
                  { label: 'Industria', value: `${INDUSTRY_EMOJI[industry] ?? ''} ${industry}` },
                  { label: 'País',      value: tenant?.country ?? '—' },
                  { label: 'Moneda',    value: tenant?.currency ?? '—' },
                  { label: 'Plan',      value: `Starter · 14 días gratis` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(15,25,36,.5)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#B8D0E8', textTransform: 'capitalize' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="/settings" onClick={() => { completeStep('business'); onClose(); }} style={{
                  flex: 1, padding: '12px', textDecoration: 'none',
                  background: 'rgba(30,58,95,.4)', border: '1px solid rgba(30,58,95,.6)',
                  borderRadius: '12px', color: '#B8D0E8',
                  fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  Editar
                </a>
                <button onClick={() => { completeStep('business'); goNext(); }} style={{
                  flex: 2, padding: '12px',
                  background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  boxShadow: '0 4px 14px rgba(255,92,53,.25)',
                }}>
                  Se ve bien <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── PRIMER PRODUCTO ── */}
          {step === 'product' && (
            <div style={{ animation: 'fadeUp .3s ease' }}>
              <ProgressBar current={2} total={4} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(90,170,240,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={20} color="#5AAAF0" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F4FF', marginBottom: '2px' }}>Tu primer producto</h3>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Agrégalo rápido — puedes añadir más después</p>
                </div>
              </div>

              {productSaved ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(61,191,127,.12)', border: '1px solid rgba(61,191,127,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Check size={24} color="#3DBF7F" />
                  </div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#3DBF7F' }}>¡Producto creado!</p>
                  <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{productName} · ₡{productPrice}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', display: 'block', marginBottom: '6px' }}>
                      Nombre del producto
                    </label>
                    <input
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      placeholder={industry === 'restaurant' ? 'Ej: Hamburguesa clásica' : industry === 'bakery' ? 'Ej: Pan de queso' : 'Ej: Camisa talla M'}
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'rgba(15,25,36,.6)',
                        border: '1px solid rgba(30,58,95,.8)',
                        borderRadius: '10px', color: '#F0F4FF',
                        fontSize: '14px', fontFamily: 'Outfit, sans-serif',
                        outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color .2s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#FF5C35'}
                      onBlur={e => e.target.style.borderColor = 'rgba(30,58,95,.8)'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', display: 'block', marginBottom: '6px' }}>
                      Precio ({tenant?.currency ?? 'CRC'})
                    </label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={e => setProductPrice(e.target.value)}
                      placeholder="Ej: 4500"
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'rgba(15,25,36,.6)',
                        border: '1px solid rgba(30,58,95,.8)',
                        borderRadius: '10px', color: '#F0F4FF',
                        fontSize: '14px', fontFamily: 'Outfit, sans-serif',
                        outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color .2s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#FF5C35'}
                      onBlur={e => e.target.style.borderColor = 'rgba(30,58,95,.8)'}
                    />
                  </div>
                </div>
              )}

              {!productSaved && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={goNext} style={{
                    flex: 1, padding: '12px', background: 'transparent',
                    border: '1px solid rgba(30,58,95,.6)', borderRadius: '12px',
                    color: 'var(--dax-text-muted)', fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}>
                    Saltar
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={!productName.trim() || !productPrice || saving}
                    style={{
                      flex: 2, padding: '12px',
                      background: !productName.trim() || !productPrice
                        ? 'rgba(30,58,95,.4)'
                        : 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                      border: 'none', borderRadius: '12px',
                      color: !productName.trim() || !productPrice ? 'var(--dax-text-muted)' : '#fff',
                      fontSize: '13px', fontWeight: 700,
                      cursor: !productName.trim() || !productPrice ? 'not-allowed' : 'pointer',
                      fontFamily: 'Outfit, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      boxShadow: !productName.trim() || !productPrice ? 'none' : '0 4px 14px rgba(255,92,53,.25)',
                    }}>
                    {saving ? (
                      <><span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(30,58,95,.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Guardando...</>
                    ) : (
                      <><Check size={14} /> Crear producto</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── EQUIPO ── */}
          {step === 'team' && (
            <div style={{ animation: 'fadeUp .3s ease' }}>
              <ProgressBar current={3} total={4} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(167,139,250,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={20} color="#A78BFA" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F4FF', marginBottom: '2px' }}>
                    Invita a tu equipo
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)', marginLeft: '8px' }}>Opcional</span>
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Agrega cajeros o gerentes a tu negocio</p>
                </div>
              </div>

              <div style={{ padding: '14px', background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.15)', borderRadius: '10px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#A78BFA', lineHeight: 1.6 }}>
                  💡 Los negocios con equipo tienen <strong>3x más retención</strong>. Puedes invitar más usuarios en cualquier momento desde Configuración.
                </p>
              </div>

              {teamSaved ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Check size={28} color="#3DBF7F" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#3DBF7F' }}>¡Invitación enviada!</p>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', display: 'block', marginBottom: '6px' }}>
                    Email del colaborador
                  </label>
                  <input
                    type="email"
                    value={teamEmail}
                    onChange={e => setTeamEmail(e.target.value)}
                    placeholder="cajero@minegocio.com"
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'rgba(15,25,36,.6)',
                      border: '1px solid rgba(30,58,95,.8)',
                      borderRadius: '10px', color: '#F0F4FF',
                      fontSize: '14px', fontFamily: 'Outfit, sans-serif',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#A78BFA'}
                    onBlur={e => e.target.style.borderColor = 'rgba(30,58,95,.8)'}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSkipTeam} style={{
                  flex: 1, padding: '12px', background: 'transparent',
                  border: '1px solid rgba(30,58,95,.6)', borderRadius: '12px',
                  color: 'var(--dax-text-muted)', fontSize: '13px',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                }}>
                  Saltar
                </button>
                <button onClick={() => { completeStep('team'); setTeamSaved(true); setTimeout(goNext, 600); }} style={{
                  flex: 2, padding: '12px',
                  background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}>
                  Invitar <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── POS ── */}
          {step === 'pos' && (
            <div style={{ animation: 'fadeUp .3s ease', textAlign: 'center' }}>
              <ProgressBar current={4} total={4} />
              <div style={{ fontSize: '52px', marginBottom: '16px', lineHeight: 1 }}>⚡</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#F0F4FF', marginBottom: '8px' }}>
                ¡Todo listo para vender!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                Abre el POS y haz tu primera venta de prueba.<br />
                Solo toma <strong style={{ color: '#FF5C35' }}>2 minutos</strong> y verás el poder de DaxCloud.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {[
                  'Tu producto ya está cargado en el POS',
                  'Selecciona el método de pago',
                  'Confirma la venta y ve tus reportes',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(15,25,36,.5)', borderRadius: '10px', textAlign: 'left' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,92,53,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#FF5C35' }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#B8D0E8' }}>{tip}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleGoToPOS} style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 4px 20px rgba(255,92,53,.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '10px',
              }}>
                <Zap size={16} /> Abrir POS ahora
              </button>
              <button onClick={handleFinish} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                Explorar el dashboard primero
              </button>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(61,191,127,.12)', border: '1px solid rgba(61,191,127,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(61,191,127,.15)' }}>
                <Check size={32} color="#3DBF7F" />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#F0F4FF', marginBottom: '8px' }}>
                ¡Onboarding completado! 🎉
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                Ya tienes todo configurado. Recuerda que tienes <strong style={{ color: '#FF5C35' }}>14 días gratis</strong> para explorar todas las funciones.
              </p>
              <button onClick={handleFinish} style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 4px 20px rgba(255,92,53,.35)',
              }}>
                Ir al Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}