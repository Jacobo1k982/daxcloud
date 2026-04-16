'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Check, ChevronLeft, Eye, EyeOff, ArrowRight, Building2, User, Mail, Lock, Globe, Zap, BarChart2, Package, Users } from 'lucide-react';
import { PLANS as PLAN_DATA } from '@/lib/plans';

const COUNTRIES = [
  { code: 'CR', name: 'Costa Rica',      currency: 'CRC', locale: 'es-CR' },
  { code: 'GT', name: 'Guatemala',       currency: 'GTQ', locale: 'es-GT' },
  { code: 'HN', name: 'Honduras',        currency: 'HNL', locale: 'es-HN' },
  { code: 'NI', name: 'Nicaragua',       currency: 'NIO', locale: 'es-NI' },
  { code: 'PA', name: 'Panamá',          currency: 'PAB', locale: 'es-PA' },
  { code: 'SV', name: 'El Salvador',     currency: 'USD', locale: 'es-SV' },
  { code: 'MX', name: 'México',          currency: 'MXN', locale: 'es-MX' },
  { code: 'DO', name: 'Rep. Dominicana', currency: 'DOP', locale: 'es-DO' },
  { code: 'CO', name: 'Colombia',        currency: 'COP', locale: 'es-CO' },
  { code: 'PE', name: 'Perú',            currency: 'PEN', locale: 'es-PE' },
  { code: 'CL', name: 'Chile',           currency: 'CLP', locale: 'es-CL' },
  { code: 'AR', name: 'Argentina',       currency: 'ARS', locale: 'es-AR' },
  { code: 'BR', name: 'Brasil',          currency: 'BRL', locale: 'pt-BR' },
  { code: 'US', name: 'Estados Unidos',  currency: 'USD', locale: 'en-US' },
  { code: 'ES', name: 'España',          currency: 'EUR', locale: 'es-ES' },
];

const INDUSTRIES = [
  { value: 'general',     emoji: '🪪',  label: 'Tienda',       desc: 'Retail, kiosko',    color: '#FF5C35' },
  { value: 'restaurant',  emoji: '🍽️', label: 'Restaurante',  desc: 'Comidas, bar',      color: '#F97316' },
  { value: 'bakery',      emoji: '🥖',  label: 'Panadería',    desc: 'Pan, pasteles',     color: '#FF5C35' },
  { value: 'pharmacy',    emoji: '💊',  label: 'Farmacia',     desc: 'Medicamentos',      color: '#5AAAF0' },
  { value: 'salon',       emoji: '✂️',  label: 'Peluquería',   desc: 'Estética, spa',     color: '#A78BFA' },
  { value: 'clothing',    emoji: '👗',  label: 'Ropa',         desc: 'Moda, calzado',     color: '#EAB308' },
  { value: 'produce',     emoji: '🥦',  label: 'Verdulería',   desc: 'Frutas, verduras',  color: '#22C55E' },
  { value: 'supermarket', emoji: '🛒',  label: 'Súper',        desc: 'Abarrotes',         color: '#5AAAF0' },
];

