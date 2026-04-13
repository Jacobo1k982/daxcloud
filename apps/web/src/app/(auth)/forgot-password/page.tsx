'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Check, ChevronLeft, Eye, EyeOff, ArrowRight, Mail, Building2, Lock, KeyRound } from 'lucide-react';

type Step = 'request' | 'verify' | 'reset' | 'success';

// ── Canvas animado ────────────────────────────────────────────────────────────
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
      animId = requestAnimationFrame(animate); t += 0.004;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(30,58,95,0.2)'; ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      orb(W * 0.2 + Math.sin(t * 0.6) * 80, H * 0.3 + Math.cos(t * 0.4) * 50, W * 0.4, '255,92,53',   0.05);
      orb(W * 0.8 + Math.cos(t * 0.5) * 60, H * 0.7 + Math.sin(t * 0.7) * 40, W * 0.35, '90,170,240',  0.04);
      orb(W * 0.5 + Math.sin(t * 0.3) * 40, H * 0.5 + Math.cos(t * 0.9) * 60, W * 0.3,  '167,139,250', 0.03);
    };
    resize(); window.addEventListener('resize', resize); animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function CloudLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="fpLogo" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8C00" /><stop offset="45%" stopColor="#FF5C35" /><stop offset="100%" stopColor="#00C8D4" />
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z"
        fill="none" stroke="url(#fpLogo)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── OTP Input ─────────────────────────────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) { const n = [...value]; n[i] = ''; onChange(n); }
      else if (i > 0) refs[i - 1].current?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) refs[i - 1].current?.focus();
    else if (e.key === 'ArrowRight' && i < 5) refs[i + 1].current?.focus();
  };
  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const n = [...value]; n[i] = d; onChange(n);
    if (d && i < 5) refs[i + 1].current?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const n = Array(6).fill(''); digits.forEach((d, i) => { if (i < 6) n[i] = d; });
    onChange(n); refs[Math.min(digits.length, 5)].current?.focus();
    e.preventDefault();
  };
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {value.map((v, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={v}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{ width: '46px', height: '56px', background: v ? 'rgba(255,92,53,.08)' : 'rgba(10,18,30,0.8)', border: `1.5px solid ${v ? '#FF5C35' : 'rgba(30,58,95,0.6)'}`, borderRadius: '12px', color: '#FF5C35', fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', textAlign: 'center', outline: 'none', transition: 'all .15s', boxShadow: v ? '0 0 0 3px rgba(255,92,53,.1)' : 'none', cursor: 'text' }}
          onFocus={e => { e.target.style.borderColor = '#FF5C35'; e.target.style.boxShadow = '0 0 0 3px rgba(255,92,53,.12)'; }}
          onBlur={e => { e.target.style.borderColor = v ? '#FF5C35' : 'rgba(30,58,95,0.6)'; e.target.style.boxShadow = v ? '0 0 0 3px rgba(255,92,53,.1)' : 'none'; }}
        />
      ))}
    </div>
  );
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

