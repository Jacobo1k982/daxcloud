'use client';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import {
  ArrowRight, Zap, Shield, BarChart2, Smartphone, Globe,
  ChefHat, Pill, Scissors, Shirt, Leaf, Utensils,
  ShoppingCart, Package, Check, X, Star, Crown, CreditCard,
  Users, TrendingUp, Play, ChevronDown, MessageCircle,
  Clock, Layers, Cpu,
} from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { SinpePaymentModal } from '@/components/payments/SinpePaymentModal';
import { StructuredData } from '@/components/StructuredData';

// ── Particle field ────────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0, W = 0, H = 0;
    let particles: any[] = [];
    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H;
      particles = Array.from({ length: Math.floor(W * H / 10000) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .13,
        r: .3 + Math.random() * 1.0, o: .06 + Math.random() * .2,
        coral: Math.random() < .2,
      }));
    };
    const animate = () => {
      animId = requestAnimationFrame(animate); t += .003; ctx.clearRect(0, 0, W, H);
      const g1 = ctx.createRadialGradient(W * .2, H * .3, 0, W * .2, H * .3, W * .4);
      g1.addColorStop(0, `rgba(255,92,53,${.04 + .015 * Math.sin(t)})`); g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(W * .8, H * .6, 0, W * .8, H * .6, W * .35);
      g2.addColorStop(0, `rgba(30,58,95,${.10 + .03 * Math.cos(t * .7)})`); g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.coral ? `rgba(255,92,53,${p.o})` : `rgba(91,170,240,${p.o})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(30,58,95,${.12 * (1 - d / 80)})`; ctx.lineWidth = .5; ctx.stroke(); }
      }
    };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement!); animate();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null); const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap, color: '#FF5C35', title: 'POS adaptativo', desc: 'El sistema detecta tu industria y adapta la interfaz automáticamente. Restaurante, farmacia, peluquería — cada negocio tiene su flujo.' },
  { icon: BarChart2, color: '#5AAAF0', title: 'Analytics en tiempo real', desc: 'Ventas, inventario y métricas clave actualizados al instante. Toma decisiones basadas en datos, no en suposiciones.' },
  { icon: Globe, color: '#3DBF7F', title: 'Multi-moneda', desc: 'Soporte nativo para 20+ países de América Latina. CRC, USD, MXN, COP y más, con formatos locales correctos.' },
  { icon: Shield, color: '#F0A030', title: 'Multi-tenant seguro', desc: 'Cada negocio tiene su propio espacio aislado. Roles, permisos y sucursales completamente independientes.' },
  { icon: Smartphone, color: '#A78BFA', title: 'Responsive total', desc: 'Funciona igual en desktop, tablet y móvil. El POS, el dashboard y los reportes adaptados a cualquier pantalla.' },
  { icon: Package, color: '#EC4899', title: 'Inventario inteligente', desc: 'Control de stock, movimientos y alertas automáticas cuando el inventario baja del mínimo configurado.' },
];

const INDUSTRIES = [
  { icon: Utensils, label: 'Restaurante', color: '#F97316' },
  { icon: ChefHat, label: 'Panadería', color: '#FF5C35' },
  { icon: Pill, label: 'Farmacia', color: '#5AAAF0' },
  { icon: Scissors, label: 'Peluquería', color: '#A78BFA' },
  { icon: Shirt, label: 'Ropa', color: '#EAB308' },
  { icon: Leaf, label: 'Verdulería', color: '#22C55E' },
  { icon: ShoppingCart, label: 'Supermercado', color: '#5AAAF0' },
  { icon: Package, label: 'Tienda', color: '#FF5C35' },
];

const STEPS = [
  { num: '01', icon: Users, color: '#FF5C35', title: 'Crea tu cuenta', desc: 'Regístrate en 2 minutos. Sin tarjeta, sin compromisos. Solo tu nombre y correo.' },
  { num: '02', icon: Package, color: '#5AAAF0', title: 'Configura tu negocio', desc: 'Agrega tus productos, sucursales y usuarios. Importa desde Excel o agrégalos uno a uno.' },
  { num: '03', icon: TrendingUp, color: '#3DBF7F', title: 'Empieza a vender', desc: 'Abre el POS y empieza a procesar ventas de inmediato. Los reportes se actualizan en tiempo real.' },
];

