'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

// ── Canvas fondo animado ──────────────────────────────────────────────────────
function AnimatedBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let id: number, t = 0, W = 0, H = 0;
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    const animate = () => {
      id = requestAnimationFrame(animate); t += .003;
      ctx.clearRect(0, 0, W, H);
      const orb = (cx: number, cy: number, r: number, c: string) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, c); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      };
      orb(W * .15 + Math.sin(t * .7) * 80, H * .25 + Math.cos(t * .5) * 60, W * .45, `rgba(255,92,53,${.07 + .02 * Math.sin(t)})`);
      orb(W * .82 + Math.cos(t * .6) * 60, H * .72 + Math.sin(t * .4) * 70, W * .38, `rgba(30,80,160,${.08 + .02 * Math.cos(t * .8)})`);
      orb(W * .5  + Math.sin(t * .3) * 100, H * .5 + Math.cos(t * .9) * 40, W * .3,  `rgba(180,140,100,${.03 + .01 * Math.sin(t * 1.2)})`);
    };
    resize(); animate();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Visual izquierdo — Dashboard Daxcloud ─────────────────────────────────────
function DaxVisual() {
  return (
    <svg viewBox="0 0 580 680" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', maxHeight: '680px', position: 'relative', zIndex: 1 }}>
      <defs>
        {/* Gradientes metálicos */}
        <linearGradient id="metal1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#C8A882"/>
          <stop offset="30%"  stopColor="#E8D0A8"/>
          <stop offset="60%"  stopColor="#B8904A"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
        <linearGradient id="metal2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#FF5C35"/>
          <stop offset="50%"  stopColor="#FF8C6A"/>
          <stop offset="100%" stopColor="#FF5C35"/>
        </linearGradient>
        <linearGradient id="metal3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#1E4A8A"/>
          <stop offset="40%"  stopColor="#2E6AC0"/>
          <stop offset="100%" stopColor="#0F2850"/>
        </linearGradient>
        <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(20,36,60,0.95)"/>
          <stop offset="100%" stopColor="rgba(10,18,36,0.98)"/>
        </linearGradient>
        <linearGradient id="barCoral" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#FF3D1F"/>
          <stop offset="100%" stopColor="#FF8C6A"/>
        </linearGradient>
        <linearGradient id="barBlue" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#1E4A8A"/>
          <stop offset="100%" stopColor="#5AAAF0"/>
        </linearGradient>
        <linearGradient id="barGold" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#8B6914"/>
          <stop offset="100%" stopColor="#E8D0A8"/>
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#FF5C35" stopOpacity="0"/>
          <stop offset="30%"  stopColor="#FF5C35"/>
          <stop offset="70%"  stopColor="#5AAAF0"/>
          <stop offset="100%" stopColor="#5AAAF0" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="glowLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#C8A882" stopOpacity="0"/>
          <stop offset="50%"  stopColor="#E8D0A8"/>
          <stop offset="100%" stopColor="#C8A882" stopOpacity="0"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="softglow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="metalglow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* ── TARJETA PRINCIPAL ── */}
      <rect x="40" y="60" width="500" height="560" rx="24" fill="url(#cardBg)" stroke="url(#metal1)" strokeWidth="1"/>
      {/* Brillo superior metálico */}
      <rect x="40" y="60" width="500" height="1.5" rx="1" fill="url(#glowLine)" opacity="0.8"/>
      {/* Acento lateral izquierdo */}
      <rect x="40" y="80" width="3" height="120" rx="1.5" fill="url(#metal2)" filter="url(#softglow)"/>

      {/* ── HEADER TARJETA ── */}
      {/* Logo */}
      <path d="M72 118Q62 118 62 110Q62 102 70 101Q71 94 78 93Q82 87 88 88Q94 85 97 91Q102 91 104 97Q108 98 107 105Q107 112 101 112Z"
        fill="none" stroke="url(#metal1)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" filter="url(#softglow)"/>
      <line x1="84" y1="93" x2="84" y2="111" stroke="rgba(200,168,130,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="75" y1="102" x2="93" y2="102" stroke="rgba(200,168,130,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="84" cy="102" r="1.5" fill="#E8D0A8" filter="url(#softglow)"/>
      <text x="116" y="105" fontFamily="Inter,system-ui" fontSize="18" fontWeight="800" fill="#fff" letterSpacing="-0.6">Dax</text>
      <text x="148" y="105" fontFamily="Inter,system-ui" fontSize="18" fontWeight="300" fill="url(#metal2)" letterSpacing="-0.4">cloud</text>
      <text x="72" y="125" fontFamily="Inter,system-ui" fontSize="9" fontWeight="500" fill="rgba(200,168,130,0.5)" letterSpacing="0.15em">SISTEMA POS EMPRESARIAL</text>

      {/* Línea separadora metálica */}
      <line x1="60" y1="138" x2="520" y2="138" stroke="url(#glowLine)" strokeWidth="0.6" opacity="0.5"/>

      {/* ── KPI ROW ── */}
      {/* KPI 1 — Ventas */}
      <rect x="60" y="152" width="140" height="76" rx="12" fill="rgba(255,92,53,0.07)" stroke="rgba(255,92,53,0.2)" strokeWidth="0.8"/>
      <rect x="60" y="152" width="140" height="2" rx="1" fill="url(#metal2)" opacity="0.6"/>
      <text x="74" y="173" fontFamily="Inter,system-ui" fontSize="9" fontWeight="600" fill="rgba(255,92,53,0.6)" letterSpacing="0.1em">VENTAS HOY</text>
      <text x="74" y="196" fontFamily="Inter,system-ui" fontSize="22" fontWeight="800" fill="#fff" letterSpacing="-0.8">₡84,200</text>
      <text x="74" y="213" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(61,191,127,0.8)" fontWeight="600">▲ +18.4%</text>

      {/* KPI 2 — Transacciones */}
      <rect x="214" y="152" width="130" height="76" rx="12" fill="rgba(30,74,138,0.1)" stroke="rgba(90,170,240,0.2)" strokeWidth="0.8"/>
      <rect x="214" y="152" width="130" height="2" rx="1" fill="url(#barBlue)" opacity="0.6"/>
      <text x="228" y="173" fontFamily="Inter,system-ui" fontSize="9" fontWeight="600" fill="rgba(90,170,240,0.6)" letterSpacing="0.1em">TRANSACCIONES</text>
      <text x="228" y="196" fontFamily="Inter,system-ui" fontSize="22" fontWeight="800" fill="#fff" letterSpacing="-0.8">247</text>
      <text x="228" y="213" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(61,191,127,0.8)" fontWeight="600">▲ +5.2%</text>

      {/* KPI 3 — Ticket */}
      <rect x="358" y="152" width="130" height="76" rx="12" fill="rgba(180,140,60,0.07)" stroke="rgba(200,168,130,0.2)" strokeWidth="0.8"/>
      <rect x="358" y="152" width="130" height="2" rx="1" fill="url(#metal1)" opacity="0.6"/>
      <text x="372" y="173" fontFamily="Inter,system-ui" fontSize="9" fontWeight="600" fill="rgba(200,168,130,0.6)" letterSpacing="0.1em">TICKET PROM.</text>
      <text x="372" y="196" fontFamily="Inter,system-ui" fontSize="22" fontWeight="800" fill="#fff" letterSpacing="-0.8">₡1,791</text>
      <text x="372" y="213" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(61,191,127,0.8)" fontWeight="600">▲ +2.8%</text>

      {/* ── GRÁFICA DE BARRAS ── */}
      <rect x="60" y="248" width="300" height="180" rx="14" fill="rgba(10,20,38,0.6)" stroke="rgba(200,168,130,0.12)" strokeWidth="0.8"/>
      <text x="76" y="270" fontFamily="Inter,system-ui" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.6)" letterSpacing="0.05em">Ingresos · Últimos 7 días</text>
      {/* Líneas guía */}
      {[295,320,345,370,395].map((y, i) => (
        <line key={i} x1="76" y1={y} x2="344" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
      ))}
      {/* Barras */}
      {[
        [82,  60, 'url(#barCoral)'],
        [114, 95, 'url(#barBlue)'],
        [146, 75, 'url(#barCoral)'],
        [178,115, 'url(#barBlue)'],
        [210, 88, 'url(#barGold)'],
        [242,130, 'url(#barCoral)'],
        [274,105, 'url(#barBlue)'],
      ].map(([x, h, fill], i) => (
        <rect key={i} x={x as number} y={405-(h as number)} width="22" height={h as number} rx="4" fill={fill as string} opacity="0.85"/>
      ))}
      {/* Etiquetas días */}
      {['L','M','X','J','V','S','D'].map((d, i) => (
        <text key={i} x={93 + i * 32} y="420" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="middle">{d}</text>
      ))}

      {/* ── PANEL DERECHO — Ventas recientes ── */}
      <rect x="372" y="248" width="148" height="180" rx="14" fill="rgba(10,20,38,0.6)" stroke="rgba(200,168,130,0.12)" strokeWidth="0.8"/>
      <text x="386" y="270" fontFamily="Inter,system-ui" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.6)" letterSpacing="0.05em">Ventas recientes</text>
      {/* Items */}
      {[
        ['Café + Croissant', '₡3,200', '#FF5C35'],
        ['Combo Almuerzo',   '₡5,800', '#5AAAF0'],
        ['Repostería x3',    '₡2,400', '#C8A882'],
        ['Jugo Natural',     '₡1,600', '#3DBF7F'],
        ['Sándwich + Café',  '₡4,100', '#FF5C35'],
      ].map(([name, amount, color], i) => (
        <g key={i}>
          <circle cx="390" cy={290 + i * 28} r="4" fill={color as string} opacity="0.8"/>
          <text x="400" y={294 + i * 28} fontFamily="Inter,system-ui" fontSize="9" fill="rgba(255,255,255,0.55)">{name as string}</text>
          <text x="505" y={294 + i * 28} fontFamily="Inter,system-ui" fontSize="9" fontWeight="700" fill={color as string} textAnchor="end">{amount as string}</text>
          <line x1="386" y1={304 + i * 28} x2="510" y2={304 + i * 28} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
        </g>
      ))}

      {/* ── FILA INFERIOR — Métricas adicionales ── */}
      {/* Mapa calor horas pico */}
      <rect x="60" y="442" width="210" height="90" rx="14" fill="rgba(10,20,38,0.6)" stroke="rgba(200,168,130,0.12)" strokeWidth="0.8"/>
      <text x="76" y="462" fontFamily="Inter,system-ui" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.6)" letterSpacing="0.05em">Horas pico</text>
      {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map((h, i) => {
        const intensity = [0,0,0,0,0,0,0.1,0.2,0.7,0.9,0.8,0.95,1,0.9,0.7,0.6,0.8,0.95,0.85,0.7,0.5,0.3,0.1,0][i];
        return (
          <rect key={i} x={76 + i * 8} y="474" width="7" height="32" rx="2"
            fill={intensity > 0 ? `rgba(255,92,53,${0.1 + intensity * 0.85})` : 'rgba(255,255,255,0.04)'}/>
        );
      })}
      {['0h','6h','12h','18h','23h'].map((l, i) => (
        <text key={i} x={76 + i * 46} y="518" fontFamily="Inter,system-ui" fontSize="8" fill="rgba(255,255,255,0.25)">{l}</text>
      ))}

      {/* Métodos de pago */}
      <rect x="284" y="442" width="236" height="90" rx="14" fill="rgba(10,20,38,0.6)" stroke="rgba(200,168,130,0.12)" strokeWidth="0.8"/>
      <text x="300" y="462" fontFamily="Inter,system-ui" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.6)" letterSpacing="0.05em">Métodos de pago</text>
      {[
        ['Efectivo',  '42%', '#C8A882', 42],
        ['SINPE',     '35%', '#5AAAF0', 35],
        ['Tarjeta',   '23%', '#FF5C35', 23],
      ].map(([label, pct, color, width], i) => (
        <g key={i}>
          <text x="300" y={482 + i * 22} fontFamily="Inter,system-ui" fontSize="9" fill="rgba(255,255,255,0.45)">{label as string}</text>
          <rect x="360" y={473 + i * 22} width="120" height="8" rx="4" fill="rgba(255,255,255,0.06)"/>
          <rect x="360" y={473 + i * 22} width={(width as number) * 1.2} height="8" rx="4" fill={color as string} opacity="0.75"/>
          <text x="490" y={482 + i * 22} fontFamily="Inter,system-ui" fontSize="9" fontWeight="700" fill={color as string}>{pct as string}</text>
        </g>
      ))}

      {/* ── LÍNEA DECORATIVA INFERIOR ── */}
      <line x1="60" y1="548" x2="520" y2="548" stroke="url(#glowLine)" strokeWidth="0.6" opacity="0.4"/>

      {/* ── NOTIFICACIONES FLOTANTES ── */}
      {/* Notif éxito */}
      <rect x="330" y="76" width="190" height="46" rx="10" fill="rgba(8,20,38,0.94)" stroke="rgba(61,191,127,0.3)" strokeWidth="0.8" filter="url(#softglow)"/>
      <circle cx="350" cy="99" r="8" fill="rgba(61,191,127,0.15)" stroke="rgba(61,191,127,0.4)" strokeWidth="0.8"/>
      <text x="346" y="103" fontFamily="Inter,system-ui" fontSize="10" fill="#3DBF7F" fontWeight="700">✓</text>
      <text x="366" y="93" fontFamily="Inter,system-ui" fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.7)">Venta procesada</text>
      <text x="366" y="107" fontFamily="Inter,system-ui" fontSize="11" fontWeight="800" fill="#3DBF7F">₡ 5,800</text>

      {/* Notif stock */}
      <rect x="60" y="560" width="200" height="46" rx="10" fill="rgba(8,20,38,0.94)" stroke="rgba(240,160,48,0.3)" strokeWidth="0.8" filter="url(#softglow)"/>
      <circle cx="80" cy="583" r="8" fill="rgba(240,160,48,0.12)" stroke="rgba(240,160,48,0.4)" strokeWidth="0.8"/>
      <text x="76" y="587" fontFamily="Inter,system-ui" fontSize="10" fill="#F0A030" fontWeight="700">!</text>
      <text x="96" y="577" fontFamily="Inter,system-ui" fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.65)">Stock bajo · Café</text>
      <text x="96" y="591" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(240,160,48,0.7)">Quedan 3 unidades</text>

      {/* Notif sucursal */}
      <rect x="314" y="560" width="206" height="46" rx="10" fill="rgba(8,20,38,0.94)" stroke="rgba(90,170,240,0.25)" strokeWidth="0.8" filter="url(#softglow)"/>
      <circle cx="334" cy="583" r="8" fill="rgba(90,170,240,0.1)" stroke="rgba(90,170,240,0.35)" strokeWidth="0.8"/>
      <text x="330" y="587" fontFamily="Inter,system-ui" fontSize="9" fill="#5AAAF0" fontWeight="700">⊙</text>
      <text x="350" y="577" fontFamily="Inter,system-ui" fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.65)">Sucursal Norte</text>
      <text x="350" y="591" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(90,170,240,0.65)">En línea · 12 ventas hoy</text>

      {/* ── DETALLES METÁLICOS DECORATIVOS ── */}
      <circle cx="520" cy="60" r="3" fill="url(#metal1)" opacity="0.6"/>
      <circle cx="40"  cy="60" r="3" fill="url(#metal1)" opacity="0.6"/>
      <circle cx="40"  cy="620" r="3" fill="url(#metal1)" opacity="0.4"/>
      <circle cx="520" cy="620" r="3" fill="url(#metal1)" opacity="0.4"/>
      {/* Esquinas decorativas */}
      <path d="M50 75 L50 90" stroke="url(#metal1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M50 75 L65 75" stroke="url(#metal1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M510 75 L510 90" stroke="url(#metal1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M510 75 L495 75" stroke="url(#metal1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const [form,     setForm]     = useState({ tenantSlug: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantSlug || !form.email || !form.password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try { await login(form.email, form.password, form.tenantSlug); }
    catch (err: any) { setError(err.response?.data?.message ?? 'Credenciales inválidas'); }
    finally { setLoading(false); }
  };

  const tr = (d = 0) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `all .8s ${d}s cubic-bezier(.22,1,.36,1)` });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#06101C 0%,#0B1C2C 50%,#0A1428 100%)', display: 'flex', fontFamily: "'Inter','Outfit',system-ui,sans-serif", overflow: 'hidden', position: 'relative' }}>
      <AnimatedBg />

      {/* ── IZQUIERDA ── */}
      <div className="login-left" style={{ display: 'none', flex: '0 0 56%', position: 'relative', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>

        {/* Badge top */}
        <div style={{ position: 'absolute', top: '36px', left: '48px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2, ...tr(0) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 14px', background: 'rgba(200,168,130,0.06)', border: '1px solid rgba(200,168,130,0.2)', borderRadius: '20px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5C35', boxShadow: '0 0 8px #FF5C35', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(200,168,130,0.8)', letterSpacing: '.1em', textTransform: 'uppercase' as const }}>Sistema activo</span>
          </div>
        </div>

        {/* Dashboard visual */}
        <div style={{ width: '100%', maxWidth: '580px', ...tr(.1) }}>
          <DaxVisual />
        </div>

        {/* Tagline bottom */}
        <div style={{ position: 'absolute', bottom: '40px', left: '48px', right: '48px', zIndex: 2, ...tr(.3) }}>
          <h2 style={{ fontSize: 'clamp(18px,2.2vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.2, marginBottom: '8px' }}>
            Control total,{' '}
            <span style={{ background: 'linear-gradient(135deg,#FF5C35,#C8A882)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>en tiempo real.</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(200,168,130,0.4)', letterSpacing: '.04em' }}>
            POS · Inventario · Analytics · Multi-sucursal
          </p>
        </div>
      </div>

      {/* ── DERECHA — Card login ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        {/* Card glassmorphism */}
        <div style={{ width: '100%', maxWidth: '400px', ...tr(.15) }}>
          <div style={{
            background: 'rgba(8,18,34,0.72)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(200,168,130,0.18)',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(200,168,130,0.12), inset 0 0 0 1px rgba(255,255,255,0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Brillo top metálico */}
            <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(200,168,130,0.5),transparent)' }} />
            {/* Glow coral fondo card */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle,rgba(255,92,53,0.06),transparent 70%)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <svg width="28" height="21" viewBox="0 0 64 48" fill="none">
                  <defs>
                    <linearGradient id="lcl" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%"   stopColor="#C8A882"/>
                      <stop offset="45%"  stopColor="#FF5C35"/>
                      <stop offset="100%" stopColor="#C8A882"/>
                    </linearGradient>
                  </defs>
                  <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#lcl)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
                </svg>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax</span>
                  <span style={{ fontSize: '18px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.03em' }}>cloud</span>
                </div>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F4FF', letterSpacing: '-.02em', marginBottom: '6px' }}>Bienvenido</h1>
              <p style={{ fontSize: '13px', color: 'rgba(200,168,130,0.45)', lineHeight: 1.6 }}>Accede a tu panel de control</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { k: 'tenantSlug', label: 'ID de empresa',      type: 'text',     placeholder: 'mi-negocio',       ac: 'organization' },
                { k: 'email',      label: 'Correo electrónico', type: 'email',    placeholder: 'admin@empresa.com', ac: 'email' },
              ].map(({ k, label, type, placeholder, ac }) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(200,168,130,0.4)', marginBottom: '7px' }}>{label}</label>
                  <input type={type} value={(form as any)[k]} onChange={e => set(k)(e.target.value)} placeholder={placeholder} autoComplete={ac}
                    style={{ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,168,130,0.12)', borderRadius: '12px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, transition: 'all .2s' }}
                    onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(200,168,130,0.12)'; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; }}
                  />
                </div>
              ))}

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(200,168,130,0.4)' }}>Contraseña</label>
                  <a href="/forgot-password" style={{ fontSize: '11px', color: 'rgba(255,92,53,0.55)', textDecoration: 'none', fontWeight: 600, transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,92,53,0.55)')}>
                    ¿Olvidaste la contraseña?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password')(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                    style={{ width: '100%', padding: '13px 44px 13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,168,130,0.12)', borderRadius: '12px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, transition: 'all .2s' }}
                    onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(200,168,130,0.12)'; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,168,130,0.35)', display: 'flex', padding: '2px', transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,168,130,0.35)')}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: '10px', animation: 'shake .3s ease' }}>
                  <p style={{ fontSize: '12px', color: '#E07070' }}>⚠ {error}</p>
                </div>
              )}

              {/* Botón submit con efecto metálico */}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px', marginTop: '4px',
                background: loading
                  ? 'rgba(255,92,53,0.15)'
                  : 'linear-gradient(135deg,#FF5C35 0%,#FF7A5A 40%,#FF5C35 100%)',
                color: loading ? 'rgba(255,92,53,0.4)' : '#fff',
                border: loading ? '1px solid rgba(255,92,53,0.2)' : '1px solid rgba(255,140,80,0.4)',
                borderRadius: '13px', fontSize: '14px', fontWeight: 800,
                fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .25s',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(255,92,53,0.25), inset 0 1px 0 rgba(255,180,130,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                letterSpacing: '.01em',
              }}
                onMouseEnter={e => { if (!loading) { const b = e.currentTarget as HTMLButtonElement; b.style.transform='translateY(-1px)'; b.style.boxShadow='0 8px 32px rgba(255,92,53,0.4), inset 0 1px 0 rgba(255,180,130,0.3)'; }}}
                onMouseLeave={e => { if (!loading) { const b = e.currentTarget as HTMLButtonElement; b.style.transform='none'; b.style.boxShadow='0 4px 24px rgba(255,92,53,0.25), inset 0 1px 0 rgba(255,180,130,0.3)'; }}}>
                {loading
                  ? <><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,92,53,0.3)', borderTopColor: 'rgba(255,92,53,0.7)', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Ingresando...</>
                  : <>Ingresar <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(200,168,130,0.15),transparent)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(200,168,130,0.25)', whiteSpace: 'nowrap' }}>¿Nuevo en DaxCloud?</span>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(200,168,130,0.15),transparent)' }} />
            </div>

            <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', background: 'transparent', border: '1px solid rgba(200,168,130,0.15)', borderRadius: '13px', fontSize: '13px', fontWeight: 600, color: 'rgba(200,168,130,0.45)', textDecoration: 'none', transition: 'all .2s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(255,92,53,0.4)'; el.style.background='rgba(255,92,53,0.05)'; el.style.color='#FF5C35'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='rgba(200,168,130,0.15)'; el.style.background='transparent'; el.style.color='rgba(200,168,130,0.45)'; }}>
              Crear cuenta gratis
            </a>
          </div>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '11px', color: 'rgba(200,168,130,0.15)' }}>
            © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media(min-width:1024px){.login-left{display:flex!important}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.3)}}
        input:-webkit-autofill,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px rgba(8,18,34,0.98) inset!important;-webkit-text-fill-color:#F0F4FF!important;caret-color:#F0F4FF}
        ::placeholder{color:rgba(200,168,130,0.2)!important}
      `}</style>
    </div>
  );
}
