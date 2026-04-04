'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

// ── Canvas de fondo ───────────────────────────────────
function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let W = 0, H = 0;

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width = W;
      canvas!.height = H;
    }

    function drawGrid() {
      ctx.strokeStyle = 'rgba(30,58,95,0.35)';
      ctx.lineWidth = 0.5;
      const spacing = 52;
      for (let x = 0; x < W; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    function drawOrb(cx: number, cy: number, r: number, color: string, alpha: number) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function animate() {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, W, H);
      t += 0.006;
      drawGrid();
      drawOrb(W * 0.15, H * 0.25, W * 0.4, 'rgb(255,92,53)', 0.07 + 0.03 * Math.sin(t));
      drawOrb(W * 0.85, H * 0.75, W * 0.35, 'rgb(30,58,95)', 0.18 + 0.06 * Math.cos(t * 0.8));
      drawOrb(W * 0.7,  H * 0.15, W * 0.25, 'rgb(90,170,240)', 0.06 + 0.02 * Math.sin(t * 1.2));
    }

    resize();
    animate();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  );
}

// ── Input flotante ────────────────────────────────────
function Field({
  label, type = 'text', value, onChange, placeholder, autoComplete, suffix,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <label style={{
        position: 'absolute',
        left: '14px',
        top: active ? '8px' : '50%',
        transform: active ? 'none' : 'translateY(-50%)',
        fontSize: active ? '9px' : '13px',
        fontWeight: active ? 700 : 400,
        letterSpacing: active ? '.1em' : '0',
        textTransform: active ? 'uppercase' : 'none',
        color: focused ? '#FF5C35' : active ? '#3A6A9A' : '#2A5280',
        transition: 'all .2s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none',
        zIndex: 1,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        placeholder={focused ? placeholder : ''}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: active ? '22px 44px 8px 14px' : '15px 44px 15px 14px',
          background: focused ? 'rgba(15,25,36,0.9)' : 'rgba(15,25,36,0.6)',
          border: `1px solid ${focused ? '#FF5C35' : 'rgba(30,58,95,0.8)'}`,
          borderRadius: '12px',
          color: '#F0F4FF',
          fontSize: '14px',
          fontFamily: 'Outfit, sans-serif',
          outline: 'none',
          transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.12), inset 0 1px 0 rgba(255,255,255,0.04)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
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

// ── Logo inline ───────────────────────────────────────
function CloudLogo() {
  return (
    <svg width="36" height="28" viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FF8C00"/>
          <stop offset="45%"  stopColor="#FF5C35"/>
          <stop offset="100%" stopColor="#00C8D4"/>
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z" fill="none" stroke="url(#lg)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Página ────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ tenantSlug: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantSlug || !form.email || !form.password) {
      setError('Completa todos los campos'); return;
    }
    setLoading(true); setError('');
    try {
      await login(form.email, form.password, form.tenantSlug);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080F1A',
      display: 'flex',
      fontFamily: 'Outfit, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <BackgroundCanvas />

      {/* ══ PANEL IZQUIERDO — desktop ════════════════════ */}
      <div style={{
        flex: '0 0 50%',
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 72px',
        position: 'relative',
        zIndex: 1,
      }} className="login-left">

        {/* Logo + nombre */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '64px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(-10px)',
          transition: 'all .7s cubic-bezier(.22,1,.36,1)',
        }}>
          <CloudLogo />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>Dax</span>
            <span style={{ fontSize: '22px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.02em' }}>cloud</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(16px)',
          transition: 'all .8s .1s cubic-bezier(.22,1,.36,1)',
        }}>
          <h1 style={{
            fontSize: 'clamp(32px,3.5vw,48px)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: '-.02em',
            marginBottom: '20px',
          }}>
            Tu negocio,<br />
            <span style={{ color: '#FF5C35' }}>en control</span><br />
            total.
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#3A6A9A',
            lineHeight: 1.75,
            maxWidth: '360px',
          }}>
            POS adaptativo, inventario en tiempo real y analytics para tomar mejores decisiones.
          </p>
        </div>

        {/* Features */}
        <div style={{
          marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '12px',
          opacity: mounted ? 1 : 0,
          transition: 'all .8s .25s cubic-bezier(.22,1,.36,1)',
        }}>
          {[
            { dot: '#FF5C35', text: 'POS adaptativo por industria' },
            { dot: '#3DBF7F', text: 'Multi-sucursal en tiempo real' },
            { dot: '#5AAAF0', text: 'Analytics y reportes avanzados' },
            { dot: '#A78BFA', text: 'Soporte para 18+ países' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: f.dot, boxShadow: `0 0 6px ${f.dot}80`, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#4A7FAF' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '72px',
          display: 'flex', alignItems: 'center', gap: '16px',
          opacity: mounted ? 1 : 0,
          transition: 'all .6s .4s cubic-bezier(.22,1,.36,1)',
        }}>
          <span style={{ fontSize: '11px', color: '#1E3A5F' }}>
            by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>jacana-dev.com</a>
          </span>
          <span style={{ fontSize: '11px', color: '#162235' }}>v1.0</span>
        </div>
      </div>

      {/* ══ PANEL DERECHO — formulario ═══════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo móvil */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '44px',
          opacity: mounted ? 1 : 0,
          transition: 'all .6s cubic-bezier(.22,1,.36,1)',
        }} className="login-mobile-logo">
          <CloudLogo />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>Dax</span>
            <span style={{ fontSize: '20px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.02em' }}>cloud</span>
          </div>
        </div>

        {/* Card del formulario */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(20px)',
          transition: 'all .7s .1s cubic-bezier(.22,1,.36,1)',
        }}>

          {/* Glassmorphism card */}
          <div style={{
            background: 'rgba(22,34,53,0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(30,58,95,0.6)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>

            {/* Heading */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <div style={{ width: '20px', height: '2px', background: '#FF5C35', borderRadius: '1px' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#FF5C35' }}>
                  Acceso
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#F0F4FF', lineHeight: 1.2, marginBottom: '6px', letterSpacing: '-.01em' }}>
                Bienvenido
              </h1>
              <p style={{ fontSize: '13px', color: '#2A5280', lineHeight: 1.6 }}>
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'none' : 'translateX(-8px)',
                transition: 'all .5s .2s cubic-bezier(.22,1,.36,1)',
              }}>
                <Field label="ID de empresa" value={form.tenantSlug} onChange={set('tenantSlug')} placeholder="demo-store" autoComplete="organization" />
              </div>

              <div style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'none' : 'translateX(-8px)',
                transition: 'all .5s .28s cubic-bezier(.22,1,.36,1)',
              }}>
                <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} placeholder="admin@empresa.com" autoComplete="email" />
              </div>

              <div style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'none' : 'translateX(-8px)',
                transition: 'all .5s .36s cubic-bezier(.22,1,.36,1)',
              }}>
                <Field
                  label="Contraseña"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  suffix={
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A5280', display: 'flex', padding: '2px', transition: 'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <a href="/forgot-password" style={{ fontSize: '11px', color: '#FF5C35', textDecoration: 'none', fontWeight: 600, opacity: .75, transition: 'opacity .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '.75')}>
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(224,80,80,0.08)',
                  border: '1px solid rgba(224,80,80,0.2)',
                  borderRadius: '10px',
                  animation: 'shake .3s ease',
                }}>
                  <p style={{ fontSize: '12px', color: '#E05050', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠️ {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '6px',
                  background: loading
                    ? 'rgba(30,58,95,0.6)'
                    : 'linear-gradient(135deg, #FF5C35 0%, #FF3D1F 100%)',
                  color: loading ? '#3A6A9A' : '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Outfit, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '.02em',
                  transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(255,92,53,0.30)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(255,92,53,0.40)';
                  }
                }}
                onMouseLeave={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(255,92,53,0.30)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #1E3A5F', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(30,58,95,0.6)' }} />
              <span style={{ fontSize: '11px', color: '#1E3A5F', whiteSpace: 'nowrap' }}>¿Nuevo en DaxCloud?</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(30,58,95,0.6)' }} />
            </div>

            {/* Register link */}
            <a href="/register" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '11px',
              background: 'transparent',
              border: '1px solid rgba(30,58,95,0.8)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#4A7FAF',
              textDecoration: 'none',
              transition: 'all .18s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2A5280';
                (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,0.3)';
                (e.currentTarget as HTMLElement).style.color = '#7BBEE8';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,58,95,0.8)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#4A7FAF';
              }}
            >
              Crear cuenta gratis
            </a>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#162235', letterSpacing: '.04em' }}>
            © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @media(min-width: 1024px) {
          .login-left        { display: flex !important; }
          .login-mobile-logo { display: none  !important; }
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