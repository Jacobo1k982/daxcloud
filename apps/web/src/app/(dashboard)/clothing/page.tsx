'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Plus, X, Search, AlertTriangle, Package,
  TrendingUp, Shirt, Tag, Grid, List,
} from 'lucide-react';

type Tab = 'dashboard' | 'variants' | 'collections' | 'stock';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
const SEASONS = ['Primavera/Verano', 'Otoño/Invierno', 'Todo el año', 'Temporada especial'];

const PRESET_COLORS = [
  { name: 'Negro',    hex: '#1A1A1A' },
  { name: 'Blanco',   hex: '#F5F5F5' },
  { name: 'Gris',     hex: '#9CA3AF' },
  { name: 'Rojo',     hex: '#EF4444' },
  { name: 'Azul',     hex: '#3B82F6' },
  { name: 'Azul marino', hex: '#1E3A5F' },
  { name: 'Verde',    hex: '#22C55E' },
  { name: 'Amarillo', hex: '#EAB308' },
  { name: 'Naranja',  hex: '#F97316' },
  { name: 'Rosa',     hex: '#EC4899' },
  { name: 'Morado',   hex: '#8B5CF6' },
  { name: 'Café',     hex: '#92400E' },
  { name: 'Beige',    hex: '#D2B48C' },
  { name: 'Coral',    hex: '#FF5C35' },
];

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· opcional</span>}
  </label>
);

