'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Eye, EyeOff, Building2, Mail, Lock, User, Globe, Check, Zap, BarChart2, Package, Users } from 'lucide-react';

const INDUSTRIES = [
  { value:'general',    label:'Tienda / Retail' },
  { value:'restaurant', label:'Restaurante' },
  { value:'bakery',     label:'Panadería / Pastelería' },
  { value:'pharmacy',   label:'Farmacia' },
  { value:'salon',      label:'Peluquería / Salón' },
  { value:'clothing',   label:'Ropa / Moda' },
  { value:'produce',    label:'Verdulería / Frutería' },
  { value:'supermarket',label:'Supermercado' },
];

function AuthBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let id: number, t = 0, W = 0, H = 0;
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    const orb = (cx: number, cy: number, r: number, c: string) => {
      const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,c); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    };
    const animate = () => {
      id=requestAnimationFrame(animate); t+=.003; ctx.clearRect(0,0,W,H);
      ctx.strokeStyle='rgba(255,92,53,0.03)'; ctx.lineWidth=.5;
      for(let x=0;x<W;x+=56){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=56){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      orb(W*.18+Math.sin(t*.7)*80,H*.28+Math.cos(t*.5)*60,W*.45,`rgba(255,92,53,${.07+.02*Math.sin(t)})`);
      orb(W*.82+Math.cos(t*.6)*60,H*.72+Math.sin(t*.4)*70,W*.4,`rgba(30,58,95,${.08+.02*Math.cos(t*.8)})`);
    };
    resize(); animate();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />;
}

function Field({ label, value, onChange, type='text', placeholder, autoComplete, suffix, Icon, children }: any) {
  const [focused, setFocused] = useState(false);
  if (children) return (
    <div>
      <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color: focused?'#FF5C35':'rgba(255,255,255,0.3)', marginBottom:'7px', transition:'color .2s' }}>{label}</label>
      {children}
    </div>
  );
  return (
    <div>
      <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color: focused?'#FF5C35':'rgba(255,255,255,0.3)', marginBottom:'7px', transition:'color .2s' }}>{label}</label>
      <div style={{ position:'relative' }}>
        {Icon && <Icon size={14} color={focused?'#FF5C35':'rgba(255,255,255,0.2)'} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', transition:'color .2s' }}/>}
        <input type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ width:'100%', padding:`13px ${suffix?'44px':'18px'} 13px ${Icon?'40px':'18px'}`, background:focused?'rgba(255,92,53,0.05)':'rgba(255,255,255,0.04)', border:`1px solid ${focused?'rgba(255,92,53,0.5)':'rgba(255,255,255,0.08)'}`, borderRadius:'12px', color:'#F0F4FF', fontSize:'13px', fontFamily:'Inter,system-ui,sans-serif', outline:'none', boxSizing:'border-box' as const, boxShadow:focused?'0 0 0 3px rgba(255,92,53,0.08)':'none', transition:'all .2s' }}/>
        {suffix&&<div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)' }}>{suffix}</div>}
      </div>
    </div>
  );
}