const TESTIMONIALS = [
  { name: 'María González', role: 'Panadería La Esperanza', country: '🇨🇷 Costa Rica', text: 'Antes llevaba todo en Excel. Ahora el inventario se actualiza solo y sé exactamente cuánto vendí cada día.', rating: 5 },
  { name: 'Carlos Mendez', role: 'Restaurante El Fogón', country: '🇲🇽 México', text: 'El módulo de restaurante es increíble. Mesas, comandas, todo en una sola pantalla. Mis meseros aprendieron en 10 minutos.', rating: 5 },
  { name: 'Andrea Ruiz', role: 'Farmacia Central', country: '🇨🇴 Colombia', text: 'Lo que más me gustó es que funciona igual en el celular que en la computadora. Reviso las ventas desde donde sea.', rating: 5 },
];

const COMPARISON = [
  { feature: 'POS multi-industria', dax: true, excel: false, other: false },
  { feature: 'Inventario en tiempo real', dax: true, excel: false, other: true },
  { feature: 'Multi-sucursal', dax: true, excel: false, other: false },
  { feature: 'Analytics avanzado', dax: true, excel: false, other: true },
  { feature: 'App móvil incluida', dax: true, excel: false, other: false },
  { feature: 'Pago con SINPE Móvil', dax: true, excel: false, other: false },
  { feature: 'Sin costo de instalación', dax: true, excel: true, other: false },
  { feature: 'Soporte en español', dax: true, excel: false, other: false },
];

const FAQS = [
  { q: '¿Necesito tarjeta de crédito para la prueba gratuita?', a: 'No. Los 14 días de prueba son completamente gratuitos y no requieren ningún método de pago. Puedes explorar todas las funciones sin ningún compromiso.' },
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes subir o bajar de plan cuando quieras. Los cambios se aplican de inmediato y el cobro se ajusta proporcionalmente.' },
  { q: '¿Cómo funciona el pago por SINPE Móvil?', a: 'Haces la transferencia al número registrado, nos envías el comprobante y activamos tu cuenta en menos de 2 horas hábiles.' },
  { q: '¿Funciona sin internet?', a: 'El POS requiere conexión para sincronizar en tiempo real. Estamos desarrollando un modo offline para futuras versiones.' },
  { q: '¿Puedo importar mis productos desde Excel?', a: 'Sí. DaxCloud acepta importación masiva desde archivos Excel (.xlsx) con nombre, precio, costo, SKU y categoría.' },
  { q: '¿Mis datos están seguros?', a: 'Sí. Cada negocio tiene su base de datos aislada. Usamos cifrado en tránsito y en reposo, con backups automáticos diarios.' },
];

const PLAN_ICONS: Record<string, any> = { starter: Shield, growth: Star, scale: Crown };

