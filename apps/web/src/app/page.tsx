'use client';
import { useEffect, useRef, useState } from 'react';
import { PLANS } from '@/lib/plans';
import { SinpePaymentModal } from '@/components/payments/SinpePaymentModal';
import { StructuredData } from '@/components/StructuredData';
import { DaxChat } from '@/components/DaxChat';
import { ManualModal } from '@/components/ManualModal';
import { analytics } from '@/components/Analytics';
import {
  Zap, BarChart2, Globe, Package, Users, Smartphone,
  ShoppingCart, ArrowRight, ChevronDown, TrendingUp,
  Shield, BookOpen, CreditCard, Check, X,
} from 'lucide-react';

/* ── Canvas de grano atmosférico ─────────────────────────────────────────── */
function AtmosphericCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    let id: number, t = 0, W = 0, H = 0;
    const resize = () => { W = c.offsetWidth; H = c.offsetHeight; c.width = W; c.height = H; };
    const orb = (cx: number, cy: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    };
    const animate = () => {
      id = requestAnimationFrame(animate); t += .002;
      ctx.clearRect(0, 0, W, H);
      orb(W * .15 + Math.sin(t * .6) * 120, H * .2 + Math.cos(t * .4) * 80, W * .5, `rgba(255,92,53,${.055 + .02 * Math.sin(t)})`);
      orb(W * .85 + Math.cos(t * .5) * 80, H * .75 + Math.sin(t * .7) * 60, W * .45, `rgba(18,36,60,${.09 + .02 * Math.cos(t * .8)})`);
      orb(W * .5 + Math.sin(t * .3) * 60, H * .5, W * .35, `rgba(255,92,53,${.025 + .01 * Math.sin(t * 1.4)})`);
    };
    resize(); animate();
    const ro = new ResizeObserver(resize); ro.observe(c);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);
  return (
    <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}/>
  );
}

/* ── Línea separadora editorial ──────────────────────────────────────────── */
function Divider({ accent = false }: { accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '0' }}>
      <div style={{ flex: 1, height: '1px', background: accent ? 'linear-gradient(90deg,rgba(255,92,53,0.5),rgba(255,92,53,0.05))' : 'rgba(255,255,255,0.07)' }}/>
    </div>
  );
}

