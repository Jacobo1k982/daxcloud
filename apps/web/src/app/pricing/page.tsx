'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X, Zap, ArrowRight } from 'lucide-react';
import { PLANS } from '@/lib/plans';

// ── Canvas fondo ──────────────────────────────────────
function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0, W = 0, H = 0;

    function resize() {
      W = canvas!.offsetWidth; H = canvas!.offsetHeight;
      canvas!.width = W; canvas!.height = H;
    }
    function drawGrid() {
      ctx.strokeStyle = 'rgba(30,58,95,0.25)'; ctx.lineWidth = 0.5;
      const s = 52;
      for (let x = 0; x < W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    function orb(cx: number, cy: number, r: number, rgb: string, a: number) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    function animate() {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, W, H); t += 0.004;
      drawGrid();
      orb(W * 0.1,  H * 0.2,  W * 0.4,  '255,92,53',  0.05 + 0.02 * Math.sin(t));
      orb(W * 0.9,  H * 0.8,  W * 0.35, '90,170,240', 0.05 + 0.02 * Math.cos(t * 0.8));
      orb(W * 0.5,  H * 0.5,  W * 0.5,  '30,58,95',   0.08 + 0.03 * Math.sin(t * 0.6));
    }
    resize(); animate();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ── Logo ──────────────────────────────────────────────
function CloudLogo() {
  return (
    <svg width="32" height="24" viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="priceLogo" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FF8C00"/>
          <stop offset="45%"  stopColor="#FF5C35"/>
          <stop offset="100%" stopColor="#00C8D4"/>
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z" fill="none" stroke="url(#priceLogo)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Toggle ────────────────────────────────────────────
function BillingToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '12px',
      padding: '6px 8px',
      background: 'rgba(22,34,53,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(30,58,95,0.6)',
      borderRadius: '40px',
    }}>
      <button onClick={() => onChange(false)} style={{
        padding: '7px 18px', borderRadius: '30px', border: 'none',
        background: !annual ? 'rgba(255,92,53,.15)' : 'transparent',
        color: !annual ? '#FF5C35' : '#2A5280',
        fontSize: '13px', fontWeight: !annual ? 700 : 500,
        fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
        transition: 'all .2s cubic-bezier(.4,0,.2,1)',
      }}>
        Mensual
      </button>

      {/* Track */}
      <div onClick={() => onChange(!annual)} style={{
        width: '44px', height: '24px', borderRadius: '12px',
        background: annual ? '#FF5C35' : 'rgba(30,58,95,0.6)',
        position: 'relative', cursor: 'pointer',
        transition: 'background .2s',
        flexShrink: 0,
        border: `1px solid ${annual ? 'rgba(255,92,53,.5)' : 'rgba(30,58,95,0.8)'}`,
      }}>
        <div style={{
          position: 'absolute',
          top: '2px', left: annual ? '20px' : '2px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#fff',
          transition: 'left .2s cubic-bezier(.4,0,.2,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,.3)',
        }} />
      </div>

      <button onClick={() => onChange(true)} style={{
        padding: '7px 18px', borderRadius: '30px', border: 'none',
        background: annual ? 'rgba(255,92,53,.15)' : 'transparent',
        color: annual ? '#FF5C35' : '#2A5280',
        fontSize: '13px', fontWeight: annual ? 700 : 500,
        fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
        transition: 'all .2s cubic-bezier(.4,0,.2,1)',
        display: 'flex', alignItems: 'center', gap: '7px',
      }}>
        Anual
        <span style={{
          fontSize: '10px', fontWeight: 700,
          color: '#3DBF7F',
          background: 'rgba(61,191,127,.12)',
          border: '1px solid rgba(61,191,127,.2)',
          padding: '2px 7px', borderRadius: '6px',
          letterSpacing: '.02em',
        }}>
          2 meses gratis
        </span>
      </button>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────
function PlanCard({
  plan, annual, idx, mounted,
}: {
  plan: typeof PLANS[number];
  annual: boolean;
  idx: number;
  mounted: boolean;
}) {
  const price = annual ? plan.annualMonthly : plan.monthlyPrice;
  const totalAnnual = plan.annualPrice;
  const saving = plan.monthlyPrice * 12 - plan.annualPrice;
  const savingPct = Math.round((saving / (plan.monthlyPrice * 12)) * 100);

  return (
    <div style={{
      position: 'relative',
      padding: plan.popular ? '2px' : '0',
      borderRadius: '20px',
      background: plan.popular
        ? 'linear-gradient(135deg, rgba(255,92,53,.4), rgba(255,61,31,.2))'
        : 'transparent',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(20px)',
      transition: `all .7s ${idx * 0.1 + 0.2}s cubic-bezier(.22,1,.36,1)`,
    }}>
      {/* Badge popular */}
      {plan.popular && (
        <div style={{
          position: 'absolute', top: '-13px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 14px',
          background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
          borderRadius: '20px',
          fontSize: '11px', fontWeight: 700, color: '#fff',
          boxShadow: '0 4px 14px rgba(255,92,53,.4)',
          whiteSpace: 'nowrap', zIndex: 1,
        }}>
          <Zap size={10} />
          Más popular
        </div>
      )}

      <div style={{
        background: plan.popular
          ? 'rgba(22,34,53,0.95)'
          : 'rgba(22,34,53,0.7)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${plan.popular ? 'rgba(255,92,53,.3)' : 'rgba(30,58,95,0.6)'}`,
        borderRadius: '18px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: plan.popular
          ? '0 20px 48px rgba(255,92,53,.12), inset 0 1px 0 rgba(255,255,255,.05)'
          : '0 8px 32px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.03)',
      }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: plan.color,
              boxShadow: `0 0 8px ${plan.color}80`,
            }} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FF', letterSpacing: '.02em' }}>
              {plan.label}
            </p>
          </div>
          <p style={{ fontSize: '12px', color: '#2A5280', marginBottom: '18px' }}>{plan.desc}</p>

          {/* Precio */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3A6A9A', alignSelf: 'flex-start', marginTop: '8px' }}>$</span>
            <span style={{
              fontSize: '52px', fontWeight: 800,
              color: plan.popular ? '#FF5C35' : '#F0F4FF',
              lineHeight: 1, letterSpacing: '-.03em',
              transition: 'all .3s cubic-bezier(.4,0,.2,1)',
            }}>
              {price}
            </span>
            <span style={{ fontSize: '13px', color: '#2A5280', marginBottom: '8px' }}>/mes</span>
          </div>

          {annual ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <p style={{ fontSize: '12px', color: '#2A5280' }}>
                Facturado ${totalAnnual}/año
              </p>
              <p style={{ fontSize: '11px', color: '#3DBF7F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={10} /> Ahorras ${saving}/año ({savingPct}%)
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#2A5280' }}>
              ${plan.monthlyPrice} × 12 = ${plan.monthlyPrice * 12}/año
            </p>
          )}
        </div>

        {/* Límite */}
        <div style={{
          padding: '8px 12px',
          background: `${plan.color}10`,
          border: `1px solid ${plan.color}20`,
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: plan.color }}>
            {plan.limit}
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, marginBottom: '24px' }}>
          {plan.features.map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                background: feat.included ? `${plan.color}15` : 'rgba(30,58,95,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {feat.included
                  ? <Check size={9} color={plan.color} strokeWidth={3} />
                  : <X size={9} color="#1E3A5F" strokeWidth={2.5} />
                }
              </div>
              <span style={{
                fontSize: '13px',
                color: feat.included ? '#B8D0E8' : '#1E3A5F',
                textDecoration: feat.included ? 'none' : 'line-through',
              }}>
                {feat.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a href="/register" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          padding: '13px',
          background: plan.popular
            ? 'linear-gradient(135deg, #FF5C35, #FF3D1F)'
            : 'transparent',
          border: plan.popular
            ? 'none'
            : `1.5px solid ${plan.color}50`,
          borderRadius: '12px',
          fontSize: '14px', fontWeight: 700,
          color: plan.popular ? '#fff' : plan.color,
          textDecoration: 'none',
          transition: 'all .2s cubic-bezier(.4,0,.2,1)',
          boxShadow: plan.popular ? '0 4px 16px rgba(255,92,53,.3)' : 'none',
          letterSpacing: '.01em',
        }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            if (plan.popular) {
              el.style.transform = 'translateY(-1px)';
              el.style.boxShadow = '0 6px 22px rgba(255,92,53,.4)';
            } else {
              el.style.background = `${plan.color}10`;
              el.style.borderColor = `${plan.color}80`;
            }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            if (plan.popular) {
              el.style.transform = 'none';
              el.style.boxShadow = '0 4px 16px rgba(255,92,53,.3)';
            } else {
              el.style.background = 'transparent';
              el.style.borderColor = `${plan.color}50`;
            }
          }}
        >
          {plan.cta} <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────
export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080F1A',
      fontFamily: 'Outfit, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <BackgroundCanvas />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '60px',
        borderBottom: '1px solid rgba(30,58,95,0.5)',
        background: 'rgba(8,15,26,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(20px,5vw,80px)',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <CloudLogo />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>Dax</span>
            <span style={{ fontSize: '17px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.02em' }}>cloud</span>
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/login" style={{ padding: '7px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: '#4A7FAF', textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7BBEE8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4A7FAF')}>
            Iniciar sesión
          </a>
          <a href="/register" style={{
            padding: '7px 16px', borderRadius: '9px',
            fontSize: '13px', fontWeight: 700,
            color: '#fff', background: '#FF5C35',
            textDecoration: 'none', transition: 'all .18s',
            boxShadow: '0 2px 10px rgba(255,92,53,.25)',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8440E'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FF5C35'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
            Empezar gratis
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        textAlign: 'center',
        padding: 'clamp(60px,8vh,96px) clamp(20px,5vw,80px) clamp(40px,5vh,64px)',
        position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(16px)',
        transition: 'all .8s cubic-bezier(.22,1,.36,1)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,92,53,.1)', border: '1px solid rgba(255,92,53,.2)', marginBottom: '20px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5C35', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C35', letterSpacing: '.06em' }}>
            14 días gratis en todos los planes
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px,5vw,56px)',
          fontWeight: 700, color: '#F0F4FF',
          lineHeight: 1.1, letterSpacing: '-.02em',
          marginBottom: '16px',
        }}>
          Precios simples,<br />
          <span style={{ background: 'linear-gradient(135deg, #FF8C00, #FF5C35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            sin sorpresas
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#3A6A9A', marginBottom: '36px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 36px' }}>
          Sin costos de instalación, sin contratos de largo plazo. Cancela cuando quieras.
        </p>

        {/* Toggle */}
        <BillingToggle annual={annual} onChange={setAnnual} />
      </div>

      {/* ── Cards de planes ── */}
      <div style={{
        maxWidth: '1060px', margin: '0 auto',
        padding: 'clamp(20px,4vh,48px) clamp(20px,5vw,40px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'stretch',
        position: 'relative', zIndex: 1,
      }}>
        {PLANS.map((plan, i) => (
          <PlanCard key={plan.name} plan={plan} annual={annual} idx={i} mounted={mounted} />
        ))}
      </div>

      {/* ── FAQ / Garantías ── */}
      <div style={{
        maxWidth: '760px', margin: '0 auto',
        padding: 'clamp(40px,6vh,72px) clamp(20px,5vw,40px)',
        position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0,
        transition: 'opacity .8s .5s ease',
      }}>

        {/* Garantías */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px', marginBottom: '48px',
        }}>
          {[
            { icon: '🔒', title: 'Sin tarjeta requerida', desc: '14 días gratis, sin compromisos' },
            { icon: '⚡', title: 'Activo en minutos',     desc: 'Configura tu negocio hoy mismo' },
            { icon: '🔄', title: 'Cancela cuando quieras', desc: 'Sin contratos de largo plazo' },
            { icon: '💬', title: 'Soporte incluido',       desc: 'Ayuda real por chat y email' },
          ].map(g => (
            <div key={g.title} style={{
              padding: '16px 18px',
              background: 'rgba(22,34,53,0.5)',
              border: '1px solid rgba(30,58,95,0.4)',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{g.icon}</div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#B8D0E8', marginBottom: '4px' }}>{g.title}</p>
              <p style={{ fontSize: '11px', color: '#2A5280', lineHeight: 1.5 }}>{g.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35', marginBottom: '24px', textAlign: 'center' }}>
            Preguntas frecuentes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí, puedes subir o bajar de plan cuando quieras desde Configuración → Plan. El cambio es efectivo inmediatamente.' },
              { q: '¿Qué pasa al terminar los 14 días de prueba?', a: 'Te avisamos 3 días antes. Si no agregas un método de pago, tu cuenta pasa a modo de solo lectura. Tus datos se conservan 30 días.' },
              { q: '¿El módulo de industria tiene costo adicional?', a: 'Sí, los módulos especializados (restaurante, farmacia, peluquería, etc.) tienen un costo adicional de $22/mes sobre tu plan base.' },
              { q: '¿Cómo funciona la facturación anual?', a: 'Pagas un año por adelantado y obtienes el equivalente a 2 meses gratis. El ahorro se aplica automáticamente al elegir el plan anual.' },
              { q: '¿Puedo tener múltiples negocios?', a: 'Cada negocio es un tenant independiente con su propio plan. Puedes crear tantos como necesites con diferentes cuentas.' },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div style={{
          textAlign: 'center',
          padding: '36px',
          background: 'rgba(22,34,53,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(30,58,95,0.5)',
          borderRadius: '20px',
        }}>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#F0F4FF', marginBottom: '10px', letterSpacing: '-.01em' }}>
            ¿Listo para empezar?
          </p>
          <p style={{ fontSize: '14px', color: '#3A6A9A', marginBottom: '24px', lineHeight: 1.6 }}>
            14 días gratis, sin tarjeta de crédito. Configura tu negocio en menos de 2 minutos.
          </p>
          <a href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '13px 32px',
            background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
            color: '#fff', borderRadius: '12px',
            textDecoration: 'none', fontSize: '14px', fontWeight: 700,
            boxShadow: '0 4px 20px rgba(255,92,53,.35)',
            transition: 'all .2s',
            letterSpacing: '.01em',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(255,92,53,.45)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(255,92,53,.35)'; }}
          >
            Crear cuenta gratis <ArrowRight size={15} />
          </a>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(30,58,95,0.4)',
        padding: '24px clamp(20px,5vw,80px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CloudLogo />
          <span style={{ fontSize: '11px', color: '#1E3A5F' }}>
            © {new Date().getFullYear()} DaxCloud · by{' '}
            <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>jacana-dev.com</a>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[{ label: 'Inicio', href: '/' }, { label: 'Login', href: '/login' }, { label: 'Términos', href: '/terms' }, { label: 'Privacidad', href: '/privacy' }].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: '12px', color: '#1E3A5F', textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#4A7FAF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#1E3A5F')}>
              {l.label}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.6; transform:scale(1.3); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── FAQ Item con accordion ────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'rgba(15,25,36,0.5)',
      border: `1px solid ${open ? 'rgba(255,92,53,.2)' : 'rgba(30,58,95,0.4)'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'border-color .2s',
    }}>
      <button onClick={() => setOpen(p => !p)} style={{
        width: '100%', padding: '16px 18px',
        background: 'transparent', border: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', textAlign: 'left', gap: '12px',
        fontFamily: 'Outfit, sans-serif',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#B8D0E8', lineHeight: 1.4 }}>{question}</span>
        <span style={{
          fontSize: '16px', color: open ? '#FF5C35' : '#2A5280',
          transition: 'all .2s', transform: open ? 'rotate(45deg)' : 'none',
          flexShrink: 0, lineHeight: 1,
        }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', animation: 'fadeUp .2s ease' }}>
          <p style={{ fontSize: '13px', color: '#3A6A9A', lineHeight: 1.7 }}>{answer}</p>
        </div>
      )}
    </div>
  );
}