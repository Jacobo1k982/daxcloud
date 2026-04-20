'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Check, ChevronLeft, Eye, EyeOff, ArrowRight, Mail, Building2, Lock, KeyRound, ShieldCheck } from 'lucide-react';

type Step = 'request' | 'verify' | 'reset' | 'success';

function AuthBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let id: number, t = 0, W = 0, H = 0;
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; };
    const orb = (cx: number, cy: number, r: number, c: string) => {
      const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,c); g.addColorStop(1,'transparent');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    };
    const animate = () => {
      id = requestAnimationFrame(animate); t += .003; ctx.clearRect(0,0,W,H);
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

function Field({ label, value, onChange, type='text', placeholder, autoComplete, suffix, Icon }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color: focused ? '#FF5C35' : 'rgba(255,255,255,0.3)', marginBottom:'7px', transition:'color .2s' }}>{label}</label>
      <div style={{ position:'relative' }}>
        {Icon && <Icon size={14} color={focused ? '#FF5C35' : 'rgba(255,255,255,0.2)'} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', transition:'color .2s' }} />}
        <input type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:'100%', padding:`13px ${suffix?'44px':'18px'} 13px ${Icon?'40px':'18px'}`, background: focused ? 'rgba(255,92,53,0.05)' : 'rgba(255,255,255,0.04)', border:`1px solid ${focused ? 'rgba(255,92,53,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius:'12px', color:'#F0F4FF', fontSize:'13px', fontFamily:'Inter,system-ui,sans-serif', outline:'none', boxSizing:'border-box' as const, boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.08)' : 'none', transition:'all .2s' }} />
        {suffix && <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)' }}>{suffix}</div>}
      </div>
    </div>
  );
}

function OTPInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key==='Backspace') { if(value[i]){const n=[...value];n[i]='';onChange(n);}else if(i>0)refs[i-1].current?.focus(); }
    else if(e.key==='ArrowLeft'&&i>0) refs[i-1].current?.focus();
    else if(e.key==='ArrowRight'&&i<5) refs[i+1].current?.focus();
  };
  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g,'').slice(-1); const n=[...value]; n[i]=d; onChange(n);
    if(d&&i<5) refs[i+1].current?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6).split('');
    const n=Array(6).fill(''); digits.forEach((d,i)=>{if(i<6)n[i]=d;}); onChange(n);
    refs[Math.min(digits.length,5)].current?.focus(); e.preventDefault();
  };
  return (
    <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
      {value.map((v,i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={v}
          onChange={e => handleChange(i,e.target.value)} onKeyDown={e => handleKey(i,e)} onPaste={handlePaste}
          style={{ width:'46px', height:'56px', background: v ? 'rgba(255,92,53,0.1)' : 'rgba(255,255,255,0.04)', border:`1.5px solid ${v ? 'rgba(255,92,53,0.6)' : 'rgba(255,255,255,0.1)'}`, borderRadius:'12px', color:'#FF5C35', fontSize:'22px', fontWeight:700, fontFamily:'monospace', textAlign:'center' as const, outline:'none', transition:'all .15s', boxShadow: v ? '0 0 0 3px rgba(255,92,53,0.1)' : 'none' }}
          onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.7)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.12)'; }}
          onBlur={e => { e.target.style.borderColor=v?'rgba(255,92,53,0.6)':'rgba(255,255,255,0.1)'; e.target.style.boxShadow=v?'0 0 0 3px rgba(255,92,53,0.1)':'none'; }}
        />
      ))}
    </div>
  );
}

// Visual izquierdo — pasos del proceso
function RecoveryVisual({ step }: { step: Step }) {
  const steps = [
    { icon: Mail,        label: 'Verifica tu correo', done: ['verify','reset','success'].includes(step), active: step==='request' },
    { icon: KeyRound,    label: 'Ingresa el código',  done: ['reset','success'].includes(step),         active: step==='verify' },
    { icon: Lock,        label: 'Nueva contraseña',   done: ['success'].includes(step),                 active: step==='reset' },
    { icon: ShieldCheck, label: '¡Listo!',            done: step==='success',                           active: step==='success' },
  ];
  return (
    <div style={{ width:'100%', maxWidth:'340px' }}>
      {/* Cards KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'28px' }}>
        {[
          { label:'Empresas protegidas', value:'500+', color:'#FF5C35' },
          { label:'Recuperaciones exitosas', value:'99.8%', color:'#3DBF7F' },
          { label:'Tiempo promedio', value:'< 2 min', color:'#5AAAF0' },
          { label:'Soporte disponible', value:'24/7', color:'#F0A030' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px' }}>
            <p style={{ fontSize:'20px', fontWeight:800, color, letterSpacing:'-.02em', marginBottom:'4px' }}>{value}</p>
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', lineHeight:1.4 }}>{label}</p>
          </div>
        ))}
      </div>
      {/* Stepper */}
      <div style={{ display:'flex', flexDirection:'column' as const, gap:'4px' }}>
        {steps.map(({ icon: Icon, label, done, active }, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'12px', background: active ? 'rgba(255,92,53,0.08)' : done ? 'rgba(61,191,127,0.05)' : 'rgba(255,255,255,0.02)', border: active ? '1px solid rgba(255,92,53,0.2)' : done ? '1px solid rgba(61,191,127,0.15)' : '1px solid rgba(255,255,255,0.05)', transition:'all .3s' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'10px', background: active ? 'rgba(255,92,53,0.15)' : done ? 'rgba(61,191,127,0.12)' : 'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border: active ? '1px solid rgba(255,92,53,0.3)' : done ? '1px solid rgba(61,191,127,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>
              {done && !active
                ? <Check size={16} color="#3DBF7F" />
                : <Icon size={16} color={active ? '#FF5C35' : 'rgba(255,255,255,0.25)'} />
              }
            </div>
            <span style={{ fontSize:'13px', fontWeight: active ? 700 : 500, color: active ? '#fff' : done ? 'rgba(61,191,127,0.8)' : 'rgba(255,255,255,0.3)' }}>{label}</span>
            {active && <div style={{ marginLeft:'auto', width:'6px', height:'6px', borderRadius:'50%', background:'#FF5C35', animation:'pulse 2s infinite' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep]       = useState<Step>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [form, setForm] = useState({ tenantSlug:'', email:'', code:Array(6).fill(''), newPassword:'', confirmPassword:'' });
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => { if(resendTimer<=0) return; const iv=setInterval(()=>setResendTimer(t=>t-1),1000); return()=>clearInterval(iv); }, [resendTimer]);

  const goStep = (s: Step) => { setStep(s); setError(''); setAnimKey(k=>k+1); };

  const handleRequest = async () => {
    setError(''); if(!form.tenantSlug.trim()) return setError('El ID de empresa es requerido'); if(!form.email.includes('@')) return setError('Correo inválido');
    setLoading(true);
    try { await api.post('/auth/password-reset/request', { email:form.email, tenantSlug:form.tenantSlug }); goStep('verify'); setResendTimer(60); }
    catch(e: any) { setError(e.response?.data?.message ?? 'Error al enviar el código'); }
    finally { setLoading(false); }
  };
  const handleVerify = async () => {
    setError(''); if(form.code.join('').length<6) return setError('Ingresa los 6 dígitos');
    setLoading(true);
    try { await api.post('/auth/password-reset/verify', { email:form.email, tenantSlug:form.tenantSlug, code:form.code.join('') }); goStep('reset'); }
    catch(e: any) { setError(e.response?.data?.message ?? 'Código inválido o expirado'); }
    finally { setLoading(false); }
  };
  const handleResend = async () => {
    if(resendTimer>0) return;
    try { await api.post('/auth/password-reset/request', { email:form.email, tenantSlug:form.tenantSlug }); setResendTimer(60); f('code',Array(6).fill('')); }
    catch { setError('Error al reenviar'); }
  };
  const handleReset = async () => {
    setError(''); if(form.newPassword.length<8) return setError('Mínimo 8 caracteres'); if(form.newPassword!==form.confirmPassword) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try { await api.post('/auth/password-reset/confirm', { email:form.email, tenantSlug:form.tenantSlug, code:form.code.join(''), newPassword:form.newPassword }); goStep('success'); }
    catch(e: any) { setError(e.response?.data?.message ?? 'Error al restablecer'); }
    finally { setLoading(false); }
  };

  const steps: Step[] = ['request','verify','reset','success'];
  const stepIdx = steps.indexOf(step);
  const strength = [form.newPassword.length>=8,/[A-Z]/.test(form.newPassword),/[0-9]/.test(form.newPassword),/[^A-Za-z0-9]/.test(form.newPassword)].filter(Boolean).length;
  const strColor = ['','#E05050','#F0A030','#5AAAF0','#3DBF7F'];
  const strLabel = ['','Débil','Regular','Buena','Fuerte ✓'];

  const tr = (d=0) => ({ opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:`all .8s ${d}s cubic-bezier(.22,1,.36,1)` });

  return (
    <div style={{ minHeight:'100vh', background:'#080C14', display:'flex', fontFamily:"'Inter',system-ui,sans-serif", overflow:'hidden', position:'relative' }}>
      <AuthBg />

      {/* IZQUIERDA */}
      <div className="auth-left" style={{ display:'none', flex:'0 0 52%', flexDirection:'column' as const, justifyContent:'space-between', padding:'48px 56px', position:'relative', zIndex:1 }}>
        <a href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'10px', ...tr(0) }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(255,92,53,0.12)', border:'1px solid rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="14" viewBox="0 0 64 48" fill="none"><defs><linearGradient id="fpll" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#fpll)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:'20px', fontWeight:800, color:'#fff' }}>Dax<span style={{ color:'#FF5C35', fontWeight:300 }}>cloud</span></span>
        </a>
        <div style={{ display:'flex', justifyContent:'center', ...tr(.1) }}>
          <RecoveryVisual step={step} />
        </div>
        <div style={tr(.2)}>
          <h2 style={{ fontSize:'clamp(18px,2vw,26px)', fontWeight:800, color:'#fff', letterSpacing:'-.03em', lineHeight:1.2, marginBottom:'8px' }}>
            Tu cuenta,<br/><span style={{ background:'linear-gradient(135deg,#FF5C35,#FF8C00)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>segura siempre.</span>
          </h2>
          <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', lineHeight:1.7 }}>Recupera el acceso en minutos · Código seguro por correo</p>
        </div>
      </div>

      {/* DERECHA */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative', zIndex:1 }}>

        {/* Logo móvil */}
        <div className="auth-mobile-logo" style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'36px', ...tr(0) }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,92,53,0.12)', border:'1px solid rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="12" viewBox="0 0 64 48" fill="none"><defs><linearGradient id="fplm" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs><path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#fplm)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontSize:'18px', fontWeight:800, color:'#fff' }}>Dax<span style={{ color:'#FF5C35', fontWeight:300 }}>cloud</span></span>
        </div>

        <div style={{ width:'100%', maxWidth:'420px', ...tr(.1) }}>
          {/* Card */}
          <div style={{ background:'rgba(8,14,26,0.82)', backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)', border:'1px solid rgba(255,92,53,0.14)', borderRadius:'24px', padding:'36px 32px', boxShadow:'0 32px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,0.04)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,92,53,0.35),transparent)' }} />

            {/* Progress bar */}
            {step!=='success' && (
              <div style={{ display:'flex', gap:'5px', marginBottom:'28px' }}>
                {['request','verify','reset'].map((s,i) => {
                  const done=i<stepIdx, cur=i===stepIdx;
                  return <div key={s} style={{ flex:1, height:'3px', borderRadius:'2px', background: done?'#3DBF7F':cur?'#FF5C35':'rgba(255,255,255,0.07)', transition:'background .4s', position:'relative', overflow:'hidden' }}>
                    {cur && <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', animation:'shimmer 1.5s infinite' }} />}
                  </div>;
                })}
              </div>
            )}

            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:'14px', marginBottom:'28px' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'12px', background: step==='success'?'rgba(61,191,127,0.1)':'rgba(255,92,53,0.1)', border:`1px solid ${step==='success'?'rgba(61,191,127,0.25)':'rgba(255,92,53,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {step==='request' && <Mail size={18} color="#FF5C35"/>}
                {step==='verify'  && <KeyRound size={18} color="#FF5C35"/>}
                {step==='reset'   && <Lock size={18} color="#FF5C35"/>}
                {step==='success' && <Check size={18} color="#3DBF7F"/>}
              </div>
              <div>
                {step!=='success' && <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.6)', marginBottom:'4px' }}>Paso {stepIdx+1} de 3</p>}
                <h1 style={{ fontSize:'21px', fontWeight:800, color:'#F0F8FF', letterSpacing:'-.02em', marginBottom:'4px', lineHeight:1.1 }}>
                  {step==='request'?'Recuperar contraseña':step==='verify'?'Verifica tu identidad':step==='reset'?'Nueva contraseña':'¡Listo!'}
                </h1>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', lineHeight:1.5 }}>
                  {step==='request'?'Ingresa tu ID de empresa y correo registrado':step==='verify'?`Código enviado a ${form.email}`:step==='reset'?'Elige una contraseña segura y única':'Tu contraseña fue restablecida exitosamente'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div key={animKey} style={{ animation:'fadeUp .3s ease', display:'flex', flexDirection:'column' as const, gap:'14px' }}>

              {step==='success' && (
                <div style={{ textAlign:'center', padding:'12px 0' }}>
                  <div style={{ width:'68px', height:'68px', borderRadius:'18px', background:'rgba(61,191,127,0.1)', border:'1px solid rgba(61,191,127,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 0 40px rgba(61,191,127,0.1)' }}>
                    <Check size={30} color="#3DBF7F"/>
                  </div>
                  <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', lineHeight:1.8, marginBottom:'24px' }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                  <a href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 28px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', color:'#fff', borderRadius:'13px', textDecoration:'none', fontSize:'14px', fontWeight:700, boxShadow:'0 4px 20px rgba(255,92,53,0.3)' }}>
                    Iniciar sesión <ArrowRight size={14}/>
                  </a>
                </div>
              )}

              {step==='request' && <>
                <Field label="ID de empresa" value={form.tenantSlug} onChange={(v: string)=>f('tenantSlug',v.toLowerCase().replace(/\s/g,'-'))} placeholder="mi-negocio" autoComplete="organization" Icon={Building2}/>
                <Field label="Correo electrónico" type="email" value={form.email} onChange={(v: string)=>f('email',v)} placeholder="admin@empresa.com" autoComplete="email" Icon={Mail}/>
                <div style={{ padding:'11px 14px', background:'rgba(255,92,53,0.04)', border:'1px solid rgba(255,92,53,0.12)', borderRadius:'10px' }}>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', lineHeight:1.6 }}>Recibirás un código de 6 dígitos válido por 15 minutos.</p>
                </div>
              </>}

              {step==='verify' && <>
                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', textAlign:'center' as const }}>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginBottom:'3px' }}>Código enviado a</p>
                  <p style={{ fontSize:'14px', fontWeight:700, color:'#5AAAF0' }}>{form.email}</p>
                </div>
                <div>
                  <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)', textAlign:'center' as const, marginBottom:'16px' }}>Ingresa el código de 6 dígitos</p>
                  <OTPInput value={form.code} onChange={v=>f('code',v)}/>
                </div>
                <div style={{ textAlign:'center' as const }}>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)' }}>
                    ¿No recibiste?{' '}
                    <button onClick={handleResend} disabled={resendTimer>0} style={{ background:'none', border:'none', cursor:resendTimer>0?'not-allowed':'pointer', color:resendTimer>0?'rgba(255,255,255,0.25)':'#FF5C35', fontWeight:600, fontSize:'12px', fontFamily:'inherit', padding:0, transition:'color .15s' }}>
                      {resendTimer>0?`Reenviar (${resendTimer}s)`:'Reenviar'}
                    </button>
                  </p>
                </div>
              </>}

              {step==='reset' && <>
                <div>
                  <Field label="Nueva contraseña" type={showPass?'text':'password'} value={form.newPassword} onChange={(v: string)=>f('newPassword',v)} placeholder="••••••••" Icon={Lock}
                    suffix={<button type="button" onClick={()=>setShowPass(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', padding:'2px', transition:'color .15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#FF5C35')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.3)')}>{showPass?<EyeOff size={14}/>:<Eye size={14}/>}</button>}
                  />
                  {form.newPassword && (
                    <div style={{ marginTop:'8px' }}>
                      <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                        {[1,2,3,4].map(i=><div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background:i<=strength?strColor[strength]:'rgba(255,255,255,0.07)', transition:'background .3s' }}/>)}
                      </div>
                      <p style={{ fontSize:'10px', color:strColor[strength], fontWeight:600 }}>{strLabel[strength]}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Field label="Confirmar contraseña" type={showConf?'text':'password'} value={form.confirmPassword} onChange={(v: string)=>f('confirmPassword',v)} placeholder="••••••••" Icon={Lock}
                    suffix={<button type="button" onClick={()=>setShowConf(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', padding:'2px', transition:'color .15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#FF5C35')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.3)')}>{showConf?<EyeOff size={14}/>:<Eye size={14}/>}</button>}
                  />
                  {form.confirmPassword && form.newPassword!==form.confirmPassword && <p style={{ fontSize:'11px', color:'#E07070', marginTop:'6px' }}>⚠ Las contraseñas no coinciden</p>}
                  {form.confirmPassword && form.newPassword===form.confirmPassword && form.newPassword.length>=8 && <p style={{ fontSize:'11px', color:'#3DBF7F', marginTop:'6px', display:'flex', alignItems:'center', gap:'4px' }}><Check size={10}/> Contraseñas coinciden</p>}
                </div>
              </>}

              {error && <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'10px', animation:'shake .3s ease' }}><p style={{ fontSize:'12px', color:'#E07070' }}>⚠ {error}</p></div>}

              {step!=='success' && (
                <button type="button"
                  onClick={step==='request'?handleRequest:step==='verify'?handleVerify:handleReset}
                  disabled={loading}
                  style={{ width:'100%', padding:'14px', background:loading?'rgba(255,92,53,0.15)':'linear-gradient(135deg,#FF5C35,#FF3D1F)', color:loading?'rgba(255,92,53,0.4)':'#fff', border:'none', borderRadius:'13px', fontSize:'14px', fontWeight:800, fontFamily:'inherit', cursor:loading?'not-allowed':'pointer', transition:'all .25s', boxShadow:loading?'none':'0 4px 24px rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
                  onMouseEnter={e=>{if(!loading){const b=e.currentTarget as HTMLButtonElement;b.style.transform='translateY(-1px)';b.style.boxShadow='0 8px 32px rgba(255,92,53,0.4)';}}}
                  onMouseLeave={e=>{if(!loading){const b=e.currentTarget as HTMLButtonElement;b.style.transform='none';b.style.boxShadow='0 4px 24px rgba(255,92,53,0.25)';}}}>
                  {loading
                    ? <><span style={{ width:'14px', height:'14px', borderRadius:'50%', border:'2px solid rgba(255,92,53,0.25)', borderTopColor:'rgba(255,92,53,0.6)', animation:'spin .7s linear infinite', display:'inline-block' }}/> Procesando...</>
                    : <>{step==='request'?'Enviar código':step==='verify'?'Verificar código':'Restablecer contraseña'} <ArrowRight size={15}/></>
                  }
                </button>
              )}
            </div>
          </div>

          {/* Back link */}
          <div style={{ display:'flex', justifyContent:'center', marginTop:'20px' }}>
            <a href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.25)', textDecoration:'none', transition:'color .15s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.25)')}>
              <ChevronLeft size={14}/> Volver al login
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media(min-width:1024px){.auth-left{display:flex!important}.auth-mobile-logo{display:none!important}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.3)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        input:-webkit-autofill,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px rgba(8,14,26,.98) inset!important;-webkit-text-fill-color:#F0F4FF!important;caret-color:#F0F4FF}
        ::placeholder{color:rgba(255,255,255,0.18)!important}
      `}</style>
    </div>
  );
}