/* ── FAQ acordeón ────────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(p => !p)} style={{ padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', userSelect: 'none' as const }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 400, color: open ? '#F5EEE6' : 'rgba(255,255,255,0.55)', lineHeight: 1.5, transition: 'color .2s' }}>{q}</span>
        <span style={{ fontFamily: "'Playfair Display', serif", color: open ? '#FF5C35' : 'rgba(255,92,53,0.4)', fontSize: '20px', flexShrink: 0, transition: 'transform .3s', transform: open ? 'rotate(45deg)' : 'none', lineHeight: 1 }}>+</span>
      </div>
      {open && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.9, marginTop: '14px', fontWeight: 300 }}>{a}</p>}
    </div>
  );
}

/* ── LANDING PAGE ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [annual,     setAnnual]     = useState(false);
  const [sinpePlan,  setSinpePlan]  = useState<typeof PLANS[number] | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [mounted,    setMounted]    = useState(false);

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
    transform: mounted ? 'none' : 'translateY(24px)',
    transition: `opacity .9s ${d}s cubic-bezier(.22,1,.36,1), transform .9s ${d}s cubic-bezier(.22,1,.36,1)`,
  });

  /* Tokens */
  const C = {
    bg:     '#080C14',
    coral:  '#FF5C35',
    dim:    'rgba(255,255,255,0.12)',
    muted:  'rgba(255,255,255,0.38)',
    border: 'rgba(255,255,255,0.07)',
    surf:   'rgba(255,255,255,0.025)',
  };

  const FEATURES = [
    { icon: Zap,        title: 'POS adaptativo',          desc: 'Se configura automáticamente para restaurante, panadería, farmacia, salón y más.' },
    { icon: BarChart2,  title: 'Analytics en vivo',       desc: 'Ventas, horas pico y ticket promedio actualizados al instante desde cualquier dispositivo.' },
    { icon: Globe,      title: 'Catálogo online',         desc: 'Página pública donde tus clientes hacen pedidos desde su celular sin descargar nada.' },
    { icon: Package,    title: 'Inventario inteligente',  desc: 'Alertas automáticas de stock bajo. Control de lotes, vencimientos y mermas.' },
    { icon: TrendingUp, title: 'Contabilidad PRO',        desc: 'Estado de resultados, declaración IVA y flujo de caja listos para tu contador.' },
    { icon: Users,      title: 'Clientes y fidelización', desc: 'Historial, crédito interno y puntos de lealtad integrados directamente en el POS.' },
  ];

  const INDUSTRIES = [
    '🍽️ Restaurante', '🥖 Panadería', '💊 Farmacia', '✂️ Peluquería',
    '👕 Ropa', '🥬 Verdulería', '🛒 Supermercado', '📦 Tienda',
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', overflowX: 'hidden', color: '#fff', position: 'relative' }}>

      {/* ── FUENTES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;1,300&display=swap');
        html { scroll-behavior: smooth; }
        * { font-family: 'DM Sans', system-ui, sans-serif; }
        .serif { font-family: 'Playfair Display', Georgia, serif !important; }
        @keyframes float   { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-7px)}    }
        @keyframes shimmer { 0%{transform:translateX(-100%)}     100%{transform:translateX(100%)}   }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.3)} }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 100px #080C14 inset!important; -webkit-text-fill-color:#fff!important; }
        /* ── RESPONSIVE MOBILE S24 ── */
        @media(max-width:768px){
          /* Nav */
          .nav-links            { display:none!important }
          .nav-login            { display:none!important }

          /* Hero */
          .hero-btns            { flex-direction:column!important; align-items:stretch!important }
          .hero-btns a,
          .hero-btns button     { justify-content:center!important }

          /* POS Mockup — ocultar sidebar y carrito, solo productos */
          .pos-sidebar          { display:none!important }
          .pos-cart             { display:none!important }
          .pos-body             { grid-template-columns:1fr!important }

          /* Stats */
          .stats-grid           { grid-template-columns:repeat(2,1fr)!important; margin:40px auto!important }

          /* Features */
          .feat-grid            { grid-template-columns:1fr!important }

          /* Pricing grid — apilar verticalmente */
          .pricing-grid         { grid-template-columns:1fr!important; border-radius:6px!important }

          /* Footer */
          .footer-links         { display:none!important }
        }

        @media(max-width:480px){
          .stats-grid           { grid-template-columns:repeat(2,1fr)!important }
          .industries-wrap      { gap:7px!important }
        }
      `}</style>

      <StructuredData/>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(16px,5vw,72px)', background: 'rgba(8,12,20,0.94)', backdropFilter: 'blur(24px)', borderBottom: `1px solid ${C.border}`, gap: '16px' }}>

        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,92,53,0.1)', border: '1px solid rgba(255,92,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 64 48" fill="none">
              <defs><linearGradient id="nl" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
              <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#nl)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '17px', letterSpacing: '-.02em', color: '#fff' }}>
            Dax<span className="serif" style={{ fontStyle: 'italic', fontWeight: 400, color: C.coral }}>cloud</span>
          </span>
        </a>

        <div className="nav-links" style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center' }}>
          {[['#features', 'Funciones'], ['#industries', 'Industrias'], ['#pricing', 'Precios']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: C.muted, fontSize: '13px', padding: '7px 14px', borderRadius: '7px', textDecoration: 'none', fontWeight: 400, letterSpacing: '-.01em', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{label}</a>
          ))}
          <button onClick={() => { analytics.openManual(); setShowManual(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: C.coral, fontSize: '13px', padding: '7px 14px', borderRadius: '7px', background: 'rgba(255,92,53,0.06)', border: '1px solid rgba(255,92,53,0.14)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'all .15s' }}>
            <BookOpen size={13}/> Manual
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <a href="/login" className="nav-login" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 400, color: C.muted, textDecoration: 'none', transition: 'color .15s', letterSpacing: '-.01em' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>Iniciar sesión</a>
          <a href="/register" onClick={() => analytics.clickCTA('empezar_gratis', 'navbar')}
            style={{ padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: C.coral, color: '#fff', textDecoration: 'none', letterSpacing: '-.01em', transition: 'all .2s', boxShadow: `0 2px 14px rgba(255,92,53,0.28)` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(255,92,53,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 14px rgba(255,92,53,0.28)'; }}>
            Empezar gratis
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(48px,10vh,130px) clamp(16px,5vw,72px) 0', textAlign: 'center', minHeight: 'clamp(60vh,85vh,100vh)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <AtmosphericCanvas/>

        {/* Ruido de grano sutil */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")', pointerEvents: 'none', opacity: 0.5 }}/>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', ...tr(0) }}>

          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '2px', background: 'rgba(255,92,53,0.07)', border: '1px solid rgba(255,92,53,0.18)', marginBottom: '36px', fontSize: '11px', fontWeight: 500, color: 'rgba(255,92,53,0.85)', letterSpacing: '.08em', textTransform: 'uppercase' as const }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.coral, animation: 'pulse 2s infinite' }}/>
            POS cloud · América Latina · 14 días gratis
          </div>

          {/* Headline editorial */}
          <h1 className="serif" style={{ fontSize: 'clamp(44px,7.5vw,92px)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-.02em', marginBottom: '28px', color: '#F5EEE6' }}>
            El sistema que{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: C.coral }}>transforma</em>
            <br/>tu negocio.
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(15px,1.8vw,18px)', color: 'rgba(255,255,255,0.42)', lineHeight: 1.9, maxWidth: '540px', margin: '0 auto 48px', fontWeight: 300, letterSpacing: '-.01em' }}>
            Ventas, inventario, contabilidad y pedidos online en una sola plataforma. Sin hojas de cálculo. Sin sistemas lentos.
          </p>

          {/* CTAs */}
          <div className="hero-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
            <a href="/register" onClick={() => analytics.clickCTA('comenzar_gratis', 'hero')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 32px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, background: C.coral, color: '#fff', textDecoration: 'none', letterSpacing: '.01em', transition: 'all .25s', boxShadow: `0 4px 28px rgba(255,92,53,0.32)` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 36px rgba(255,92,53,0.48)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 28px rgba(255,92,53,0.32)'; }}>
              Comenzar gratis <ArrowRight size={15}/>
            </a>
            <button onClick={() => { analytics.openManual(); setShowManual(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 400, color: C.muted, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-.01em', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.muted; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
              <BookOpen size={14}/> Ver manual
            </button>
          </div>

          {/* POS mockup editorial */}
          <div style={{ position: 'relative', maxWidth: '820px', margin: '0 auto', ...tr(.1) }}>
            {/* Glow bajo */}
            <div style={{ position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '120px', background: `radial-gradient(ellipse, rgba(255,92,53,0.18), transparent 70%)`, pointerEvents: 'none' }}/>
            {/* Frame */}
            <div style={{ background: 'rgba(10,16,28,0.97)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '14px 14px 0 0', overflow: 'hidden', boxShadow: '0 -4px 48px rgba(0,0,0,0.5)' }}>
              {/* Browser bar */}
              <div style={{ height: '36px', background: 'rgba(8,12,20,0.99)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {['#FF5F57','#FFBD2E','#28CA41'].map((c,i) => <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }}/>)}
                </div>
                <div style={{ flex:1, margin:'0 12px', background:'rgba(255,255,255,0.04)', borderRadius:'5px', height:'20px', display:'flex', alignItems:'center', padding:'0 10px', fontSize:'10px', color:'rgba(255,255,255,0.28)', fontFamily:'monospace' }}>
                  daxcloud.shop/pos
                </div>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#3DBF7F', boxShadow:'0 0 5px #3DBF7F' }}/>
              </div>
              {/* POS grid */}
              <div className="pos-body" style={{ display:'grid', gridTemplateColumns:'180px 1fr 240px', minHeight:'320px' }}>
                {/* Sidebar */}
                <div className="pos-sidebar" style={{ background:'rgba(7,11,19,0.99)', borderRight:`1px solid ${C.border}`, padding:'12px 8px', display:'flex', flexDirection:'column', gap:'3px' }}>
                  <div style={{ padding:'9px 10px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:'rgba(255,92,53,0.12)', border:'1px solid rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="11" height="8" viewBox="0 0 64 48" fill="none"><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="#FF5C35" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ fontSize:'12px', fontWeight:600, color:'#fff', fontFamily:"'DM Sans',sans-serif" }}>DaxPOS</span>
                  </div>
                  {[{icon:ShoppingCart,label:'Ventas',active:true},{icon:Package,label:'Inventario',active:false},{icon:BarChart2,label:'Analytics',active:false},{icon:Users,label:'Clientes',active:false}].map(({icon:Icon,label,active}) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'7px', fontSize:'11px', color: active?C.coral:'rgba(255,255,255,0.3)', background: active?'rgba(255,92,53,0.08)':'transparent', border: active?'1px solid rgba(255,92,53,0.16)':'1px solid transparent' }}>
                      <Icon size={13}/>{label}
                    </div>
                  ))}
                  <div style={{ marginTop:'auto', padding:'10px', background:'rgba(255,92,53,0.06)', border:'1px solid rgba(255,92,53,0.12)', borderRadius:'7px' }}>
                    <p style={{ fontSize:'9px', color:'rgba(255,92,53,0.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' as const, marginBottom:'3px' }}>Hoy</p>
                    <p style={{ fontSize:'15px', fontWeight:800, color:C.coral, letterSpacing:'-.02em', fontFamily:"'DM Sans',sans-serif" }}>₡84,200</p>
                    <p style={{ fontSize:'9px', color:'rgba(61,191,127,0.7)', fontWeight:600, marginTop:'2px' }}>▲ +18.4%</p>
                  </div>
                </div>
                {/* Productos */}
                <div style={{ background:'rgba(9,14,24,0.99)', padding:'10px' }}>
                  <div style={{ display:'flex', gap:'4px', marginBottom:'8px', flexWrap:'wrap' as const }}>
                    {['Todos','Bebidas','Comidas','Postres'].map((cat,i) => (
                      <span key={cat} style={{ padding:'3px 9px', borderRadius:'3px', fontSize:'10px', fontWeight:500, background: i===0?'rgba(255,92,53,0.1)':'rgba(255,255,255,0.03)', color: i===0?C.coral:'rgba(255,255,255,0.3)', border: i===0?'1px solid rgba(255,92,53,0.22)':'1px solid rgba(255,255,255,0.06)' }}>{cat}</span>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
                    {[{n:'Café',p:'₡1,200'},{n:'Croissant',p:'₡1,800'},{n:'Jugo',p:'₡2,400'},{n:'Almuerzo',p:'₡5,800'},{n:'Repostería',p:'₡2,200'},{n:'Agua',p:'₡800'}].map((pr,i) => (
                      <div key={i} style={{ padding:'9px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px' }}>
                        <div style={{ width:'100%', aspectRatio:'1', background:'rgba(255,255,255,0.03)', borderRadius:'5px', marginBottom:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <ShoppingCart size={13} color="rgba(255,92,53,0.3)"/>
                        </div>
                        <p style={{ fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{pr.n}</p>
                        <p style={{ fontSize:'10px', fontWeight:700, color:C.coral }}>{pr.p}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Carrito */}
                <div className="pos-cart" style={{ background:'rgba(7,11,19,0.99)', borderLeft:`1px solid ${C.border}`, padding:'12px', display:'flex', flexDirection:'column', gap:'7px' }}>
                  <p style={{ fontSize:'9px', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)', marginBottom:'2px' }}>Orden actual</p>
                  {[{q:2,n:'Café Americano',a:'₡2,400'},{q:1,n:'Croissant',a:'₡1,800'},{q:3,n:'Agua 500ml',a:'₡2,400'}].map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 8px', background:'rgba(255,255,255,0.025)', borderRadius:'6px', border:`1px solid ${C.border}` }}>
                      <div style={{ width:'17px', height:'17px', borderRadius:'4px', background:'rgba(255,92,53,0.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:800, color:C.coral, flexShrink:0 }}>{item.q}</div>
                      <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.5)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{item.n}</span>
                      <span style={{ fontSize:'9px', fontWeight:700, color:'#fff' }}>{item.a}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:'auto', padding:'9px', background:'rgba(255,92,53,0.07)', border:'1px solid rgba(255,92,53,0.14)', borderRadius:'7px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.5)' }}>Total</span>
                      <span style={{ fontSize:'16px', fontWeight:900, color:C.coral, letterSpacing:'-.02em', fontFamily:"'DM Sans',sans-serif" }}>₡6,600</span>
                    </div>
                  </div>
                  <button style={{ width:'100%', padding:'9px', background:`linear-gradient(135deg,${C.coral},#FF3D1F)`, border:'none', borderRadius:'6px', color:'#fff', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cobrar ₡6,600</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', maxWidth:'960px', margin:'80px auto', padding:'0 clamp(16px,5vw,72px)', background:C.border, borderRadius:'6px', overflow:'hidden', border:`1px solid ${C.border}` }}>
        {[
          { n:'8+',    l:'Industrias soportadas',         c:C.coral },
          { n:'14 días',l:'Prueba gratis · sin tarjeta',  c:'#F5EEE6' },
          { n:'20+',   l:'Países de Latinoamérica',       c:C.coral },
          { n:'∞',     l:'Ventas sin límite',              c:'#F5EEE6' },
        ].map(({ n, l, c }) => (
          <div key={l} style={{ padding:'28px 24px', background:C.bg, transition:'background .2s', cursor:'default' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.03)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=C.bg; }}>
            <p className="serif" style={{ fontSize:'34px', fontWeight:700, letterSpacing:'-.03em', color:c, marginBottom:'6px', lineHeight:1 }}>{n}</p>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', fontWeight:300, lineHeight:1.4 }}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:'0 clamp(20px,5vw,72px) 80px', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'56px' }}>
          <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'.14em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.55)', marginBottom:'16px' }}>Por qué DaxCloud</p>
          <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,52px)', fontWeight:700, letterSpacing:'-.02em', color:'#F5EEE6', marginBottom:'16px', lineHeight:1.08 }}>
            Todo lo que necesitas,<br/><em style={{ fontStyle:'italic', fontWeight:400, color:C.coral }}>sin lo que no.</em>
          </h2>
          <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.38)', maxWidth:'460px', margin:'0 auto', lineHeight:1.85, fontWeight:300 }}>Sin módulos extra, sin costos ocultos. Todo incluido desde el primer día.</p>
        </div>

        <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:C.border, borderRadius:'8px', overflow:'hidden', border:`1px solid ${C.border}` }}>
          {FEATURES.map(({ icon:Icon, title, desc }) => (
            <div key={title} style={{ padding:'32px 28px', background:C.bg, transition:'background .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.025)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=C.bg; }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'4px', background:'rgba(255,92,53,0.07)', border:'1px solid rgba(255,92,53,0.18)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px' }}>
                <Icon size={19} color={C.coral} strokeWidth={1.6}/>
              </div>
              <h3 style={{ fontSize:'15px', fontWeight:500, color:'#F5EEE6', marginBottom:'10px', letterSpacing:'-.01em', fontFamily:"'DM Sans',sans-serif" }}>{title}</h3>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.38)', lineHeight:1.85, fontWeight:300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── INDUSTRIES ── */}
      <section id="industries" style={{ padding:'80px clamp(20px,5vw,72px)', borderTop:`1px solid ${C.border}`, textAlign:'center' }}>
        <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'.14em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.55)', marginBottom:'16px' }}>Industrias</p>
        <h2 className="serif" style={{ fontSize:'clamp(24px,3vw,44px)', fontWeight:700, letterSpacing:'-.02em', color:'#F5EEE6', marginBottom:'40px', lineHeight:1.1 }}>
          Una plataforma. <em style={{ fontStyle:'italic', fontWeight:400, color:C.coral }}>Cada negocio.</em>
        </h2>
        <div className="industries-wrap" style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
          {INDUSTRIES.map(ind => (
            <div key={ind} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'3px', background:C.surf, border:`1px solid ${C.border}`, fontSize:'13px', fontWeight:400, color:'rgba(255,255,255,0.45)', transition:'all .2s', cursor:'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.06)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.22)'; (e.currentTarget as HTMLElement).style.color='rgba(255,92,53,0.9)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=C.surf; (e.currentTarget as HTMLElement).style.borderColor=C.border; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'; }}>
              {ind}
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding:'80px clamp(20px,5vw,72px)', borderTop:`1px solid ${C.border}` }}>
        <div style={{ textAlign:'center', marginBottom:'52px' }}>
          <p style={{ fontSize:'11px', fontWeight:500, letterSpacing:'.14em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.55)', marginBottom:'16px' }}>Precios</p>
          <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,52px)', fontWeight:700, letterSpacing:'-.02em', color:'#F5EEE6', marginBottom:'14px', lineHeight:1.08 }}>
            Simple y <em style={{ fontStyle:'italic', fontWeight:400, color:C.coral }}>transparente.</em>
          </h2>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.38)', marginBottom:'32px', fontWeight:300 }}>14 días gratis · Sin tarjeta · Cancela cuando quieras</p>
          {/* Toggle */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'12px', padding:'7px 9px', background:'rgba(255,255,255,0.025)', border:`1px solid ${C.border}`, borderRadius:'3px' }}>
            <button onClick={() => setAnnual(false)} style={{ padding:'6px 16px', borderRadius:'2px', border:'none', background:!annual?'rgba(255,92,53,0.1)':'transparent', color:!annual?C.coral:'rgba(255,255,255,0.4)', fontSize:'12px', fontWeight:!annual?500:400, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', letterSpacing:'-.01em' }}>Mensual</button>
            <div onClick={() => setAnnual(p => !p)} style={{ width:'40px', height:'22px', borderRadius:'2px', background: annual?C.coral:'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:'3px', left: annual?'20px':'3px', width:'16px', height:'16px', borderRadius:'1px', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.3)' }}/>
            </div>
            <button onClick={() => setAnnual(true)} style={{ padding:'6px 16px', borderRadius:'2px', border:'none', background: annual?'rgba(255,92,53,0.1)':'transparent', color: annual?C.coral:'rgba(255,255,255,0.4)', fontSize:'12px', fontWeight: annual?500:400, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', display:'flex', alignItems:'center', gap:'6px', letterSpacing:'-.01em' }}>
              Anual <span style={{ fontSize:'10px', fontWeight:600, color:'#3DBF7F', background:'rgba(61,191,127,0.1)', border:'1px solid rgba(61,191,127,0.18)', padding:'2px 7px', borderRadius:'2px' }}>2 meses gratis</span>
            </button>
          </div>
        </div>

        <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1px', maxWidth:'960px', margin:'0 auto', background:C.border, borderRadius:'6px', overflow:'hidden', border:`1px solid ${C.border}` }}>
          {PLANS.map(plan => {
            const price = annual ? plan.annualMonthly : plan.monthlyPrice;
            return (
              <div key={plan.name} style={{ padding:'28px 26px', background: plan.popular?'rgba(255,92,53,0.04)':C.bg, position:'relative', display:'flex', flexDirection:'column', transition:'background .2s' }}
                onMouseEnter={e => { if(!plan.popular)(e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.02)'; }}
                onMouseLeave={e => { if(!plan.popular)(e.currentTarget as HTMLElement).style.background=C.bg; }}>
                {plan.popular && <div style={{ position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)', background:C.coral, color:'#fff', fontSize:'9px', fontWeight:600, padding:'3px 12px', borderRadius:'2px', letterSpacing:'.08em', textTransform:'uppercase' as const, whiteSpace:'nowrap' as const }}>⚡ Más popular</div>}
                <p style={{ fontSize:'10px', fontWeight:500, letterSpacing:'.1em', textTransform:'uppercase' as const, color: plan.popular?C.coral:'rgba(255,255,255,0.4)', marginBottom:'14px', marginTop: plan.popular?'8px':'0' }}>{plan.label}</p>
                <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', marginBottom:'6px' }}>
                  <span className="serif" style={{ fontSize:'52px', fontWeight:700, color: plan.popular?C.coral:'#F5EEE6', letterSpacing:'-.03em', lineHeight:1 }}>${price}</span>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginBottom:'10px', fontWeight:300 }}>/mes</span>
                </div>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginBottom:'22px', fontWeight:300 }}>{plan.limit}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', flex:1, marginBottom:'24px' }}>
                  {plan.features.map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'14px', height:'14px', borderRadius:'2px', background: f.included?'rgba(255,92,53,0.1)':'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {f.included
                          ? <Check size={9} color={C.coral} strokeWidth={2.5}/>
                          : <X size={9} color="rgba(255,255,255,0.18)" strokeWidth={2}/>
                        }
                      </div>
                      <span style={{ fontSize:'12px', color: f.included?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.2)', fontWeight:300, textDecoration: f.included?'none':'line-through' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  <a href="/register" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'12px', background: plan.popular?C.coral:'transparent', border: plan.popular?'none':`1px solid ${plan.color}30`, borderRadius:'3px', fontSize:'13px', fontWeight:500, color: plan.popular?'#fff':plan.color, textDecoration:'none', transition:'all .2s', letterSpacing:'-.01em' }}>
                    {plan.cta} <ArrowRight size={13}/>
                  </a>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ flex:1, height:'1px', background:C.border }}/>
                    <span style={{ fontSize:'10px', color:C.dim, letterSpacing:'.06em', textTransform:'uppercase' as const }}>o paga ahora</span>
                    <div style={{ flex:1, height:'1px', background:C.border }}/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
                    <button onClick={() => { analytics.paymentMethodSelected('sinpe', plan.name); setSinpePlan(plan as any); }}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'8px 6px', background:'rgba(61,191,127,0.04)', border:'1px solid rgba(61,191,127,0.13)', borderRadius:'3px', cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(61,191,127,0.35)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(61,191,127,0.13)'; }}>
                      <Smartphone size={11} color="#3DBF7F"/>
                      <span style={{ fontSize:'9px', fontWeight:600, color:'#3DBF7F', letterSpacing:'.04em' }}>SINPE</span>
                      <span style={{ fontSize:'8px', color:C.dim, fontWeight:300 }}>Solo CR</span>
                    </button>
                    <button onClick={() => handlePagadito(plan as any)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'8px 6px', background:'rgba(255,107,0,0.04)', border:'1px solid rgba(255,107,0,0.13)', borderRadius:'3px', cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,107,0,0.35)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,107,0,0.13)'; }}>
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

      {/* ── FAQ ── */}
      <section style={{ padding:'80px clamp(20px,5vw,72px)', borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:'680px', margin:'0 auto' }}>
          <p style={{ textAlign:'center', fontSize:'11px', fontWeight:500, letterSpacing:'.14em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.55)', marginBottom:'16px' }}>FAQ</p>
          <h2 className="serif" style={{ textAlign:'center', fontSize:'clamp(24px,3vw,42px)', fontWeight:700, letterSpacing:'-.02em', color:'#F5EEE6', marginBottom:'44px', lineHeight:1.1 }}>
            Preguntas <em style={{ fontStyle:'italic', fontWeight:400, color:C.coral }}>frecuentes.</em>
          </h2>
          <Divider accent/>
          {[
            { q:'¿Puedo cambiar de plan en cualquier momento?', a:'Sí, puedes subir o bajar de plan desde Configuración → Plan. El cambio es efectivo de forma inmediata.' },
            { q:'¿Qué pasa al terminar los 14 días de prueba?', a:'Te avisamos 3 días antes. Si no activas un plan, tu cuenta pasa a modo lectura y los datos se conservan 30 días.' },
            { q:'¿Qué industrias soporta DaxCloud?', a:'Tienda, restaurante, panadería, farmacia, peluquería, ropa, verdulería y supermercado. Cada módulo tiene funciones especializadas.' },
            { q:'¿Cómo funciona el pago por SINPE Móvil?', a:'Haces la transferencia, nos envías el comprobante y activamos tu plan en menos de 2 horas hábiles.' },
            { q:'¿Tiene módulo de contabilidad para mi contador?', a:'Sí. El módulo contable PRO incluye estado de resultados, declaración de IVA, flujo de caja y análisis de productos. Todo exportable a Excel y PDF.' },
          ].map((faq,i) => <FAQ key={i} q={faq.q} a={faq.a}/>)}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding:'clamp(100px,14vh,150px) clamp(20px,5vw,72px)', textAlign:'center', borderTop:`1px solid ${C.border}`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'600px', height:'300px', background:`radial-gradient(ellipse, rgba(255,92,53,0.08), transparent 65%)`, pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <h2 className="serif" style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:700, letterSpacing:'-.03em', color:'#F5EEE6', marginBottom:'18px', lineHeight:1.04 }}>
            Empieza hoy.<br/><em style={{ fontStyle:'italic', fontWeight:400, color:C.coral }}>Sin compromisos.</em>
          </h2>
          <p style={{ fontSize:'16px', color:'rgba(255,255,255,0.38)', marginBottom:'44px', lineHeight:1.85, fontWeight:300 }}>14 días gratis, sin tarjeta. Configura tu negocio en 2 minutos.</p>
          <a href="/register" onClick={() => analytics.clickCTA('crear_cuenta_final', 'cta_final')}
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'16px 36px', borderRadius:'4px', fontSize:'14px', fontWeight:500, background:C.coral, color:'#fff', textDecoration:'none', letterSpacing:'.01em', transition:'all .2s', boxShadow:`0 4px 28px rgba(255,92,53,0.3)` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 40px rgba(255,92,53,0.48)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 28px rgba(255,92,53,0.3)'; }}>
            Crear cuenta gratis <ArrowRight size={15}/>
          </a>
          <p style={{ fontSize:'11px', color:C.dim, marginTop:'20px', fontWeight:300, letterSpacing:'.02em' }}>Sin contratos · Cancela cuando quieras · Soporte en español</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'26px clamp(20px,5vw,72px)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'22px', height:'22px', borderRadius:'5px', background:'rgba(255,92,53,0.08)', border:'1px solid rgba(255,92,53,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="11" height="8" viewBox="0 0 64 48" fill="none"><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="#FF5C35" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)', fontWeight:300 }}>
            Dax<span className="serif" style={{ fontStyle:'italic', color:'rgba(255,92,53,0.4)' }}>cloud</span>
            <span style={{ marginLeft:'8px', fontSize:'11px' }}>· by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color:'rgba(255,92,53,0.35)', textDecoration:'none' }}>jacana-dev.com</a></span>
          </span>
        </div>
        <div className="footer-links" style={{ display:'flex', gap:'20px' }}>
          {[['/', 'Inicio'], ['/pricing', 'Precios'], ['/login', 'Login'], ['/register', 'Registro']].map(([href, label]) => (
            <a key={label} href={href} style={{ fontSize:'12px', color:C.dim, textDecoration:'none', fontWeight:300, transition:'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.color=C.dim)}>{label}</a>
          ))}
        </div>
        <span style={{ fontSize:'11px', color:C.dim, fontWeight:300 }}>© {new Date().getFullYear()} DaxCloud</span>
      </footer>

      {/* ── MODALES ── */}
      {sinpePlan && <SinpePaymentModal planName={sinpePlan.name} planLabel={sinpePlan.label} planColor={sinpePlan.color} monthlyPrice={sinpePlan.monthlyPrice} annualPrice={sinpePlan.annualPrice} onClose={() => setSinpePlan(null)}/>}
      {showManual && <ManualModal onClose={() => setShowManual(false)}/>}
      <DaxChat/>

    </div>
  );
}
