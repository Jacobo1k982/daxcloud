'use client';

import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import {
  ArrowRight, Zap, Shield, BarChart2,
  Smartphone, Globe, ChefHat, Pill,
  Scissors, Shirt, Leaf, Utensils, ShoppingCart, Package,
} from 'lucide-react';
import { PLANS } from '@/lib/plans';

// ── Partículas ────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number, t = 0;
    let W = 0, H = 0;
    let particles: any[] = [];

    function resize() {
      W = canvas!.offsetWidth; H = canvas!.offsetHeight;
      canvas!.width = W; canvas!.height = H;
      particles = Array.from({ length: Math.floor(W * H / 12000) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .15,
        r: .4 + Math.random() * 1.1,
        o: .08 + Math.random() * .25,
        coral: Math.random() < .18,
      }));
    }

    function animate() {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, W, H);
      t += .004;

      // Orbs
      const g1 = ctx.createRadialGradient(W * .2, H * .3, 0, W * .2, H * .3, W * .35);
      g1.addColorStop(0, `rgba(255,92,53,${.05 + .02 * Math.sin(t)})`);
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      const g2 = ctx.createRadialGradient(W * .8, H * .7, 0, W * .8, H * .7, W * .3);
      g2.addColorStop(0, `rgba(30,58,95,${.12 + .04 * Math.cos(t * .7)})`);
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.coral ? `rgba(255,92,53,${p.o})` : `rgba(91,170,240,${p.o})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 75) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(30,58,95,${.15 * (1 - d / 75)})`;
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
    }
    resize();
    animate();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  );
}

