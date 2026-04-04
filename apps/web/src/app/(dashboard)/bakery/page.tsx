'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  ChefHat, Plus, X, Check, Clock, Package,
  TrendingUp, AlertCircle, Play, CheckCircle,
  Truck, ShoppingBag, AlertTriangle, Users,
  ClipboardList, BarChart2, Calendar,
} from 'lucide-react';

// ── Tipos ──
type Tab = 'dashboard' | 'production' | 'recipes' | 'encargos' | 'wastes' | 'suppliers' | 'minimums';

const STATUS_PROD: Record<string, { label: string; color: string; bg: string }> = {
  planned:     { label: 'Planificado', color: 'var(--dax-text-muted)', bg: 'var(--dax-surface-2)' },
  in_progress: { label: 'En proceso',  color: '#F0A030',              bg: 'rgba(240,160,48,.12)' },
  completed:   { label: 'Completado',  color: 'var(--dax-success)',    bg: 'var(--dax-success-bg)' },
  cancelled:   { label: 'Cancelado',   color: 'var(--dax-danger)',     bg: 'var(--dax-danger-bg)' },
};

const STATUS_ENCARGO: Record<string, { label: string; color: string; bg: string }> = {
  pending:       { label: 'Pendiente',    color: '#F0A030',             bg: 'rgba(240,160,48,.12)' },
  confirmed:     { label: 'Confirmado',   color: '#5AAAF0',             bg: 'rgba(90,170,240,.12)' },
  in_production: { label: 'Produciendo',  color: 'var(--dax-coral)',    bg: 'var(--dax-coral-soft)' },
  ready:         { label: 'Listo',        color: 'var(--dax-success)',  bg: 'var(--dax-success-bg)' },
  delivered:     { label: 'Entregado',    color: 'var(--dax-text-muted)', bg: 'var(--dax-surface-2)' },
  cancelled:     { label: 'Cancelado',    color: 'var(--dax-danger)',   bg: 'var(--dax-danger-bg)' },
};

const SHIFT_LABELS: Record<string, string> = {
  midnight: '🌙 Madrugada (00-06)',
  morning:  '🌅 Mañana (06-12)',
  afternoon:'☀️ Tarde (12-18)',
  evening:  '🌆 Noche (18-00)',
};

