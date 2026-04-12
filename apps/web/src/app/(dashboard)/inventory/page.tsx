'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth }     from '@/hooks/useAuth';
import { api }         from '@/lib/api';
import {
  Plus, X, Search, Package, AlertTriangle,
  TrendingDown, TrendingUp, RefreshCw,
  ChevronDown, ChevronUp, BarChart2,
  Loader2, History, SlidersHorizontal,
  Check, ArrowUpCircle, ArrowDownCircle,
  ArrowLeftRight, DollarSign, Warehouse,
} from 'lucide-react';

interface InventoryItem {
  id: string; quantity: number; minStock: number; maxStock: number | null; location: string | null;
  product: { id: string; name: string; sku: string; category: string; price: number; cost: number; };
  branch: { id: string; name: string };
}

interface Branch { id: string; name: string; }

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '6px' }}>
    {children}
  </label>
);

function getStatus(item: InventoryItem) {
  if (item.quantity === 0)                              return { key: 'empty',     label: 'Agotado',     color: '#E05050', bg: 'var(--dax-danger-bg)'  };
  if (item.quantity <= item.minStock)                   return { key: 'low',       label: 'Stock bajo',  color: '#F0A030', bg: 'var(--dax-warning-bg)' };
  if (item.maxStock && item.quantity > item.maxStock)   return { key: 'overstock', label: 'Sobrestock',  color: '#5AAAF0', bg: 'rgba(90,170,240,.1)'   };
  return                                                       { key: 'ok',        label: 'OK',          color: '#3DBF7F', bg: 'var(--dax-success-bg)' };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Modal: Agregar / mover stock ──────────────────────────────────────────────
function StockModal({ item, branches, products, onClose, onSuccess, showToast, hasFeature, formatCurrency }: {
  item?:          InventoryItem;
  branches:       Branch[];
  products:       any[];
  onClose:        () => void;
  onSuccess:      () => void;
  showToast:      (m: string, t?: 'success' | 'error') => void;
  hasFeature:     (f: string) => boolean;
  formatCurrency: (n: number) => string;
}) {
  const isAdvanced = hasFeature('inventory_advanced');
  const hasLots    = hasFeature('inventory_lots');

  const emptyForm = {
    productId: item?.product?.id ?? '', branchId: branches[0]?.id ?? '',
    quantity: '', type: 'in', minStock: item?.minStock?.toString() ?? '',
    maxStock: item?.maxStock?.toString() ?? '', reason: '',
    documentNumber: '', supplier: '', unitCost: '', location: item?.location ?? '',
    lotNumber: '', expirationDate: '', serialNumber: '', notes: '',
  };

  const [form, setForm]   = useState(emptyForm);
  const [error, setError] = useState('');

  const f = useCallback((k: string, v: string) => setForm(p => ({ ...p, [k]: v })), []);

  const mutation = useMutation({
    mutationFn: async () => api.post('/inventory/add-stock', {
      productId: form.productId, branchId: form.branchId,
      quantity:  parseInt(form.quantity), type: form.type,
      ...(isAdvanced && form.minStock      && { minStock:      parseInt(form.minStock)      }),
      ...(isAdvanced && form.maxStock      && { maxStock:      parseInt(form.maxStock)      }),
      ...(isAdvanced && form.reason        && { reason:        form.reason                  }),
      ...(isAdvanced && form.documentNumber && { documentNumber: form.documentNumber        }),
      ...(isAdvanced && form.supplier      && { supplier:      form.supplier                }),
      ...(isAdvanced && form.unitCost      && { unitCost:      parseFloat(form.unitCost)    }),
      ...(isAdvanced && form.location      && { location:      form.location                }),
      ...(isAdvanced && form.notes         && { notes:         form.notes                   }),
      ...(hasLots    && form.lotNumber     && { lotNumber:     form.lotNumber               }),
      ...(hasLots    && form.expirationDate && { expirationDate: form.expirationDate        }),
      ...(hasLots    && form.serialNumber  && { serialNumber:  form.serialNumber            }),
    }),
    onSuccess: () => { showToast('Movimiento registrado'); onSuccess(); },
    onError:   (err: any) => setError(err.response?.data?.message ?? 'Error'),
  });

  const TYPE_OPTS = [
    { value: 'in',         label: '↑ Entrada',  color: '#3DBF7F' },
    { value: 'out',        label: '↓ Salida',   color: '#E05050' },
    { value: 'adjustment', label: '⇄ Ajuste',   color: '#5AAAF0' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '560px', padding: '28px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 3px' }}>
              {item ? `Ajustar stock — ${item.product.name}` : 'Agregar stock'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Registra un movimiento de inventario</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Producto */}
          {!item && (
            <div>
              <Label>Producto *</Label>
              <select className="dax-input" value={form.productId} onChange={e => f('productId', e.target.value)} style={{ margin: 0 }}>
                <option value="">Selecciona un producto</option>
                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` — ${p.sku}` : ''}</option>)}
              </select>
            </div>
          )}

          {/* Sucursal */}
          <div>
            <Label>Sucursal *</Label>
            <select className="dax-input" value={form.branchId} onChange={e => f('branchId', e.target.value)} style={{ margin: 0 }}>
              {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Cantidad y tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Label>Cantidad *</Label>
              <input className="dax-input" type="number" min="1" placeholder="0" value={form.quantity} onChange={e => f('quantity', e.target.value)} style={{ margin: 0 }} />
            </div>
            <div>
              <Label>Tipo</Label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {TYPE_OPTS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => f('type', opt.value)} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1.5px solid ${form.type === opt.value ? opt.color : 'var(--dax-border)'}`, background: form.type === opt.value ? `${opt.color}12` : 'var(--dax-surface-2)', color: form.type === opt.value ? opt.color : 'var(--dax-text-muted)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avanzado */}
          {isAdvanced && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label>Stock mínimo</Label>
                  <input className="dax-input" type="number" min="0" placeholder="5" value={form.minStock} onChange={e => f('minStock', e.target.value)} style={{ margin: 0 }} />
                </div>
                <div>
                  <Label>Stock máximo</Label>
                  <input className="dax-input" type="number" min="0" placeholder="100" value={form.maxStock} onChange={e => f('maxStock', e.target.value)} style={{ margin: 0 }} />
                </div>
              </div>

              <div>
                <Label>Ubicación en bodega</Label>
                <input className="dax-input" placeholder="Ej: Estante A-3, Bodega Norte..." value={form.location} onChange={e => f('location', e.target.value)} style={{ margin: 0 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label>N° Documento / Factura</Label>
                  <input className="dax-input" placeholder="FAC-0001" value={form.documentNumber} onChange={e => f('documentNumber', e.target.value)} style={{ margin: 0 }} />
                </div>
                <div>
                  <Label>Precio compra unitario</Label>
                  <input className="dax-input" type="number" step="0.01" placeholder="0.00" value={form.unitCost} onChange={e => f('unitCost', e.target.value)} style={{ margin: 0 }} />
                </div>
              </div>

              <div>
                <Label>Proveedor</Label>
                <input className="dax-input" placeholder="Nombre del proveedor" value={form.supplier} onChange={e => f('supplier', e.target.value)} style={{ margin: 0 }} />
              </div>

              <div>
                <Label>Motivo</Label>
                <input className="dax-input" placeholder="Ej: Compra de reposición, devolución..." value={form.reason} onChange={e => f('reason', e.target.value)} style={{ margin: 0 }} />
              </div>

              <div>
                <Label>Notas</Label>
                <textarea className="dax-input" placeholder="Notas adicionales..." value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} style={{ margin: 0, resize: 'vertical' }} />
              </div>
            </>
          )}

          {/* Lotes */}
          {hasLots && (
            <>
              <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-coral)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '12px' }}>Lotes y trazabilidad</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label>Número de lote</Label>
                  <input className="dax-input" placeholder="LOT-2024-001" value={form.lotNumber} onChange={e => f('lotNumber', e.target.value)} style={{ margin: 0 }} />
                </div>
                <div>
                  <Label>Fecha de vencimiento</Label>
                  <input className="dax-input" type="date" value={form.expirationDate} onChange={e => f('expirationDate', e.target.value)} style={{ margin: 0 }} />
                </div>
                <div>
                  <Label>Número de serie</Label>
                  <input className="dax-input" placeholder="SN-00001" value={form.serialNumber} onChange={e => f('serialNumber', e.target.value)} style={{ margin: 0 }} />
                </div>
              </div>
            </>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', background: 'var(--dax-danger-bg)', borderRadius: '8px' }}>
              <AlertTriangle size={13} color="var(--dax-danger)" />
              <p style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.productId || !form.branchId || !form.quantity}
              className="dax-btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {mutation.isPending ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</> : 'Guardar movimiento'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Modal: Ajuste rápido ──────────────────────────────────────────────────────
function QuickAdjustModal({ item, onClose, onSuccess, showToast }: {
  item:      InventoryItem;
  onClose:   () => void;
  onSuccess: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [qty,    setQty]    = useState(String(item.quantity));
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async () => api.put(`/inventory/${item.product.id}/adjust/${item.branch.id}`, {
      quantity: parseInt(qty),
      reason:   reason || 'Ajuste manual',
    }),
    onSuccess: () => { showToast('Stock ajustado'); onSuccess(); },
    onError:   (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '380px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 2px' }}>Ajuste rápido</h2>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.product.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '5px', borderRadius: '7px', display: 'flex' }}><X size={14} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Stock actual</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dax-text-primary)' }}>{item.quantity}</span>
          </div>

          <div>
            <Label>Nueva cantidad</Label>
            <input
              className="dax-input"
              type="number" min="0"
              value={qty}
              onChange={e => setQty(e.target.value)}
              autoFocus
              style={{ margin: 0, fontSize: '18px', fontWeight: 700, textAlign: 'center' }}
            />
          </div>

          {parseInt(qty) !== item.quantity && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', background: parseInt(qty) > item.quantity ? 'var(--dax-success-bg)' : 'var(--dax-danger-bg)', borderRadius: '8px' }}>
              {parseInt(qty) > item.quantity
                ? <><ArrowUpCircle   size={13} color="#3DBF7F" /> <span style={{ fontSize: '12px', color: '#3DBF7F', fontWeight: 600 }}>+{parseInt(qty) - item.quantity} unidades</span></>
                : <><ArrowDownCircle size={13} color="var(--dax-danger)" /> <span style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 600 }}>-{item.quantity - parseInt(qty)} unidades</span></>
              }
            </div>
          )}

          <div>
            <Label>Motivo</Label>
            <input className="dax-input" placeholder="Conteo físico, merma, etc." value={reason} onChange={e => setReason(e.target.value)} style={{ margin: 0 }} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !qty || parseInt(qty) < 0}
              className="dax-btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {mutation.isPending ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={13} />}
              Confirmar
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Modal: Historial ──────────────────────────────────────────────────────────
function MovementsModal({ item, branchId, onClose, formatCurrency }: {
  item:           InventoryItem;
  branchId:       string;
  onClose:        () => void;
  formatCurrency: (n: number) => string;
}) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements', item.product.id, branchId],
    queryFn:  async () => { const { data } = await api.get(`/inventory/${item.product.id}/movements/${branchId}`); return data; },
  });

  const TYPE_CFG: Record<string, { label: string; color: string; icon: any }> = {
    in:         { label: 'Entrada', color: '#3DBF7F', icon: ArrowUpCircle   },
    out:        { label: 'Salida',  color: '#E05050', icon: ArrowDownCircle },
    adjustment: { label: 'Ajuste', color: '#5AAAF0', icon: ArrowLeftRight  },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 2px' }}>Historial de movimientos</h2>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.product.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>
              <Loader2 size={18} style={{ animation: 'spin .7s linear infinite' }} />
            </div>
          ) : (movements as any[]).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--dax-text-muted)' }}>
              <History size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
              <p style={{ fontSize: '13px' }}>Sin movimientos registrados</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(movements as any[]).map((m: any) => {
                const cfg  = TYPE_CFG[m.type] ?? TYPE_CFG.in;
                const Icon = cfg.icon;
                return (
                  <div key={m.id} style={{ background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start', border: `1px solid ${cfg.color}18` }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                          {m.reason && <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{m.reason}</span>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
                            {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '='}{m.quantity}
                          </p>
                          <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>{fmtDate(m.createdAt)}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {m.supplier       && <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Prov: {m.supplier}</span>}
                        {m.documentNumber && <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Doc: {m.documentNumber}</span>}
                        {m.unitCost       && <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Costo: {formatCurrency(Number(m.unitCost))}</span>}
                        {m.lotNumber      && <span style={{ fontSize: '10px', color: 'var(--dax-coral)', fontWeight: 600 }}>Lote: {m.lotNumber}</span>}
                        {m.expirationDate && <span style={{ fontSize: '10px', color: '#F0A030', fontWeight: 600 }}>Vence: {fmtDate(m.expirationDate)}</span>}
                        {m.user           && <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Por: {m.user.firstName}</span>}
                      </div>
                      {m.notes && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', fontStyle: 'italic', marginTop: '3px' }}>{m.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { formatCurrency, hasFeature } = useAuth();
  const queryClient = useQueryClient();

  const isAdvanced   = hasFeature('inventory_advanced');
  const hasLots      = hasFeature('inventory_lots');
  const canExport    = hasFeature('export_reports');
  const isMultiBranch = hasFeature('multi_branch');

  const [selectedBranch, setSelectedBranch] = useState('');
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddStock,   setShowAddStock]   = useState(false);
  const [adjustItem,     setAdjustItem]     = useState<InventoryItem | null>(null);
  const [movementsItem,  setMovementsItem]  = useState<InventoryItem | null>(null);
  const [toastState,     setToastState]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3000);
  };

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn:  async () => { const { data } = await api.get('/branches'); return data; },
  });

  const activeBranch = selectedBranch || (branches as Branch[])[0]?.id;

  const { data: inventory = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory', activeBranch, search, statusFilter, categoryFilter],
    queryFn:  async () => {
      if (!activeBranch) return [];
      const p = new URLSearchParams();
      if (search)         p.append('search',   search);
      if (statusFilter)   p.append('status',   statusFilter);
      if (categoryFilter) p.append('category', categoryFilter);
      const { data } = await api.get(`/inventory/branch/${activeBranch}?${p}`);
      return data;
    },
    enabled: !!activeBranch,
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats', activeBranch],
    queryFn:  async () => {
      if (!activeBranch) return null;
      const { data } = await api.get(`/inventory/stats/${activeBranch}`);
      return data;
    },
    enabled: !!activeBranch,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn:  async () => { const { data } = await api.get('/products'); return data; },
  });

  // Categorías únicas
  const categories = [...new Set((inventory as InventoryItem[]).map(i => i.product.category).filter(Boolean))];

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    setShowAddStock(false);
    setAdjustItem(null);
  };

  const STATUS_FILTERS = [
    { key: '',          label: 'Todos'      },
    { key: 'ok',        label: '✓ OK'       },
    { key: 'low',       label: '⚠ Bajo'     },
    { key: 'empty',     label: '✕ Agotado'  },
    { key: 'overstock', label: '↑ Sobrestock' },
  ];

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px)', maxWidth: '1200px' }}>

      {/* Toast */}
      {toastState && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '10px', background: toastState.type === 'success' ? '#22C55E' : 'var(--dax-danger)', color: '#fff', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.3)', animation: 'slideUp .2s ease' }}>
          {toastState.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Inventario</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Control de stock y movimientos</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => refetch()} style={{ width: '36px', height: '36px', borderRadius: '9px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowAddStock(true)} className="dax-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}>
            <Plus size={14} /> Agregar stock
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total productos', value: stats.total,                              color: '#5AAAF0', icon: Package      },
            { label: 'Stock OK',        value: stats.ok,                                 color: '#3DBF7F', icon: Check        },
            { label: 'Stock bajo',      value: stats.low,                                color: '#F0A030', icon: AlertTriangle },
            { label: 'Agotados',        value: stats.empty,                              color: '#E05050', icon: TrendingDown  },
            { label: 'Valor total',     value: formatCurrency(stats.totalValue ?? 0),    color: '#A78BFA', icon: DollarSign   },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="dax-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '1px' }}>{s.value}</p>
                  <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
          <input className="dax-input" placeholder="Buscar producto, SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px', margin: 0 }} />
        </div>

        {/* Sucursal */}
        {isMultiBranch && (branches as Branch[]).length > 1 && (
          <select className="dax-input" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ margin: 0, maxWidth: '180px' }}>
            {(branches as Branch[]).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}

        {/* Filtro por estado */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--dax-surface-2)', padding: '3px', borderRadius: '10px', border: '1px solid var(--dax-border)' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: statusFilter === f.key ? 700 : 400, background: statusFilter === f.key ? 'var(--dax-surface)' : 'transparent', color: statusFilter === f.key ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)', transition: 'all .15s', whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Categoría */}
        {categories.length > 0 && (
          <select className="dax-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ margin: 0, maxWidth: '160px' }}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Tabla */}
      <div className="dax-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
            {isLoading ? 'Cargando...' : `${(inventory as InventoryItem[]).length} producto${(inventory as InventoryItem[]).length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="dax-table-wrap">
          <table className="dax-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                {isAdvanced && <th>Ubicación</th>}
                {isAdvanced && <th style={{ textAlign: 'right' }}>Costo</th>}
                <th style={{ textAlign: 'center' }}>Stock</th>
                {isAdvanced && <th style={{ textAlign: 'center' }}>Mín / Máx</th>}
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>
                  <Loader2 size={18} style={{ animation: 'spin .7s linear infinite', margin: '0 auto', display: 'block' }} />
                </td></tr>
              ) : (inventory as InventoryItem[]).length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                  <Warehouse size={28} color="var(--dax-text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
                  <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>No hay productos en inventario</p>
                </td></tr>
              ) : (
                (inventory as InventoryItem[]).map(item => {
                  const status = getStatus(item);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.product.name}</td>
                      <td style={{ color: 'var(--dax-text-muted)', fontFamily: 'monospace', fontSize: '11px' }}>{item.product.sku ?? '—'}</td>
                      <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{item.product.category ?? '—'}</td>
                      {isAdvanced && <td style={{ color: 'var(--dax-text-muted)', fontSize: '11px' }}>{item.location ?? '—'}</td>}
                      {isAdvanced && <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
                        {item.product.cost ? formatCurrency(Number(item.product.cost)) : '—'}
                      </td>}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: status.color }}>{item.quantity}</span>
                      </td>
                      {isAdvanced && <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.minStock} / {item.maxStock ?? '∞'}</span>
                      </td>}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: status.color, background: status.bg, padding: '3px 8px', borderRadius: '20px', display: 'inline-block' }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setAdjustItem(item)}
                            title="Ajuste rápido"
                            style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-coral)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <SlidersHorizontal size={11} /> Ajustar
                          </button>
                          {isAdvanced && (
                            <button
                              onClick={() => setMovementsItem(item)}
                              title="Ver historial"
                              style={{ padding: '5px 8px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <History size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {showAddStock && (
        <StockModal
          branches={branches as Branch[]}
          products={products as any[]}
          onClose={() => setShowAddStock(false)}
          onSuccess={onSuccess}
          showToast={showToast}
          hasFeature={hasFeature}
          formatCurrency={formatCurrency}
        />
      )}

      {adjustItem && (
        <QuickAdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSuccess={() => { setAdjustItem(null); onSuccess(); }}
          showToast={showToast}
        />
      )}

      {movementsItem && (
        <MovementsModal
          item={movementsItem}
          branchId={activeBranch}
          onClose={() => setMovementsItem(null)}
          formatCurrency={formatCurrency}
        />
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
