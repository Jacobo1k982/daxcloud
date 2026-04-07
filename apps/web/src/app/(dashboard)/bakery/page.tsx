'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  ChefHat, Plus, X, Check, Clock, Package,
  TrendingUp, AlertCircle, Play, CheckCircle,
  Truck, ShoppingBag, AlertTriangle, Users,
  ClipboardList, BarChart2, Calendar, Pause,
  ArrowRight, Eye, Edit2, Trash2, RefreshCw,
  Layers, DollarSign, Star, Coffee, Flame,
} from 'lucide-react';

// ══════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════
type Tab = 'dashboard' | 'production' | 'recipes' | 'encargos' | 'wastes' | 'suppliers' | 'orders' | 'minimums';

interface Recipe { id: string; name: string; description?: string; yield: number; yieldUnit: string; prepTime?: number; cost?: number; ingredients: any[]; laborCosts: any[]; _count?: { productions: number }; }
interface Production { id: string; recipe?: { name: string; yieldUnit: string; cost?: number }; branch?: { name: string }; shift?: { shift: string; date: string }; quantity: number; plannedAt?: string; completedAt?: string; status: string; notes?: string; wastes?: any[]; }
interface Encargo { id: string; clientName: string; clientPhone?: string; deliveryDate: string; totalAmount: number; deposit: number; status: string; notes?: string; items: any[]; branch?: { name: string }; }
interface Waste { id: string; product?: { name: string }; production?: { recipe?: { name: string } }; branch?: { name: string }; quantity: number; unit: string; reason: string; cost?: number; createdAt: string; }
interface Supplier { id: string; name: string; contactName?: string; phone?: string; email?: string; address?: string; taxId?: string; paymentTerms?: string; notes?: string; _count?: { purchaseOrders: number }; }

// ══════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════
const STATUS_PROD: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  planned: { label: 'Planificado', color: '#4A7FAF', bg: 'rgba(74,127,175,.1)', dot: '#4A7FAF' },
  in_progress: { label: 'En proceso', color: '#F0A030', bg: 'rgba(240,160,48,.1)', dot: '#F0A030' },
  completed: { label: 'Completado', color: '#3DBF7F', bg: 'rgba(61,191,127,.1)', dot: '#3DBF7F' },
  cancelled: { label: 'Cancelado', color: '#E05050', bg: 'rgba(224,80,80,.1)', dot: '#E05050' },
};

const STATUS_ENCARGO: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#F0A030', bg: 'rgba(240,160,48,.1)' },
  confirmed: { label: 'Confirmado', color: '#5AAAF0', bg: 'rgba(90,170,240,.1)' },
  in_production: { label: 'Produciendo', color: '#FF5C35', bg: 'rgba(255,92,53,.1)' },
  ready: { label: 'Listo ✓', color: '#3DBF7F', bg: 'rgba(61,191,127,.1)' },
  delivered: { label: 'Entregado', color: '#718096', bg: 'rgba(113,128,150,.1)' },
  cancelled: { label: 'Cancelado', color: '#E05050', bg: 'rgba(224,80,80,.1)' },
};

const STATUS_ORDER: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: '#F0A030' },
  received: { label: 'Recibida', color: '#3DBF7F' },
  cancelled: { label: 'Cancelada', color: '#E05050' },
};

const SHIFT_LABELS: Record<string, { label: string; emoji: string; time: string }> = {
  midnight: { label: 'Madrugada', emoji: '🌙', time: '00-06' },
  morning: { label: 'Mañana', emoji: '🌅', time: '06-12' },
  afternoon: { label: 'Tarde', emoji: '☀️', time: '12-18' },
  evening: { label: 'Noche', emoji: '🌆', time: '18-00' },
};

const UNITS = ['kg', 'g', 'l', 'ml', 'unidades', 'tazas', 'cucharadas', 'cucharaditas', 'onzas', 'libras'];
const WASTE_REASONS = ['Quemado en horno', 'Caducado', 'Caída accidental', 'Error en receta', 'Sobreproducción', 'Defecto de calidad', 'Daño en almacén', 'Temperatura incorrecta', 'Contaminación', 'Otro'];
const ENCARGO_STATUSES = ['confirmed', 'in_production', 'ready', 'delivered', 'cancelled'];

// ══════════════════════════════════════════
// HELPERS UI
// ══════════════════════════════════════════
function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>
      {children}
      {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--dax-text-muted)', opacity: .6 }}>· opcional</span>}
    </label>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div className="dax-card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--dax-radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '4px' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{label}</p>
      {sub && <p style={{ fontSize: '10px', color, marginTop: '3px', fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}

function Badge({ status, map }: { status: string; map: Record<string, { label: string; color: string; bg?: string }> }) {
  const s = map[status] ?? { label: status, color: 'var(--dax-text-muted)', bg: 'var(--dax-surface-2)' };
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, color: s.color, background: s.bg ?? `${s.color}18`, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '.04em' }}>
      {s.label}
    </span>
  );
}

function ModalWrap({ onClose, children, maxWidth = '540px' }: { onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dax-card" style={{ width: '100%', maxWidth, padding: '28px 32px', maxHeight: '92vh', overflowY: 'auto', animation: 'modalIn .2s cubic-bezier(.22,1,.36,1)' }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--dax-text-primary)' }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '4px', borderRadius: '6px' }}>
        <X size={18} />
      </button>
    </div>
  );
}

function Empty({ icon: Icon, text, sub }: { icon: any; text: string; sub?: string }) {
  return (
    <div style={{ padding: '52px 24px', textAlign: 'center' }}>
      <Icon size={40} color="var(--dax-text-muted)" style={{ margin: '0 auto 14px', display: 'block', opacity: .25 }} />
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dax-text-muted)', marginBottom: '4px' }}>{text}</p>
      {sub && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', opacity: .7 }}>{sub}</p>}
    </div>
  );
}

function fmtDate(d?: string, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CR', opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ══════════════════════════════════════════
// MODAL: RECETA
// ══════════════════════════════════════════
interface RecipeModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  products: any[];
  initial?: any;
}

