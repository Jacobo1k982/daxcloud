'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { Check, ChevronLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';

type Step = 'request' | 'verify' | 'reset' | 'success';

// ── Canvas de fondo (mismo que login) ─────────────────
function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let W = 0, H = 0;

    function resize() {
      W = canvas!.offsetWidth; H = canvas!.offsetHeight;
      canvas!.width = W; canvas!.height = H;
    }

    function drawGrid() {
      ctx.strokeStyle = 'rgba(30,58,95,0.3)';
      ctx.lineWidth = 0.5;
      const s = 52;
      for (let x = 0; x < W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    function orb(cx: number, cy: number, r: number, rgb: string, a: number) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${rgb},${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    function animate() {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, W, H);
      t += 0.005;
      drawGrid();
      orb(W * 0.5,  H * 0.3,  W * 0.45, '255,92,53',  0.06 + 0.025 * Math.sin(t));
      orb(W * 0.1,  H * 0.8,  W * 0.3,  '30,58,95',   0.18 + 0.06 * Math.cos(t * 0.7));
      orb(W * 0.9,  H * 0.1,  W * 0.25, '90,170,240', 0.05 + 0.02 * Math.sin(t * 1.3));
    }

    resize(); animate();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Input flotante ────────────────────────────────────
function Field({
  label, type = 'text', value, onChange, placeholder, autoComplete, suffix, disabled,
}: {
  label: string; type?: string; value: string;
  onChange?: (v: string) => void; placeholder?: string;
  autoComplete?: string; suffix?: React.ReactNode; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        position: 'absolute', left: '14px',
        top: active ? '8px' : '50%',
        transform: active ? 'none' : 'translateY(-50%)',
        fontSize: active ? '9px' : '13px',
        fontWeight: active ? 700 : 400,
        letterSpacing: active ? '.1em' : '0',
        textTransform: active ? 'uppercase' : 'none',
        color: focused ? '#FF5C35' : active ? '#3A6A9A' : '#2A5280',
        transition: 'all .2s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none', zIndex: 1,
      }}>
        {label}
      </label>
      <input
        type={type} value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        placeholder={focused ? placeholder : ''}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: active ? '22px 44px 8px 14px' : '15px 44px 15px 14px',
          background: disabled ? 'rgba(15,25,36,0.4)' : focused ? 'rgba(15,25,36,0.9)' : 'rgba(15,25,36,0.6)',
          border: `1px solid ${focused ? '#FF5C35' : 'rgba(30,58,95,0.8)'}`,
          borderRadius: '12px',
          color: disabled ? '#2A5280' : '#F0F4FF',
          fontSize: '14px',
          fontFamily: 'Outfit, sans-serif',
          outline: 'none',
          transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.12), inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  );
}

// ── OTP Input ─────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...value]; next[i] = digit; onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    onChange(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {Array(6).fill(0).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: '44px', height: '52px',
            background: value[i] ? 'rgba(255,92,53,.1)' : 'rgba(15,25,36,0.6)',
            border: `1.5px solid ${value[i] ? '#FF5C35' : 'rgba(30,58,95,0.8)'}`,
            borderRadius: '10px',
            color: '#FF5C35', fontSize: '20px', fontWeight: 700,
            fontFamily: 'monospace', textAlign: 'center',
            outline: 'none',
            transition: 'all .15s cubic-bezier(.4,0,.2,1)',
            boxShadow: value[i] ? '0 0 0 3px rgba(255,92,53,.1)' : 'none',
            cursor: 'text',
          }}
          onFocus={e => { e.target.style.borderColor = '#FF5C35'; e.target.style.boxShadow = '0 0 0 3px rgba(255,92,53,.12)'; }}
          onBlur={e => { e.target.style.borderColor = value[i] ? '#FF5C35' : 'rgba(30,58,95,0.8)'; e.target.style.boxShadow = value[i] ? '0 0 0 3px rgba(255,92,53,.1)' : 'none'; }}
        />
      ))}
    </div>
  );
}

