'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { CashRegisterGate } from '@/components/pos/CashRegisterGate';
import {
  Search, X, Plus, Minus, ShoppingCart,
  ChefHat, Scissors, Shirt, Leaf, Pill,
  Package, Barcode, Tag, Trash2,
} from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  weight?: number;
  notes?: string;
  modifiers?: { optionId: string; name: string; extraPrice: number }[];
  size?: string;
  color?: string;
  serviceId?: string;
  employeeId?: string;
}

const INDUSTRY_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  restaurant: { label: 'Restaurante', color: '#F97316', icon: ChefHat, description: 'Mesas y comandas' },
  bakery: { label: 'Panadería', color: '#FF5C35', icon: Package, description: 'Presentaciones' },
  pharmacy: { label: 'Farmacia', color: '#5AAAF0', icon: Pill, description: 'Medicamentos' },
  salon: { label: 'Peluquería', color: '#A78BFA', icon: Scissors, description: 'Servicios' },
  clothing: { label: 'Ropa', color: '#EAB308', icon: Shirt, description: 'Tallas y colores' },
  produce: { label: 'Verdulería', color: '#22C55E', icon: Leaf, description: 'Por peso' },
  supermarket: { label: 'Supermercado', color: '#5AAAF0', icon: Barcode, description: 'Código de barras' },
  general: { label: 'General', color: '#FF5C35', icon: ShoppingCart, description: 'Tienda estándar' },
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'card', label: 'Tarjeta', icon: '💳' },
  { value: 'transfer', label: 'SINPE', icon: '📱' },
  { value: 'mixed', label: 'Mixto', icon: '🔀' },
];