export default function ClothingPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<any>(null);
  const [editCollection, setEditCollection] = useState<any>(null);

  const [variantForm, setVariantForm] = useState({
    productId: '', size: '', color: '', colorHex: '#1A1A1A', sku: '', price: 0, stock: 0,
  });

  const [bulkForm, setBulkForm] = useState({
    productId: '',
    sizes: [] as string[],
    colors: [] as { name: string; hex: string }[],
    basePrice: 0,
    initialStock: 0,
    customColor: '',
    customColorHex: '#FF5C35',
    sizeType: 'standard' as 'standard' | 'numeric' | 'shoe' | 'custom',
    customSize: '',
  });

  const [collectionForm, setCollectionForm] = useState({
    name: '', description: '', season: '', year: new Date().getFullYear(),
  });

  const [stockForm, setStockForm] = useState({
    quantity: 0, operation: 'set' as 'set' | 'increment' | 'decrement',
  });

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['clothing-stats'],
    queryFn: async () => { const { data } = await api.get('/clothing/stats'); return data; },
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['clothing-variants', search],
    queryFn: async () => { const { data } = await api.get(`/clothing/variants?search=${search}`); return data; },
    enabled: tab === 'variants' || tab === 'dashboard',
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['clothing-collections'],
    queryFn: async () => { const { data } = await api.get('/clothing/collections'); return data; },
    enabled: tab === 'collections' || tab === 'dashboard',
  });

  const { data: criticalStock = [] } = useQuery({
    queryKey: ['clothing-critical'],
    queryFn: async () => { const { data } = await api.get('/clothing/stock/critical'); return data; },
    enabled: tab === 'stock' || tab === 'dashboard',
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await api.get('/products'); return data; },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clothing-variants'] });
    queryClient.invalidateQueries({ queryKey: ['clothing-stats'] });
    queryClient.invalidateQueries({ queryKey: ['clothing-critical'] });
  };

  // Mutations
  const variantMutation = useMutation({
    mutationFn: async () => api.post('/clothing/variants', variantForm),
    onSuccess: () => {
      invalidate();
      setShowVariantModal(false);
      setVariantForm({ productId: '', size: '', color: '', colorHex: '#1A1A1A', sku: '', price: 0, stock: 0 });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async () => api.post('/clothing/variants/bulk', {
      productId: bulkForm.productId,
      sizes: bulkForm.sizes,
      colors: bulkForm.colors,
      basePrice: bulkForm.basePrice,
      initialStock: bulkForm.initialStock,
    }),
    onSuccess: () => {
      invalidate();
      setShowBulkModal(false);
      setBulkForm({ productId: '', sizes: [], colors: [], basePrice: 0, initialStock: 0, customColor: '', customColorHex: '#FF5C35', sizeType: 'standard', customSize: '' });
    },
  });

  const stockMutation = useMutation({
    mutationFn: async () => api.put(`/clothing/variants/${showStockModal.id}/stock`, stockForm),
    onSuccess: () => {
      invalidate();
      setShowStockModal(null);
      setStockForm({ quantity: 0, operation: 'set' });
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/clothing/variants/${id}`),
    onSuccess: () => invalidate(),
  });

  const collectionMutation = useMutation({
    mutationFn: async () => editCollection
      ? api.put(`/clothing/collections/${editCollection.id}`, collectionForm)
      : api.post('/clothing/collections', collectionForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing-collections'] });
      queryClient.invalidateQueries({ queryKey: ['clothing-stats'] });
      setShowCollectionModal(false);
      setEditCollection(null);
      setCollectionForm({ name: '', description: '', season: '', year: new Date().getFullYear() });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/clothing/collections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clothing-collections'] }),
  });

  const toggleSize = (size: string) => {
    setBulkForm(p => ({
      ...p,
      sizes: p.sizes.includes(size) ? p.sizes.filter(s => s !== size) : [...p.sizes, size],
    }));
  };

  const toggleColor = (color: { name: string; hex: string }) => {
    setBulkForm(p => ({
      ...p,
      colors: p.colors.find(c => c.name === color.name)
        ? p.colors.filter(c => c.name !== color.name)
        : [...p.colors, color],
    }));
  };

  const getSizeList = () => {
    if (bulkForm.sizeType === 'standard') return STANDARD_SIZES;
    if (bulkForm.sizeType === 'numeric') return NUMERIC_SIZES;
    if (bulkForm.sizeType === 'shoe') return SHOE_SIZES;
    return [];
  };

  const TABS = [
    { id: 'dashboard',   label: 'Dashboard',    icon: TrendingUp },
    { id: 'variants',    label: 'Inventario',   icon: Package },
    { id: 'collections', label: 'Colecciones',  icon: Tag },
    { id: 'stock',       label: 'Stock crítico', icon: AlertTriangle },
  ] as { id: Tab; label: string; icon: any }[];

  // Agrupa variantes por producto
  const groupedVariants = variants.reduce((acc: any, v: any) => {
    const key = v.productId;
    if (!acc[key]) acc[key] = { product: v.product, variants: [] };
    acc[key].variants.push(v);
    return acc;
  }, {});

  return (
    <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--dax-radius-lg)', background: 'rgba(234,179,8,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shirt size={22} color="#EAB308" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '2px' }}>Tienda de Ropa</h1>
            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Tallas, colores, variantes y colecciones</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tab === 'variants' && (
            <>
              <button onClick={() => setShowBulkModal(true)} className="dax-btn-secondary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Grid size={13} /> Carga masiva
              </button>
              <button onClick={() => setShowVariantModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Plus size={13} /> Nueva variante
              </button>
            </>
          )}
          {tab === 'collections' && (
            <button onClick={() => { setEditCollection(null); setShowCollectionModal(true); }} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Plus size={13} /> Nueva colección
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? '#EAB308' : 'var(--dax-surface)', color: active ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0 }}>
              <Icon size={13} />
              {t.label}
              {t.id === 'stock' && (stats?.outOfStock > 0 || stats?.lowStock > 0) && (
                <span style={{ background: 'var(--dax-surface)', color: 'var(--dax-amber)', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                  {(stats?.outOfStock ?? 0) + (stats?.lowStock ?? 0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Variantes activas', value: stats?.totalVariants ?? 0, color: 'var(--dax-amber)' },
              { label: 'Sin stock',         value: stats?.outOfStock ?? 0,   color: 'var(--dax-danger)' },
              { label: 'Stock bajo',        value: stats?.lowStock ?? 0,     color: 'var(--dax-amber)' },
              { label: 'Colecciones',       value: stats?.totalCollections ?? 0, color: 'var(--dax-purple)' },
              { label: 'Ventas del mes',    value: formatCurrency(stats?.monthRevenue ?? 0), color: 'var(--dax-success)', isText: true },
              { label: 'Transacciones',     value: stats?.monthSalesCount ?? 0, color: 'var(--dax-blue)' },
            ].map((s, i) => (
              <div key={i} className="dax-card" style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: s.isText ? '16px' : '22px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top colores */}
          {stats?.topColors?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '14px' }}>Stock por color</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {stats.topColors.map((c: any) => (
                  <div key={c.color} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.color === 'Negro' ? '#1A1A1A' : c.color === 'Blanco' ? '#F5F5F5' : '#EAB308', border: '1px solid var(--dax-border)', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{c.color}</span>
                    <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{c.stock} uds</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top tallas */}
          {stats?.topSizes?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '14px' }}>Stock por talla</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {stats.topSizes.map((s: any) => (
                  <div key={s.size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', minWidth: '56px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-amber)' }}>{s.size}</p>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>{s.stock} uds</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock crítico preview */}
          {criticalStock.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(239,68,68,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={15} color="var(--dax-danger)" />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Stock crítico</p>
                <span style={{ fontSize: '11px', background: 'var(--dax-danger-bg)', color: 'var(--dax-danger)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{criticalStock.length}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {criticalStock.slice(0, 8).map((v: any) => (
                  <div key={v.id} style={{ padding: '8px 12px', background: v.stock === 0 ? 'var(--dax-danger-bg)' : 'rgba(240,160,48,.08)', borderRadius: 'var(--dax-radius-md)', border: `1px solid ${v.stock === 0 ? 'rgba(224,80,80,.2)' : 'rgba(240,160,48,.2)'}` }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{v.product?.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                      {v.size && `T.${v.size} `}{v.color && `· ${v.color} `}
                      <strong style={{ color: v.stock === 0 ? 'var(--dax-danger)' : '#F0A030' }}>{v.stock} uds</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: INVENTARIO (VARIANTES) ── */}
      {tab === 'variants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="dax-card" style={{ padding: '10px 14px', flex: 1, minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
                <input className="dax-input" style={{ paddingLeft: '32px', margin: 0 }} placeholder="Buscar producto, talla o color..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: 'var(--dax-radius-md)', padding: '4px' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', borderRadius: 'var(--dax-radius-sm)', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? '#EAB308' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--dax-text-muted)' }}>
                <Grid size={14} />
              </button>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', borderRadius: 'var(--dax-radius-sm)', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? '#EAB308' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--dax-text-muted)' }}>
                <List size={14} />
              </button>
            </div>
          </div>

          {Object.keys(groupedVariants).length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Shirt size={40} color="var(--dax-text-muted)" style={{ margin: '0 auto 14px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px', marginBottom: '12px' }}>No hay variantes. Crea la primera.</p>
              <button onClick={() => setShowBulkModal(true)} className="dax-btn-primary" style={{ fontSize: '12px' }}>
                Crear variantes en lote
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.values(groupedVariants).map((group: any) => (
                <div key={group.product?.name} className="dax-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    {group.product?.imageUrl && (
                      <img src={group.product.imageUrl} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)' }} />
                    )}
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{group.product?.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{group.product?.category} · {group.variants.length} variante{group.variants.length !== 1 ? 's' : ''}</p>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dax-amber)', marginLeft: 'auto' }}>{formatCurrency(Number(group.product?.price))}</p>
                  </div>

                  {/* Tabla de variantes */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          {['Color', 'Talla', 'SKU', 'Stock', 'Precio', 'Estado', ''].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--dax-text-muted)', letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--dax-border)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.variants.map((v: any) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid var(--dax-border-soft)' }}>
                            <td style={{ padding: '8px 10px' }}>
                              {v.color && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: v.colorHex ?? '#ccc', border: '1px solid var(--dax-border)', flexShrink: 0 }} />
                                  <span style={{ color: 'var(--dax-text-secondary)' }}>{v.color}</span>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{v.size ?? '—'}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: 'var(--dax-text-muted)', fontSize: '11px' }}>{v.sku ?? '—'}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: v.stock === 0 ? 'var(--dax-danger)' : v.stock <= 3 ? '#F0A030' : 'var(--dax-success)' }}>
                                {v.stock}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--dax-text-secondary)' }}>
                              {v.price ? formatCurrency(Number(v.price)) : '—'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span className={`dax-badge ${v.stock === 0 ? 'dax-badge-danger' : v.stock <= 3 ? 'dax-badge-warning' : 'dax-badge-success'}`}>
                                {v.stock === 0 ? 'Agotado' : v.stock <= 3 ? 'Bajo' : 'OK'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setShowStockModal(v); setStockForm({ quantity: v.stock, operation: 'set' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-amber)' }}>
                                  Stock
                                </button>
                                <button onClick={() => { if (confirm('¿Eliminar variante?')) deleteVariantMutation.mutate(v.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-danger)' }}>
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dax-card">
              <div className="dax-table-wrap">
                <table className="dax-table">
                  <thead>
                    <tr><th>Producto</th><th>Color</th><th>Talla</th><th>SKU</th><th style={{ textAlign: 'center' }}>Stock</th><th>Precio</th><th style={{ textAlign: 'center' }}>Acción</th></tr>
                  </thead>
                  <tbody>
                    {variants.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>No hay variantes</td></tr>
                    ) : variants.map((v: any) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.product?.name}</td>
                        <td>
                          {v.color && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: v.colorHex ?? '#ccc', border: '1px solid var(--dax-border)', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px' }}>{v.color}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{v.size ?? '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--dax-text-muted)' }}>{v.sku ?? '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: v.stock === 0 ? 'var(--dax-danger)' : v.stock <= 3 ? '#F0A030' : 'var(--dax-success)' }}>{v.stock}</span>
                        </td>
                        <td>{v.price ? formatCurrency(Number(v.price)) : '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => { setShowStockModal(v); setStockForm({ quantity: v.stock, operation: 'set' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-amber)', marginRight: '8px' }}>
                            Stock
                          </button>
                          <button onClick={() => { if (confirm('¿Eliminar?')) deleteVariantMutation.mutate(v.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-danger)' }}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: COLECCIONES ── */}
      {tab === 'collections' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {collections.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
              <Tag size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay colecciones. Crea la primera.</p>
            </div>
          ) : collections.map((col: any) => (
            <div key={col.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>{col.name}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {col.season && <span style={{ fontSize: '11px', background: 'rgba(234,179,8,.12)', color: 'var(--dax-amber)', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>{col.season}</span>}
                    {col.year && <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{col.year}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => { setEditCollection(col); setCollectionForm({ name: col.name, description: col.description ?? '', season: col.season ?? '', year: col.year ?? new Date().getFullYear() }); setShowCollectionModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)' }}>Editar</button>
                  <button onClick={() => { if (confirm('¿Eliminar colección?')) deleteCollectionMutation.mutate(col.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-danger)' }}>Eliminar</button>
                </div>
              </div>
              {col.description && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>{col.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-amber)' }}>{col._count?.products ?? 0} producto{(col._count?.products ?? 0) !== 1 ? 's' : ''}</span>
              </div>
              {col.products?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {col.products.slice(0, 4).map((cp: any) => (
                    <div key={cp.productId} style={{ padding: '4px 8px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-sm)', fontSize: '11px', color: 'var(--dax-text-secondary)' }}>
                      {cp.product?.name}
                    </div>
                  ))}
                  {col.products.length > 4 && <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>+{col.products.length - 4}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: STOCK CRÍTICO ── */}
      {tab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {criticalStock.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Package size={36} color="var(--dax-success)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay variantes con stock crítico</p>
            </div>
          ) : (
            <div className="dax-card">
              <div className="dax-table-wrap">
                <table className="dax-table">
                  <thead>
                    <tr><th>Producto</th><th>Color</th><th>Talla</th><th style={{ textAlign: 'center' }}>Stock</th><th style={{ textAlign: 'center' }}>Estado</th><th style={{ textAlign: 'center' }}>Acción</th></tr>
                  </thead>
                  <tbody>
                    {criticalStock.map((v: any) => (
                      <tr key={v.id}>
                        <td>
                          <p style={{ fontWeight: 600 }}>{v.product?.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{v.product?.category}</p>
                        </td>
                        <td>
                          {v.color && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: v.colorHex ?? '#ccc', border: '1px solid var(--dax-border)' }} />
                              <span style={{ fontSize: '12px' }}>{v.color}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>{v.size ?? '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: v.stock === 0 ? 'var(--dax-danger)' : '#F0A030' }}>{v.stock}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`dax-badge ${v.stock === 0 ? 'dax-badge-danger' : 'dax-badge-warning'}`}>
                            {v.stock === 0 ? 'Agotado' : 'Stock bajo'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => { setShowStockModal(v); setStockForm({ quantity: v.stock, operation: 'increment' }); }} className="dax-btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                            Reponer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          MODALES
      ══════════════════════════════════════ */}

      {/* Modal variante individual */}
      {showVariantModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nueva variante</h2>
              <button onClick={() => setShowVariantModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Producto</Label>
                <select className="dax-input" value={variantForm.productId} onChange={e => setVariantForm(p => ({ ...p, productId: e.target.value }))}>
                  <option value="">Selecciona producto...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Talla</Label><input className="dax-input" value={variantForm.size} onChange={e => setVariantForm(p => ({ ...p, size: e.target.value }))} placeholder="Ej: M, L, 32..." /></div>
                <div><Label optional>Color</Label><input className="dax-input" value={variantForm.color} onChange={e => setVariantForm(p => ({ ...p, color: e.target.value }))} placeholder="Ej: Azul marino" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div><Label optional>SKU</Label><input className="dax-input" value={variantForm.sku} onChange={e => setVariantForm(p => ({ ...p, sku: e.target.value }))} placeholder="AZ-M-001" /></div>
                <div><Label>Precio</Label><input className="dax-input" type="number" min="0" step="0.01" value={variantForm.price} onChange={e => setVariantForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Stock inicial</Label><input className="dax-input" type="number" min="0" value={variantForm.stock} onChange={e => setVariantForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} /></div>
              </div>
              <div>
                <Label>Color hex</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c.name} onClick={() => setVariantForm(p => ({ ...p, colorHex: c.hex, color: p.color || c.name }))} title={c.name} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.hex, border: variantForm.colorHex === c.hex ? '3px solid white' : '2px solid var(--dax-border)', cursor: 'pointer', boxShadow: variantForm.colorHex === c.hex ? `0 0 0 2px ${c.hex}` : 'none', transition: 'all .15s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowVariantModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => variantMutation.mutate()} disabled={variantMutation.isPending || !variantForm.productId} className="dax-btn-primary" style={{ flex: 1 }}>
                  {variantMutation.isPending ? 'Guardando...' : 'Crear variante'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal carga masiva */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>Carga masiva de variantes</h2>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Genera todas las combinaciones de talla y color automáticamente</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div><Label>Producto base</Label>
                <select className="dax-input" value={bulkForm.productId} onChange={e => setBulkForm(p => ({ ...p, productId: e.target.value }))}>
                  <option value="">Selecciona producto...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Tallas */}
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {(['standard', 'numeric', 'shoe', 'custom'] as const).map(type => (
                    <button key={type} onClick={() => setBulkForm(p => ({ ...p, sizeType: type, sizes: [] }))} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: bulkForm.sizeType === type ? '#EAB308' : 'var(--dax-surface-2)', color: bulkForm.sizeType === type ? '#fff' : 'var(--dax-text-muted)' }}>
                      {type === 'standard' ? 'Ropa (XS-XXXL)' : type === 'numeric' ? 'Pantalón (28-42)' : type === 'shoe' ? 'Calzado (35-44)' : 'Personalizado'}
                    </button>
                  ))}
                </div>
                <Label>Selecciona tallas</Label>
                {bulkForm.sizeType !== 'custom' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {getSizeList().map(size => (
                      <button key={size} onClick={() => toggleSize(size)} style={{ padding: '7px 14px', borderRadius: 'var(--dax-radius-md)', fontSize: '13px', fontWeight: 700, border: `2px solid ${bulkForm.sizes.includes(size) ? '#EAB308' : 'var(--dax-border)'}`, background: bulkForm.sizes.includes(size) ? 'rgba(234,179,8,.12)' : 'var(--dax-surface-2)', color: bulkForm.sizes.includes(size) ? '#EAB308' : 'var(--dax-text-muted)', cursor: 'pointer', transition: 'all .15s' }}>
                        {size}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {bulkForm.sizes.map(s => (
                      <span key={s} style={{ padding: '5px 10px', background: 'rgba(234,179,8,.12)', color: 'var(--dax-amber)', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {s}
                        <button onClick={() => setBulkForm(p => ({ ...p, sizes: p.sizes.filter(x => x !== s) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-amber)', padding: 0 }}><X size={10} /></button>
                      </span>
                    ))}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input className="dax-input" style={{ margin: 0, width: '80px' }} value={bulkForm.customSize} onChange={e => setBulkForm(p => ({ ...p, customSize: e.target.value }))} placeholder="Talla" onKeyDown={e => { if (e.key === 'Enter' && bulkForm.customSize) { toggleSize(bulkForm.customSize); setBulkForm(p => ({ ...p, customSize: '' })); }}} />
                      <button onClick={() => { if (bulkForm.customSize) { toggleSize(bulkForm.customSize); setBulkForm(p => ({ ...p, customSize: '' })); }}} className="dax-btn-secondary" style={{ fontSize: '12px', padding: '8px 12px' }}>+ Agregar</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Colores */}
              <div>
                <Label>Selecciona colores</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {PRESET_COLORS.map(color => {
                    const selected = bulkForm.colors.find(c => c.name === color.name);
                    return (
                      <button key={color.name} onClick={() => toggleColor(color)} title={color.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: 'var(--dax-radius-md)', border: `2px solid ${selected ? color.hex : 'var(--dax-border)'}`, background: selected ? `${color.hex}22` : 'var(--dax-surface-2)', cursor: 'pointer', transition: 'all .15s' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color.hex, border: '1px solid rgba(0,0,0,.1)', flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: selected ? 700 : 400, color: selected ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)' }}>{color.name}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Color personalizado */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={bulkForm.customColorHex} onChange={e => setBulkForm(p => ({ ...p, customColorHex: e.target.value }))} style={{ width: '36px', height: '36px', padding: '2px', borderRadius: '8px', border: '1px solid var(--dax-border)', cursor: 'pointer' }} />
                  <input className="dax-input" style={{ margin: 0, flex: 1 }} value={bulkForm.customColor} onChange={e => setBulkForm(p => ({ ...p, customColor: e.target.value }))} placeholder="Nombre del color personalizado" />
                  <button onClick={() => { if (bulkForm.customColor) { toggleColor({ name: bulkForm.customColor, hex: bulkForm.customColorHex }); setBulkForm(p => ({ ...p, customColor: '' })); }}} className="dax-btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', flexShrink: 0 }}>+ Agregar</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Precio base</Label><input className="dax-input" type="number" min="0" step="0.01" value={bulkForm.basePrice} onChange={e => setBulkForm(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Stock inicial por variante</Label><input className="dax-input" type="number" min="0" value={bulkForm.initialStock} onChange={e => setBulkForm(p => ({ ...p, initialStock: parseInt(e.target.value) || 0 }))} /></div>
              </div>

              {/* Preview */}
              {bulkForm.sizes.length > 0 && bulkForm.colors.length > 0 && (
                <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '14px 16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)', marginBottom: '6px' }}>
                    Se crearán <strong style={{ color: 'var(--dax-amber)' }}>{bulkForm.sizes.length * bulkForm.colors.length}</strong> variantes
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                    {bulkForm.sizes.length} talla{bulkForm.sizes.length !== 1 ? 's' : ''} × {bulkForm.colors.length} color{bulkForm.colors.length !== 1 ? 'es' : ''}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowBulkModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending || !bulkForm.productId || bulkForm.sizes.length === 0 || bulkForm.colors.length === 0} className="dax-btn-primary" style={{ flex: 1 }}>
                  {bulkMutation.isPending ? 'Creando...' : `Crear ${bulkForm.sizes.length * bulkForm.colors.length} variantes`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal colección */}
      {showCollectionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{editCollection ? 'Editar colección' : 'Nueva colección'}</h2>
              <button onClick={() => { setShowCollectionModal(false); setEditCollection(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Nombre de la colección</Label><input className="dax-input" value={collectionForm.name} onChange={e => setCollectionForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Verano 2026, Casual Collection..." /></div>
              <div><Label optional>Descripción</Label><input className="dax-input" value={collectionForm.description} onChange={e => setCollectionForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción de la colección..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Temporada</Label>
                  <select className="dax-input" value={collectionForm.season} onChange={e => setCollectionForm(p => ({ ...p, season: e.target.value }))}>
                    <option value="">Sin temporada</option>
                    {SEASONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><Label optional>Año</Label><input className="dax-input" type="number" min="2020" max="2030" value={collectionForm.year} onChange={e => setCollectionForm(p => ({ ...p, year: parseInt(e.target.value) }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowCollectionModal(false); setEditCollection(null); }} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => collectionMutation.mutate()} disabled={collectionMutation.isPending || !collectionForm.name} className="dax-btn-primary" style={{ flex: 1 }}>
                  {collectionMutation.isPending ? 'Guardando...' : editCollection ? 'Actualizar' : 'Crear colección'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal actualizar stock */}
      {showStockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '380px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Actualizar stock</h2>
              <button onClick={() => setShowStockModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '14px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>{showStockModal.product?.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                {showStockModal.color && `${showStockModal.color} · `}{showStockModal.size && `Talla ${showStockModal.size} · `}
                Stock actual: <strong style={{ color: 'var(--dax-amber)' }}>{showStockModal.stock}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <Label>Operación</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {[{ value: 'set', label: 'Establecer' }, { value: 'increment', label: 'Sumar' }, { value: 'decrement', label: 'Restar' }].map(op => (
                    <button key={op.value} onClick={() => setStockForm(p => ({ ...p, operation: op.value as any }))} style={{ padding: '8px', borderRadius: 'var(--dax-radius-md)', fontSize: '11px', fontWeight: 600, border: `1px solid ${stockForm.operation === op.value ? '#EAB308' : 'var(--dax-border)'}`, background: stockForm.operation === op.value ? 'rgba(234,179,8,.12)' : 'var(--dax-surface-2)', color: stockForm.operation === op.value ? '#EAB308' : 'var(--dax-text-muted)', cursor: 'pointer' }}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Cantidad</Label>
                <input className="dax-input" type="number" min="0" value={stockForm.quantity} onChange={e => setStockForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                {stockForm.operation !== 'set' && (
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '5px' }}>
                    Resultado: <strong style={{ color: 'var(--dax-amber)' }}>
                      {stockForm.operation === 'increment' ? showStockModal.stock + stockForm.quantity : Math.max(0, showStockModal.stock - stockForm.quantity)}
                    </strong>
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowStockModal(null)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => stockMutation.mutate()} disabled={stockMutation.isPending} className="dax-btn-primary" style={{ flex: 1 }}>
                  {stockMutation.isPending ? 'Guardando...' : 'Actualizar stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
