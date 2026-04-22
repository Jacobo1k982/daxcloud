'use client';
import { useState, useEffect, useRef, use } from 'react';
import {
  ShoppingCart, Plus, Minus, X, MapPin, Phone, User, FileText,
  Truck, Store, ChevronRight, Check, ArrowLeft, Search,
  Clock, Share2, MessageCircle, Globe, Package, Info, Zap,
  Star, Flame, Heart,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface Product {
  id: string; name: string; price: number; description?: string;
  imageUrl?: string; category?: string; metadata?: any;
}
interface Branch  { id: string; name: string; address?: string; phone?: string; }
interface Tenant  {
  name: string; logoUrl?: string; industry?: string;
  address?: string; phone?: string; settings?: any;
}
interface CartItem extends Product { quantity: number; }
type Step = 'catalog' | 'cart' | 'info' | 'confirm' | 'success';

function fmtPrice(n: number) {
  return new Intl.NumberFormat('es-CR', { style:'currency', currency:'CRC', maximumFractionDigits:0 }).format(n);
}

const INDUSTRY_EMOJI: Record<string,string> = {
  restaurant:'🍽️', bakery:'🥖', pharmacy:'💊', salon:'✂️',
  clothing:'👕', produce:'🥬', supermarket:'🛒', general:'🏪',
};
const INDUSTRY_LABEL: Record<string,string> = {
  restaurant:'Restaurante', bakery:'Panadería', pharmacy:'Farmacia',
  salon:'Salón', clothing:'Ropa', produce:'Verdulería',
  supermarket:'Supermercado', general:'Tienda',
};

// ── Helpers de color ──────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function lighten(hex: string, pct: number): string {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const f = pct/100;
  const nr = Math.min(255, Math.round(r + (255-r)*f));
  const ng = Math.min(255, Math.round(g + (255-g)*f));
  const nb = Math.min(255, Math.round(b + (255-b)*f));
  return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
}

// ── Estilos globales ──────────────────────────────────────────────────────────
const STYLES = (ac: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{font-family:'Inter',system-ui,sans-serif;background:#08090D;color:#fff;-webkit-font-smoothing:antialiased;}
  ::placeholder{color:rgba(255,255,255,0.22)!important;}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}
  @keyframes bounce{0%,100%{transform:scale(1)}40%{transform:scale(1.18)}70%{transform:scale(.94)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  .pcard{transition:transform .3s cubic-bezier(.22,1,.36,1),border-color .2s,box-shadow .3s;}
  .pcard:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.35)!important;}
  .pcard:hover .pimg{transform:scale(1.06);}
  .pimg{transition:transform .4s cubic-bezier(.22,1,.36,1);}
  .addbtn{transition:all .2s cubic-bezier(.22,1,.36,1);}
  .pcard:hover .addbtn{opacity:1!important;transform:translateY(0)!important;}
  .catpill{transition:all .18s cubic-bezier(.22,1,.36,1);}
  .catpill:hover{background:rgba(255,255,255,0.07)!important;}
  .step-btn:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(${hexToRgb(ac)},.4)!important;}
