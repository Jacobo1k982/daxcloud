'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, MapPin, Phone, User, FileText, Truck, Store, ChevronRight, Check, ArrowLeft, Search } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface Product { id: string; name: string; price: number; description?: string; imageUrl?: string; category?: string; }
interface Branch  { id: string; name: string; address?: string; phone?: string; }
interface Tenant  { name: string; logoUrl?: string; industry?: string; address?: string; phone?: string; }
interface CartItem extends Product { quantity: number; }

type Step = 'catalog' | 'cart' | 'info' | 'confirm' | 'success';

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CR', { style:'currency', currency:'CRC', maximumFractionDigits:0 }).format(n);
}

export default function OrderPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [tenant,   setTenant]   = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cart,     setCart]     = useState<CartItem[]>([]);
  const [step,     setStep]     = useState<Step>('catalog');
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderType, setOrderType] = useState<'pickup'|'delivery'>('pickup');
  const [form, setForm] = useState({ name:'', phone:'', address:'', notes:'' });

  useEffect(() => {
    fetch(`${API}/public/${slug}/catalog`)
      .then(r => r.json())
      .then(data => {
        setTenant(data.tenant);
        setProducts((data.products ?? []).map((p: any) => ({ ...p, price: Number(p.price) })));
        setLoading(false);
      })
      .catch(() => { setError('No se pudo cargar el catálogo'); setLoading(false); });
  }, [slug]);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category ?? 'General').filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'Todos' || (p.category ?? 'General') === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);
  const cartTotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const getQty    = (id: string) => cart.find(i => i.id === id)?.quantity ?? 0;

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Ingresa tu nombre');
    if (!form.phone.trim()) return setError('Ingresa tu teléfono');
    if (orderType === 'delivery' && !form.address.trim()) return setError('Ingresa tu dirección de entrega');
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API}/public/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: orderType,
          customerName: form.name,
          customerPhone: form.phone,
          customerAddress: form.address || null,
          notes: form.notes || null,
          items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al enviar el pedido');
      setOrderNumber(data.orderNumber);
      setStep('success');
    } catch(e: any) { setError(e.message ?? 'Error al enviar el pedido'); }
    finally { setSubmitting(false); }
  };

  const S = {
    bg:     '#080C14',
    coral:  '#FF5C35',
    border: 'rgba(255,255,255,0.07)',
    muted:  'rgba(255,255,255,0.35)',
    surf:   'rgba(255,255,255,0.03)',
    card:   'rgba(10,18,32,0.95)',
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',system-ui" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:`3px solid rgba(255,92,53,0.2)`, borderTopColor:'#FF5C35', animation:'spin .7s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ fontSize:'14px', color:S.muted }}>Cargando catálogo...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error && !tenant) return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',system-ui" }}>
      <div style={{ textAlign:'center', padding:'24px' }}>
        <p style={{ fontSize:'48px', marginBottom:'16px' }}>🏪</p>
        <h1 style={{ fontSize:'20px', fontWeight:700, color:'#fff', marginBottom:'8px' }}>Negocio no encontrado</h1>
        <p style={{ fontSize:'14px', color:S.muted }}>El enlace puede ser incorrecto o el negocio no está disponible.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:S.bg, fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:'100px' }}>

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(8,12,20,0.95)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${S.border}` }}>
        <div style={{ maxWidth:'680px', margin:'0 auto', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
          {step !== 'catalog' && (
            <button onClick={() => setStep(step==='cart'?'catalog':step==='info'?'cart':step==='confirm'?'info':'catalog')}
              style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(255,255,255,0.05)', border:`1px solid ${S.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <ArrowLeft size={15} color={S.muted}/>
            </button>
          )}
          {tenant?.logoUrl
            ? <img src={tenant.logoUrl} alt={tenant.name} style={{ width:'34px', height:'34px', borderRadius:'9px', objectFit:'cover', flexShrink:0 }}/>
            : <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(255,92,53,0.12)', border:'1px solid rgba(255,92,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Store size={16} color="#FF5C35"/>
              </div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0, letterSpacing:'-.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tenant?.name}</h1>
            {tenant?.address && <p style={{ fontSize:'11px', color:S.muted, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tenant.address}</p>}
          </div>
          {step === 'catalog' && cartCount > 0 && (
            <button onClick={() => setStep('cart')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 16px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', border:'none', borderRadius:'10px', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}>
              <ShoppingCart size={14}/>
              <span>{cartCount}</span>
              <span style={{ opacity:.8 }}>·</span>
              <span>{formatPrice(cartTotal)}</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'0 16px' }}>

        {/* ── CATÁLOGO ── */}
        {step === 'catalog' && (
          <div style={{ paddingTop:'20px' }}>
            {/* Búsqueda */}
            <div style={{ position:'relative', marginBottom:'16px' }}>
              <Search size={14} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos..."
                style={{ width:'100%', padding:'12px 16px 12px 40px', background:'rgba(255,255,255,0.05)', border:`1px solid ${S.border}`, borderRadius:'12px', color:'#F0F4FF', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const }}
                onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.4)'; e.target.style.background='rgba(255,92,53,0.04)'; }}
                onBlur={e => { e.target.style.borderColor=S.border; e.target.style.background='rgba(255,255,255,0.05)'; }}
              />
            </div>

            {/* Categorías */}
            <div style={{ display:'flex', gap:'6px', overflowX:'auto', marginBottom:'20px', paddingBottom:'4px', scrollbarWidth:'none' as const }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ padding:'7px 14px', borderRadius:'20px', border:`1px solid ${activeCategory===cat ? 'rgba(255,92,53,0.4)' : S.border}`, background: activeCategory===cat ? 'rgba(255,92,53,0.1)' : 'transparent', color: activeCategory===cat ? '#FF5C35' : S.muted, fontSize:'12px', fontWeight: activeCategory===cat ? 700 : 500, cursor:'pointer', whiteSpace:'nowrap' as const, fontFamily:'inherit', flexShrink:0, transition:'all .15s' }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Productos */}
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
              {filtered.length === 0
                ? <p style={{ textAlign:'center' as const, color:S.muted, fontSize:'14px', padding:'40px 0' }}>No hay productos disponibles</p>
                : filtered.map(p => {
                  const qty = getQty(p.id);
                  return (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px', background:S.card, border:`1px solid ${qty > 0 ? 'rgba(255,92,53,0.25)' : S.border}`, borderRadius:'14px', transition:'border-color .2s' }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width:'64px', height:'64px', borderRadius:'10px', objectFit:'cover', flexShrink:0 }}/>
                        : <div style={{ width:'64px', height:'64px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${S.border}` }}>
                            <ShoppingCart size={20} color="rgba(255,92,53,0.3)"/>
                          </div>
                      }
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{p.name}</p>
                        {p.description && <p style={{ fontSize:'12px', color:S.muted, marginBottom:'6px', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>{p.description}</p>}
                        <p style={{ fontSize:'16px', fontWeight:800, color:'#FF5C35', letterSpacing:'-.01em' }}>{formatPrice(p.price)}</p>
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {qty === 0
                          ? <button onClick={() => addToCart(p)} style={{ width:'38px', height:'38px', borderRadius:'10px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 12px rgba(255,92,53,0.3)' }}>
                              <Plus size={18} color="#fff"/>
                            </button>
                          : <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <button onClick={() => updateQty(p.id, qty-1)} style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,0.07)', border:`1px solid ${S.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                                <Minus size={13} color="#fff"/>
                              </button>
                              <span style={{ fontSize:'15px', fontWeight:800, color:'#FF5C35', minWidth:'18px', textAlign:'center' as const }}>{qty}</span>
                              <button onClick={() => addToCart(p)} style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,92,53,0.15)', border:'1px solid rgba(255,92,53,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                                <Plus size={13} color="#FF5C35"/>
                              </button>
                            </div>
                        }
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ── CARRITO ── */}
        {step === 'cart' && (
          <div style={{ paddingTop:'20px' }}>
            <h2 style={{ fontSize:'20px', fontWeight:800, color:'#fff', letterSpacing:'-.02em', marginBottom:'20px' }}>Tu pedido</h2>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'24px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px', background:S.card, border:`1px solid ${S.border}`, borderRadius:'14px' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'14px', fontWeight:600, color:'#fff', marginBottom:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{item.name}</p>
                    <p style={{ fontSize:'13px', color:'#FF5C35', fontWeight:700 }}>{formatPrice(item.price)}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                    <button onClick={() => updateQty(item.id, item.quantity-1)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(255,255,255,0.06)', border:`1px solid ${S.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Minus size={12} color="#fff"/>
                    </button>
                    <span style={{ fontSize:'14px', fontWeight:800, color:'#fff', minWidth:'16px', textAlign:'center' as const }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity+1)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(255,92,53,0.12)', border:'1px solid rgba(255,92,53,0.25)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Plus size={12} color="#FF5C35"/>
                    </button>
                    <button onClick={() => removeFromCart(item.id)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'rgba(224,80,80,0.08)', border:'1px solid rgba(224,80,80,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <X size={12} color="#E07070"/>
                    </button>
                  </div>
                  <p style={{ fontSize:'14px', fontWeight:800, color:'#fff', flexShrink:0, minWidth:'72px', textAlign:'right' as const }}>{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ padding:'16px 18px', background:'rgba(255,92,53,0.06)', border:'1px solid rgba(255,92,53,0.18)', borderRadius:'14px', marginBottom:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'15px', fontWeight:700, color:'rgba(255,255,255,0.7)' }}>Total estimado</span>
                <span style={{ fontSize:'24px', fontWeight:900, color:'#FF5C35', letterSpacing:'-.02em' }}>{formatPrice(cartTotal)}</span>
              </div>
              <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginTop:'4px' }}>Pago contra entrega</p>
            </div>

            <button onClick={() => setStep('info')} style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', border:'none', borderRadius:'13px', color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 24px rgba(255,92,53,0.3)' }}>
              Continuar <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── INFO CLIENTE ── */}
        {step === 'info' && (
          <div style={{ paddingTop:'20px' }}>
            <h2 style={{ fontSize:'20px', fontWeight:800, color:'#fff', letterSpacing:'-.02em', marginBottom:'20px' }}>Datos de entrega</h2>

            {/* Tipo */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
              {(['pickup','delivery'] as const).map(type => (
                <button key={type} onClick={() => setOrderType(type)}
                  style={{ padding:'16px', borderRadius:'13px', border:`1px solid ${orderType===type ? 'rgba(255,92,53,0.4)' : S.border}`, background: orderType===type ? 'rgba(255,92,53,0.08)' : S.surf, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'8px' }}>
                  {type==='pickup' ? <Store size={22} color={orderType===type?'#FF5C35':S.muted}/> : <Truck size={22} color={orderType===type?'#FF5C35':S.muted}/>}
                  <span style={{ fontSize:'13px', fontWeight:700, color: orderType===type ? '#FF5C35' : S.muted }}>{type==='pickup' ? 'Recoger en local' : 'Delivery'}</span>
                </button>
              ))}
            </div>

            {/* Campos */}
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px', marginBottom:'20px' }}>
              {[
                { key:'name',    label:'Nombre completo', icon:User,     type:'text',  placeholder:'Ana García',           required:true },
                { key:'phone',   label:'Teléfono',        icon:Phone,    type:'tel',   placeholder:'+506 8888 8888',        required:true },
                ...(orderType==='delivery' ? [{ key:'address', label:'Dirección de entrega', icon:MapPin, type:'text', placeholder:'Calle, número, referencia', required:true }] : []),
                { key:'notes',   label:'Notas adicionales', icon:FileText, type:'text', placeholder:'Ej: sin cebolla, alérgico a...', required:false },
              ].map(({ key, label, icon:Icon, type, placeholder, required }) => (
                <div key={key}>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.3)', marginBottom:'7px' }}>{label}{required && ' *'}</label>
                  <div style={{ position:'relative' }}>
                    <Icon size={14} color="rgba(255,255,255,0.2)" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                    <input type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ width:'100%', padding:'13px 16px 13px 40px', background:'rgba(255,255,255,0.04)', border:`1px solid ${S.border}`, borderRadius:'12px', color:'#F0F4FF', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
                      onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.5)'; e.target.style.background='rgba(255,92,53,0.04)'; e.target.style.boxShadow='0 0 0 3px rgba(255,92,53,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor=S.border; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'10px', marginBottom:'14px' }}><p style={{ fontSize:'12px', color:'#E07070' }}>⚠ {error}</p></div>}

            <button onClick={() => { if(!form.name.trim()) return setError('Ingresa tu nombre'); if(!form.phone.trim()) return setError('Ingresa tu teléfono'); if(orderType==='delivery'&&!form.address.trim()) return setError('Ingresa tu dirección'); setError(''); setStep('confirm'); }}
              style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', border:'none', borderRadius:'13px', color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 24px rgba(255,92,53,0.3)' }}>
              Revisar pedido <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── CONFIRMAR ── */}
        {step === 'confirm' && (
          <div style={{ paddingTop:'20px' }}>
            <h2 style={{ fontSize:'20px', fontWeight:800, color:'#fff', letterSpacing:'-.02em', marginBottom:'20px' }}>Confirmar pedido</h2>

            {/* Resumen productos */}
            <div style={{ padding:'16px', background:S.card, border:`1px solid ${S.border}`, borderRadius:'14px', marginBottom:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.6)', marginBottom:'12px' }}>Productos</p>
              {cart.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)' }}>{item.quantity}× {item.name}</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'10px', marginTop:'6px' }}>
                <span style={{ fontSize:'14px', fontWeight:700, color:'rgba(255,255,255,0.7)' }}>Total</span>
                <span style={{ fontSize:'18px', fontWeight:900, color:'#FF5C35' }}>{formatPrice(cartTotal)}</span>
              </div>
            </div>

            {/* Datos cliente */}
            <div style={{ padding:'16px', background:S.card, border:`1px solid ${S.border}`, borderRadius:'14px', marginBottom:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.6)', marginBottom:'12px' }}>Datos de entrega</p>
              {[
                { label:'Tipo',     value: orderType==='pickup' ? '🏪 Recoger en local' : '🚚 Delivery' },
                { label:'Nombre',   value: form.name },
                { label:'Teléfono', value: form.phone },
                ...(form.address ? [{ label:'Dirección', value: form.address }] : []),
                ...(form.notes   ? [{ label:'Notas',     value: form.notes   }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', gap:'16px', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)' }}>{label}</span>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.75)', textAlign:'right' as const }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding:'12px 14px', background:'rgba(255,92,53,0.05)', border:'1px solid rgba(255,92,53,0.15)', borderRadius:'12px', marginBottom:'20px' }}>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>💳 El pago es <strong style={{ color:'rgba(255,255,255,0.7)' }}>contra entrega</strong>. El negocio te confirmará tu pedido por teléfono.</p>
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(224,80,80,0.07)', border:'1px solid rgba(224,80,80,0.2)', borderRadius:'10px', marginBottom:'14px' }}><p style={{ fontSize:'12px', color:'#E07070' }}>⚠ {error}</p></div>}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width:'100%', padding:'15px', background:submitting?'rgba(255,92,53,0.2)':'linear-gradient(135deg,#FF5C35,#FF3D1F)', border:'none', borderRadius:'13px', color:submitting?'rgba(255,92,53,0.5)':'#fff', fontSize:'15px', fontWeight:800, cursor:submitting?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:submitting?'none':'0 4px 24px rgba(255,92,53,0.3)', transition:'all .2s' }}>
              {submitting
                ? <><span style={{ width:'16px', height:'16px', borderRadius:'50%', border:'2px solid rgba(255,92,53,0.3)', borderTopColor:'rgba(255,92,53,0.7)', animation:'spin .7s linear infinite', display:'inline-block' }}/> Enviando...</>
                : <>Confirmar pedido ✓</>
              }
            </button>
          </div>
        )}

        {/* ── ÉXITO ── */}
        {step === 'success' && (
          <div style={{ paddingTop:'48px', textAlign:'center' as const }}>
            <div style={{ width:'80px', height:'80px', borderRadius:'20px', background:'rgba(61,191,127,0.12)', border:'1px solid rgba(61,191,127,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 0 40px rgba(61,191,127,0.12)' }}>
              <Check size={36} color="#3DBF7F"/>
            </div>
            <h2 style={{ fontSize:'26px', fontWeight:800, color:'#fff', letterSpacing:'-.03em', marginBottom:'8px' }}>¡Pedido enviado!</h2>
            <p style={{ fontSize:'14px', color:S.muted, lineHeight:1.7, marginBottom:'8px' }}>Tu pedido fue recibido exitosamente.</p>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 18px', background:'rgba(61,191,127,0.08)', border:'1px solid rgba(61,191,127,0.2)', borderRadius:'20px', marginBottom:'32px' }}>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Número de pedido:</span>
              <span style={{ fontSize:'14px', fontWeight:800, color:'#3DBF7F', letterSpacing:'.04em' }}>{orderNumber}</span>
            </div>
            <div style={{ padding:'20px', background:S.card, border:`1px solid ${S.border}`, borderRadius:'16px', marginBottom:'24px', textAlign:'left' as const }}>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:1.8 }}>
                📞 El equipo de <strong style={{ color:'#fff' }}>{tenant?.name}</strong> se comunicará contigo al <strong style={{ color:'#FF5C35' }}>{form.phone}</strong> para confirmar tu pedido.
              </p>
              {orderType === 'pickup' && <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'8px', lineHeight:1.7 }}>🏪 Recoge tu pedido en: <strong style={{ color:'rgba(255,255,255,0.6)' }}>{tenant?.address ?? 'Local principal'}</strong></p>}
              {orderType === 'delivery' && <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'8px', lineHeight:1.7 }}>🚚 Entrega a: <strong style={{ color:'rgba(255,255,255,0.6)' }}>{form.address}</strong></p>}
            </div>
            <button onClick={() => { setCart([]); setForm({ name:'', phone:'', address:'', notes:'' }); setStep('catalog'); }}
              style={{ padding:'13px 28px', background:'rgba(255,255,255,0.05)', border:`1px solid ${S.border}`, borderRadius:'12px', color:S.muted, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Hacer otro pedido
            </button>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::placeholder{color:rgba(255,255,255,0.2)!important}
        ::-webkit-scrollbar{display:none}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
