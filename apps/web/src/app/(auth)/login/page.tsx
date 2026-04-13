'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowRight, Zap, Shield, Globe, BarChart2 } from 'lucide-react';

// ── Canvas animado ────────────────────────────────────────────────────────────
function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };

    const orb = (cx: number, cy: number, r: number, rgb: string, a: number) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${rgb},${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.004;
      ctx.clearRect(0, 0, W, H);

      // Grid sutil
      ctx.strokeStyle = 'rgba(30,58,95,0.25)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Orbs animados
      orb(W * 0.15 + Math.sin(t * 0.7) * 60,  H * 0.3 + Math.cos(t * 0.5) * 40,  W * 0.35, '255,92,53',  0.06);
      orb(W * 0.8  + Math.cos(t * 0.6) * 50,  H * 0.7 + Math.sin(t * 0.4) * 60,  W * 0.3,  '90,170,240', 0.05);
      orb(W * 0.5  + Math.sin(t * 0.3) * 80,  H * 0.5 + Math.cos(t * 0.8) * 30,  W * 0.25, '167,139,250',0.04);

      // Línea horizontal luminosa
      const grad = ctx.createLinearGradient(0, H * 0.5, W, H * 0.5);
      grad.addColorStop(0, 'rgba(255,92,53,0)');
      grad.addColorStop(0.3 + Math.sin(t) * 0.1, 'rgba(255,92,53,0.08)');
      grad.addColorStop(1, 'rgba(90,170,240,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function CloudLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="loginLogo" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FF8C00" />
          <stop offset="45%"  stopColor="#FF5C35" />
          <stop offset="100%" stopColor="#00C8D4" />
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z"
        fill="none" stroke="url(#loginLogo)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Input elegante ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, autoComplete, suffix }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const hasVal = value.length > 0;
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: focused ? '#FF5C35' : '#2A5280', marginBottom: '7px', transition: 'color .2s' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: suffix ? '12px 42px 12px 16px' : '12px 16px',
            background: focused ? 'rgba(255,92,53,0.05)' : hasVal ? 'rgba(15,25,36,0.8)' : 'rgba(15,25,36,0.6)',
            border: `1.5px solid ${focused ? 'rgba(255,92,53,0.6)' : hasVal ? 'rgba(30,58,95,0.8)' : 'rgba(22,34,53,0.9)'}`,
            borderRadius: '12px', color: '#F0F4FF', fontSize: '13px',
            fontFamily: 'Outfit, sans-serif', outline: 'none',
            boxSizing: 'border-box',
            boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.1)' : 'none',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          }}
        />
        {suffix && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]       = useState({ tenantSlug: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantSlug || !form.email || !form.password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      await login(form.email, form.password, form.tenantSlug);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Credenciales inválidas');
    } finally { setLoading(false); }
  };

  const FEATURES = [
    { icon: Zap,      color: '#FF5C35', text: 'POS adaptativo por industria'     },
    { icon: Globe,    color: '#3DBF7F', text: 'Multi-sucursal en tiempo real'    },
    { icon: BarChart2,color: '#5AAAF0', text: 'Analytics y reportes avanzados'  },
    { icon: Shield,   color: '#A78BFA', text: 'Soporte para 18+ países'          },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#060D16', display: 'flex', fontFamily: 'Outfit, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <BackgroundCanvas />

      {/* ── PANEL IZQUIERDO desktop ── */}
      <div className="auth-left" style={{ flex: '0 0 52%', display: 'none', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 72px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(-12px)', transition: 'all .8s cubic-bezier(.22,1,.36,1)' }}>
          <CloudLogo size={40} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax</span>
            <span style={{ fontSize: '24px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.03em' }}>cloud</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition: 'all .9s .1s cubic-bezier(.22,1,.36,1)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(255,92,53,.08)', border: '1px solid rgba(255,92,53,.2)', borderRadius: '20px', marginBottom: '24px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5C35', boxShadow: '0 0 8px #FF5C35', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C35', letterSpacing: '.1em', textTransform: 'uppercase' }}>Sistema POS en vivo</span>
          </div>

          <h1 style={{ fontSize: 'clamp(36px,3.5vw,52px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: '20px' }}>
            Tu negocio,<br />
            <span style={{ background: 'linear-gradient(135deg,#FF5C35,#FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>en control</span><br />
            total.
          </h1>
          <p style={{ fontSize: '15px', color: '#2A5280', lineHeight: 1.8, maxWidth: '380px' }}>
            POS adaptativo, inventario en tiempo real y analytics para tomar mejores decisiones.
          </p>

          {/* Features */}
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateX(-12px)', transition: `all .7s ${.2 + i * .08}s cubic-bezier(.22,1,.36,1)` }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${f.color}15`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={f.color} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#3A6A9A', fontWeight: 500 }}>{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ opacity: mounted ? 1 : 0, transition: 'all .6s .5s cubic-bezier(.22,1,.36,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <div style={{ width: '16px', height: '1px', background: 'rgba(30,58,95,.8)' }} />
            <span style={{ fontSize: '11px', color: '#1E3A5F' }}>
              by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 700 }}>jacana-dev.com</a>
            </span>
          </div>
          <p style={{ fontSize: '10px', color: '#162235' }}>© {new Date().getFullYear()} DaxCloud · Todos los derechos reservados</p>
        </div>
      </div>

      {/* ── PANEL DERECHO — formulario ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        {/* Logo móvil */}
        <div className="auth-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', opacity: mounted ? 1 : 0, transition: 'all .6s cubic-bezier(.22,1,.36,1)' }}>
          <CloudLogo size={36} />
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax</span>
            <span style={{ fontSize: '20px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.03em' }}>cloud</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: '420px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition: 'all .8s .1s cubic-bezier(.22,1,.36,1)' }}>

          {/* Glassmorphism */}
          <div style={{ background: 'rgba(10,18,30,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: '24px', padding: '40px 36px', boxShadow: '0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.06) inset' }}>

            {/* Accent line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg,#FF5C35,#FF8C00)' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#FF5C35' }}>Acceso</span>
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F4FF', lineHeight: 1.15, marginBottom: '6px', letterSpacing: '-.02em' }}>
              Bienvenido
            </h1>
            <p style={{ fontSize: '13px', color: '#2A5280', marginBottom: '32px', lineHeight: 1.6 }}>
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="ID de empresa" value={form.tenantSlug} onChange={set('tenantSlug')} placeholder="mi-negocio" autoComplete="organization" />
              <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} placeholder="admin@empresa.com" autoComplete="email" />
              <div>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <a href="/forgot-password" style={{ fontSize: '11px', color: '#FF5C35', textDecoration: 'none', fontWeight: 600, opacity: .8, transition: 'opacity .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '.8')}>
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.25)', borderRadius: '10px', animation: 'shake .3s ease' }}>
                  <p style={{ fontSize: '12px', color: '#E05050', display: 'flex', alignItems: 'center', gap: '6px' }}>⚠️ {error}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', marginTop: '6px', background: loading ? 'rgba(30,58,95,0.5)' : 'linear-gradient(135deg,#FF5C35 0%,#FF3D1F 50%,#FF5C35 100%)', backgroundSize: '200% 100%', color: loading ? '#3A6A9A' : '#fff', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 700, fontFamily: 'Outfit, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '.02em', transition: 'all .2s', boxShadow: loading ? 'none' : '0 4px 24px rgba(255,92,53,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(255,92,53,0.45)'; } }}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(255,92,53,0.35)'; } }}>
                {loading
                  ? <><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #1E3A5F', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Ingresando...</>
                  : <>Ingresar <ArrowRight size={15} /></>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(30,58,95,0.5)' }} />
              <span style={{ fontSize: '11px', color: '#162235', whiteSpace: 'nowrap' }}>¿Nuevo en DaxCloud?</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(30,58,95,0.5)' }} />
            </div>

            <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '13px', background: 'transparent', border: '1px solid rgba(30,58,95,0.7)', borderRadius: '14px', fontSize: '13px', fontWeight: 600, color: '#4A7FAF', textDecoration: 'none', transition: 'all .18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2A5280'; (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,0.25)'; (e.currentTarget as HTMLElement).style.color = '#7BBEE8'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,58,95,0.7)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#4A7FAF'; }}>
              Crear cuenta gratis
            </a>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#0F1924', letterSpacing: '.04em' }}>
            © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @media(min-width:1024px){.auth-left{display:flex!important}.auth-mobile-logo{display:none!important}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input:-webkit-autofill,input:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 100px rgba(10,18,30,0.98) inset!important;
          -webkit-text-fill-color:#F0F4FF!important;
          caret-color:#F0F4FF;
        }
      `}</style>
    </div>
  );
}