// ── Logo ──────────────────────────────────────────────
function CloudLogo() {
  return (
    <svg width="32" height="24" viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="fpLogo" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8C00"/>
          <stop offset="45%" stopColor="#FF5C35"/>
          <stop offset="100%" stopColor="#00C8D4"/>
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z" fill="none" stroke="url(#fpLogo)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Página ────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const [form, setForm] = useState({
    tenantSlug: '', email: '',
    code: Array(6).fill(''),
    newPassword: '', confirmPassword: '',
  });

  const f = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const iv = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(iv);
  }, [resendTimer]);

  const goStep = (s: Step) => { setStep(s); setError(''); setAnimKey(k => k + 1); };

  const handleRequest = async () => {
    setError('');
    if (!form.tenantSlug.trim()) return setError('El ID de empresa es requerido');
    if (!form.email.includes('@')) return setError('Correo electrónico inválido');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/request', { email: form.email, tenantSlug: form.tenantSlug });
      goStep('verify'); setResendTimer(60);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al enviar el código');
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError('');
    if (form.code.join('').length < 6) return setError('Ingresa los 6 dígitos');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/verify', { email: form.email, tenantSlug: form.tenantSlug, code: form.code.join('') });
      goStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Código inválido o expirado');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await api.post('/auth/password-reset/request', { email: form.email, tenantSlug: form.tenantSlug });
      setResendTimer(60); f('code', Array(6).fill(''));
    } catch { setError('Error al reenviar el código'); }
  };

  const handleReset = async () => {
    setError('');
    if (form.newPassword.length < 8) return setError('Mínimo 8 caracteres');
    if (form.newPassword !== form.confirmPassword) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { email: form.email, tenantSlug: form.tenantSlug, code: form.code.join(''), newPassword: form.newPassword });
      goStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al restablecer la contraseña');
    } finally { setLoading(false); }
  };

  const steps: Step[] = ['request', 'verify', 'reset', 'success'];
  const stepIdx = steps.indexOf(step);

  // Indicador de fortaleza
  const strength = [
    form.newPassword.length >= 8,
    /[A-Z]/.test(form.newPassword),
    /[0-9]/.test(form.newPassword),
    /[^A-Za-z0-9]/.test(form.newPassword),
  ].filter(Boolean).length;

  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte ✓'];
  const strengthColor = ['', '#E05050', '#F0A030', '#5AAAF0', '#3DBF7F'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080F1A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Outfit, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <BackgroundCanvas />

      <div style={{
        width: '100%', maxWidth: '420px',
        position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(20px)',
        transition: 'all .7s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* Logo + back */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <a href="/login" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <CloudLogo />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>Dax</span>
              <span style={{ fontSize: '18px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.02em' }}>cloud</span>
            </div>
          </a>
          <a href="/login" style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 600,
            color: '#2A5280', textDecoration: 'none',
            transition: 'color .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#4A7FAF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}
          >
            <ChevronLeft size={14} /> Volver
          </a>
        </div>

        {/* Glassmorphism card */}
        <div style={{
          background: 'rgba(22,34,53,0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(30,58,95,0.6)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>

          {/* Progress */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '28px' }}>
            {steps.map((s, i) => (
              <div key={s} style={{
                flex: 1, height: '3px', borderRadius: '2px',
                background: i < stepIdx ? '#3DBF7F' : i === stepIdx ? '#FF5C35' : 'rgba(30,58,95,0.5)',
                transition: 'background .4s ease',
                position: 'relative', overflow: 'hidden',
              }}>
                {i === stepIdx && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent)', animation: 'shimmer 1.5s infinite' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{
                width: '64px', height: '64px',
                borderRadius: '18px',
                background: 'rgba(61,191,127,.1)',
                border: '1px solid rgba(61,191,127,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 30px rgba(61,191,127,.12)',
              }}>
                <Check size={28} color="#3DBF7F" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F0F4FF', marginBottom: '10px', letterSpacing: '-.01em' }}>
                ¡Contraseña actualizada!
              </h2>
              <p style={{ fontSize: '13px', color: '#3A6A9A', lineHeight: 1.7, marginBottom: '28px' }}>
                Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.
              </p>
              <a href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                color: '#fff', borderRadius: '12px',
                textDecoration: 'none', fontSize: '14px', fontWeight: 700,
                boxShadow: '0 4px 16px rgba(255,92,53,.3)',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(255,92,53,.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(255,92,53,.3)'; }}
              >
                Iniciar sesión <ArrowRight size={14} />
              </a>
            </div>
          )}

          {/* ── STEPS 1-3 ── */}
          {step !== 'success' && (
            <>
              {/* Header */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ width: '20px', height: '2px', background: '#FF5C35', borderRadius: '1px' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35' }}>
                    Paso {stepIdx + 1} de 3
                  </span>
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#F0F4FF', marginBottom: '6px', letterSpacing: '-.01em' }}>
                  {step === 'request' ? 'Recuperar contraseña' : step === 'verify' ? 'Verificar identidad' : 'Nueva contraseña'}
                </h1>
                <p style={{ fontSize: '13px', color: '#2A5280', lineHeight: 1.6 }}>
                  {step === 'request' ? 'Ingresa tu ID de empresa y correo registrado' :
                   step === 'verify' ? `Código enviado a ${form.email}` :
                   'Elige una contraseña segura'}
                </p>
              </div>

              {/* Contenido animado */}
              <div key={animKey} style={{ animation: 'fadeUp .3s ease', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* ── REQUEST ── */}
                {step === 'request' && (
                  <>
                    <Field label="ID de empresa" value={form.tenantSlug} onChange={v => f('tenantSlug', v.toLowerCase().replace(/\s/g, '-'))} placeholder="demo-store" autoComplete="organization" />
                    <Field label="Correo electrónico" type="email" value={form.email} onChange={v => f('email', v)} placeholder="admin@empresa.com" autoComplete="email" />
                    <div style={{
                      padding: '12px 14px',
                      background: 'rgba(30,58,95,0.3)',
                      border: '1px solid rgba(30,58,95,0.5)',
                      borderRadius: '10px',
                    }}>
                      <p style={{ fontSize: '12px', color: '#3A6A9A', lineHeight: 1.6 }}>
                        Recibirás un código de 6 dígitos válido por 15 minutos.
                      </p>
                    </div>
                  </>
                )}

                {/* ── VERIFY ── */}
                {step === 'verify' && (
                  <>
                    <div style={{
                      padding: '14px',
                      background: 'rgba(30,58,95,0.3)',
                      border: '1px solid rgba(30,58,95,0.5)',
                      borderRadius: '12px',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '11px', color: '#2A5280', marginBottom: '3px' }}>Código enviado a</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#7BBEE8' }}>{form.email}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2A5280', textAlign: 'center', marginBottom: '14px' }}>
                        Ingresa el código de 6 dígitos
                      </p>
                      <OTPInput value={form.code} onChange={v => f('code', v)} />
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                      <p style={{ fontSize: '12px', color: '#1E3A5F' }}>
                        ¿No recibiste el código?{' '}
                        {resendTimer > 0 ? (
                          <span style={{ color: '#2A5280' }}>Reenviar en {resendTimer}s</span>
                        ) : (
                          <button onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5C35', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit, sans-serif', padding: 0, transition: 'opacity .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '.75')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                            Reenviar código
                          </button>
                        )}
                      </p>
                    </div>
                  </>
                )}

                {/* ── RESET ── */}
                {step === 'reset' && (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(61,191,127,.08)',
                      border: '1px solid rgba(61,191,127,.2)',
                      borderRadius: '10px',
                    }}>
                      <Check size={13} color="#3DBF7F" />
                      <p style={{ fontSize: '12px', color: '#3DBF7F', fontWeight: 600 }}>Identidad verificada correctamente</p>
                    </div>

                    <Field
                      label="Nueva contraseña"
                      type={showPass ? 'text' : 'password'}
                      value={form.newPassword}
                      onChange={v => f('newPassword', v)}
                      placeholder="Mínimo 8 caracteres"
                      suffix={
                        <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A5280', display: 'flex', transition: 'color .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />

                    {/* Indicador de fortaleza */}
                    {form.newPassword && (
                      <div>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength ? strengthColor[strength] : 'rgba(30,58,95,0.5)', transition: 'background .3s' }} />
                          ))}
                        </div>
                        <p style={{ fontSize: '11px', color: strengthColor[strength] }}>{strengthLabel[strength]}</p>
                      </div>
                    )}

                    <Field
                      label="Confirmar contraseña"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={v => f('confirmPassword', v)}
                      placeholder="••••••••"
                      suffix={
                        <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A5280', display: 'flex', transition: 'color .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />

                    {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                      <p style={{ fontSize: '11px', color: '#E05050', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        ⚠️ Las contraseñas no coinciden
                      </p>
                    )}
                    {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length >= 8 && (
                      <p style={{ fontSize: '11px', color: '#3DBF7F', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Check size={11} /> Contraseñas coinciden
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,.08)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '10px', marginTop: '14px', animation: 'shake .3s ease' }}>
                  <p style={{ fontSize: '12px', color: '#E05050' }}>⚠️ {error}</p>
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                {step !== 'request' && (
                  <button
                    onClick={() => goStep(step === 'verify' ? 'request' : 'verify')}
                    style={{
                      padding: '12px 14px',
                      background: 'transparent',
                      border: '1px solid rgba(30,58,95,0.8)',
                      borderRadius: '12px',
                      color: '#3A6A9A', fontSize: '13px',
                      fontFamily: 'Outfit, sans-serif',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2A5280'; (e.currentTarget as HTMLElement).style.color = '#4A7FAF'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,58,95,0.8)'; (e.currentTarget as HTMLElement).style.color = '#3A6A9A'; }}
                  >
                    <ChevronLeft size={14} /> Atrás
                  </button>
                )}
                <button
                  onClick={step === 'request' ? handleRequest : step === 'verify' ? handleVerify : handleReset}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '13px',
                    background: loading ? 'rgba(30,58,95,0.5)' : 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                    color: loading ? '#3A6A9A' : '#fff',
                    border: 'none', borderRadius: '12px',
                    fontSize: '14px', fontWeight: 700,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(255,92,53,.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    letterSpacing: '.01em',
                  }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(255,92,53,.35)'; }}}
                  onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(255,92,53,.25)'; }}}
                >
                  {loading ? (
                    <>
                      <span style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(30,58,95,0.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {step === 'request' ? 'Enviar código' : step === 'verify' ? 'Verificar código' : 'Restablecer contraseña'}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

              {step === 'request' && (
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#1E3A5F' }}>
                  ¿Recordaste tu contraseña?{' '}
                  <a href="/login" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 700 }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                    Iniciar sesión
                  </a>
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#162235', letterSpacing: '.04em' }}>
          © {new Date().getFullYear()} DaxCloud · by{' '}
          <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>
            jacana-dev.com
          </a>
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-4px); }
          75%      { transform: translateX(4px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px rgba(15,25,36,0.95) inset !important;
          -webkit-text-fill-color: #F0F4FF !important;
          caret-color: #F0F4FF;
        }
      `}</style>
    </div>
  );
}