// ── Canvas ────────────────────────────────────────────────────────────────────
function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0, W = 0, H = 0;
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    const orb = (cx: number, cy: number, r: number, rgb: string, a: number) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    };
    const animate = () => {
      animId = requestAnimationFrame(animate); t += 0.003;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(30,58,95,0.2)'; ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      orb(W * 0.1 + Math.sin(t * 0.5) * 80, H * 0.3 + Math.cos(t * 0.4) * 60, W * 0.4, '255,92,53', 0.05);
      orb(W * 0.85 + Math.cos(t * 0.6) * 50, H * 0.6 + Math.sin(t * 0.7) * 50, W * 0.35, '90,170,240', 0.04);
      orb(W * 0.5 + Math.sin(t * 0.4) * 60, H * 0.8 + Math.cos(t * 0.3) * 40, W * 0.3, '167,139,250', 0.03);
    };
    resize(); window.addEventListener('resize', resize); animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function CloudLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="regLogo" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8C00" /><stop offset="45%" stopColor="#FF5C35" /><stop offset="100%" stopColor="#00C8D4" />
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z"
        fill="none" stroke="url(#regLogo)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Counter animado ───────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = Math.ceil(target / 60); let current = 0;
    const iv = setInterval(() => { current = Math.min(current + step, target); setCount(current); if (current >= target) clearInterval(iv); }, 24);
    return () => clearInterval(iv);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// ── Input elegante ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, autoComplete, suffix, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string;
  suffix?: React.ReactNode; icon?: any;
}) {
  const [focused, setFocused] = useState(false);
  const hasVal = value.length > 0;
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: focused ? '#FF5C35' : '#2A5280', marginBottom: '7px', transition: 'color .2s' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} color={focused ? '#FF5C35' : '#1E3A5F'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color .2s', pointerEvents: 'none' }} />}
        <input type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: `12px ${suffix ? '42px' : '16px'} 12px ${Icon ? '40px' : '16px'}`, background: focused ? 'rgba(255,92,53,0.04)' : hasVal ? 'rgba(10,18,30,0.8)' : 'rgba(10,18,30,0.6)', border: `1.5px solid ${focused ? 'rgba(255,92,53,0.6)' : hasVal ? 'rgba(30,58,95,0.7)' : 'rgba(22,34,53,0.8)'}`, borderRadius: '12px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box', boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.1)' : 'none', transition: 'all .2s' }}
        />
        {suffix && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: focused ? '#FF5C35' : '#2A5280', marginBottom: '7px', transition: 'color .2s' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '12px 16px', background: focused ? 'rgba(255,92,53,0.04)' : 'rgba(10,18,30,0.8)', border: `1.5px solid ${focused ? 'rgba(255,92,53,0.6)' : 'rgba(30,58,95,0.7)'}`, borderRadius: '12px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', cursor: 'pointer', boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.1)' : 'none', transition: 'all .2s' }}>
        {children}
      </select>
    </div>
  );
}