function RecipeModal({ onClose, onSave, isPending, products, initial }: RecipeModalProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    yield: initial?.yield ?? 1,
    yieldUnit: initial?.yieldUnit ?? 'unidades',
    prepTime: initial?.prepTime ?? 0,
    ingredients: initial?.ingredients?.map((i: any) => ({ productId: i.productId, quantity: Number(i.quantity), unit: i.unit })) ?? [],
    laborCosts: initial?.laborCosts?.map((l: any) => ({ role: l.role ?? '', hoursPerBatch: Number(l.hoursPerBatch), hourlyRate: Number(l.hourlyRate) })) ?? [],
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addIng = () => setForm(p => ({ ...p, ingredients: [...p.ingredients, { productId: '', quantity: 1, unit: 'kg' }] }));
  const remIng = (i: number) => setForm(p => ({ ...p, ingredients: p.ingredients.filter((_, idx) => idx !== i) }));
  const updIng = (i: number, k: string, v: any) => setForm(p => ({ ...p, ingredients: p.ingredients.map((x, idx) => idx === i ? { ...x, [k]: v } : x) }));

  const addLab = () => setForm(p => ({ ...p, laborCosts: [...p.laborCosts, { role: '', hoursPerBatch: 1, hourlyRate: 0 }] }));
  const remLab = (i: number) => setForm(p => ({ ...p, laborCosts: p.laborCosts.filter((_, idx) => idx !== i) }));
  const updLab = (i: number, k: string, v: any) => setForm(p => ({ ...p, laborCosts: p.laborCosts.map((x, idx) => idx === i ? { ...x, [k]: v } : x) }));

  return (
    <ModalWrap onClose={onClose} maxWidth="660px">
      <ModalHeader title={initial ? 'Editar receta' : 'Nueva receta'} onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div><Label>Nombre</Label>
          <input className="dax-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Pan francés, Croissant de mantequilla..." />
        </div>

        <div><Label optional>Descripción</Label>
          <input className="dax-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción breve del producto..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div><Label>Rendimiento</Label>
            <input className="dax-input" type="number" min="1" value={form.yield} onChange={e => set('yield', parseInt(e.target.value) || 1)} />
          </div>
          <div><Label>Unidad</Label>
            <select className="dax-input" value={form.yieldUnit} onChange={e => set('yieldUnit', e.target.value)}>
              {['unidades', 'kg', 'g', 'porciones', 'panes', 'docenas', 'litros', 'tazas'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div><Label optional>Tiempo (min)</Label>
            <input className="dax-input" type="number" min="0" value={form.prepTime} onChange={e => set('prepTime', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Ingredientes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Label>Ingredientes</Label>
            <button onClick={addIng} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={12} /> Agregar
            </button>
          </div>
          {form.ingredients.length === 0 && (
            <div style={{ padding: '14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Sin ingredientes — agrega al menos uno</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: '8px', alignItems: 'center' }}>
                <select className="dax-input" style={{ margin: 0 }} value={ing.productId} onChange={e => updIng(i, 'productId', e.target.value)}>
                  <option value="">Selecciona producto...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input className="dax-input" style={{ margin: 0 }} type="number" min="0.001" step="0.001" value={ing.quantity} onChange={e => updIng(i, 'quantity', parseFloat(e.target.value) || 0)} placeholder="Cant." />
                <select className="dax-input" style={{ margin: 0 }} value={ing.unit} onChange={e => updIng(i, 'unit', e.target.value)}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <button onClick={() => remIng(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mano de obra */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Label optional>Mano de obra</Label>
            <button onClick={addLab} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={12} /> Agregar
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.laborCosts.map((lc, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 32px', gap: '8px', alignItems: 'center' }}>
                <input className="dax-input" style={{ margin: 0 }} value={lc.role} onChange={e => updLab(i, 'role', e.target.value)} placeholder="Rol (ej: Panadero)" />
                <input className="dax-input" style={{ margin: 0 }} type="number" min="0.5" step="0.5" value={lc.hoursPerBatch} onChange={e => updLab(i, 'hoursPerBatch', parseFloat(e.target.value) || 0)} placeholder="Horas" />
                <input className="dax-input" style={{ margin: 0 }} type="number" min="0" value={lc.hourlyRate} onChange={e => updLab(i, 'hourlyRate', parseFloat(e.target.value) || 0)} placeholder="₡/hora" />
                <button onClick={() => remLab(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={isPending || !form.name || form.ingredients.length === 0} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Guardando...' : initial ? 'Actualizar receta' : 'Crear receta'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// MODAL: PRODUCCIÓN
// ══════════════════════════════════════════
interface ProductionModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  recipes: Recipe[];
  shifts: any[];
  branches: any[];
  initialRecipeId?: string;
}

function ProductionModal({ onClose, onSave, isPending, recipes, shifts, branches, initialRecipeId }: ProductionModalProps) {
  const [form, setForm] = useState({ recipeId: initialRecipeId ?? '', branchId: '', shiftId: '', quantity: 1, plannedAt: '', notes: '' });
  const [availability, setAvailability] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const checkAvailability = async () => {
    if (!form.recipeId) return;
    setChecking(true);
    try {
      const params = new URLSearchParams({ quantity: String(form.quantity) });
      if (form.branchId) params.append('branchId', form.branchId);
      const { data } = await api.get(`/bakery/recipes/${form.recipeId}/availability?${params}`);
      setAvailability(data);
    } catch { }
    setChecking(false);
  };

  const selectedRecipe = recipes.find(r => r.id === form.recipeId);

  return (
    <ModalWrap onClose={onClose} maxWidth="500px">
      <ModalHeader title="Planificar producción" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><Label>Receta</Label>
          <select className="dax-input" value={form.recipeId} onChange={e => { set('recipeId', e.target.value); setAvailability(null); }}>
            <option value="">Selecciona una receta...</option>
            {recipes.map(r => <option key={r.id} value={r.id}>{r.name} — rinde {r.yield} {r.yieldUnit}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><Label>Cantidad de lotes</Label>
            <input className="dax-input" type="number" min="1" value={form.quantity} onChange={e => { set('quantity', parseInt(e.target.value) || 1); setAvailability(null); }} />
            {selectedRecipe && (
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
                = {form.quantity * selectedRecipe.yield} {selectedRecipe.yieldUnit}
              </p>
            )}
          </div>
          <div><Label optional>Sucursal</Label>
            <select className="dax-input" value={form.branchId} onChange={e => set('branchId', e.target.value)}>
              <option value="">Sin sucursal</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* Verificar disponibilidad */}
        {form.recipeId && (
          <div>
            <button onClick={checkAvailability} disabled={checking} style={{ background: 'none', border: '1px solid var(--dax-border)', borderRadius: 'var(--dax-radius-md)', padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={12} className={checking ? 'spin' : ''} />
              {checking ? 'Verificando...' : 'Verificar disponibilidad de ingredientes'}
            </button>
            {availability && (
              <div style={{ marginTop: '10px', padding: '12px', background: availability.canProduce ? 'rgba(61,191,127,.06)' : 'rgba(224,80,80,.06)', border: `1px solid ${availability.canProduce ? 'rgba(61,191,127,.2)' : 'rgba(224,80,80,.2)'}`, borderRadius: 'var(--dax-radius-md)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: availability.canProduce ? '#3DBF7F' : '#E05050', marginBottom: '8px' }}>
                  {availability.canProduce ? '✅ Stock suficiente' : '⚠️ Stock insuficiente'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {availability.ingredients.map((ing: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)' }}>{ing.productName}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: ing.sufficient ? '#3DBF7F' : '#E05050' }}>
                        {ing.available} / {ing.required} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div><Label optional>Turno</Label>
          <select className="dax-input" value={form.shiftId} onChange={e => set('shiftId', e.target.value)}>
            <option value="">Sin turno específico</option>
            {shifts.map((s: any) => {
              const sl = SHIFT_LABELS[s.shift];
              return <option key={s.id} value={s.id}>{sl?.emoji} {sl?.label} ({sl?.time}) · {fmtDate(s.date)}</option>;
            })}
          </select>
        </div>

        <div><Label optional>Fecha y hora planificada</Label>
          <input className="dax-input" type="datetime-local" value={form.plannedAt} onChange={e => set('plannedAt', e.target.value)} />
        </div>

        <div><Label optional>Notas</Label>
          <input className="dax-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Instrucciones especiales para este lote..." />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={isPending || !form.recipeId} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Guardando...' : 'Planificar producción'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// MODAL: ENCARGO
// ══════════════════════════════════════════
interface EncargoModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  formatCurrency: (n: number) => string;
}

function EncargoModal({ onClose, onSave, isPending, formatCurrency }: EncargoModalProps) {
  const [form, setForm] = useState({ clientName: '', clientPhone: '', deliveryDate: '', deposit: 0, notes: '', items: [] as any[] });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unit: 'unidades', unitPrice: 0 }] }));
  const remItem = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updItem = (i: number, k: string, v: any) => setForm(p => ({ ...p, items: p.items.map((x, idx) => idx === i ? { ...x, [k]: v } : x) }));

  const total = form.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const balance = total - form.deposit;

  return (
    <ModalWrap onClose={onClose} maxWidth="600px">
      <ModalHeader title="Nuevo encargo" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><Label>Nombre del cliente</Label>
            <input className="dax-input" value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Juan Pérez" />
          </div>
          <div><Label optional>Teléfono</Label>
            <input className="dax-input" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="+506 8888-9999" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><Label>Fecha de entrega</Label>
            <input className="dax-input" type="datetime-local" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
          </div>
          <div><Label optional>Depósito recibido (₡)</Label>
            <input className="dax-input" type="number" min="0" value={form.deposit} onChange={e => set('deposit', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Label>Productos del encargo</Label>
            <button onClick={addItem} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={12} /> Agregar ítem
            </button>
          </div>
          {form.items.length === 0 && (
            <div style={{ padding: '14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Agrega los productos del encargo</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px 32px', gap: '6px', alignItems: 'center' }}>
                <input className="dax-input" style={{ margin: 0 }} value={item.description} onChange={e => updItem(i, 'description', e.target.value)} placeholder="Descripción del producto..." />
                <input className="dax-input" style={{ margin: 0 }} type="number" min="1" value={item.quantity} onChange={e => updItem(i, 'quantity', parseFloat(e.target.value) || 1)} />
                <select className="dax-input" style={{ margin: 0 }} value={item.unit} onChange={e => updItem(i, 'unit', e.target.value)}>
                  {['unidades', 'docenas', 'kg', 'porciones', 'cajas', 'bolsas'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input className="dax-input" style={{ margin: 0 }} type="number" min="0" value={item.unitPrice} onChange={e => updItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="₡ precio" />
                <button onClick={() => remItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {form.items.length > 0 && (
          <div style={{ padding: '12px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Total</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dax-coral)' }}>{formatCurrency(total)}</span>
            </div>
            {form.deposit > 0 && <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Depósito</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#3DBF7F' }}>-{formatCurrency(form.deposit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--dax-border)', paddingTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Saldo pendiente</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: balance > 0 ? '#F0A030' : '#3DBF7F' }}>{formatCurrency(balance)}</span>
              </div>
            </>}
          </div>
        )}

        <div><Label optional>Notas</Label>
          <input className="dax-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Instrucciones especiales, decoraciones, alergias..." />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={isPending || !form.clientName || !form.deliveryDate || form.items.length === 0} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Guardando...' : 'Crear encargo'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// MODAL: MERMA
// ══════════════════════════════════════════
interface WasteModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  products: any[];
  productions: Production[];
}

function WasteModal({ onClose, onSave, isPending, products, productions }: WasteModalProps) {
  const [form, setForm] = useState({ productId: '', productionId: '', quantity: 1, unit: 'unidades', reason: '', reasonCustom: '', cost: 0 });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <ModalWrap onClose={onClose} maxWidth="440px">
      <ModalHeader title="Registrar merma" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><Label>Producto afectado</Label>
          <select className="dax-input" value={form.productId} onChange={e => set('productId', e.target.value)}>
            <option value="">Selecciona producto...</option>
            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div><Label optional>Producción relacionada</Label>
          <select className="dax-input" value={form.productionId} onChange={e => set('productionId', e.target.value)}>
            <option value="">Sin producción específica</option>
            {productions.filter(p => p.status !== 'cancelled').map(p => (
              <option key={p.id} value={p.id}>{p.recipe?.name} x{p.quantity} · {fmtDate(p.plannedAt)}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><Label>Cantidad</Label>
            <input className="dax-input" type="number" min="0.01" step="0.01" value={form.quantity} onChange={e => set('quantity', parseFloat(e.target.value) || 0)} />
          </div>
          <div><Label>Unidad</Label>
            <select className="dax-input" value={form.unit} onChange={e => set('unit', e.target.value)}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div><Label>Causa de la merma</Label>
          <select className="dax-input" value={form.reason} onChange={e => set('reason', e.target.value)}>
            <option value="">Selecciona causa...</option>
            {WASTE_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
          {form.reason === 'Otro' && (
            <input className="dax-input" style={{ marginTop: '8px' }} value={form.reasonCustom} onChange={e => set('reasonCustom', e.target.value)} placeholder="Describe la causa..." />
          )}
        </div>

        <div><Label optional>Costo estimado (₡)</Label>
          <input className="dax-input" type="number" min="0" value={form.cost} onChange={e => set('cost', parseFloat(e.target.value) || 0)} placeholder="0" />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave({ ...form, reason: form.reason === 'Otro' ? form.reasonCustom || 'Otro' : form.reason })} disabled={isPending || !form.reason} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Guardando...' : 'Registrar merma'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// MODAL: PROVEEDOR
// ══════════════════════════════════════════
interface SupplierModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
}

function SupplierModal({ onClose, onSave, isPending }: SupplierModalProps) {
  const [form, setForm] = useState({ name: '', contactName: '', phone: '', email: '', address: '', taxId: '', paymentTerms: '', notes: '' });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <ModalWrap onClose={onClose} maxWidth="500px">
      <ModalHeader title="Nuevo proveedor" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><Label>Nombre del proveedor</Label>
          <input className="dax-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Distribuidora El Molino S.A." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><Label optional>Contacto</Label>
            <input className="dax-input" value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Nombre del contacto" />
          </div>
          <div><Label optional>Teléfono</Label>
            <input className="dax-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+506 2222-3333" />
          </div>
        </div>
        <div><Label optional>Correo</Label>
          <input className="dax-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ventas@proveedor.com" />
        </div>
        <div><Label optional>Dirección</Label>
          <input className="dax-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Dirección física" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><Label optional>Cédula jurídica</Label>
            <input className="dax-input" value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder="3-101-123456" />
          </div>
          <div><Label optional>Términos de pago</Label>
            <select className="dax-input" value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>
              <option value="">Selecciona...</option>
              {['Contado', 'Crédito 8 días', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 60 días'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div><Label optional>Notas</Label>
          <input className="dax-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Información adicional..." />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={isPending || !form.name} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Guardando...' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// MODAL: ORDEN DE COMPRA
// ══════════════════════════════════════════
interface PurchaseOrderModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  suppliers: Supplier[];
  products: any[];
  formatCurrency: (n: number) => string;
}

function PurchaseOrderModal({ onClose, onSave, isPending, suppliers, products, formatCurrency }: PurchaseOrderModalProps) {
  const [form, setForm] = useState({ supplierId: '', expectedAt: '', notes: '', items: [] as any[] });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1, unit: 'kg', unitCost: 0 }] }));
  const remItem = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updItem = (i: number, k: string, v: any) => setForm(p => ({ ...p, items: p.items.map((x, idx) => idx === i ? { ...x, [k]: v } : x) }));

  const total = form.items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

  return (
    <ModalWrap onClose={onClose} maxWidth="600px">
      <ModalHeader title="Nueva orden de compra" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><Label>Proveedor</Label>
            <select className="dax-input" value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
              <option value="">Selecciona proveedor...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><Label optional>Fecha esperada de entrega</Label>
            <input className="dax-input" type="date" value={form.expectedAt} onChange={e => set('expectedAt', e.target.value)} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Label>Ítems de la orden</Label>
            <button onClick={addItem} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={12} /> Agregar ítem
            </button>
          </div>
          {form.items.length === 0 && (
            <div style={{ padding: '14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Agrega los productos a ordenar</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 100px 32px', gap: '6px', alignItems: 'center' }}>
                <select className="dax-input" style={{ margin: 0 }} value={item.productId} onChange={e => updItem(i, 'productId', e.target.value)}>
                  <option value="">Producto...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input className="dax-input" style={{ margin: 0 }} type="number" min="0.1" step="0.1" value={item.quantity} onChange={e => updItem(i, 'quantity', parseFloat(e.target.value) || 0)} placeholder="Cant." />
                <select className="dax-input" style={{ margin: 0 }} value={item.unit} onChange={e => updItem(i, 'unit', e.target.value)}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <input className="dax-input" style={{ margin: 0 }} type="number" min="0" value={item.unitCost} onChange={e => updItem(i, 'unitCost', parseFloat(e.target.value) || 0)} placeholder="₡/unidad" />
                <button onClick={() => remItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          {form.items.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '10px 14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>Total estimado</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dax-coral)' }}>{formatCurrency(total)}</span>
            </div>
          )}
        </div>

        <div><Label optional>Notas</Label>
          <input className="dax-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Instrucciones especiales para el proveedor..." />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={isPending || !form.supplierId || form.items.length === 0} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Guardando...' : 'Crear orden de compra'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// MODAL: MÍNIMO DIARIO
// ══════════════════════════════════════════
interface MinimumModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  recipes: Recipe[];
}

function MinimumModal({ onClose, onSave, isPending, recipes }: MinimumModalProps) {
  const [form, setForm] = useState({ recipeId: '', quantity: 1, shift: '' });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const selectedRecipe = recipes.find(r => r.id === form.recipeId);

  return (
    <ModalWrap onClose={onClose} maxWidth="400px">
      <ModalHeader title="Configurar mínimo diario" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><Label>Receta</Label>
          <select className="dax-input" value={form.recipeId} onChange={e => set('recipeId', e.target.value)}>
            <option value="">Selecciona receta...</option>
            {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div><Label>Cantidad mínima por día</Label>
          <input className="dax-input" type="number" min="1" value={form.quantity} onChange={e => set('quantity', parseInt(e.target.value) || 1)} />
          {selectedRecipe && (
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
              = {form.quantity} lotes · {form.quantity * selectedRecipe.yield} {selectedRecipe.yieldUnit}
            </p>
          )}
        </div>
        <div><Label optional>Turno específico</Label>
          <select className="dax-input" value={form.shift} onChange={e => set('shift', e.target.value)}>
            <option value="">Todos los turnos</option>
            {Object.entries(SHIFT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label} ({v.time})</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={isPending || !form.recipeId} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Guardando...' : 'Guardar mínimo'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// MODAL: TURNO
// ══════════════════════════════════════════
interface ShiftModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
  branches: any[];
}

function ShiftModal({ onClose, onSave, isPending, branches }: ShiftModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ shift: 'morning', date: today, branchId: '', notes: '' });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <ModalWrap onClose={onClose} maxWidth="400px">
      <ModalHeader title="Abrir turno de producción" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><Label>Turno</Label>
          <select className="dax-input" value={form.shift} onChange={e => set('shift', e.target.value)}>
            {Object.entries(SHIFT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label} ({v.time})</option>)}
          </select>
        </div>
        <div><Label>Fecha</Label>
          <input className="dax-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div><Label optional>Sucursal</Label>
          <select className="dax-input" value={form.branchId} onChange={e => set('branchId', e.target.value)}>
            <option value="">Sin sucursal</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div><Label optional>Notas</Label>
          <input className="dax-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas del turno..." />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={isPending} className="dax-btn-primary" style={{ flex: 2 }}>
            {isPending ? 'Abriendo...' : 'Abrir turno'}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

// ══════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════
export default function BakeryPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('dashboard');

  // Modales
  const [modal, setModal] = useState<string | null>(null);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [prodInitRecipeId, setProdInitRecipeId] = useState<string | undefined>();

  const closeModal = useCallback(() => { setModal(null); setEditRecipe(null); setProdInitRecipeId(undefined); }, []);

  // ── Queries ──────────────────────────────
  const { data: stats } = useQuery({ queryKey: ['bakery-stats'], queryFn: async () => (await api.get('/bakery/stats')).data });
  const { data: recipes = [] } = useQuery({ queryKey: ['bakery-recipes'], queryFn: async () => (await api.get('/bakery/recipes')).data });
  const { data: productions = [] } = useQuery({ queryKey: ['bakery-prods'], queryFn: async () => (await api.get('/bakery/productions')).data });
  const { data: dailyPlan } = useQuery({ queryKey: ['bakery-daily'], queryFn: async () => (await api.get('/bakery/productions/daily-plan')).data });
  const { data: encargos = [] } = useQuery({ queryKey: ['bakery-encargos'], queryFn: async () => (await api.get('/bakery/encargos')).data });
  const { data: wastes = [] } = useQuery({ queryKey: ['bakery-wastes'], queryFn: async () => (await api.get('/bakery/wastes')).data });
  const { data: wasteStats } = useQuery({ queryKey: ['bakery-ws'], queryFn: async () => (await api.get('/bakery/wastes/stats')).data });
  const { data: suppliers = [] } = useQuery({ queryKey: ['bakery-suppliers'], queryFn: async () => (await api.get('/bakery/suppliers')).data });
  const { data: minimums = [] } = useQuery({ queryKey: ['bakery-mins'], queryFn: async () => (await api.get('/bakery/minimums')).data });
  const { data: orders = [] } = useQuery({ queryKey: ['bakery-orders'], queryFn: async () => (await api.get('/bakery/purchase-orders')).data });
  const { data: shifts = [] } = useQuery({ queryKey: ['bakery-shifts'], queryFn: async () => (await api.get('/bakery/shifts')).data });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get('/products')).data });
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: async () => (await api.get('/branches')).data });

  const inv = (keys: string[]) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));

  // ── Mutations ────────────────────────────
  const recipeMutation = useMutation({
    mutationFn: (data: any) => editRecipe ? api.put(`/bakery/recipes/${editRecipe.id}`, data) : api.post('/bakery/recipes', data),
    onSuccess: () => { inv(['bakery-recipes', 'bakery-stats']); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bakery/recipes/${id}`),
    onSuccess: () => inv(['bakery-recipes']),
  });

  const productionMutation = useMutation({
    mutationFn: (data: any) => api.post('/bakery/productions', data),
    onSuccess: () => { inv(['bakery-prods', 'bakery-daily', 'bakery-stats']); closeModal(); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/bakery/productions/${id}/status`, { status }),
    onSuccess: () => inv(['bakery-prods', 'bakery-daily', 'bakery-stats']),
  });

  const encargoMutation = useMutation({
    mutationFn: (data: any) => api.post('/bakery/encargos', data),
    onSuccess: () => { inv(['bakery-encargos', 'bakery-stats']); closeModal(); },
  });

  const encargoStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/bakery/encargos/${id}/status`, { status }),
    onSuccess: () => inv(['bakery-encargos', 'bakery-stats']),
  });

  const wasteMutation = useMutation({
    mutationFn: (data: any) => api.post('/bakery/wastes', data),
    onSuccess: () => { inv(['bakery-wastes', 'bakery-ws', 'bakery-stats']); closeModal(); },
  });

  const supplierMutation = useMutation({
    mutationFn: (data: any) => api.post('/bakery/suppliers', data),
    onSuccess: () => { inv(['bakery-suppliers']); closeModal(); },
  });

  const orderMutation = useMutation({
    mutationFn: (data: any) => api.post('/bakery/purchase-orders', data),
    onSuccess: () => { inv(['bakery-orders']); closeModal(); },
  });

  const minimumMutation = useMutation({
    mutationFn: (data: any) => api.post('/bakery/minimums', data),
    onSuccess: () => { inv(['bakery-mins']); closeModal(); },
  });

  const deleteMinimumMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bakery/minimums/${id}`),
    onSuccess: () => inv(['bakery-mins']),
  });

  const shiftMutation = useMutation({
    mutationFn: (data: any) => api.post('/bakery/shifts', data),
    onSuccess: () => { inv(['bakery-shifts']); closeModal(); },
  });

  const closeShiftMutation = useMutation({
    mutationFn: (id: string) => api.put(`/bakery/shifts/${id}/close`),
    onSuccess: () => inv(['bakery-shifts']),
  });

  // ── Helpers ──────────────────────────────
  const nextStatus: Record<string, string> = { planned: 'in_progress', in_progress: 'completed' };
  const nextStatusLabel: Record<string, string> = { planned: '▶ Iniciar', in_progress: '✓ Completar' };

  const urgentEncargos = (encargos as Encargo[]).filter(e => {
    const d = daysUntil(e.deliveryDate);
    return d <= 2 && !['delivered', 'cancelled'].includes(e.status);
  });

  // ── Tabs ─────────────────────────────────
  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'production', label: 'Producción', icon: ChefHat, badge: stats?.pending },
    { id: 'recipes', label: 'Recetas', icon: ClipboardList, badge: (recipes as any[]).length },
    { id: 'encargos', label: 'Encargos', icon: ShoppingBag, badge: urgentEncargos.length || undefined },
    { id: 'wastes', label: 'Mermas', icon: AlertTriangle },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'orders', label: 'Compras', icon: Package },
    { id: 'minimums', label: 'Mínimos', icon: Calendar },
  ];

  return (
    <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1240px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--dax-radius-lg)', background: 'var(--dax-coral-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--dax-coral-border)' }}>
            <ChefHat size={24} color="var(--dax-coral)" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, marginBottom: '2px', letterSpacing: '-.01em' }}>Panadería y Pastelería</h1>
            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Control de producción, recetas, encargos y más</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tab === 'production' && <>
            <button onClick={() => setModal('shift')} className="dax-btn-secondary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={13} /> Turno</button>
            <button onClick={() => setModal('production')} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Producción</button>
          </>}
          {tab === 'recipes' && <button onClick={() => { setEditRecipe(null); setModal('recipe'); }} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nueva receta</button>}
          {tab === 'encargos' && <button onClick={() => setModal('encargo')} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nuevo encargo</button>}
          {tab === 'wastes' && <button onClick={() => setModal('waste')} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Registrar merma</button>}
          {tab === 'suppliers' && <button onClick={() => setModal('supplier')} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nuevo proveedor</button>}
          {tab === 'orders' && <button onClick={() => setModal('order')} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nueva orden</button>}
          {tab === 'minimums' && <button onClick={() => setModal('minimum')} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Configurar mínimo</button>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '28px', paddingBottom: '4px' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? 'var(--dax-coral)' : 'var(--dax-surface)', color: active ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0, position: 'relative' }}>
              <Icon size={13} />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{ background: active ? 'rgba(255,255,255,.3)' : 'var(--dax-coral)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '8px', lineHeight: 1.4 }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════
          TAB: DASHBOARD
      ══════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '14px' }}>
            <StatCard label="Producidos hoy" value={stats?.todayProd ?? 0} icon={CheckCircle} color="#3DBF7F" sub={stats?.todayProd > 0 ? 'lotes completados' : undefined} />
            <StatCard label="Este mes" value={stats?.monthProd ?? 0} icon={TrendingUp} color="var(--dax-coral)" />
            <StatCard label="En progreso / pendientes" value={stats?.pending ?? 0} icon={Clock} color="#F0A030" />
            <StatCard label="Encargos activos" value={stats?.upcomingEncargos ?? 0} icon={ShoppingBag} color="#5AAAF0" sub={urgentEncargos.length > 0 ? `⚠️ ${urgentEncargos.length} urgentes` : undefined} />
            <StatCard label="Mermas este mes" value={stats?.wasteCount ?? 0} icon={AlertTriangle} color="#E05050" sub={stats?.wasteCost > 0 ? formatCurrency(stats.wasteCost) : undefined} />
          </div>

          {/* Alerta encargos urgentes */}
          {urgentEncargos.length > 0 && (
            <div className="dax-card" style={{ padding: '18px 22px', border: '1px solid rgba(224,80,80,.25)', background: 'rgba(224,80,80,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangle size={15} color="#E05050" />
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#E05050' }}>Encargos urgentes — próximas 48 horas</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {urgentEncargos.map((enc: Encargo) => {
                  const d = daysUntil(enc.deliveryDate);
                  return (
                    <div key={enc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{enc.clientName}</p>
                        <p style={{ fontSize: '11px', color: d <= 0 ? '#E05050' : '#F0A030', fontWeight: 600 }}>
                          {d <= 0 ? '🚨 ¡Vence HOY!' : `⏰ Vence en ${d} día${d !== 1 ? 's' : ''}`} · {fmtDate(enc.deliveryDate, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Badge status={enc.status} map={STATUS_ENCARGO} />
                        <button onClick={() => setTab('encargos')} className="dax-btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}>Ver encargo</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alertas mínimos sin cubrir */}
          {dailyPlan?.uncoveredMinimums?.length > 0 && (
            <div className="dax-card" style={{ padding: '18px 22px', border: '1px solid rgba(240,160,48,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertCircle size={15} color="#F0A030" />
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0A030' }}>Mínimos diarios sin cubrir ({dailyPlan.uncoveredMinimums.length})</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dailyPlan.uncoveredMinimums.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(240,160,48,.06)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{m.recipe?.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                        Producido: <strong style={{ color: 'var(--dax-text-primary)' }}>{m.produced}</strong> · Mínimo: <strong style={{ color: '#F0A030' }}>{m.quantity}</strong> {m.recipe?.yieldUnit}
                      </p>
                    </div>
                    <button onClick={() => { setProdInitRecipeId(m.recipeId); setModal('production'); }} className="dax-btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                      Planificar ahora
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan del día */}
          <div className="dax-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="var(--dax-coral)" />
                <p style={{ fontSize: '14px', fontWeight: 700 }}>Plan de producción de hoy</p>
              </div>
              {dailyPlan?.productions?.length > 0 && (
                <span style={{ fontSize: '11px', background: 'var(--dax-coral-soft)', color: 'var(--dax-coral)', padding: '2px 10px', borderRadius: '10px', fontWeight: 600 }}>
                  {dailyPlan.productions.length} lotes
                </span>
              )}
            </div>
            {!dailyPlan?.productions?.length ? (
              <Empty icon={ChefHat} text="Sin producciones para hoy" sub="Planifica una producción desde la pestaña Producción" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dailyPlan.productions.map((prod: Production) => {
                  const sc = STATUS_PROD[prod.status];
                  return (
                    <div key={prod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{prod.recipe?.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                            {prod.quantity} lotes
                            {prod.shift && ` · ${SHIFT_LABELS[prod.shift.shift]?.emoji} ${SHIFT_LABELS[prod.shift.shift]?.label}`}
                            {prod.plannedAt && ` · ${new Date(prod.plannedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge status={prod.status} map={STATUS_PROD} />
                        {nextStatus[prod.status] && (
                          <button onClick={() => statusMutation.mutate({ id: prod.id, status: nextStatus[prod.status] })} disabled={statusMutation.isPending} className="dax-btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                            {nextStatusLabel[prod.status]}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top recetas */}
          {stats?.topRecipes?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={15} color="var(--dax-coral)" />
                <p style={{ fontSize: '14px', fontWeight: 700 }}>Recetas más producidas</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.topRecipes.map((r: any, i: number) => {
                  const maxQ = stats.topRecipes[0]?.totalQuantity ?? 1;
                  const pct = (r.totalQuantity / maxQ) * 100;
                  const medals = ['🥇', '🥈', '🥉', '', ''];
                  return (
                    <div key={r.recipeId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px' }}>{medals[i]}</span>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{r.name}</p>
                          <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{r.timesProduced}x producida</span>
                        </div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)' }}>{r.totalQuantity} {r.yieldUnit}</p>
                      </div>
                      <div style={{ height: '4px', background: 'var(--dax-surface-2)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? 'var(--dax-coral)' : 'var(--dax-border)', borderRadius: '2px', transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: PRODUCCIÓN
      ══════════════════════════════════════ */}
      {tab === 'production' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Turnos abiertos */}
          {(shifts as any[]).filter(s => s.status !== 'closed').length > 0 && (
            <div className="dax-card" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>Turnos abiertos</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(shifts as any[]).filter(s => s.status !== 'closed').map((s: any) => {
                  const sl = SHIFT_LABELS[s.shift];
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: 'rgba(61,191,127,.08)', border: '1px solid rgba(61,191,127,.2)', borderRadius: 'var(--dax-radius-md)' }}>
                      <span style={{ fontSize: '13px' }}>{sl?.emoji}</span>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{sl?.label} ({sl?.time})</p>
                        <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{fmtDate(s.date)} · {s.productions?.length ?? 0} producciones</p>
                      </div>
                      <button onClick={() => closeShiftMutation.mutate(s.id)} style={{ background: 'none', border: '1px solid var(--dax-border)', borderRadius: 'var(--dax-radius-md)', padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)', cursor: 'pointer' }}>
                        Cerrar turno
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="dax-card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>{(productions as Production[]).length} registros totales</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['planned', 'in_progress', 'completed'].map(s => {
                  const count = (productions as Production[]).filter(p => p.status === s).length;
                  const sc = STATUS_PROD[s];
                  return count > 0 ? (
                    <span key={s} style={{ fontSize: '10px', fontWeight: 700, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: '10px' }}>
                      {sc.label}: {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            <div className="dax-table-wrap">
              <table className="dax-table">
                <thead>
                  <tr>
                    <th>Receta</th>
                    <th>Cantidad</th>
                    <th>Turno</th>
                    <th>Planificado</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(productions as Production[]).length === 0 ? (
                    <tr><td colSpan={6}><Empty icon={ChefHat} text="Sin producciones" sub="Planifica la primera desde el botón superior" /></td></tr>
                  ) : (productions as Production[]).map(prod => (
                    <tr key={prod.id}>
                      <td>
                        <p style={{ fontWeight: 600, marginBottom: '1px' }}>{prod.recipe?.name ?? '—'}</p>
                        {prod.branch && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{prod.branch.name}</p>}
                        {prod.notes && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', fontStyle: 'italic' }}>{prod.notes}</p>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{prod.quantity}</span>
                        <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginLeft: '3px' }}>{prod.recipe?.yieldUnit}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                        {prod.shift ? `${SHIFT_LABELS[prod.shift.shift]?.emoji} ${SHIFT_LABELS[prod.shift.shift]?.label}` : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                        {prod.plannedAt ? new Date(prod.plannedAt).toLocaleString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td><Badge status={prod.status} map={STATUS_PROD} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {nextStatus[prod.status] && (
                            <button onClick={() => statusMutation.mutate({ id: prod.id, status: nextStatus[prod.status] })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'var(--dax-coral)' }}>
                              {nextStatusLabel[prod.status]}
                            </button>
                          )}
                          {prod.status === 'planned' && (
                            <button onClick={() => statusMutation.mutate({ id: prod.id, status: 'cancelled' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--dax-danger)' }}>
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: RECETAS
      ══════════════════════════════════════ */}
      {tab === 'recipes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
          {(recipes as Recipe[]).length === 0 ? (
            <div className="dax-card" style={{ gridColumn: '1/-1' }}>
              <Empty icon={ClipboardList} text="Sin recetas" sub="Crea tu primera receta con ingredientes y costos" />
            </div>
          ) : (recipes as Recipe[]).map(recipe => (
            <div key={recipe.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dax-text-primary)', marginBottom: '3px', letterSpacing: '-.01em' }}>{recipe.name}</p>
                  {recipe.description && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.5 }}>{recipe.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => { setEditRecipe(recipe); setModal('recipe'); }} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 'var(--dax-radius-md)', color: 'var(--dax-text-muted)', display: 'flex' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => { if (confirm(`¿Eliminar receta "${recipe.name}"?`)) deleteMutation.mutate(recipe.id); }} style={{ background: 'rgba(224,80,80,.08)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 'var(--dax-radius-md)', color: 'var(--dax-danger)', display: 'flex' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Métricas de la receta */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Rinde', value: `${recipe.yield} ${recipe.yieldUnit}` },
                  recipe.prepTime ? { label: 'Tiempo', value: `${recipe.prepTime}min` } : null,
                  recipe.cost ? { label: 'Costo/u', value: formatCurrency(Number(recipe.cost)) } : null,
                  recipe._count?.productions ? { label: 'Producciones', value: String(recipe._count.productions) } : null,
                ].filter(Boolean).map((item: any, i) => (
                  <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '5px 10px' }}>
                    <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', marginBottom: '1px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Ingredientes */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '7px' }}>
                  Ingredientes ({recipe.ingredients.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {recipe.ingredients.slice(0, 4).map((ing: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{ing.product?.name ?? ing.productId}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{Number(ing.quantity)} {ing.unit}</span>
                    </div>
                  ))}
                  {recipe.ingredients.length > 4 && (
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>+{recipe.ingredients.length - 4} ingredientes más</p>
                  )}
                </div>
              </div>

              {/* Mano de obra */}
              {recipe.laborCosts?.length > 0 && (
                <div style={{ marginBottom: '14px', padding: '8px 12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '5px' }}>Mano de obra</p>
                  {recipe.laborCosts.map((lc: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)' }}>{lc.role || 'Operario'}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{Number(lc.hoursPerBatch)}h · {formatCurrency(Number(lc.hourlyRate))}/h</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => { setProdInitRecipeId(recipe.id); setModal('production'); }} className="dax-btn-secondary" style={{ width: '100%', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Play size={12} /> Planificar producción
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: ENCARGOS
      ══════════════════════════════════════ */}
      {tab === 'encargos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(encargos as Encargo[]).length === 0 ? (
            <div className="dax-card"><Empty icon={ShoppingBag} text="Sin encargos" sub="Registra pedidos personalizados de clientes" /></div>
          ) : (encargos as Encargo[]).map(enc => {
            const sc = STATUS_ENCARGO[enc.status];
            const balance = Number(enc.totalAmount) - Number(enc.deposit);
            const dLeft = daysUntil(enc.deliveryDate);
            const isUrgent = dLeft <= 2 && !['delivered', 'cancelled'].includes(enc.status);
            return (
              <div key={enc.id} className="dax-card" style={{ padding: '20px 24px', border: isUrgent ? '1px solid rgba(224,80,80,.3)' : '1px solid var(--dax-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <Badge status={enc.status} map={STATUS_ENCARGO} />
                      <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dax-text-primary)' }}>{enc.clientName}</p>
                      {isUrgent && <span style={{ fontSize: '10px', fontWeight: 700, color: '#E05050', background: 'rgba(224,80,80,.1)', padding: '2px 8px', borderRadius: '8px' }}>⚠️ URGENTE</span>}
                    </div>
                    {enc.clientPhone && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>📞 {enc.clientPhone}</p>}
                    <p style={{ fontSize: '12px', color: isUrgent ? '#E05050' : 'var(--dax-text-muted)' }}>
                      🗓 Entrega: <strong style={{ color: 'var(--dax-text-primary)' }}>
                        {fmtDate(enc.deliveryDate, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </strong>
                      {dLeft > 0 && !['delivered', 'cancelled'].includes(enc.status) && <span style={{ marginLeft: '8px', color: dLeft <= 2 ? '#E05050' : 'var(--dax-text-muted)' }}>({dLeft}d)</span>}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dax-coral)' }}>{formatCurrency(Number(enc.totalAmount))}</p>
                    <p style={{ fontSize: '11px', color: '#3DBF7F' }}>Depósito: {formatCurrency(Number(enc.deposit))}</p>
                    {balance > 0 && <p style={{ fontSize: '12px', fontWeight: 700, color: '#F0A030' }}>Saldo: {formatCurrency(balance)}</p>}
                  </div>
                </div>

                {/* Items */}
                <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '12px', marginBottom: '12px' }}>
                  {enc.items.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{item.description} · {Number(item.quantity)} {item.unit}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{formatCurrency(Number(item.subtotal))}</span>
                    </div>
                  ))}
                  {enc.notes && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '6px', fontStyle: 'italic' }}>📝 {enc.notes}</p>}
                </div>

                {/* Acciones de estado */}
                {!['delivered', 'cancelled'].includes(enc.status) && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ENCARGO_STATUSES.filter(s => s !== enc.status).map(s => (
                      <button key={s} onClick={() => encargoStatusMutation.mutate({ id: enc.id, status: s })} disabled={encargoStatusMutation.isPending} className="dax-btn-secondary" style={{ fontSize: '11px', padding: '6px 12px', color: STATUS_ENCARGO[s]?.color }}>
                        → {STATUS_ENCARGO[s]?.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: MERMAS
      ══════════════════════════════════════ */}
      {tab === 'wastes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {wasteStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
              <StatCard label="Total mermas" value={wasteStats.totalWastes} icon={AlertTriangle} color="#E05050" />
              <StatCard label="Este mes" value={wasteStats.monthCount} icon={Clock} color="#F0A030" />
              <StatCard label="Costo del mes" value={formatCurrency(wasteStats.monthCost)} icon={DollarSign} color="var(--dax-coral)" />
              {wasteStats.byReason?.length > 0 && (
                <div className="dax-card" style={{ padding: '16px 20px', gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>Causas principales</p>
                  {wasteStats.byReason.map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{r.reason}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{r.count}x</span>
                        {r.cost > 0 && <span style={{ fontSize: '10px', color: '#E05050' }}>{formatCurrency(r.cost)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="dax-card">
            <div className="dax-table-wrap">
              <table className="dax-table">
                <thead>
                  <tr><th>Producto / Producción</th><th>Cantidad</th><th>Causa</th><th>Costo</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {(wastes as Waste[]).length === 0 ? (
                    <tr><td colSpan={5}><Empty icon={AlertTriangle} text="Sin mermas registradas" /></td></tr>
                  ) : (wastes as Waste[]).map(w => (
                    <tr key={w.id}>
                      <td>
                        <p style={{ fontWeight: 600 }}>{w.product?.name ?? w.production?.recipe?.name ?? '—'}</p>
                        {w.branch && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{w.branch.name}</p>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{Number(w.quantity)} <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', fontWeight: 400 }}>{w.unit}</span></td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{w.reason}</td>
                      <td style={{ color: '#E05050', fontWeight: 700 }}>{w.cost ? formatCurrency(Number(w.cost)) : '—'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{fmtDate(w.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: PROVEEDORES
      ══════════════════════════════════════ */}
      {tab === 'suppliers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {(suppliers as Supplier[]).length === 0 ? (
            <div className="dax-card" style={{ gridColumn: '1/-1' }}>
              <Empty icon={Truck} text="Sin proveedores" sub="Registra tus proveedores de materias primas" />
            </div>
          ) : (suppliers as Supplier[]).map(sup => (
            <div key={sup.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{sup.name}</p>
                  {sup.contactName && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{sup.contactName}</p>}
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#3DBF7F', background: 'rgba(61,191,127,.1)', padding: '3px 10px', borderRadius: '10px' }}>Activo</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sup.phone && <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>📞 {sup.phone}</p>}
                {sup.email && <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>✉ {sup.email}</p>}
                {sup.address && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📍 {sup.address}</p>}
                {sup.taxId && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>🏢 {sup.taxId}</p>}
                {sup.paymentTerms && (
                  <div style={{ marginTop: '6px', padding: '5px 10px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', display: 'inline-block' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#5AAAF0' }}>💳 {sup.paymentTerms}</p>
                  </div>
                )}
                {(sup._count?.purchaseOrders ?? 0) > 0 && (
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{sup._count!.purchaseOrders} órdenes de compra</p>
                )}
              </div>
              {sup.notes && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '8px', fontStyle: 'italic', padding: '8px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>{sup.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: ÓRDENES DE COMPRA
      ══════════════════════════════════════ */}
      {tab === 'orders' && (
        <div className="dax-card">
          <div className="dax-table-wrap">
            <table className="dax-table">
              <thead>
                <tr><th>Proveedor</th><th>Ítems</th><th>Total</th><th>Entrega esperada</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {(orders as any[]).length === 0 ? (
                  <tr><td colSpan={5}><Empty icon={Package} text="Sin órdenes de compra" sub="Crea órdenes para reponer tus materias primas" /></td></tr>
                ) : (orders as any[]).map(order => (
                  <tr key={order.id}>
                    <td>
                      <p style={{ fontWeight: 600 }}>{order.supplier?.name ?? '—'}</p>
                      {order.branch && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{order.branch.name}</p>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {order.items?.slice(0, 2).map((item: any, i: number) => (
                          <p key={i} style={{ fontSize: '11px', color: 'var(--dax-text-secondary)' }}>{item.product?.name} · {Number(item.quantity)} {item.unit}</p>
                        ))}
                        {order.items?.length > 2 && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>+{order.items.length - 2} más</p>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--dax-coral)' }}>{formatCurrency(Number(order.total))}</td>
                    <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{fmtDate(order.expectedAt)}</td>
                    <td>
                      <Badge status={order.status ?? 'pending'} map={STATUS_ORDER} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: MÍNIMOS DIARIOS
      ══════════════════════════════════════ */}
      {tab === 'minimums' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px 16px', background: 'rgba(90,170,240,.06)', border: '1px solid rgba(90,170,240,.15)', borderRadius: 'var(--dax-radius-md)' }}>
            <p style={{ fontSize: '12px', color: '#5AAAF0', lineHeight: 1.6 }}>
              💡 Los mínimos diarios te alertan cuando una receta no ha alcanzado su producción objetivo del día. Aparecen en el dashboard con opción de planificar rápidamente.
            </p>
          </div>
          <div className="dax-card">
            <div className="dax-table-wrap">
              <table className="dax-table">
                <thead>
                  <tr><th>Receta</th><th>Mínimo</th><th>Turno</th><th style={{ textAlign: 'center' }}>Eliminar</th></tr>
                </thead>
                <tbody>
                  {(minimums as any[]).length === 0 ? (
                    <tr><td colSpan={4}><Empty icon={Calendar} text="Sin mínimos configurados" sub="Configura la producción mínima diaria por receta" /></td></tr>
                  ) : (minimums as any[]).map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700 }}>{m.recipe?.name}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{m.quantity}</span>
                        <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginLeft: '4px' }}>{m.recipe?.yieldUnit}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                        {m.shift ? `${SHIFT_LABELS[m.shift]?.emoji} ${SHIFT_LABELS[m.shift]?.label}` : 'Todos los turnos'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => deleteMinimumMutation.mutate(m.id)} disabled={deleteMinimumMutation.isPending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', margin: '0 auto', padding: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODALES
      ══════════════════════════════════════ */}
      {modal === 'recipe' && typeof window !== 'undefined' && (
        <RecipeModal
          onClose={closeModal}
          onSave={data => recipeMutation.mutate(data)}
          isPending={recipeMutation.isPending}
          products={products}
          initial={editRecipe}
        />
      )}

      {modal === 'production' && typeof window !== 'undefined' && (
        <ProductionModal
          onClose={closeModal}
          onSave={data => productionMutation.mutate(data)}
          isPending={productionMutation.isPending}
          recipes={recipes}
          shifts={shifts}
          branches={branches}
          initialRecipeId={prodInitRecipeId}
        />
      )}

      {modal === 'encargo' && typeof window !== 'undefined' && (
        <EncargoModal
          onClose={closeModal}
          onSave={data => encargoMutation.mutate(data)}
          isPending={encargoMutation.isPending}
          formatCurrency={formatCurrency}
        />
      )}

      {modal === 'waste' && typeof window !== 'undefined' && (
        <WasteModal
          onClose={closeModal}
          onSave={data => wasteMutation.mutate(data)}
          isPending={wasteMutation.isPending}
          products={products}
          productions={productions}
        />
      )}

      {modal === 'supplier' && typeof window !== 'undefined' && (
        <SupplierModal
          onClose={closeModal}
          onSave={data => supplierMutation.mutate(data)}
          isPending={supplierMutation.isPending}
        />
      )}

      {modal === 'order' && typeof window !== 'undefined' && (
        <PurchaseOrderModal
          onClose={closeModal}
          onSave={data => orderMutation.mutate(data)}
          isPending={orderMutation.isPending}
          suppliers={suppliers}
          products={products}
          formatCurrency={formatCurrency}
        />
      )}

      {modal === 'minimum' && typeof window !== 'undefined' && (
        <MinimumModal
          onClose={closeModal}
          onSave={data => minimumMutation.mutate(data)}
          isPending={minimumMutation.isPending}
          recipes={recipes}
        />
      )}

      {modal === 'shift' && typeof window !== 'undefined' && (
        <ShiftModal
          onClose={closeModal}
          onSave={data => shiftMutation.mutate(data)}
          isPending={shiftMutation.isPending}
          branches={branches}
        />
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin .7s linear infinite; }
      `}</style>
    </div>
  );
}