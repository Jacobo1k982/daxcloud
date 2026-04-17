'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]         = useState({ tenantSlug: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [mounted, setMounted]   = useState(false);

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

  return (
    <div style={{ minHeight: '100vh', background: '#0B1C2C', display: 'flex', fontFamily: "'Inter', 'Outfit', system-ui, sans-serif", overflow: 'hidden', position: 'relative' }}>

      {/* ── LADO IZQUIERDO — Ilustración ── */}
      <div className="login-left" style={{ display: 'none', flex: '0 0 55%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #0D2137 0%, #0B1C2C 40%, #0D2137 100%)' }}>

        {/* Fondo tienda SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" fill="none">
          {/* Cielo degradado */}
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A3A5C"/><stop offset="100%" stopColor="#0B1C2C"/></linearGradient>
            <linearGradient id="coral" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient>
            <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0D1F30"/><stop offset="100%" stopColor="#081218"/></linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1E4A6E" stopOpacity="0.6"/><stop offset="100%" stopColor="#0B2A45" stopOpacity="0.8"/></linearGradient>
            <linearGradient id="awning" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FF5C35"/><stop offset="50%" stopColor="#FF8C00"/><stop offset="100%" stopColor="#FF5C35"/></linearGradient>
            <radialGradient id="glow1" cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="#FF5C35" stopOpacity="0.12"/><stop offset="100%" stopColor="transparent"/></radialGradient>
            <radialGradient id="glow2" cx="30%" cy="70%" r="40%"><stop offset="0%" stopColor="#5AAAF0" stopOpacity="0.08"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          </defs>

          {/* Fondo */}
          <rect width="800" height="900" fill="url(#sky)"/>
          <rect width="800" height="900" fill="url(#glow1)"/>
          <rect width="800" height="900" fill="url(#glow2)"/>

          {/* Piso */}
          <rect y="640" width="800" height="260" fill="url(#floor)"/>
          <line x1="0" y1="640" x2="800" y2="640" stroke="rgba(255,92,53,0.15)" strokeWidth="1"/>

          {/* ── TIENDA PRINCIPAL ── */}
          {/* Estructura */}
          <rect x="80" y="320" width="460" height="330" fill="#0D2A3F" stroke="rgba(255,92,53,0.2)" strokeWidth="1.5" rx="4"/>
          {/* Techo / cornisa */}
          <rect x="60" y="290" width="500" height="40" fill="#0F3050" stroke="rgba(255,92,53,0.25)" strokeWidth="1" rx="3"/>
          <rect x="70" y="298" width="480" height="6" fill="url(#coral)" rx="2"/>
          {/* Toldo */}
          <path d="M60 330 Q160 310 260 330 Q360 310 460 330 Q510 318 560 330" fill="url(#awning)" opacity="0.85"/>
          <path d="M60 330 Q160 310 260 330 Q360 310 460 330 Q510 318 560 330" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
          {/* Franjas toldo */}
          {[80,140,200,260,320,380,440,500].map((x, i) => (
            <line key={i} x1={x} y1="325" x2={x-10} y2="342" stroke="rgba(255,255,255,0.12)" strokeWidth="8"/>
          ))}

          {/* Ventana grande izq */}
          <rect x="100" y="380" width="160" height="200" fill="url(#glass)" stroke="rgba(90,170,240,0.3)" strokeWidth="1.5" rx="3"/>
          <line x1="180" y1="380" x2="180" y2="580" stroke="rgba(90,170,240,0.2)" strokeWidth="1"/>
          <line x1="100" y1="480" x2="260" y2="480" stroke="rgba(90,170,240,0.2)" strokeWidth="1"/>
          {/* Reflejo ventana */}
          <path d="M108 388 L140 388 L108 420 Z" fill="rgba(255,255,255,0.04)"/>

          {/* Ventana grande der */}
          <rect x="360" y="380" width="160" height="200" fill="url(#glass)" stroke="rgba(90,170,240,0.3)" strokeWidth="1.5" rx="3"/>
          <line x1="440" y1="380" x2="440" y2="580" stroke="rgba(90,170,240,0.2)" strokeWidth="1"/>
          <line x1="360" y1="480" x2="520" y2="480" stroke="rgba(90,170,240,0.2)" strokeWidth="1"/>
          <path d="M368 388 L400 388 L368 420 Z" fill="rgba(255,255,255,0.04)"/>

          {/* Puerta */}
          <rect x="250" y="460" width="120" height="190" fill="#0A2030" stroke="rgba(255,92,53,0.3)" strokeWidth="1.5" rx="3"/>
          <rect x="258" y="468" width="50" height="90" fill="url(#glass)" rx="2"/>
          <rect x="312" y="468" width="50" height="90" fill="url(#glass)" rx="2"/>
          <circle cx="307" cy="520" r="4" fill="rgba(255,180,50,0.7)"/>
          <circle cx="313" cy="520" r="4" fill="rgba(255,180,50,0.7)"/>

          {/* Cartel tienda */}
          <rect x="180" y="338" width="260" height="36" fill="rgba(255,92,53,0.12)" stroke="rgba(255,92,53,0.35)" strokeWidth="1" rx="4"/>
          {/* Logo Daxcloud en el cartel */}
          <text x="230" y="362" fontFamily="Inter,system-ui" fontSize="16" fontWeight="700" fill="#FF5C35" letterSpacing="-0.5">Dax</text>
          <text x="265" y="362" fontFamily="Inter,system-ui" fontSize="16" fontWeight="300" fill="#FF8C00" letterSpacing="-0.5">cloud</text>
          {/* Nube pequeña */}
          <path d="M208 354 Q202 354 202 349 Q202 344 207 343 Q207 339 211 338 Q214 335 218 336 Q221 333 224 334 Q228 333 229 337 Q232 337 233 341 Q235 342 235 346 Q235 350 231 350 Z" fill="none" stroke="#FF8C00" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>

          {/* Luces ventana izq */}
          <rect x="112" y="396" width="60" height="8" fill="rgba(255,180,50,0.15)" rx="2"/>
          <rect x="112" y="412" width="40" height="5" fill="rgba(255,180,50,0.1)" rx="2"/>
          <rect x="112" y="425" width="50" height="5" fill="rgba(255,180,50,0.1)" rx="2"/>

          {/* Luces ventana der */}
          <rect x="372" y="396" width="60" height="8" fill="rgba(255,180,50,0.15)" rx="2"/>
          <rect x="372" y="412" width="40" height="5" fill="rgba(255,180,50,0.1)" rx="2"/>
          <rect x="372" y="425" width="50" height="5" fill="rgba(255,180,50,0.1)" rx="2"/>

          {/* ── EDIFICIO FONDO IZQ ── */}
          <rect x="0" y="380" width="90" height="260" fill="#091828" stroke="rgba(30,58,95,0.3)" strokeWidth="1"/>
          {[400,430,460,490,520,550,580,610].map((y, i) => (
            <rect key={i} x="10" y={y} width="25" height="18" fill={i%3===0?"rgba(255,180,50,0.15)":"rgba(30,58,95,0.3)"} rx="1"/>
          ))}
          {[400,430,460,490,520,550,580,610].map((y, i) => (
            <rect key={i} x="50" y={y} width="25" height="18" fill={i%2===0?"rgba(255,180,50,0.12)":"rgba(30,58,95,0.2)"} rx="1"/>
          ))}

          {/* ── EDIFICIO FONDO DER ── */}
          <rect x="600" y="360" width="200" height="280" fill="#091828" stroke="rgba(30,58,95,0.3)" strokeWidth="1"/>
          {[380,410,440,470,500,530,560,590,620].map((y, i) => (
            <rect key={i} x="612" y={y} width="22" height="16" fill={i%2===0?"rgba(255,180,50,0.12)":"rgba(30,58,95,0.25)"} rx="1"/>
          ))}
          {[380,410,440,470,500,530,560,590,620].map((y, i) => (
            <rect key={i} x="648" y={y} width="22" height="16" fill={i%3===0?"rgba(90,170,240,0.12)":"rgba(30,58,95,0.2)"} rx="1"/>
          ))}
          {[380,410,440,470,500,530,560,590,620].map((y, i) => (
            <rect key={i} x="684" y={y} width="22" height="16" fill={i%2===1?"rgba(255,180,50,0.1)":"rgba(30,58,95,0.15)"} rx="1"/>
          ))}
          {[380,410,440,470,500,530,560,590,620].map((y, i) => (
            <rect key={i} x="720" y={y} width="22" height="16" fill={i%3===1?"rgba(255,92,53,0.1)":"rgba(30,58,95,0.15)"} rx="1"/>
          ))}
          {[380,410,440,470,500,530,560,590,620].map((y, i) => (
            <rect key={i} x="756" y={y} width="22" height="16" fill={i%2===0?"rgba(90,170,240,0.1)":"rgba(30,58,95,0.1)"} rx="1"/>
          ))}

          {/* ── PERSONA CON LAPTOP ── */}
          {/* Sombra suelo */}
          <ellipse cx="400" cy="648" rx="60" ry="8" fill="rgba(0,0,0,0.3)"/>

          {/* Piernas */}
          <rect x="370" y="560" width="22" height="85" rx="10" fill="#1A3A6A"/>
          <rect x="400" y="555" width="22" height="90" rx="10" fill="#1E4275"/>
          {/* Zapatos */}
          <rect x="363" y="638" width="32" height="12" rx="5" fill="#0A1525"/>
          <rect x="395" y="638" width="32" height="12" rx="5" fill="#0A1525"/>

          {/* Cuerpo */}
          <rect x="355" y="430" width="85" height="140" rx="22" fill="#FF6B35"/>
          {/* Cuello */}
          <rect x="385" y="420" width="25" height="20" rx="8" fill="#F5C5A0"/>
          {/* Cabeza */}
          <ellipse cx="397" cy="400" rx="32" ry="35" fill="#F5C5A0"/>
          {/* Cabello */}
          <path d="M365 390 Q367 360 397 358 Q427 360 430 390 Q425 375 397 373 Q369 375 365 390Z" fill="#2C1810"/>
          {/* Ojos */}
          <ellipse cx="387" cy="398" rx="4" ry="5" fill="#2C1810"/>
          <ellipse cx="407" cy="398" rx="4" ry="5" fill="#2C1810"/>
          <circle cx="389" cy="396" r="1.5" fill="white"/>
          <circle cx="409" cy="396" r="1.5" fill="white"/>
          {/* Sonrisa */}
          <path d="M387 413 Q397 420 407 413" stroke="#C4845A" strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* Brazo izq con laptop */}
          <path d="M355 465 Q320 480 310 510 Q305 525 320 530" stroke="#FF6B35" strokeWidth="22" fill="none" strokeLinecap="round"/>
          {/* Brazo der */}
          <path d="M440 465 Q470 490 465 520" stroke="#FF6B35" strokeWidth="20" fill="none" strokeLinecap="round"/>
          {/* Mano */}
          <ellipse cx="320" cy="532" rx="12" ry="10" fill="#F5C5A0"/>

          {/* LAPTOP */}
          <rect x="272" y="490" width="130" height="82" rx="6" fill="#1A2F45" stroke="rgba(90,170,240,0.4)" strokeWidth="1.5"/>
          <rect x="278" y="496" width="118" height="70" rx="4" fill="#0D1F30"/>
          {/* Pantalla laptop — dashboard mini */}
          <rect x="283" y="501" width="108" height="60" rx="3" fill="#081525"/>
          {/* Barra top */}
          <rect x="283" y="501" width="108" height="10" fill="#0F2A40" rx="3"/>
          <circle cx="290" cy="506" r="2" fill="#FF5C35" opacity="0.7"/>
          <circle cx="297" cy="506" r="2" fill="#FFB347" opacity="0.7"/>
          <circle cx="304" cy="506" r="2" fill="#4CAF50" opacity="0.7"/>
          {/* KPIs mini */}
          <rect x="286" y="516" width="30" height="16" rx="2" fill="rgba(255,92,53,0.2)" stroke="rgba(255,92,53,0.3)" strokeWidth="0.5"/>
          <rect x="320" y="516" width="30" height="16" rx="2" fill="rgba(90,170,240,0.2)" stroke="rgba(90,170,240,0.3)" strokeWidth="0.5"/>
          <rect x="354" y="516" width="30" height="16" rx="2" fill="rgba(61,191,127,0.2)" stroke="rgba(61,191,127,0.3)" strokeWidth="0.5"/>
          {/* Barras chart */}
          {[8,14,10,18,12,20,15].map((h, i) => (
            <rect key={i} x={288+i*14} y={556-h} width="8" height={h} rx="1" fill={i===6?"rgba(255,92,53,0.8)":"rgba(90,170,240,0.35)"}/>
          ))}
          {/* Base laptop */}
          <rect x="265" y="572" width="145" height="8" rx="3" fill="#1A2F45" stroke="rgba(90,170,240,0.3)" strokeWidth="1"/>

          {/* Burbujas flotantes */}
          <g opacity="0.9">
            <rect x="460" y="430" width="110" height="36" rx="10" fill="rgba(61,191,127,0.12)" stroke="rgba(61,191,127,0.3)" strokeWidth="1"/>
            <circle cx="477" cy="448" r="6" fill="rgba(61,191,127,0.3)"/>
            <text x="490" y="444" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(255,255,255,0.7)" fontWeight="600">Venta ✓</text>
            <text x="490" y="456" fontFamily="Inter,system-ui" fontSize="10" fill="#3DBF7F" fontWeight="700">₡10,600</text>
          </g>
          <g opacity="0.8">
            <rect x="150" y="420" width="120" height="36" rx="10" fill="rgba(255,92,53,0.1)" stroke="rgba(255,92,53,0.25)" strokeWidth="1"/>
            <circle cx="167" cy="438" r="6" fill="rgba(255,92,53,0.3)"/>
            <text x="180" y="434" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(255,255,255,0.6)" fontWeight="600">Hoy</text>
            <text x="180" y="447" fontFamily="Inter,system-ui" fontSize="10" fill="#FF5C35" fontWeight="700">+₡84,200</text>
          </g>

          {/* Estrellas / partículas */}
          {[[100,200],[650,250],[720,180],[50,450],[750,420],[400,200],[500,160]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r={i%2===0?1.5:1} fill="rgba(255,255,255,0.3)"/>
          ))}

          {/* Suelo reflection */}
          <rect x="0" y="640" width="800" height="2" fill="rgba(255,92,53,0.1)"/>

          {/* Logo grande en el fondo */}
          <text x="160" y="750" fontFamily="Inter,system-ui" fontSize="42" fontWeight="800" fill="rgba(255,92,53,0.05)" letterSpacing="-2">Daxcloud</text>
        </svg>

        {/* Logo overlay top-left */}
        <div style={{ position:'absolute', top:'36px', left:'48px', display:'flex', alignItems:'center', gap:'12px', zIndex:10, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(-10px)', transition:'all .8s cubic-bezier(.22,1,.36,1)' }}>
          <svg width="38" height="29" viewBox="0 0 64 48" fill="none">
            <defs>
              <linearGradient id="logol" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%"  stopColor="#FF8C00"/>
                <stop offset="45%" stopColor="#FF5C35"/>
                <stop offset="100%" stopColor="#FF8C00"/>
              </linearGradient>
            </defs>
            <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#logol)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'-.03em' }}>Dax</span>
            <span style={{ fontSize:'22px', fontWeight:300, color:'#FF5C35', letterSpacing:'-.03em' }}>cloud</span>
          </div>
        </div>

        {/* Tagline bottom */}
        <div style={{ position:'absolute', bottom:'40px', left:'48px', right:'48px', zIndex:10, opacity: mounted ? 1 : 0, transition:'all .8s .3s ease' }}>
          <h2 style={{ fontSize:'clamp(22px,2.5vw,32px)', fontWeight:800, color:'#fff', letterSpacing:'-.03em', lineHeight:1.2, marginBottom:'10px' }}>
            Tu negocio,<br/>
            <span style={{ background:'linear-gradient(135deg,#FF5C35,#FF8C00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>en control total.</span>
          </h2>
          <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>
            POS moderno · Inventario en tiempo real · Multi-sucursal
          </p>
        </div>
      </div>

      {/* ── LADO DERECHO — Formulario ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative', zIndex:1 }}>

        {/* Logo móvil */}
        <div className="auth-mobile-logo" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'44px', opacity: mounted ? 1 : 0, transition:'all .6s ease' }}>
          <svg width="36" height="27" viewBox="0 0 64 48" fill="none">
            <defs><linearGradient id="logom" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
            <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#logom)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontSize:'20px', fontWeight:800, color:'#fff', letterSpacing:'-.03em' }}>Dax</span>
            <span style={{ fontSize:'20px', fontWeight:300, color:'#FF5C35', letterSpacing:'-.03em' }}>cloud</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ width:'100%', maxWidth:'400px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition:'all .8s .1s cubic-bezier(.22,1,.36,1)' }}>
          <div style={{
            background:'rgba(13,26,42,0.92)',
            backdropFilter:'blur(24px)',
            WebkitBackdropFilter:'blur(24px)',
            border:'1px solid rgba(255,92,53,0.15)',
            borderRadius:'24px',
            padding:'40px 36px',
            boxShadow:'0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:'32px' }}>
              {/* Logo dentro del card */}
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
                <svg width="32" height="24" viewBox="0 0 64 48" fill="none">
                  <defs><linearGradient id="logoc" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
                  <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#logoc)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
                </svg>
                <div>
                  <span style={{ fontSize:'18px', fontWeight:800, color:'#fff', letterSpacing:'-.03em' }}>Dax</span>
                  <span style={{ fontSize:'18px', fontWeight:300, color:'#FF5C35', letterSpacing:'-.03em' }}>cloud</span>
                </div>
              </div>
              <h1 style={{ fontSize:'22px', fontWeight:800, color:'#F0F4FF', letterSpacing:'-.02em', marginBottom:'6px' }}>Welcome To Family</h1>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* ID empresa */}
              <div>
                <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)', marginBottom:'7px' }}>ID de empresa</label>
                <input
                  value={form.tenantSlug} onChange={e => set('tenantSlug')(e.target.value)}
                  placeholder="mi-negocio" autoComplete="organization"
                  style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#F0F4FF', fontSize:'13px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
                  onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none'; }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)', marginBottom:'7px' }}>Correo electrónico</label>
                <input
                  type="email" value={form.email} onChange={e => set('email')(e.target.value)}
                  placeholder="admin@empresa.com" autoComplete="email"
                  style={{ width:'100%', padding:'12px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#F0F4FF', fontSize:'13px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
                  onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none'; }}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px' }}>
                  <label style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)' }}>Contraseña</label>
                  <a href="/forgot-password" style={{ fontSize:'11px', color:'rgba(255,92,53,0.6)', textDecoration:'none', fontWeight:600, transition:'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,92,53,0.6)')}>
                    ¿Olvidaste la contraseña?
                  </a>
                </div>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password')(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    style={{ width:'100%', padding:'12px 44px 12px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#F0F4FF', fontSize:'13px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
                    onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', padding:'2px', transition:'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.08)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'10px', animation:'shake .3s ease' }}>
                  <p style={{ fontSize:'12px', color:'#E07070' }}>⚠ {error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'14px', marginTop:'4px',
                background: loading ? 'rgba(255,92,53,0.2)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)',
                color: loading ? 'rgba(255,92,53,0.5)' : '#fff',
                border:'none', borderRadius:'13px', fontSize:'14px', fontWeight:700,
                fontFamily:'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                transition:'all .25s', boxShadow: loading ? 'none' : '0 4px 24px rgba(255,92,53,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 8px 32px rgba(255,92,53,0.45)'; }}}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 4px 24px rgba(255,92,53,0.3)'; }}}>
                {loading
                  ? <><span style={{ width:'14px', height:'14px', borderRadius:'50%', border:'2px solid rgba(255,92,53,0.3)', borderTopColor:'rgba(255,92,53,0.7)', animation:'spin .7s linear infinite', display:'inline-block' }} /> Ingresando...</>
                  : <>Login <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'22px 0' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', whiteSpace:'nowrap' }}>¿Nuevo en DaxCloud?</span>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
            </div>

            <a href="/register" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
              padding:'12px', background:'transparent',
              border:'1px solid rgba(255,92,53,0.2)', borderRadius:'13px',
              fontSize:'13px', fontWeight:600, color:'rgba(255,92,53,0.6)',
              textDecoration:'none', transition:'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.45)'; (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.06)'; (e.currentTarget as HTMLElement).style.color='#FF5C35'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.2)'; (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,92,53,0.6)'; }}>
              Crear cuenta gratis
            </a>
          </div>

          <p style={{ textAlign:'center', marginTop:'18px', fontSize:'11px', color:'rgba(255,255,255,0.1)' }}>
            © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media(min-width:1024px){.auth-left{display:flex!important;flex-direction:column}.auth-mobile-logo{display:none!important}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        input:-webkit-autofill,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px rgba(13,26,42,0.98) inset!important;-webkit-text-fill-color:#F0F4FF!important;caret-color:#F0F4FF}
        ::placeholder{color:rgba(255,255,255,0.2)!important}
      `}</style>
    </div>
  );
}
