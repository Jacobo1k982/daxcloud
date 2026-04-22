'use client';
import { useState, useEffect, useRef, use } from 'react';
import {
  ShoppingCart, Plus, Minus, X, MapPin, Phone, User, FileText,
  Truck, Store, ChevronRight, Check, ArrowLeft, Search,
  Clock, Star, Zap, Heart, Share2, Instagram, Facebook,
  MessageCircle, Globe, ChevronDown, Sparkles, Package,
  ArrowRight, Info,
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

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
}

const INDUSTRY_ICONS: Record<string, string> = {
  restaurant: '🍽️', bakery: '🥖', pharmacy: '💊', salon: '✂️',
  clothing: '👕', produce: '🥬', supermarket: '🛒', general: '🏪',
};

const INDUSTRY_LABELS: Record<string, string> = {
  restaurant: 'Restaurante', bakery: 'Panadería', pharmacy: 'Farmacia',
  salon: 'Salón', clothing: 'Ropa', produce: 'Verdulería',
  supermarket: 'Supermercado', general: 'Tienda',
};

// ── Animaciones ───────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #08090D; color: #fff; }
  ::placeholder { color: rgba(255,255,255,0.25) !important; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(1.15); } }
  @keyframes cartBounce { 0%,100% { transform: scale(1); } 30% { transform: scale(1.2); } 60% { transform: scale(.95); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .product-card:hover .product-add-btn { opacity: 1; transform: translateY(0); }
  .product-card:hover .product-img { transform: scale(1.05); }
  .product-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-2px); }
  .category-pill:hover { background: rgba(255,255,255,0.08) !important; }
  .cart-btn-float { animation: float 3s ease-in-out infinite; }
