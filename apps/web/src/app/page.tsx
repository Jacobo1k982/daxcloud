'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Zap, Shield, BarChart2, Smartphone, Globe, ChefHat, Pill, Scissors, Shirt, Leaf, Utensils, ShoppingCart, Package, Check, X, Star, Crown, CreditCard, Users, TrendingUp, ChevronDown, Layers, Menu, BookOpen } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { SinpePaymentModal } from '@/components/payments/SinpePaymentModal';
import { StructuredData } from '@/components/StructuredData';

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  bg:      '#020B18',
  surface: 'rgba(4,18,38,0.85)',
  border:  'rgba(0,200,212,0.12)',
  cyan:    '#00C8D4',
  blue:    '#0EA5E9',
  text:    '#F0F8FF',
  muted:   'rgba(148,196,236,0.5)',
  dim:     'rgba(148,196,236,0.25)',
};

// ── Canvas circuito ───────────────────────────────────────────────────────────
function CircuitCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0, W = 0, H = 0;
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    const animate = () => {
      animId = requestAnimationFrame(animate); t += .004; ctx.clearRect(0, 0, W, H);
      // Grid
      ctx.strokeStyle = 'rgba(0,200,212,0.04)'; ctx.lineWidth = .5;
      for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // Orbs
      const o1 = ctx.createRadialGradient(W * .15, H * .25, 0, W * .15, H * .25, W * .4);
      o1.addColorStop(0, `rgba(0,200,212,${.06 + .02 * Math.sin(t)})`); o1.addColorStop(1, 'transparent');
      ctx.fillStyle = o1; ctx.fillRect(0, 0, W, H);
      const o2 = ctx.createRadialGradient(W * .85, H * .7, 0, W * .85, H * .7, W * .35);
      o2.addColorStop(0, `rgba(14,165,233,${.05 + .02 * Math.cos(t * .8)})`); o2.addColorStop(1, 'transparent');
      ctx.fillStyle = o2; ctx.fillRect(0, 0, W, H);
    };
    resize(); animate();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function CloudLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * .75} viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C8D4" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#00C8D4" />
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z"
        fill="none" stroke="url(#cg)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Manual modal ──────────────────────────────────────────────────────────────
const MANUAL_SECTIONS = [
  {
    icon: Zap, title: 'Primeros pasos', color: '#00C8D4',
    steps: [
      'Crea tu cuenta gratis — sin tarjeta, 14 días de prueba.',
      'Elige tu industria: tienda, restaurante, farmacia y más.',
      'Configura tu primer sucursal y agrega productos.',
      'Invita a tu equipo con roles y permisos.',
    ],
  },
  {
    icon: ShoppingCart, title: 'Punto de venta (POS)', color: '#0EA5E9',
    steps: [
      'Abre el cajón desde el botón "POS" en el menú lateral.',
      'Busca productos por nombre, código de barras o categoría.',
      'Selecciona el método de pago: efectivo, SINPE, tarjeta o mixto.',
      'Imprime o envía el recibo directamente al cliente.',
    ],
  },
  {
    icon: Package, title: 'Inventario', color: '#00C8D4',
    steps: [
      'Gestiona stock por sucursal con alertas de mínimo.',
      'Registra entradas, salidas y mermas.',
      'Exporta reportes en Excel para contabilidad.',
      'Activa lotes para control de vencimientos (farmacia, verdulería).',
    ],
  },
  {
    icon: BarChart2, title: 'Analytics', color: '#0EA5E9',
    steps: [
      'Visualiza ingresos, ventas y ticket promedio en tiempo real.',
      'Filtra por sucursal, período y método de pago.',
      'Descubre tus productos estrella y horas pico.',
      'Exporta reportes detallados para toma de decisiones.',
    ],
  },
  {
    icon: Users, title: 'Clientes y fidelización', color: '#00C8D4',
    steps: [
      'Crea perfiles de clientes con historial de compras.',
      'Asigna puntos automáticamente por monto de compra.',
      'Ofrece crédito interno y controla el saldo.',
      'Busca clientes por nombre, cédula o teléfono desde el POS.',
    ],
  },
  {
    icon: Globe, title: 'Multi-sucursal', color: '#0EA5E9',
    steps: [
      'Agrega sucursales desde Configuración → Sucursales.',
      'Cada sucursal con su propio inventario y usuarios.',
      'Los reportes consolidan todas las sucursales o filtran por una.',
      'Planes Growth y Scale incluyen múltiples sucursales.',
    ],
  },
];