export default function POSPage() {

  const router = useRouter();
  const { formatCurrency, industry } = useAuth();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);

  const cfg = INDUSTRY_CONFIG[industry] ?? INDUSTRY_CONFIG.general;
  const Icon = cfg.icon;
  const C = cfg.color;

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [weightInput, setWeightInput] = useState<Record<string, string>>({});
  const [showVariantModal, setShowVariantModal] = useState<any>(null);
  const [showModifierModal, setShowModifierModal] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<any[]>([]);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products', search, selectedCategory],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      if (selectedCategory) p.append('category', selectedCategory);
      const { data } = await api.get(`/products?${p}&active=true`);
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: async () => { const { data } = await api.get('/products/categories'); return data; },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => { const { data } = await api.get('/branches'); return data; },
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['pos-tables'],
    queryFn: async () => { const { data } = await api.get('/restaurant/tables'); return data; },
    enabled: industry === 'restaurant',
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['pos-employees'],
    queryFn: async () => { const { data } = await api.get('/salon/employees'); return data; },
    enabled: industry === 'salon',
  });

  const { data: services = [] } = useQuery({
    queryKey: ['pos-services'],
    queryFn: async () => { const { data } = await api.get('/salon/services'); return data; },
    enabled: industry === 'salon',
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['pos-variants'],
    queryFn: async () => { const { data } = await api.get('/clothing/variants'); return data; },
    enabled: industry === 'clothing',
  });

  const { data: produceProducts = [] } = useQuery({
    queryKey: ['pos-produce'],
    queryFn: async () => { const { data } = await api.get('/produce/products'); return data; },
    enabled: industry === 'produce',
  });

  const { data: modifierGroups = [] } = useQuery({
    queryKey: ['pos-modifiers', showModifierModal?.id],
    queryFn: async () => { const { data } = await api.get('/restaurant/modifiers'); return data; },
    enabled: industry === 'restaurant' && !!showModifierModal,
  });

  const { data: activeHappyHour = [] } = useQuery({
    queryKey: ['pos-happyhour'],
    queryFn: async () => { const { data } = await api.get('/restaurant/happy-hour/active'); return data; },
    enabled: industry === 'restaurant',
    refetchInterval: 60000,
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getPrice = (product: any) => {
    if (industry !== 'restaurant' || !(activeHappyHour as any[]).length) return Number(product.price);
    const hh = (activeHappyHour as any[]).find((h: any) =>
      h.products?.some((p: any) => p.productId === product.id),
    );
    if (!hh) return Number(product.price);
    return hh.discountType === 'percentage'
      ? Number(product.price) * (1 - hh.discount / 100)
      : Math.max(0, Number(product.price) - hh.discount);
  };

  const addToCart = (product: any, options?: any) => {
    const base = options?.price ?? getPrice(product);
    const qty = options?.quantity ?? 1;
    const modExtra = (options?.modifiers ?? []).reduce((a: number, m: any) => a + m.extraPrice, 0);
    const finalPrice = base + modExtra;
    const itemId = `${product.id}-${options?.variantId ?? ''}-${options?.size ?? ''}-${options?.color ?? ''}-${(options?.modifiers ?? []).map((m: any) => m.optionId).join('-')}`;

    setCart(prev => {
      const ex = prev.find(i => i.id === itemId);
      if (ex && !options?.modifiers?.length)
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, {
        id: itemId, productId: product.id, name: product.name,
        price: finalPrice, quantity: qty, unit: options?.unit ?? 'unidad', ...options,
      }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQty = (id: string, delta: number) =>
    setCart(prev =>
      prev.map(i => i.id !== id ? i : i.quantity + delta <= 0 ? null : { ...i, quantity: i.quantity + delta })
        .filter(Boolean) as CartItem[],
    );

  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const discountAmt = discount > 0 ? subtotal * discount / 100 : 0;
  const total = subtotal - discountAmt;
  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);

  // ── Mutación de venta ──────────────────────────────────────────────────────

  const saleMutation = useMutation({
    mutationFn: async () => {
      const branchId = (branches as any[])[0]?.id;
      if (!branchId) throw new Error('No hay sucursal disponible. Espera a que cargue o recarga la página.');
      if (cart.length === 0) throw new Error('El carrito está vacío.');

      if (industry === 'restaurant') {
        const { data } = await api.post('/restaurant/orders', {
          tableId: selectedTable || undefined,
          branchId, notes: note,
          items: cart.map(item => ({
            productId: item.productId, quantity: item.quantity,
            notes: item.notes, modifiers: item.modifiers?.map(m => m.optionId),
          })),
        });
        return data;
      }

      if (industry === 'salon' && cart[0]?.serviceId) {
        await api.post('/salon/appointments', {
          clientName: 'Cliente walk-in',
          employeeId: selectedEmployee || undefined,
          serviceId: cart[0].serviceId,
          startTime: new Date().toISOString(),
          branchId,
        });
      }

      const { data } = await api.post('/sales', {
        branchId, paymentMethod,
        discount: discountAmt, subtotal, total,
        notes: note || undefined,
        items: cart.map(item => ({
          productId: item.productId, quantity: item.quantity,
          unitPrice: item.price, subtotal: item.price * item.quantity,
          discount: 0, notes: item.notes, variantId: item.variantId,
        })),
      });
      return data;
    },

    onSuccess: () => {
      setCart([]); setDiscount(0); setNote('');
      setSelectedTable(''); setSelectedEmployee(''); setShowCart(false);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-active'] }); // refresca totales de caja
    },

    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Error al procesar la venta';
      alert(msg);
    },
  });

  const filtered = (products as any[]).filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(search);
  });

  const branchId = (branches as any[])[0]?.id;
  const branchName = (branches as any[])[0]?.name ?? 'Sucursal';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <CashRegisterGate
      branchId={branchId}
      branchName={branchName}
      accentColor={C}
      formatCurrency={formatCurrency}
    >
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--dax-bg)', fontFamily: 'var(--font-outfit, sans-serif)' }}>

        {/* ══ PANEL IZQUIERDO ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Topbar */}
          <div style={{ height: '52px', padding: '0 16px', borderBottom: '1px solid var(--dax-border)', background: 'var(--dax-surface)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', flexShrink: 0 }} title="Volver al dashboard">
              <ArrowLeft size={14} />
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--dax-border)', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${C}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={C} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1 }}>POS · {cfg.label}</p>
                <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', lineHeight: 1, marginTop: '2px' }}>{cfg.description}</p>
              </div>
            </div>

            {industry === 'restaurant' && (
              <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)} style={{ marginLeft: '8px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${selectedTable ? C : 'var(--dax-border)'}`, background: 'var(--dax-surface-2)', color: selectedTable ? C : 'var(--dax-text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                <option value="">🪑 Para llevar</option>
                {(tables as any[]).filter((t: any) => t.status === 'available').map((t: any) => <option key={t.id} value={t.id}>Mesa {t.number}{t.name ? ` · ${t.name}` : ''}</option>)}
              </select>
            )}

            {industry === 'salon' && (
              <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} style={{ marginLeft: '8px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${selectedEmployee ? C : 'var(--dax-border)'}`, background: 'var(--dax-surface-2)', color: selectedEmployee ? C : 'var(--dax-text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                <option value="">✂️ Sin estilista</option>
                {(employees as any[]).map((e: any) => <option key={e.id} value={e.id}>{e.firstName}</option>)}
              </select>
            )}

            {industry === 'restaurant' && (activeHappyHour as any[]).length > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: C, background: `${C}15`, padding: '3px 8px', borderRadius: '6px' }}>⚡ Happy Hour</span>
            )}

            <button onClick={() => setShowCart(true)} className="pos-cart-btn-mobile" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', background: C, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
              <ShoppingCart size={13} />
              {cartCount > 0 && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '6px', padding: '1px 6px', fontSize: '11px', fontWeight: 800 }}>{cartCount}</span>}
              {cartCount > 0 && <span style={{ fontSize: '12px', fontWeight: 800 }}>{formatCurrency(total)}</span>}
            </button>
          </div>

          {/* Búsqueda + Categorías */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--dax-border)', background: 'var(--dax-surface)', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
              <input ref={searchRef} className="dax-input" style={{ paddingLeft: '30px', margin: 0, height: '34px', fontSize: '12px' }} placeholder={industry === 'supermarket' || industry === 'pharmacy' ? 'Buscar o escanear código...' : 'Buscar producto...'} value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (industry === 'pharmacy' || industry === 'supermarket')) {
                    const found = (products as any[]).find((p: any) => p.barcode === search || p.sku === search);
                    if (found) { addToCart(found); setSearch(''); searchRef.current?.focus(); }
                  }
                }} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', flexShrink: 0, maxWidth: '55%' }}>
              <button onClick={() => setSelectedCategory('')} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: !selectedCategory ? C : 'var(--dax-surface-2)', color: !selectedCategory ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>Todo</button>
              {(categories as string[]).map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: selectedCategory === cat ? C : 'var(--dax-surface-2)', color: selectedCategory === cat ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Productos */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

            {industry === 'salon' && (services as any[]).length > 0 && !search && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: C, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Servicios</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {(services as any[]).map((s: any) => (
                    <button key={s.id} onClick={() => addToCart({ id: s.id, name: s.name, price: Number(s.price) }, { serviceId: s.id, employeeId: selectedEmployee })} style={{ padding: '10px', background: 'var(--dax-surface)', border: `1px solid ${s.color ?? C}30`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{s.name}</p>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>{s.duration}min</p>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: s.color ?? C }}>{formatCurrency(Number(s.price))}</p>
                    </button>
                  ))}
                </div>
                {(products as any[]).length > 0 && <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: '16px', marginBottom: '8px' }}>Productos</p>}
              </div>
            )}

            {industry === 'produce' && (produceProducts as any[]).length > 0 && !search && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: C, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Por peso</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                  {(produceProducts as any[]).map((pp: any) => (
                    <div key={pp.id} style={{ padding: '10px', background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: '10px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{pp.product?.name}</p>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: C, marginBottom: '6px' }}>{formatCurrency(Number(pp.pricePerUnit))}/{pp.weightUnit}</p>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" min="0.1" step="0.1" placeholder="0.0" value={weightInput[pp.id] ?? ''} onChange={e => setWeightInput(p => ({ ...p, [pp.id]: e.target.value }))} style={{ flex: 1, padding: '5px 7px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-primary)', fontSize: '11px', minWidth: 0 }} />
                        <button onClick={() => { const w = parseFloat(weightInput[pp.id] ?? '0'); if (w > 0) { addToCart({ id: pp.productId, name: pp.product?.name, price: Number(pp.pricePerUnit) }, { quantity: w, unit: pp.weightUnit, weight: w }); setWeightInput(p => ({ ...p, [pp.id]: '' })); } }} style={{ padding: '5px 8px', background: C, color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--dax-text-muted)' }}>
                <Package size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: .2 }} />
                <p style={{ fontSize: '13px' }}>{search ? `Sin resultados para "${search}"` : 'No hay productos'}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                {filtered.map((product: any) => {
                  const price = getPrice(product);
                  const hasOffer = price < Number(product.price);
                  const inCart = cart.find(i => i.productId === product.id);
                  const pvariants = (variants as any[]).filter((v: any) => v.productId === product.id);
                  return (
                    <button key={product.id} onClick={() => { if (industry === 'clothing' && pvariants.length > 0) { setShowVariantModal({ product, variants: pvariants }); return; } if (industry === 'restaurant') { setShowModifierModal(product); return; } addToCart(product); }} style={{ padding: '10px', background: inCart ? `${C}08` : 'var(--dax-surface)', border: `1.5px solid ${inCart ? C : 'var(--dax-border)'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all .12s', position: 'relative', boxShadow: inCart ? `0 0 0 1px ${C}30` : 'none' }}>
                      {product.imageUrl && <img src={product.imageUrl} alt="" style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '7px', marginBottom: '7px' }} />}
                      {inCart && <div style={{ position: 'absolute', top: '7px', right: '7px', background: C, color: '#fff', borderRadius: '6px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>{inCart.quantity}</div>}
                      {hasOffer && <div style={{ position: 'absolute', top: '7px', left: '7px', background: '#F97316', color: '#fff', borderRadius: '5px', padding: '1px 5px', fontSize: '8px', fontWeight: 800 }}>⚡</div>}
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '3px', lineHeight: 1.3 }}>{product.name}</p>
                      {product.sku && <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', marginBottom: '3px', fontFamily: 'monospace' }}>{product.sku}</p>}
                      {hasOffer && <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', textDecoration: 'line-through' }}>{formatCurrency(Number(product.price))}</p>}
                      <p style={{ fontSize: '13px', fontWeight: 800, color: hasOffer ? '#F97316' : C, lineHeight: 1 }}>{formatCurrency(price)}</p>
                      {industry === 'clothing' && pvariants.length > 0 && <p style={{ fontSize: '9px', color: C, marginTop: '3px', fontWeight: 600 }}>{pvariants.length} variantes</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ CARRITO DESKTOP ══ */}
        <div className="pos-cart-desktop" style={{ width: '300px', borderLeft: '1px solid var(--dax-border)', display: 'flex', flexDirection: 'column', background: 'var(--dax-surface)', flexShrink: 0 }}>
          <CartSide cart={cart} subtotal={subtotal} discountAmt={discountAmt} total={total} discount={discount} setDiscount={setDiscount} note={note} setNote={setNote} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} updateQty={updateQty} removeFromCart={removeFromCart} onSell={() => saleMutation.mutate()} isSelling={saleMutation.isPending} C={C} fmt={formatCurrency} industry={industry} selectedTable={selectedTable} />
        </div>

        {/* ══ CARRITO MÓVIL ══ */}
        {showCart && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowCart(false)}>
            <div style={{ width: '100%', maxHeight: '85vh', background: 'var(--dax-surface)', borderRadius: '16px 16px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700 }}>Orden actual</p>
                <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><X size={18} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <CartSide cart={cart} subtotal={subtotal} discountAmt={discountAmt} total={total} discount={discount} setDiscount={setDiscount} note={note} setNote={setNote} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} updateQty={updateQty} removeFromCart={removeFromCart} onSell={() => { saleMutation.mutate(); setShowCart(false); }} isSelling={saleMutation.isPending} C={C} fmt={formatCurrency} industry={industry} selectedTable={selectedTable} />
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL VARIANTES ══ */}
        {showVariantModal && <VariantModal data={showVariantModal} setData={setShowVariantModal} C={C} fmt={formatCurrency} addToCart={addToCart} />}

        {/* ══ MODAL MODIFICADORES ══ */}
        {showModifierModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--dax-surface)', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '420px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{showModifierModal.name}</p>
                  <p style={{ fontSize: '12px', color: C, fontWeight: 600 }}>{formatCurrency(getPrice(showModifierModal))}</p>
                </div>
                <button onClick={() => { setShowModifierModal(null); setSelectedModifiers([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><X size={18} /></button>
              </div>
              {(modifierGroups as any[]).length === 0
                ? <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '16px' }}>Sin modificadores</p>
                : (modifierGroups as any[]).map((group: any) => (
                  <div key={group.id} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{group.name}</p>
                      {group.required && <span style={{ fontSize: '9px', background: 'var(--dax-danger-bg)', color: 'var(--dax-danger)', padding: '2px 5px', borderRadius: '4px', fontWeight: 700 }}>Requerido</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {group.options?.map((opt: any) => {
                        const sel = selectedModifiers.find(m => m.optionId === opt.id);
                        return (
                          <button key={opt.id} onClick={() => { if (sel) { setSelectedModifiers(p => p.filter(m => m.optionId !== opt.id)); } else { if (!group.multiple) setSelectedModifiers(p => p.filter(m => !group.options.find((o: any) => o.id === m.optionId))); setSelectedModifiers(p => [...p, { optionId: opt.id, name: opt.name, extraPrice: Number(opt.extraPrice) }]); } }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: sel ? `${C}10` : 'var(--dax-surface-2)', border: `1px solid ${sel ? C : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}>
                            <span style={{ fontSize: '12px', fontWeight: sel ? 600 : 400, color: sel ? C : 'var(--dax-text-secondary)' }}>{opt.name}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: C }}>{Number(opt.extraPrice) > 0 ? `+${formatCurrency(Number(opt.extraPrice))}` : 'Gratis'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              }
              <button onClick={() => { addToCart(showModifierModal, { modifiers: selectedModifiers }); setShowModifierModal(null); setSelectedModifiers([]); }} style={{ width: '100%', padding: '12px', background: C, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', marginTop: '6px' }}>
                Agregar {selectedModifiers.length > 0 && `· +${formatCurrency(selectedModifiers.reduce((a, m) => a + m.extraPrice, 0))}`}
              </button>
            </div>
          </div>
        )}

        <style>{`
          @media(min-width: 769px) {
            .pos-cart-desktop    { display: flex !important; }
            .pos-cart-btn-mobile { display: none !important; }
          }
          @media(max-width: 768px) {
            .pos-cart-desktop    { display: none !important; }
            .pos-cart-btn-mobile { display: flex !important; }
          }
        `}</style>
      </div>
    </CashRegisterGate>
  );
}

// ══ CARRITO LATERAL ═══════════════════════════════════════════════════════════

function CartSide({ cart, subtotal, discountAmt, total, discount, setDiscount, note, setNote, paymentMethod, setPaymentMethod, updateQty, removeFromCart, onSell, isSelling, C, fmt, industry, selectedTable }: any) {
  const count = cart.reduce((a: number, i: any) => a + i.quantity, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--dax-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Orden actual</p>
          {count > 0 && <span style={{ fontSize: '10px', color: C, fontWeight: 600 }}>{count} item{count !== 1 ? 's' : ''}</span>}
        </div>
        {industry === 'restaurant' && selectedTable && <p style={{ fontSize: '10px', color: C, marginTop: '2px', fontWeight: 600 }}>🍽️ Mesa asignada</p>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {cart.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--dax-text-muted)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${C}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart size={20} color={C} style={{ opacity: .4 }} /></div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>Carrito vacío</p>
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>Selecciona productos del catálogo</p>
          </div>
        ) : cart.map((item: CartItem) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--dax-border-soft)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: `${C}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '11px', fontWeight: 800, color: C }}>{item.quantity}</span></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1.2, marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
              {(item.size || item.color) && <p style={{ fontSize: '10px', color: C }}>{item.size && `T.${item.size}`}{item.color && ` · ${item.color}`}</p>}
              {item.weight && <p style={{ fontSize: '10px', color: C }}>{item.weight}{item.unit}</p>}
              {(item.modifiers?.length ?? 0) > 0 && <p style={{ fontSize: '10px', color: C }}>{item.modifiers!.map((m: any) => m.name).join(', ')}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: C }}>{fmt(item.price * item.quantity)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button onClick={() => updateQty(item.id, -1)} style={{ width: '20px', height: '20px', borderRadius: '5px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-secondary)' }}><Minus size={9} /></button>
                <button onClick={() => updateQty(item.id, 1)} style={{ width: '20px', height: '20px', borderRadius: '5px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-secondary)' }}><Plus size={9} /></button>
                <button onClick={() => removeFromCart(item.id)} style={{ width: '20px', height: '20px', borderRadius: '5px', border: 'none', background: 'var(--dax-danger-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-danger)' }}><Trash2 size={9} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--dax-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Tag size={11} color="var(--dax-text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', flex: 1 }}>Descuento</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[0, 5, 10, 15, 20].map(p => (
                <button key={p} onClick={() => setDiscount(p)} style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, border: 'none', cursor: 'pointer', background: discount === p ? C : 'var(--dax-surface-2)', color: discount === p ? '#fff' : 'var(--dax-text-muted)' }}>{p === 0 ? '—' : `${p}%`}</button>
              ))}
            </div>
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota..." style={{ width: '100%', padding: '6px 9px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-primary)', fontSize: '11px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <div style={{ background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '8px 10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Subtotal</span>
              <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)' }}>{fmt(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--dax-success)' }}>Desc. {discount}%</span>
                <span style={{ fontSize: '11px', color: 'var(--dax-success)', fontWeight: 600 }}>-{fmt(discountAmt)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--dax-border)', marginTop: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: C }}>{fmt(total)}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '8px' }}>
            {PAYMENT_METHODS.map(m => (
              <button key={m.value} onClick={() => setPaymentMethod(m.value)} style={{ padding: '7px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, border: `1.5px solid ${paymentMethod === m.value ? C : 'var(--dax-border)'}`, background: paymentMethod === m.value ? `${C}10` : 'transparent', color: paymentMethod === m.value ? C : 'var(--dax-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <button onClick={onSell} disabled={isSelling} style={{ width: '100%', padding: '12px', background: isSelling ? 'var(--dax-surface-2)' : C, color: isSelling ? 'var(--dax-text-muted)' : '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: isSelling ? 'not-allowed' : 'pointer', boxShadow: isSelling ? 'none' : `0 3px 12px ${C}35`, transition: 'all .15s' }}>
            {isSelling ? '⏳ Procesando...' : industry === 'restaurant' && selectedTable ? `🍽️ Cocina · ${fmt(total)}` : `💳 Cobrar · ${fmt(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ══ MODAL VARIANTES ═══════════════════════════════════════════════════════════

function VariantModal({ data, setData, C, fmt, addToCart }: any) {
  const [selSize, setSelSize] = useState('');
  const [selColor, setSelColor] = useState('');
  const sizes = [...new Set<string>(data.variants.map((v: any) => v.size).filter(Boolean))];
  const match = data.variants.find((v: any) => (!selSize || v.size === selSize) && (!selColor || v.color === selColor));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--dax-surface)', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '420px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{data.product.name}</p>
            <p style={{ fontSize: '12px', color: C, fontWeight: 600 }}>{fmt(Number(data.product.price))}</p>
          </div>
          <button onClick={() => setData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sizes.length > 0 && (
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Talla</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {sizes.map(s => <button key={s} onClick={() => setSelSize(s === selSize ? '' : s)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: `2px solid ${selSize === s ? C : 'var(--dax-border)'}`, background: selSize === s ? `${C}12` : 'var(--dax-surface-2)', color: selSize === s ? C : 'var(--dax-text-secondary)', cursor: 'pointer' }}>{s}</button>)}
              </div>
            </div>
          )}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Color</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {data.variants.filter((v: any, i: number, a: any[]) => a.findIndex((x: any) => x.color === v.color) === i).map((v: any) => (
                <button key={v.color} onClick={() => setSelColor(v.color === selColor ? '' : v.color)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', border: `2px solid ${selColor === v.color ? C : 'var(--dax-border)'}`, background: selColor === v.color ? `${C}12` : 'var(--dax-surface-2)', cursor: 'pointer' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: v.colorHex ?? '#ccc', border: '1px solid var(--dax-border)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: selColor === v.color ? C : 'var(--dax-text-secondary)' }}>{v.color}</span>
                </button>
              ))}
            </div>
          </div>
          {match && (
            <div style={{ background: 'var(--dax-surface-2)', borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Stock: <strong style={{ color: match.stock > 0 ? 'var(--dax-success)' : 'var(--dax-danger)' }}>{match.stock}</strong></span>
              {match.price && <span style={{ fontSize: '12px', fontWeight: 700, color: C }}>{fmt(Number(match.price))}</span>}
            </div>
          )}
          <button onClick={() => { if (!match || match.stock === 0) return; addToCart(data.product, { variantId: match.id, size: selSize, color: selColor, price: match.price ? Number(match.price) : undefined }); setData(null); }} disabled={!match || match.stock === 0} style={{ width: '100%', padding: '11px', background: !match || match.stock === 0 ? 'var(--dax-surface-2)' : C, color: !match || match.stock === 0 ? 'var(--dax-text-muted)' : '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: !match || match.stock === 0 ? 'not-allowed' : 'pointer' }}>
            {!match ? 'Selecciona opciones' : match.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}
