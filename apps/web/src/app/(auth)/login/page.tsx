'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

function StoreIllustration() {
  return (
    <svg viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0F2840"/><stop offset="100%" stopColor="#091828"/></linearGradient>
        <linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0A1E30"/><stop offset="100%" stopColor="#0D2540"/></linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0D1F2E"/><stop offset="100%" stopColor="#060D14"/></linearGradient>
        <linearGradient id="coral" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient>
        <linearGradient id="shelf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A3550"/><stop offset="100%" stopColor="#0F2035"/></linearGradient>
        <linearGradient id="counter" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1E3F60"/><stop offset="100%" stopColor="#102030"/></linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#081525"/><stop offset="100%" stopColor="#0A1F35"/></linearGradient>
        <radialGradient id="light1" cx="20%" cy="0%" r="60%"><stop offset="0%" stopColor="#FF8C00" stopOpacity="0.08"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <radialGradient id="light2" cx="80%" cy="0%" r="60%"><stop offset="0%" stopColor="#5AAAF0" stopOpacity="0.06"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        <filter id="sglow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="scene"><rect width="900" height="700"/></clipPath>
      </defs>
      <g clipPath="url(#scene)">
        {/* Fondo */}
        <rect width="900" height="700" fill="url(#wall)"/>
        <rect width="900" height="700" fill="url(#light1)"/>
        <rect width="900" height="700" fill="url(#light2)"/>
        {/* Techo */}
        <rect y="0" width="900" height="120" fill="url(#ceiling)"/>
        <line x1="0" y1="120" x2="900" y2="120" stroke="rgba(255,92,53,0.12)" strokeWidth="1"/>
        {/* Perspectiva */}
        <line x1="0" y1="700" x2="450" y2="350" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        <line x1="900" y1="700" x2="450" y2="350" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        {/* Piso */}
        <rect y="500" width="900" height="200" fill="url(#floor)"/>
        <line x1="0" y1="500" x2="900" y2="500" stroke="rgba(255,92,53,0.08)" strokeWidth="1"/>
        {[540,580,620,660].map((y,i) => <line key={i} x1="0" y1={y} x2="900" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>)}
        {[150,300,450,600,750].map((x,i) => <line key={i} x1={x} y1="500" x2={x-150} y2="700" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>)}
        <line x1="900" y1="500" x2="750" y2="700" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
        {/* Luces techo */}
        {[100,300,520,730].map((x,i) => <rect key={i} x={x} y="95" width="60" height="12" rx="3" fill="rgba(255,220,150,0.15)" stroke="rgba(255,220,150,0.2)" strokeWidth="1"/>)}
        {[130,330,550,760].map((x,i) => <path key={i} d={`M${x-30} 107 L${x-50} 400`} stroke="rgba(255,220,100,0.025)" strokeWidth="60"/>)}
        {/* Letrero */}
        <rect x="280" y="25" width="340" height="60" rx="8" fill="rgba(255,92,53,0.08)" stroke="rgba(255,92,53,0.25)" strokeWidth="1.5"/>
        <rect x="288" y="33" width="324" height="44" rx="5" fill="rgba(255,92,53,0.04)"/>
        <path d="M310 55Q302 55 302 49Q302 43 309 42Q310 36 317 35Q321 30 327 31Q332 27 336 28Q342 27 344 33Q348 33 350 38Q353 39 353 44Q353 50 347 50Z" fill="none" stroke="url(#coral)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#sglow)"/>
        <line x1="327" y1="36" x2="327" y2="49" stroke="rgba(255,140,0,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="320" y1="42" x2="334" y2="42" stroke="rgba(255,140,0,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="327" cy="42" r="1.5" fill="#FF8C00" filter="url(#sglow)"/>
        <text x="368" y="53" fontFamily="Inter,system-ui,sans-serif" fontSize="22" fontWeight="800" fill="#fff" letterSpacing="-0.8">Dax</text>
        <text x="408" y="53" fontFamily="Inter,system-ui,sans-serif" fontSize="22" fontWeight="300" fill="#FF5C35" letterSpacing="-0.5">cloud</text>
        <rect x="280" y="83" width="340" height="3" rx="1" fill="url(#coral)" opacity="0.4"/>
        {/* Estantes izquierda */}
        <rect x="20" y="130" width="200" height="360" rx="4" fill="rgba(10,22,38,0.7)" stroke="rgba(255,92,53,0.1)" strokeWidth="1"/>
        {[130,225,320,415].map((y,i) => <rect key={i} x="20" y={y} width="200" height="8" rx="2" fill="url(#shelf)"/>)}
        {[['#C0392B','#2980B9','#27AE60','#8E44AD','#E67E22','#1ABC9C','#C0392B'],[30,56,82,104,133,157,179]].map(() => null)}
        {[[30,'#C0392B'],[56,'#2980B9'],[82,'#27AE60'],[104,'#8E44AD'],[133,'#E67E22'],[157,'#1ABC9C'],[179,'#C0392B']].map(([x,c],i) => <rect key={i} x={x as number} y="155" width={i===3?25:22} height="66" rx="3" fill={c as string} opacity="0.82"/>)}
        {[[28,'#16A085'],[57,'#D35400'],[81,'#8E44AD'],[107,'#2C3E50'],[139,'#C0392B'],[163,'#27AE60'],[189,'#F39C12']].map(([x,c],i) => <rect key={i} x={x as number} y="248" width={i===3?28:22} height="68" rx="3" fill={c as string} opacity="0.78"/>)}
        {[[30,'#2980B9'],[64,'#E74C3C'],[88,'#27AE60'],[117,'#8E44AD'],[139,'#D35400'],[165,'#1ABC9C'],[194,'#C0392B']].map(([x,c],i) => <rect key={i} x={x as number} y="340" width={i===0?30:22} height="70" rx="3" fill={c as string} opacity="0.72"/>)}
        <rect x="30" y="209" width="180" height="14" rx="2" fill="rgba(255,92,53,0.08)"/>
        <text x="38" y="220" fontFamily="Inter,system-ui" fontSize="8" fill="rgba(255,255,255,0.35)">OFERTAS DE HOY</text>
        {/* Estantes derecha */}
        <rect x="680" y="130" width="200" height="360" rx="4" fill="rgba(10,22,38,0.7)" stroke="rgba(255,92,53,0.1)" strokeWidth="1"/>
        {[130,225,320,415].map((y,i) => <rect key={i} x="680" y={y} width="200" height="8" rx="2" fill="url(#shelf)"/>)}
        {[[690,'#E74C3C'],[716,'#3498DB'],[745,'#2ECC71'],[769,'#9B59B6'],[795,'#F39C12'],[817,'#1ABC9C'],[843,'#E74C3C']].map(([x,c],i) => <rect key={i} x={x as number} y="153" width="22" height="68" rx="3" fill={c as string} opacity="0.78"/>)}
        {[[688,'#16A085'],[720,'#D35400'],[744,'#8E44AD'],[773,'#E74C3C'],[797,'#27AE60'],[823,'#2980B9'],[852,'#F39C12']].map(([x,c],i) => <rect key={i} x={x as number} y="248" width="22" height="68" rx="3" fill={c as string} opacity="0.72"/>)}
        {[[690,'#3498DB'],[719,'#E74C3C'],[745,'#27AE60'],[769,'#9B59B6'],[798,'#D35400'],[820,'#1ABC9C'],[846,'#E74C3C']].map(([x,c],i) => <rect key={i} x={x as number} y="340" width="22" height="70" rx="3" fill={c as string} opacity="0.68"/>)}
        {/* Mostrador */}
        <rect x="280" y="410" width="340" height="100" rx="6" fill="url(#counter)" stroke="rgba(255,92,53,0.2)" strokeWidth="1.5"/>
        <rect x="280" y="410" width="340" height="12" rx="4" fill="rgba(255,92,53,0.15)"/>
        {[290,360,480,550].map((x,i) => <rect key={i} x={x} y="424" width="60" height="80" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>)}
        {/* Monitor POS */}
        <rect x="380" y="350" width="140" height="68" rx="5" fill="rgba(5,15,28,0.95)" stroke="rgba(90,170,240,0.3)" strokeWidth="1.5"/>
        <rect x="386" y="356" width="128" height="56" rx="3" fill="url(#screen)"/>
        <rect x="390" y="360" width="120" height="10" rx="2" fill="rgba(255,92,53,0.15)"/>
        <text x="396" y="368" fontFamily="Inter,system-ui" fontSize="7" fill="rgba(255,255,255,0.5)">Daxcloud POS</text>
        <circle cx="500" cy="364" r="2.5" fill="#4CAF50" filter="url(#sglow)"/>
        <rect x="390" y="374" width="34" height="18" rx="2" fill="rgba(255,92,53,0.18)" stroke="rgba(255,92,53,0.3)" strokeWidth="0.5"/>
        <text x="394" y="380" fontFamily="Inter,system-ui" fontSize="6" fill="rgba(255,255,255,0.5)">Ventas</text>
        <text x="392" y="389" fontFamily="Inter,system-ui" fontSize="8" fontWeight="700" fill="#FF5C35">₡84k</text>
        <rect x="428" y="374" width="34" height="18" rx="2" fill="rgba(90,170,240,0.15)" stroke="rgba(90,170,240,0.25)" strokeWidth="0.5"/>
        <text x="430" y="380" fontFamily="Inter,system-ui" fontSize="6" fill="rgba(255,255,255,0.5)">Clientes</text>
        <text x="432" y="389" fontFamily="Inter,system-ui" fontSize="8" fontWeight="700" fill="#5AAAF0">47</text>
        <rect x="466" y="374" width="38" height="18" rx="2" fill="rgba(61,191,127,0.15)" stroke="rgba(61,191,127,0.25)" strokeWidth="0.5"/>
        <text x="468" y="380" fontFamily="Inter,system-ui" fontSize="6" fill="rgba(255,255,255,0.5)">Ticket</text>
        <text x="467" y="389" fontFamily="Inter,system-ui" fontSize="8" fontWeight="700" fill="#3DBF7F">₡1.8k</text>
        {[[0,'rgba(90,170,240,0.4)'],[1,'rgba(90,170,240,0.45)'],[2,'rgba(90,170,240,0.5)'],[3,'rgba(90,170,240,0.4)'],[4,'rgba(255,92,53,0.7)']].map(([idx,c],i) => <rect key={i} x={392+(i*8)} y={403+(i===4?0:i===2?-2:i===1?-2:0)} width="6" height={i===4?16:i===2?14:i===1?10:i===3?8:7} rx="1" fill={c as string}/>)}
        <rect x="440" y="418" width="20" height="6" rx="2" fill="rgba(30,58,95,0.8)"/>
        <rect x="425" y="424" width="50" height="5" rx="2" fill="rgba(30,58,95,0.9)"/>
        {/* Cajero */}
        <ellipse cx="450" cy="412" rx="20" ry="5" fill="rgba(0,0,0,0.3)"/>
        <rect x="430" y="310" width="40" height="105" rx="14" fill="#2980B9"/>
        <rect x="442" y="303" width="16" height="14" rx="6" fill="#F0C090"/>
        <ellipse cx="450" cy="290" rx="20" ry="22" fill="#F0C090"/>
        <path d="M430 282Q432 260 450 258Q468 260 470 282Q465 268 450 267Q435 268 430 282Z" fill="#1A0A00"/>
        <ellipse cx="444" cy="289" rx="3" ry="3.5" fill="#2C1810"/>
        <ellipse cx="456" cy="289" rx="3" ry="3.5" fill="#2C1810"/>
        <circle cx="445" cy="287" r="1" fill="white"/>
        <circle cx="457" cy="287" r="1" fill="white"/>
        <path d="M444 299Q450 304 456 299" stroke="#C0785A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="431" y="270" width="38" height="14" rx="6" fill="#FF5C35"/>
        <rect x="425" y="278" width="50" height="6" rx="3" fill="#FF3D1F"/>
        <text x="444" y="277" fontFamily="Inter,system-ui" fontSize="6" fontWeight="700" fill="white">DC</text>
        <path d="M430 330Q400 345 398 365" stroke="#2980B9" strokeWidth="14" fill="none" strokeLinecap="round"/>
        <path d="M470 330Q490 350 488 370" stroke="#2980B9" strokeWidth="12" fill="none" strokeLinecap="round"/>
        <ellipse cx="397" cy="368" rx="8" ry="7" fill="#F0C090"/>
        <ellipse cx="489" cy="372" rx="8" ry="7" fill="#F0C090"/>
        {/* Cliente 1 */}
        <ellipse cx="340" cy="498" rx="18" ry="5" fill="rgba(0,0,0,0.35)"/>
        <rect x="322" y="400" width="36" height="98" rx="12" fill="#E74C3C"/>
        <rect x="332" y="393" width="16" height="12" rx="5" fill="#F5D0A0"/>
        <ellipse cx="340" cy="381" rx="18" ry="20" fill="#F5D0A0"/>
        <path d="M322 374Q323 355 340 353Q357 355 358 374Q354 362 340 361Q326 362 322 374Z" fill="#4A2800"/>
        <ellipse cx="334" cy="380" rx="3" ry="3.2" fill="#2C1810"/>
        <ellipse cx="346" cy="380" rx="3" ry="3.2" fill="#2C1810"/>
        <circle cx="335" cy="378" r="1" fill="white"/>
        <circle cx="347" cy="378" r="1" fill="white"/>
        <path d="M334 390Q340 394 346 390" stroke="#C0785A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="295" y="430" width="24" height="35" rx="4" fill="#FF8C00" opacity="0.8"/>
        <line x1="300" y1="430" x2="300" y2="420" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round"/>
        <line x1="314" y1="430" x2="314" y2="420" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round"/>
        <path d="M300 420Q307 415 314 420" stroke="#FF8C00" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M322 430Q308 445 308 460" stroke="#E74C3C" strokeWidth="12" fill="none" strokeLinecap="round"/>
        {/* Cliente 2 */}
        <ellipse cx="250" cy="508" rx="16" ry="4" fill="rgba(0,0,0,0.3)"/>
        <rect x="234" y="418" width="32" height="92" rx="11" fill="#8E44AD"/>
        <rect x="243" y="412" width="14" height="11" rx="5" fill="#FDBCB4"/>
        <ellipse cx="250" cy="401" rx="16" ry="18" fill="#FDBCB4"/>
        <path d="M234 395Q235 378 250 376Q265 378 266 395Q262 384 250 383Q238 384 234 395Z" fill="#8B0000"/>
        <circle cx="235" cy="390" r="5" fill="#8B0000"/>
        <circle cx="244" cy="384" r="5" fill="#8B0000"/>
        <circle cx="256" cy="384" r="5" fill="#8B0000"/>
        <circle cx="265" cy="390" r="5" fill="#8B0000"/>
        <ellipse cx="244" cy="400" rx="2.5" ry="3" fill="#3D1A00"/>
        <ellipse cx="256" cy="400" rx="2.5" ry="3" fill="#3D1A00"/>
        <path d="M244 409Q250 413 256 409" stroke="#B07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="192" y="448" width="38" height="28" rx="3" fill="rgba(30,58,95,0.6)" stroke="rgba(90,170,240,0.3)" strokeWidth="1"/>
        <line x1="192" y1="476" x2="155" y2="476" stroke="rgba(90,170,240,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="170" cy="480" r="4" fill="rgba(30,58,95,0.8)" stroke="rgba(90,170,240,0.3)" strokeWidth="1"/>
        <circle cx="185" cy="480" r="4" fill="rgba(30,58,95,0.8)" stroke="rgba(90,170,240,0.3)" strokeWidth="1"/>
        <path d="M234 438Q220 452 215 462" stroke="#8E44AD" strokeWidth="11" fill="none" strokeLinecap="round"/>
        {/* Cliente 3 fondo */}
        <ellipse cx="185" cy="510" rx="12" ry="3" fill="rgba(0,0,0,0.25)"/>
        <rect x="174" y="438" width="22" height="72" rx="9" fill="#27AE60"/>
        <rect x="180" y="433" width="10" height="9" rx="4" fill="#F5C5A0"/>
        <ellipse cx="185" cy="424" rx="12" ry="14" fill="#F5C5A0"/>
        <path d="M174 419Q175 406 185 404Q195 406 196 419Q193 410 185 409Q177 410 174 419Z" fill="#1A0800"/>
        <ellipse cx="181" cy="423" rx="2" ry="2.5" fill="#2C1810"/>
        <ellipse cx="189" cy="423" rx="2" ry="2.5" fill="#2C1810"/>
        {/* Cliente 4 saliendo */}
        <ellipse cx="660" cy="510" rx="18" ry="5" fill="rgba(0,0,0,0.3)"/>
        <rect x="642" y="410" width="36" height="100" rx="12" fill="#D35400"/>
        <rect x="652" y="403" width="16" height="12" rx="5" fill="#FDBCB4"/>
        <ellipse cx="660" cy="391" rx="18" ry="20" fill="#FDBCB4"/>
        <path d="M642 384Q643 365 660 363Q677 365 678 384Q674 372 660 371Q646 372 642 384Z" fill="#2C1810"/>
        <ellipse cx="654" cy="390" rx="3" ry="3.2" fill="#2C1810"/>
        <ellipse cx="666" cy="390" rx="3" ry="3.2" fill="#2C1810"/>
        <path d="M654 400Q660 404 666 400" stroke="#B07060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="674" y="440" width="26" height="38" rx="4" fill="#FF5C35" opacity="0.85"/>
        <line x1="678" y1="440" x2="678" y2="430" stroke="#FF5C35" strokeWidth="2" strokeLinecap="round"/>
        <line x1="694" y1="440" x2="694" y2="430" stroke="#FF5C35" strokeWidth="2" strokeLinecap="round"/>
        <path d="M678 430Q686 424 694 430" stroke="#FF5C35" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="700" y="450" width="22" height="32" rx="4" fill="#FF8C00" opacity="0.75"/>
        <line x1="704" y1="450" x2="704" y2="441" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round"/>
        <line x1="716" y1="450" x2="716" y2="441" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round"/>
        <path d="M704 441Q710 436 716 441" stroke="#FF8C00" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M678 430Q680 448 678 458" stroke="#D35400" strokeWidth="13" fill="none" strokeLinecap="round"/>
        <path d="M642 430Q626 450 625 468" stroke="#D35400" strokeWidth="12" fill="none" strokeLinecap="round"/>
        {/* Separadores caja */}
        <rect x="430" y="490" width="6" height="60" rx="2" fill="rgba(255,92,53,0.25)" stroke="rgba(255,92,53,0.15)" strokeWidth="1"/>
        <rect x="500" y="490" width="6" height="60" rx="2" fill="rgba(255,92,53,0.15)" stroke="rgba(255,92,53,0.1)" strokeWidth="1"/>
        {/* Colgantes promo */}
        <line x1="120" y1="120" x2="120" y2="155" stroke="rgba(255,92,53,0.3)" strokeWidth="1" strokeDasharray="3,2"/>
        <rect x="95" y="155" width="50" height="28" rx="5" fill="rgba(255,92,53,0.12)" stroke="rgba(255,92,53,0.3)" strokeWidth="1"/>
        <text x="105" y="165" fontFamily="Inter,system-ui" fontSize="7" fontWeight="700" fill="#FF5C35">OFERTA</text>
        <text x="108" y="176" fontFamily="Inter,system-ui" fontSize="9" fontWeight="800" fill="#FF8C00">50%</text>
        <line x1="760" y1="120" x2="760" y2="155" stroke="rgba(90,170,240,0.3)" strokeWidth="1" strokeDasharray="3,2"/>
        <rect x="735" y="155" width="50" height="28" rx="5" fill="rgba(90,170,240,0.1)" stroke="rgba(90,170,240,0.25)" strokeWidth="1"/>
        <text x="742" y="165" fontFamily="Inter,system-ui" fontSize="7" fontWeight="700" fill="#5AAAF0">NUEVO</text>
        <text x="742" y="176" fontFamily="Inter,system-ui" fontSize="9" fontWeight="800" fill="#7BC8FF">2025</text>
        {/* Burbuja notificación */}
        <rect x="490" y="300" width="130" height="42" rx="10" fill="rgba(13,30,50,0.92)" stroke="rgba(61,191,127,0.3)" strokeWidth="1" filter="url(#sglow)"/>
        <circle cx="508" cy="321" r="7" fill="rgba(61,191,127,0.2)" stroke="rgba(61,191,127,0.4)" strokeWidth="1"/>
        <text x="504" y="325" fontFamily="Inter,system-ui" fontSize="9" fill="#3DBF7F" fontWeight="700">✓</text>
        <text x="521" y="317" fontFamily="Inter,system-ui" fontSize="9" fill="rgba(255,255,255,0.7)" fontWeight="600">Venta procesada</text>
        <text x="521" y="330" fontFamily="Inter,system-ui" fontSize="11" fill="#3DBF7F" fontWeight="800">₡ 3,200</text>
        {/* Overlay oscuro para legibilidad */}
        <rect width="900" height="700" fill="rgba(8,18,32,0.35)"/>
        {/* Partículas */}
        {[[70,180],[840,160],[450,145],[630,175],[200,155],[750,190]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(255,255,255,0.2)"/>)}
      </g>
    </svg>
  );
}

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

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', color: '#F0F4FF', fontSize: '13px',
    fontFamily: 'Inter,Outfit,system-ui,sans-serif',
    outline: 'none', boxSizing: 'border-box' as const, transition: 'all .2s',
  };

  const tr = (delay = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'none' : 'translateY(20px)',
    transition: `all .8s ${delay}s cubic-bezier(.22,1,.36,1)`,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0B1C2C', display: 'flex', fontFamily: "'Inter','Outfit',system-ui,sans-serif", overflow: 'hidden' }}>

      {/* ── IZQUIERDA — Ilustración ── */}
      <div className="login-left" style={{ display: 'none', flex: '0 0 55%', position: 'relative', overflow: 'hidden' }}>
        <StoreIllustration />
        {/* Logo top-left */}
        <div style={{ position: 'absolute', top: '36px', left: '48px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10, ...tr(0) }}>
          <svg width="38" height="29" viewBox="0 0 64 48" fill="none">
            <defs><linearGradient id="ll" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
            <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#ll)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax</span>
            <span style={{ fontSize: '22px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.03em' }}>cloud</span>
          </div>
        </div>
        {/* Tagline bottom */}
        <div style={{ position: 'absolute', bottom: '40px', left: '48px', right: '48px', zIndex: 10, ...tr(.3) }}>
          <h2 style={{ fontSize: 'clamp(22px,2.5vw,32px)', fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.2, marginBottom: '10px' }}>
            Tu negocio,<br/>
            <span style={{ background: 'linear-gradient(135deg,#FF5C35,#FF8C00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>en control total.</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>POS moderno · Inventario en tiempo real · Multi-sucursal</p>
        </div>
      </div>

      {/* ── DERECHA — Formulario ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        {/* Logo móvil */}
        <div className="login-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '44px', ...tr(0) }}>
          <svg width="36" height="27" viewBox="0 0 64 48" fill="none">
            <defs><linearGradient id="lm" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
            <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#lm)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax</span>
            <span style={{ fontSize: '20px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.03em' }}>cloud</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: '400px', ...tr(.1) }}>
          <div style={{
            background: 'rgba(13,26,42,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,92,53,0.15)',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {/* Header card */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <svg width="28" height="21" viewBox="0 0 64 48" fill="none">
                  <defs><linearGradient id="lc" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#FF8C00"/><stop offset="45%" stopColor="#FF5C35"/><stop offset="100%" stopColor="#FF8C00"/></linearGradient></defs>
                  <path d="M10 38Q2 38 2 29Q2 20 10 19Q11 11 20 10Q25 3 33 4Q43 2 46 12Q53 12 56 20Q62 21 61 30Q61 39 53 39L10 39Z" fill="none" stroke="url(#lc)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
                </svg>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>Dax</span>
                  <span style={{ fontSize: '18px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.03em' }}>cloud</span>
                </div>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F4FF', letterSpacing: '-.02em', marginBottom: '6px' }}>Welcome to Family</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* ID empresa */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: '7px' }}>ID de empresa</label>
                <input value={form.tenantSlug} onChange={e => set('tenantSlug')(e.target.value)} placeholder="mi-negocio" autoComplete="organization" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none'; }}/>
              </div>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: '7px' }}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="admin@empresa.com" autoComplete="email" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none'; }}/>
              </div>
              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)' }}>Contraseña</label>
                  <a href="/forgot-password" style={{ fontSize: '11px', color: 'rgba(255,92,53,0.6)', textDecoration: 'none', fontWeight: 600, transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,92,53,0.6)')}>¿Olvidaste la contraseña?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password')(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{ ...inputStyle, paddingRight: '44px' }}
                    onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.05)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none'; }}/>
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', padding: '2px', transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: '10px', animation: 'shake .3s ease' }}>
                  <p style={{ fontSize: '12px', color: '#E07070' }}>⚠ {error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px', marginTop: '4px',
                background: loading ? 'rgba(255,92,53,0.2)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)',
                color: loading ? 'rgba(255,92,53,0.5)' : '#fff',
                border: 'none', borderRadius: '13px', fontSize: '14px', fontWeight: 700,
                fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .25s', boxShadow: loading ? 'none' : '0 4px 24px rgba(255,92,53,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 8px 32px rgba(255,92,53,0.45)'; }}}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 4px 24px rgba(255,92,53,0.3)'; }}}>
                {loading
                  ? <><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,92,53,0.3)', borderTopColor: 'rgba(255,92,53,0.7)', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Ingresando...</>
                  : <>Login <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>¿Nuevo en DaxCloud?</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', background: 'transparent', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '13px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,92,53,0.6)', textDecoration: 'none', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.45)'; (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.06)'; (e.currentTarget as HTMLElement).style.color='#FF5C35'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.2)'; (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='rgba(255,92,53,0.6)'; }}>
              Crear cuenta gratis
            </a>
          </div>

          <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '11px', color: 'rgba(255,255,255,0.1)' }}>
            © {new Date().getFullYear()} DaxCloud · Todos los derechos reservados
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media(min-width:1024px){.login-left{display:block!important}.login-mobile-logo{display:none!important}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:-webkit-autofill,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px rgba(13,26,42,0.98) inset!important;-webkit-text-fill-color:#F0F4FF!important;caret-color:#F0F4FF}
        ::placeholder{color:rgba(255,255,255,0.2)!important}
      `}</style>
    </div>
  );
}