const UNITS = ['kg', 'g', 'l', 'ml', 'unidades', 'tazas', 'cucharadas', 'cucharaditas'];

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const SectionTitle = ({ icon: Icon, title, count }: { icon: any; title: string; count?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
    <Icon size={15} color="var(--dax-coral)" />
    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{title}</p>
    {count !== undefined && (
      <span style={{ fontSize: '11px', background: 'var(--dax-coral-soft)', color: 'var(--dax-coral)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
        {count}
      </span>
    )}
  </div>
);

export default function BakeryPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('dashboard');

  // Modales
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showEncargoModal, setShowEncargoModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMinimumModal, setShowMinimumModal] = useState(false);
  const [editRecipe, setEditRecipe] = useState<any>(null);

  // Forms
  const [recipeForm, setRecipeForm] = useState({
    name: '', description: '', yield: 1, yieldUnit: 'unidades', prepTime: 0,
    ingredients: [] as { productId: string; quantity: number; unit: string }[],
    laborCosts: [] as { role: string; hoursPerBatch: number; hourlyRate: number }[],
  });

  const [productionForm, setProductionForm] = useState({
    recipeId: '', quantity: 1, plannedAt: '', notes: '', shiftId: '',
  });

  const [encargoForm, setEncargoForm] = useState({
    clientName: '', clientPhone: '', deliveryDate: '', deposit: 0, notes: '',
    items: [] as { description: string; quantity: number; unit: string; unitPrice: number; productId?: string }[],
  });

  const [wasteForm, setWasteForm] = useState({
    productId: '', quantity: 1, unit: 'unidades', reason: '', cost: 0,
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '', contactName: '', phone: '', email: '', address: '', taxId: '', paymentTerms: '', notes: '',
  });

  const [minimumForm, setMinimumForm] = useState({
    recipeId: '', quantity: 1, shift: '',
  });

  // Queries
  const { data: stats } = useQuery({ queryKey: ['bakery-stats'], queryFn: async () => { const { data } = await api.get('/bakery/stats'); return data; } });
  const { data: recipes = [] } = useQuery({ queryKey: ['bakery-recipes'], queryFn: async () => { const { data } = await api.get('/bakery/recipes'); return data; } });
  const { data: productions = [] } = useQuery({ queryKey: ['bakery-productions'], queryFn: async () => { const { data } = await api.get('/bakery/productions'); return data; } });
  const { data: dailyPlanData } = useQuery({ queryKey: ['bakery-daily'], queryFn: async () => { const { data } = await api.get('/bakery/productions/daily-plan'); return data; } });
  const { data: encargos = [] } = useQuery({ queryKey: ['bakery-encargos'], queryFn: async () => { const { data } = await api.get('/bakery/encargos'); return data; } });
  const { data: wastes = [] } = useQuery({ queryKey: ['bakery-wastes'], queryFn: async () => { const { data } = await api.get('/bakery/wastes'); return data; } });
  const { data: wasteStats } = useQuery({ queryKey: ['bakery-waste-stats'], queryFn: async () => { const { data } = await api.get('/bakery/wastes/stats'); return data; } });
  const { data: suppliers = [] } = useQuery({ queryKey: ['bakery-suppliers'], queryFn: async () => { const { data } = await api.get('/bakery/suppliers'); return data; } });
  const { data: minimums = [] } = useQuery({ queryKey: ['bakery-minimums'], queryFn: async () => { const { data } = await api.get('/bakery/minimums'); return data; } });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: async () => { const { data } = await api.get('/products'); return data; } });
  const { data: shifts = [] } = useQuery({ queryKey: ['bakery-shifts'], queryFn: async () => { const { data } = await api.get('/bakery/shifts'); return data; } });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bakery-stats'] });
    queryClient.invalidateQueries({ queryKey: ['bakery-productions'] });
    queryClient.invalidateQueries({ queryKey: ['bakery-daily'] });
  };

  // Mutations
  const recipeMutation = useMutation({
    mutationFn: async () => editRecipe ? api.put(`/bakery/recipes/${editRecipe.id}`, recipeForm) : api.post('/bakery/recipes', recipeForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bakery-recipes'] }); setShowRecipeModal(false); setEditRecipe(null); setRecipeForm({ name: '', description: '', yield: 1, yieldUnit: 'unidades', prepTime: 0, ingredients: [], laborCosts: [] }); },
  });

  const productionMutation = useMutation({
    mutationFn: async () => api.post('/bakery/productions', productionForm),
    onSuccess: () => { invalidate(); setShowProductionModal(false); setProductionForm({ recipeId: '', quantity: 1, plannedAt: '', notes: '', shiftId: '' }); },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.put(`/bakery/productions/${id}/status`, { status }),
    onSuccess: () => invalidate(),
  });

  const encargoMutation = useMutation({
    mutationFn: async () => api.post('/bakery/encargos', encargoForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bakery-encargos'] }); queryClient.invalidateQueries({ queryKey: ['bakery-stats'] }); setShowEncargoModal(false); setEncargoForm({ clientName: '', clientPhone: '', deliveryDate: '', deposit: 0, notes: '', items: [] }); },
  });

  const encargoStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.put(`/bakery/encargos/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bakery-encargos'] }),
  });

  const wasteMutation = useMutation({
    mutationFn: async () => api.post('/bakery/wastes', wasteForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bakery-wastes'] }); queryClient.invalidateQueries({ queryKey: ['bakery-waste-stats'] }); setShowWasteModal(false); setWasteForm({ productId: '', quantity: 1, unit: 'unidades', reason: '', cost: 0 }); },
  });

  const supplierMutation = useMutation({
    mutationFn: async () => api.post('/bakery/suppliers', supplierForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bakery-suppliers'] }); setShowSupplierModal(false); setSupplierForm({ name: '', contactName: '', phone: '', email: '', address: '', taxId: '', paymentTerms: '', notes: '' }); },
  });

  const minimumMutation = useMutation({
    mutationFn: async () => api.post('/bakery/minimums', minimumForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bakery-minimums'] }); setShowMinimumModal(false); setMinimumForm({ recipeId: '', quantity: 1, shift: '' }); },
  });

  const deleteMinimumMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/bakery/minimums/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bakery-minimums'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/bakery/recipes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bakery-recipes'] }),
  });

  const nextStatus: Record<string, string> = { planned: 'in_progress', in_progress: 'completed' };
  const nextStatusLabel: Record<string, string> = { planned: 'Iniciar', in_progress: 'Completar' };

  const addIngredient = () => setRecipeForm(p => ({ ...p, ingredients: [...p.ingredients, { productId: '', quantity: 1, unit: 'kg' }] }));
  const removeIngredient = (i: number) => setRecipeForm(p => ({ ...p, ingredients: p.ingredients.filter((_, idx) => idx !== i) }));
  const updateIngredient = (i: number, field: string, value: any) => setRecipeForm(p => ({ ...p, ingredients: p.ingredients.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing) }));

  const addLaborCost = () => setRecipeForm(p => ({ ...p, laborCosts: [...p.laborCosts, { role: '', hoursPerBatch: 1, hourlyRate: 0 }] }));
  const removeLaborCost = (i: number) => setRecipeForm(p => ({ ...p, laborCosts: p.laborCosts.filter((_, idx) => idx !== i) }));
  const updateLaborCost = (i: number, field: string, value: any) => setRecipeForm(p => ({ ...p, laborCosts: p.laborCosts.map((lc, idx) => idx === i ? { ...lc, [field]: value } : lc) }));

  const addEncargoItem = () => setEncargoForm(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unit: 'unidades', unitPrice: 0 }] }));
  const removeEncargoItem = (i: number) => setEncargoForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateEncargoItem = (i: number, field: string, value: any) => setEncargoForm(p => ({ ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const encargoTotal = encargoForm.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  const openEditRecipe = (recipe: any) => {
    setEditRecipe(recipe);
    setRecipeForm({
      name: recipe.name, description: recipe.description ?? '', yield: recipe.yield,
      yieldUnit: recipe.yieldUnit, prepTime: recipe.prepTime ?? 0,
      ingredients: recipe.ingredients.map((ing: any) => ({ productId: ing.productId, quantity: Number(ing.quantity), unit: ing.unit })),
      laborCosts: recipe.laborCosts?.map((lc: any) => ({ role: lc.role ?? '', hoursPerBatch: Number(lc.hoursPerBatch), hourlyRate: Number(lc.hourlyRate) })) ?? [],
    });
    setShowRecipeModal(true);
  };

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard',  label: 'Dashboard',   icon: BarChart2 },
    { id: 'production', label: 'Producción',   icon: ChefHat },
    { id: 'recipes',    label: 'Recetas',      icon: ClipboardList },
    { id: 'encargos',   label: 'Encargos',     icon: ShoppingBag },
    { id: 'wastes',     label: 'Mermas',       icon: AlertTriangle },
    { id: 'suppliers',  label: 'Proveedores',  icon: Truck },
    { id: 'minimums',   label: 'Mínimos',      icon: Calendar },
  ];

  return (
    <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--dax-radius-lg)', background: 'var(--dax-coral-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChefHat size={22} color="var(--dax-coral)" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '2px' }}>Panadería y Pastelería</h1>
            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Gestión completa de producción</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tab === 'production' && <button onClick={() => setShowProductionModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Producción</button>}
          {tab === 'recipes' && <button onClick={() => { setEditRecipe(null); setShowRecipeModal(true); }} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Receta</button>}
          {tab === 'encargos' && <button onClick={() => setShowEncargoModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Encargo</button>}
          {tab === 'wastes' && <button onClick={() => setShowWasteModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Merma</button>}
          {tab === 'suppliers' && <button onClick={() => setShowSupplierModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Proveedor</button>}
          {tab === 'minimums' && <button onClick={() => setShowMinimumModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Mínimo</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? 'var(--dax-coral)' : 'var(--dax-surface)', color: active ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0 }}>
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Producciones hoy', value: stats?.todayProd ?? 0, icon: CheckCircle, color: 'var(--dax-success)' },
              { label: 'Este mes', value: stats?.monthProd ?? 0, icon: TrendingUp, color: 'var(--dax-coral)' },
              { label: 'Pendientes', value: stats?.pending ?? 0, icon: Clock, color: '#F0A030' },
              { label: 'Encargos activos', value: stats?.upcomingEncargos ?? 0, icon: ShoppingBag, color: '#5AAAF0' },
              { label: 'Mermas (mes)', value: stats?.wasteCount ?? 0, icon: AlertTriangle, color: 'var(--dax-danger)' },
              { label: 'Costo mermas', value: formatCurrency(stats?.wasteCost ?? 0), icon: BarChart2, color: '#F0A030', isText: true },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="dax-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: 'var(--dax-radius-md)', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={s.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1 }}>{s.isText ? s.value : s.value}</p>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alertas mínimos no cubiertos */}
          {dailyPlanData?.uncoveredMinimums?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(224,80,80,.2)' }}>
              <SectionTitle icon={AlertTriangle} title="Mínimos diarios sin cubrir" count={dailyPlanData.uncoveredMinimums.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dailyPlanData.uncoveredMinimums.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--dax-danger-bg)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{m.recipe?.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                        Producido: {m.produced} · Mínimo: {m.quantity} {m.recipe?.yieldUnit}
                      </p>
                    </div>
                    <button onClick={() => { setProductionForm(p => ({ ...p, recipeId: m.recipeId })); setShowProductionModal(true); }} className="dax-btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                      Planificar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan del día */}
          <div className="dax-card" style={{ padding: '20px 24px' }}>
            <SectionTitle icon={Calendar} title="Plan de producción de hoy" count={dailyPlanData?.productions?.length ?? 0} />
            {!dailyPlanData?.productions?.length ? (
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sin producciones planificadas para hoy</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dailyPlanData.productions.map((p: any) => {
                  const sc = STATUS_PROD[p.status];
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: '10px' }}>{sc.label}</span>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{p.recipe?.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                            {p.quantity} {p.recipe?.yieldUnit}
                            {p.shift && ` · ${SHIFT_LABELS[p.shift.shift]}`}
                            {p.plannedAt && ` · ${new Date(p.plannedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                      {nextStatus[p.status] && (
                        <button onClick={() => statusMutation.mutate({ id: p.id, status: nextStatus[p.status] })} disabled={statusMutation.isPending} className="dax-btn-primary" style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Play size={12} /> {nextStatusLabel[p.status]}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top recetas */}
          {stats?.topRecipes?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <SectionTitle icon={TrendingUp} title="Recetas más producidas" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.topRecipes.map((r: any, i: number) => {
                  const max = stats.topRecipes[0].totalQuantity;
                  const pct = max > 0 ? (r.totalQuantity / max) * 100 : 0;
                  return (
                    <div key={r.recipeId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--dax-coral)' : 'var(--dax-text-muted)' }}>#{i+1}</span>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{r.name}</p>
                        </div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)' }}>{r.totalQuantity} {r.yieldUnit}</p>
                      </div>
                      <div style={{ height: '3px', background: 'var(--dax-surface-2)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? 'var(--dax-coral)' : 'var(--dax-border)', borderRadius: '2px', transition: 'width .5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PRODUCCIÓN ── */}
      {tab === 'production' && (
        <div className="dax-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dax-border)' }}>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>{productions.length} registros</p>
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
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productions.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>No hay producciones</td></tr>
                ) : productions.map((p: any) => {
                  const sc = STATUS_PROD[p.status];
                  return (
                    <tr key={p.id}>
                      <td>
                        <p style={{ fontWeight: 600 }}>{p.recipe?.name ?? '—'}</p>
                        {p.branch && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{p.branch.name}</p>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.quantity} <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', fontWeight: 400 }}>{p.recipe?.yieldUnit}</span></td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                        {p.shift ? SHIFT_LABELS[p.shift.shift]?.split(' ')[0] + ' ' + SHIFT_LABELS[p.shift.shift]?.split(' ')[1] : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                        {p.plannedAt ? new Date(p.plannedAt).toLocaleString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: '10px' }}>{sc.label}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {nextStatus[p.status] && (
                          <button onClick={() => statusMutation.mutate({ id: p.id, status: nextStatus[p.status] })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-coral)' }}>
                            {nextStatusLabel[p.status]}
                          </button>
                        )}
                        {p.status === 'planned' && (
                          <button onClick={() => statusMutation.mutate({ id: p.id, status: 'cancelled' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-danger)', marginLeft: '8px' }}>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: RECETAS ── */}
      {tab === 'recipes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {recipes.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
              <ChefHat size={40} color="var(--dax-text-muted)" style={{ margin: '0 auto 16px', display: 'block', opacity: .4 }} />
              <p style={{ fontSize: '14px', color: 'var(--dax-text-muted)' }}>No hay recetas. Crea la primera.</p>
            </div>
          ) : recipes.map((recipe: any) => (
            <div key={recipe.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>{recipe.name}</p>
                  {recipe.description && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.5 }}>{recipe.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => openEditRecipe(recipe)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-muted)' }}>Editar</button>
                  <button onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(recipe.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-danger)' }}>Eliminar</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Rinde', value: `${recipe.yield} ${recipe.yieldUnit}` },
                  recipe.prepTime && { label: 'Tiempo', value: `${recipe.prepTime} min` },
                  recipe.cost && { label: 'Costo/u', value: formatCurrency(Number(recipe.cost)) },
                ].filter(Boolean).map((item: any, i) => (
                  <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '5px 10px' }}>
                    <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', marginBottom: '1px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--dax-text-muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Ingredientes ({recipe.ingredients.length})
                </p>
                {recipe.ingredients.slice(0, 3).map((ing: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{ing.product?.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{Number(ing.quantity)} {ing.unit}</span>
                  </div>
                ))}
                {recipe.ingredients.length > 3 && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>+{recipe.ingredients.length - 3} más</p>}
              </div>
              {recipe.laborCosts?.length > 0 && (
                <div style={{ marginBottom: '12px', padding: '8px 10px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                  <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>Mano de obra</p>
                  {recipe.laborCosts.map((lc: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)' }}>{lc.role || 'Operario'}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{Number(lc.hoursPerBatch)}h · {formatCurrency(Number(lc.hourlyRate))}/h</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { setProductionForm(p => ({ ...p, recipeId: recipe.id })); setShowProductionModal(true); }} className="dax-btn-secondary" style={{ width: '100%', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <Play size={12} /> Planificar producción
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: ENCARGOS ── */}
      {tab === 'encargos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {encargos.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <ShoppingBag size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay encargos</p>
            </div>
          ) : encargos.map((enc: any) => {
            const sc = STATUS_ENCARGO[enc.status];
            const balance = Number(enc.totalAmount) - Number(enc.deposit);
            return (
              <div key={enc.id} className="dax-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: '10px' }}>{sc.label}</span>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{enc.clientName}</p>
                    </div>
                    {enc.clientPhone && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{enc.clientPhone}</p>}
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>
                      Entrega: <strong style={{ color: 'var(--dax-text-primary)' }}>{new Date(enc.deliveryDate).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dax-coral)' }}>{formatCurrency(Number(enc.totalAmount))}</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Depósito: {formatCurrency(Number(enc.deposit))}</p>
                    {balance > 0 && <p style={{ fontSize: '11px', color: 'var(--dax-warning)' }}>Saldo: {formatCurrency(balance)}</p>}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '10px', marginBottom: '12px' }}>
                  {enc.items.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{item.description} x{Number(item.quantity)} {item.unit}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{formatCurrency(Number(item.subtotal))}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['confirmed', 'in_production', 'ready', 'delivered'].filter(s => s !== enc.status).slice(0, 2).map(s => (
                    <button key={s} onClick={() => encargoStatusMutation.mutate({ id: enc.id, status: s })} className="dax-btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                      → {STATUS_ENCARGO[s]?.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: MERMAS ── */}
      {tab === 'wastes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {wasteStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Total mermas', value: wasteStats.totalWastes, color: 'var(--dax-danger)' },
                { label: 'Este mes', value: wasteStats.monthCount, color: '#F0A030' },
                { label: 'Costo mes', value: formatCurrency(wasteStats.monthCost), color: 'var(--dax-coral)', isText: true },
              ].map((s, i) => (
                <div key={i} className="dax-card" style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{s.label}</p>
                </div>
              ))}
              {wasteStats.byReason?.length > 0 && (
                <div className="dax-card" style={{ padding: '16px 20px', gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Causas principales</p>
                  {wasteStats.byReason.map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{r.reason}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{r.count}x</span>
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
                  <tr><th>Producto</th><th>Cantidad</th><th>Razón</th><th>Costo</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {wastes.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>Sin mermas registradas</td></tr>
                  ) : wastes.map((w: any) => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 600 }}>{w.product?.name ?? w.production?.recipe?.name ?? '—'}</td>
                      <td>{Number(w.quantity)} {w.unit}</td>
                      <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{w.reason}</td>
                      <td style={{ color: 'var(--dax-danger)', fontWeight: 600 }}>{w.cost ? formatCurrency(Number(w.cost)) : '—'}</td>
                      <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{new Date(w.createdAt).toLocaleDateString('es-CR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PROVEEDORES ── */}
      {tab === 'suppliers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {suppliers.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
              <Truck size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay proveedores registrados</p>
            </div>
          ) : suppliers.map((sup: any) => (
            <div key={sup.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>{sup.name}</p>
                  {sup.contactName && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{sup.contactName}</p>}
                </div>
                <span className="dax-badge dax-badge-success">Activo</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sup.phone && <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>📞 {sup.phone}</p>}
                {sup.email && <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>✉ {sup.email}</p>}
                {sup.paymentTerms && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>💳 {sup.paymentTerms}</p>}
                {sup._count?.purchaseOrders > 0 && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{sup._count.purchaseOrders} órdenes de compra</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: MÍNIMOS ── */}
      {tab === 'minimums' && (
        <div className="dax-card">
          <div className="dax-table-wrap">
            <table className="dax-table">
              <thead>
                <tr><th>Receta</th><th>Cantidad mínima</th><th>Turno</th><th style={{ textAlign: 'center' }}>Eliminar</th></tr>
              </thead>
              <tbody>
                {minimums.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>No hay mínimos configurados</td></tr>
                ) : minimums.map((m: any) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.recipe?.name}</td>
                    <td>{m.quantity} <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{m.recipe?.yieldUnit}</span></td>
                    <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{m.shift ? SHIFT_LABELS[m.shift] : 'Todos los turnos'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => deleteMinimumMutation.mutate(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', fontSize: '12px', fontWeight: 600 }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODALES
      ══════════════════════════════════════ */}

      {/* Modal Receta */}
      {showRecipeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '640px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{editRecipe ? 'Editar receta' : 'Nueva receta'}</h2>
              <button onClick={() => { setShowRecipeModal(false); setEditRecipe(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><Label>Nombre de la receta</Label><input className="dax-input" value={recipeForm.name} onChange={e => setRecipeForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Pan francés..." /></div>
              <div><Label optional>Descripción</Label><input className="dax-input" value={recipeForm.description} onChange={e => setRecipeForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción breve..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                <div><Label>Rendimiento</Label><input className="dax-input" type="number" min="1" value={recipeForm.yield} onChange={e => setRecipeForm(p => ({ ...p, yield: parseInt(e.target.value) || 1 }))} /></div>
                <div><Label>Unidad</Label><select className="dax-input" value={recipeForm.yieldUnit} onChange={e => setRecipeForm(p => ({ ...p, yieldUnit: e.target.value }))}>{['unidades', 'kg', 'g', 'porciones', 'panes', 'docenas', 'litros'].map(u => <option key={u}>{u}</option>)}</select></div>
                <div><Label optional>Tiempo (min)</Label><input className="dax-input" type="number" min="0" value={recipeForm.prepTime} onChange={e => setRecipeForm(p => ({ ...p, prepTime: parseInt(e.target.value) || 0 }))} /></div>
              </div>

              {/* Ingredientes */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Label>Ingredientes</Label>
                  <button onClick={addIngredient} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>
                </div>
                {recipeForm.ingredients.length === 0 && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>Agrega los ingredientes</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recipeForm.ingredients.map((ing, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: '8px', alignItems: 'center' }}>
                      <select className="dax-input" style={{ margin: 0 }} value={ing.productId} onChange={e => updateIngredient(i, 'productId', e.target.value)}>
                        <option value="">Selecciona...</option>
                        {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input className="dax-input" style={{ margin: 0 }} type="number" min="0.001" step="0.001" value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', parseFloat(e.target.value) || 0)} />
                      <select className="dax-input" style={{ margin: 0 }} value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select>
                      <button onClick={() => removeIngredient(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mano de obra */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Label optional>Mano de obra</Label>
                  <button onClick={addLaborCost} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recipeForm.laborCosts.map((lc, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: '8px', alignItems: 'center' }}>
                      <input className="dax-input" style={{ margin: 0 }} value={lc.role} onChange={e => updateLaborCost(i, 'role', e.target.value)} placeholder="Rol (ej: Panadero)" />
                      <input className="dax-input" style={{ margin: 0 }} type="number" min="0.5" step="0.5" value={lc.hoursPerBatch} onChange={e => updateLaborCost(i, 'hoursPerBatch', parseFloat(e.target.value) || 0)} placeholder="Horas" />
                      <input className="dax-input" style={{ margin: 0 }} type="number" min="0" value={lc.hourlyRate} onChange={e => updateLaborCost(i, 'hourlyRate', parseFloat(e.target.value) || 0)} placeholder="Tarifa/hora" />
                      <button onClick={() => removeLaborCost(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowRecipeModal(false); setEditRecipe(null); }} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => recipeMutation.mutate()} disabled={recipeMutation.isPending || !recipeForm.name} className="dax-btn-primary" style={{ flex: 1 }}>
                  {recipeMutation.isPending ? 'Guardando...' : editRecipe ? 'Actualizar' : 'Crear receta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Producción */}
      {showProductionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Planificar producción</h2>
              <button onClick={() => setShowProductionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <Label>Receta</Label>
                <select className="dax-input" value={productionForm.recipeId} onChange={e => setProductionForm(p => ({ ...p, recipeId: e.target.value }))}>
                  <option value="">Selecciona una receta...</option>
                  {recipes.map((r: any) => <option key={r.id} value={r.id}>{r.name} (rinde {r.yield} {r.yieldUnit})</option>)}
                </select>
              </div>
              <div>
                <Label>Cantidad de lotes</Label>
                <input className="dax-input" type="number" min="1" value={productionForm.quantity} onChange={e => setProductionForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                {productionForm.recipeId && (() => {
                  const r = recipes.find((x: any) => x.id === productionForm.recipeId);
                  return r ? <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>Producirá {productionForm.quantity * r.yield} {r.yieldUnit}</p> : null;
                })()}
              </div>
              <div>
                <Label optional>Turno</Label>
                <select className="dax-input" value={productionForm.shiftId} onChange={e => setProductionForm(p => ({ ...p, shiftId: e.target.value }))}>
                  <option value="">Sin turno específico</option>
                  {shifts.map((s: any) => <option key={s.id} value={s.id}>{SHIFT_LABELS[s.shift]} · {new Date(s.date).toLocaleDateString('es-CR')}</option>)}
                </select>
              </div>
              <div>
                <Label optional>Fecha y hora</Label>
                <input className="dax-input" type="datetime-local" value={productionForm.plannedAt} onChange={e => setProductionForm(p => ({ ...p, plannedAt: e.target.value }))} />
              </div>
              <div>
                <Label optional>Notas</Label>
                <input className="dax-input" value={productionForm.notes} onChange={e => setProductionForm(p => ({ ...p, notes: e.target.value }))} placeholder="Instrucciones adicionales..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowProductionModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => productionMutation.mutate()} disabled={productionMutation.isPending || !productionForm.recipeId} className="dax-btn-primary" style={{ flex: 1 }}>
                  {productionMutation.isPending ? 'Guardando...' : 'Planificar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Encargo */}
      {showEncargoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo encargo</h2>
              <button onClick={() => setShowEncargoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Nombre del cliente</Label><input className="dax-input" value={encargoForm.clientName} onChange={e => setEncargoForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Juan Pérez" /></div>
                <div><Label optional>Teléfono</Label><input className="dax-input" value={encargoForm.clientPhone} onChange={e => setEncargoForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+506 8888-9999" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Fecha de entrega</Label><input className="dax-input" type="datetime-local" value={encargoForm.deliveryDate} onChange={e => setEncargoForm(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
                <div><Label optional>Depósito recibido</Label><input className="dax-input" type="number" min="0" value={encargoForm.deposit} onChange={e => setEncargoForm(p => ({ ...p, deposit: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Label>Productos del encargo</Label>
                  <button onClick={addEncargoItem} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {encargoForm.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 80px 32px', gap: '6px', alignItems: 'center' }}>
                      <input className="dax-input" style={{ margin: 0 }} value={item.description} onChange={e => updateEncargoItem(i, 'description', e.target.value)} placeholder="Descripción..." />
                      <input className="dax-input" style={{ margin: 0 }} type="number" min="1" value={item.quantity} onChange={e => updateEncargoItem(i, 'quantity', parseFloat(e.target.value) || 1)} />
                      <select className="dax-input" style={{ margin: 0 }} value={item.unit} onChange={e => updateEncargoItem(i, 'unit', e.target.value)}>{['unidades', 'docenas', 'kg', 'porciones', 'cajas'].map(u => <option key={u}>{u}</option>)}</select>
                      <input className="dax-input" style={{ margin: 0 }} type="number" min="0" value={item.unitPrice} onChange={e => updateEncargoItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="Precio" />
                      <button onClick={() => removeEncargoItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              {encargoForm.items.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>Total del encargo</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-coral)' }}>{formatCurrency(encargoTotal)}</span>
                </div>
              )}
              <div><Label optional>Notas</Label><input className="dax-input" value={encargoForm.notes} onChange={e => setEncargoForm(p => ({ ...p, notes: e.target.value }))} placeholder="Instrucciones especiales..." /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowEncargoModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => encargoMutation.mutate()} disabled={encargoMutation.isPending || !encargoForm.clientName || !encargoForm.deliveryDate || encargoForm.items.length === 0} className="dax-btn-primary" style={{ flex: 1 }}>
                  {encargoMutation.isPending ? 'Guardando...' : 'Crear encargo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Merma */}
      {showWasteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Registrar merma</h2>
              <button onClick={() => setShowWasteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Producto afectado</Label>
                <select className="dax-input" value={wasteForm.productId} onChange={e => setWasteForm(p => ({ ...p, productId: e.target.value }))}>
                  <option value="">Selecciona producto...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Cantidad</Label><input className="dax-input" type="number" min="0.1" step="0.1" value={wasteForm.quantity} onChange={e => setWasteForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Unidad</Label><select className="dax-input" value={wasteForm.unit} onChange={e => setWasteForm(p => ({ ...p, unit: e.target.value }))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
              </div>
              <div><Label>Causa de la merma</Label>
                <select className="dax-input" value={wasteForm.reason} onChange={e => setWasteForm(p => ({ ...p, reason: e.target.value }))}>
                  <option value="">Selecciona causa...</option>
                  {['Quemado en horno', 'Caducado', 'Caída accidental', 'Error en receta', 'Sobreproducción', 'Defecto de calidad', 'Daño en almacén', 'Otro'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div><Label optional>Costo estimado</Label><input className="dax-input" type="number" min="0" value={wasteForm.cost} onChange={e => setWasteForm(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowWasteModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => wasteMutation.mutate()} disabled={wasteMutation.isPending || !wasteForm.reason} className="dax-btn-primary" style={{ flex: 1 }}>
                  {wasteMutation.isPending ? 'Guardando...' : 'Registrar merma'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proveedor */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo proveedor</h2>
              <button onClick={() => setShowSupplierModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Nombre del proveedor</Label><input className="dax-input" value={supplierForm.name} onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))} placeholder="Distribuidora El Molino" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Contacto</Label><input className="dax-input" value={supplierForm.contactName} onChange={e => setSupplierForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Nombre del contacto" /></div>
                <div><Label optional>Teléfono</Label><input className="dax-input" value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} placeholder="+506 2222-3333" /></div>
              </div>
              <div><Label optional>Correo electrónico</Label><input className="dax-input" type="email" value={supplierForm.email} onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))} placeholder="ventas@proveedor.com" /></div>
              <div><Label optional>Dirección</Label><input className="dax-input" value={supplierForm.address} onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))} placeholder="Dirección del proveedor" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Cédula jurídica</Label><input className="dax-input" value={supplierForm.taxId} onChange={e => setSupplierForm(p => ({ ...p, taxId: e.target.value }))} placeholder="3-101-123456" /></div>
                <div><Label optional>Términos de pago</Label>
                  <select className="dax-input" value={supplierForm.paymentTerms} onChange={e => setSupplierForm(p => ({ ...p, paymentTerms: e.target.value }))}>
                    <option value="">Selecciona...</option>
                    {['Contado', 'Crédito 8 días', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 60 días'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><Label optional>Notas</Label><input className="dax-input" value={supplierForm.notes} onChange={e => setSupplierForm(p => ({ ...p, notes: e.target.value }))} placeholder="Información adicional..." /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowSupplierModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => supplierMutation.mutate()} disabled={supplierMutation.isPending || !supplierForm.name} className="dax-btn-primary" style={{ flex: 1 }}>
                  {supplierMutation.isPending ? 'Guardando...' : 'Crear proveedor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mínimo diario */}
      {showMinimumModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Mínimo diario</h2>
              <button onClick={() => setShowMinimumModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Receta</Label>
                <select className="dax-input" value={minimumForm.recipeId} onChange={e => setMinimumForm(p => ({ ...p, recipeId: e.target.value }))}>
                  <option value="">Selecciona receta...</option>
                  {recipes.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div><Label>Cantidad mínima</Label><input className="dax-input" type="number" min="1" value={minimumForm.quantity} onChange={e => setMinimumForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} /></div>
              <div><Label optional>Turno específico</Label>
                <select className="dax-input" value={minimumForm.shift} onChange={e => setMinimumForm(p => ({ ...p, shift: e.target.value }))}>
                  <option value="">Todos los turnos</option>
                  {Object.entries(SHIFT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowMinimumModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => minimumMutation.mutate()} disabled={minimumMutation.isPending || !minimumForm.recipeId} className="dax-btn-primary" style={{ flex: 1 }}>
                  {minimumMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}