// ── Página ────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step, setStep]           = useState<Step>('request');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [animKey, setAnimKey]     = useState(0);

  const [form, setForm] = useState({ tenantSlug: '', email: '', code: Array(6).fill(''), newPassword: '', confirmPassword: '' });
  const f = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);
  useEffect(() => { if (resendTimer <= 0) return; const iv = setInterval(() => setResendTimer(t => t - 1), 1000); return () => clearInterval(iv); }, [resendTimer]);

  const goStep = (s: Step) => { setStep(s); setError(''); setAnimKey(k => k + 1); };

  const handleRequest = async () => {
    setError('');
    if (!form.tenantSlug.trim()) return setError('El ID de empresa es requerido');
    if (!form.email.includes('@')) return setError('Correo electrónico inválido');
    setLoading(true);
    try { await api.post('/auth/password-reset/request', { email: form.email, tenantSlug: form.tenantSlug }); goStep('verify'); setResendTimer(60); }
    catch (err: any) { setError(err.response?.data?.message ?? 'Error al enviar el código'); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError('');
    if (form.code.join('').length < 6) return setError('Ingresa los 6 dígitos');
    setLoading(true);
    try { await api.post('/auth/password-reset/verify', { email: form.email, tenantSlug: form.tenantSlug, code: form.code.join('') }); goStep('reset'); }
    catch (err: any) { setError(err.response?.data?.message ?? 'Código inválido o expirado'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try { await api.post('/auth/password-reset/request', { email: form.email, tenantSlug: form.tenantSlug }); setResendTimer(60); f('code', Array(6).fill('')); }
    catch { setError('Error al reenviar el código'); }
  };

  const handleReset = async () => {
    setError('');
    if (form.newPassword.length < 8) return setError('Mínimo 8 caracteres');
    if (form.newPassword !== form.confirmPassword) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try { await api.post('/auth/password-reset/confirm', { email: form.email, tenantSlug: form.tenantSlug, code: form.code.join(''), newPassword: form.newPassword }); goStep('success'); }
    catch (err: any) { setError(err.response?.data?.message ?? 'Error al restablecer la contraseña'); }
    finally { setLoading(false); }
  };

  const steps: Step[] = ['request', 'verify', 'reset', 'success'];
  const stepIdx = steps.indexOf(step);

  const strength = [form.newPassword.length >= 8, /[A-Z]/.test(form.newPassword), /[0-9]/.test(form.newPassword), /[^A-Za-z0-9]/.test(form.newPassword)].filter(Boolean).length;
  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte ✓'];
  const strengthColor = ['', '#E05050', '#F0A030', '#5AAAF0', '#3DBF7F'];

  const STEP_INFO: Record<Step, { title: string; desc: string; icon: any }> = {
    request: { title: 'Recuperar contraseña', desc: 'Ingresa tu ID de empresa y correo registrado', icon: Mail },
    verify:  { title: 'Verifica tu identidad', desc: `Código enviado a ${form.email || 'tu correo'}`, icon: KeyRound },
    reset:   { title: 'Nueva contraseña',      desc: 'Elige una contraseña segura y única',          icon: Lock   },
    success: { title: '¡Listo!',               desc: 'Tu contraseña fue restablecida',               icon: Check  },
  };

  const info = STEP_INFO[step];
  const StepIcon = info.icon;

  return (
    <div style={{ minHeight: '100vh', background: '#060D16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Outfit, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <BackgroundCanvas />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: 'all .8s cubic-bezier(.22,1,.36,1)' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <a href="/login" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <CloudLogo size={34} />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax<span style={{ fontWeight: 300, color: '#FF5C35' }}>cloud</span></span>
          </a>
          <a href="/login" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#2A5280', textDecoration: 'none', padding: '7px 12px', borderRadius: '9px', border: '1px solid rgba(30,58,95,0.5)', background: 'rgba(10,18,30,0.4)', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7BBEE8'; (e.currentTarget as HTMLElement).style.borderColor = '#2A5280'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#2A5280'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,58,95,0.5)'; }}>
            <ChevronLeft size={13} /> Volver
          </a>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(10,18,30,0.88)', backdropFilter: 'blur(24px)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: '24px', padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.02) inset, 0 1px 0 rgba(255,255,255,.05) inset' }}>

          {/* Progress */}
          {step !== 'success' && (
            <div style={{ display: 'flex', gap: '5px', marginBottom: '32px' }}>
              {['request','verify','reset'].map((s, i) => {
                const done    = i < stepIdx;
                const current = i === stepIdx;
                return (
                  <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: done ? '#3DBF7F' : current ? '#FF5C35' : 'rgba(30,58,95,0.4)', transition: 'background .4s', position: 'relative', overflow: 'hidden' }}>
                    {current && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)', animation: 'shimmer 1.5s infinite' }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '28px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: step === 'success' ? 'rgba(61,191,127,.1)' : 'rgba(255,92,53,.1)', border: `1px solid ${step === 'success' ? 'rgba(61,191,127,.25)' : 'rgba(255,92,53,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: step === 'success' ? '0 0 20px rgba(61,191,127,.1)' : '0 0 20px rgba(255,92,53,.1)' }}>
              <StepIcon size={20} color={step === 'success' ? '#3DBF7F' : '#FF5C35'} />
            </div>
            <div>
              {step !== 'success' && (
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35', marginBottom: '4px' }}>
                  Paso {stepIdx + 1} de 3
                </p>
              )}
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F4FF', lineHeight: 1.15, letterSpacing: '-.02em', marginBottom: '4px' }}>{info.title}</h1>
              <p style={{ fontSize: '13px', color: '#2A5280', lineHeight: 1.5 }}>{info.desc}</p>
            </div>
          </div>

          {/* Contenido */}
          <div key={animKey} style={{ animation: 'fadeUp .3s ease', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* SUCCESS */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(61,191,127,.1)', border: '1px solid rgba(61,191,127,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(61,191,127,.12)' }}>
                  <Check size={32} color="#3DBF7F" />
                </div>
                <p style={{ fontSize: '14px', color: '#3A6A9A', lineHeight: 1.7, marginBottom: '28px' }}>
                  Tu contraseña fue restablecida. Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
                <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 32px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 20px rgba(255,92,53,.35)', transition: 'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(255,92,53,.45)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(255,92,53,.35)'; }}>
                  Iniciar sesión <ArrowRight size={15} />
                </a>
              </div>
            )}

            {/* REQUEST */}
            {step === 'request' && (
              <>
                <Field label="ID de empresa" value={form.tenantSlug} onChange={v => f('tenantSlug', v.toLowerCase().replace(/\s/g, '-'))} placeholder="mi-negocio" autoComplete="organization" icon={Building2} />
                <Field label="Correo electrónico" type="email" value={form.email} onChange={v => f('email', v)} placeholder="admin@empresa.com" autoComplete="email" icon={Mail} />
                <div style={{ padding: '12px 14px', background: 'rgba(30,58,95,0.2)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#3A6A9A', lineHeight: 1.6 }}>Recibirás un código de 6 dígitos válido por 15 minutos.</p>
                </div>
              </>
            )}

            {/* VERIFY */}
            {step === 'verify' && (
              <>
                <div style={{ padding: '14px', background: 'rgba(30,58,95,0.2)', border: '1px solid rgba(30,58,95,0.4)', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#2A5280', marginBottom: '3px' }}>Código enviado a</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#7BBEE8' }}>{form.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2A5280', textAlign: 'center', marginBottom: '16px' }}>Ingresa el código de 6 dígitos</p>
                  <OTPInput value={form.code} onChange={v => f('code', v)} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#1E3A5F' }}>
                    ¿No recibiste el código?{' '}
                    <button onClick={handleResend} disabled={resendTimer > 0} style={{ background: 'none', border: 'none', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', color: resendTimer > 0 ? '#1E3A5F' : '#FF5C35', fontWeight: 600, fontSize: '12px', fontFamily: 'Outfit, sans-serif', padding: 0, transition: 'color .15s' }}>
                      {resendTimer > 0 ? `Reenviar (${resendTimer}s)` : 'Reenviar'}
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* RESET */}
            {step === 'reset' && (
              <>
                <div>
                  <Field label="Nueva contraseña" type={showPass ? 'text' : 'password'} value={form.newPassword} onChange={v => f('newPassword', v)} placeholder="••••••••" icon={Lock}
                    suffix={<button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A5280', display: 'flex', padding: '2px', transition: 'color .15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')} onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
                  />
                  {form.newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength ? strengthColor[strength] : 'rgba(30,58,95,0.4)', transition: 'background .3s' }} />)}
                      </div>
                      <p style={{ fontSize: '10px', color: strengthColor[strength], fontWeight: 600 }}>{strengthLabel[strength]}</p>
                    </div>
                  )}
                </div>
                <Field label="Confirmar contraseña" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={v => f('confirmPassword', v)} placeholder="••••••••" icon={Lock}
                  suffix={<button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A5280', display: 'flex', padding: '2px', transition: 'color .15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')} onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>{showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
                />
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <p style={{ fontSize: '11px', color: '#E05050', marginTop: '-8px' }}>⚠ Las contraseñas no coinciden</p>
                )}
                {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length >= 8 && (
                  <p style={{ fontSize: '11px', color: '#3DBF7F', marginTop: '-8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={10} /> Contraseñas coinciden</p>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,.08)', border: '1px solid rgba(224,80,80,.25)', borderRadius: '10px', animation: 'shake .3s ease' }}>
                <p style={{ fontSize: '12px', color: '#E05050' }}>⚠️ {error}</p>
              </div>
            )}

            {/* Botón acción */}
            {step !== 'success' && (
              <button
                onClick={step === 'request' ? handleRequest : step === 'verify' ? handleVerify : handleReset}
                disabled={loading}
                style={{ width: '100%', padding: '15px', background: loading ? 'rgba(30,58,95,0.5)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: loading ? '#3A6A9A' : '#fff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 700, fontFamily: 'Outfit, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', boxShadow: loading ? 'none' : '0 4px 24px rgba(255,92,53,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '.01em' }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(255,92,53,.45)'; } }}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(255,92,53,.35)'; } }}>
                {loading
                  ? <><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(30,58,95,.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Procesando...</>
                  : <>{step === 'request' ? 'Enviar código' : step === 'verify' ? 'Verificar código' : 'Restablecer contraseña'} <ArrowRight size={15} /></>
                }
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#0D1520' }}>
          © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
        </p>
      </div>

      <style>{`
        @keyframes shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        input:-webkit-autofill,input:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 100px rgba(10,18,30,.98) inset!important;
          -webkit-text-fill-color:#F0F4FF!important;caret-color:#F0F4FF;
        }
      `}</style>
    </div>
  );
}