`;

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h='14px', w='100%', r='8px' }: any) {
  return <div style={{ height:h, width:w, borderRadius:r, background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>;
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ step, ac }: { step: Step; ac: string }) {
  const steps = ['cart','info','confirm','success'];
  const idx = steps.indexOf(step);
  const labels = ['Carrito','Datos','Confirmar','Listo'];
  if (step === 'catalog') return null;
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'12px 20px', background:'rgba(8,9,13,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', gap:'0' }}>
      {steps.map((s,i) => (
        <div key={s} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', flexShrink:0 }}>
            <div style={{ width:'26px', height:'26px', borderRadius:'50%', background: i < idx ? '#3DBF7F' : i === idx ? ac : 'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .3s' }}>
              {i < idx
                ? <Check size={13} color="#fff"/>
                : <span style={{ fontSize:'11px', fontWeight:700, color: i===idx ? '#fff' : 'rgba(255,255,255,0.3)' }}>{i+1}</span>
              }
            </div>
            <span style={{ fontSize:'9px', fontWeight: i===idx ? 700 : 400, color: i===idx ? '#fff' : 'rgba(255,255,255,0.3)', whiteSpace:'nowrap' as const }}>{labels[i]}</span>
          </div>
          {i < steps.length-1 && (
            <div style={{ flex:1, height:'2px', borderRadius:'1px', background: i < idx ? '#3DBF7F' : 'rgba(255,255,255,0.07)', margin:'0 6px', marginBottom:'14px', transition:'background .3s' }}/>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Sección hero del negocio ──────────────────────────────────────────────────
function BusinessHero({ tenant, ac }: { tenant: Tenant; ac: string }) {
  const s = tenant.settings ?? {};
  const isOpen = s.acceptingOrders !== false;
  const ind = tenant.industry ?? 'general';

  return (
    <div style={{ position:'relative', overflow:'hidden' }}>
      {/* Fondo con color del negocio */}
      <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, rgba(${hexToRgb(ac)},0.22) 0%, rgba(${hexToRgb(ac)},0.06) 50%, rgba(8,9,13,0) 100%)`, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'220px', height:'220px', borderRadius:'50%', background:`radial-gradient(circle, rgba(${hexToRgb(ac)},0.15), transparent 70%)`, filter:'blur(30px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'0', left:'-20px', width:'160px', height:'160px', borderRadius:'50%', background:`radial-gradient(circle, rgba(${hexToRgb(ac)},0.08), transparent 70%)`, filter:'blur(20px)', pointerEvents:'none' }}/>
      {/* Textura grid sutil */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`, backgroundSize:'40px 40px', pointerEvents:'none' }}/>

      <div style={{ position:'relative', zIndex:1, padding:'28px 20px 24px' }}>
        {/* Logo + info */}
        <div style={{ display:'flex', gap:'16px', marginBottom:'16px', alignItems:'flex-start' }}>
          {/* Logo */}
          <div style={{ width:'76px', height:'76px', borderRadius:'20px', overflow:'hidden', flexShrink:0, border:`2px solid rgba(${hexToRgb(ac)},0.35)`, boxShadow:`0 8px 30px rgba(${hexToRgb(ac)},0.25), 0 0 0 1px rgba(255,255,255,0.06)`, background:'#0D0F16' }}>
            {tenant.logoUrl
              ? <img src={tenant.logoUrl} alt={tenant.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px' }}>{INDUSTRY_EMOJI[ind]??'🏪'}</div>
            }
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'6px' }}>
              <h1 style={{ fontSize:'20px', fontWeight:900, color:'#fff', letterSpacing:'-.03em', lineHeight:1 }}>{tenant.name}</h1>
              <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'20px', background:`rgba(${hexToRgb(ac)},0.15)`, border:`1px solid rgba(${hexToRgb(ac)},0.3)`, color:ac, whiteSpace:'nowrap' as const }}>
                {INDUSTRY_EMOJI[ind]} {INDUSTRY_LABEL[ind]??'Tienda'}
              </span>
            </div>

            {/* Estado abierto/cerrado */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', background: isOpen ? 'rgba(61,191,127,0.1)' : 'rgba(224,80,80,0.1)', border:`1px solid ${isOpen ? 'rgba(61,191,127,0.3)' : 'rgba(224,80,80,0.3)'}` }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: isOpen ? '#3DBF7F' : '#E05050', animation: isOpen ? 'pulse 2s infinite' : 'none' }}/>
                <span style={{ fontSize:'11px', fontWeight:700, color: isOpen ? '#3DBF7F' : '#E05050' }}>{isOpen ? 'Abierto' : 'Cerrado'}</span>
              </div>
              {s.businessHours && <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:'3px' }}><Clock size={10}/>{s.businessHours.open}–{s.businessHours.close}</span>}
              {tenant.phone && <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', gap:'3px' }}><Phone size={10}/>{tenant.phone}</span>}
            </div>
          </div>
        </div>

        {/* Descripción */}
        {s.publicDescription && <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.75, marginBottom:'12px' }}>{s.publicDescription}</p>}

        {/* Dirección */}
        {tenant.address && <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px' }}>
          <MapPin size={12} color="rgba(255,255,255,0.3)" style={{ flexShrink:0 }}/>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{tenant.address}</span>
        </div>}

        {/* Redes */}
        {(s.whatsapp||s.instagram||s.facebook) && (
          <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' as const }}>
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'20px', background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.25)', color:'#25D366', fontSize:'11px', fontWeight:600, textDecoration:'none', transition:'all .15s' }}>
              <MessageCircle size={12}/> WhatsApp
            </a>}
            {s.instagram && <a href={`https://instagram.com/${s.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'20px', background:'rgba(225,48,108,0.1)', border:'1px solid rgba(225,48,108,0.25)', color:'#E1306C', fontSize:'11px', fontWeight:600, textDecoration:'none', transition:'all .15s' }}>
              <Share2 size={12}/> Instagram
            </a>}
            {s.facebook && <a href={`https://facebook.com/${s.facebook}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'20px', background:'rgba(24,119,242,0.1)', border:'1px solid rgba(24,119,242,0.25)', color:'#1877F2', fontSize:'11px', fontWeight:600, textDecoration:'none', transition:'all .15s' }}>
              <Globe size={12}/> Facebook
            </a>}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,rgba(${hexToRgb(ac)},0.2),transparent)` }}/>

      {/* Banner cerrado */}
      {!isOpen && <div style={{ display:'flex', gap:'10px', alignItems:'center', padding:'12px 20px', background:'rgba(224,80,80,0.07)', borderBottom:'1px solid rgba(224,80,80,0.15)' }}>
        <Clock size={14} color="#E07070" style={{ flexShrink:0 }}/>
        <div>
          <p style={{ fontSize:'13px', fontWeight:700, color:'#E07070', marginBottom:'1px' }}>Estamos cerrados por ahora</p>
          <p style={{ fontSize:'11px', color:'rgba(224,80,80,0.6)' }}>No aceptamos pedidos en este momento. ¡Vuelve pronto!</p>
        </div>
      </div>}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, qty, onAdd, onRemove, ac, popular }: {
  product: Product; qty: number; onAdd: () => void; onRemove: () => void; ac: string; popular?: boolean;
}) {
  const taxRate = product.metadata?.taxRate ?? 0;
  const rgb = hexToRgb(ac);

  return (
    <div className="pcard" onClick={onAdd}
      style={{ background: qty>0 ? `rgba(${rgb},0.08)` : 'rgba(255,255,255,0.025)', border:`1px solid ${qty>0 ? `rgba(${rgb},0.35)` : 'rgba(255,255,255,0.07)'}`, borderRadius:'18px', overflow:'hidden', cursor:'pointer', position:'relative', boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>

      {/* Imagen */}
      <div style={{ height:'148px', overflow:'hidden', background:'rgba(255,255,255,0.03)', position:'relative', flexShrink:0 }}>
        {product.imageUrl
          ? <img className="pimg" src={product.imageUrl} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px', background:'rgba(255,255,255,0.02)' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Package size={18} color="rgba(255,255,255,0.15)"/>
              </div>
            </div>
        }

        {/* Badges arriba */}
        <div style={{ position:'absolute', top:'8px', left:'8px', display:'flex', gap:'4px', flexWrap:'wrap' as const }}>
          {popular && <span style={{ background:'rgba(240,160,48,0.92)', backdropFilter:'blur(8px)', borderRadius:'6px', padding:'2px 8px', fontSize:'9px', fontWeight:800, color:'#fff', display:'flex', alignItems:'center', gap:'3px' }}>
            <Flame size={9}/> Popular
          </span>}
          {taxRate > 0 && <span style={{ background:'rgba(90,170,240,0.85)', backdropFilter:'blur(8px)', borderRadius:'6px', padding:'2px 7px', fontSize:'9px', fontWeight:700, color:'#fff' }}>
            IVA {taxRate}%
          </span>}
        </div>

        {/* Qty overlay */}
        {qty > 0 && (
          <div className="addbtn" style={{ position:'absolute', bottom:'8px', right:'8px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(8,9,13,0.88)', backdropFilter:'blur(10px)', border:`1px solid rgba(${rgb},0.4)`, borderRadius:'12px', padding:'5px 9px', boxShadow:`0 4px 16px rgba(${rgb},0.3)` }}>
              <button onClick={e => { e.stopPropagation(); onRemove(); }}
                style={{ width:'24px', height:'24px', borderRadius:'7px', background:'rgba(255,255,255,0.08)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Minus size={12} color="#fff"/>
              </button>
              <span style={{ fontSize:'14px', fontWeight:900, color:ac, minWidth:'16px', textAlign:'center' as const }}>{qty}</span>
              <button onClick={e => { e.stopPropagation(); onAdd(); }}
                style={{ width:'24px', height:'24px', borderRadius:'7px', background:`rgba(${rgb},0.2)`, border:`1px solid rgba(${rgb},0.3)`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <Plus size={12} color={ac}/>
              </button>
            </div>
          </div>
        )}

        {/* Add btn hover */}
        {qty === 0 && (
          <div className="addbtn" style={{ position:'absolute', bottom:'8px', right:'8px', opacity:0, transform:'translateY(8px)' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'11px', background:`linear-gradient(135deg,${ac},${lighten(ac,15)})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 16px rgba(${rgb},0.5)` }}>
              <Plus size={18} color="#fff"/>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'13px 14px 14px' }}>
        <p style={{ fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'3px', lineHeight:1.3, letterSpacing:'-.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{product.name}</p>
        {product.description && <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.38)', lineHeight:1.5, marginBottom:'10px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>{product.description}</p>}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: product.description ? 0 : '8px' }}>
          <p style={{ fontSize:'17px', fontWeight:900, color:ac, letterSpacing:'-.02em' }}>{fmtPrice(product.price)}</p>
          {qty === 0 && <div style={{ width:'30px', height:'30px', borderRadius:'9px', background:`rgba(${rgb},0.12)`, border:`1px solid rgba(${rgb},0.25)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Plus size={15} color={ac}/>
          </div>}
          {qty > 0 && <span style={{ fontSize:'11px', color:`rgba(${rgb},0.7)`, fontWeight:700 }}>×{qty} = {fmtPrice(product.price*qty)}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────
function Field({ label, k, form, setForm, type='text', placeholder, Icon, ac, required }: any) {
  const [focused, setFocused] = useState(false);
  const rgb = hexToRgb(ac);
  return (
    <div>
      <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color: focused ? ac : 'rgba(255,255,255,0.32)', marginBottom:'7px', transition:'color .2s' }}>
        {label}{required && <span style={{ color:ac, marginLeft:'3px' }}>*</span>}
      </label>
      <div style={{ position:'relative' }}>
        {Icon && <Icon size={13} color={focused ? ac : 'rgba(255,255,255,0.2)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', transition:'color .2s' }}/>}
        <input type={type} value={form[k]} onChange={e => setForm((p: any) => ({ ...p, [k]: e.target.value }))} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:'100%', padding:`13px 16px 13px ${Icon?'40px':'16px'}`, background: focused ? `rgba(${rgb},0.05)` : 'rgba(255,255,255,0.04)', border:`1px solid ${focused ? `rgba(${rgb},0.45)` : 'rgba(255,255,255,0.08)'}`, borderRadius:'13px', color:'#F0F4FF', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, boxShadow: focused ? `0 0 0 3px rgba(${rgb},0.1)` : 'none', transition:'all .2s' }}/>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [tenant,     setTenant]     = useState<Tenant | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [branches,   setBranches]   = useState<Branch[]>([]);
  const [cart,       setCart]       = useState<CartItem[]>([]);
  const [step,       setStep]       = useState<Step>('catalog');
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [activeCat,  setActiveCat]  = useState('Todos');
  const [orderNumber,setOrderNumber]= useState('');
  const [orderType,  setOrderType]  = useState<'pickup'|'delivery'>('pickup');
  const [form, setForm] = useState({ name:'', phone:'', address:'', notes:'' });
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/public/${slug}/catalog`)
      .then(r => r.json())
      .then(data => {
        setTenant(data.tenant);
        setProducts((data.products ?? []).map((p: any) => ({ ...p, price: Number(p.price) })));
        setBranches(data.branches ?? []);
        setLoading(false);
      })
      .catch(() => { setError('No se pudo cargar el catálogo'); setLoading(false); });
  }, [slug]);

  const ac = tenant?.settings?.primaryColor ?? '#FF5C35';
  const rgb = hexToRgb(ac);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category ?? 'General').filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'Todos' || (p.category ?? 'General') === activeCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = (activeCat === 'Todos' ? categories.filter(c => c !== 'Todos') : [activeCat])
    .map(cat => ({ name: cat, items: filtered.filter(p => (p.category ?? 'General') === cat) }))
    .filter(g => g.items.length > 0);

  // Top 3 más caros como "populares"
  const popularIds = new Set([...products].sort((a,b) => b.price - a.price).slice(0,3).map(p => p.id));

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id===p.id ? { ...i, quantity:i.quantity+1 } : i) : [...prev, { ...p, quantity:1 }];
    });
    setCartBounce(true); setTimeout(() => setCartBounce(false), 600);
  };
  const removeFromCart = (id: string) => setCart(prev => {
    const item = prev.find(i => i.id === id);
    if (!item) return prev;
    return item.quantity <= 1 ? prev.filter(i => i.id !== id) : prev.map(i => i.id===id ? { ...i, quantity:i.quantity-1 } : i);
  });
  const cartCount = cart.reduce((a,i) => a+i.quantity, 0);
  const cartTotal = cart.reduce((a,i) => a+i.price*i.quantity, 0);
  const getQty    = (id: string) => cart.find(i => i.id===id)?.quantity ?? 0;

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Ingresa tu nombre');
    if (!form.phone.trim()) return setError('Ingresa tu teléfono');
    if (orderType === 'delivery' && !form.address.trim()) return setError('Ingresa tu dirección');
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API}/public/${slug}/orders`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ type:orderType, customerName:form.name, customerPhone:form.phone, customerAddress:form.address||null, notes:form.notes||null, items:cart.map(i => ({ productId:i.id, name:i.name, price:i.price, quantity:i.quantity })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al enviar el pedido');
      setOrderNumber(data.orderNumber);
      setStep('success');
    } catch(e: any) { setError(e.message ?? 'Error'); }
    finally { setSubmitting(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#08090D', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,system-ui' }}>
      <div style={{ textAlign:'center', animation:'fadeUp .5s ease' }}>
        <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:'rgba(255,92,53,0.1)', border:'1px solid rgba(255,92,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 32px rgba(255,92,53,0.15)' }}>
          <ShoppingCart size={26} color="#FF5C35" style={{ animation:'pulse 1.5s infinite' }}/>
        </div>
        <p style={{ fontSize:'15px', fontWeight:600, color:'rgba(255,255,255,0.5)' }}>Cargando catálogo...</p>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', marginTop:'6px' }}>Un momento por favor</p>
      </div>
      <style>{STYLES('#FF5C35')}</style>
    </div>
  );

  if (error && !tenant) return (
    <div style={{ minHeight:'100vh', background:'#08090D', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Inter,system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:'56px', marginBottom:'16px' }}>🏪</p>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'#fff', marginBottom:'8px' }}>Negocio no encontrado</h1>
        <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>El enlace puede ser incorrecto o el negocio no está disponible en este momento.</p>
      </div>
      <style>{STYLES('#FF5C35')}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#08090D', fontFamily:'Inter,system-ui,sans-serif', paddingBottom:'120px' }}>
      <style>{STYLES(ac)}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{ position:'sticky', top:0, zIndex:60, background:'rgba(8,9,13,0.94)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>

        {/* Stepper (checkout) */}
        <Stepper step={step} ac={ac}/>

        {/* Barra superior — solo en catálogo */}
        {step === 'catalog' && <>
          <div style={{ maxWidth:'760px', margin:'0 auto', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
            {/* Búsqueda */}
            <div style={{ flex:1, position:'relative' }}>
              <Search size={14} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Buscar en ${tenant?.name ?? 'el catálogo'}...`}
                style={{ width:'100%', padding:'11px 14px 11px 38px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'13px', color:'#F0F4FF', fontSize:'13px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
                onFocus={e => { e.target.style.borderColor=`rgba(${rgb},0.5)`; e.target.style.background=`rgba(${rgb},0.06)`; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.09)'; e.target.style.background='rgba(255,255,255,0.06)'; }}
              />
              {search && <span style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'10px', fontWeight:600, color:`rgba(${rgb},0.7)`, background:`rgba(${rgb},0.1)`, borderRadius:'6px', padding:'2px 7px' }}>
                {filtered.length}
              </span>}
            </div>
            {/* Cart button */}
            {cartCount > 0 && <button onClick={() => setStep('cart')}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', background:`linear-gradient(135deg,${ac},${lighten(ac,10)})`, border:'none', borderRadius:'13px', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0, boxShadow:`0 4px 16px rgba(${rgb},0.4)`, animation: cartBounce ? 'bounce .5s ease' : 'none', transition:'all .2s' }}>
              <ShoppingCart size={15}/>
              <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:'20px', padding:'2px 8px', fontSize:'11px', fontWeight:800 }}>{cartCount}</span>
              <span>{fmtPrice(cartTotal)}</span>
            </button>}
          </div>

          {/* Categorías */}
          <div style={{ maxWidth:'760px', margin:'0 auto', padding:'0 16px 12px', display:'flex', gap:'6px', overflowX:'auto', scrollbarWidth:'none' as const }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)} className="catpill"
                style={{ padding:'7px 16px', borderRadius:'20px', border:`1px solid ${activeCat===cat ? `rgba(${rgb},0.5)` : 'rgba(255,255,255,0.08)'}`, background: activeCat===cat ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.03)', color: activeCat===cat ? ac : 'rgba(255,255,255,0.45)', fontSize:'12px', fontWeight: activeCat===cat ? 700 : 500, cursor:'pointer', whiteSpace:'nowrap' as const, fontFamily:'inherit', flexShrink:0, transition:'all .15s' }}>
                {cat}
              </button>
            ))}
          </div>
        </>}
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto' }}>

        {/* ── CATÁLOGO ── */}
        {step === 'catalog' && <>
          <BusinessHero tenant={tenant!} ac={ac}/>

          {search && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 24px', animation:'fadeUp .4s ease' }}>
              <p style={{ fontSize:'40px', marginBottom:'14px' }}>🔍</p>
              <p style={{ fontSize:'16px', fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:'6px' }}>Sin resultados</p>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.3)' }}>No encontramos "{search}" en el catálogo</p>
            </div>
          )}

          {grouped.map(group => (
            <div key={group.name} style={{ padding:'20px 16px 0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <h2 style={{ fontSize:'16px', fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>{group.name}</h2>
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }}/>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:600, background:'rgba(255,255,255,0.05)', borderRadius:'20px', padding:'2px 9px' }}>{group.items.length}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:'12px' }}>
                {group.items.map(p => (
                  <ProductCard key={p.id} product={p} qty={getQty(p.id)} onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)} ac={ac} popular={popularIds.has(p.id)}/>
                ))}
              </div>
            </div>
          ))}

          {/* FAB */}
          {cartCount > 0 && (
            <div style={{ position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', zIndex:50, animation:'slideUp .35s cubic-bezier(.22,1,.36,1)' }}>
              <button onClick={() => setStep('cart')} className="step-btn"
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'15px 26px', background:`linear-gradient(135deg,${ac},${lighten(ac,8)})`, border:'none', borderRadius:'22px', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 8px 32px rgba(${rgb},0.5), 0 0 0 1px rgba(255,255,255,0.1)`, whiteSpace:'nowrap' as const, transition:'all .2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <ShoppingCart size={16}/>
                  <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:'20px', padding:'2px 9px', fontSize:'12px', fontWeight:800 }}>{cartCount}</span>
                </div>
                <span>Ver pedido · {fmtPrice(cartTotal)}</span>
                <ChevronRight size={16} style={{ opacity:.8 }}/>
              </button>
            </div>
          )}
        </>}

        {/* ── CARRITO ── */}
        {step === 'cart' && (
          <div style={{ padding:'20px 16px', animation:'slideIn .3s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px' }}>
              <button onClick={() => setStep('catalog')} style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                <ArrowLeft size={16} color="rgba(255,255,255,0.6)"/>
              </button>
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>Tu pedido</h2>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{cartCount} producto{cartCount!==1?'s':''} seleccionados</p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 15px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'15px', transition:'all .2s' }}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width:'52px', height:'52px', borderRadius:'11px', objectFit:'cover', flexShrink:0, border:'1px solid rgba(255,255,255,0.07)' }}/>}
                  {!item.imageUrl && <div style={{ width:'52px', height:'52px', borderRadius:'11px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Package size={20} color="rgba(255,255,255,0.15)"/>
                  </div>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, marginBottom:'2px' }}>{item.name}</p>
                    <p style={{ fontSize:'13px', color:ac, fontWeight:700 }}>{fmtPrice(item.price)}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', flexShrink:0 }}>
                    <button onClick={() => removeFromCart(item.id)} style={{ width:'30px', height:'30px', borderRadius:'9px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Minus size={13} color="#fff"/>
                    </button>
                    <span style={{ fontSize:'15px', fontWeight:800, color:'#fff', minWidth:'20px', textAlign:'center' as const }}>{item.quantity}</span>
                    <button onClick={() => addToCart(item)} style={{ width:'30px', height:'30px', borderRadius:'9px', background:`rgba(${rgb},0.12)`, border:`1px solid rgba(${rgb},0.25)`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Plus size={13} color={ac}/>
                    </button>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id!==item.id))} style={{ width:'30px', height:'30px', borderRadius:'9px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginLeft:'2px' }}>
                      <X size={13} color="#E07070"/>
                    </button>
                  </div>
                  <p style={{ fontSize:'14px', fontWeight:800, color:'#fff', flexShrink:0, minWidth:'72px', textAlign:'right' as const }}>{fmtPrice(item.price*item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ padding:'18px 20px', background:`rgba(${rgb},0.07)`, border:`1px solid rgba(${rgb},0.2)`, borderRadius:'16px', marginBottom:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)' }}>{cartCount} productos</span>
                <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)' }}>{fmtPrice(cartTotal)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'8px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:'16px', fontWeight:700, color:'rgba(255,255,255,0.7)' }}>Total estimado</span>
                <span style={{ fontSize:'26px', fontWeight:900, color:ac, letterSpacing:'-.02em' }}>{fmtPrice(cartTotal)}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'8px' }}>
                <Info size={11} color="rgba(255,255,255,0.3)"/>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Pago contra entrega · El negocio te confirmará por teléfono</p>
              </div>
            </div>

            <button onClick={() => setStep('info')} className="step-btn"
              style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${ac},${lighten(ac,10)})`, border:'none', borderRadius:'15px', color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:`0 4px 24px rgba(${rgb},0.4)`, transition:'all .2s' }}>
              Continuar con el pedido <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── INFO CLIENTE ── */}
        {step === 'info' && (
          <div style={{ padding:'20px 16px', animation:'slideIn .3s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px' }}>
              <button onClick={() => setStep('cart')} style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <ArrowLeft size={16} color="rgba(255,255,255,0.6)"/>
              </button>
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>¿Cómo recibís?</h2>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Elige la forma de entrega</p>
              </div>
            </div>

            {/* Tipo de entrega */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'22px' }}>
              {(['pickup','delivery'] as const).map(type => (
                <button key={type} onClick={() => setOrderType(type)}
                  style={{ padding:'18px 14px', borderRadius:'16px', border:`1px solid ${orderType===type ? `rgba(${rgb},0.5)` : 'rgba(255,255,255,0.09)'}`, background: orderType===type ? `rgba(${rgb},0.1)` : 'rgba(255,255,255,0.03)', cursor:'pointer', fontFamily:'inherit', transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', boxShadow: orderType===type ? `0 4px 20px rgba(${rgb},0.15)` : 'none' }}>
                  <div style={{ width:'50px', height:'50px', borderRadius:'14px', background: orderType===type ? `rgba(${rgb},0.2)` : 'rgba(255,255,255,0.05)', border:`1px solid ${orderType===type ? `rgba(${rgb},0.3)` : 'rgba(255,255,255,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
                    {type==='pickup' ? <Store size={22} color={orderType===type ? ac : 'rgba(255,255,255,0.4)'}/> : <Truck size={22} color={orderType===type ? ac : 'rgba(255,255,255,0.4)'}/>}
                  </div>
                  <div style={{ textAlign:'center' as const }}>
                    <p style={{ fontSize:'13px', fontWeight:700, color: orderType===type ? '#fff' : 'rgba(255,255,255,0.5)', marginBottom:'3px' }}>{type==='pickup' ? 'Recoger' : 'Delivery'}</p>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>{type==='pickup' ? 'En el local' : 'A tu dirección'}</p>
                  </div>
                  {orderType===type && <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:ac, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={11} color="#fff"/>
                  </div>}
                </button>
              ))}
            </div>

            {/* Campos */}
            <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'20px' }}>
              <Field label="Tu nombre" k="name" form={form} setForm={setForm} placeholder="Ana García" Icon={User} ac={ac} required/>
              <Field label="Teléfono" k="phone" form={form} setForm={setForm} type="tel" placeholder="+506 8888 8888" Icon={Phone} ac={ac} required/>
              {orderType==='delivery' && <Field label="Dirección de entrega" k="address" form={form} setForm={setForm} placeholder="Calle, número, referencias..." Icon={MapPin} ac={ac} required/>}
              <Field label="Notas adicionales" k="notes" form={form} setForm={setForm} placeholder="Sin cebolla, alérgico a..." Icon={FileText} ac={ac}/>
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'11px', marginBottom:'14px', animation:'popIn .2s ease' }}><p style={{ fontSize:'12px', color:'#E07070' }}>⚠ {error}</p></div>}

            <button onClick={() => {
              if(!form.name.trim()) return setError('Ingresa tu nombre');
              if(!form.phone.trim()) return setError('Ingresa tu teléfono');
              if(orderType==='delivery'&&!form.address.trim()) return setError('Ingresa tu dirección');
              setError(''); setStep('confirm');
            }} className="step-btn"
              style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg,${ac},${lighten(ac,10)})`, border:'none', borderRadius:'15px', color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:`0 4px 24px rgba(${rgb},0.4)`, transition:'all .2s' }}>
              Revisar pedido <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── CONFIRMAR ── */}
        {step === 'confirm' && (
          <div style={{ padding:'20px 16px', animation:'slideIn .3s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px' }}>
              <button onClick={() => setStep('info')} style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <ArrowLeft size={16} color="rgba(255,255,255,0.6)"/>
              </button>
              <h2 style={{ fontSize:'20px', fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>Confirmar pedido</h2>
            </div>

            {/* Productos */}
            <div style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', marginBottom:'12px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:`rgba(${rgb},0.7)`, marginBottom:'12px' }}>Productos</p>
              {cart.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)' }}>{item.quantity}× {item.name}</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{fmtPrice(item.price*item.quantity)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'12px', marginTop:'4px' }}>
                <span style={{ fontSize:'15px', fontWeight:700, color:'rgba(255,255,255,0.6)' }}>Total</span>
                <span style={{ fontSize:'22px', fontWeight:900, color:ac }}>{fmtPrice(cartTotal)}</span>
              </div>
            </div>

            {/* Entrega */}
            <div style={{ padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', marginBottom:'16px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:`rgba(${rgb},0.7)`, marginBottom:'12px' }}>Datos de entrega</p>
              {[
                { label:'Tipo',      value: orderType==='pickup' ? '🏪 Recoger en local' : '🚚 Delivery' },
                { label:'Nombre',    value: form.name },
                { label:'Teléfono',  value: form.phone },
                ...(form.address ? [{ label:'Dirección', value: form.address }] : []),
                ...(form.notes   ? [{ label:'Notas',     value: form.notes }]   : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', gap:'12px', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)' }}>{label}</span>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.75)', textAlign:'right' as const }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'8px', alignItems:'flex-start', padding:'12px 14px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', marginBottom:'16px' }}>
              <Zap size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink:0, marginTop:'1px' }}/>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.65 }}>
                Pago <strong style={{ color:'rgba(255,255,255,0.65)' }}>contra entrega</strong>. Te contactaremos al <strong style={{ color:ac }}>{form.phone}</strong> para confirmar.
              </p>
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'11px', marginBottom:'14px', animation:'popIn .2s ease' }}><p style={{ fontSize:'12px', color:'#E07070' }}>⚠ {error}</p></div>}

            <button onClick={handleSubmit} disabled={submitting} className="step-btn"
              style={{ width:'100%', padding:'16px', background: submitting ? `rgba(${rgb},0.2)` : `linear-gradient(135deg,${ac},${lighten(ac,10)})`, border:'none', borderRadius:'15px', color: submitting ? `rgba(${rgb},0.5)` : '#fff', fontSize:'15px', fontWeight:800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow: submitting ? 'none' : `0 4px 24px rgba(${rgb},0.4)`, transition:'all .2s' }}>
              {submitting
                ? <><span style={{ width:'16px', height:'16px', borderRadius:'50%', border:`2px solid rgba(${rgb},0.3)`, borderTopColor:`rgba(${rgb},0.7)`, animation:'spin .7s linear infinite', display:'inline-block' }}/> Enviando pedido...</>
                : <>Confirmar pedido <Check size={16}/></>
              }
            </button>
          </div>
        )}

        {/* ── ÉXITO ── */}
        {step === 'success' && (
          <div style={{ padding:'48px 20px', textAlign:'center', animation:'fadeUp .6s cubic-bezier(.22,1,.36,1)' }}>
            {/* Círculos de fondo decorativos */}
            <div style={{ position:'relative', marginBottom:'28px' }}>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'140px', height:'140px', borderRadius:'50%', background:`rgba(61,191,127,0.07)`, pointerEvents:'none' }}/>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100px', height:'100px', borderRadius:'50%', background:`rgba(61,191,127,0.1)`, pointerEvents:'none' }}/>
              <div style={{ width:'80px', height:'80px', borderRadius:'22px', background:'rgba(61,191,127,0.12)', border:'2px solid rgba(61,191,127,0.35)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', boxShadow:'0 0 60px rgba(61,191,127,0.2)', position:'relative', animation:'popIn .4s .1s both' }}>
                <Check size={38} color="#3DBF7F"/>
              </div>
            </div>

            <h2 style={{ fontSize:'28px', fontWeight:900, color:'#fff', letterSpacing:'-.03em', marginBottom:'8px' }}>¡Pedido enviado!</h2>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.5)', lineHeight:1.75, marginBottom:'16px' }}>
              Tu pedido fue recibido exitosamente por <strong style={{ color:'#fff' }}>{tenant?.name}</strong>.
            </p>

            {/* Número de orden */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'10px 22px', background:'rgba(61,191,127,0.08)', border:'1px solid rgba(61,191,127,0.2)', borderRadius:'20px', marginBottom:'32px', animation:'popIn .4s .2s both' }}>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Número de pedido:</span>
              <span style={{ fontSize:'17px', fontWeight:900, color:'#3DBF7F', letterSpacing:'.08em' }}>{orderNumber}</span>
            </div>

            {/* Detalles */}
            <div style={{ padding:'20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', marginBottom:'24px', textAlign:'left', animation:'fadeUp .5s .3s both' }}>
              <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.6)', lineHeight:1.8, marginBottom:'8px' }}>
                📞 Te llamaremos al <strong style={{ color:ac }}>{form.phone}</strong> para confirmar tu pedido.
              </p>
              {orderType==='pickup'
                ? <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', lineHeight:1.65 }}>🏪 Recoge en: <strong style={{ color:'rgba(255,255,255,0.65)' }}>{tenant?.address ?? 'Local principal'}</strong></p>
                : <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', lineHeight:1.65 }}>🚚 Entregamos a: <strong style={{ color:'rgba(255,255,255,0.65)' }}>{form.address}</strong></p>
              }
            </div>

            <button onClick={() => { setCart([]); setForm({ name:'', phone:'', address:'', notes:'' }); setStep('catalog'); }}
              style={{ width:'100%', padding:'15px', background:`rgba(${rgb},0.12)`, border:`1px solid rgba(${rgb},0.25)`, borderRadius:'14px', color:ac, fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', animation:'fadeUp .5s .4s both' }}>
              Hacer otro pedido
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
