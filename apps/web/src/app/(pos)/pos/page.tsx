'use client';
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { CashRegisterGate } from '@/components/pos/CashRegisterGate';
import { useHeldOrders } from '@/hooks/useHeldOrders';
import type { HeldOrder } from '@/hooks/useHeldOrders';
import {
  Search, X, Plus, Minus, ShoppingCart,
  ChefHat, Scissors, Shirt, Leaf, Pill,
  Package, Barcode, Tag, Trash2, AlertCircle,
  PauseCircle, PlayCircle, Clock, ArrowLeft,
  Users, UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/imageUrl';
import { useReceiptPrinter } from '@/hooks/useReceiptPrinter';
import { usePrintConfig } from '@/hooks/usePrintConfig';
import type { ReceiptData } from '@/hooks/useReceiptPrinter';
import { useCashDrawer } from '@/hooks/useCashDrawer';

interface CartItem {
  id: string; productId: string; variantId?: string;
  name: string; price: number; quantity: number;
  unit?: string; weight?: number; notes?: string;
  modifiers?: { optionId: string; name: string; extraPrice: number }[];
  size?: string; color?: string; serviceId?: string; employeeId?: string;
}
interface MixedPayments { cash: string; card: string; transfer: string; }

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
const MIXED_METHODS = [
  { key: 'cash', label: 'Efectivo', icon: '💵' },
  { key: 'card', label: 'Tarjeta', icon: '💳' },
  { key: 'transfer', label: 'SINPE', icon: '📱' },
];

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function POSPage() {
  const router = useRouter();
  const { formatCurrency, industry } = useAuth();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const { print } = useReceiptPrinter();
  const { config: printConfig } = usePrintConfig();
  const { orders: heldOrders, holdOrder, removeOrder } = useHeldOrders();
  const { openDrawer } = useCashDrawer();

  const cfg = INDUSTRY_CONFIG[industry] ?? INDUSTRY_CONFIG.general;
  const Icon = cfg.icon;
  const C = cfg.color;

  // ── Estado del carrito ────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mixedPayments, setMixedPayments] = useState<MixedPayments>({ cash: '', card: '', transfer: '' });
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
  const [search, setSearch] = useState('');

  // ── Órdenes en espera ─────────────────────────────────────────────────────
  const [showHeld, setShowHeld] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');
  const [showHoldInput, setShowHoldInput] = useState(false);

  // ── Cliente seleccionado ──────────────────────────────────────────────────
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDrop, setShowClientDrop] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
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

  const { data: clientResults = [] } = useQuery({
    queryKey: ['pos-client-search', clientSearch],
    queryFn: async () => {
      if (clientSearch.length < 2) return [];
      const { data } = await api.get(`/clients?search=${encodeURIComponent(clientSearch)}&limit=5`);
      return data.data ?? [];
    },
    enabled: clientSearch.length >= 2,
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
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
      return [...prev, { id: itemId, productId: product.id, name: product.name, price: finalPrice, quantity: qty, unit: options?.unit ?? 'unidad', ...options }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQty = (id: string, delta: number) =>
    setCart(prev =>
      prev.map(i => i.id !== id ? i : i.quantity + delta <= 0 ? null : { ...i, quantity: i.quantity + delta })
        .filter(Boolean) as CartItem[],
    );

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setNote('');
    setSelectedTable('');
    setSelectedEmployee('');
    setMixedPayments({ cash: '', card: '', transfer: '' });
    setPaymentMethod('cash');
    setSelectedClient(null);
    setClientSearch('');
    setShowClientDrop(false);
  }, []);

  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const discountAmt = discount > 0 ? subtotal * discount / 100 : 0;
  const total = subtotal - discountAmt;
  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);

  const mixedTotal = paymentMethod === 'mixed'
    ? (parseFloat(mixedPayments.cash || '0') + parseFloat(mixedPayments.card || '0') + parseFloat(mixedPayments.transfer || '0'))
    : 0;
  const mixedDiff = paymentMethod === 'mixed' ? mixedTotal - total : 0;
  const mixedIsValid = paymentMethod === 'mixed' ? Math.abs(mixedDiff) < 1 : true;

  // ── Pausar orden ──────────────────────────────────────────────────────────
  const handleHoldOrder = useCallback(() => {
    if (cart.length === 0) return;
    const label = holdLabel.trim() || `Orden #${heldOrders.length + 1}`;
    holdOrder({ label, cart, discount, note, paymentMethod, mixedPayments, selectedTable, selectedEmployee });
    clearCart();
    setShowHoldInput(false);
    setHoldLabel('');
  }, [cart, discount, note, paymentMethod, mixedPayments, selectedTable, selectedEmployee, holdLabel, heldOrders.length, holdOrder, clearCart]);

  // ── Retomar orden ─────────────────────────────────────────────────────────
  const handleResumeOrder = useCallback((order: HeldOrder) => {
    if (cart.length > 0) {
      holdOrder({
        label: `Orden #${heldOrders.length + 1}`,
        cart, discount, note, paymentMethod, mixedPayments, selectedTable, selectedEmployee,
      });
    }
    setCart(order.cart);
    setDiscount(order.discount);
    setNote(order.note);
    setPaymentMethod(order.paymentMethod);
    setMixedPayments(order.mixedPayments);
    setSelectedTable(order.selectedTable);
    setSelectedEmployee(order.selectedEmployee);
    removeOrder(order.id);
    setShowHeld(false);
  }, [cart, discount, note, paymentMethod, mixedPayments, selectedTable, selectedEmployee, heldOrders.length, holdOrder, removeOrder]);

  // ── Mutación de venta ─────────────────────────────────────────────────────
  const saleMutation = useMutation({
    mutationFn: async () => {
      const branchId = (branches as any[])[0]?.id;
      if (!branchId) throw new Error('No hay sucursal disponible.');
      if (cart.length === 0) throw new Error('El carrito está vacío.');
      if (paymentMethod === 'mixed') {
        if (mixedTotal <= 0) throw new Error('Ingresa los montos para el pago mixto.');
        if (!mixedIsValid) throw new Error(`Los montos no suman el total. Diferencia: ${formatCurrency(Math.abs(mixedDiff))}`);
      }

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
          clientName: selectedClient
            ? `${selectedClient.firstName} ${selectedClient.lastName ?? ''}`.trim()
            : 'Cliente walk-in',
          employeeId: selectedEmployee || undefined,
          serviceId: cart[0].serviceId,
          startTime: new Date().toISOString(),
          branchId,
        });
      }

      const { data } = await api.post('/sales', {
        branchId,
        paymentMethod,
        discount: discountAmt,
        subtotal,
        total,
        notes: note || undefined,
        clientId: selectedClient?.id || undefined,
        ...(paymentMethod === 'mixed' && {
          mixedPayments: {
            cash: parseFloat(mixedPayments.cash || '0'),
            card: parseFloat(mixedPayments.card || '0'),
            transfer: parseFloat(mixedPayments.transfer || '0'),
          },
        }),
        items: cart.map(item => ({
          productId: item.productId, quantity: item.quantity,
          unitPrice: item.price, subtotal: item.price * item.quantity,
          discount: 0, notes: item.notes,
          variantId: item.variantId,
        })),
      });
      return data;
    },

    onSuccess: (saleData: any) => {
      if (printConfig.autoPrint && saleData?.id) {
        const receiptData: ReceiptData = {
          businessName: (branches as any[])[0]?.tenant?.name ?? 'Mi Negocio',
          branchName: (branches as any[])[0]?.name,
          saleId: saleData.id,
          cashierName: `${saleData.user?.firstName ?? ''} ${saleData.user?.lastName ?? ''}`.trim(),
          createdAt: saleData.createdAt ?? new Date().toISOString(),
          items: (saleData.items ?? []).map((i: any) => ({
            name: i.product?.name ?? 'Producto', quantity: i.quantity,
            unitPrice: Number(i.unitPrice), subtotal: Number(i.subtotal), discount: Number(i.discount ?? 0),
          })),
          subtotal: Number(saleData.subtotal), discount: Number(saleData.discount ?? 0),
          tax: Number(saleData.tax ?? 0), total: Number(saleData.total),
          paymentMethod: saleData.paymentMethod,
          mixedPayments: saleData.mixedPayments ?? null,
          notes: saleData.notes ?? undefined,
          header: printConfig.header, footer: printConfig.footer,
        };
        print(receiptData, printConfig);
      }
      clearCart();
      openDrawer();
      setShowCart(false);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-active'] });
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

  return (
    <CashRegisterGate branchId={branchId} branchName={branchName} accentColor={C} formatCurrency={formatCurrency}>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--dax-bg)', fontFamily: 'var(--font-outfit, sans-serif)' }}>

        {/* ══ PANEL IZQUIERDO ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Topbar */}
          <div style={{ height: '52px', padding: '0 16px', borderBottom: '1px solid var(--dax-border)', background: 'var(--dax-surface)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', flexShrink: 0 }}>
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

            {/* Botón órdenes en espera */}
            <button
              onClick={() => setShowHeld(true)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '9px', border: `1px solid ${heldOrders.length > 0 ? 'rgba(240,160,48,.4)' : 'var(--dax-border)'}`, background: heldOrders.length > 0 ? 'rgba(240,160,48,.1)' : 'var(--dax-surface-2)', color: heldOrders.length > 0 ? '#F0A030' : 'var(--dax-text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              <Clock size={13} />
              En espera
              {heldOrders.length > 0 && (
                <span style={{ background: '#F0A030', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>{heldOrders.length}</span>
              )}
            </button>

            <button onClick={() => setShowCart(true)} className="pos-cart-btn-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', background: C, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
              <ShoppingCart size={13} />
              {cartCount > 0 && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '6px', padding: '1px 6px', fontSize: '11px', fontWeight: 800 }}>{cartCount}</span>}
              {cartCount > 0 && <span style={{ fontSize: '12px', fontWeight: 800 }}>{formatCurrency(total)}</span>}
            </button>
          </div>

          {/* Búsqueda + Categorías */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--dax-border)', background: 'var(--dax-surface)', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
              <input ref={searchRef} className="dax-input" style={{ paddingLeft: '30px', margin: 0, height: '34px', fontSize: '12px' }}
                placeholder={industry === 'supermarket' || industry === 'pharmacy' ? 'Buscar o escanear código...' : 'Buscar producto...'}
                value={search} onChange={e => setSearch(e.target.value)}
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
                      {getImageUrl(product.imageUrl) && <img src={getImageUrl(product.imageUrl)!} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '7px', marginBottom: '7px' }} />}
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
          <CartSide
            cart={cart} subtotal={subtotal} discountAmt={discountAmt} total={total}
            discount={discount} setDiscount={setDiscount} note={note} setNote={setNote}
            paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
            mixedPayments={mixedPayments} setMixedPayments={setMixedPayments}
            mixedTotal={mixedTotal} mixedDiff={mixedDiff} mixedIsValid={mixedIsValid}
            updateQty={updateQty} removeFromCart={removeFromCart}
            onSell={() => saleMutation.mutate()} isSelling={saleMutation.isPending}
            C={C} fmt={formatCurrency} industry={industry} selectedTable={selectedTable}
            onHold={() => cart.length > 0 && setShowHoldInput(true)}
            heldCount={heldOrders.length}
            selectedClient={selectedClient} setSelectedClient={setSelectedClient}
            clientSearch={clientSearch} setClientSearch={setClientSearch}
            showClientDrop={showClientDrop} setShowClientDrop={setShowClientDrop}
            clientResults={clientResults}
          />
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
                <CartSide
                  cart={cart} subtotal={subtotal} discountAmt={discountAmt} total={total}
                  discount={discount} setDiscount={setDiscount} note={note} setNote={setNote}
                  paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                  mixedPayments={mixedPayments} setMixedPayments={setMixedPayments}
                  mixedTotal={mixedTotal} mixedDiff={mixedDiff} mixedIsValid={mixedIsValid}
                  updateQty={updateQty} removeFromCart={removeFromCart}
                  onSell={() => { saleMutation.mutate(); setShowCart(false); }} isSelling={saleMutation.isPending}
                  C={C} fmt={formatCurrency} industry={industry} selectedTable={selectedTable}
                  onHold={() => { cart.length > 0 && setShowHoldInput(true); setShowCart(false); }}
                  heldCount={heldOrders.length}
                  selectedClient={selectedClient} setSelectedClient={setSelectedClient}
                  clientSearch={clientSearch} setClientSearch={setClientSearch}
                  showClientDrop={showClientDrop} setShowClientDrop={setShowClientDrop}
                  clientResults={clientResults}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: ÓRDENES EN ESPERA ══ */}
        {showHeld && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--dax-surface)', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(240,160,48,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={15} color="#F0A030" />
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>Órdenes en espera</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{heldOrders.length} orden{heldOrders.length !== 1 ? 'es' : ''} pausada{heldOrders.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button onClick={() => setShowHeld(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><X size={18} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                {heldOrders.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px' }}>
                    <PauseCircle size={36} color="var(--dax-text-muted)" style={{ opacity: .2 }} />
                    <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', textAlign: 'center' }}>
                      No hay órdenes en espera. Usa el botón "Pausar" para guardar una orden activa.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {heldOrders.map(order => (
                      <div key={order.id} style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--dax-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{order.label}</p>
                            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                              {order.cart.length} ítem{order.cart.length !== 1 ? 's' : ''} · Pausada hace {timeAgo(order.createdAt)}
                            </p>
                          </div>
                          <p style={{ fontSize: '15px', fontWeight: 800, color: C }}>
                            {formatCurrency(order.cart.reduce((s, i) => s + i.price * i.quantity, 0) * (1 - order.discount / 100))}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                          {order.cart.slice(0, 3).map((item, i) => (
                            <p key={i} style={{ fontSize: '11px', color: 'var(--dax-text-secondary)' }}>× {item.quantity} {item.name}</p>
                          ))}
                          {order.cart.length > 3 && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>+{order.cart.length - 3} más...</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleResumeOrder(order)} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: C, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', boxShadow: `0 2px 8px ${C}30` }}>
                            <PlayCircle size={13} /> Retomar
                          </button>
                          <button onClick={() => removeOrder(order.id)} style={{ padding: '9px 12px', borderRadius: '9px', border: '1px solid rgba(224,80,80,.3)', background: 'rgba(224,80,80,.06)', color: 'var(--dax-danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={12} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: NOMBRE DE LA PAUSA ══ */}
        {showHoldInput && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--dax-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(240,160,48,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PauseCircle size={18} color="#F0A030" />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>Pausar orden</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{cart.length} ítems · {formatCurrency(total)}</p>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Nombre o referencia (opcional)</p>
              <input className="dax-input" placeholder={`Mesa 3, Cliente Juan, Orden #${heldOrders.length + 1}...`} value={holdLabel} onChange={e => setHoldLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleHoldOrder()} autoFocus style={{ margin: '0 0 16px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowHoldInput(false); setHoldLabel(''); }} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleHoldOrder} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#F0A030', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 10px rgba(240,160,48,.3)' }}>
                  <PauseCircle size={14} /> Pausar
                </button>
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

// ══ CARRITO LATERAL ══════════════════════════════════════════════════════════
function CartSide({
  cart, subtotal, discountAmt, total,
  discount, setDiscount, note, setNote,
  paymentMethod, setPaymentMethod,
  mixedPayments, setMixedPayments,
  mixedTotal, mixedDiff, mixedIsValid,
  updateQty, removeFromCart,
  onSell, isSelling,
  C, fmt, industry, selectedTable,
  onHold, heldCount,
  selectedClient, setSelectedClient,
  clientSearch, setClientSearch,
  showClientDrop, setShowClientDrop,
  clientResults,
}: any) {
  const count = cart.reduce((a: number, i: any) => a + i.quantity, 0);
  const canSell = paymentMethod !== 'mixed' || (mixedIsValid && mixedTotal > 0);

  const handleSetPaymentMethod = (val: string) => {
    setPaymentMethod(val);
    if (val !== 'mixed') setMixedPayments({ cash: '', card: '', transfer: '' });
  };

  const remaining = total - mixedTotal;

  const clientName = selectedClient
    ? (selectedClient.isCompany
      ? selectedClient.companyName
      : `${selectedClient.firstName} ${selectedClient.lastName ?? ''}`.trim())
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--dax-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Orden actual</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {count > 0 && <span style={{ fontSize: '10px', color: C, fontWeight: 600 }}>{count} ítem{count !== 1 ? 's' : ''}</span>}
            {cart.length > 0 && (
              <button onClick={onHold} title="Pausar orden" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '7px', border: '1px solid rgba(240,160,48,.35)', background: 'rgba(240,160,48,.08)', color: '#F0A030', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                <PauseCircle size={11} /> Pausar
              </button>
            )}
          </div>
        </div>
        {industry === 'restaurant' && selectedTable && <p style={{ fontSize: '10px', color: C, marginTop: '2px', fontWeight: 600 }}>🍽️ Mesa asignada</p>}
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {cart.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--dax-text-muted)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${C}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart size={20} color={C} style={{ opacity: .4 }} /></div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>Carrito vacío</p>
            {heldCount > 0 && <p style={{ fontSize: '11px', color: '#F0A030', fontWeight: 600, textAlign: 'center' }}>📋 {heldCount} orden{heldCount !== 1 ? 'es' : ''} en espera</p>}
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

      {/* Checkout */}
      {cart.length > 0 && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--dax-border)', flexShrink: 0 }}>

          {/* ── Selector de cliente ── */}
          <div style={{ marginBottom: '8px', position: 'relative' }}>
            {selectedClient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: `${C}10`, border: `1px solid ${C}30`, borderRadius: '8px' }}>
                <UserCheck size={12} color={C} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: C, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName}</p>
                  {selectedClient.phone && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{selectedClient.phone}</p>}
                </div>
                <button
                  onClick={() => { setSelectedClient(null); setClientSearch(''); setShowClientDrop(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '2px', flexShrink: 0 }}
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative' }}>
                  <Users size={11} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
                  <input
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setShowClientDrop(true); }}
                    onFocus={() => clientSearch.length >= 2 && setShowClientDrop(true)}
                    placeholder="Buscar cliente... (opcional)"
                    style={{ width: '100%', padding: '6px 9px 6px 26px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-primary)', fontSize: '11px', boxSizing: 'border-box' as const, outline: 'none' }}
                  />
                </div>
                {showClientDrop && (clientResults as any[]).length > 0 && (
                  <div style={{ position: 'absolute', left: '12px', right: '12px', background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: '8px', zIndex: 50, boxShadow: 'var(--dax-shadow-md)', maxHeight: '150px', overflowY: 'auto' }}>
                    {(clientResults as any[]).map((c: any) => {
                      const name = c.isCompany ? c.companyName : `${c.firstName} ${c.lastName ?? ''}`.trim();
                      return (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientDrop(false); }}
                          style={{ width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' as const, borderBottom: '1px solid var(--dax-border-soft)', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${C}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: C }}>{name[0]?.toUpperCase()}</span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{c.phone ?? c.email ?? ''}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Descuento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Tag size={11} color="var(--dax-text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', flex: 1 }}>Descuento</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[0, 5, 10, 15, 20].map(p => (
                <button key={p} onClick={() => setDiscount(p)} style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, border: 'none', cursor: 'pointer', background: discount === p ? C : 'var(--dax-surface-2)', color: discount === p ? '#fff' : 'var(--dax-text-muted)' }}>
                  {p === 0 ? '—' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota..." style={{ width: '100%', padding: '6px 9px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-primary)', fontSize: '11px', marginBottom: '8px', boxSizing: 'border-box' as const }} />

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
              <button key={m.value} onClick={() => handleSetPaymentMethod(m.value)} style={{ padding: '7px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, border: `1.5px solid ${paymentMethod === m.value ? C : 'var(--dax-border)'}`, background: paymentMethod === m.value ? `${C}10` : 'transparent', color: paymentMethod === m.value ? C : 'var(--dax-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {paymentMethod === 'mixed' && (
            <div style={{ background: `${C}08`, border: `1px solid ${C}25`, borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: C, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>🔀 Desglose del pago</p>
              {MIXED_METHODS.map(({ key, label, icon }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)', width: '58px', flexShrink: 0 }}>{label}</span>
                  <input
                    type="number" min="0" step="100"
                    placeholder="0"
                    value={mixedPayments[key as keyof MixedPayments]}
                    onChange={e => setMixedPayments((p: MixedPayments) => ({ ...p, [key]: e.target.value }))}
                    style={{ flex: 1, padding: '5px 8px', borderRadius: '7px', border: `1px solid var(--dax-border)`, background: 'var(--dax-surface-2)', color: 'var(--dax-text-primary)', fontSize: '11px', textAlign: 'right' as const }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${C}20` }}>
                <span style={{ fontSize: '11px', color: Math.abs(mixedDiff) < 1 ? 'var(--dax-success)' : 'var(--dax-danger)', fontWeight: 700 }}>
                  {Math.abs(mixedDiff) < 1 ? '✓ Cuadrado' : mixedDiff > 0 ? `Sobra ${fmt(mixedDiff)}` : `Faltan ${fmt(Math.abs(mixedDiff))}`}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Total: {fmt(mixedTotal)}</span>
              </div>
            </div>
          )}

          <button
            onClick={onSell}
            disabled={isSelling || !canSell || cart.length === 0}
            style={{ width: '100%', padding: '13px', background: canSell ? C : 'var(--dax-surface-3)', color: canSell ? '#fff' : 'var(--dax-text-muted)', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: canSell ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: canSell ? `0 4px 14px ${C}40` : 'none', transition: 'all .15s' }}
          >
            {isSelling ? '⏳ Procesando...' : `💳 Cobrar ${fmt(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ══ MODAL VARIANTES ══════════════════════════════════════════════════════════
function VariantModal({ data, setData, C, fmt, addToCart }: any) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const product = data.product;
  const variants = data.variants ?? [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--dax-surface)', borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{product.name}</p>
            <p style={{ fontSize: '12px', color: C, fontWeight: 600 }}>Selecciona una variante</p>
          </div>
          <button onClick={() => setData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {variants.map((v: any) => {
            const sel = selectedVariant?.id === v.id;
            return (
              <button key={v.id} onClick={() => setSelectedVariant(v)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: sel ? `${C}10` : 'var(--dax-surface-2)', border: `1.5px solid ${sel ? C : 'transparent'}`, borderRadius: '9px', cursor: 'pointer', textAlign: 'left' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: sel ? C : 'var(--dax-text-primary)' }}>
                    {v.size && `T.${v.size}`}{v.color && ` · ${v.color}`}
                  </p>
                  {v.sku && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', fontFamily: 'monospace' }}>{v.sku}</p>}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 800, color: C }}>{fmt(Number(v.price ?? product.price))}</p>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            if (!selectedVariant) return;
            addToCart(product, { price: Number(selectedVariant.price ?? product.price), variantId: selectedVariant.id, size: selectedVariant.size, color: selectedVariant.color });
            setData(null);
          }}
          disabled={!selectedVariant}
          style={{ width: '100%', padding: '12px', background: selectedVariant ? C : 'var(--dax-surface-3)', color: selectedVariant ? '#fff' : 'var(--dax-text-muted)', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: selectedVariant ? 'pointer' : 'not-allowed', marginTop: '14px' }}
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

