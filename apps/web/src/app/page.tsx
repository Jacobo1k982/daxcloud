'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PLANS } from '@/lib/plans';
import { SinpePaymentModal } from '@/components/payments/SinpePaymentModal';
import { StructuredData } from '@/components/StructuredData';
import { DaxChat } from '@/components/DaxChat';
import { ManualModal } from '@/components/ManualModal';
import { analytics } from '@/components/Analytics';
import {
  Zap, BarChart2, Globe, Package, Users, Smartphone,
  ShoppingCart, ArrowRight, TrendingUp,
  Shield, BookOpen, CreditCard, Check, X, ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   CANVAS — Partículas de carbón con destellos rojo
───────────────────────────────────────────────────────────────────────────── */
function AtmosphericCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    let id: number, t = 0, W = 0, H = 0;
    const resize = () => { W = c.offsetWidth; H = c.offsetHeight; c.width = W; c.height = H; };
    const draw = () => {
      id = requestAnimationFrame(draw); t += .0015;
      ctx.clearRect(0, 0, W, H);
      // Orbe rojo primario — mueve lento
      const g1 = ctx.createRadialGradient(W * .12 + Math.sin(t * .7) * 100, H * .18 + Math.cos(t * .5) * 70, 0, W * .12 + Math.sin(t * .7) * 100, H * .18 + Math.cos(t * .5) * 70, W * .55);
      g1.addColorStop(0, `rgba(217,69,48,${.10 + .03 * Math.sin(t)})`);
      g1.addColorStop(.5, `rgba(163,52,31,${.04 + .01 * Math.sin(t)})`);
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
      // Orbe rojo secundario — esquina opuesta
      const g2 = ctx.createRadialGradient(W * .88 + Math.cos(t * .4) * 80, H * .78 + Math.sin(t * .6) * 60, 0, W * .88 + Math.cos(t * .4) * 80, H * .78 + Math.sin(t * .6) * 60, W * .4);
      g2.addColorStop(0, `rgba(217,69,48,${.06 + .02 * Math.cos(t * .9)})`);
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      // Centro tenue
      const g3 = ctx.createRadialGradient(W * .5, H * .45 + Math.sin(t * .3) * 40, 0, W * .5, H * .45, W * .3);
      g3.addColorStop(0, `rgba(217,69,48,${.03 + .01 * Math.sin(t * 1.2)})`);
      g3.addColorStop(1, 'transparent');
      ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);
    };
    resize(); draw();
    const ro = new ResizeObserver(resize); ro.observe(c);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}/>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ
───────────────────────────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(p => !p)}
      style={{ padding: '22px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', userSelect: 'none' as const }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
        <span style={{ fontSize: '15px', fontWeight: 400, color: open ? '#FAFAF8' : 'rgba(255,255,255,0.52)', lineHeight: 1.5, transition: 'color .2s', letterSpacing: '-.01em' }}>{q}</span>
        <span style={{ fontSize: '18px', color: open ? '#D94530' : 'rgba(217,69,48,0.35)', flexShrink: 0, transition: 'transform .3s, color .2s', transform: open ? 'rotate(45deg)' : 'none', lineHeight: 1, fontWeight: 300 }}>+</span>
      </div>
      {open && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.95, marginTop: '14px', fontWeight: 300 }}>{a}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT COUNTER — animación al entrar
