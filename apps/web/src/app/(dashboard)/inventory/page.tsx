'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface InventoryItem {
  id: string;
  quantity: number;
  minStock: number;
  maxStock: number | null;
  location: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    cost: number;
  };
  branch: { id: string; name: string };
}

interface Branch { id: string; name: string; }
interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason: string;
  documentNumber: string;
  supplier: string;
  unitCost: number;
  location: string;
  lotNumber: string;
  expirationDate: string;
  serialNumber: string;
  notes: string;
  createdAt: string;
}

const emptyForm = {
  productId: '',
  branchId: '',
  quantity: '',
  type: 'in',
  minStock: '',
  maxStock: '',
  reason: '',
  documentNumber: '',
  supplier: '',
  unitCost: '',
  location: '',
  lotNumber: '',
  expirationDate: '',
  serialNumber: '',
  lotBarcode: '',
  notes: '',
};

const Label = ({ children, plan }: { children: React.ReactNode; plan?: string }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {plan && <span style={{ color: 'var(--dax-coral)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>{plan}</span>}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '4px' }}>
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dax-coral)', marginBottom: '16px' }}>
      {children}
    </p>
  </div>
);

export default function InventoryPage() {
  const { formatCurrency, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showAddStock, setShowAddStock] = useState(false);
  const [showMovements, setShowMovements] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const isAdvanced = hasFeature('inventory_advanced');
  const hasLots = hasFeature('inventory_lots');
  const canExport = hasFeature('export_reports');
  const isMultiBranch = hasFeature('multi_branch');

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => { const { data } = await api.get('/branches'); return data; },
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory', selectedBranch, branches],
    queryFn: async () => {
      const branchId = selectedBranch || branches[0]?.id;
      if (!branchId) return [];
      const { data } = await api.get(`/inventory/branch/${branchId}`);
      return data;
    },
    enabled: branches.length > 0,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await api.get('/products'); return data; },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', showMovements],
    queryFn: async () => {
      if (!showMovements) return [];
      const branchId = selectedBranch || branches[0]?.id;
      const { data } = await api.get(`/inventory/${showMovements}/movements/${branchId}`);
      return data;
    },
    enabled: !!showMovements && isAdvanced,
  });

  const addStockMutation = useMutation({
    mutationFn: async (data: any) => api.post('/inventory/add-stock', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowAddStock(false);
      setForm(emptyForm);
      setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al agregar stock'),
  });

  const activeBranch = selectedBranch || branches[0]?.id;
  const lowStock = inventory.filter((i: InventoryItem) => i.quantity <= i.minStock);

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.productId || !form.branchId || !form.quantity) return;
    addStockMutation.mutate({
      productId: form.productId,
      branchId: form.branchId,
      quantity: parseInt(form.quantity),
      type: form.type,
      ...(isAdvanced && form.minStock && { minStock: parseInt(form.minStock) }),
      ...(isAdvanced && form.maxStock && { maxStock: parseInt(form.maxStock) }),
      ...(isAdvanced && form.reason && { reason: form.reason }),
      ...(isAdvanced && form.documentNumber && { documentNumber: form.documentNumber }),
      ...(isAdvanced && form.supplier && { supplier: form.supplier }),
      ...(isAdvanced && form.unitCost && { unitCost: parseFloat(form.unitCost) }),
      ...(isAdvanced && form.location && { location: form.location }),
      ...(isAdvanced && form.notes && { notes: form.notes }),
      ...(hasLots && form.lotNumber && { lotNumber: form.lotNumber }),
      ...(hasLots && form.expirationDate && { expirationDate: form.expirationDate }),
      ...(hasLots && form.serialNumber && { serialNumber: form.serialNumber }),
      ...(hasLots && form.lotBarcode && { lotBarcode: form.lotBarcode }),
    });
  };

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Inventario</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>
            {isAdvanced ? (hasLots ? 'Control completo · Scale' : 'Control avanzado · Growth') : 'Control básico · Starter'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canExport && <button className="dax-btn-secondary">Exportar</button>}
          <button onClick={() => { setForm({ ...emptyForm, branchId: activeBranch }); setShowAddStock(true); }} className="dax-btn-primary">
            + Agregar stock
          </button>
        </div>
      </div>

      {/* Banner upgrade */}
      {!isAdvanced && (
        <div style={{ background: 'var(--dax-coral-soft)', border: '1px solid var(--dax-coral-border)', borderRadius: 'var(--dax-radius-md)', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '13px', color: 'var(--dax-coral)' }}>
            Actualiza a <strong>Growth</strong> para historial, alertas, múltiples sucursales y formulario completo.
          </p>
          <a href="/settings" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)', textDecoration: 'none' }}>Ver planes →</a>
        </div>
      )}

      {/* Alerta stock bajo */}
      {isAdvanced && lowStock.length > 0 && (
        <div style={{ background: 'var(--dax-warning-bg)', border: '1px solid rgba(240,160,48,0.2)', borderRadius: 'var(--dax-radius-md)', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--dax-warning)' }}>⚠</span>
          <p style={{ fontSize: '13px', color: 'var(--dax-warning)' }}>
            <strong>{lowStock.length} producto{lowStock.length > 1 ? 's' : ''}</strong> con stock bajo o agotado
          </p>
        </div>
      )}

      {/* Selector sucursal */}
      {isMultiBranch && branches.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <select className="dax-input" style={{ maxWidth: '280px' }} value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
            {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {/* Modal agregar stock */}
      {showAddStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Agregar stock</h2>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
                  {isAdvanced ? (hasLots ? 'Formulario completo · Scale' : 'Formulario avanzado · Growth') : 'Formulario básico · Starter'}
                </p>
              </div>
              <button onClick={() => { setShowAddStock(false); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--dax-text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* ── SECCIÓN BÁSICA — todos los planes ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Label>Producto</Label>
                  <select className="dax-input" value={form.productId} onChange={e => f('productId', e.target.value)} required>
                    <option value="">Selecciona un producto</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` — ${p.sku}` : ''}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Label>Sucursal</Label>
                  <select className="dax-input" value={form.branchId} onChange={e => f('branchId', e.target.value)} required>
                    <option value="">Selecciona una sucursal</option>
                    {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <Label>Cantidad</Label>
                  <input className="dax-input" type="number" min="1" placeholder="0" value={form.quantity} onChange={e => f('quantity', e.target.value)} required />
                </div>

                {isAdvanced ? (
                  <div>
                    <Label plan="Growth+">Tipo de movimiento</Label>
                    <select className="dax-input" value={form.type} onChange={e => f('type', e.target.value)}>
                      <option value="in">Entrada</option>
                      <option value="out">Salida</option>
                      <option value="adjustment">Ajuste</option>
                    </select>
                  </div>
                ) : <div />}
              </div>

              {/* ── SECCIÓN AVANZADA — Growth y Scale ── */}
              {isAdvanced && (
                <>
                  <SectionTitle>Control de stock · Growth+</SectionTitle>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <Label plan="Growth+">Stock mínimo</Label>
                      <input className="dax-input" type="number" min="0" placeholder="5" value={form.minStock} onChange={e => f('minStock', e.target.value)} />
                    </div>
                    <div>
                      <Label plan="Growth+">Stock máximo</Label>
                      <input className="dax-input" type="number" min="0" placeholder="100" value={form.maxStock} onChange={e => f('maxStock', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Label plan="Growth+">Ubicación en bodega</Label>
                      <input className="dax-input" placeholder="Ej: Estante A-3, Bodega Norte..." value={form.location} onChange={e => f('location', e.target.value)} />
                    </div>
                  </div>

                  <SectionTitle>Documento y proveedor · Growth+</SectionTitle>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <Label plan="Growth+">N° de documento / factura</Label>
                      <input className="dax-input" placeholder="FAC-0001" value={form.documentNumber} onChange={e => f('documentNumber', e.target.value)} />
                    </div>
                    <div>
                      <Label plan="Growth+">Precio de compra unitario</Label>
                      <input className="dax-input" type="number" step="0.01" placeholder="0.00" value={form.unitCost} onChange={e => f('unitCost', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Label plan="Growth+">Proveedor</Label>
                      <input className="dax-input" placeholder="Nombre del proveedor" value={form.supplier} onChange={e => f('supplier', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Label plan="Growth+">Motivo del movimiento</Label>
                      <input className="dax-input" placeholder="Ej: Compra de reposición, Devolución a proveedor..." value={form.reason} onChange={e => f('reason', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Label plan="Growth+">Notas internas</Label>
                      <input className="dax-input" placeholder="Notas adicionales para el equipo..." value={form.notes} onChange={e => f('notes', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {/* ── SECCIÓN LOTES — solo Scale ── */}
              {hasLots && (
                <>
                  <SectionTitle>Lotes y trazabilidad · Scale</SectionTitle>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <Label plan="Scale">Número de lote</Label>
                      <input className="dax-input" placeholder="LOT-2024-001" value={form.lotNumber} onChange={e => f('lotNumber', e.target.value)} />
                    </div>
                    <div>
                      <Label plan="Scale">Fecha de vencimiento</Label>
                      <input className="dax-input" type="date" value={form.expirationDate} onChange={e => f('expirationDate', e.target.value)} />
                    </div>
                    <div>
                      <Label plan="Scale">Número de serie</Label>
                      <input className="dax-input" placeholder="SN-00001" value={form.serialNumber} onChange={e => f('serialNumber', e.target.value)} />
                    </div>
                    <div>
                      <Label plan="Scale">Código de barras del lote</Label>
                      <input className="dax-input" placeholder="123456789" value={form.lotBarcode} onChange={e => f('lotBarcode', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {error && <p style={{ fontSize: '13px', color: 'var(--dax-danger)' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowAddStock(false); setError(''); }} className="dax-btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="dax-btn-primary"
                  disabled={addStockMutation.isPending || !form.productId || !form.branchId || !form.quantity}
                  style={{ flex: 1 }}
                >
                  {addStockMutation.isPending ? 'Guardando...' : 'Guardar movimiento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal movimientos */}
      {showMovements && isAdvanced && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Historial de movimientos</h2>
              <button onClick={() => setShowMovements(null)} style={{ background: 'none', border: 'none', color: 'var(--dax-text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            {movements.length === 0 ? (
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>No hay movimientos registrados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {movements.map((m: Movement) => (
                  <div key={m.id} style={{ padding: '16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: m.type === 'in' ? 'var(--dax-success-bg)' : m.type === 'adjustment' ? 'var(--dax-info-bg)' : 'var(--dax-danger-bg)', color: m.type === 'in' ? 'var(--dax-success)' : m.type === 'adjustment' ? 'var(--dax-info)' : 'var(--dax-danger)' }}>
                          {m.type === 'in' ? '↑ ENTRADA' : m.type === 'adjustment' ? '⇄ AJUSTE' : '↓ SALIDA'}
                        </span>
                        {m.reason && <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>{m.reason}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {m.supplier && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Proveedor: {m.supplier}</span>}
                        {m.documentNumber && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Doc: {m.documentNumber}</span>}
                        {m.unitCost && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Costo: {formatCurrency(m.unitCost)}</span>}
                        {m.lotNumber && <span style={{ fontSize: '12px', color: 'var(--dax-coral)' }}>Lote: {m.lotNumber}</span>}
                        {m.expirationDate && <span style={{ fontSize: '12px', color: 'var(--dax-warning)' }}>Vence: {new Date(m.expirationDate).toLocaleDateString('es-CR')}</span>}
                      </div>
                      {m.notes && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', fontStyle: 'italic' }}>{m.notes}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: m.type === 'in' ? 'var(--dax-success)' : m.type === 'adjustment' ? 'var(--dax-info)' : 'var(--dax-danger)' }}>
                        {m.type === 'in' ? '+' : m.type === 'adjustment' ? '=' : '-'}{m.quantity}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
                        {new Date(m.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabla inventario */}
      <div className="dax-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dax-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>
            {isLoading ? 'Cargando...' : `${inventory.length} producto${inventory.length !== 1 ? 's' : ''} en inventario`}
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
                <th style={{ textAlign: 'right' }}>Stock</th>
                {isAdvanced && <th style={{ textAlign: 'right' }}>Mín</th>}
                {isAdvanced && <th style={{ textAlign: 'right' }}>Máx</th>}
                {isAdvanced && <th style={{ textAlign: 'center' }}>Estado</th>}
                {isAdvanced && <th style={{ textAlign: 'center' }}>Historial</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>Cargando...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>No hay productos en inventario.</td></tr>
              ) : (
                inventory.map((item: InventoryItem) => {
                  const isLow = item.quantity <= item.minStock;
                  const isEmpty = item.quantity === 0;
                  const isOver = item.maxStock && item.quantity > item.maxStock;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.product.name}</td>
                      <td style={{ color: 'var(--dax-text-muted)' }}>{item.product.sku ?? '-'}</td>
                      <td style={{ color: 'var(--dax-text-muted)' }}>{item.product.category ?? '-'}</td>
                      {isAdvanced && <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{item.location ?? '-'}</td>}
                      {isAdvanced && <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)' }}>{item.product.cost ? formatCurrency(Number(item.product.cost)) : '-'}</td>}
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isEmpty ? 'var(--dax-danger)' : isLow && isAdvanced ? 'var(--dax-warning)' : 'var(--dax-text-primary)' }}>
                        {item.quantity}
                      </td>
                      {isAdvanced && <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)' }}>{item.minStock}</td>}
                      {isAdvanced && <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)' }}>{item.maxStock ?? '-'}</td>}
                      {isAdvanced && (
                        <td style={{ textAlign: 'center' }}>
                          {isEmpty ? <span className="dax-badge dax-badge-danger">Agotado</span>
                            : isOver ? <span className="dax-badge dax-badge-info">Sobre stock</span>
                            : isLow ? <span className="dax-badge dax-badge-warning">Stock bajo</span>
                            : <span className="dax-badge dax-badge-success">OK</span>}
                        </td>
                      )}
                      {isAdvanced && (
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => setShowMovements(item.product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-coral)', fontSize: '12px', fontWeight: 700 }}>
                            Ver
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}