// ── Hook: reveal on scroll ────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: .15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Datos ─────────────────────────────────────────────
const FEATURES = [
  {
    icon: Zap,
    color: '#FF5C35',
    title: 'POS adaptativo',
    desc: 'El sistema detecta tu industria y adapta la interfaz automáticamente. Restaurante, farmacia, peluquería — cada negocio tiene su flujo.',
  },
  {
    icon: BarChart2,
    color: '#5AAAF0',
    title: 'Analytics en tiempo real',
    desc: 'Ventas, inventario y métricas clave actualizados al instante. Toma decisiones basadas en datos, no en suposiciones.',
  },
  {
    icon: Globe,
    color: '#3DBF7F',
    title: 'Multi-moneda',
    desc: 'Soporte nativo para 20+ países de América Latina y Europa. CRC, USD, MXN, COP y más, con formatos locales correctos.',
  },
  {
    icon: Shield,
    color: '#F0A030',
    title: 'Multi-tenant seguro',
    desc: 'Cada negocio tiene su propio espacio aislado. Roles, permisos y sucursales completamente independientes.',
  },
  {
    icon: Smartphone,
    color: '#A78BFA',
    title: 'Responsive total',
    desc: 'Funciona igual en desktop, tablet y móvil. El POS, el dashboard y los reportes adaptados a cualquier pantalla.',
  },
  {
    icon: Package,
    color: '#FF5C35',
    title: 'Inventario inteligente',
    desc: 'Control de stock, movimientos, lotes y vencimientos. Alertas automáticas cuando el inventario baja del mínimo.',
  },
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

// ── Componentes ───────────────────────────────────────
function FeatureCard({ icon: Icon, color, title, desc, delay }: any) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      padding: '28px 24px',
      background: 'var(--dax-surface)',
      border: '1px solid var(--dax-border)',
      borderRadius: '16px',
      transition: `all .6s ${delay}ms cubic-bezier(.22,1,.36,1)`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(20px)',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${color}18`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-border)';
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: '40px', height: '40px',
        borderRadius: '10px',
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <Icon size={18} color={color} strokeWidth={1.8} />
      </div>
      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '8px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

// ── Página principal ──────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const featuresReveal = useReveal();
  const industriesReveal = useReveal();
  const ctaReveal = useReveal();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0F1924', fontFamily: 'Outfit, system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* ══ NAVBAR ══════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '60px',
        borderBottom: '1px solid rgba(30,58,95,0.6)',
        background: 'rgba(15,25,36,0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(20px, 5vw, 80px)',
        justifyContent: 'space-between',
      }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/login" style={{
            padding: '7px 16px',
            borderRadius: '9px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--dax-text-muted)',
            textDecoration: 'none',
            transition: 'color .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--dax-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--dax-text-muted)')}
          >
            Iniciar sesión
          </a>
          <a href="/register" style={{
            padding: '7px 16px',
            borderRadius: '9px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            background: '#FF5C35',
            textDecoration: 'none',
            transition: 'all .18s',
            boxShadow: '0 2px 12px rgba(255,92,53,.3)',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#E8440E';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#FF5C35';
              (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
          >
            Empezar gratis
          </a>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(100px,12vh,140px) clamp(20px,5vw,80px) clamp(60px,8vh,100px)',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <ParticleField />

        {/* Grid sutil */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(30,58,95,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: '780px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(24px)',
          transition: 'all .9s cubic-bezier(.22,1,.36,1)',
        }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '5px 14px',
            borderRadius: '20px',
            background: 'rgba(255,92,53,.1)',
            border: '1px solid rgba(255,92,53,.25)',
            marginBottom: '28px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF5C35', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF5C35', letterSpacing: '.04em' }}>
              POS multi-industria para América Latina
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.1,
            color: '#fff',
            marginBottom: '24px',
            letterSpacing: '-.02em',
          }}>
            El POS que se adapta<br />
            a tu{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FF8C00, #FF5C35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              negocio
            </span>
          </h1>

          {/* Subtítulo */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: '#4A7FAF',
            lineHeight: 1.75,
            marginBottom: '40px',
            maxWidth: '560px',
            margin: '0 auto 40px',
          }}>
            Gestiona ventas, inventario y sucursales desde un solo sistema. Restaurante, farmacia, peluquería o tienda — DaxCloud se adapta a tu industria.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(255,92,53,.35)',
              transition: 'all .2s',
              letterSpacing: '.01em',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(255,92,53,.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(255,92,53,.35)';
              }}
            >
              Empezar gratis
              <ArrowRight size={16} />
            </a>
            <a href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px',
              background: 'transparent',
              color: '#7BBEE8',
              border: '1px solid #1E3A5F',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all .2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#2A5280';
                (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,.4)';
                (e.currentTarget as HTMLElement).style.color = '#B8D8F0';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1E3A5F';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#7BBEE8';
              }}
            >
              Ver demo
            </a>
          </div>

          {/* Social proof */}
          <div style={{
            display: 'flex', gap: '32px', justifyContent: 'center',
            marginTop: '52px', flexWrap: 'wrap',
          }}>
            {[
              { value: '14 días', label: 'Prueba gratis' },
              { value: 'Sin tarjeta', label: 'No requerida' },
              { value: '8+', label: 'Industrias' },
              { value: '18+', label: 'Países' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: '#2A5280', marginTop: '4px', letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INDUSTRIAS ══════════════════════════════════ */}
      <section style={{
        padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)',
        borderTop: '1px solid #1E3A5F',
      }}>
        <div ref={industriesReveal.ref} style={{
          maxWidth: '1100px', margin: '0 auto',
          opacity: industriesReveal.visible ? 1 : 0,
          transform: industriesReveal.visible ? 'none' : 'translateY(20px)',
          transition: 'all .7s cubic-bezier(.22,1,.36,1)',
        }}>
          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#2A5280',
            marginBottom: '24px',
          }}>
            Una plataforma, todas las industrias
          </p>
          <div style={{
            display: 'flex', gap: '8px',
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <div key={ind.label} style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: `${ind.color}0D`,
                  border: `1px solid ${ind.color}25`,
                  transition: 'all .15s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `${ind.color}18`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${ind.color}50`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = `${ind.color}0D`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${ind.color}25`;
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <Icon size={14} color={ind.color} strokeWidth={1.8} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: ind.color }}>{ind.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)',
        borderTop: '1px solid #1E3A5F',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div ref={featuresReveal.ref} style={{
            textAlign: 'center', marginBottom: '56px',
            opacity: featuresReveal.visible ? 1 : 0,
            transform: featuresReveal.visible ? 'none' : 'translateY(16px)',
            transition: 'all .7s cubic-bezier(.22,1,.36,1)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35', marginBottom: '14px' }}>
              Por qué DaxCloud
            </p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-.01em' }}>
              Todo lo que tu negocio necesita
            </h2>
            <p style={{ fontSize: '15px', color: '#4A7FAF', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Sin módulos extra, sin costos ocultos. Todo incluido desde el primer día.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRECIOS ══════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(60px,8vh,100px) clamp(20px,5vw,80px)',
        borderTop: '1px solid #1E3A5F',
      }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35', marginBottom: '14px' }}>
              Precios
            </p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, color: '#F0F4FF', lineHeight: 1.2, marginBottom: '14px', letterSpacing: '-.01em' }}>
              Simple y transparente
            </h2>
            <p style={{ fontSize: '15px', color: '#3A6A9A', marginBottom: '28px' }}>
              14 días gratis · Sin tarjeta · Cancela cuando quieras
            </p>
            <a href="/pricing" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 600, color: '#FF5C35',
              textDecoration: 'none',
              transition: 'gap .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.gap = '10px')}
              onMouseLeave={e => (e.currentTarget.style.gap = '6px')}
            >
              Ver todos los planes y comparar <ArrowRight size={13} />
            </a>
          </div>

          {/* Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{
                padding: '24px',
                background: plan.popular ? 'rgba(22,34,53,0.9)' : 'rgba(22,34,53,0.5)',
                border: `1px solid ${plan.popular ? 'rgba(255,92,53,.3)' : 'rgba(30,58,95,0.5)'}`,
                borderRadius: '16px',
                position: 'relative',
                backdropFilter: 'blur(12px)',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '20px',
                    padding: '3px 10px', borderRadius: '10px',
                    background: '#FF5C35', fontSize: '10px', fontWeight: 700, color: '#fff',
                  }}>
                    Popular
                  </div>
                )}
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FF', marginBottom: '4px' }}>{plan.label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: plan.popular ? '#FF5C35' : '#F0F4FF', letterSpacing: '-.02em' }}>${plan.monthlyPrice}</span>
                  <span style={{ fontSize: '12px', color: '#2A5280' }}>/mes</span>
                </div>
                <p style={{ fontSize: '11px', color: '#3DBF7F', marginBottom: '16px' }}>
                  o ${plan.annualMonthly}/mes facturado anual
                </p>
                <a href="/register" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '10px',
                  background: plan.popular ? '#FF5C35' : 'transparent',
                  border: `1px solid ${plan.popular ? '#FF5C35' : 'rgba(30,58,95,0.6)'}`,
                  borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700,
                  color: plan.popular ? '#fff' : '#4A7FAF',
                  textDecoration: 'none',
                  transition: 'all .15s',
                }}>
                  Empezar gratis <ArrowRight size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════ */}
      <section style={{
        padding: 'clamp(80px,10vh,120px) clamp(20px,5vw,80px)',
        borderTop: '1px solid #1E3A5F',
      }}>
        <div ref={ctaReveal.ref} style={{
          maxWidth: '640px', margin: '0 auto', textAlign: 'center',
          opacity: ctaReveal.visible ? 1 : 0,
          transform: ctaReveal.visible ? 'none' : 'translateY(20px)',
          transition: 'all .7s cubic-bezier(.22,1,.36,1)',
        }}>
          {/* Nube decorativa */}
          <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
            <svg width="56" height="42" viewBox="0 0 64 48" fill="none">
              <defs>
                <linearGradient id="ctaCloud" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF8C00" />
                  <stop offset="45%" stopColor="#FF5C35" />
                  <stop offset="100%" stopColor="#00C8D4" />
                </linearGradient>
              </defs>
              <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z" fill="none" stroke="url(#ctaCloud)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>

          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-.01em' }}>
            Listo para empezar
          </h2>
          <p style={{ fontSize: '16px', color: '#4A7FAF', marginBottom: '36px', lineHeight: 1.7 }}>
            14 días gratis, sin tarjeta de crédito. Configura tu negocio en menos de 2 minutos.
          </p>

          <a href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '15px 32px',
            background: 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(255,92,53,.40)',
            transition: 'all .2s',
            letterSpacing: '.01em',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,92,53,.50)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'none';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(255,92,53,.40)';
            }}
          >
            Crear cuenta gratis
            <ArrowRight size={16} />
          </a>

          <p style={{ fontSize: '12px', color: '#1E3A5F', marginTop: '16px' }}>
            Sin compromisos · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer style={{
        borderTop: '1px solid #1E3A5F',
        padding: '28px clamp(20px,5vw,80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Términos', href: '/terms' },
            { label: 'Privacidad', href: '/privacy' },
            { label: 'Login', href: '/login' },
            { label: 'Registro', href: '/register' },
          ].map(l => (
            <a key={l.label} href={l.href} style={{
              fontSize: '12px', color: '#2A5280',
              textDecoration: 'none', transition: 'color .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#4A7FAF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#2A5280')}
            >
              {l.label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: '#1E3A5F' }}>
          © {new Date().getFullYear()} DaxCloud · by{' '}
          <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer"
            style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>
            jacana-dev.com
          </a>
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .6; transform: scale(1.3); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}