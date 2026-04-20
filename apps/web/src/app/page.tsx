'use client';
import { useEffect, useRef, useState } from 'react';
import { PLANS } from '@/lib/plans';
import { SinpePaymentModal } from '@/components/payments/SinpePaymentModal';
import { StructuredData } from '@/components/StructuredData';
import { DaxChat } from '@/components/DaxChat';
import {
  Zap, BarChart2, Globe, Package, Users, Smartphone,
  ShoppingCart, Search, ArrowRight, ChevronDown,
  TrendingUp, Shield, BookOpen,
} from 'lucide-react';

// ── Canvas partículas ─────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let id: number, t = 0, W = 0, H = 0, pts: any[] = [];
    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
      pts = Array.from({ length: Math.floor(W * H / 12000) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .12,
        r: .3 + Math.random() * .9, o: .04 + Math.random() * .1,
      }));
    };
    const animate = () => {
      id = requestAnimationFrame(animate); t += .003;
      ctx.clearRect(0, 0, W, H);
      // Orbs
      const orb = (cx: number, cy: number, r: number, c: string) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, c); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      };
      orb(W * .15 + Math.sin(t * .7) * 80, H * .3 + Math.cos(t * .5) * 60, W * .45, `rgba(255,92,53,${.06 + .02 * Math.sin(t)})`);
      orb(W * .85 + Math.cos(t * .6) * 60, H * .7 + Math.sin(t * .4) * 70, W * .4, `rgba(30,58,95,${.08 + .02 * Math.cos(t * .8)})`);
      // Partículas
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,92,53,${p.o})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(255,92,53,${.06 * (1 - d / 90)})`; ctx.lineWidth = .4; ctx.stroke(); }
      }
    };
    resize(); animate();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── POS Mockup ────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { name: 'Café Americano', price: '₡1,200', cat: 'Bebidas' },
  { name: 'Croissant', price: '₡1,800', cat: 'Comidas' },
  { name: 'Jugo Natural', price: '₡2,400', cat: 'Bebidas' },
  { name: 'Combo Almuerzo', price: '₡5,800', cat: 'Comidas' },
  { name: 'Repostería Mix', price: '₡2,200', cat: 'Postres' },
  { name: 'Agua 500ml', price: '₡800', cat: 'Bebidas' },
];

function POSMockup() {
  const [selected, setSelected] = useState(0);
  const [cart] = useState([
    { qty: 2, name: 'Café Americano', amount: '₡2,400' },
    { qty: 1, name: 'Croissant', amount: '₡1,800' },
    { qty: 3, name: 'Agua 500ml', amount: '₡2,400' },
  ]);
  const [payMethod, setPayMethod] = useState('Efectivo');

  return (
    <div style={{ position: 'relative', maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>
      {/* Glow bajo el mockup */}
      <div style={{ position: 'absolute', bottom: '-80px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '180px', background: 'radial-gradient(ellipse,rgba(255,92,53,0.18),transparent 70%)', pointerEvents: 'none' }} />

      {/* Notif flotante izq */}
      <div style={{ position: 'absolute', top: '-18px', left: '-8px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', background: 'rgba(8,14,26,0.96)', border: '1px solid rgba(61,191,127,0.3)', borderRadius: '12px', backdropFilter: 'blur(12px)', animation: 'float 4s .5s ease-in-out infinite', whiteSpace: 'nowrap' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(61,191,127,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3DBF7F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: 'rgba(61,191,127,0.6)', marginBottom: '1px', fontWeight: 600 }}>Venta completada</p>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#3DBF7F' }}>₡ 8,400</p>
        </div>
      </div>

      {/* Notif flotante der */}
      <div style={{ position: 'absolute', top: '-18px', right: '-8px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', background: 'rgba(8,14,26,0.96)', border: '1px solid rgba(240,160,48,0.3)', borderRadius: '12px', backdropFilter: 'blur(12px)', animation: 'float 4s 1s ease-in-out infinite', whiteSpace: 'nowrap' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(240,160,48,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F0A030" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        </div>
        <div>
          <p style={{ fontSize: '10px', color: 'rgba(240,160,48,0.6)', marginBottom: '1px', fontWeight: 600 }}>Stock bajo</p>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#F0A030' }}>Café · 3 unidades</p>
        </div>
      </div>

      {/* Frame */}
      <div style={{ background: 'rgba(12,18,32,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px 16px 0 0', overflow: 'hidden', boxShadow: '0 -4px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' }}>
        {/* Browser bar */}
        <div style={{ height: '38px', background: 'rgba(8,12,20,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['#FF5F57','#FFBD2E','#28CA41'].map((c,i) => <div key={i} style={{ width: '11px', height: '11px', borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ flex: 1, margin: '0 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '22px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            daxcloud.shop/pos
          </div>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3DBF7F', boxShadow: '0 0 6px #3DBF7F' }} />
        </div>

        {/* POS Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', minHeight: '380px' }}>
          {/* Sidebar */}
          <div style={{ background: 'rgba(8,12,20,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginBottom: '8px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,92,53,0.15)', border: '1px solid rgba(255,92,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="9" viewBox="0 0 64 48" fill="none"><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="#FF5C35" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>DaxPOS</span>
            </div>
            {[
              { icon: ShoppingCart, label: 'POS', active: true },
              { icon: TrendingUp, label: 'Ventas', active: false },
              { icon: Package, label: 'Inventario', active: false },
              { icon: Users, label: 'Clientes', active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: active ? '#FF5C35' : 'rgba(255,255,255,0.35)', background: active ? 'rgba(255,92,53,0.1)' : 'transparent', border: active ? '1px solid rgba(255,92,53,0.18)' : '1px solid transparent', cursor: 'default' }}>
                <Icon size={14} />
                {label}
              </div>
            ))}
            <div style={{ marginTop: 'auto', padding: '10px', background: 'rgba(255,92,53,0.07)', border: '1px solid rgba(255,92,53,0.15)', borderRadius: '8px' }}>
              <p style={{ fontSize: '9px', color: 'rgba(255,92,53,0.55)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Hoy</p>
              <p style={{ fontSize: '16px', fontWeight: 900, color: '#FF5C35', letterSpacing: '-.02em' }}>₡84,200</p>
              <p style={{ fontSize: '9px', color: 'rgba(61,191,127,0.7)', fontWeight: 600, marginTop: '2px' }}>▲ +18.4%</p>
            </div>
          </div>

          {/* Main */}
          <div style={{ background: 'rgba(10,16,28,0.98)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', height: '34px', padding: '0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              <Search size={12} />
              Buscar producto, SKU...
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
              {['Todos','Bebidas','Comidas','Postres'].map((cat, i) => (
                <span key={cat} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: i === 0 ? 'rgba(255,92,53,0.12)' : 'rgba(255,255,255,0.03)', color: i === 0 ? '#FF5C35' : 'rgba(255,255,255,0.3)', border: i === 0 ? '1px solid rgba(255,92,53,0.25)' : '1px solid rgba(255,255,255,0.07)', cursor: 'default' }}>{cat}</span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px', flex: 1 }}>
              {PRODUCTS.map((p, i) => (
                <div key={i} onClick={() => setSelected(i)} style={{ background: selected === i ? 'rgba(255,92,53,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected === i ? 'rgba(255,92,53,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '9px', padding: '10px', cursor: 'pointer', transition: 'all .15s' }}>
                  <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', marginBottom: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={16} color="rgba(255,92,53,0.4)" />
                  </div>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.name}</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C35' }}>{p.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div style={{ background: 'rgba(8,12,20,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Orden actual</p>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 9px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(255,92,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#FF5C35', flexShrink: 0 }}>{item.qty}</div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{item.amount}</span>
              </div>
            ))}

            {/* Métodos pago */}
            <div>
              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Método</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {['Efectivo','SINPE','Tarjeta','Mixto'].map(m => (
                  <div key={m} onClick={() => setPayMethod(m)} style={{ padding: '6px', borderRadius: '7px', textAlign: 'center' as const, fontSize: '9px', fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: payMethod === m ? 'rgba(255,92,53,0.12)' : 'rgba(255,255,255,0.03)', border: payMethod === m ? '1px solid rgba(255,92,53,0.35)' : '1px solid rgba(255,255,255,0.07)', color: payMethod === m ? '#FF5C35' : 'rgba(255,255,255,0.3)' }}>{m}</div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '10px', background: 'rgba(255,92,53,0.07)', border: '1px solid rgba(255,92,53,0.15)', borderRadius: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}><span>Subtotal</span><span>₡6,600</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#FF5C35', letterSpacing: '-.02em' }}>₡6,600</span>
              </div>
            </div>
            <button style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cobrar ₡6,600
            </button>
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
    <div onClick={() => setOpen(p => !p)} style={{ padding: '18px 22px', background: open ? 'rgba(255,92,53,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${open ? 'rgba(255,92,53,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all .2s', userSelect: 'none' as const }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: open ? '#F0F4FF' : 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{q}</span>
        <span style={{ color: open ? '#FF5C35' : 'rgba(255,92,53,0.35)', fontSize: '18px', transition: 'transform .2s', transform: open ? 'rotate(45deg)' : 'none', flexShrink: 0, lineHeight: 1 }}>+</span>
      </div>
      {open && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, marginTop: '12px' }}>{a}</p>}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [annual, setAnnual]         = useState(false);
  const [sinpePlan, setSinpePlan]   = useState<typeof PLANS[number] | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const handlePagadito = (plan: typeof PLANS[number]) => {
    const amount = annual ? plan.annualMonthly : plan.monthlyPrice;
    const params = new URLSearchParams({ plan: plan.name, billing: annual ? 'annual' : 'monthly', amount: String(amount), method: 'pagadito' });
    window.location.href = '/register?' + params.toString();
  };

  const FEATURES = [
    { icon: Zap,       title: 'POS adaptativo',       desc: 'Se adapta a tu industria automáticamente. Rápido, táctil y sin curva de aprendizaje.' },
    { icon: BarChart2, title: 'Analytics en vivo',    desc: 'Ventas, horas pico y ticket promedio actualizados en tiempo real desde cualquier dispositivo.' },
    { icon: Globe,     title: 'Multi-sucursal',        desc: 'Gestiona todas tus sedes desde un panel centralizado con reportes consolidados.' },
    { icon: Package,   title: 'Inventario inteligente',desc: 'Alertas automáticas de stock bajo. Control de lotes y vencimientos.' },
    { icon: Users,     title: 'Clientes y fidelización',desc: 'Historial, crédito interno y puntos de fidelización integrados en el POS.' },
    { icon: Smartphone,title: 'Responsive total',      desc: 'Funciona perfectamente en móvil, tablet y desktop. Sin instalaciones.' },
  ];

  const INDUSTRIES = [
    '🍽️ Restaurante','🥖 Panadería','💊 Farmacia','✂️ Peluquería',
    '👕 Ropa','🥬 Verdulería','🛒 Supermercado','📦 Tienda',
  ];

  const tr = (d = 0) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: `all .8s ${d}s cubic-bezier(.22,1,.36,1)` });

  const S = {
    bg:    '#080C14',
    coral: '#FF5C35',
    muted: 'rgba(255,255,255,0.35)',
    dim:   'rgba(255,255,255,0.12)',
    border:'rgba(255,255,255,0.07)',
    surf:  'rgba(255,255,255,0.025)',
  };

  return (
    <div style={{ background: S.bg, fontFamily: "'Inter','Outfit',system-ui,sans-serif", minHeight: '100vh', position: 'relative', overflowX: 'hidden', color: '#fff' }}>
      <StructuredData />

      {/* NAV */}
      <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,5vw,72px)', borderBottom: `1px solid ${S.border}`, background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50, gap: '16px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,92,53,0.12)', border: '1px solid rgba(255,92,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 64 48" fill="none"><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="#FF5C35" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>Dax<span style={{ color: S.coral, fontWeight: 300 }}>cloud</span></span>
        </a>

        <div style={{ display: 'flex', gap: '2px', flex: 1, justifyContent: 'center' }} className="nav-links">
          {[['#features','Funciones'],['#industries','Industrias'],['#pricing','Precios']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: S.muted, fontSize: '13px', padding: '7px 14px', borderRadius: '7px', textDecoration: 'none', transition: 'color .15s', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = S.muted)}>{label}</a>
          ))}
          <button onClick={() => setShowManual(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: S.coral, fontSize: '13px', padding: '7px 14px', borderRadius: '7px', background: 'rgba(255,92,53,0.07)', border: '1px solid rgba(255,92,53,0.15)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,92,53,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,92,53,0.07)'; }}>
            <BookOpen size={13} /> Manual
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <a href="/login" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: S.muted, textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = S.muted)}>Iniciar sesión</a>
          <a href="/register" style={{ padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 16px rgba(255,92,53,0.3)', transition: 'all .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(255,92,53,0.45)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(255,92,53,0.3)'; }}>Empezar gratis</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: 'clamp(80px,12vh,120px) clamp(20px,5vw,72px) 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <ParticleCanvas />
        {/* Glow hero */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse at 50% 0%,rgba(255,92,53,0.1) 0%,transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, ...tr(0) }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,92,53,0.08)', border: '1px solid rgba(255,92,53,0.2)', marginBottom: '28px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,92,53,0.9)', letterSpacing: '.04em' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: S.coral, animation: 'pulse 2s infinite' }} />
            POS cloud · América Latina · 14 días gratis
          </div>

          <h1 style={{ fontSize: 'clamp(40px,7vw,80px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-.04em', marginBottom: '24px', background: 'linear-gradient(180deg,#fff 30%,rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            El POS que{' '}
            <span style={{ background: 'linear-gradient(135deg,#FF5C35,#FF8C6A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>transforma</span>
            <br />tu negocio
          </h1>

          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: S.muted, lineHeight: 1.85, maxWidth: '520px', margin: '0 auto 44px', fontWeight: 400, letterSpacing: '-.01em' }}>
            Ventas, inventario y analytics en una plataforma que escala contigo. Sin hojas de cálculo, sin sistemas lentos.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '72px' }}>
            <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 32px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 28px rgba(255,92,53,0.35)', transition: 'all .25s', letterSpacing: '-.01em' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(255,92,53,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 28px rgba(255,92,53,0.35)'; }}>
              Comenzar gratis <ArrowRight size={16} />
            </a>
            <button onClick={() => setShowManual(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: S.muted, border: `1px solid ${S.border}`, background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted; (e.currentTarget as HTMLElement).style.borderColor = S.border; }}>
              <BookOpen size={15} /> Ver manual
            </button>
          </div>
        </div>

        {/* POS Mockup */}
        <div style={{ position: 'relative', zIndex: 1, ...tr(.1) }}>
          <POSMockup />
        </div>
      </section>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', maxWidth: '960px', margin: '0 auto', padding: '80px clamp(20px,5vw,72px)' }}>
        {[
          { n: '8+', l: 'Industrias soportadas', c: S.coral },
          { n: '14 días', l: 'Prueba gratis · sin tarjeta', c: '#fff' },
          { n: '20+', l: 'Países de Latinoamérica', c: S.coral },
          { n: '∞', l: 'Ventas sin límite', c: '#fff' },
        ].map(({ n, l, c }) => (
          <div key={l} style={{ padding: '24px', background: S.surf, border: `1px solid ${S.border}`, borderRadius: '16px', transition: 'all .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,92,53,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = S.border; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
            <p style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-.03em', color: c, marginBottom: '6px' }}>{n}</p>
            <p style={{ fontSize: '12px', color: S.muted, fontWeight: 500 }}>{l}</p>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding: '0 clamp(20px,5vw,72px) 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'rgba(255,92,53,0.6)', marginBottom: '16px' }}>Por qué DaxCloud</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-.03em', background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>Todo lo que necesitas</h2>
          <p style={{ fontSize: '16px', color: S.muted, maxWidth: '480px', margin: '0 auto', lineHeight: 1.8 }}>Sin módulos extra, sin costos ocultos. Todo incluido desde el primer día.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: S.border, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${S.border}` }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ padding: '32px 28px', background: S.bg, transition: 'all .2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,92,53,0.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = S.bg; }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,92,53,0.07)', border: '1px solid rgba(255,92,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Icon size={20} color={S.coral} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '10px', letterSpacing: '-.02em' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: S.muted, lineHeight: 1.8 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" style={{ padding: '80px clamp(20px,5vw,72px)', textAlign: 'center', borderTop: `1px solid ${S.border}` }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'rgba(255,92,53,0.6)', marginBottom: '16px' }}>Industrias</p>
        <h2 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-.03em', background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '40px' }}>Una plataforma · Cada negocio</h2>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {INDUSTRIES.map(ind => (
            <div key={ind} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '40px', background: S.surf, border: `1px solid ${S.border}`, fontSize: '13px', fontWeight: 600, color: S.muted, transition: 'all .2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,92,53,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,92,53,0.25)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,92,53,0.9)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = S.surf; (e.currentTarget as HTMLElement).style.borderColor = S.border; (e.currentTarget as HTMLElement).style.color = S.muted; }}>
              {ind}
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px clamp(20px,5vw,72px)', borderTop: `1px solid ${S.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'rgba(255,92,53,0.6)', marginBottom: '16px' }}>Precios</p>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-.03em', background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '14px' }}>Simple y transparente</h2>
          <p style={{ fontSize: '15px', color: S.muted, marginBottom: '32px' }}>14 días gratis · Sin tarjeta · Cancela cuando quieras</p>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: '40px' }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '7px 18px', borderRadius: '30px', border: 'none', background: !annual ? 'rgba(255,92,53,0.12)' : 'transparent', color: !annual ? S.coral : S.muted, fontSize: '13px', fontWeight: !annual ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>Mensual</button>
            <div onClick={() => setAnnual(p => !p)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: annual ? S.coral : 'rgba(255,255,255,0.12)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '3px', left: annual ? '20px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
            </div>
            <button onClick={() => setAnnual(true)} style={{ padding: '7px 18px', borderRadius: '30px', border: 'none', background: annual ? 'rgba(255,92,53,0.12)' : 'transparent', color: annual ? S.coral : S.muted, fontSize: '13px', fontWeight: annual ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '7px' }}>
              Anual <span style={{ fontSize: '10px', fontWeight: 700, color: '#3DBF7F', background: 'rgba(61,191,127,0.12)', border: '1px solid rgba(61,191,127,0.2)', padding: '2px 8px', borderRadius: '6px' }}>2 meses gratis</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px', maxWidth: '960px', margin: '0 auto' }}>
          {PLANS.map(plan => {
            const price = annual ? plan.annualMonthly : plan.monthlyPrice;
            return (
              <div key={plan.name} style={{ padding: '28px 24px', background: plan.popular ? 'rgba(255,92,53,0.06)' : S.surf, border: `1px solid ${plan.popular ? 'rgba(255,92,53,0.3)' : S.border}`, borderRadius: '20px', position: 'relative', display: 'flex', flexDirection: 'column' as const }}>
                {plan.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' as const }}>⚡ Más popular</div>}
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: plan.popular ? S.coral : S.muted, marginBottom: '12px', marginTop: plan.popular ? '8px' : '0' }}>{plan.label}</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 900, color: plan.popular ? S.coral : '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>${price}</span>
                  <span style={{ fontSize: '13px', color: S.muted, marginBottom: '8px' }}>/mes</span>
                </div>
                <p style={{ fontSize: '12px', color: S.muted, marginBottom: '20px' }}>{plan.limit}</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '7px', flex: 1, marginBottom: '22px' }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: f.included ? 'rgba(255,92,53,0.12)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {f.included
                          ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#FF5C35" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        }
                      </div>
                      <span style={{ fontSize: '13px', color: f.included ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)', textDecoration: f.included ? 'none' : 'line-through' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '13px', background: plan.popular ? 'linear-gradient(135deg,#FF5C35,#FF3D1F)' : 'transparent', border: plan.popular ? 'none' : `1.5px solid ${plan.color}40`, borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: plan.popular ? '#fff' : plan.color, textDecoration: 'none', transition: 'all .2s' }}>
                    {plan.cta} <ArrowRight size={14} />
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: S.border }} />
                    <span style={{ fontSize: '10px', color: S.dim, letterSpacing: '.06em', textTransform: 'uppercase' as const }}>o paga ahora</span>
                    <div style={{ flex: 1, height: '1px', background: S.border }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => setSinpePlan(plan as any)} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px', padding: '9px 8px', background: 'rgba(61,191,127,0.04)', border: '1px solid rgba(61,191,127,0.15)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,191,127,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,191,127,0.15)'; }}>
                      <Smartphone size={12} color="#3DBF7F" />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#3DBF7F' }}>SINPE</span>
                      <span style={{ fontSize: '8px', color: S.muted }}>Solo CR</span>
                    </button>
                    <button onClick={() => handlePagadito(plan as any)} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px', padding: '9px 8px', background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,0,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,107,0,0.15)'; }}>
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        <svg width="20" height="7" viewBox="0 0 28 9" fill="none"><text x="0" y="8" fontSize="9" fontWeight="900" fontFamily="Arial,sans-serif" fill="#1A1F71">VISA</text></svg>
                        <svg width="12" height="8" viewBox="0 0 16 10"><circle cx="6" cy="5" r="5" fill="#EB001B" opacity=".9"/><circle cx="10" cy="5" r="5" fill="#F79E1B" opacity=".9"/><path d="M8 1.8a5 5 0 010 6.4A5 5 0 018 1.8z" fill="#FF5F00" opacity=".9"/></svg>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF6B00' }}>Tarjeta</span>
                      <span style={{ fontSize: '8px', color: S.muted }}>Latinoamérica</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: S.dim }}>SINPE Móvil · Visa · Mastercard · Toda Latinoamérica</p>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px clamp(20px,5vw,72px)', borderTop: `1px solid ${S.border}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'rgba(255,92,53,0.6)', marginBottom: '16px' }}>FAQ</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-.03em', background: 'linear-gradient(180deg,#fff 40%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '40px' }}>Preguntas frecuentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {[
              { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí, puedes subir o bajar de plan cuando quieras desde Configuración → Plan. El cambio es efectivo inmediatamente.' },
              { q: '¿Qué pasa al terminar los 14 días de prueba?', a: 'Te avisamos 3 días antes. Si no activas un plan, tu cuenta pasa a modo lectura. Tus datos se conservan 30 días.' },
              { q: '¿Qué industrias soporta DaxCloud?', a: 'Tienda, restaurante, panadería, farmacia, peluquería, ropa, verdulería y supermercado. Cada módulo tiene funciones especializadas.' },
              { q: '¿Cómo funciona el pago por SINPE Móvil?', a: 'Haces la transferencia, nos envías el comprobante y activamos tu plan en menos de 2 horas hábiles.' },
              { q: '¿El módulo de industria tiene costo adicional?', a: 'Sí, los módulos especializados tienen un costo adicional de $22/mes sobre tu plan base.' },
            ].map((faq, i) => <FAQ key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: 'clamp(100px,12vh,140px) clamp(20px,5vw,72px)', textAlign: 'center', borderTop: `1px solid ${S.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '350px', background: 'radial-gradient(ellipse,rgba(255,92,53,0.08),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 800, letterSpacing: '-.04em', background: 'linear-gradient(180deg,#fff 30%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '18px' }}>
            Empieza hoy.<br />Sin compromisos.
          </h2>
          <p style={{ fontSize: '17px', color: S.muted, marginBottom: '44px', lineHeight: 1.8 }}>14 días gratis, sin tarjeta. Configura tu negocio en 2 minutos.</p>
          <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: 800, background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 28px rgba(255,92,53,0.35)', letterSpacing: '.01em', transition: 'all .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(255,92,53,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 28px rgba(255,92,53,0.35)'; }}>
            Crear cuenta gratis <ArrowRight size={16} />
          </a>
          <p style={{ fontSize: '12px', color: S.dim, marginTop: '20px' }}>Sin contratos · Cancela cuando quieras · Soporte en español</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${S.border}`, padding: '28px clamp(20px,5vw,72px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,92,53,0.1)', border: '1px solid rgba(255,92,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="9" viewBox="0 0 64 48" fill="none"><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="#FF5C35" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>Dax<span style={{ color: 'rgba(255,92,53,0.45)' }}>cloud</span></span>
          <span style={{ fontSize: '11px', color: S.dim }}>· by <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,92,53,0.35)', textDecoration: 'none', fontWeight: 600 }}>jacana-dev.com</a></span>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[['/', 'Inicio'], ['/pricing', 'Precios'], ['/login', 'Login'], ['/register', 'Registro']].map(([href, label]) => (
            <a key={label} href={href} style={{ fontSize: '12px', color: S.dim, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.color = S.dim)}>{label}</a>
          ))}
        </div>
        <span style={{ fontSize: '11px', color: S.dim }}>© {new Date().getFullYear()} DaxCloud</span>
      </footer>

      {/* Modals */}
      {sinpePlan && <SinpePaymentModal planName={sinpePlan.name} planLabel={sinpePlan.label} planColor={sinpePlan.color} monthlyPrice={sinpePlan.monthlyPrice} annualPrice={sinpePlan.annualPrice} onClose={() => setSinpePlan(null)} />}
      <DaxChat />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @media(min-width:768px){.nav-links{display:flex!important}}
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #080C14 inset!important; -webkit-text-fill-color:#fff!important; }
      `}</style>
    </div>
  );
}
