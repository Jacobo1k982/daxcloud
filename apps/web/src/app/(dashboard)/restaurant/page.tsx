'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Plus, X, Clock, ChefHat, CheckCircle,
  TrendingUp, Utensils, BarChart2, Bell,
  AlertCircle, Truck, Calendar, Settings,
  Tag, DollarSign, Zap,
} from 'lucide-react';

type Tab = 'tables' | 'orders' | 'kitchen' | 'reservations' | 'combos' | 'modifiers' | 'delivery' | 'register' | 'happyhour' | 'stats';

const TABLE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: 'var(--dax-success)', bg: 'var(--dax-success-bg)' },
  occupied:  { label: 'Ocupada',    color: 'var(--dax-amber)',            bg: 'rgba(249,115,22,.12)' },
  reserved:  { label: 'Reservada',  color: 'var(--dax-amber)',            bg: 'rgba(240,160,48,.12)' },
  cleaning:  { label: 'Limpieza',   color: 'var(--dax-blue)',            bg: 'rgba(90,170,240,.12)' },
};

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Abierta',   color: 'var(--dax-blue)',            bg: 'rgba(90,170,240,.12)' },
  in_progress: { label: 'En cocina', color: 'var(--dax-amber)',            bg: 'rgba(240,160,48,.12)' },
  ready:       { label: 'Lista',     color: 'var(--dax-success)', bg: 'var(--dax-success-bg)' },
  completed:   { label: 'Cerrada',   color: 'var(--dax-text-muted)', bg: 'var(--dax-surface-2)' },
  cancelled:   { label: 'Cancelada', color: 'var(--dax-danger)',  bg: 'var(--dax-danger-bg)' },
};

const RESERVATION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',  color: 'var(--dax-amber)',            bg: 'rgba(240,160,48,.12)' },
  confirmed: { label: 'Confirmada', color: 'var(--dax-success)', bg: 'var(--dax-success-bg)' },
  seated:    { label: 'Sentada',    color: 'var(--dax-amber)',            bg: 'rgba(249,115,22,.12)' },
  completed: { label: 'Completada', color: 'var(--dax-text-muted)', bg: 'var(--dax-surface-2)' },
  cancelled: { label: 'Cancelada',  color: 'var(--dax-danger)',  bg: 'var(--dax-danger-bg)' },
  no_show:   { label: 'No asistió', color: 'var(--dax-danger)',  bg: 'var(--dax-danger-bg)' },
};

const DELIVERY_STATUS: Record<string, { label: string; color: string }> = {
  pending:           { label: 'Pendiente',      color: 'var(--dax-amber)' },
  preparing:         { label: 'Preparando',     color: 'var(--dax-blue)' },
  out_for_delivery:  { label: 'En camino',      color: 'var(--dax-amber)' },
  delivered:         { label: 'Entregado',      color: 'var(--dax-success)' },
  cancelled:         { label: 'Cancelado',      color: 'var(--dax-danger)' },
};

const PAYMENT_METHODS = [
  { value: 'cash',     label: '💵 Efectivo' },
  { value: 'card',     label: '💳 Tarjeta' },
  { value: 'transfer', label: '🏦 Transferencia' },
  { value: 'mixed',    label: '🔀 Mixto' },
];