// ── Selector de industria ─────────────────────────────────────────────────────
function IndustrySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px' }}>
      {INDUSTRIES.map((ind, i) => {
        const sel = value === ind.value;
        return (
          <button key={ind.value} type="button" onClick={() => onChange(ind.value)}
            style={{ padding: '10px 6px', borderRadius: '12px', border: `1.5px solid ${sel ? ind.color : 'rgba(30,58,95,0.5)'}`, background: sel ? `${ind.color}10` : 'rgba(10,18,30,0.6)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all .18s', boxShadow: sel ? `0 0 0 1px ${ind.color}20` : 'none', animation: `industryIn .3s ${i * 0.04}s both` }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{ind.emoji}</span>
            <span style={{ fontSize: '9px', fontWeight: sel ? 700 : 500, color: sel ? ind.color : '#3A6A9A', textAlign: 'center', lineHeight: 1.2 }}>{ind.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── FormCard ──────────────────────────────────────────────────────────────────
function FormCard({ step, animKey, form, error, loading, showPass, showConfirm, strength, strengthColors, strengthLabels, handleNext, handlePrev, set, handleCountryChange, setShowPass, setShowConfirm }: any) {
  const autoSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

  const STEP_TITLES = ['Tu negocio', 'Tu cuenta', 'Región y plan'];
  const STEP_DESCS  = ['Cuéntanos sobre tu negocio', 'Datos del administrador principal', 'Elige tu país y plan'];

  return (
    <div style={{ background: 'rgba(10,18,30,0.88)', backdropFilter: 'blur(24px)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: '24px', padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.02) inset, 0 1px 0 rgba(255,255,255,.05) inset', width: '100%', maxWidth: '480px' }}>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '28px' }}>
        {[1,2,3].map(s => {
          const done    = s < step;
          const current = s === step;
          return (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: done ? '#3DBF7F' : current ? '#FF5C35' : 'rgba(30,58,95,0.35)', transition: 'background .4s', position: 'relative', overflow: 'hidden' }}>
              {current && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)', animation: 'shimmer 1.5s infinite' }} />}
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '28px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg,#FF5C35,#FF8C00)' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35' }}>Paso {step} de 3</span>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F4FF', marginBottom: '4px', letterSpacing: '-.02em' }}>{STEP_TITLES[step - 1]}</h2>
        <p style={{ fontSize: '13px', color: '#2A5280' }}>{STEP_DESCS[step - 1]}</p>
      </div>

      {/* Contenido */}
      <div key={animKey} style={{ animation: 'fadeUp .25s ease', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* PASO 1 */}
        {step === 1 && (
          <>
            <Field label="Nombre del negocio" value={form.tenantName} icon={Building2}
              onChange={v => { set('tenantName', v); set('tenantSlug', autoSlug(v)); }}
              placeholder="Mi Tienda Principal" />

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2A5280', marginBottom: '7px' }}>ID del negocio</label>
              <div style={{ position: 'relative' }}>
                <input value={form.tenantSlug}
                  onChange={e => set('tenantSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="mi-tienda"
                  style={{ width: '100%', padding: '12px 110px 12px 16px', background: 'rgba(10,18,30,0.8)', border: '1.5px solid rgba(30,58,95,0.7)', borderRadius: '12px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'all .2s' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,92,53,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,92,53,0.1)'; e.target.style.background = 'rgba(255,92,53,0.04)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(30,58,95,0.7)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(10,18,30,0.8)'; }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#1E3A5F', pointerEvents: 'none', fontWeight: 500 }}>.daxcloud.app</span>
              </div>
              <p style={{ fontSize: '10px', color: '#2A5280', marginTop: '5px' }}>Solo minúsculas, números y guiones</p>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2A5280', marginBottom: '10px' }}>Tipo de negocio</p>
              <IndustrySelector value={form.industry} onChange={v => set('industry', v)} />
            </div>
          </>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Nombre" value={form.firstName} onChange={v => set('firstName', v)} placeholder="Juan" icon={User} />
              <Field label="Apellido" value={form.lastName} onChange={v => set('lastName', v)} placeholder="Pérez" icon={User} />
            </div>
            <Field label="Correo electrónico" type="email" value={form.email} onChange={v => set('email', v)} placeholder="juan@minegocio.com" autoComplete="email" icon={Mail} />
            <div>
              <Field label="Contraseña" type={showPass ? 'text' : 'password'} value={form.password} onChange={v => set('password', v)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" icon={Lock}
                suffix={<button type="button" onClick={() => setShowPass((p: boolean) => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A5280', display: 'flex', transition: 'color .15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')} onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
              />
              {form.password && (
                <div style={{ marginTop: '7px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength ? strengthColors[strength] : 'rgba(30,58,95,0.35)', transition: 'all .3s' }} />)}
                  </div>
                  <p style={{ fontSize: '10px', color: strengthColors[strength], fontWeight: 600 }}>{strengthLabels[strength]}</p>
                </div>
              )}
            </div>
            <div>
              <Field label="Confirmar contraseña" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={v => set('confirmPassword', v)} placeholder="••••••••" autoComplete="new-password" icon={Lock}
                suffix={<button type="button" onClick={() => setShowConfirm((p: boolean) => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A5280', display: 'flex', transition: 'color .15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')} onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>{showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ fontSize: '10px', color: '#E05050', marginTop: '5px' }}>⚠ Las contraseñas no coinciden</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
                <p style={{ fontSize: '10px', color: '#3DBF7F', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={9} /> Contraseñas coinciden</p>
              )}
            </div>
          </>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <>
            <div>
              <SelectField label="País" value={form.country} onChange={handleCountryChange}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0A121E', color: '#F0F4FF' }}>{c.name}</option>)}
              </SelectField>
              <p style={{ fontSize: '10px', color: '#2A5280', marginTop: '5px' }}>
                Moneda: <strong style={{ color: '#FF5C35' }}>{form.currency}</strong>
              </p>
            </div>

            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2A5280', marginBottom: '10px' }}>Plan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {PLAN_DATA.map(plan => {
                  const sel     = form.plan === plan.name;
                  const saving  = plan.monthlyPrice * 12 - plan.annualPrice;
                  return (
                    <button key={plan.name} type="button" onClick={() => set('plan', plan.name)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '13px', border: `1.5px solid ${sel ? plan.color : 'rgba(30,58,95,0.45)'}`, background: sel ? `${plan.color}08` : 'rgba(10,18,30,0.6)', cursor: 'pointer', textAlign: 'left', transition: 'all .18s', boxShadow: sel ? `0 0 0 1px ${plan.color}20` : 'none' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${sel ? plan.color : '#1E3A5F'}`, background: sel ? plan.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .18s' }}>
                        {sel && <Check size={8} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: sel ? plan.color : '#7BBEE8' }}>{plan.label}</span>
                          {plan.popular && <span style={{ fontSize: '8px', background: `${plan.color}20`, color: plan.color, padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>Popular</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: '#2A5280' }}>{plan.desc}</span>
                          <span style={{ fontSize: '9px', color: '#3DBF7F', fontWeight: 600 }}>Ahorra ${saving}/año</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: sel ? plan.color : '#3A6A9A', lineHeight: 1 }}>${plan.monthlyPrice}</p>
                        <p style={{ fontSize: '9px', color: '#1E3A5F' }}>/mes</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '10px', color: '#1E3A5F', marginTop: '8px', textAlign: 'center' }}>
                14 días gratis · <a href="/pricing" target="_blank" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>Comparar planes →</a>
              </p>
            </div>

            {/* Resumen */}
            <div style={{ padding: '14px', background: 'rgba(10,18,30,0.6)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: '12px' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1E3A5F', marginBottom: '10px' }}>Resumen</p>
              {[
                ['Negocio',   form.tenantName || '—'],
                ['ID',        form.tenantSlug || '—'],
                ['Industria', INDUSTRIES.find(i => i.value === form.industry)?.label ?? '—'],
                ['Admin',     `${form.firstName} ${form.lastName}`.trim() || '—'],
                ['País',      COUNTRIES.find(c => c.code === form.country)?.name ?? form.country],
                ['Moneda',    form.currency],
                ['Plan',      (() => { const p = PLAN_DATA.find(p => p.name === form.plan); return p ? `${p.label} · $${p.monthlyPrice}/mes` : '—'; })()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', color: '#1E3A5F' }}>{k}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: k === 'Plan' ? '#FF5C35' : '#4A7FAF' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Términos */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.acceptTerms} onChange={e => set('acceptTerms', e.target.checked)} style={{ marginTop: '2px', accentColor: '#FF5C35', flexShrink: 0, width: '14px', height: '14px' }} />
              <span style={{ fontSize: '11px', color: '#2A5280', lineHeight: 1.6 }}>
                Acepto los{' '}<a href="/terms" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>términos de servicio</a>{' '}y la{' '}<a href="/privacy" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>política de privacidad</a>
              </span>
            </label>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,.08)', border: '1px solid rgba(224,80,80,.25)', borderRadius: '10px', marginTop: '14px', animation: 'shake .3s ease' }}>
          <p style={{ fontSize: '12px', color: '#E05050' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        {step > 1 && (
          <button onClick={handlePrev} style={{ padding: '12px 16px', background: 'transparent', border: '1.5px solid rgba(30,58,95,0.7)', borderRadius: '13px', color: '#3A6A9A', fontSize: '13px', fontFamily: 'Outfit, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2A5280'; (e.currentTarget as HTMLElement).style.color = '#7BBEE8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,58,95,0.7)'; (e.currentTarget as HTMLElement).style.color = '#3A6A9A'; }}>
            <ChevronLeft size={14} /> Atrás
          </button>
        )}
        <button onClick={handleNext} disabled={loading} style={{ flex: 1, padding: '14px', background: loading ? 'rgba(30,58,95,0.5)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: loading ? '#3A6A9A' : '#fff', border: 'none', borderRadius: '13px', fontSize: '14px', fontWeight: 700, fontFamily: 'Outfit, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(255,92,53,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', letterSpacing: '.01em' }}
          onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(255,92,53,.45)'; } }}
          onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(255,92,53,.35)'; } }}>
          {loading
            ? <><span style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(30,58,95,.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Creando cuenta...</>
            : <>{step === 3 ? '🚀 Crear mi cuenta' : 'Siguiente'}{step < 3 && <ArrowRight size={14} />}</>
          }
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: '#1E3A5F' }}>
        ¿Ya tienes cuenta?{' '}
        <a href="/login" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 700 }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
          Inicia sesión
        </a>
      </p>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register } = useAuth();
  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [animKey,     setAnimKey]     = useState(0);
  const [mounted,     setMounted]     = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    tenantName: '', tenantSlug: '', industry: '',
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '',
    country: 'CR', currency: 'CRC', locale: 'es-CR',
    plan: 'growth', acceptTerms: false,
  });

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  // Leer params de URL para preseleccionar plan y método de pago
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const planParam   = p.get('plan');
    const methodParam = p.get('method');
    const billingParam = p.get('billing');
    if (planParam) set('plan', planParam);
    if (methodParam) set('paymentMethod', methodParam);
    if (billingParam) set('billing', billingParam);
  }, []);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  const handleCountryChange = (code: string) => {
    const c = COUNTRIES.find(x => x.code === code);
    if (c) setForm(p => ({ ...p, country: code, currency: c.currency, locale: c.locale }));
  };

  const validate = () => {
    setError('');
    if (step === 1) {
      if (!form.tenantName.trim())                       return setError('El nombre del negocio es requerido'),    false;
      if (!form.tenantSlug.trim())                       return setError('El ID del negocio es requerido'),        false;
      if (!/^[a-z0-9-]+$/.test(form.tenantSlug))        return setError('El ID solo puede tener letras, números y guiones'), false;
      if (!form.industry)                                return setError('Selecciona el tipo de negocio'),         false;
    }
    if (step === 2) {
      if (!form.firstName.trim() || !form.lastName.trim()) return setError('Nombre y apellido son requeridos'),   false;
      if (!form.email.includes('@'))                     return setError('Correo inválido'),                      false;
      if (form.password.length < 8)                      return setError('Contraseña mínimo 8 caracteres'),       false;
      if (form.password !== form.confirmPassword)        return setError('Las contraseñas no coinciden'),         false;
    }
    if (step === 3 && !form.acceptTerms) return setError('Acepta los términos para continuar'), false;
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < 3) { setStep(s => s + 1); setAnimKey(k => k + 1); }
    else handleSubmit();
  };

  const handlePrev = () => { setStep(s => s - 1); setAnimKey(k => k + 1); setError(''); };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await register({ tenantName: form.tenantName, tenantSlug: form.tenantSlug, industry: form.industry, country: form.country, currency: form.currency, locale: form.locale, email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al crear la cuenta');
    } finally { setLoading(false); }
  };

  const strength       = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length;
  const strengthColors = ['', '#E05050', '#F0A030', '#5AAAF0', '#3DBF7F'];
  const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte ✓'];

  const formCardProps = { step, animKey, form, error, loading, showPass, showConfirm, strength, strengthColors, strengthLabels, handleNext, handlePrev, set, handleCountryChange, setShowPass, setShowConfirm };

  const FEATURES = [
    { icon: Zap,      color: '#FF5C35', label: 'POS adaptativo'     },
    { icon: Package,  color: '#3DBF7F', label: 'Multi-industria'    },
    { icon: BarChart2,color: '#5AAAF0', label: 'Analytics avanzado' },
    { icon: Users,    color: '#F0A030', label: '14 días gratis'      },
  ];

  // SUCCESS
  if (success) {
    const ind = INDUSTRIES.find(i => i.value === form.industry);
    return (
      <div style={{ minHeight: '100vh', background: '#060D16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Outfit, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <BackgroundCanvas />
        <div style={{ textAlign: 'center', maxWidth: '440px', position: 'relative', zIndex: 1, animation: 'fadeUp .6s ease' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '22px', background: 'rgba(61,191,127,.1)', border: '1px solid rgba(61,191,127,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(61,191,127,.15)' }}>
            <Check size={36} color="#3DBF7F" />
          </div>
          <h1 style={{ fontSize: 'clamp(24px,5vw,36px)', fontWeight: 800, color: '#F0F4FF', marginBottom: '10px', letterSpacing: '-.02em' }}>¡Bienvenido a DaxCloud!</h1>
          <p style={{ fontSize: '14px', color: '#3A6A9A', marginBottom: '6px', lineHeight: 1.7 }}>
            Tu cuenta de <strong style={{ color: '#F0F4FF' }}>{form.tenantName}</strong> está lista.
          </p>
          {ind && <p style={{ fontSize: '13px', color: '#2A5280', marginBottom: '6px' }}>{ind.emoji} {ind.label}</p>}
          <p style={{ fontSize: '12px', color: '#1E3A5F', marginBottom: '32px' }}>
            Inicia sesión con el ID <strong style={{ color: '#FF5C35' }}>{form.tenantSlug}</strong>
          </p>
          <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 36px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 24px rgba(255,92,53,.4)', transition: 'all .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,92,53,.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(255,92,53,.4)'; }}>
            Iniciar sesión <ArrowRight size={15} />
          </a>
        </div>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // MOBILE
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#060D16', display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif', position: 'relative', overflow: 'hidden' }}>
        <BackgroundCanvas />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '48px 24px 20px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(12px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CloudLogo size={32} />
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax<span style={{ fontWeight: 300, color: '#FF5C35' }}>cloud</span></span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px,6vw,30px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-.02em' }}>
              El POS que crece<br />con tu <span style={{ color: '#FF5C35' }}>negocio</span>
            </h1>
            <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
              {[{ target: 15, suffix: '+', label: 'Negocios' }, { target: 18, suffix: '', label: 'Países' }].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#FF5C35' }}><AnimatedCounter target={s.target} suffix={s.suffix} /></p>
                  <p style={{ fontSize: '9px', color: '#2A5280', letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <FormCard {...formCardProps} />
        </div>
        <STYLES_EL />
      </div>
    );
  }

  // DESKTOP
  return (
    <div style={{ minHeight: '100vh', background: '#060D16', display: 'flex', position: 'relative', fontFamily: 'Outfit, sans-serif', overflow: 'hidden' }}>
      <BackgroundCanvas />

      {/* Panel izquierdo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'clamp(40px,6vw,72px)', position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: 'all .8s cubic-bezier(.22,1,.36,1)' }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '56px' }}>
            <CloudLogo size={42} />
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax<span style={{ fontWeight: 300, color: '#FF5C35' }}>cloud</span></span>
          </div>

          {/* Headline */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(255,92,53,.08)', border: '1px solid rgba(255,92,53,.2)', borderRadius: '20px', marginBottom: '24px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5C35', boxShadow: '0 0 8px #FF5C35', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C35', letterSpacing: '.1em', textTransform: 'uppercase' }}>14 días gratis</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: '18px', letterSpacing: '-.03em' }}>
            El POS que crece<br />con tu{' '}
            <span style={{ background: 'linear-gradient(135deg,#FF5C35,#FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>negocio</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#3A6A9A', lineHeight: 1.8, marginBottom: '36px', maxWidth: '360px' }}>
            Gestiona ventas, inventario y sucursales desde un solo sistema. Multi-tenant, multi-moneda, para América Latina.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '44px' }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateX(-12px)', transition: `all .7s ${.2 + i * .08}s cubic-bezier(.22,1,.36,1)` }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={f.color} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#3A6A9A', fontWeight: 500 }}>{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '32px', paddingTop: '28px', borderTop: '1px solid rgba(30,58,95,0.4)' }}>
          {[{ target: 15, suffix: '+', label: 'Negocios activos' }, { target: 42, suffix: 'k+', label: 'Ventas procesadas' }, { target: 18, suffix: '', label: 'Países' }].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#FF5C35', lineHeight: 1 }}><AnimatedCounter target={s.target} suffix={s.suffix} /></p>
              <p style={{ fontSize: '9px', color: '#1E3A5F', marginTop: '4px', letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <span style={{ fontSize: '11px', color: '#162235', marginTop: '24px' }}>
          by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 700 }}>jacana-dev.com</a>
        </span>
      </div>

      {/* Panel derecho */}
      <div style={{ width: 'clamp(400px,46vw,560px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px', position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: 'all .7s .1s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ width: '100%' }}>
          <FormCard {...formCardProps} />
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#0D1520', letterSpacing: '.04em' }}>
            © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
          </p>
        </div>
      </div>

      <STYLES_EL />
    </div>
  );
}

function STYLES_EL() {
  return (
    <style>{`
      @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes industryIn{ from{opacity:0;transform:scale(.93) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes shimmer   { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
      @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
      @keyframes spin      { to{transform:rotate(360deg)} }
      @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
      select option { background:#0A121E; color:#F0F4FF; }
      input:-webkit-autofill,input:-webkit-autofill:focus{
        -webkit-box-shadow:0 0 0 100px rgba(10,18,30,.98) inset!important;
        -webkit-text-fill-color:#F0F4FF!important;caret-color:#F0F4FF;
      }
    `}</style>
  );
}