function ManualModal({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState(0);
  const sec = MANUAL_SECTIONS[active];
  const Icon = sec.icon;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,11,24,0.96)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '860px', background: 'rgba(4,18,38,0.98)', border: '1px solid rgba(0,200,212,0.2)', borderRadius: '24px', overflow: 'hidden', animation: 'modalIn .3s cubic-bezier(.22,1,.36,1)', display: 'flex', maxHeight: '90vh' }}>

        {/* Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid rgba(0,200,212,0.1)', padding: '28px 16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', paddingLeft: '8px' }}>
            <BookOpen size={16} color="#00C8D4" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#00C8D4', letterSpacing: '.08em', textTransform: 'uppercase' }}>Manual</span>
          </div>
          {MANUAL_SECTIONS.map((s, i) => {
            const SIcon = s.icon;
            return (
              <button key={i} onClick={() => setActive(i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '11px', border: 'none', cursor: 'pointer', marginBottom: '4px', background: active === i ? `${s.color}10` : 'transparent', transition: 'all .15s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: active === i ? `${s.color}20` : 'rgba(148,196,236,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: active === i ? `1px solid ${s.color}30` : '1px solid transparent' }}>
                  <SIcon size={13} color={active === i ? s.color : 'rgba(148,196,236,0.3)'} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: active === i ? 700 : 500, color: active === i ? s.color : 'rgba(148,196,236,0.4)', textAlign: 'left', lineHeight: 1.3 }}>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '36px 36px 36px 36px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${sec.color}15`, border: `1px solid ${sec.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={sec.color} />
              </div>
              <div>
                <p style={{ fontSize: '10px', color: sec.color, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Módulo {active + 1} de {MANUAL_SECTIONS.length}</p>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F8FF', letterSpacing: '-.02em', margin: 0 }}>{sec.title}</h2>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,200,212,0.06)', border: '1px solid rgba(0,200,212,0.15)', cursor: 'pointer', color: 'rgba(148,196,236,0.5)', padding: '8px', borderRadius: '10px', display: 'flex', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {sec.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px 18px', background: 'rgba(0,200,212,0.03)', border: '1px solid rgba(0,200,212,0.08)', borderRadius: '14px', transition: 'all .2s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg, ${sec.color}, #0EA5E9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px', fontWeight: 800, color: '#020B18' }}>{i + 1}</div>
                <p style={{ fontSize: '14px', color: 'rgba(148,196,236,0.8)', lineHeight: 1.75, margin: 0, paddingTop: '3px' }}>{step}</p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(0,200,212,0.08)' }}>
            <button onClick={() => setActive(p => Math.max(0, p - 1))} disabled={active === 0} style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid rgba(0,200,212,0.15)', background: 'transparent', color: active === 0 ? 'rgba(148,196,236,0.2)' : 'rgba(148,196,236,0.6)', fontSize: '13px', fontWeight: 600, cursor: active === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>← Anterior</button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {MANUAL_SECTIONS.map((_, i) => (
                <div key={i} onClick={() => setActive(i)} style={{ width: i === active ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === active ? sec.color : 'rgba(0,200,212,0.2)', cursor: 'pointer', transition: 'all .3s' }} />
              ))}
            </div>
            {active < MANUAL_SECTIONS.length - 1
              ? <button onClick={() => setActive(p => p + 1)} style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${sec.color}, #0EA5E9)`, color: '#020B18', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Siguiente →</button>
              : <a href="/register" style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, #00C8D4, #0EA5E9)`, color: '#020B18', fontSize: '13px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Empezar gratis →</a>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(p => !p)} style={{ padding: '18px 22px', background: open ? 'rgba(0,200,212,0.04)' : 'rgba(4,18,38,0.6)', border: `1px solid ${open ? 'rgba(0,200,212,0.2)' : 'rgba(0,200,212,0.08)'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all .2s', userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: open ? '#F0F8FF' : 'rgba(148,196,236,0.7)', lineHeight: 1.5 }}>{q}</span>
        <span style={{ color: open ? '#00C8D4' : 'rgba(0,200,212,0.3)', fontSize: '18px', transition: 'transform .2s', transform: open ? 'rotate(45deg)' : 'none', flexShrink: 0, lineHeight: 1 }}>+</span>
      </div>
      {open && <p style={{ fontSize: '13px', color: 'rgba(148,196,236,0.5)', lineHeight: 1.8, marginTop: '12px' }}>{a}</p>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [sinpePlan, setSinpePlan] = useState<typeof PLANS[number] | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pagaditoLoading, setPagaditoLoading] = useState<string | null>(null);

  const handlePagadito = (plan: typeof PLANS[number]) => {
    const amount = annual ? plan.annualMonthly : plan.monthlyPrice;
    const params = new URLSearchParams({ plan: plan.name, billing: annual ? 'annual' : 'monthly', amount: String(amount), method: 'pagadito' });
    window.location.href = '/register?' + params.toString();
  };

  const INDUSTRIES = [
    { icon: Utensils,    label: 'Restaurante',  color: '#0EA5E9' },
    { icon: ChefHat,     label: 'Panadería',    color: '#00C8D4' },
    { icon: Pill,        label: 'Farmacia',     color: '#38BDF8' },
    { icon: Scissors,    label: 'Peluquería',   color: '#0EA5E9' },
    { icon: Shirt,       label: 'Ropa',         color: '#00C8D4' },
    { icon: Leaf,        label: 'Verdulería',   color: '#38BDF8' },
    { icon: ShoppingCart,label: 'Supermercado', color: '#0EA5E9' },
    { icon: Package,     label: 'Tienda',       color: '#00C8D4' },
  ];

  const FEATURES = [
    { icon: Zap,       title: 'POS adaptativo',       desc: 'Se adapta a tu industria automáticamente. Interfaz limpia, rápida y sin distracciones.', color: '#00C8D4' },
    { icon: BarChart2, title: 'Analytics en vivo',    desc: 'Ingresos, ventas y métricas del negocio actualizados en tiempo real desde cualquier dispositivo.', color: '#0EA5E9' },
    { icon: Globe,     title: 'Multi-moneda Latam',   desc: 'CRC, USD, MXN, COP y 20+ países. Formatos locales, impuestos y métodos de pago regionales.', color: '#00C8D4' },
    { icon: Shield,    title: 'Seguridad enterprise', desc: 'Multi-tenant aislado. Roles y permisos granulares. Datos encriptados en tránsito y reposo.', color: '#0EA5E9' },
    { icon: Layers,    title: 'Multi-sucursal',       desc: 'Gestiona todas tus sedes desde un solo panel. Inventario y usuarios independientes por sucursal.', color: '#00C8D4' },
    { icon: Smartphone,title: 'Responsive total',     desc: 'El POS, los reportes y la gestión funcionan perfectamente en móvil, tablet y desktop.', color: '#0EA5E9' },
  ];

  return (
    <div style={{ background: C.bg, fontFamily: "'Outfit', system-ui, sans-serif", minHeight: '100vh', position: 'relative' }}>
      <StructuredData />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: '64px', background: 'rgba(2,11,24,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 clamp(20px,5vw,64px)', justifyContent: 'space-between', gap: '16px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <CloudLogo size={34} />
          <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-.02em', color: C.text }}>Dax<span style={{ color: C.cyan, fontWeight: 300 }}>cloud</span></span>
        </a>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }} className="desktop-nav">
          {[['#features', 'Funciones'], ['#industries', 'Industrias'], ['#pricing', 'Precios']].map(([href, label]) => (
            <a key={href} href={href} style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: C.muted, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{label}</a>
          ))}
          <button onClick={() => setShowManual(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: C.cyan, background: 'rgba(0,200,212,0.08)', border: '1px solid rgba(0,200,212,0.15)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,212,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,212,0.08)'; }}>
            <BookOpen size={13} /> Manual
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <a href="/login" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: C.muted, textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.text)}
            onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>Iniciar sesión</a>
          <a href="/register" style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, color: '#020B18', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, textDecoration: 'none', letterSpacing: '.01em', whiteSpace: 'nowrap' }}>Empezar gratis</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', padding: 'clamp(80px,10vh,120px) clamp(20px,6vw,80px) 60px', position: 'relative', overflow: 'hidden', gap: '60px', flexWrap: 'wrap' }}>
        <CircuitCanvas />

        <div style={{ position: 'relative', zIndex: 1, flex: '1 1 480px', maxWidth: '620px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,200,212,0.07)', border: '1px solid rgba(0,200,212,0.2)', marginBottom: '32px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.cyan, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.cyan, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>POS multi-industria · América Latina</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.03em', color: C.text, marginBottom: '24px' }}>
            El sistema que<br />impulsa tu{' '}
            <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>negocio</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: C.muted, lineHeight: 1.85, marginBottom: '40px', maxWidth: '500px' }}>
            Gestiona ventas, inventario y sucursales desde una plataforma inteligente. Sin complicaciones, sin contratos.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '52px', flexWrap: 'wrap' }}>
            <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '13px', fontSize: '15px', fontWeight: 800, color: '#020B18', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, textDecoration: 'none', letterSpacing: '.01em', boxShadow: '0 4px 24px rgba(0,200,212,0.25)' }}>
              Empezar gratis <ArrowRight size={16} />
            </a>
            <button onClick={() => setShowManual(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '13px', fontSize: '15px', fontWeight: 600, color: C.cyan, background: 'transparent', border: '1px solid rgba(0,200,212,0.25)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,200,212,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,200,212,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,200,212,0.25)'; }}>
              <BookOpen size={15} /> Ver manual
            </button>
          </div>

          <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap' }}>
            {[['14 días', 'Prueba gratis'], ['Sin tarjeta', 'No requerida'], ['8+', 'Industrias'], ['SINPE', 'Pago local']].map(([v, l]) => (
              <div key={l}>
                <p style={{ fontSize: '18px', fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: '3px' }}>{v}</p>
                <p style={{ fontSize: '10px', color: C.cyan, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, opacity: .6 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* POS Mockup */}
        <div style={{ position: 'relative', zIndex: 1, flex: '0 0 auto', animation: 'float 4s ease-in-out infinite' }}>
          <div style={{ background: 'rgba(4,18,38,0.92)', border: '1px solid rgba(0,200,212,0.2)', borderRadius: '20px', padding: '20px', width: 'clamp(260px,30vw,310px)', boxShadow: '0 0 60px rgba(0,200,212,0.07), 0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,200,212,0.1)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>POS · Cafetería</span>
              <span style={{ fontSize: '10px', color: C.cyan, fontWeight: 700, background: 'rgba(0,200,212,0.1)', padding: '3px 8px', borderRadius: '6px' }}>● En vivo</span>
            </div>
            {[['2', 'Café Americano', '₡3,000'], ['1', 'Croissant', '₡2,200'], ['3', 'Jugo Natural', '₡5,400']].map(([q, n, p]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', background: 'rgba(0,200,212,0.04)', border: '1px solid rgba(0,200,212,0.07)', borderRadius: '9px', marginBottom: '6px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(0,200,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: C.cyan, flexShrink: 0 }}>{q}</div>
                <span style={{ fontSize: '12px', color: 'rgba(148,196,236,0.7)', flex: 1 }}>{n}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{p}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,200,212,0.05)', border: '1px solid rgba(0,200,212,0.12)', borderRadius: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: C.muted }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: C.cyan }}>₡10,600</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '10px' }}>
              {['Efectivo', 'SINPE ✓', 'Tarjeta', 'Mixto'].map((m, i) => (
                <div key={m} style={{ padding: '7px', borderRadius: '8px', textAlign: 'center' as const, fontSize: '10px', fontWeight: i === 1 ? 700 : 500, border: '1px solid', borderColor: i === 1 ? 'rgba(0,200,212,0.4)' : 'rgba(0,200,212,0.1)', background: i === 1 ? 'rgba(0,200,212,0.07)' : 'transparent', color: i === 1 ? C.cyan : C.dim }}>{m}</div>
              ))}
            </div>
          </div>
          {/* Float badges */}
          <div style={{ position: 'absolute', top: '-14px', right: '-20px', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, borderRadius: '10px', padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,200,212,0.3)', animation: 'float 3s .3s ease-in-out infinite' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#020B18', lineHeight: 1, marginBottom: '1px' }}>₡10,600</p>
            <span style={{ fontSize: '9px', color: 'rgba(2,11,24,0.7)' }}>Venta ✓</span>
          </div>
          <div style={{ position: 'absolute', bottom: '-12px', left: '-24px', background: 'rgba(4,18,38,0.96)', border: '1px solid rgba(0,200,212,0.2)', borderRadius: '10px', padding: '8px 12px', animation: 'float 3s .7s ease-in-out infinite' }}>
            <p style={{ fontSize: '10px', color: C.cyan, fontWeight: 700, marginBottom: '1px' }}>📊 Hoy</p>
            <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>+₡85,200</span>
          </div>
        </div>
      </section>

      {/* INDUSTRIAS */}
      <section id="industries" style={{ padding: 'clamp(48px,6vh,80px) clamp(20px,6vw,80px)', borderTop: `1px solid ${C.border}` }}>
        <p style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(0,200,212,0.35)', marginBottom: '28px' }}>Una plataforma · Todas las industrias</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '860px', margin: '0 auto' }}>
          {INDUSTRIES.map(({ icon: Icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: `1px solid ${color}20`, background: `${color}06`, transition: 'all .2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLElement).style.background = `${color}0D`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}20`; (e.currentTarget as HTMLElement).style.background = `${color}06`; }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: '13px', fontWeight: 600, color }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,6vw,80px)', borderTop: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(0,200,212,0.35)', marginBottom: '16px' }}>Por qué DaxCloud</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: C.text, letterSpacing: '-.02em', marginBottom: '16px' }}>Todo lo que necesitas</h2>
          <p style={{ fontSize: '16px', color: C.muted, maxWidth: '460px', margin: '0 auto', lineHeight: 1.8 }}>Sin módulos extra, sin costos ocultos. Todo incluido desde el primer día.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '14px', maxWidth: '1060px', margin: '0 auto' }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{ padding: '28px 24px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '18px', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}25`; (e.currentTarget as HTMLElement).style.background = `rgba(4,18,38,0.95)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.surface; }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '10px', letterSpacing: '-.01em' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.8 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,6vw,80px)', borderTop: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(0,200,212,0.35)', marginBottom: '16px' }}>Precios</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: C.text, letterSpacing: '-.02em', marginBottom: '14px' }}>Simple y transparente</h2>
          <p style={{ fontSize: '15px', color: C.muted, marginBottom: '32px' }}>14 días gratis · Sin tarjeta · Cancela cuando quieras</p>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', padding: '8px 10px', background: 'rgba(4,18,38,0.8)', border: `1px solid ${C.border}`, borderRadius: '40px' }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '7px 18px', borderRadius: '30px', border: 'none', background: !annual ? 'rgba(0,200,212,0.12)' : 'transparent', color: !annual ? C.cyan : C.dim, fontSize: '13px', fontWeight: !annual ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>Mensual</button>
            <div onClick={() => setAnnual(p => !p)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: annual ? C.cyan : 'rgba(0,200,212,0.2)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '3px', left: annual ? '20px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
            </div>
            <button onClick={() => setAnnual(true)} style={{ padding: '7px 18px', borderRadius: '30px', border: 'none', background: annual ? 'rgba(0,200,212,0.12)' : 'transparent', color: annual ? C.cyan : C.dim, fontSize: '13px', fontWeight: annual ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '7px' }}>
              Anual <span style={{ fontSize: '10px', fontWeight: 700, color: '#3DBF7F', background: 'rgba(61,191,127,0.12)', border: '1px solid rgba(61,191,127,0.2)', padding: '2px 8px', borderRadius: '6px' }}>2 meses gratis</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px', maxWidth: '980px', margin: '0 auto' }}>
          {PLANS.map(plan => {
            const price = annual ? plan.annualMonthly : plan.monthlyPrice;
            return (
              <div key={plan.name} style={{ padding: '28px 24px', background: plan.popular ? 'rgba(0,50,70,0.5)' : C.surface, border: `1px solid ${plan.popular ? 'rgba(0,200,212,0.35)' : C.border}`, borderRadius: '20px', position: 'relative', display: 'flex', flexDirection: 'column' as const }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, color: '#020B18', fontSize: '10px', fontWeight: 800, padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '.06em', textTransform: 'uppercase' as const }}>⚡ Más popular</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: plan.popular ? '8px' : '0' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: plan.color, boxShadow: `0 0 8px ${plan.color}60` }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>{plan.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: C.dim, alignSelf: 'flex-start', marginTop: '8px' }}>$</span>
                  <span style={{ fontSize: '52px', fontWeight: 900, color: plan.popular ? C.cyan : C.text, lineHeight: 1, letterSpacing: '-.03em', transition: 'all .3s' }}>{price}</span>
                  <span style={{ fontSize: '13px', color: C.dim, marginBottom: '8px' }}>/mes</span>
                </div>
                <p style={{ fontSize: '11px', color: C.dim, marginBottom: '16px' }}>{plan.limit}</p>

                <div style={{ padding: '8px 12px', background: `${plan.color}0A`, border: `1px solid ${plan.color}18`, borderRadius: '8px', marginBottom: '18px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: plan.color }}>{annual ? `$${plan.annualPrice}/año · ahorras $${plan.monthlyPrice * 12 - plan.annualPrice}` : `$${plan.monthlyPrice * 12}/año facturado mensual`}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', flex: 1, marginBottom: '22px' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ width: '17px', height: '17px', borderRadius: '50%', background: f.included ? `${plan.color}15` : 'rgba(0,200,212,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {f.included ? <Check size={9} color={plan.color} strokeWidth={3} /> : <X size={8} color="rgba(148,196,236,0.2)" strokeWidth={2} />}
                      </div>
                      <span style={{ fontSize: '13px', color: f.included ? 'rgba(240,248,255,0.8)' : 'rgba(148,196,236,0.2)', textDecoration: f.included ? 'none' : 'line-through' }}>{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '13px', background: plan.popular ? `linear-gradient(135deg,${C.cyan},${C.blue})` : 'transparent', border: plan.popular ? 'none' : `1.5px solid ${plan.color}40`, borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: plan.popular ? '#020B18' : plan.color, textDecoration: 'none', transition: 'all .2s' }}>
                    {plan.cta} <ArrowRight size={14} />
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,200,212,0.08)' }} />
                    <span style={{ fontSize: '10px', color: 'rgba(0,200,212,0.25)', letterSpacing: '.06em', textTransform: 'uppercase' as const }}>o paga ahora</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,200,212,0.08)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => setSinpePlan(plan as any)} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px', padding: '10px 8px', background: 'rgba(61,191,127,0.05)', border: '1px solid rgba(61,191,127,0.15)', borderRadius: '11px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,191,127,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,191,127,0.15)'; }}>
                      <Smartphone size={13} color="#3DBF7F" />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#3DBF7F' }}>SINPE</span>
                      <span style={{ fontSize: '9px', color: 'rgba(148,196,236,0.3)' }}>Solo CR</span>
                    </button>
                    <button onClick={() => handlePagadito(plan as any)} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px', padding: '10px 8px', background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: '11px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,0,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,0,0.15)'; }}>
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        <svg width="22" height="8" viewBox="0 0 28 9" fill="none"><text x="0" y="8" fontSize="9" fontWeight="900" fontFamily="Arial,sans-serif" fill="#1A1F71">VISA</text></svg>
                        <svg width="13" height="9" viewBox="0 0 16 10"><circle cx="6" cy="5" r="5" fill="#EB001B" opacity=".9"/><circle cx="10" cy="5" r="5" fill="#F79E1B" opacity=".9"/><path d="M8 1.8a5 5 0 010 6.4A5 5 0 018 1.8z" fill="#FF5F00" opacity=".9"/></svg>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF6B00' }}>Tarjeta</span>
                      <span style={{ fontSize: '9px', color: 'rgba(148,196,236,0.3)' }}>Latinoamérica</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Métodos aceptados */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(0,200,212,0.3)', fontWeight: 600 }}>
            SINPE Móvil · Visa · Mastercard · Débito — Toda Latinoamérica
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,6vw,80px)', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(0,200,212,0.35)', marginBottom: '16px' }}>FAQ</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, color: C.text, letterSpacing: '-.02em', marginBottom: '40px' }}>Preguntas frecuentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {[
              { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí, puedes subir o bajar de plan cuando quieras desde Configuración → Plan. El cambio es efectivo inmediatamente.' },
              { q: '¿Qué pasa al terminar los 14 días de prueba?', a: 'Te avisamos 3 días antes. Si no activas un plan, tu cuenta pasa a modo lectura. Tus datos se conservan 30 días.' },
              { q: '¿Qué industrias soporta DaxCloud?', a: 'Tienda, restaurante, panadería, farmacia, peluquería, ropa, verdulería y supermercado. Cada módulo tiene funciones especializadas.' },
              { q: '¿Cómo funciona el pago por SINPE Móvil?', a: 'Haces la transferencia al número registrado, nos envías el comprobante y activamos tu plan en menos de 2 horas hábiles.' },
              { q: '¿Qué países de Latinoamérica tienen acceso?', a: 'Costa Rica, Guatemala, El Salvador, Honduras, Nicaragua, Panamá, México, Colombia, Perú, Chile, Argentina, Brasil y más.' },
              { q: '¿El módulo de industria tiene costo adicional?', a: 'Sí, los módulos especializados tienen un costo adicional de $22/mes sobre tu plan base.' },
            ].map((faq, i) => <FAQ key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: 'clamp(80px,10vh,120px) clamp(20px,6vw,80px)', borderTop: `1px solid ${C.border}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(0,200,212,0.07), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <CloudLogo size={56} />
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, color: C.text, letterSpacing: '-.03em', margin: '24px 0 16px' }}>Listo para empezar</h2>
          <p style={{ fontSize: '16px', color: C.muted, marginBottom: '40px', lineHeight: 1.8 }}>14 días gratis, sin tarjeta.<br />Configura tu negocio en menos de 2 minutos.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 32px', borderRadius: '14px', fontSize: '15px', fontWeight: 800, color: '#020B18', background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, textDecoration: 'none', boxShadow: '0 4px 28px rgba(0,200,212,0.25)', letterSpacing: '.01em' }}>
              Crear cuenta gratis <ArrowRight size={16} />
            </a>
            <button onClick={() => setShowManual(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, color: C.cyan, background: 'transparent', border: '1px solid rgba(0,200,212,0.25)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <BookOpen size={15} /> Leer manual
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px clamp(20px,6vw,80px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CloudLogo size={28} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: C.dim }}>Dax<span style={{ color: 'rgba(0,200,212,0.4)' }}>cloud</span></span>
          <span style={{ fontSize: '11px', color: 'rgba(0,200,212,0.15)' }}>· by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(0,200,212,0.3)', textDecoration: 'none', fontWeight: 600 }}>jacana-dev.com</a></span>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[['/', 'Inicio'], ['/pricing', 'Precios'], ['/login', 'Login'], ['/register', 'Registro']].map(([href, label]) => (
            <a key={label} href={href} style={{ fontSize: '12px', color: 'rgba(0,200,212,0.2)', textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,200,212,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,200,212,0.2)')}>{label}</a>
          ))}
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(0,200,212,0.15)' }}>© {new Date().getFullYear()} DaxCloud</span>
      </footer>

      {/* Modals */}
      {sinpePlan && <SinpePaymentModal planName={sinpePlan.name} planLabel={sinpePlan.label} planColor={sinpePlan.color} monthlyPrice={sinpePlan.monthlyPrice} annualPrice={sinpePlan.annualPrice} onClose={() => setSinpePlan(null)} />}
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');
        * { font-family: 'Outfit', system-ui, sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes modalIn { from{opacity:0;transform:scale(.97) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