`;

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = '16px', radius = '8px' }: any) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: 'linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.05) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}/>
  );
}

// ── Hero del negocio ──────────────────────────────────────────────────────────
function BusinessHero({ tenant, branches, accentColor }: { tenant: Tenant; branches: Branch[]; accentColor: string }) {
  const settings = tenant.settings ?? {};
  const isOpen = settings.acceptingOrders !== false;
  const hours = settings.businessHours;
  const industry = tenant.industry ?? 'general';

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Banner fondo con gradiente */}
      <div style={{ height: '200px', position: 'relative', background: `linear-gradient(135deg, ${accentColor}30 0%, rgba(8,9,13,0) 60%), linear-gradient(180deg, #0D0F16 0%, #08090D 100%)` }}>
        {/* Partículas decorativas */}
        <div style={{ position: 'absolute', top: '20px', right: '40px', width: '120px', height: '120px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}20, transparent 70%)`, filter: 'blur(20px)' }}/>
        <div style={{ position: 'absolute', top: '60px', left: '20px', width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}15, transparent 70%)`, filter: 'blur(15px)' }}/>

        {/* Grid sutil */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}/>
      </div>

      {/* Info del negocio */}
      <div style={{ padding: '0 20px 24px', marginTop: '-60px', position: 'relative', zIndex: 1 }}>
        {/* Logo + nombre */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', border: `3px solid ${accentColor}40`, boxShadow: `0 8px 32px ${accentColor}30, 0 0 0 1px rgba(255,255,255,0.06)`, flexShrink: 0, background: '#0D0F16' }}>
            {tenant.logoUrl
              ? <img src={tenant.logoUrl} alt={tenant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  {INDUSTRY_ICONS[industry] ?? '🏪'}
                </div>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>{tenant.name}</h1>
              <span style={{ fontSize: '10px', fontWeight: 700, color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}30`, borderRadius: '20px', padding: '2px 10px' }}>
                {INDUSTRY_ICONS[industry]} {INDUSTRY_LABELS[industry] ?? 'Tienda'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Estado abierto/cerrado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: isOpen ? 'rgba(61,191,127,0.1)' : 'rgba(224,80,80,0.1)', border: `1px solid ${isOpen ? 'rgba(61,191,127,0.3)' : 'rgba(224,80,80,0.3)'}` }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isOpen ? '#3DBF7F' : '#E05050', animation: isOpen ? 'pulse 2s infinite' : 'none' }}/>
                <span style={{ fontSize: '10px', fontWeight: 700, color: isOpen ? '#3DBF7F' : '#E05050' }}>{isOpen ? 'Abierto' : 'Cerrado'}</span>
              </div>

              {hours && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={10}/> {hours.open} - {hours.close}
              </span>}

              {tenant.phone && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Phone size={10}/> {tenant.phone}
              </span>}
            </div>
          </div>
        </div>

        {/* Descripción */}
        {settings.publicDescription && (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '14px' }}>
            {settings.publicDescription}
          </p>
        )}

        {/* Dirección */}
        {tenant.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <MapPin size={13} color="rgba(255,255,255,0.3)"/>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{tenant.address}</span>
          </div>
        )}

        {/* Redes sociales */}
        {(settings.instagram || settings.facebook || settings.whatsapp) && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {settings.whatsapp && (
              <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                <MessageCircle size={12}/> WhatsApp
              </a>
            )}
            {settings.instagram && (
              <a href={`https://instagram.com/${settings.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)', color: '#E1306C', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                <Share2 size={12}/> Instagram
              </a>
            )}
            {settings.facebook && (
              <a href={`https://facebook.com/${settings.facebook}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)', color: '#1877F2', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                <Globe size={12}/> Facebook
              </a>
            )}
          </div>
        )}
      </div>

      {/* Separador */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)', margin: '0 20px' }}/>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, qty, onAdd, onRemove, accentColor }: {
  product: Product; qty: number; onAdd: () => void; onRemove: () => void; accentColor: string;
}) {
  const taxRate = product.metadata?.taxRate ?? 0;
  const hasImage = !!product.imageUrl;

  return (
    <div className="product-card" style={{ background: qty > 0 ? `${accentColor}08` : 'rgba(255,255,255,0.025)', border: `1px solid ${qty > 0 ? `${accentColor}30` : 'rgba(255,255,255,0.06)'}`, borderRadius: '18px', overflow: 'hidden', transition: 'all .25s cubic-bezier(.22,1,.36,1)', cursor: 'pointer', position: 'relative' }}
      onClick={onAdd}>

      {/* Imagen */}
      <div style={{ height: '150px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
        {hasImage
          ? <img className="product-img" src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s cubic-bezier(.22,1,.36,1)' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Package size={28} color="rgba(255,255,255,0.1)"/>
            </div>
        }

        {/* Badge IVA */}
        {taxRate > 0 && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(90,170,240,0.85)', backdropFilter: 'blur(8px)', borderRadius: '6px', padding: '2px 7px', fontSize: '9px', fontWeight: 700, color: '#fff' }}>
            IVA {taxRate}%
          </div>
        )}

        {/* Botón agregar flotante */}
        <div className="product-add-btn" style={{ position: 'absolute', bottom: '8px', right: '8px', opacity: qty > 0 ? 1 : 0, transform: qty > 0 ? 'translateY(0)' : 'translateY(8px)', transition: 'all .2s' }}>
          {qty === 0
            ? <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `linear-gradient(135deg,${accentColor},${accentColor}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${accentColor}50` }}>
                <Plus size={18} color="#fff"/>
              </div>
            : <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(8,9,13,0.9)', backdropFilter: 'blur(8px)', border: `1px solid ${accentColor}40`, borderRadius: '10px', padding: '4px 8px' }}>
                <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Minus size={13} color="#fff"/>
                </button>
                <span style={{ fontSize: '14px', fontWeight: 800, color: accentColor, minWidth: '16px', textAlign: 'center' as const }}>{qty}</span>
                <button onClick={e => { e.stopPropagation(); onAdd(); }} style={{ width: '26px', height: '26px', borderRadius: '7px', background: `${accentColor}20`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={13} color={accentColor}/>
                </button>
              </div>
          }
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: 1.3, letterSpacing: '-.01em' }}>{product.name}</p>
        {product.description && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{product.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '18px', fontWeight: 900, color: accentColor, letterSpacing: '-.02em' }}>{formatPrice(product.price)}</p>
          {qty === 0 && (
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${accentColor}15`, border: `1px solid ${accentColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} color={accentColor}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

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
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [cartBounce, setCartBounce] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

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

  const accentColor = tenant?.settings?.primaryColor ?? '#FF5C35';

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category ?? 'General').filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'Todos' || (p.category ?? 'General') === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = categories.filter(c => c !== 'Todos').map(cat => ({
    name: cat,
    items: filtered.filter(p => (p.category ?? 'General') === cat),
  })).filter(g => g.items.length > 0);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
    setCartBounce(true); setTimeout(() => setCartBounce(false), 600);
  };

  const removeFromCart = (id: string) => setCart(prev => {
    const item = prev.find(i => i.id === id);
    if (!item) return prev;
    if (item.quantity <= 1) return prev.filter(i => i.id !== id);
    return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
  });

  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);
  const cartTotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const getQty    = (id: string) => cart.find(i => i.id === id)?.quantity ?? 0;

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Ingresa tu nombre');
    if (!form.phone.trim()) return setError('Ingresa tu teléfono');
    if (orderType === 'delivery' && !form.address.trim()) return setError('Ingresa tu dirección');
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API}/public/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: orderType,
          customerName: form.name, customerPhone: form.phone,
          customerAddress: form.address || null, notes: form.notes || null,
          items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al enviar el pedido');
      setOrderNumber(data.orderNumber);
      setStep('success');
    } catch(e: any) { setError(e.message ?? 'Error'); }
    finally { setSubmitting(false); }
  };

  // Loading
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#08090D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui' }}>
      <div style={{ textAlign: 'center', animation: 'fadeUp .5s ease' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,92,53,0.1)', border: '1px solid rgba(255,92,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShoppingCart size={24} color="#FF5C35" style={{ animation: 'pulse 1.5s infinite' }}/>
        </div>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Cargando catálogo...</p>
      </div>
      <style>{GLOBAL_STYLES}</style>
    </div>
  );

  if (error && !tenant) return (
    <div style={{ minHeight: '100vh', background: '#08090D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter,system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '64px', marginBottom: '16px' }}>🏪</p>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Negocio no encontrado</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>El enlace puede ser incorrecto o el negocio no está disponible.</p>
      </div>
      <style>{GLOBAL_STYLES}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#08090D', fontFamily: 'Inter,system-ui,sans-serif', paddingBottom: '100px', maxWidth: '100vw', overflowX: 'hidden' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── HEADER STICKY ── */}
      {step === 'catalog' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,9,13,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={13} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Buscar en ${tenant?.name ?? 'el catálogo'}...`}
                style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, transition: 'all .2s' }}
                onFocus={e => { e.target.style.borderColor = `${accentColor}60`; e.target.style.background = `${accentColor}08`; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
              />
            </div>

            {cartCount > 0 && (
              <button onClick={() => setStep('cart')} className={cartBounce ? 'cart-btn-float' : ''}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: `linear-gradient(135deg,${accentColor},${accentColor}CC)`, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', boxShadow: `0 4px 16px ${accentColor}40`, animation: cartBounce ? 'cartBounce .5s ease' : 'none' }}>
                <ShoppingCart size={15}/>
                <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: 800 }}>{cartCount}</span>
                <span>{formatPrice(cartTotal)}</span>
              </button>
            )}
          </div>

          {/* Categorías */}
          <div style={{ display: 'flex', gap: '6px', padding: '8px 20px 12px', overflowX: 'auto', scrollbarWidth: 'none' as const }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className="category-pill"
                style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${activeCategory === cat ? `${accentColor}50` : 'rgba(255,255,255,0.07)'}`, background: activeCategory === cat ? `${accentColor}15` : 'rgba(255,255,255,0.03)', color: activeCategory === cat ? accentColor : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: activeCategory === cat ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: 'inherit', flexShrink: 0, transition: 'all .15s' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* ── CATÁLOGO ── */}
        {step === 'catalog' && (
          <div>
            {/* Hero */}
            <BusinessHero tenant={tenant!} branches={branches} accentColor={accentColor}/>

            {/* No acepta pedidos */}
            {tenant?.settings?.acceptingOrders === false && (
              <div style={{ margin: '0 20px 20px', padding: '14px 18px', background: 'rgba(224,80,80,0.07)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Clock size={16} color="#E07070" style={{ flexShrink: 0 }}/>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#E07070', marginBottom: '2px' }}>Estamos cerrados por ahora</p>
                  <p style={{ fontSize: '11px', color: 'rgba(224,80,80,0.6)' }}>No estamos aceptando pedidos en este momento. ¡Vuelve pronto!</p>
                </div>
              </div>
            )}

            {/* Buscando */}
            {search && (
              <div style={{ padding: '12px 20px 0' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "<strong style={{ color: '#fff' }}>{search}</strong>"</p>
              </div>
            )}

            {/* Productos sin categoría (búsqueda) */}
            {search && (
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px' }}>
                  {filtered.map(p => (
                    <ProductCard key={p.id} product={p} qty={getQty(p.id)} onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)} accentColor={accentColor}/>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No encontramos "{search}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Productos por categoría */}
            {!search && (
              <div ref={catalogRef}>
                {activeCategory === 'Todos'
                  ? grouped.map(group => (
                    <div key={group.name} style={{ padding: '20px 20px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>{group.name}</h2>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}/>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{group.items.length}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px' }}>
                        {group.items.map(p => (
                          <ProductCard key={p.id} product={p} qty={getQty(p.id)} onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)} accentColor={accentColor}/>
                        ))}
                      </div>
                    </div>
                  ))
                  : (
                    <div style={{ padding: '20px 20px 0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px' }}>
                        {filtered.map(p => (
                          <ProductCard key={p.id} product={p} qty={getQty(p.id)} onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)} accentColor={accentColor}/>
                        ))}
                      </div>
                    </div>
                  )
                }
              </div>
            )}

            {/* FAB carrito */}
            {cartCount > 0 && (
              <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 40, animation: 'fadeUp .3s ease' }}>
                <button onClick={() => setStep('cart')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: `linear-gradient(135deg,${accentColor},${accentColor}CC)`, border: 'none', borderRadius: '20px', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 32px ${accentColor}50, 0 0 0 1px rgba(255,255,255,0.1)`, whiteSpace: 'nowrap' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShoppingCart size={16}/>
                    <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '20px', padding: '2px 8px', fontSize: '12px' }}>{cartCount}</span>
                  </div>
                  <span>Ver pedido · {formatPrice(cartTotal)}</span>
                  <ChevronRight size={16}/>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CARRITO ── */}
        {step === 'cart' && (
          <div style={{ padding: '20px', animation: 'slideIn .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => setStep('catalog')} style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowLeft size={16} color="rgba(255,255,255,0.6)"/>
              </button>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Tu pedido</h2>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{cartCount} producto{cartCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}/>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name}</p>
                    <p style={{ fontSize: '13px', color: accentColor, fontWeight: 700, marginTop: '2px' }}>{formatPrice(item.price)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => removeFromCart(item.id)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Minus size={13} color="#fff"/>
                    </button>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', minWidth: '18px', textAlign: 'center' as const }}>{item.quantity}</span>
                    <button onClick={() => addToCart(item)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${accentColor}15`, border: `1px solid ${accentColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Plus size={13} color={accentColor}/>
                    </button>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(224,80,80,0.07)', border: '1px solid rgba(224,80,80,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={13} color="#E07070"/>
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0, minWidth: '72px', textAlign: 'right' as const }}>{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ padding: '18px 20px', background: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{cartCount} productos</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{formatPrice(cartTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total estimado</span>
                <span style={{ fontSize: '26px', fontWeight: 900, color: accentColor, letterSpacing: '-.02em' }}>{formatPrice(cartTotal)}</span>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={10}/> Pago contra entrega — se confirma por teléfono
              </p>
            </div>

            <button onClick={() => setStep('info')} style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg,${accentColor},${accentColor}CC)`, border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 24px ${accentColor}40` }}>
              Continuar con el pedido <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── INFO CLIENTE ── */}
        {step === 'info' && (
          <div style={{ padding: '20px', animation: 'slideIn .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => setStep('cart')} style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowLeft size={16} color="rgba(255,255,255,0.6)"/>
              </button>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>¿Cómo recibís?</h2>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Elige cómo quieres recibir tu pedido</p>
              </div>
            </div>

            {/* Tipo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {(['pickup','delivery'] as const).map(type => (
                <button key={type} onClick={() => setOrderType(type)}
                  style={{ padding: '18px 14px', borderRadius: '16px', border: `1px solid ${orderType === type ? `${accentColor}50` : 'rgba(255,255,255,0.08)'}`, background: orderType === type ? `${accentColor}10` : 'rgba(255,255,255,0.03)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: orderType === type ? `${accentColor}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${orderType === type ? `${accentColor}30` : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                    {type === 'pickup' ? <Store size={22} color={orderType === type ? accentColor : 'rgba(255,255,255,0.4)'}/> : <Truck size={22} color={orderType === type ? accentColor : 'rgba(255,255,255,0.4)'}/>}
                  </div>
                  <div style={{ textAlign: 'center' as const }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: orderType === type ? '#fff' : 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{type === 'pickup' ? 'Recoger' : 'Delivery'}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{type === 'pickup' ? 'En el local' : 'A tu dirección'}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Campos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {[
                { key: 'name',    label: 'Tu nombre', icon: User,     type: 'text',  placeholder: 'Ana García',       required: true },
                { key: 'phone',   label: 'Teléfono',  icon: Phone,    type: 'tel',   placeholder: '+506 8888 8888',   required: true },
                ...(orderType === 'delivery' ? [{ key: 'address', label: 'Dirección de entrega', icon: MapPin, type: 'text', placeholder: 'Calle, número, referencia...', required: true }] : []),
                { key: 'notes',   label: 'Notas',     icon: FileText, type: 'text',  placeholder: 'Instrucciones especiales...', required: false },
              ].map(({ key, label, icon: Icon, type, placeholder, required }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
                    {label}{required && <span style={{ color: accentColor, marginLeft: '3px' }}>*</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={14} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
                    <input type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ width: '100%', padding: '13px 16px 13px 42px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '13px', color: '#F0F4FF', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, transition: 'all .2s' }}
                      onFocus={e => { e.target.style.borderColor = `${accentColor}60`; e.target.style.background = `${accentColor}06`; e.target.style.boxShadow = `0 0 0 3px ${accentColor}10`; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,0.07)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: '10px', marginBottom: '14px' }}><p style={{ fontSize: '12px', color: '#E07070' }}>⚠ {error}</p></div>}

            <button onClick={() => { if (!form.name.trim()) return setError('Ingresa tu nombre'); if (!form.phone.trim()) return setError('Ingresa tu teléfono'); if (orderType === 'delivery' && !form.address.trim()) return setError('Ingresa tu dirección'); setError(''); setStep('confirm'); }}
              style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg,${accentColor},${accentColor}CC)`, border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 24px ${accentColor}40` }}>
              Revisar pedido <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── CONFIRMAR ── */}
        {step === 'confirm' && (
          <div style={{ padding: '20px', animation: 'slideIn .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => setStep('info')} style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowLeft size={16} color="rgba(255,255,255,0.6)"/>
              </button>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Confirmar pedido</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {/* Productos */}
              <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: `${accentColor}80`, marginBottom: '12px' }}>Productos</p>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{item.quantity}× {item.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: accentColor }}>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {/* Entrega */}
              <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: `${accentColor}80`, marginBottom: '12px' }}>Datos de entrega</p>
                {[
                  { label: 'Tipo', value: orderType === 'pickup' ? '🏪 Recoger en local' : '🚚 Delivery' },
                  { label: 'Nombre', value: form.name },
                  { label: 'Teléfono', value: form.phone },
                  ...(form.address ? [{ label: 'Dirección', value: form.address }] : []),
                  ...(form.notes ? [{ label: 'Notas', value: form.notes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', textAlign: 'right' as const }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Zap size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }}/>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Pago <strong style={{ color: 'rgba(255,255,255,0.65)' }}>contra entrega</strong>. Te contactaremos al {form.phone} para confirmar.
              </p>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,0.07)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: '10px', marginBottom: '14px' }}><p style={{ fontSize: '12px', color: '#E07070' }}>⚠ {error}</p></div>}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: '100%', padding: '16px', background: submitting ? `${accentColor}30` : `linear-gradient(135deg,${accentColor},${accentColor}CC)`, border: 'none', borderRadius: '14px', color: submitting ? `${accentColor}60` : '#fff', fontSize: '15px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: submitting ? 'none' : `0 4px 24px ${accentColor}40`, transition: 'all .2s' }}>
              {submitting
                ? <><span style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${accentColor}30`, borderTopColor: `${accentColor}80`, animation: 'spin .7s linear infinite', display: 'inline-block' }}/> Enviando pedido...</>
                : <>Confirmar pedido <Check size={16}/></>
              }
            </button>
          </div>
        )}

        {/* ── ÉXITO ── */}
        {step === 'success' && (
          <div style={{ padding: '40px 20px', textAlign: 'center', animation: 'fadeUp .5s ease' }}>
            {/* Icono éxito */}
            <div style={{ width: '90px', height: '90px', borderRadius: '24px', background: 'rgba(61,191,127,0.1)', border: '2px solid rgba(61,191,127,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 60px rgba(61,191,127,0.15)' }}>
              <Check size={40} color="#3DBF7F"/>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-.03em', marginBottom: '8px' }}>¡Pedido enviado!</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '12px' }}>Tu pedido fue recibido exitosamente.</p>

            {/* Número de orden */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: 'rgba(61,191,127,0.08)', border: '1px solid rgba(61,191,127,0.2)', borderRadius: '20px', marginBottom: '32px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Número de pedido:</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#3DBF7F', letterSpacing: '.06em' }}>{orderNumber}</span>
            </div>

            {/* Info */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', marginBottom: '24px', textAlign: 'left' as const }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: '10px' }}>
                📞 <strong style={{ color: '#fff' }}>{tenant?.name}</strong> se comunicará contigo al <strong style={{ color: accentColor }}>{form.phone}</strong> para confirmar tu pedido.
              </p>
              {orderType === 'pickup'
                ? <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>🏪 Recoge en: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{tenant?.address ?? 'Local principal'}</strong></p>
                : <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>🚚 Entrega a: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{form.address}</strong></p>
              }
            </div>

            <button onClick={() => { setCart([]); setForm({ name: '', phone: '', address: '', notes: '' }); setStep('catalog'); }}
              style={{ width: '100%', padding: '15px', background: `${accentColor}15`, border: `1px solid ${accentColor}30`, borderRadius: '14px', color: accentColor, fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
              Hacer otro pedido
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