// Visual izquierdo — features + plan info
function RegisterVisual({ plan }: { plan: string }) {
  const features = [
    { icon:Zap,       label:'POS adaptativo',        desc:'Por industria, táctil y rápido' },
    { icon:BarChart2, label:'Analytics en vivo',      desc:'Ventas y métricas al instante' },
    { icon:Package,   label:'Inventario inteligente', desc:'Alertas de stock automáticas' },
    { icon:Users,     label:'Multi-usuario',          desc:'Roles y permisos por empleado' },
  ];
  return (
    <div style={{ width:'100%', maxWidth:'340px' }}>
      {plan && plan!=='undefined' && (
        <div style={{ padding:'16px 20px', background:'rgba(255,92,53,0.07)', border:'1px solid rgba(255,92,53,0.2)', borderRadius:'16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,92,53,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Zap size={18} color="#FF5C35"/>
          </div>
          <div>
            <p style={{ fontSize:'10px', color:'rgba(255,92,53,0.6)', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' as const }}>Plan seleccionado</p>
            <p style={{ fontSize:'16px', fontWeight:800, color:'#FF5C35', letterSpacing:'-.02em' }}>{plan}</p>
          </div>
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px', marginBottom:'24px' }}>
        {features.map(({ icon:Icon, label, desc }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(255,92,53,0.08)', border:'1px solid rgba(255,92,53,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={15} color="#FF5C35"/>
            </div>
            <div>
              <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.75)', marginBottom:'1px' }}>{label}</p>
              <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>{desc}</p>
            </div>
            <Check size={13} color="rgba(61,191,127,0.6)" style={{ marginLeft:'auto', flexShrink:0 }}/>
          </div>
        ))}
      </div>
      <div style={{ padding:'14px 16px', background:'rgba(61,191,127,0.05)', border:'1px solid rgba(61,191,127,0.15)', borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#3DBF7F', animation:'pulse 2s infinite', flexShrink:0 }}/>
        <p style={{ fontSize:'12px', color:'rgba(61,191,127,0.75)', lineHeight:1.5 }}>14 días gratis · Sin tarjeta · Cancela cuando quieras</p>
      </div>
    </div>
  );
}

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({
    businessName: '', tenantSlug: '', ownerName: '', email: '', password: '', industry: 'general', country: 'CR',
  });
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [mounted, setMounted]     = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  const planParam = params.get('plan') ?? '';

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!slugManual && form.businessName) {
      setForm(p => ({ ...p, tenantSlug: form.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') }));
    }
  }, [form.businessName, slugManual]);

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const strength = [form.password.length>=8,/[A-Z]/.test(form.password),/[0-9]/.test(form.password),/[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length;
  const strColor = ['','#E05050','#F0A030','#5AAAF0','#3DBF7F'];

  const handleSubmit = async () => {
    setError('');
    if (!form.businessName.trim()) return setError('El nombre del negocio es requerido');
    if (!form.tenantSlug.trim()) return setError('El ID de empresa es requerido');
    if (!form.ownerName.trim()) return setError('Tu nombre es requerido');
    if (!form.email.includes('@')) return setError('Correo electrónico inválido');
    if (form.password.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres');
    setLoading(true);
    try {
      await api.post('/auth/register', { businessName: form.businessName, tenantSlug: form.tenantSlug, ownerName: form.ownerName, email: form.email, password: form.password, industry: form.industry, country: form.country });
      await login(form.email, form.password, form.tenantSlug);
    } catch(e: any) { setError(e.response?.data?.message ?? 'Error al crear la cuenta'); setLoading(false); }
  };

  const tr = (d=0) => ({ opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:`all .8s ${d}s cubic-bezier(.22,1,.36,1)` });

  return (
    <div style={{ minHeight:'100vh', background:'#080C14', display:'flex', fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden', position:'relative' }}>
      <AuthBg/>

      {/* IZQUIERDA */}
      <div className="auth-left" style={{ display:'none', flex:'0 0 52%', flexDirection:'column' as const, justifyContent:'space-between', padding:'48px 56px', position:'relative', zIndex:1 }}>
        <a href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'10px', ...tr(0) }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(255,92,53,0.12)', border:'1px solid rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="14" viewBox="0 0 64 48" fill="none"><defs><linearGradient id="regl" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#regl)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:'20px', fontWeight:800, color:'#fff' }}>Dax<span style={{ color:'#FF5C35', fontWeight:300 }}>cloud</span></span>
        </a>
        <div style={{ display:'flex', justifyContent:'center', ...tr(.1) }}>
          <RegisterVisual plan={planParam}/>
        </div>
        <div style={tr(.2)}>
          <h2 style={{ fontSize:'clamp(18px,2vw,26px)', fontWeight:800, color:'#fff', letterSpacing:'-.03em', lineHeight:1.2, marginBottom:'8px' }}>
            Empieza gratis<br/><span style={{ background:'linear-gradient(135deg,#FF5C35,#FF8C00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>en 2 minutos.</span>
          </h2>
          <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', lineHeight:1.7 }}>Sin tarjeta de crédito · Configura todo desde el primer día</p>
        </div>
      </div>

      {/* DERECHA */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', padding:'32px 20px', position:'relative', zIndex:1, overflowY:'auto' }}>

        {/* Logo móvil */}
        <div className="auth-mobile-logo" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px', ...tr(0) }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,92,53,0.12)', border:'1px solid rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="12" viewBox="0 0 64 48" fill="none"><defs><linearGradient id="regm" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#regm)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:'18px', fontWeight:800, color:'#fff' }}>Dax<span style={{ color:'#FF5C35', fontWeight:300 }}>cloud</span></span>
        </div>

        <div style={{ width:'100%', maxWidth:'440px', ...tr(.1) }}>
          <div style={{ background:'rgba(8,14,26,0.82)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)', border:'1px solid rgba(255,92,53,0.14)', borderRadius:'24px', padding:'36px 32px', boxShadow:'0 32px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,0.04)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,92,53,0.35),transparent)' }}/>

            {/* Header */}
            <div style={{ marginBottom:'28px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                <div style={{ height:'2px', width:'24px', borderRadius:'1px', background:'linear-gradient(90deg,#FF5C35,#FF8C00)' }}/>
                <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.65)' }}>Crear cuenta</span>
              </div>
              <h1 style={{ fontSize:'24px', fontWeight:800, color:'#F0F8FF', letterSpacing:'-.02em', marginBottom:'6px' }}>Comienza tu prueba gratis</h1>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>14 días gratis · Sin tarjeta de crédito</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
              {/* Negocio */}
              <Field label="Nombre del negocio" value={form.businessName} onChange={f('businessName')} placeholder="Mi Panadería San José" autoComplete="organization" Icon={Building2}/>

              {/* Slug */}
              <div>
                <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)', marginBottom:'7px' }}>ID de empresa (URL)</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'rgba(255,255,255,0.2)', pointerEvents:'none', fontFamily:'monospace' }}>@</span>
                  <input value={form.tenantSlug} onChange={e => { setSlugManual(true); f('tenantSlug')(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')); }} placeholder="mi-panaderia"
                    style={{ width:'100%', padding:'13px 18px 13px 32px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#F0F4FF', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
                    onFocus={e=>{e.target.style.borderColor='rgba(255,92,53,0.5)';e.target.style.background='rgba(255,92,53,0.05)';e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)';}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.08)';e.target.style.background='rgba(255,255,255,0.04)';e.target.style.boxShadow='none';}}
                  />
                </div>
                {form.tenantSlug && <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', marginTop:'4px', fontFamily:'monospace' }}>daxcloud.shop/@{form.tenantSlug}</p>}
              </div>

              {/* Nombre dueño */}
              <Field label="Tu nombre completo" value={form.ownerName} onChange={f('ownerName')} placeholder="Ana García" autoComplete="name" Icon={User}/>

              {/* Email */}
              <Field label="Correo electrónico" type="email" value={form.email} onChange={f('email')} placeholder="ana@mipanaderia.com" autoComplete="email" Icon={Mail}/>

              {/* Password */}
              <div>
                <Field label="Contraseña" type={showPass?'text':'password'} value={form.password} onChange={f('password')} placeholder="Mínimo 8 caracteres" autoComplete="new-password" Icon={Lock}
                  suffix={<button type="button" onClick={()=>setShowPass(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', padding:'2px', transition:'color .15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#FF5C35')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.3)')}>{showPass?<EyeOff size={14}/>:<Eye size={14}/>}</button>}
                />
                {form.password && (
                  <div style={{ marginTop:'8px' }}>
                    <div style={{ display:'flex', gap:'4px', marginBottom:'3px' }}>
                      {[1,2,3,4].map(i=><div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background:i<=strength?strColor[strength]:'rgba(255,255,255,0.07)', transition:'background .3s' }}/>)}
                    </div>
                    <p style={{ fontSize:'10px', color:strColor[strength], fontWeight:600 }}>{['','Débil','Regular','Buena','Fuerte ✓'][strength]}</p>
                  </div>
                )}
              </div>

              {/* Industria */}
              <div>
                <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)', marginBottom:'7px' }}>Tipo de negocio</label>
                <div style={{ position:'relative' }}>
                  <Globe size={14} color="rgba(255,255,255,0.2)" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <select value={form.industry} onChange={e=>f('industry')(e.target.value)}
                    style={{ width:'100%', padding:'13px 18px 13px 40px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#F0F4FF', fontSize:'13px', fontFamily:'inherit', outline:'none', appearance:'none', WebkitAppearance:'none', cursor:'pointer', boxSizing:'border-box' as const, transition:'all .2s' }}
                    onFocus={e=>{e.target.style.borderColor='rgba(255,92,53,0.5)';e.target.style.background='rgba(255,92,53,0.05)';e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)';}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.08)';e.target.style.background='rgba(255,255,255,0.04)';e.target.style.boxShadow='none';}}>
                    {INDUSTRIES.map(i=><option key={i.value} value={i.value} style={{ background:'#080C14' }}>{i.label}</option>)}
                  </select>
                  <div style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                </div>
              </div>

              {error && <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'10px', animation:'shake .3s ease' }}><p style={{ fontSize:'12px', color:'#E07070' }}>⚠ {error}</p></div>}

              <button type="button" onClick={handleSubmit} disabled={loading}
                style={{ width:'100%', padding:'14px', marginTop:'4px', background:loading?'rgba(255,92,53,0.15)':'linear-gradient(135deg,#FF5C35,#FF3D1F)', color:loading?'rgba(255,92,53,0.4)':'#fff', border:'none', borderRadius:'13px', fontSize:'14px', fontWeight:800, fontFamily:'inherit', cursor:loading?'not-allowed':'pointer', transition:'all .25s', boxShadow:loading?'none':'0 4px 24px rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
                onMouseEnter={e=>{if(!loading){const b=e.currentTarget as HTMLButtonElement;b.style.transform='translateY(-1px)';b.style.boxShadow='0 8px 32px rgba(255,92,53,0.4)';}}}
                onMouseLeave={e=>{if(!loading){const b=e.currentTarget as HTMLButtonElement;b.style.transform='none';b.style.boxShadow='0 4px 24px rgba(255,92,53,0.25)';}}}>
                {loading
                  ? <><span style={{ width:'14px', height:'14px', borderRadius:'50%', border:'2px solid rgba(255,92,53,0.25)', borderTopColor:'rgba(255,92,53,0.6)', animation:'spin .7s linear infinite', display:'inline-block' }}/> Creando cuenta...</>
                  : <>Crear cuenta gratis <ArrowRight size={15}/></>
                }
              </button>

              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', textAlign:'center' as const, lineHeight:1.6 }}>
                Al registrarte aceptas nuestros <a href="/terms" style={{ color:'rgba(255,92,53,0.5)', textDecoration:'none' }}>Términos de servicio</a> y <a href="/privacy" style={{ color:'rgba(255,92,53,0.5)', textDecoration:'none' }}>Política de privacidad</a>
              </p>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'center', marginTop:'20px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.25)' }}>
              ¿Ya tienes cuenta?{' '}
              <a href="/login" style={{ color:'#FF5C35', fontWeight:700, textDecoration:'none', transition:'color .15s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#FF8C00')}
                onMouseLeave={e=>(e.currentTarget.style.color='#FF5C35')}>
                Iniciar sesión
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media(min-width:1024px){.auth-left{display:flex!important}.auth-mobile-logo{display:none!important}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.3)}}
        input:-webkit-autofill,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px rgba(8,14,26,.98) inset!important;-webkit-text-fill-color:#F0F4FF!important;caret-color:#F0F4FF}
        ::placeholder{color:rgba(255,255,255,0.18)!important}
        select option{background:#080C14;color:#F0F4FF}
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#080C14', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ color:'rgba(255,92,53,0.5)', fontSize:'14px', fontFamily:'Inter,system-ui' }}>Cargando...</div></div>}>
      <RegisterInner/>
    </Suspense>
  );
}
