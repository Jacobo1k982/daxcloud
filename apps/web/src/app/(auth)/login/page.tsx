'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowRight, Zap, Globe, BarChart2, Shield } from 'lucide-react';

// ── Canvas ────────────────────────────────────────────────────────────────────
function AnimatedBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0, W = 0, H = 0;
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    const animate = () => {
      animId = requestAnimationFrame(animate); t += .003;
      ctx.clearRect(0, 0, W, H);
      // Grid sutil
      ctx.strokeStyle = 'rgba(0,200,212,0.04)'; ctx.lineWidth = .5;
      for (let x = 0; x < W; x += 52) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 52) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      // Orbs
      const orb = (cx: number, cy: number, r: number, rgba: string) => {
        const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0, rgba); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      };
      orb(W*.12+Math.sin(t*.7)*60, H*.25+Math.cos(t*.5)*40, W*.4, `rgba(0,200,212,${.06+.02*Math.sin(t)})`);
      orb(W*.85+Math.cos(t*.6)*50, H*.7+Math.sin(t*.4)*50,  W*.35,`rgba(14,165,233,${.05+.02*Math.cos(t*.8)})`);
      orb(W*.5+Math.sin(t*.3)*80,  H*.5+Math.cos(t*.9)*30,  W*.25,`rgba(0,200,212,${.025+.01*Math.sin(t*1.2)})`);
    };
    resize(); animate();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size*.75} viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="ll" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#00E5FF"/>
          <stop offset="45%" stopColor="#00C8D4"/>
          <stop offset="100%" stopColor="#0EA5E9"/>
        </linearGradient>
        <linearGradient id="ll2" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#00E5FF" stopOpacity=".5"/>
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity=".25"/>
        </linearGradient>
        <filter id="lglow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z"
        fill="none" stroke="url(#ll)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#lglow)"/>
      <line x1="32" y1="14" x2="32" y2="34" stroke="url(#ll2)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="25" x2="46" y2="25" stroke="url(#ll2)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 17L37 24L32 31L27 24Z" fill="none" stroke="url(#ll)" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="32" cy="24" r="1.8" fill="#00E5FF" filter="url(#lglow)"/>
    </svg>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, autoComplete, suffix }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color: focused ? '#00C8D4' : 'rgba(148,196,236,0.4)', marginBottom:'8px', transition:'color .2s', fontFamily:'Inter,Outfit,system-ui,sans-serif' }}>
        {label}
      </label>
      <div style={{ position:'relative' }}>
        <input
          type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width:'100%',
            padding: suffix ? '13px 44px 13px 18px' : '13px 18px',
            background: focused ? 'rgba(0,200,212,0.05)' : 'rgba(4,18,38,0.6)',
            border: `1px solid ${focused ? 'rgba(0,200,212,0.5)' : 'rgba(0,200,212,0.1)'}`,
            borderRadius:'12px', color:'#F0F8FF', fontSize:'14px',
            fontFamily:'Inter,Outfit,system-ui,sans-serif', outline:'none',
            boxSizing:'border-box' as const,
            boxShadow: focused ? '0 0 0 3px rgba(0,200,212,0.08)' : 'none',
            transition:'all .25s cubic-bezier(.4,0,.2,1)',
          }}
        />
        {suffix && <div style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)' }}>{suffix}</div>}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]       = useState({ tenantSlug:'', email:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

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
    { icon: Zap,      color: '#00C8D4', text: 'POS adaptativo por industria'    },
    { icon: Globe,    color: '#0EA5E9', text: 'Multi-sucursal en tiempo real'   },
    { icon: BarChart2,color: '#00C8D4', text: 'Analytics y reportes avanzados' },
    { icon: Shield,   color: '#0EA5E9', text: 'Soporte para 20+ países'         },
  ];

  const tr = (delay = 0) => ({
    opacity:    mounted ? 1 : 0,
    transform:  mounted ? 'none' : 'translateY(20px)',
    transition: `all .8s ${delay}s cubic-bezier(.22,1,.36,1)`,
  });

  return (
    <div style={{ minHeight:'100vh', background:'#020B18', display:'flex', fontFamily:'Inter,Outfit,system-ui,sans-serif', position:'relative', overflow:'hidden' }}>
      <AnimatedBg />

      {/* ── PANEL IZQUIERDO ── */}
      <div className="auth-left" style={{ flex:'0 0 52%', display:'none', flexDirection:'column', justifyContent:'space-between', padding:'56px 72px', position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', ...tr(0) }}>
          <Logo size={40} />
          <div>
            <span style={{ fontSize:'22px', fontWeight:700, color:'#fff', letterSpacing:'-.03em', fontFamily:'Inter,system-ui' }}>Dax</span>
            <span style={{ fontSize:'22px', fontWeight:300, color:'#00C8D4', letterSpacing:'-.03em', fontFamily:'Inter,system-ui' }}>cloud</span>
          </div>
        </div>

        {/* Headline */}
        <div style={tr(.1)}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'6px 14px', background:'rgba(0,200,212,.07)', border:'1px solid rgba(0,200,212,.18)', borderRadius:'20px', marginBottom:'28px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00C8D4', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:'11px', fontWeight:700, color:'#00C8D4', letterSpacing:'.1em', textTransform:'uppercase' as const }}>Sistema POS en vivo</span>
          </div>

          <h1 style={{ fontSize:'clamp(36px,3.5vw,54px)', fontWeight:800, color:'#fff', lineHeight:1.08, letterSpacing:'-.04em', marginBottom:'20px' }}>
            Tu negocio,<br/>
            <span style={{ background:'linear-gradient(135deg,#00C8D4,#0EA5E9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>en control</span><br/>
            total.
          </h1>
          <p style={{ fontSize:'15px', color:'rgba(148,196,236,0.45)', lineHeight:1.85, maxWidth:'380px' }}>
            POS adaptativo, inventario en tiempo real y analytics para tomar mejores decisiones.
          </p>

          <div style={{ marginTop:'44px', display:'flex', flexDirection:'column', gap:'14px' }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', ...tr(.2 + i * .08) }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'11px', background:`${f.color}0F`, border:`1px solid ${f.color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={15} color={f.color} />
                  </div>
                  <span style={{ fontSize:'13px', color:'rgba(148,196,236,0.5)', fontWeight:500 }}>{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ opacity: mounted ? 1 : 0, transition:'all .6s .5s ease' }}>
          <p style={{ fontSize:'11px', color:'rgba(0,200,212,0.2)' }}>
            by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color:'rgba(0,200,212,0.4)', textDecoration:'none', fontWeight:700 }}>jacana-dev.com</a>
          </p>
          <p style={{ fontSize:'10px', color:'rgba(0,200,212,0.12)', marginTop:'4px' }}>© {new Date().getFullYear()} DaxCloud</p>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative', zIndex:1 }}>

        {/* Logo móvil */}
        <div className="auth-mobile-logo" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'44px', ...tr(0) }}>
          <Logo size={36} />
          <div>
            <span style={{ fontSize:'20px', fontWeight:700, color:'#fff', letterSpacing:'-.03em' }}>Dax</span>
            <span style={{ fontSize:'20px', fontWeight:300, color:'#00C8D4', letterSpacing:'-.03em' }}>cloud</span>
          </div>
        </div>

        {/* Card glassmorphism */}
        <div style={{ width:'100%', maxWidth:'420px', ...tr(.1) }}>
          <div style={{
            background:'rgba(4,14,30,0.75)',
            backdropFilter:'blur(32px)',
            WebkitBackdropFilter:'blur(32px)',
            border:'1px solid rgba(0,200,212,0.12)',
            borderRadius:'24px',
            padding:'40px 36px',
            boxShadow:'0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(0,200,212,0.03)',
            position:'relative',
            overflow:'hidden',
          }}>
            {/* Glow sutil en la card */}
            <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', background:'radial-gradient(circle,rgba(0,200,212,0.06),transparent 70%)', pointerEvents:'none' }} />

            {/* Accent top */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' }}>
              <div style={{ height:'2px', width:'28px', borderRadius:'1px', background:'linear-gradient(90deg,#00C8D4,#0EA5E9)' }} />
              <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase' as const, color:'#00C8D4', opacity:.7 }}>Acceso</span>
            </div>

            <h1 style={{ fontSize:'26px', fontWeight:800, color:'#F0F8FF', lineHeight:1.1, marginBottom:'6px', letterSpacing:'-.03em' }}>Bienvenido</h1>
            <p style={{ fontSize:'13px', color:'rgba(148,196,236,0.4)', marginBottom:'32px', lineHeight:1.6 }}>Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
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
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(148,196,236,0.35)', display:'flex', padding:'2px', transition:'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#00C8D4')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,196,236,0.35)')}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'8px' }}>
                  <a href="/forgot-password" style={{ fontSize:'11px', color:'rgba(0,200,212,0.5)', textDecoration:'none', fontWeight:600, transition:'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#00C8D4')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,200,212,0.5)')}>
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              {error && (
                <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'10px', animation:'shake .3s ease' }}>
                  <p style={{ fontSize:'12px', color:'#E07070', display:'flex', alignItems:'center', gap:'6px' }}>⚠ {error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'15px', marginTop:'4px',
                background: loading ? 'rgba(0,200,212,0.08)' : 'linear-gradient(135deg,#00C8D4,#0EA5E9)',
                color: loading ? 'rgba(0,200,212,0.4)' : '#020B18',
                border:'none', borderRadius:'13px', fontSize:'14px', fontWeight:800,
                fontFamily:'Inter,Outfit,system-ui,sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing:'.01em', transition:'all .25s',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(0,200,212,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 8px 32px rgba(0,200,212,0.35)'; }}}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 4px 24px rgba(0,200,212,0.25)'; }}}>
                {loading
                  ? <><span style={{ width:'14px', height:'14px', borderRadius:'50%', border:'2px solid rgba(0,200,212,0.2)', borderTopColor:'rgba(0,200,212,0.6)', animation:'spin .7s linear infinite', display:'inline-block' }} /> Ingresando...</>
                  : <>Ingresar <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'24px 0' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(0,200,212,0.08)' }} />
              <span style={{ fontSize:'11px', color:'rgba(148,196,236,0.2)', whiteSpace:'nowrap' }}>¿Nuevo en DaxCloud?</span>
              <div style={{ flex:1, height:'1px', background:'rgba(0,200,212,0.08)' }} />
            </div>

            <a href="/register" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
              padding:'13px', background:'transparent',
              border:'1px solid rgba(0,200,212,0.1)', borderRadius:'13px',
              fontSize:'13px', fontWeight:600, color:'rgba(0,200,212,0.45)',
              textDecoration:'none', transition:'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(0,200,212,0.3)'; (e.currentTarget as HTMLElement).style.background='rgba(0,200,212,0.05)'; (e.currentTarget as HTMLElement).style.color='#00C8D4'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(0,200,212,0.1)'; (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(0,200,212,0.45)'; }}>
              Crear cuenta gratis
            </a>
          </div>

          <p style={{ textAlign:'center', marginTop:'20px', fontSize:'11px', color:'rgba(0,200,212,0.1)', letterSpacing:'.04em' }}>
            © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media(min-width:1024px){.auth-left{display:flex!important}.auth-mobile-logo{display:none!important}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.3)}}
        input:-webkit-autofill,input:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 100px rgba(4,14,30,0.98) inset!important;
          -webkit-text-fill-color:#F0F8FF!important;
          caret-color:#F0F8FF;
        }
        ::placeholder{color:rgba(148,196,236,0.2)!important}
      `}</style>
    </div>
  );
}