const DAYS = [
  { value: '0', label: 'Dom' }, { value: '1', label: 'Lun' }, { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' }, { value: '4', label: 'Jue' }, { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
];

const ORANGE = '#F97316';

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const elapsed = (date: string) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function RestaurantPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('tables');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modales
  const [showTableModal, setShowTableModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState<any>(null);
  const [showAddItemModal, setShowAddItemModal] = useState<any>(null);
  const [showCloseModal, setShowCloseModal] = useState<any>(null);
  const [showSplitModal, setShowSplitModal] = useState<any>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showComboModal, setShowComboModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showStationModal, setShowStationModal] = useState(false);
  const [showHappyHourModal, setShowHappyHourModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState<'open' | 'close' | null>(null);

  // Forms
  const [tableForm, setTableForm] = useState({ number: 1, name: '', capacity: 4, section: 'Salón principal' });
  const [orderForm, setOrderForm] = useState({ tableId: '', notes: '', isDelivery: false, deliveryAddress: '', deliveryPhone: '', deliveryFee: 0, items: [] as any[] });
  const [addItemForm, setAddItemForm] = useState({ items: [] as any[] });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tipAmount, setTipAmount] = useState(0);
  const [splitPayments, setSplitPayments] = useState([{ amount: 0, tip: 0, paymentMethod: 'cash', guestName: '' }]);
  const [reservationForm, setReservationForm] = useState({ clientName: '', clientPhone: '', clientEmail: '', tableId: '', partySize: 2, date: '', duration: 90, notes: '', source: 'direct' });
  const [comboForm, setComboForm] = useState({ name: '', description: '', price: 0, availableFrom: '', availableTo: '', daysOfWeek: [] as string[], items: [] as any[] });
  const [modifierForm, setModifierForm] = useState({ name: '', description: '', required: false, multiple: false, minSelect: 0, maxSelect: 1, options: [] as any[] });
  const [stationForm, setStationForm] = useState({ name: '', description: '', color: 'var(--dax-amber)' });
  const [happyHourForm, setHappyHourForm] = useState({ name: '', discount: 0, discountType: 'percentage', startTime: '', endTime: '', daysOfWeek: [] as string[] });
  const [registerForm, setRegisterForm] = useState({ amount: 0, notes: '' });

  // Queries
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['restaurant-stats'],
    queryFn: async () => { const { data } = await api.get('/restaurant/stats'); return data; },
    refetchInterval: 30000,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['restaurant-tables'],
    queryFn: async () => { const { data } = await api.get('/restaurant/tables'); return data; },
    refetchInterval: 15000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['restaurant-orders', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const { data } = await api.get(`/restaurant/orders${params}`);
      return data;
    },
    refetchInterval: 15000,
    enabled: tab === 'orders',
  });

  const { data: kitchenOrders = [] } = useQuery({
    queryKey: ['restaurant-kitchen'],
    queryFn: async () => { const { data } = await api.get('/restaurant/orders/kitchen'); return data; },
    refetchInterval: 10000,
    enabled: tab === 'kitchen',
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['restaurant-reservations', selectedDate],
    queryFn: async () => { const { data } = await api.get(`/restaurant/reservations?date=${selectedDate}`); return data; },
    enabled: tab === 'reservations',
  });

  const { data: upcomingReservations = [] } = useQuery({
    queryKey: ['restaurant-reservations-upcoming'],
    queryFn: async () => { const { data } = await api.get('/restaurant/reservations/upcoming'); return data; },
    enabled: tab === 'tables' || tab === 'stats',
  });

  const { data: combos = [] } = useQuery({
    queryKey: ['restaurant-combos'],
    queryFn: async () => { const { data } = await api.get('/restaurant/combos'); return data; },
    enabled: tab === 'combos',
  });

  const { data: modifiers = [] } = useQuery({
    queryKey: ['restaurant-modifiers'],
    queryFn: async () => { const { data } = await api.get('/restaurant/modifiers'); return data; },
    enabled: tab === 'modifiers',
  });

  const { data: deliveryOrders = [] } = useQuery({
    queryKey: ['restaurant-delivery', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const { data } = await api.get(`/restaurant/delivery${params}`);
      return data;
    },
    enabled: tab === 'delivery',
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['restaurant-shifts'],
    queryFn: async () => { const { data } = await api.get('/restaurant/register/shifts'); return data; },
    enabled: tab === 'register',
  });

  const { data: happyHours = [] } = useQuery({
    queryKey: ['restaurant-happyhour'],
    queryFn: async () => { const { data } = await api.get('/restaurant/happy-hour'); return data; },
    enabled: tab === 'happyhour',
  });

  const { data: activeHappyHour = [] } = useQuery({
    queryKey: ['restaurant-happyhour-active'],
    queryFn: async () => { const { data } = await api.get('/restaurant/happy-hour/active'); return data; },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await api.get('/products'); return data; },
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['restaurant-stations'],
    queryFn: async () => { const { data } = await api.get('/restaurant/stations'); return data; },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-kitchen'] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-stats'] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-delivery'] });
  };

  // Mutations
  const tableMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/tables', tableForm),
    onSuccess: () => { invalidate(); setShowTableModal(false); setTableForm({ number: 1, name: '', capacity: 4, section: 'Salón principal' }); },
  });

  const tableStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.put(`/restaurant/tables/${id}/status`, { status }),
    onSuccess: () => invalidate(),
  });

  const orderMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/orders', {
      ...orderForm,
      tableId: orderForm.tableId || undefined,
      items: orderForm.items.filter(i => i.productId),
    }),
    onSuccess: () => { invalidate(); setShowOrderModal(null); setOrderForm({ tableId: '', notes: '', isDelivery: false, deliveryAddress: '', deliveryPhone: '', deliveryFee: 0, items: [] }); },
  });

  const addItemMutation = useMutation({
    mutationFn: async () => api.post(`/restaurant/orders/${showAddItemModal.id}/items`, {
      items: addItemForm.items.filter(i => i.productId),
    }),
    onSuccess: () => { invalidate(); setShowAddItemModal(null); setAddItemForm({ items: [] }); },
  });

  const orderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.put(`/restaurant/orders/${id}/status`, { status }),
    onSuccess: () => invalidate(),
  });

  const itemStatusMutation = useMutation({
    mutationFn: async ({ orderId, itemId, status }: any) => api.put(`/restaurant/orders/${orderId}/items/${itemId}/status`, { status }),
    onSuccess: () => invalidate(),
  });

  const closeMutation = useMutation({
    mutationFn: async () => api.post(`/restaurant/orders/${showCloseModal.id}/close`, { paymentMethod, tip: tipAmount }),
    onSuccess: () => { invalidate(); setShowCloseModal(null); setTipAmount(0); },
  });

  const splitMutation = useMutation({
    mutationFn: async () => api.post(`/restaurant/orders/${showSplitModal.id}/split-payment`, { payments: splitPayments }),
    onSuccess: () => { invalidate(); setShowSplitModal(null); },
  });

  const reservationMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/reservations', { ...reservationForm, tableId: reservationForm.tableId || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-reservations'] }); queryClient.invalidateQueries({ queryKey: ['restaurant-reservations-upcoming'] }); setShowReservationModal(false); setReservationForm({ clientName: '', clientPhone: '', clientEmail: '', tableId: '', partySize: 2, date: '', duration: 90, notes: '', source: 'direct' }); },
  });

  const reservationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => api.put(`/restaurant/reservations/${id}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-reservations'] }); queryClient.invalidateQueries({ queryKey: ['restaurant-reservations-upcoming'] }); invalidate(); },
  });

  const comboMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/combos', { ...comboForm, daysOfWeek: comboForm.daysOfWeek.join(','), items: comboForm.items.filter(i => i.productId) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-combos'] }); setShowComboModal(false); setComboForm({ name: '', description: '', price: 0, availableFrom: '', availableTo: '', daysOfWeek: [], items: [] }); },
  });

  const deleteComboMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/restaurant/combos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-combos'] }),
  });

  const modifierMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/modifiers', modifierForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-modifiers'] }); setShowModifierModal(false); setModifierForm({ name: '', description: '', required: false, multiple: false, minSelect: 0, maxSelect: 1, options: [] }); },
  });

  const deleteModifierMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/restaurant/modifiers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-modifiers'] }),
  });

  const stationMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/stations', stationForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-stations'] }); setShowStationModal(false); },
  });

  const happyHourMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/happy-hour', { ...happyHourForm, daysOfWeek: happyHourForm.daysOfWeek.join(',') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-happyhour'] }); setShowHappyHourModal(false); setHappyHourForm({ name: '', discount: 0, discountType: 'percentage', startTime: '', endTime: '', daysOfWeek: [] }); },
  });

  const deliveryStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => api.put(`/restaurant/delivery/${id}/status`, { status }),
    onSuccess: () => invalidate(),
  });

  const openRegisterMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/register/open', { openingAmount: registerForm.amount, notes: registerForm.notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-shifts'] }); refetchStats(); setShowRegisterModal(null); },
  });

  const closeRegisterMutation = useMutation({
    mutationFn: async () => api.post('/restaurant/register/close', { closingAmount: registerForm.amount, notes: registerForm.notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['restaurant-shifts'] }); refetchStats(); setShowRegisterModal(null); },
  });

  const TABS = [
    { id: 'tables',      label: 'Mesas',        icon: Utensils },
    { id: 'orders',      label: 'Órdenes',      icon: AlertCircle },
    { id: 'kitchen',     label: 'Cocina',       icon: ChefHat },
    { id: 'reservations',label: 'Reservas',     icon: Calendar },
    { id: 'delivery',    label: 'Delivery',     icon: Truck },
    { id: 'combos',      label: 'Combos',       icon: Tag },
    { id: 'modifiers',   label: 'Modificadores',icon: Settings },
    { id: 'happyhour',   label: 'Happy Hour',   icon: Zap },
    { id: 'register',    label: 'Caja',         icon: DollarSign },
    { id: 'stats',       label: 'Stats',        icon: BarChart2 },
  ] as { id: Tab; label: string; icon: any }[];

  const sections = [...new Set(tables.map((t: any) => t.section).filter(Boolean))];

  const addItem = (setter: any) => setter((p: any) => ({ ...p, items: [...p.items, { productId: '', quantity: 1, notes: '', modifiers: [] }] }));
  const removeItem = (i: number, setter: any) => setter((p: any) => ({ ...p, items: p.items.filter((_: any, idx: number) => idx !== i) }));
  const updateItem = (i: number, field: string, value: any, setter: any) => setter((p: any) => ({ ...p, items: p.items.map((item: any, idx: number) => idx === i ? { ...item, [field]: value } : item) }));

  const toggleDay = (day: string, form: any, setForm: any) => {
    setForm((p: any) => ({ ...p, daysOfWeek: p.daysOfWeek.includes(day) ? p.daysOfWeek.filter((d: string) => d !== day) : [...p.daysOfWeek, day] }));
  };

  return (
    <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1300px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--dax-radius-lg)', background: 'rgba(249,115,22,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={22} color={ORANGE} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '2px' }}>Restaurante</h1>
            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Sistema completo de gestión</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {stats?.openShift ? (
            <button onClick={() => setShowRegisterModal('close')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-success)', background: 'var(--dax-success-bg)', color: 'var(--dax-success)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <DollarSign size={13} /> Turno abierto — Cerrar caja
            </button>
          ) : (
            <button onClick={() => setShowRegisterModal('open')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)', background: 'var(--dax-surface)', color: 'var(--dax-text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <DollarSign size={13} /> Abrir caja
            </button>
          )}
          {tab === 'tables' && <button onClick={() => setShowTableModal(true)} className="dax-btn-secondary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Mesa</button>}
          {(tab === 'tables' || tab === 'orders') && <button onClick={() => setShowOrderModal({})} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', background: ORANGE, borderColor: ORANGE }}><Plus size={13} /> Nueva orden</button>}
          {tab === 'reservations' && <button onClick={() => setShowReservationModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', background: ORANGE, borderColor: ORANGE }}><Plus size={13} /> Reservación</button>}
          {tab === 'combos' && <button onClick={() => setShowComboModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', background: ORANGE, borderColor: ORANGE }}><Plus size={13} /> Combo</button>}
          {tab === 'modifiers' && <button onClick={() => setShowModifierModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', background: ORANGE, borderColor: ORANGE }}><Plus size={13} /> Modificador</button>}
          {tab === 'happyhour' && <button onClick={() => setShowHappyHourModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', background: ORANGE, borderColor: ORANGE }}><Plus size={13} /> Happy Hour</button>}
        </div>
      </div>

      {/* Stats rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Mesas ocupadas', value: `${stats?.tablesOccupied ?? 0}/${stats?.tablesTotal ?? 0}`, color: ORANGE },
          { label: 'Órdenes activas', value: stats?.activeOrders ?? 0, color: 'var(--dax-blue)' },
          { label: 'Listas servir', value: stats?.ordersReady ?? 0, color: 'var(--dax-success)' },
          { label: 'Delivery activo', value: stats?.pendingDeliveries ?? 0, color: 'var(--dax-purple)' },
          { label: 'Reservas hoy', value: stats?.todayReservations ?? 0, color: 'var(--dax-amber)' },
          { label: 'Ventas hoy', value: formatCurrency(stats?.todayRevenue ?? 0), color: ORANGE, isText: true },
          { label: 'Propinas hoy', value: formatCurrency(stats?.todayTips ?? 0), color: 'var(--dax-success)', isText: true },
        ].map((s, i) => (
          <div key={i} className="dax-card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: s.isText ? '13px' : '20px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {stats?.ordersReady > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--dax-success-bg)', border: '1px solid rgba(61,191,127,.2)', borderRadius: 'var(--dax-radius-md)', marginBottom: '14px' }}>
          <Bell size={14} color="var(--dax-success)" />
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-success)' }}>{stats.ordersReady} orden{stats.ordersReady !== 1 ? 'es' : ''} lista{stats.ordersReady !== 1 ? 's' : ''} para servir</p>
          <button onClick={() => setTab('orders')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--dax-success)', fontWeight: 600 }}>Ver →</button>
        </div>
      )}

      {activeHappyHour?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--dax-amber-bg)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 'var(--dax-radius-md)', marginBottom: '14px' }}>
          <Zap size={14} color={ORANGE} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: ORANGE }}>⚡ Happy Hour activo: {activeHappyHour.map((hh: any) => hh.name).join(', ')}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: 'var(--dax-radius-md)', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? ORANGE : 'var(--dax-surface)', color: active ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0 }}>
              <Icon size={12} />
              {t.label}
              {t.id === 'kitchen' && kitchenOrders.length > 0 && <span style={{ background: 'var(--dax-surface)', color: ORANGE, borderRadius: '10px', padding: '1px 5px', fontSize: '9px', fontWeight: 700 }}>{kitchenOrders.length}</span>}
              {t.id === 'delivery' && stats?.pendingDeliveries > 0 && <span style={{ background: 'var(--dax-surface)', color: ORANGE, borderRadius: '10px', padding: '1px 5px', fontSize: '9px', fontWeight: 700 }}>{stats.pendingDeliveries}</span>}
            </button>
          );
        })}
      </div>

      {/* ── TAB: MESAS ── */}
      {tab === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {upcomingReservations.length > 0 && (
            <div className="dax-card" style={{ padding: '16px 20px', border: '1px solid rgba(240,160,48,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Calendar size={14} color="#F0A030" />
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Próximas reservaciones</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {upcomingReservations.slice(0, 5).map((r: any) => (
                  <div key={r.id} style={{ padding: '8px 12px', background: 'var(--dax-amber-bg)', borderRadius: 'var(--dax-radius-md)', border: '1px solid rgba(240,160,48,.2)' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{r.clientName}</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-amber)' }}>
                      {new Date(r.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })} {new Date(r.date).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })} · {r.partySize} personas
                      {r.table && ` · Mesa ${r.table.number}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.length > 0 ? sections.map((section: any) => (
            <div key={section}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '10px' }}>{section}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px' }}>
                {tables.filter((t: any) => t.section === section).map((table: any) => {
                  const sc = TABLE_STATUS[table.status] ?? TABLE_STATUS.available;
                  const activeOrder = table.orders?.[0];
                  const nextReservation = table.reservations?.[0];
                  return (
                    <div key={table.id} className="dax-card" style={{ padding: '14px', border: `2px solid ${table.status === 'occupied' ? ORANGE : table.status === 'reserved' ? '#F0A030' : 'transparent'}`, transition: 'all .15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1 }}>{table.name || `#${table.number}`}</p>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 7px', borderRadius: '8px' }}>{sc.label}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>{table.capacity} personas</p>
                      {activeOrder && (
                        <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-sm)', padding: '6px 8px', marginBottom: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: ORANGE }}>{formatCurrency(Number(activeOrder.total))}</p>
                          <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{elapsed(activeOrder.createdAt)}</p>
                        </div>
                      )}
                      {nextReservation && !activeOrder && (
                        <div style={{ background: 'var(--dax-amber-bg)', borderRadius: 'var(--dax-radius-sm)', padding: '6px 8px', marginBottom: '8px' }}>
                          <p style={{ fontSize: '10px', color: 'var(--dax-amber)', fontWeight: 600 }}>
                            📅 {new Date(nextReservation.date).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })} — {nextReservation.clientName}
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {table.status === 'available' && (
                          <button onClick={() => setShowOrderModal({ tableId: table.id })} style={{ flex: 1, padding: '5px', background: ORANGE, color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-sm)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                            Abrir
                          </button>
                        )}
                        {table.status === 'occupied' && activeOrder && (
                          <>
                            <button onClick={() => setShowCloseModal(activeOrder)} style={{ flex: 1, padding: '5px', background: 'var(--dax-success)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-sm)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Cobrar</button>
                            <button onClick={() => setShowAddItemModal(activeOrder)} style={{ padding: '5px 7px', background: 'var(--dax-surface-2)', border: 'none', borderRadius: 'var(--dax-radius-sm)', fontSize: '10px', color: 'var(--dax-text-muted)', cursor: 'pointer' }}>+</button>
                            <button onClick={() => tableStatusMutation.mutate({ id: table.id, status: 'cleaning' })} style={{ padding: '5px 7px', background: 'var(--dax-surface-2)', border: 'none', borderRadius: 'var(--dax-radius-sm)', fontSize: '10px', cursor: 'pointer' }}>🧹</button>
                          </>
                        )}
                        {table.status === 'reserved' && (
                          <button onClick={() => reservationStatusMutation.mutate({ id: table.reservations[0]?.id, status: 'seated' })} style={{ flex: 1, padding: '5px', background: 'var(--dax-amber)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-sm)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                            Sentar
                          </button>
                        )}
                        {table.status === 'cleaning' && (
                          <button onClick={() => tableStatusMutation.mutate({ id: table.id, status: 'available' })} style={{ flex: 1, padding: '5px', background: 'var(--dax-success)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-sm)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Lista ✓</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px' }}>
              {tables.length === 0 ? (
                <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                  <Utensils size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                  <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', marginBottom: '12px' }}>No hay mesas. Crea la primera.</p>
                  <button onClick={() => setShowTableModal(true)} style={{ background: ORANGE, color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    + Agregar mesa
                  </button>
                </div>
              ) : tables.map((table: any) => {
                const sc = TABLE_STATUS[table.status] ?? TABLE_STATUS.available;
                return (
                  <div key={table.id} className="dax-card" style={{ padding: '14px' }}>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{table.name || `#${table.number}`}</p>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 7px', borderRadius: '8px' }}>{sc.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ÓRDENES ── */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[{ value: '', label: 'Todas' }, { value: 'open', label: 'Abiertas' }, { value: 'in_progress', label: 'En cocina' }, { value: 'ready', label: 'Listas' }, { value: 'completed', label: 'Cerradas' }].map(f => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filterStatus === f.value ? ORANGE : 'var(--dax-surface-2)', color: filterStatus === f.value ? '#fff' : 'var(--dax-text-muted)' }}>
                {f.label}
              </button>
            ))}
          </div>
          {orders.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <AlertCircle size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay órdenes</p>
            </div>
          ) : orders.map((order: any) => {
            const sc = ORDER_STATUS[order.status];
            return (
              <div key={order.id} className="dax-card" style={{ padding: '18px 22px', border: order.status === 'ready' ? '1px solid rgba(61,191,127,.3)' : '1px solid var(--dax-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: '8px' }}>{sc.label}</span>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{order.table ? `Mesa ${order.table.number}` : 'Sin mesa'}</p>
                      {order.delivery && <span style={{ fontSize: '11px', background: 'rgba(167,139,250,.12)', color: 'var(--dax-purple)', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>🛵 Delivery</span>}
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}><Clock size={10} style={{ display: 'inline' }} /> {elapsed(order.createdAt)}</p>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{order.user?.firstName} · {order.items?.length} items</p>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: ORANGE }}>{formatCurrency(Number(order.total))}</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                  {order.items?.slice(0, 4).map((item: any) => (
                    <div key={item.id} style={{ padding: '4px 8px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-sm)', fontSize: '11px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--dax-text-primary)' }}>{item.product?.name} ×{item.quantity}</span>
                      {item.modifiers?.length > 0 && <span style={{ color: ORANGE }}> +{item.modifiers.length}</span>}
                    </div>
                  ))}
                  {order.items?.length > 4 && <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', padding: '4px' }}>+{order.items.length - 4}</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {order.status === 'open' && (
                    <>
                      <button onClick={() => orderStatusMutation.mutate({ id: order.id, status: 'in_progress' })} style={{ background: 'var(--dax-amber)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Enviar cocina</button>
                      <button onClick={() => setShowAddItemModal(order)} className="dax-btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>+ Items</button>
                    </>
                  )}
                  {order.status === 'ready' && (
                    <>
                      <button onClick={() => setShowCloseModal(order)} style={{ background: 'var(--dax-success)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Cobrar
                      </button>
                      <button onClick={() => { setShowSplitModal(order); setSplitPayments([{ amount: 0, tip: 0, paymentMethod: 'cash', guestName: '' }]); }} style={{ background: 'none', border: '1px solid var(--dax-success)', color: 'var(--dax-success)', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        Dividir cuenta
                      </button>
                    </>
                  )}
                  {['open', 'in_progress'].includes(order.status) && (
                    <button onClick={() => orderStatusMutation.mutate({ id: order.id, status: 'cancelled' })} style={{ background: 'none', border: '1px solid var(--dax-danger)', color: 'var(--dax-danger)', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: COCINA ── */}
      {tab === 'kitchen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--dax-amber-bg)', borderRadius: 'var(--dax-radius-md)', border: '1px solid rgba(249,115,22,.2)' }}>
            <ChefHat size={15} color={ORANGE} />
            <p style={{ fontSize: '13px', fontWeight: 600, color: ORANGE }}>{kitchenOrders.length} orden{kitchenOrders.length !== 1 ? 'es' : ''} activa{kitchenOrders.length !== 1 ? 's' : ''}</p>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {stations.map((st: any) => (
                <span key={st.id} style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: `${st.color}18`, padding: '3px 10px', borderRadius: '10px' }}>{st.name}</span>
              ))}
            </div>
          </div>
          {kitchenOrders.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <ChefHat size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Sin órdenes en cocina</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '12px' }}>
              {kitchenOrders.map((order: any) => (
                <div key={order.id} className="dax-card" style={{ padding: '18px', border: `2px solid ${order.isUrgent ? 'var(--dax-danger)' : ORANGE}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>
                        {order.table ? `Mesa ${order.table.number}` : 'Sin mesa'}
                      </p>
                      {order.table?.section && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{order.table.section}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: order.isUrgent ? 'var(--dax-danger)' : ORANGE }}>
                        <Clock size={12} />
                        <p style={{ fontSize: '13px', fontWeight: 700 }}>{order.elapsedMinutes}m</p>
                      </div>
                      {order.isUrgent && <p style={{ fontSize: '9px', color: 'var(--dax-danger)', fontWeight: 700 }}>⚠ URGENTE</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {order.items?.map((item: any) => {
                      const nextMap: Record<string, string> = { pending: 'preparing', preparing: 'ready' };
                      const nextLabel: Record<string, string> = { pending: 'Preparar', preparing: 'Listo ✓' };
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: item.status === 'ready' ? 'var(--dax-success-bg)' : 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>
                              {item.product?.name} <span style={{ color: ORANGE }}>×{item.quantity}</span>
                            </p>
                            {item.modifiers?.length > 0 && (
                              <p style={{ fontSize: '10px', color: ORANGE }}>
                                {item.modifiers.map((m: any) => m.option?.name).join(', ')}
                              </p>
                            )}
                            {item.notes && <p style={{ fontSize: '10px', color: 'var(--dax-amber)', fontStyle: 'italic' }}>📝 {item.notes}</p>}
                          </div>
                          {nextMap[item.status] && (
                            <button onClick={() => itemStatusMutation.mutate({ orderId: order.id, itemId: item.id, status: nextMap[item.status] })} style={{ background: item.status === 'preparing' ? 'var(--dax-success)' : ORANGE, color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-sm)', padding: '4px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                              {nextLabel[item.status]}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {order.notes && <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--dax-amber-bg)', borderRadius: 'var(--dax-radius-sm)' }}><p style={{ fontSize: '11px', color: ORANGE }}>📝 {order.notes}</p></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RESERVACIONES ── */}
      {tab === 'reservations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="dax-input" style={{ margin: 0, width: 'auto' }} />
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} style={{ padding: '8px 14px', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)', background: 'var(--dax-surface)', color: 'var(--dax-text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Hoy
            </button>
          </div>
          {reservations.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Calendar size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay reservaciones para este día</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reservations.map((r: any) => {
                const sc = RESERVATION_STATUS[r.status];
                return (
                  <div key={r.id} className="dax-card" style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: '8px' }}>{sc.label}</span>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{r.clientName}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>🕐 {new Date(r.date).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>👥 {r.partySize} personas</p>
                          {r.table && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>🪑 Mesa {r.table.number}</p>}
                          {r.clientPhone && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📞 {r.clientPhone}</p>}
                          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>⏱ {r.duration}min</p>
                        </div>
                        {r.notes && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '4px', fontStyle: 'italic' }}>{r.notes}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {r.status === 'pending' && <button onClick={() => reservationStatusMutation.mutate({ id: r.id, status: 'confirmed' })} style={{ background: 'var(--dax-success)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Confirmar</button>}
                        {r.status === 'confirmed' && <button onClick={() => reservationStatusMutation.mutate({ id: r.id, status: 'seated' })} style={{ background: ORANGE, color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Sentar</button>}
                        {r.status === 'seated' && <button onClick={() => reservationStatusMutation.mutate({ id: r.id, status: 'completed' })} style={{ background: 'var(--dax-success)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Completar</button>}
                        {['pending', 'confirmed'].includes(r.status) && (
                          <>
                            <button onClick={() => reservationStatusMutation.mutate({ id: r.id, status: 'no_show' })} style={{ background: 'none', border: '1px solid #F0A030', color: 'var(--dax-amber)', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>No asistió</button>
                            <button onClick={() => reservationStatusMutation.mutate({ id: r.id, status: 'cancelled' })} style={{ background: 'none', border: '1px solid var(--dax-danger)', color: 'var(--dax-danger)', borderRadius: 'var(--dax-radius-md)', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DELIVERY ── */}
      {tab === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[{ value: '', label: 'Todos' }, { value: 'pending', label: 'Pendiente' }, { value: 'preparing', label: 'Preparando' }, { value: 'out_for_delivery', label: 'En camino' }, { value: 'delivered', label: 'Entregado' }].map(f => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filterStatus === f.value ? ORANGE : 'var(--dax-surface-2)', color: filterStatus === f.value ? '#fff' : 'var(--dax-text-muted)' }}>
                {f.label}
              </button>
            ))}
          </div>
          {deliveryOrders.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Truck size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay pedidos de delivery</p>
            </div>
          ) : deliveryOrders.map((d: any) => {
            const ds = DELIVERY_STATUS[d.status];
            const nextMap: Record<string, string> = { pending: 'preparing', preparing: 'out_for_delivery', out_for_delivery: 'delivered' };
            const nextLabel: Record<string, string> = { pending: 'Preparar', preparing: 'Enviar', out_for_delivery: 'Entregar' };
            return (
              <div key={d.id} className="dax-card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: ds?.color, background: `${ds?.color}18`, padding: '2px 8px', borderRadius: '8px' }}>{ds?.label}</span>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{d.clientName}</p>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>📍 {d.address}</p>
                    {d.clientPhone && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📞 {d.clientPhone}</p>}
                    {d.deliveryFee > 0 && <p style={{ fontSize: '12px', color: ORANGE, fontWeight: 600 }}>🛵 Envío: {formatCurrency(Number(d.deliveryFee))}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: ORANGE }}>{formatCurrency(Number(d.order?.total ?? 0))}</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{elapsed(d.createdAt)}</p>
                  </div>
                </div>
                {nextMap[d.status] && (
                  <button onClick={() => deliveryStatusMutation.mutate({ id: d.id, status: nextMap[d.status] })} style={{ background: ORANGE, color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    → {nextLabel[d.status]}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: COMBOS ── */}
      {tab === 'combos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {combos.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
              <Tag size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay combos. Crea el primero.</p>
            </div>
          ) : combos.map((combo: any) => (
            <div key={combo.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{combo.name}</p>
                <button onClick={() => { if (confirm('¿Eliminar combo?')) deleteComboMutation.mutate(combo.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--dax-danger)', fontWeight: 600 }}>Eliminar</button>
              </div>
              {combo.description && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '10px' }}>{combo.description}</p>}
              <p style={{ fontSize: '20px', fontWeight: 700, color: ORANGE, marginBottom: '10px' }}>{formatCurrency(Number(combo.price))}</p>
              {(combo.availableFrom || combo.daysOfWeek) && (
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
                  {combo.availableFrom && `🕐 ${combo.availableFrom} — ${combo.availableTo}`}
                  {combo.daysOfWeek && ` · ${combo.daysOfWeek.split(',').map((d: string) => DAYS.find(x => x.value === d)?.label).join(', ')}`}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {combo.items?.map((item: any) => (
                  <p key={item.id} style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>• {item.product?.name} ×{item.quantity}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: MODIFICADORES ── */}
      {tab === 'modifiers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {modifiers.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
              <Settings size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay grupos de modificadores</p>
            </div>
          ) : modifiers.map((group: any) => (
            <div key={group.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>{group.name}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {group.required && <span style={{ fontSize: '10px', background: 'var(--dax-danger-bg)', color: 'var(--dax-danger)', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>Requerido</span>}
                    {group.multiple && <span style={{ fontSize: '10px', background: 'rgba(90,170,240,.1)', color: 'var(--dax-blue)', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>Múltiple</span>}
                    <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{group.minSelect}–{group.maxSelect} opciones</span>
                  </div>
                </div>
                <button onClick={() => { if (confirm('¿Eliminar grupo?')) deleteModifierMutation.mutate(group.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--dax-danger)', fontWeight: 600 }}>Eliminar</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                {group.options?.map((opt: any) => (
                  <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-sm)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{opt.name}</span>
                    {Number(opt.extraPrice) > 0 && <span style={{ fontSize: '12px', fontWeight: 600, color: ORANGE }}>+{formatCurrency(Number(opt.extraPrice))}</span>}
                  </div>
                ))}
              </div>
              {group.products?.length > 0 && (
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Aplicado a: {group.products.map((p: any) => p.product?.name).join(', ')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: HAPPY HOUR ── */}
      {tab === 'happyhour' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeHappyHour?.length > 0 && (
            <div style={{ padding: '14px 18px', background: 'var(--dax-amber-bg)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 'var(--dax-radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={16} color={ORANGE} />
              <p style={{ fontSize: '13px', fontWeight: 700, color: ORANGE }}>⚡ Happy Hour activo ahora: {activeHappyHour.map((hh: any) => `${hh.name} (${hh.discount}${hh.discountType === 'percentage' ? '%' : '₡'} off)`).join(' · ')}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {happyHours.length === 0 ? (
              <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                <Zap size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay happy hours configurados</p>
              </div>
            ) : happyHours.map((hh: any) => (
              <div key={hh.id} className="dax-card" style={{ padding: '20px', borderLeft: `3px solid ${ORANGE}` }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '6px' }}>{hh.name}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: ORANGE, marginBottom: '8px' }}>
                  {hh.discount}{hh.discountType === 'percentage' ? '%' : ''} OFF
                </p>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>🕐 {hh.startTime} — {hh.endTime}</p>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
                  {hh.daysOfWeek.split(',').map((d: string) => DAYS.find(x => x.value === d)?.label).join(', ')}
                </p>
                {hh.products?.length > 0 && (
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{hh.products.length} productos aplicados</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: CAJA / TURNOS ── */}
      {tab === 'register' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {stats?.openShift && (
            <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(61,191,127,.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-success)', marginBottom: '4px' }}>🟢 Turno abierto</p>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                    {stats.openShift.user?.firstName} · Desde {new Date(stats.openShift.openedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => setShowRegisterModal('close')} style={{ background: 'var(--dax-danger)', color: 'var(--dax-text-primary)', border: 'none', borderRadius: 'var(--dax-radius-md)', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Cerrar caja
                </button>
              </div>
            </div>
          )}
          <div className="dax-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dax-border)' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Historial de turnos</p>
            </div>
            <div className="dax-table-wrap">
              <table className="dax-table">
                <thead>
                  <tr><th>Cajero</th><th>Apertura</th><th>Cierre</th><th>Ventas</th><th>Propinas</th><th>Diferencia</th><th style={{ textAlign: 'center' }}>Estado</th></tr>
                </thead>
                <tbody>
                  {shifts.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>No hay turnos registrados</td></tr>
                  ) : shifts.map((shift: any) => (
                    <tr key={shift.id}>
                      <td style={{ fontWeight: 600 }}>{shift.user?.firstName} {shift.user?.lastName}</td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{formatCurrency(Number(shift.openingAmount))}</td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{shift.closingAmount ? formatCurrency(Number(shift.closingAmount)) : '—'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--dax-success)' }}>{formatCurrency(Number(shift.totalSales))}</td>
                      <td style={{ fontWeight: 600, color: ORANGE }}>{formatCurrency(Number(shift.totalTips))}</td>
                      <td style={{ fontWeight: 600, color: shift.difference > 0 ? 'var(--dax-success)' : shift.difference < 0 ? 'var(--dax-danger)' : 'var(--dax-text-muted)' }}>
                        {shift.difference !== null ? formatCurrency(Number(shift.difference)) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`dax-badge ${shift.status === 'open' ? 'dax-badge-success' : 'dax-badge-default'}`}>{shift.status === 'open' ? 'Abierto' : 'Cerrado'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: STATS ── */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Ventas hoy',      value: formatCurrency(stats?.todayRevenue ?? 0),  color: ORANGE, isText: true },
              { label: 'Órdenes hoy',     value: stats?.todayOrdersCount ?? 0,              color: 'var(--dax-blue)' },
              { label: 'Propinas hoy',    value: formatCurrency(stats?.todayTips ?? 0),     color: 'var(--dax-success)', isText: true },
              { label: 'Ventas del mes',  value: formatCurrency(stats?.monthRevenue ?? 0),  color: ORANGE, isText: true },
              { label: 'Órdenes mes',     value: stats?.monthOrdersCount ?? 0,             color: 'var(--dax-purple)' },
              { label: 'Tiempo promedio', value: `${stats?.avgOrderTime ?? 0}min`,         color: 'var(--dax-text-muted)', isText: true },
            ].map((s, i) => (
              <div key={i} className="dax-card" style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: s.isText ? '15px' : '22px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {stats?.topProducts?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={15} color={ORANGE} />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Platos más pedidos este mes</p>
              </div>
              {stats.topProducts.map((p: any, i: number) => {
                const max = stats.topProducts[0].quantity;
                const pct = max > 0 ? (p.quantity / max) * 100 : 0;
                return (
                  <div key={p.productId} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? ORANGE : 'var(--dax-text-muted)' }}>#{i+1}</span>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{p.name}</p>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: ORANGE }}>{p.quantity}</p>
                    </div>
                    <div style={{ height: '3px', background: 'var(--dax-surface-2)', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? ORANGE : 'var(--dax-border)', borderRadius: '2px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          MODALES
      ══════════════════════════════════════ */}

      {/* Modal Nueva Mesa */}
      {showTableModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nueva mesa</h2>
              <button onClick={() => setShowTableModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Número</Label><input className="dax-input" type="number" min="1" value={tableForm.number} onChange={e => setTableForm(p => ({ ...p, number: parseInt(e.target.value) || 1 }))} /></div>
                <div><Label>Capacidad</Label><input className="dax-input" type="number" min="1" value={tableForm.capacity} onChange={e => setTableForm(p => ({ ...p, capacity: parseInt(e.target.value) || 4 }))} /></div>
              </div>
              <div><Label optional>Nombre</Label><input className="dax-input" value={tableForm.name} onChange={e => setTableForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Mesa VIP, Terraza 1..." /></div>
              <div><Label optional>Sección</Label><input className="dax-input" value={tableForm.section} onChange={e => setTableForm(p => ({ ...p, section: e.target.value }))} placeholder="Salón principal, Terraza..." /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowTableModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => tableMutation.mutate()} disabled={tableMutation.isPending} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {tableMutation.isPending ? 'Guardando...' : 'Crear mesa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Orden */}
      {showOrderModal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '580px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nueva orden</h2>
              <button onClick={() => { setShowOrderModal(null); setOrderForm({ tableId: '', notes: '', isDelivery: false, deliveryAddress: '', deliveryPhone: '', deliveryFee: 0, items: [] }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setOrderForm(p => ({ ...p, isDelivery: false }))} style={{ flex: 1, padding: '8px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: `1px solid ${!orderForm.isDelivery ? ORANGE : 'var(--dax-border)'}`, background: !orderForm.isDelivery ? `rgba(249,115,22,.1)` : 'var(--dax-surface-2)', color: !orderForm.isDelivery ? ORANGE : 'var(--dax-text-muted)', cursor: 'pointer' }}>
                  🪑 En local
                </button>
                <button onClick={() => setOrderForm(p => ({ ...p, isDelivery: true, tableId: '' }))} style={{ flex: 1, padding: '8px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: `1px solid ${orderForm.isDelivery ? ORANGE : 'var(--dax-border)'}`, background: orderForm.isDelivery ? `rgba(249,115,22,.1)` : 'var(--dax-surface-2)', color: orderForm.isDelivery ? ORANGE : 'var(--dax-text-muted)', cursor: 'pointer' }}>
                  🛵 Delivery
                </button>
              </div>

              {!orderForm.isDelivery && (
                <div><Label optional>Mesa</Label>
                  <select className="dax-input" value={orderForm.tableId || showOrderModal?.tableId || ''} onChange={e => setOrderForm(p => ({ ...p, tableId: e.target.value }))}>
                    <option value="">Sin mesa (para llevar)</option>
                    {tables.filter((t: any) => t.status === 'available').map((t: any) => <option key={t.id} value={t.id}>Mesa {t.number}{t.name ? ` — ${t.name}` : ''}</option>)}
                  </select>
                </div>
              )}

              {orderForm.isDelivery && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                  <div><Label>Dirección de entrega</Label><input className="dax-input" value={orderForm.deliveryAddress} onChange={e => setOrderForm(p => ({ ...p, deliveryAddress: e.target.value }))} placeholder="Dirección completa..." /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><Label optional>Teléfono</Label><input className="dax-input" value={orderForm.deliveryPhone} onChange={e => setOrderForm(p => ({ ...p, deliveryPhone: e.target.value }))} placeholder="+506 8888-9999" /></div>
                    <div><Label optional>Cargo delivery</Label><input className="dax-input" type="number" min="0" value={orderForm.deliveryFee} onChange={e => setOrderForm(p => ({ ...p, deliveryFee: parseFloat(e.target.value) || 0 }))} /></div>
                  </div>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Label>Items</Label>
                  <button onClick={() => addItem(setOrderForm)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: ORANGE, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                {orderForm.items.length === 0 && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>Agrega los platos</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orderForm.items.map((item, i) => (
                    <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 32px', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <select className="dax-input" style={{ margin: 0 }} value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value, setOrderForm)}>
                          <option value="">Selecciona plato...</option>
                          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))}</option>)}
                        </select>
                        <input className="dax-input" style={{ margin: 0 }} type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1, setOrderForm)} />
                        <button onClick={() => removeItem(i, setOrderForm)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                      </div>
                      <input className="dax-input" style={{ margin: 0 }} value={item.notes} onChange={e => updateItem(i, 'notes', e.target.value, setOrderForm)} placeholder="Notas (sin cebolla, término medio...)" />
                    </div>
                  ))}
                </div>
              </div>

              <div><Label optional>Notas generales</Label><input className="dax-input" value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} placeholder="Alérgenos, preferencias..." /></div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowOrderModal(null); setOrderForm({ tableId: '', notes: '', isDelivery: false, deliveryAddress: '', deliveryPhone: '', deliveryFee: 0, items: [] }); }} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => { setOrderForm(p => ({ ...p, tableId: p.tableId || showOrderModal?.tableId || '' })); orderMutation.mutate(); }} disabled={orderMutation.isPending} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {orderMutation.isPending ? 'Creando...' : 'Crear orden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Items */}
      {showAddItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>Agregar a la orden</h2>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{showAddItemModal.table ? `Mesa ${showAddItemModal.table.number}` : 'Sin mesa'}</p>
              </div>
              <button onClick={() => { setShowAddItemModal(null); setAddItemForm({ items: [] }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Label>Items adicionales</Label>
                  <button onClick={() => addItem(setAddItemForm)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: ORANGE, display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>
                </div>
                {addItemForm.items.length === 0 && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>Agrega los platos adicionales</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {addItemForm.items.map((item, i) => (
                    <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 32px', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <select className="dax-input" style={{ margin: 0 }} value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value, setAddItemForm)}>
                          <option value="">Selecciona plato...</option>
                          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(Number(p.price))}</option>)}
                        </select>
                        <input className="dax-input" style={{ margin: 0 }} type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1, setAddItemForm)} />
                        <button onClick={() => removeItem(i, setAddItemForm)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                      </div>
                      <input className="dax-input" style={{ margin: 0 }} value={item.notes} onChange={e => updateItem(i, 'notes', e.target.value, setAddItemForm)} placeholder="Notas del item..." />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowAddItemModal(null); setAddItemForm({ items: [] }); }} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => addItemMutation.mutate()} disabled={addItemMutation.isPending || addItemForm.items.filter(i => i.productId).length === 0} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {addItemMutation.isPending ? 'Agregando...' : 'Agregar items'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobrar */}
      {showCloseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Cobrar orden</h2>
              <button onClick={() => setShowCloseModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-lg)', padding: '18px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>{showCloseModal.table ? `Mesa ${showCloseModal.table.number}` : 'Sin mesa'} · {showCloseModal.items?.length} items</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: ORANGE }}>{formatCurrency(Number(showCloseModal.total))}</p>
              <div style={{ borderTop: '1px solid var(--dax-border)', marginTop: '10px', paddingTop: '10px' }}>
                {showCloseModal.items?.slice(0, 5).map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{item.product?.name} ×{item.quantity}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{formatCurrency(Number(item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Label>Propina</Label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[0, 5, 10, 15, 20].map(pct => (
                  <button key={pct} onClick={() => setTipAmount(pct > 0 ? Math.round(Number(showCloseModal.total) * pct / 100) : 0)} style={{ padding: '6px 12px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tipAmount === Math.round(Number(showCloseModal.total) * pct / 100) ? ORANGE : 'var(--dax-surface-2)', color: tipAmount === Math.round(Number(showCloseModal.total) * pct / 100) ? '#fff' : 'var(--dax-text-muted)' }}>
                    {pct === 0 ? 'Sin propina' : `${pct}%`}
                  </button>
                ))}
              </div>
              <input className="dax-input" type="number" min="0" value={tipAmount} onChange={e => setTipAmount(parseFloat(e.target.value) || 0)} placeholder="Monto de propina..." />
              {tipAmount > 0 && <p style={{ fontSize: '12px', color: 'var(--dax-success)', marginTop: '4px' }}>Total con propina: {formatCurrency(Number(showCloseModal.total) + tipAmount)}</p>}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <Label>Método de pago</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PAYMENT_METHODS.map(method => (
                  <button key={method.value} onClick={() => setPaymentMethod(method.value)} style={{ padding: '9px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: `1px solid ${paymentMethod === method.value ? ORANGE : 'var(--dax-border)'}`, background: paymentMethod === method.value ? `rgba(249,115,22,.1)` : 'var(--dax-surface-2)', color: paymentMethod === method.value ? ORANGE : 'var(--dax-text-muted)', cursor: 'pointer' }}>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowCloseModal(null)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending} className="dax-btn-primary" style={{ flex: 1, background: 'var(--dax-success)', borderColor: 'var(--dax-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle size={15} />
                {closeMutation.isPending ? 'Procesando...' : `Cobrar ${formatCurrency(Number(showCloseModal.total) + tipAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dividir Cuenta */}
      {showSplitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>Dividir cuenta</h2>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Total: {formatCurrency(Number(showSplitModal.total))}</p>
              </div>
              <button onClick={() => setShowSplitModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {splitPayments.map((payment, i) => (
                <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>Pago #{i+1}</p>
                    {splitPayments.length > 1 && <button onClick={() => setSplitPayments(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', fontSize: '12px' }}>Eliminar</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div><Label>Monto</Label><input className="dax-input" type="number" min="0" value={payment.amount} onChange={e => setSplitPayments(p => p.map((x, idx) => idx === i ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))} /></div>
                    <div><Label optional>Propina</Label><input className="dax-input" type="number" min="0" value={payment.tip} onChange={e => setSplitPayments(p => p.map((x, idx) => idx === i ? { ...x, tip: parseFloat(e.target.value) || 0 } : x))} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><Label>Método</Label>
                      <select className="dax-input" value={payment.paymentMethod} onChange={e => setSplitPayments(p => p.map((x, idx) => idx === i ? { ...x, paymentMethod: e.target.value } : x))}>
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div><Label optional>Nombre</Label><input className="dax-input" value={payment.guestName} onChange={e => setSplitPayments(p => p.map((x, idx) => idx === i ? { ...x, guestName: e.target.value } : x))} placeholder="Comensal..." /></div>
                  </div>
                </div>
              ))}
              <button onClick={() => setSplitPayments(p => [...p, { amount: 0, tip: 0, paymentMethod: 'cash', guestName: '' }])} style={{ background: 'none', border: '1px dashed var(--dax-border)', borderRadius: 'var(--dax-radius-md)', padding: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Plus size={13} /> Agregar pago
              </button>
              <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>Total pagos</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: splitPayments.reduce((acc, p) => acc + p.amount, 0) >= Number(showSplitModal.total) ? 'var(--dax-success)' : 'var(--dax-danger)' }}>
                    {formatCurrency(splitPayments.reduce((acc, p) => acc + p.amount, 0))}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowSplitModal(null)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => splitMutation.mutate()} disabled={splitMutation.isPending || splitPayments.reduce((acc, p) => acc + p.amount, 0) < Number(showSplitModal.total)} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {splitMutation.isPending ? 'Procesando...' : 'Confirmar pagos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reservación */}
      {showReservationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nueva reservación</h2>
              <button onClick={() => setShowReservationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Nombre del cliente</Label><input className="dax-input" value={reservationForm.clientName} onChange={e => setReservationForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Juan Pérez" /></div>
                <div><Label optional>Teléfono</Label><input className="dax-input" value={reservationForm.clientPhone} onChange={e => setReservationForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+506 8888-9999" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Fecha y hora</Label><input className="dax-input" type="datetime-local" value={reservationForm.date} onChange={e => setReservationForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div><Label>Personas</Label><input className="dax-input" type="number" min="1" value={reservationForm.partySize} onChange={e => setReservationForm(p => ({ ...p, partySize: parseInt(e.target.value) || 1 }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Mesa</Label>
                  <select className="dax-input" value={reservationForm.tableId} onChange={e => setReservationForm(p => ({ ...p, tableId: e.target.value }))}>
                    <option value="">Sin asignar</option>
                    {tables.filter((t: any) => t.status === 'available' && t.capacity >= reservationForm.partySize).map((t: any) => <option key={t.id} value={t.id}>Mesa {t.number} ({t.capacity} personas)</option>)}
                  </select>
                </div>
                <div><Label>Duración (min)</Label><input className="dax-input" type="number" min="30" step="30" value={reservationForm.duration} onChange={e => setReservationForm(p => ({ ...p, duration: parseInt(e.target.value) || 90 }))} /></div>
              </div>
              <div><Label optional>Email</Label><input className="dax-input" type="email" value={reservationForm.clientEmail} onChange={e => setReservationForm(p => ({ ...p, clientEmail: e.target.value }))} placeholder="cliente@email.com" /></div>
              <div><Label optional>Notas</Label><input className="dax-input" value={reservationForm.notes} onChange={e => setReservationForm(p => ({ ...p, notes: e.target.value }))} placeholder="Ocasión especial, preferencias..." /></div>
              <div><Label optional>Fuente</Label>
                <select className="dax-input" value={reservationForm.source} onChange={e => setReservationForm(p => ({ ...p, source: e.target.value }))}>
                  {['direct', 'phone', 'whatsapp', 'website', 'app'].map(s => <option key={s} value={s}>{s === 'direct' ? 'En persona' : s === 'phone' ? 'Teléfono' : s === 'whatsapp' ? 'WhatsApp' : s === 'website' ? 'Sitio web' : 'App'}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowReservationModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => reservationMutation.mutate()} disabled={reservationMutation.isPending || !reservationForm.clientName || !reservationForm.date} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {reservationMutation.isPending ? 'Guardando...' : 'Crear reservación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Combo */}
      {showComboModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '520px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo combo / menú del día</h2>
              <button onClick={() => setShowComboModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Nombre del combo</Label><input className="dax-input" value={comboForm.name} onChange={e => setComboForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Menú del día, Combo familiar..." /></div>
              <div><Label optional>Descripción</Label><input className="dax-input" value={comboForm.description} onChange={e => setComboForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div><Label>Precio del combo</Label><input className="dax-input" type="number" min="0" step="0.01" value={comboForm.price} onChange={e => setComboForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Disponible desde</Label><input className="dax-input" type="time" value={comboForm.availableFrom} onChange={e => setComboForm(p => ({ ...p, availableFrom: e.target.value }))} /></div>
                <div><Label optional>Disponible hasta</Label><input className="dax-input" type="time" value={comboForm.availableTo} onChange={e => setComboForm(p => ({ ...p, availableTo: e.target.value }))} /></div>
              </div>
              <div>
                <Label optional>Días disponibles</Label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {DAYS.map(d => (
                    <button key={d.value} onClick={() => toggleDay(d.value, comboForm, setComboForm)} style={{ padding: '5px 10px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: comboForm.daysOfWeek.includes(d.value) ? ORANGE : 'var(--dax-surface-2)', color: comboForm.daysOfWeek.includes(d.value) ? '#fff' : 'var(--dax-text-muted)' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Label>Productos incluidos</Label>
                  <button onClick={() => setComboForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1 }] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: ORANGE, display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {comboForm.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 32px', gap: '8px', alignItems: 'center' }}>
                      <select className="dax-input" style={{ margin: 0 }} value={item.productId} onChange={e => setComboForm(p => ({ ...p, items: p.items.map((x, idx) => idx === i ? { ...x, productId: e.target.value } : x) }))}>
                        <option value="">Selecciona...</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="dax-input" style={{ margin: 0 }} type="number" min="1" value={item.quantity} onChange={e => setComboForm(p => ({ ...p, items: p.items.map((x, idx) => idx === i ? { ...x, quantity: parseInt(e.target.value) || 1 } : x) }))} />
                      <button onClick={() => setComboForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowComboModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => comboMutation.mutate()} disabled={comboMutation.isPending || !comboForm.name || comboForm.items.length === 0} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {comboMutation.isPending ? 'Guardando...' : 'Crear combo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modificador */}
      {showModifierModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '520px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo grupo de modificadores</h2>
              <button onClick={() => setShowModifierModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Nombre del grupo</Label><input className="dax-input" value={modifierForm.name} onChange={e => setModifierForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Término de carne, Extras, Sin ingrediente..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Mínimo selección</Label><input className="dax-input" type="number" min="0" value={modifierForm.minSelect} onChange={e => setModifierForm(p => ({ ...p, minSelect: parseInt(e.target.value) || 0 }))} /></div>
                <div><Label>Máximo selección</Label><input className="dax-input" type="number" min="1" value={modifierForm.maxSelect} onChange={e => setModifierForm(p => ({ ...p, maxSelect: parseInt(e.target.value) || 1 }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--dax-text-secondary)' }}>
                  <input type="checkbox" checked={modifierForm.required} onChange={e => setModifierForm(p => ({ ...p, required: e.target.checked }))} style={{ accentColor: ORANGE }} />
                  Requerido
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--dax-text-secondary)' }}>
                  <input type="checkbox" checked={modifierForm.multiple} onChange={e => setModifierForm(p => ({ ...p, multiple: e.target.checked }))} style={{ accentColor: ORANGE }} />
                  Selección múltiple
                </label>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Label>Opciones</Label>
                  <button onClick={() => setModifierForm(p => ({ ...p, options: [...p.options, { name: '', extraPrice: 0 }] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: ORANGE, display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>
                </div>
                {modifierForm.options.length === 0 && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>Ej: Término medio, Extra queso, Sin cebolla...</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {modifierForm.options.map((opt, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 32px', gap: '8px', alignItems: 'center' }}>
                      <input className="dax-input" style={{ margin: 0 }} value={opt.name} onChange={e => setModifierForm(p => ({ ...p, options: p.options.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x) }))} placeholder="Ej: Sin cebolla" />
                      <input className="dax-input" style={{ margin: 0 }} type="number" min="0" step="0.01" value={opt.extraPrice} onChange={e => setModifierForm(p => ({ ...p, options: p.options.map((x, idx) => idx === i ? { ...x, extraPrice: parseFloat(e.target.value) || 0 } : x) }))} placeholder="Costo extra" />
                      <button onClick={() => setModifierForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowModifierModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => modifierMutation.mutate()} disabled={modifierMutation.isPending || !modifierForm.name || modifierForm.options.length === 0} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {modifierMutation.isPending ? 'Guardando...' : 'Crear modificador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Happy Hour */}
      {showHappyHourModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '460px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo Happy Hour</h2>
              <button onClick={() => setShowHappyHourModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Nombre</Label><input className="dax-input" value={happyHourForm.name} onChange={e => setHappyHourForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Happy Hour Viernes, 2x1 Cervezas..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Descuento</Label><input className="dax-input" type="number" min="0" max="100" value={happyHourForm.discount} onChange={e => setHappyHourForm(p => ({ ...p, discount: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Tipo</Label>
                  <select className="dax-input" value={happyHourForm.discountType} onChange={e => setHappyHourForm(p => ({ ...p, discountType: e.target.value }))}>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Desde</Label><input className="dax-input" type="time" value={happyHourForm.startTime} onChange={e => setHappyHourForm(p => ({ ...p, startTime: e.target.value }))} /></div>
                <div><Label>Hasta</Label><input className="dax-input" type="time" value={happyHourForm.endTime} onChange={e => setHappyHourForm(p => ({ ...p, endTime: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Días de la semana</Label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {DAYS.map(d => (
                    <button key={d.value} onClick={() => toggleDay(d.value, happyHourForm, setHappyHourForm)} style={{ padding: '5px 10px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: happyHourForm.daysOfWeek.includes(d.value) ? ORANGE : 'var(--dax-surface-2)', color: happyHourForm.daysOfWeek.includes(d.value) ? '#fff' : 'var(--dax-text-muted)' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowHappyHourModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => happyHourMutation.mutate()} disabled={happyHourMutation.isPending || !happyHourForm.name || !happyHourForm.startTime || !happyHourForm.endTime || happyHourForm.daysOfWeek.length === 0} className="dax-btn-primary" style={{ flex: 1, background: ORANGE, borderColor: ORANGE }}>
                  {happyHourMutation.isPending ? 'Guardando...' : 'Crear happy hour'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Caja */}
      {showRegisterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '380px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{showRegisterModal === 'open' ? 'Abrir caja' : 'Cerrar caja'}</h2>
              <button onClick={() => setShowRegisterModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <Label>{showRegisterModal === 'open' ? 'Monto de apertura' : 'Monto contado en caja'}</Label>
                <input className="dax-input" type="number" min="0" step="0.01" value={registerForm.amount} onChange={e => setRegisterForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
              </div>
              {showRegisterModal === 'close' && stats?.openShift && (
                <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '14px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>Resumen del turno</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>Ventas</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-success)' }}>{formatCurrency(stats?.todayRevenue ?? 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>Propinas</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: ORANGE }}>{formatCurrency(stats?.todayTips ?? 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>Órdenes</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{stats?.todayOrdersCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              )}
              <div><Label optional>Notas</Label><input className="dax-input" value={registerForm.notes} onChange={e => setRegisterForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones del turno..." /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowRegisterModal(null)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => showRegisterModal === 'open' ? openRegisterMutation.mutate() : closeRegisterMutation.mutate()} disabled={openRegisterMutation.isPending || closeRegisterMutation.isPending} className="dax-btn-primary" style={{ flex: 1, background: showRegisterModal === 'open' ? 'var(--dax-success)' : 'var(--dax-danger)', borderColor: showRegisterModal === 'open' ? 'var(--dax-success)' : 'var(--dax-danger)' }}>
                  {showRegisterModal === 'open' ? '🔓 Abrir caja' : '🔒 Cerrar caja'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