───────────────────────────────────────────────────────────────────────────── */
function StatItem({ n, label, accent }: { n: string; label: string; accent?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: .3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ padding: '32px 28px', transition: 'background .2s', cursor: 'default' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(217,69,48,0.04)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
      <p style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-.04em', color: accent ? '#D94530' : '#FAFAF8', marginBottom: '8px', lineHeight: 1, opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(12px)', transition: 'opacity .7s, transform .7s' }}>{n}</p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', fontWeight: 300, lineHeight: 1.5, letterSpacing: '.01em' }}>{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LANDING
───────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const [annual, setAnnual] = useState(false);
  const [sinpePlan, setSinpePlan] = useState<typeof PLANS[number] | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const handlePagadito = (plan: typeof PLANS[number]) => {
    analytics.selectPlan(plan.name, annual ? plan.annualMonthly : plan.monthlyPrice, annual ? 'annual' : 'monthly');
    analytics.paymentMethodSelected('pagadito', plan.name);
    const amount = annual ? plan.annualMonthly : plan.monthlyPrice;
    const params = new URLSearchParams({ plan: plan.name, billing: annual ? 'annual' : 'monthly', amount: String(amount), method: 'pagadito' });
    window.location.href = '/register?' + params.toString();
  };

  const tr = (d = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'none' : 'translateY(28px)',
    transition: `opacity .9s ${d}s cubic-bezier(.22,1,.36,1), transform .9s ${d}s cubic-bezier(.22,1,.36,1)`,
  });

  /* ── TOKENS ── */
  const C = {
    bg:      '#090909',
    bg2:     '#101010',
    bg3:     '#161616',
    red:     '#D94530',
    redHot:  '#E8512A',
    redDim:  '#A3341F',
    cream:   '#FAFAF8',
    dim:     'rgba(255,255,255,0.10)',
    muted:   'rgba(255,255,255,0.36)',
    border:  'rgba(255,255,255,0.06)',
    borderR: 'rgba(217,69,48,0.2)',
    surf:    'rgba(255,255,255,0.022)',
  };

  const FEATURES = [
    { icon: Zap,        title: 'POS adaptativo',         desc: 'Se configura automáticamente para restaurante, panadería, farmacia, salón y más. Interfaz que se ajusta a tu flujo real.', tag: 'Ventas' },
    { icon: BarChart2,  title: 'Analytics en vivo',      desc: 'Ventas, horas pico y ticket promedio actualizados al instante. Dashboards ejecutivos con exportación a Excel y PDF.', tag: 'Reportes' },
    { icon: Globe,      title: 'Catálogo online',        desc: 'Página pública donde tus clientes hacen pedidos desde su celular sin instalar nada. Checkout nativo incluido.', tag: 'Online' },
    { icon: Package,    title: 'Inventario inteligente', desc: 'Alertas automáticas de stock bajo. Control de lotes, vencimientos y mermas en tiempo real.', tag: 'Inventario' },
    { icon: TrendingUp, title: 'Contabilidad PRO',       desc: 'Estado de resultados, declaración IVA y flujo de caja listos para tu contador. Sin trabajo manual.', tag: 'Finanzas' },
    { icon: Users,      title: 'CRM integrado',          desc: 'Historial de clientes, crédito interno y puntos de lealtad directamente en el POS. Sin apps externas.', tag: 'Clientes' },
  ];

  const INDUSTRIES = [
    { e: '🍽️', n: 'Restaurante' }, { e: '🥖', n: 'Panadería' }, { e: '💊', n: 'Farmacia' },
    { e: '✂️', n: 'Peluquería' }, { e: '👕', n: 'Ropa' }, { e: '🥬', n: 'Verdulería' },
    { e: '🛒', n: 'Supermercado' }, { e: '📦', n: 'Tienda' },
  ];

  const TRUST = [
    { icon: Shield,    text: 'Datos cifrados TLS/AES' },
    { icon: Globe,     text: 'Uptime 99.9% garantizado' },
    { icon: Smartphone, text: 'Funciona en cualquier dispositivo' },
    { icon: Users,     text: 'Soporte humano en español' },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: C.bg, minHeight: '100vh', overflowX: 'hidden', color: '#fff', position: 'relative' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        .serif { font-family: 'Instrument Serif', Georgia, serif !important; }

        /* Animaciones */
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.4)} }
        @keyframes fadein { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes scan   { 0%{top:-100%} 100%{top:200%} }

        /* Scrollbar elegante */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #090909; }
        ::-webkit-scrollbar-thumb { background: rgba(217,69,48,0.3); border-radius: 2px; }

        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #090909 inset!important; -webkit-text-fill-color:#fff!important; }

        /* Hover utils */
        .btn-red { transition: all .22s cubic-bezier(.22,1,.36,1) !important; }
        .btn-red:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 40px rgba(217,69,48,0.45) !important; }
        .feat-card { transition: border-color .2s, background .2s !important; }
        .feat-card:hover { border-color: rgba(217,69,48,0.25) !important; background: rgba(217,69,48,0.03) !important; }
        .ind-chip { transition: all .2s !important; }
        .ind-chip:hover { background: rgba(217,69,48,0.08) !important; border-color: rgba(217,69,48,0.3) !important; color: rgba(217,69,48,0.9) !important; transform: translateY(-2px) !important; }
        .price-card { transition: transform .22s, border-color .22s !important; }
        .price-card:hover { transform: translateY(-4px) !important; }

        /* Responsive */
        @media(max-width:768px){
          .nav-links        { display:none!important }
          .nav-login        { display:none!important }
          .hero-btns        { flex-direction:column!important; align-items:stretch!important }
          .hero-btns a,
          .hero-btns button { justify-content:center!important }
          .pos-sidebar      { display:none!important }
          .pos-cart         { display:none!important }
          .pos-body         { grid-template-columns:1fr!important }
          .stats-grid       { grid-template-columns:repeat(2,1fr)!important }
          .feat-grid        { grid-template-columns:1fr!important }
          .pricing-grid     { grid-template-columns:1fr!important }
          .footer-links     { display:none!important }
          .trust-grid       { grid-template-columns:repeat(2,1fr)!important }
          .hero-number      { display:none!important }
        }
        @media(max-width:480px){
          .stats-grid  { grid-template-columns:repeat(2,1fr)!important }
          .ind-grid    { gap:8px!important }
        }
      `}</style>

      <StructuredData/>

      {/* ═══════════════════════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,72px)',
        background: 'rgba(9,9,9,0.92)', backdropFilter: 'blur(28px) saturate(180%)',
        borderBottom: `1px solid ${C.border}`, gap: '16px',
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(217,69,48,0.09)', border: '1px solid rgba(217,69,48,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 64 48" fill="none">
              <defs><linearGradient id="lg" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#F07040"/><stop offset="50%" stopColor="#D94530"/><stop offset="100%" stopColor="#A3341F"/></linearGradient></defs>
              <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#lg)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-.03em', color: C.cream, lineHeight: 1.1 }}>
              Dax<span className="serif" style={{ fontStyle: 'italic', fontWeight: 400, color: C.red }}>cloud</span>
            </div>
            <div style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', lineHeight: 1 }}>Sistema POS</div>
          </div>
        </a>

        {/* Links */}
        <div className="nav-links" style={{ display: 'flex', gap: '2px', flex: 1, justifyContent: 'center' }}>
          {[['#features','Funciones'],['#industries','Industrias'],['#pricing','Precios']].map(([href,label]) => (
            <a key={href} href={href} style={{ color: C.muted, fontSize: '13px', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 400, letterSpacing: '-.01em', transition: 'color .15s, background .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#fff'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color=C.muted; (e.currentTarget as HTMLElement).style.background='transparent'; }}>{label}</a>
          ))}
          <button onClick={() => { analytics.openManual(); setShowManual(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: C.red, fontSize: '13px', padding: '7px 14px', borderRadius: '8px', background: 'rgba(217,69,48,0.06)', border: '1px solid rgba(217,69,48,0.14)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(217,69,48,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(217,69,48,0.06)'; }}>
            <BookOpen size={12}/> Manual
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
          <a href="/login" className="nav-login" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 400, color: C.muted, textDecoration: 'none', letterSpacing: '-.01em', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color='#fff')}
            onMouseLeave={e => (e.currentTarget.style.color=C.muted)}>Iniciar sesión</a>
          <a href="/register" className="btn-red" onClick={() => analytics.clickCTA('empezar_gratis','navbar')}
            style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: C.red, color: '#fff', textDecoration: 'none', letterSpacing: '-.01em', boxShadow: '0 2px 16px rgba(217,69,48,0.3)' }}>
            Empezar gratis
          </a>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(80px,12vh,140px) clamp(16px,5vw,72px) 0',
        minHeight: 'clamp(65vh,88vh,100vh)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <AtmosphericCanvas/>

        {/* Grid de líneas decorativas */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(217,69,48,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(217,69,48,0.04) 1px,transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }}/>

        {/* Número decorativo grande */}
        <div className="hero-number" style={{ position: 'absolute', right: '3%', top: '50%', transform: 'translateY(-50%)', fontSize: 'clamp(180px,22vw,320px)', fontWeight: 800, lineHeight: 1, color: 'rgba(217,69,48,0.04)', userSelect: 'none', pointerEvents: 'none', letterSpacing: '-.06em' }}>POS</div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', textAlign: 'center', ...tr(0) }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px 6px 10px', borderRadius: '2px', background: 'rgba(217,69,48,0.06)', border: '1px solid rgba(217,69,48,0.18)', marginBottom: '40px', fontSize: '11px', fontWeight: 500, color: 'rgba(217,69,48,0.8)', letterSpacing: '.1em', textTransform: 'uppercase' as const }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.red, animation: 'pulse 2s infinite' }}/>
            POS Cloud · América Latina · 14 días gratis
          </div>

          {/* Headline */}
          <h1 style={{ marginBottom: '28px', lineHeight: 1 }}>
            <span style={{ display: 'block', fontSize: 'clamp(14px,1.4vw,16px)', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>Sistema de punto de venta en la nube</span>
            <span className="serif" style={{ display: 'block', fontSize: 'clamp(52px,8.5vw,108px)', fontWeight: 400, fontStyle: 'italic', color: C.cream, letterSpacing: '-.03em', lineHeight: .92 }}>El sistema que</span>
            <span className="serif" style={{ display: 'block', fontSize: 'clamp(52px,8.5vw,108px)', fontWeight: 400, color: C.red, letterSpacing: '-.03em', lineHeight: .92, fontStyle: 'italic' }}>transforma</span>
            <span className="serif" style={{ display: 'block', fontSize: 'clamp(52px,8.5vw,108px)', fontWeight: 400, fontStyle: 'italic', color: C.cream, letterSpacing: '-.03em', lineHeight: .92 }}>tu negocio.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(15px,1.6vw,17px)', color: 'rgba(255,255,255,0.4)', lineHeight: 1.85, maxWidth: '520px', margin: '0 auto 48px', fontWeight: 300, letterSpacing: '-.01em' }}>
            Ventas, inventario, contabilidad y pedidos online en una sola plataforma. Sin hojas de cálculo. Sin sistemas lentos.
          </p>

          {/* CTAs */}
          <div className="hero-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: '80px' }}>
            <a href="/register" className="btn-red" onClick={() => analytics.clickCTA('comenzar_gratis','hero')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 34px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, background: C.red, color: '#fff', textDecoration: 'none', letterSpacing: '.01em', boxShadow: '0 4px 28px rgba(217,69,48,0.35)' }}>
              Comenzar gratis <ArrowRight size={15}/>
            </a>
            <button onClick={() => { analytics.openManual(); setShowManual(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 400, color: C.muted, border: `1px solid ${C.border}`, background: C.surf, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-.01em', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#fff'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.16)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color=C.muted; (e.currentTarget as HTMLElement).style.borderColor=C.border; }}>
              <BookOpen size={14}/> Ver manual
            </button>
          </div>

          {/* POS Mockup */}
          <div style={{ position: 'relative', maxWidth: '860px', margin: '0 auto', ...tr(.1) }}>
            <div style={{ position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '120px', background: 'radial-gradient(ellipse, rgba(217,69,48,0.18), transparent 70%)', pointerEvents: 'none' }}/>

            {/* Líneas de escaneo decorativas */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '14px 14px 0 0', pointerEvents: 'none', zIndex: 0 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(217,69,48,0.15),transparent)', animation: 'scan 4s linear infinite' }}/>
            </div>

            <div style={{ position: 'relative', zIndex: 1, background: 'rgba(9,9,9,0.98)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px 14px 0 0', overflow: 'hidden', boxShadow: '0 -8px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,69,48,0.08)' }}>
              {/* Barra navegador */}
              <div style={{ height: '36px', background: 'rgba(6,6,6,0.99)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {['#FF5F57','#FFBD2E','#28CA41'].map((col,i) => <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:col, opacity:.85 }}/>)}
                </div>
                <div style={{ flex:1, margin:'0 12px', background:'rgba(255,255,255,0.04)', borderRadius:'5px', height:'20px', display:'flex', alignItems:'center', padding:'0 10px', gap:'6px', fontSize:'10px', color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#3DBF7F', boxShadow:'0 0 6px #3DBF7F', flexShrink:0 }}/>
                  daxcloud.shop/pos
                </div>
              </div>

              {/* POS body */}
              <div className="pos-body" style={{ display:'grid', gridTemplateColumns:'190px 1fr 250px', minHeight:'340px' }}>

                {/* Sidebar */}
                <div className="pos-sidebar" style={{ background:'rgba(5,5,5,0.99)', borderRight:`1px solid ${C.border}`, padding:'12px 8px', display:'flex', flexDirection:'column', gap:'2px' }}>
                  <div style={{ padding:'10px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(217,69,48,0.1)', border:'1px solid rgba(217,69,48,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="12" height="9" viewBox="0 0 64 48" fill="none"><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="#D94530" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.8)', letterSpacing:'-.01em' }}>DaxPOS</span>
                  </div>
                  {[{icon:ShoppingCart,label:'Ventas',active:true},{icon:Package,label:'Inventario',active:false},{icon:BarChart2,label:'Analytics',active:false},{icon:Users,label:'Clientes',active:false}].map(({icon:Icon,label,active}) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'6px', fontSize:'11px', color:active?C.red:'rgba(255,255,255,0.28)', background:active?'rgba(217,69,48,0.08)':'transparent', border:active?'1px solid rgba(217,69,48,0.16)':'1px solid transparent' }}>
                      <Icon size={12}/>{label}
                    </div>
                  ))}
                  <div style={{ marginTop:'auto', padding:'10px', background:'rgba(217,69,48,0.06)', border:'1px solid rgba(217,69,48,0.12)', borderRadius:'7px' }}>
                    <p style={{ fontSize:'9px', color:'rgba(217,69,48,0.45)', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' as const, marginBottom:'3px' }}>Hoy</p>
                    <p style={{ fontSize:'18px', fontWeight:700, color:C.red, letterSpacing:'-.03em' }}>₡84,200</p>
                    <p style={{ fontSize:'9px', color:'rgba(61,191,127,0.7)', fontWeight:600, marginTop:'2px' }}>▲ +18.4%</p>
                  </div>
                </div>

                {/* Productos */}
                <div style={{ background:'rgba(8,8,8,0.99)', padding:'12px' }}>
                  <div style={{ display:'flex', gap:'4px', marginBottom:'10px', flexWrap:'wrap' as const }}>
                    {['Todos','Bebidas','Comidas','Postres'].map((cat,i) => (
                      <span key={cat} style={{ padding:'3px 10px', borderRadius:'3px', fontSize:'10px', fontWeight:500, background:i===0?'rgba(217,69,48,0.1)':'rgba(255,255,255,0.03)', color:i===0?C.red:'rgba(255,255,255,0.28)', border:i===0?'1px solid rgba(217,69,48,0.22)':'1px solid rgba(255,255,255,0.05)' }}>{cat}</span>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
                    {[{n:'Café',p:'₡1,200'},{n:'Croissant',p:'₡1,800'},{n:'Jugo',p:'₡2,400'},{n:'Almuerzo',p:'₡5,800'},{n:'Repostería',p:'₡2,200'},{n:'Agua',p:'₡800'}].map((pr,i) => (
                      <div key={i} style={{ padding:'10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'8px' }}>
                        <div style={{ width:'100%', aspectRatio:'1', background:'rgba(255,255,255,0.03)', borderRadius:'5px', marginBottom:'7px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <ShoppingCart size={12} color="rgba(217,69,48,0.28)"/>
                        </div>
                        <p style={{ fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.65)', marginBottom:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{pr.n}</p>
                        <p style={{ fontSize:'10px', fontWeight:700, color:C.red }}>{pr.p}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carrito */}
                <div className="pos-cart" style={{ background:'rgba(5,5,5,0.99)', borderLeft:`1px solid ${C.border}`, padding:'12px', display:'flex', flexDirection:'column', gap:'7px' }}>
                  <p style={{ fontSize:'9px', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.25)', marginBottom:'3px' }}>Orden actual</p>
                  {[{q:2,n:'Café Americano',a:'₡2,400'},{q:1,n:'Croissant',a:'₡1,800'},{q:3,n:'Agua 500ml',a:'₡2,400'}].map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 8px', background:'rgba(255,255,255,0.02)', borderRadius:'6px', border:`1px solid ${C.border}` }}>
                      <div style={{ width:'18px', height:'18px', borderRadius:'4px', background:'rgba(217,69,48,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:800, color:C.red, flexShrink:0 }}>{item.q}</div>
                      <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.45)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{item.n}</span>
                      <span style={{ fontSize:'9px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{item.a}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:'auto', borderTop:`1px solid ${C.border}`, paddingTop:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)' }}>Total</span>
                      <span style={{ fontSize:'18px', fontWeight:700, color:C.red, letterSpacing:'-.03em' }}>₡6,600</span>
                    </div>
                  </div>
                  <button style={{ width:'100%', padding:'9px', background:`linear-gradient(135deg,${C.red},${C.redDim})`, border:'none', borderRadius:'5px', color:'#fff', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.02em' }}>Cobrar ₡6,600</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', maxWidth:'1000px', margin:'100px auto 0', padding:'0 clamp(16px,5vw,72px)', background:C.border, borderRadius:'6px', overflow:'hidden', border:`1px solid ${C.border}` }}>
        <StatItem n="8+" label="Industrias soportadas" accent/>
        <StatItem n="14 días" label="Prueba gratis · sin tarjeta"/>
        <StatItem n="20+" label="Países de Latinoamérica" accent/>
        <StatItem n="∞" label="Ventas sin límite"/>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding:'120px clamp(20px,5vw,72px) 100px', maxWidth:'1200px', margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'48px', alignItems:'end', marginBottom:'72px' }}>
          <div>
            <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'rgba(217,69,48,0.5)', marginBottom:'16px' }}>Por qué DaxCloud</p>
            <h2 className="serif" style={{ fontSize:'clamp(32px,4.5vw,60px)', fontWeight:400, fontStyle:'italic', letterSpacing:'-.02em', color:C.cream, lineHeight:1.05 }}>
              Todo lo que necesitas,<br/><span style={{ color:C.red }}>sin lo que no.</span>
            </h2>
          </div>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.36)', maxWidth:'280px', lineHeight:1.85, fontWeight:300, textAlign:'right' as const }}>Sin módulos extra, sin costos ocultos. Todo incluido desde el primer día.</p>
        </div>

        {/* Grid */}
        <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:C.border, borderRadius:'8px', overflow:'hidden', border:`1px solid ${C.border}` }}>
          {FEATURES.map(({ icon:Icon, title, desc, tag }, i) => (
            <div key={title} className="feat-card" style={{ padding:'36px 32px', background:C.bg2, borderRadius:0, cursor:'default', position:'relative' }}
              onMouseEnter={() => setActiveFeature(i)}>
              {/* Tag */}
              <div style={{ position:'absolute', top:'24px', right:'24px', fontSize:'9px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(217,69,48,0.4)', border:'1px solid rgba(217,69,48,0.15)', borderRadius:'2px', padding:'3px 8px' }}>{tag}</div>
              <div style={{ width:'44px', height:'44px', borderRadius:'4px', background:'rgba(217,69,48,0.07)', border:'1px solid rgba(217,69,48,0.16)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px' }}>
                <Icon size={20} color={C.red} strokeWidth={1.5}/>
              </div>
              <h3 style={{ fontSize:'16px', fontWeight:500, color:C.cream, marginBottom:'10px', letterSpacing:'-.015em' }}>{title}</h3>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.36)', lineHeight:1.9, fontWeight:300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TRUST BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'28px clamp(20px,5vw,72px)', background:C.bg2 }}>
        <div className="trust-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', maxWidth:'960px', margin:'0 auto', background:C.border }}>
          {TRUST.map(({ icon:Icon, text }) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'16px 24px', background:C.bg2 }}>
              <Icon size={14} color="rgba(217,69,48,0.6)" strokeWidth={1.5}/>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontWeight:300 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INDUSTRIES
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="industries" style={{ padding:'100px clamp(20px,5vw,72px)', textAlign:'center' }}>
        <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'rgba(217,69,48,0.5)', marginBottom:'16px' }}>Industrias</p>
        <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,54px)', fontWeight:400, fontStyle:'italic', letterSpacing:'-.02em', color:C.cream, marginBottom:'48px', lineHeight:1.08 }}>
          Una plataforma. <span style={{ color:C.red }}>Cada negocio.</span>
        </h2>
        <div className="ind-grid" style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' as const, maxWidth:'680px', margin:'0 auto' }}>
          {INDUSTRIES.map(({ e, n }) => (
            <div key={n} className="ind-chip" style={{ display:'flex', alignItems:'center', gap:'9px', padding:'11px 20px', borderRadius:'3px', background:C.surf, border:`1px solid ${C.border}`, fontSize:'13px', fontWeight:400, color:'rgba(255,255,255,0.42)', cursor:'default' }}>
              <span style={{ fontSize:'16px' }}>{e}</span>{n}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding:'0 clamp(20px,5vw,72px) 100px', borderTop:`1px solid ${C.border}`, paddingTop:'100px' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'56px' }}>
          <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'rgba(217,69,48,0.5)', marginBottom:'16px' }}>Precios</p>
          <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,54px)', fontWeight:400, fontStyle:'italic', letterSpacing:'-.02em', color:C.cream, marginBottom:'14px', lineHeight:1.08 }}>
            Simple y <span style={{ color:C.red }}>transparente.</span>
          </h2>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.35)', marginBottom:'36px', fontWeight:300 }}>14 días gratis · Sin tarjeta · Cancela cuando quieras</p>

          {/* Toggle */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'12px', padding:'6px 8px', background:C.surf, border:`1px solid ${C.border}`, borderRadius:'4px' }}>
            <button onClick={() => setAnnual(false)} style={{ padding:'7px 18px', borderRadius:'3px', border:'none', background:!annual?'rgba(217,69,48,0.1)':'transparent', color:!annual?C.red:'rgba(255,255,255,0.36)', fontSize:'12px', fontWeight:!annual?500:400, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', letterSpacing:'-.01em' }}>Mensual</button>
            <div onClick={() => setAnnual(p => !p)} style={{ width:'38px', height:'20px', borderRadius:'2px', background:annual?C.red:'rgba(255,255,255,0.08)', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:'3px', left:annual?'19px':'3px', width:'14px', height:'14px', borderRadius:'1px', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.4)' }}/>
            </div>
            <button onClick={() => setAnnual(true)} style={{ padding:'7px 18px', borderRadius:'3px', border:'none', background:annual?'rgba(217,69,48,0.1)':'transparent', color:annual?C.red:'rgba(255,255,255,0.36)', fontSize:'12px', fontWeight:annual?500:400, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', display:'flex', alignItems:'center', gap:'7px', letterSpacing:'-.01em' }}>
              Anual <span style={{ fontSize:'10px', fontWeight:600, color:'#3DBF7F', background:'rgba(61,191,127,0.08)', border:'1px solid rgba(61,191,127,0.16)', padding:'2px 7px', borderRadius:'2px' }}>2 meses gratis</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1px', maxWidth:'960px', margin:'0 auto', background:C.border, borderRadius:'6px', overflow:'hidden', border:`1px solid ${C.border}` }}>
          {PLANS.map(plan => {
            const price = annual ? plan.annualMonthly : plan.monthlyPrice;
            return (
              <div key={plan.name} className="price-card" style={{ padding:'32px 28px', background:plan.popular?'rgba(217,69,48,0.05)':C.bg2, position:'relative', display:'flex', flexDirection:'column' }}>
                {plan.popular && (
                  <div style={{ position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)', background:C.red, color:'#fff', fontSize:'9px', fontWeight:600, padding:'3px 12px', borderRadius:'2px', letterSpacing:'.1em', textTransform:'uppercase' as const, whiteSpace:'nowrap' as const }}>⚡ Más popular</div>
                )}
                <p style={{ fontSize:'10px', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase' as const, color:plan.popular?C.red:'rgba(255,255,255,0.36)', marginBottom:'16px', marginTop:plan.popular?'8px':'0' }}>{plan.label}</p>
                <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', marginBottom:'6px' }}>
                  <span className="serif" style={{ fontSize:'56px', fontWeight:400, fontStyle:'italic', color:plan.popular?C.red:C.cream, letterSpacing:'-.04em', lineHeight:1 }}>${price}</span>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', marginBottom:'10px', fontWeight:300 }}>/mes</span>
                </div>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.32)', marginBottom:'24px', fontWeight:300 }}>{plan.limit}</p>
                <div style={{ height:'1px', background:C.border, marginBottom:'22px' }}/>
                <div style={{ display:'flex', flexDirection:'column', gap:'9px', flex:1, marginBottom:'26px' }}>
                  {plan.features.map((f: any, i: number) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'15px', height:'15px', borderRadius:'2px', background:f.included?'rgba(217,69,48,0.09)':'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {f.included ? <Check size={9} color={C.red} strokeWidth={2.5}/> : <X size={9} color="rgba(255,255,255,0.16)" strokeWidth={2}/>}
                      </div>
                      <span style={{ fontSize:'12px', color:f.included?'rgba(255,255,255,0.62)':'rgba(255,255,255,0.18)', fontWeight:300, textDecoration:f.included?'none':'line-through' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  <a href="/register" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'12px', background:plan.popular?C.red:'transparent', border:plan.popular?'none':`1px solid rgba(217,69,48,0.25)`, borderRadius:'3px', fontSize:'13px', fontWeight:500, color:plan.popular?'#fff':C.red, textDecoration:'none', transition:'all .2s', letterSpacing:'-.01em' }}>
                    {plan.cta} <ArrowRight size={13}/>
                  </a>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'2px 0' }}>
                    <div style={{ flex:1, height:'1px', background:C.border }}/>
                    <span style={{ fontSize:'10px', color:C.dim, letterSpacing:'.06em', textTransform:'uppercase' as const }}>o paga ahora</span>
                    <div style={{ flex:1, height:'1px', background:C.border }}/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                    <button onClick={() => { analytics.paymentMethodSelected('sinpe', plan.name); setSinpePlan(plan as any); }}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'9px 6px', background:'rgba(61,191,127,0.04)', border:'1px solid rgba(61,191,127,0.12)', borderRadius:'3px', cursor:'pointer', fontFamily:'inherit', transition:'border-color .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(61,191,127,0.32)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(61,191,127,0.12)'; }}>
                      <Smartphone size={11} color="#3DBF7F"/>
                      <span style={{ fontSize:'9px', fontWeight:600, color:'#3DBF7F', letterSpacing:'.04em' }}>SINPE</span>
                      <span style={{ fontSize:'8px', color:C.dim, fontWeight:300 }}>Solo CR</span>
                    </button>
                    <button onClick={() => handlePagadito(plan as any)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'9px 6px', background:'rgba(255,107,0,0.04)', border:'1px solid rgba(255,107,0,0.12)', borderRadius:'3px', cursor:'pointer', fontFamily:'inherit', transition:'border-color .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,107,0,0.32)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,107,0,0.12)'; }}>
                      <CreditCard size={11} color="#FF6B00"/>
                      <span style={{ fontSize:'9px', fontWeight:600, color:'#FF6B00', letterSpacing:'.04em' }}>TARJETA</span>
                      <span style={{ fontSize:'8px', color:C.dim, fontWeight:300 }}>Latinoamérica</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'11px', color:C.dim, fontWeight:300 }}>SINPE Móvil · Visa · Mastercard · Toda Latinoamérica</p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding:'100px clamp(20px,5vw,72px)', borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:'660px', margin:'0 auto' }}>
          <p style={{ textAlign:'center', fontSize:'11px', fontWeight:500, letterSpacing:'.16em', textTransform:'uppercase' as const, color:'rgba(217,69,48,0.5)', marginBottom:'16px' }}>FAQ</p>
          <h2 className="serif" style={{ textAlign:'center', fontSize:'clamp(26px,3.5vw,48px)', fontWeight:400, fontStyle:'italic', letterSpacing:'-.02em', color:C.cream, marginBottom:'48px', lineHeight:1.08 }}>
            Preguntas <span style={{ color:C.red }}>frecuentes.</span>
          </h2>
          <div style={{ borderTop:`1px solid ${C.border}` }}>
            {[
              { q:'¿Puedo cambiar de plan en cualquier momento?', a:'Sí, puedes subir o bajar de plan desde Configuración → Plan. El cambio es efectivo de forma inmediata.' },
              { q:'¿Qué pasa al terminar los 14 días de prueba?', a:'Te avisamos 3 días antes. Si no activas un plan, tu cuenta pasa a modo lectura y los datos se conservan 30 días.' },
              { q:'¿Qué industrias soporta DaxCloud?', a:'Tienda, restaurante, panadería, farmacia, peluquería, ropa, verdulería y supermercado. Cada módulo tiene funciones especializadas.' },
              { q:'¿Cómo funciona el pago por SINPE Móvil?', a:'Haces la transferencia, nos envías el comprobante y activamos tu plan en menos de 2 horas hábiles.' },
              { q:'¿Tiene módulo de contabilidad para mi contador?', a:'Sí. El módulo contable PRO incluye estado de resultados, declaración de IVA, flujo de caja y análisis de productos. Todo exportable a Excel y PDF.' },
            ].map((faq,i) => <FAQ key={i} q={faq.q} a={faq.a}/>)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding:'clamp(100px,14vh,160px) clamp(20px,5vw,72px)', textAlign:'center', borderTop:`1px solid ${C.border}`, position:'relative', overflow:'hidden', background:C.bg2 }}>
        {/* Fondo decorativo */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(217,69,48,0.03) 0,rgba(217,69,48,0.03) 1px,transparent 1px,transparent 40px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'350px', background:'radial-gradient(ellipse, rgba(217,69,48,0.07), transparent 65%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          {/* Número decorativo */}
          <div style={{ fontSize:'clamp(80px,16vw,200px)', fontWeight:800, color:'rgba(217,69,48,0.05)', lineHeight:.85, marginBottom:'-20px', letterSpacing:'-.06em', userSelect:'none' }}>START</div>

          <h2 className="serif" style={{ fontSize:'clamp(40px,6vw,80px)', fontWeight:400, fontStyle:'italic', letterSpacing:'-.03em', color:C.cream, marginBottom:'20px', lineHeight:1.02, position:'relative' }}>
            Empieza hoy.<br/><span style={{ color:C.red }}>Sin compromisos.</span>
          </h2>
          <p style={{ fontSize:'16px', color:'rgba(255,255,255,0.36)', marginBottom:'48px', lineHeight:1.85, fontWeight:300 }}>14 días gratis, sin tarjeta. Configura tu negocio en 2 minutos.</p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' as const }}>
            <a href="/register" className="btn-red" onClick={() => analytics.clickCTA('crear_cuenta_final','cta_final')}
              style={{ display:'inline-flex', alignItems:'center', gap:'9px', padding:'17px 40px', borderRadius:'4px', fontSize:'15px', fontWeight:500, background:C.red, color:'#fff', textDecoration:'none', letterSpacing:'.01em', boxShadow:'0 4px 32px rgba(217,69,48,0.35)' }}>
              Crear cuenta gratis <ArrowRight size={16}/>
            </a>
            <a href="#pricing" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'17px 28px', borderRadius:'4px', fontSize:'15px', fontWeight:400, color:C.muted, border:`1px solid ${C.border}`, textDecoration:'none', transition:'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='#fff'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color=C.muted; (e.currentTarget as HTMLElement).style.borderColor=C.border; }}>
              Ver planes <ChevronRight size={15}/>
            </a>
          </div>
          <p style={{ fontSize:'11px', color:C.dim, marginTop:'24px', fontWeight:300, letterSpacing:'.02em' }}>Sin contratos · Cancela cuando quieras · Soporte en español</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'28px clamp(20px,5vw,72px)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px', background:C.bg }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'22px', height:'22px', borderRadius:'5px', background:'rgba(217,69,48,0.07)', border:'1px solid rgba(217,69,48,0.16)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="10" height="8" viewBox="0 0 64 48" fill="none"><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="#D94530" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.28)', fontWeight:300 }}>
            Dax<span className="serif" style={{ fontStyle:'italic', color:'rgba(217,69,48,0.35)' }}>cloud</span>
            <span style={{ marginLeft:'8px', fontSize:'11px' }}>· by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color:'rgba(217,69,48,0.3)', textDecoration:'none' }}>jacana-dev.com</a></span>
          </span>
        </div>
        <div className="footer-links" style={{ display:'flex', gap:'20px' }}>
          {[['/', 'Inicio'], ['/pricing', 'Precios'], ['/login', 'Login'], ['/register', 'Registro']].map(([href, label]) => (
            <a key={label} href={href} style={{ fontSize:'12px', color:C.dim, textDecoration:'none', fontWeight:300, transition:'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.42)')}
              onMouseLeave={e => (e.currentTarget.style.color=C.dim)}>{label}</a>
          ))}
        </div>
        <span style={{ fontSize:'11px', color:C.dim, fontWeight:300 }}>© {new Date().getFullYear()} DaxCloud</span>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALES
      ═══════════════════════════════════════════════════════════════════ */}
      {sinpePlan && <SinpePaymentModal planName={sinpePlan.name} planLabel={sinpePlan.label} planColor={sinpePlan.color} monthlyPrice={sinpePlan.monthlyPrice} annualPrice={sinpePlan.annualPrice} onClose={() => setSinpePlan(null)}/>}
      {showManual && <ManualModal onClose={() => setShowManual(false)}/>}
      <DaxChat/>

    </div>
  );
}