// ── Componentes ───────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, color, title, desc, delay }: any) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ padding: '28px 24px', background: 'rgba(22,34,53,0.6)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: '18px', backdropFilter: 'blur(8px)', transition: `all .6s ${delay}ms cubic-bezier(.22,1,.36,1)`, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', cursor: 'default' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}50`; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 12px 32px ${color}14`; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(30,58,95,0.5)'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>
      <p style={{ fontSize: '15px', fontWeight: 700, color: '#F0F4FF', marginBottom: '10px', letterSpacing: '-.01em' }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#3A6A9A', lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

function POSMockup() {
  const items = [{ name: 'Café Americano', price: '₡1,500', qty: 2 }, { name: 'Croissant', price: '₡2,200', qty: 1 }, { name: 'Jugo Natural', price: '₡1,800', qty: 3 }];
  return (
    <div style={{ background: 'rgba(10,18,30,0.9)', border: '1px solid rgba(30,58,95,0.6)', borderRadius: '20px', padding: '20px', backdropFilter: 'blur(20px)', boxShadow: '0 24px 60px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03) inset', maxWidth: '310px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(30,58,95,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,92,53,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart size={13} color="#FF5C35" /></div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FF' }}>POS · Cafetería</span>
        </div>
        <span style={{ fontSize: '10px', color: '#3DBF7F', fontWeight: 700, background: 'rgba(61,191,127,.1)', padding: '3px 8px', borderRadius: '6px' }}>● En vivo</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', background: 'rgba(30,58,95,0.2)', borderRadius: '9px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,92,53,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '10px', fontWeight: 800, color: '#FF5C35' }}>{item.qty}</span></div>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#B8D0E8', flex: 1 }}>{item.name}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F0F4FF' }}>{item.price}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '11px', background: 'rgba(255,92,53,0.06)', border: '1px solid rgba(255,92,53,0.15)', borderRadius: '11px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '11px', color: '#3A6A9A' }}>Subtotal</span><span style={{ fontSize: '11px', color: '#7BBEE8' }}>₡11,700</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FF' }}>Total</span>
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#FF5C35' }}>₡11,700</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {['Efectivo', 'SINPE', 'Tarjeta', 'Mixto'].map((m, i) => (
          <div key={m} style={{ padding: '8px', borderRadius: '9px', border: `1px solid ${i === 1 ? 'rgba(255,92,53,.4)' : 'rgba(30,58,95,0.5)'}`, background: i === 1 ? 'rgba(255,92,53,.08)' : 'transparent', textAlign: 'center' as const }}>
            <span style={{ fontSize: '11px', fontWeight: i === 1 ? 700 : 400, color: i === 1 ? '#FF5C35' : '#3A6A9A' }}>{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid rgba(30,58,95,.45)', borderRadius: '14px', overflow: 'hidden', transition: 'border-color .2s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,58,95,.7)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,58,95,.45)'}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'rgba(16,26,42,.8)', border: 'none', cursor: 'pointer', gap: '12px', textAlign: 'left' as const }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#B8D0E8', flex: 1 }}>{q}</span>
        <ChevronDown size={16} color="#3A6A9A" style={{ flexShrink: 0, transition: 'transform .25s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{ padding: '0 20px 18px', background: 'rgba(10,18,30,.6)' }}>
          <p style={{ fontSize: '13px', color: '#3A6A9A', lineHeight: 1.8 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [sinpePlan, setSinpePlan] = useState<typeof PLANS[number] | null>(null);
  const [pagaditoPlan, setPagaditoPlan] = useState<typeof PLANS[number] | null>(null);
  const [pagaditoLoading, setPagaditoLoading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const featuresReveal = useReveal();
  const industriesReveal = useReveal();
  const stepsReveal = useReveal();
  const comparisonReveal = useReveal();
  const testimonialsReveal = useReveal();
  const faqReveal = useReveal();
  const ctaReveal = useReveal();

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#060D16', fontFamily: 'Outfit, system-ui, sans-serif', overflowX: 'hidden' }}>
      <StructuredData />

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '62px', borderBottom: '1px solid rgba(30,58,95,0.5)', background: 'rgba(6,13,22,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', padding: '0 clamp(20px,5vw,80px)', justifyContent: 'space-between', gap: '16px' }}>
        <Logo size="sm" />
        <div style={{ display: 'none', gap: '4px', alignItems: 'center' }} className="nav-links">
          {[['#features', 'Funciones'], ['#como-funciona', 'Cómo funciona'], ['#precios', 'Precios'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: 'rgba(176,208,240,.5)', textDecoration: 'none', transition: 'all .15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#F0F4FF'; el.style.background = 'rgba(30,58,95,.3)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(176,208,240,.5)'; el.style.background = 'transparent'; }}>
              {label}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/login" style={{ padding: '7px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: 'rgba(176,208,240,.5)', textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F0F4FF')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(176,208,240,.5)')}>
            Iniciar sesión
          </a>
          <a href="/register" style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff', background: '#FF5C35', textDecoration: 'none', transition: 'all .18s', boxShadow: '0 2px 12px rgba(255,92,53,.35)', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#E8440E'; el.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#FF5C35'; el.style.transform = 'none'; }}>
            Empezar gratis
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: 'clamp(100px,12vh,140px) clamp(20px,5vw,80px) clamp(60px,8vh,100px)', overflow: 'hidden' }}>
        <ParticleField />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(30,58,95,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(30,58,95,.03) 1px,transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition: 'all .9s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,92,53,.08)', border: '1px solid rgba(255,92,53,.2)', marginBottom: '28px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5C35', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF5C35', letterSpacing: '.04em' }}>POS multi-industria para América Latina</span>
            </div>
            <h1 style={{ fontSize: 'clamp(36px,5vw,68px)', fontWeight: 800, lineHeight: 1.08, color: '#fff', marginBottom: '22px', letterSpacing: '-.03em' }}>
              El POS que se adapta<br />a tu{' '}
              <span style={{ background: 'linear-gradient(135deg,#FF8C00,#FF5C35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>negocio</span>
            </h1>
            <p style={{ fontSize: 'clamp(15px,2vw,17px)', color: '#3A6A9A', lineHeight: 1.8, marginBottom: '36px', maxWidth: '480px' }}>
              Gestiona ventas, inventario y sucursales desde un solo sistema. Restaurante, farmacia, peluquería o tienda — DaxCloud se adapta a tu industria.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', borderRadius: '13px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,92,53,.4)', transition: 'all .2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 28px rgba(255,92,53,.5)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 4px 20px rgba(255,92,53,.4)'; }}>
                Empezar gratis <ArrowRight size={15} />
              </a>
              <a href="#precios" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 22px', background: 'transparent', color: '#4A7FAF', border: '1px solid rgba(30,58,95,.7)', borderRadius: '13px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', transition: 'all .2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2A5280'; el.style.background = 'rgba(30,58,95,.3)'; el.style.color = '#7BBEE8'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(30,58,95,.7)'; el.style.background = 'transparent'; el.style.color = '#4A7FAF'; }}>
                <Play size={13} /> Ver planes
              </a>
            </div>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[{ value: '14 días', label: 'Prueba gratis' }, { value: 'Sin tarjeta', label: 'No requerida' }, { value: '8+', label: 'Industrias' }, { value: 'SINPE', label: 'Pago local' }].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: '3px' }}>{s.value}</p>
                  <p style={{ fontSize: '10px', color: '#1E3A5F', letterSpacing: '.07em', textTransform: 'uppercase' as const }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: '0 0 auto', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px) translateX(20px)', transition: 'all 1s .15s cubic-bezier(.22,1,.36,1)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(ellipse at center,rgba(255,92,53,.12),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
              <POSMockup />
              <div style={{ position: 'absolute', top: '-12px', right: '-16px', background: 'linear-gradient(135deg,#3DBF7F,#22C55E)', borderRadius: '10px', padding: '8px 12px', boxShadow: '0 4px 16px rgba(61,191,127,.4)', animation: 'float 3s ease-in-out infinite' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: '1px' }}>₡11,700</p>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,.7)' }}>Venta procesada ✓</p>
              </div>
              <div style={{ position: 'absolute', bottom: '-10px', left: '-20px', background: 'rgba(10,18,30,0.92)', border: '1px solid rgba(30,58,95,.6)', borderRadius: '10px', padding: '8px 12px', backdropFilter: 'blur(10px)', animation: 'float 3s .5s ease-in-out infinite' }}>
                <p style={{ fontSize: '10px', color: '#5AAAF0', fontWeight: 700, marginBottom: '1px' }}>📊 Hoy</p>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>+₡85,200</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INDUSTRIAS ── */}
      <section style={{ padding: 'clamp(50px,6vh,80px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div ref={industriesReveal.ref} style={{ maxWidth: '1100px', margin: '0 auto', opacity: industriesReveal.visible ? 1 : 0, transform: industriesReveal.visible ? 'none' : 'translateY(16px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#2A5280', marginBottom: '24px' }}>Una plataforma, todas las industrias</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {INDUSTRIES.map(ind => {
              const Icon = ind.icon;
              return (
                <div key={ind.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '12px', background: `${ind.color}0A`, border: `1px solid ${ind.color}20`, transition: 'all .18s', cursor: 'default' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${ind.color}18`; el.style.borderColor = `${ind.color}45`; el.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${ind.color}0A`; el.style.borderColor = `${ind.color}20`; el.style.transform = 'none'; }}>
                  <Icon size={14} color={ind.color} strokeWidth={1.8} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: ind.color }}>{ind.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div ref={featuresReveal.ref} style={{ textAlign: 'center', marginBottom: '56px', opacity: featuresReveal.visible ? 1 : 0, transform: featuresReveal.visible ? 'none' : 'translateY(16px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#FF5C35', marginBottom: '14px' }}>Por qué DaxCloud</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-.02em' }}>Todo lo que tu negocio necesita</h2>
            <p style={{ fontSize: '15px', color: '#3A6A9A', maxWidth: '480px', margin: '0 auto', lineHeight: 1.75 }}>Sin módulos extra, sin costos ocultos. Todo incluido desde el primer día.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 80} />)}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div ref={stepsReveal.ref} style={{ opacity: stepsReveal.visible ? 1 : 0, transform: stepsReveal.visible ? 'none' : 'translateY(16px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#FF5C35', marginBottom: '14px' }}>Cómo funciona</p>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-.02em', marginBottom: '14px' }}>Listo en minutos</h2>
              <p style={{ fontSize: '15px', color: '#3A6A9A' }}>Tres pasos y tu negocio está en el aire.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '20px' }}>
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} style={{ padding: '28px 24px', background: 'rgba(22,34,53,0.5)', border: '1px solid rgba(30,58,95,.45)', borderRadius: '18px', backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '48px', fontWeight: 900, color: `${step.color}06`, lineHeight: 1, userSelect: 'none' as const }}>{step.num}</div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${step.color}15`, border: `1px solid ${step.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}><Icon size={22} color={step.color} strokeWidth={1.6} /></div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#F0F4FF', marginBottom: '10px', letterSpacing: '-.01em' }}>{step.title}</p>
                    <p style={{ fontSize: '13px', color: '#3A6A9A', lineHeight: 1.75 }}>{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARACIÓN ── */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div ref={comparisonReveal.ref} style={{ opacity: comparisonReveal.visible ? 1 : 0, transform: comparisonReveal.visible ? 'none' : 'translateY(16px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#FF5C35', marginBottom: '14px' }}>Comparación</p>
              <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-.02em' }}>¿Por qué no Excel o el POS de siempre?</h2>
            </div>
            <div style={{ background: 'rgba(16,26,42,.85)', border: '1px solid rgba(30,58,95,.5)', borderRadius: '20px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', padding: '14px 20px', borderBottom: '1px solid rgba(30,58,95,.5)', background: 'rgba(10,18,30,.5)' }}>
                <span style={{ fontSize: '11px', color: '#2A5280', fontWeight: 600 }}>Característica</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#FF5C35', textAlign: 'center' as const }}>DaxCloud</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2A5280', textAlign: 'center' as const }}>Excel</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2A5280', textAlign: 'center' as const }}>Otros POS</span>
              </div>
              {COMPARISON.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', padding: '12px 20px', borderBottom: i < COMPARISON.length - 1 ? '1px solid rgba(30,58,95,.25)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(30,58,95,.05)' }}>
                  <span style={{ fontSize: '13px', color: '#7BBEE8' }}>{row.feature}</span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {row.dax ? <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(61,191,127,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={11} color="#3DBF7F" strokeWidth={3} /></div>
                      : <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(224,80,80,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="#E05050" strokeWidth={2} /></div>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {row.excel ? <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(61,191,127,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={11} color="#3DBF7F" strokeWidth={3} /></div>
                      : <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(113,128,150,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="rgba(113,128,150,.4)" strokeWidth={2} /></div>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {row.other ? <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(61,191,127,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={11} color="#3DBF7F" strokeWidth={3} /></div>
                      : <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(113,128,150,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="rgba(113,128,150,.4)" strokeWidth={2} /></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div ref={testimonialsReveal.ref} style={{ opacity: testimonialsReveal.visible ? 1 : 0, transform: testimonialsReveal.visible ? 'none' : 'translateY(16px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#FF5C35', marginBottom: '14px' }}>Testimonios</p>
              <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-.02em' }}>Lo que dicen nuestros clientes</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} style={{ padding: '28px 24px', background: 'rgba(22,34,53,0.55)', border: '1px solid rgba(30,58,95,.45)', borderRadius: '18px', backdropFilter: 'blur(8px)' }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>{Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={13} color="#F0A030" fill="#F0A030" />)}</div>
                  <p style={{ fontSize: '14px', color: '#7BBEE8', lineHeight: 1.75, marginBottom: '20px', fontStyle: 'italic' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,92,53,.15)', border: '1px solid rgba(255,92,53,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF5C35' }}>{t.name[0]}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FF', lineHeight: 1, marginBottom: '2px' }}>{t.name}</p>
                      <p style={{ fontSize: '11px', color: '#2A5280' }}>{t.role} · {t.country}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#FF5C35', marginBottom: '14px' }}>Precios</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#F0F4FF', lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-.02em' }}>Simple y transparente</h2>
            <p style={{ fontSize: '15px', color: '#3A6A9A', marginBottom: '28px' }}>14 días gratis · Sin tarjeta · Pago por SINPE Móvil</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', padding: '10px 20px', background: 'rgba(10,18,30,.9)', borderRadius: '40px', border: '1px solid rgba(30,58,95,.6)' }}>
              <span style={{ fontSize: '13px', fontWeight: annual ? 400 : 700, color: !annual ? '#F0F4FF' : 'rgba(176,208,240,.4)', transition: 'all .2s' }}>Mensual</span>
              <div onClick={() => setAnnual(p => !p)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: annual ? '#FF5C35' : 'rgba(30,58,95,.8)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '3px', left: annual ? '20px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: annual ? 700 : 400, color: annual ? '#F0F4FF' : 'rgba(176,208,240,.4)', transition: 'all .2s' }}>Anual</span>
              {annual && <span style={{ fontSize: '11px', fontWeight: 700, color: '#3DBF7F', background: 'rgba(61,191,127,.12)', border: '1px solid rgba(61,191,127,.25)', padding: '3px 10px', borderRadius: '20px' }}>2 meses gratis</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
            {PLANS.map(plan => {
              const Icon = PLAN_ICONS[plan.name] ?? Shield;
              const price = annual ? plan.annualMonthly : plan.monthlyPrice;
              const saving = plan.monthlyPrice * 12 - plan.annualPrice;
              return (
                <div key={plan.name} style={{ padding: '28px 24px', borderRadius: '22px', position: 'relative', background: plan.popular ? `linear-gradient(145deg,rgba(255,92,53,.07),rgba(10,18,30,.96))` : 'rgba(16,26,42,.85)', border: `1.5px solid ${plan.popular ? 'rgba(255,92,53,.35)' : 'rgba(30,58,95,.5)'}`, backdropFilter: 'blur(12px)', transition: 'all .2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 16px 40px ${plan.color}18`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
                  {plan.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 16px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '.06em', textTransform: 'uppercase' as const, boxShadow: '0 4px 12px rgba(255,92,53,.5)' }}>⚡ Más popular</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', marginTop: plan.popular ? '8px' : '0' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${plan.color}28`, flexShrink: 0 }}><Icon size={18} color={plan.color} /></div>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#F0F4FF', lineHeight: 1, marginBottom: '2px' }}>{plan.label}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(176,208,240,.4)', lineHeight: 1 }}>{plan.limit}</p>
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '42px', fontWeight: 900, color: plan.color, lineHeight: 1, letterSpacing: '-.02em' }}>${price}</span>
                      <span style={{ fontSize: '13px', color: 'rgba(176,208,240,.4)', marginBottom: '7px' }}>/mes USD</span>
                    </div>
                    {annual ? <p style={{ fontSize: '11px', color: '#3DBF7F', fontWeight: 600 }}>${plan.annualPrice}/año · ahorras ${saving}</p>
                      : <p style={{ fontSize: '11px', color: 'rgba(176,208,240,.35)' }}>${plan.monthlyPrice * 12}/año facturado mensual</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '24px' }}>
                    {plan.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: feat.included ? `${plan.color}18` : 'rgba(30,58,95,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {feat.included ? <Check size={10} color={plan.color} strokeWidth={3} /> : <X size={9} color="rgba(113,128,150,.4)" strokeWidth={2} />}
                        </div>
                        <span style={{ fontSize: '12px', color: feat.included ? 'rgba(240,244,255,.75)' : 'rgba(113,128,150,.35)', textDecoration: feat.included ? 'none' : 'line-through' }}>{feat.text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '13px', background: plan.popular ? `linear-gradient(135deg,${plan.color},#FF3D1F)` : `${plan.color}18`, border: `1.5px solid ${plan.color}`, borderRadius: '13px', color: plan.popular ? '#fff' : plan.color, fontSize: '13px', fontWeight: 700, textDecoration: 'none', transition: 'all .15s' }}>
                      Empezar gratis <ArrowRight size={13} />
                    </a>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {/* SINPE - transferencia CR */}
                      <button onClick={() => setSinpePlan(plan as any)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px 8px', background: 'transparent', border: '1px solid rgba(30,58,95,.5)', borderRadius: '10px', color: 'rgba(176,208,240,.45)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'Outfit, sans-serif' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#3DBF7F'; el.style.color = '#3DBF7F'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(30,58,95,.5)'; el.style.color = 'rgba(176,208,240,.45)'; }}>
                        SINPE
                      </button>

                      {/* Pagadito - tarjeta CR + Latam */}
                      <button onClick={() => {
                        const amount = annual ? plan.annualMonthly : plan.monthlyPrice;
                        const params = new URLSearchParams({
                          plan: plan.name,
                          billing: annual ? 'annual' : 'monthly',
                          amount: String(amount),
                          method: 'pagadito',
                        });
                        window.location.href = `/register?${params.toString()}`;
                      }}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px 8px', background: 'transparent', border: '1px solid rgba(30,58,95,.5)', borderRadius: '10px', color: 'rgba(176,208,240,.45)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'Outfit, sans-serif' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#FF6B00'; el.style.color = '#FF6B00'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(30,58,95,.5)'; el.style.color = 'rgba(176,208,240,.45)'; }}>
                        Tarjeta
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Smartphone size={14} color="#3DBF7F" />
            <p style={{ fontSize: '13px', color: '#3DBF7F', fontWeight: 600 }}>SINPE Móvil (CR) · Tarjeta débito/crédito débito / crédito · Visa · Mastercard · Débito hábiles</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div ref={faqReveal.ref} style={{ opacity: faqReveal.visible ? 1 : 0, transform: faqReveal.visible ? 'none' : 'translateY(16px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: '#FF5C35', marginBottom: '14px' }}>FAQ</p>
              <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-.02em' }}>Preguntas frecuentes</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
            <div style={{ textAlign: 'center', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <MessageCircle size={14} color="#3A6A9A" />
              <p style={{ fontSize: '13px', color: '#3A6A9A' }}>¿Otra pregunta? Escríbenos a <a href="mailto:ventas@daxcloud.shop" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>ventas@daxcloud.shop</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: 'clamp(80px,10vh,120px) clamp(20px,5vw,80px)', borderTop: '1px solid rgba(30,58,95,.4)' }}>
        <div ref={ctaReveal.ref} style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', opacity: ctaReveal.visible ? 1 : 0, transform: ctaReveal.visible ? 'none' : 'translateY(20px)', transition: 'all .7s cubic-bezier(.22,1,.36,1)' }}>
          <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
            <svg width="56" height="42" viewBox="0 0 64 48" fill="none"><defs><linearGradient id="ctaCloud" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00" /><stop offset="45%" stopColor="#FF5C35" /><stop offset="100%" stopColor="#00C8D4" /></linearGradient></defs><path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z" fill="none" stroke="url(#ctaCloud)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" /></svg>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-.02em' }}>Listo para empezar</h2>
          <p style={{ fontSize: '16px', color: '#3A6A9A', marginBottom: '36px', lineHeight: 1.75 }}>14 días gratis, sin tarjeta de crédito. Configura tu negocio en menos de 2 minutos.</p>
          <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '16px 36px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', borderRadius: '14px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(255,92,53,.45)', transition: 'all .2s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 32px rgba(255,92,53,.55)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = '0 4px 24px rgba(255,92,53,.45)'; }}>
            Crear cuenta gratis <ArrowRight size={16} />
          </a>
          <p style={{ fontSize: '12px', color: '#1E3A5F', marginTop: '16px' }}>Sin compromisos · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(30,58,95,.4)', padding: '28px clamp(20px,5vw,80px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[{ label: 'Términos', href: '/terms' }, { label: 'Privacidad', href: '/privacy' }, { label: 'Login', href: '/login' }, { label: 'Registro', href: '/register' }].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: '12px', color: '#2A5280', textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#4A7FAF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}>
              {l.label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: '#162235' }}>© {new Date().getFullYear()} DaxCloud · by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 700 }}>jacana-dev.com</a></p>
      </footer>

      {sinpePlan && <SinpePaymentModal planName={sinpePlan.name} planLabel={sinpePlan.label} planColor={sinpePlan.color} monthlyPrice={sinpePlan.monthlyPrice} annualPrice={sinpePlan.annualPrice} onClose={() => setSinpePlan(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} html{scroll-behavior:smooth}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @media(min-width:768px){.nav-links{display:flex!important}}
      `}</style>
    </div>
  );
}



