'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth }      from '@/hooks/useAuth';
import { api }          from '@/lib/api';
import { getImageUrl }  from '@/lib/imageUrl';
import {
  Upload, X, Loader2, Package, Search,
  Pencil, Trash2, Plus, Tag, DollarSign,
  TrendingUp, Filter,
} from 'lucide-react';

interface Product {
  id: string; name: string; price: number; cost: number;
  sku: string; barcode: string; category: string;
  imageUrl: string; active: boolean;
}

const emptyForm = { name: '', price: '', cost: '', sku: '', barcode: '', category: '', imageUrl: '' };

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '7px' }}>
    {children}
  </label>
);

function ProductImage({ src, alt, size = 42, radius = 8 }: { src?: string | null; alt: string; size?: number; radius?: number }) {
  const [error, setError] = useState(false);
  const url = getImageUrl(src);
  if (!url || error) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Package size={size * 0.38} color="var(--dax-text-muted)" style={{ opacity: .3 }} />
      </div>
    );
  }
  return <img src={url} alt={alt} onError={() => setError(true)} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', border: '1px solid var(--dax-border)', flexShrink: 0, display: 'block' }} />;
}

function ImageUploader({ value, onChange, onUploading }: { value: string; onChange: (url: string) => void; onUploading: (v: boolean) => void }) {
  const [tab, setTab]           = useState<'upload' | 'url'>('upload');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imagenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('Maximo 5MB por imagen'); return; }
    setError(''); setLoading(true); onUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/uploads/product-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Error al subir imagen'); }
    finally { setLoading(false); onUploading(false); }
  }, [onChange, onUploading]);

  const previewUrl = getImageUrl(value);

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {(['upload', 'url'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: tab === t ? '#FF5C35' : 'var(--dax-surface-2)', color: tab === t ? '#fff' : 'var(--dax-text-muted)', transition: 'all .15s' }}>
            {t === 'upload' ? 'Subir archivo' : 'URL externa'}
          </button>
        ))}
      </div>
      {tab === 'upload' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
          onClick={() => inputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? '#FF5C35' : 'var(--dax-border)'}`, borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(255,92,53,0.04)' : 'var(--dax-surface-2)', transition: 'all .15s' }}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}><Loader2 size={22} color="#FF5C35" style={{ animation: 'spin .7s linear infinite' }} /><p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Subiendo imagen...</p></div>
            : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><Upload size={22} color="var(--dax-text-muted)" /><p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>Arrastra o haz clic</p><p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>JPG, PNG o WebP - Max 5MB</p></div>
          }
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="dax-input" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={urlInput} onChange={e => setUrlInput(e.target.value)} style={{ margin: 0, flex: 1 }} />
          <button type="button" onClick={() => { if (!urlInput.trim()) return; try { new URL(urlInput); onChange(urlInput.trim()); setError(''); } catch { setError('URL invalida'); } }} style={{ padding: '0 16px', borderRadius: '10px', border: 'none', background: '#FF5C35', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Aplicar</button>
        </div>
      )}
      {error && <p style={{ fontSize: '11px', color: 'var(--dax-danger)', marginTop: '6px', fontWeight: 600 }}>* {error}</p>}
      {previewUrl && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--dax-surface-2)', borderRadius: '10px', border: '1px solid var(--dax-border)' }}>
          <img src={previewUrl} alt="Preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--dax-border)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Vista previa</p>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
          </div>
          <button type="button" onClick={() => { onChange(''); setUrlInput(''); }} style={{ background: 'var(--dax-danger-bg)', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', padding: '6px', borderRadius: '7px', display: 'flex' }}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm]             = useState(false);
  const [search, setSearch]                 = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm]                     = useState(emptyForm);
  const [editId, setEditId]                 = useState<string | null>(null);
  const [error, setError]                   = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmDelete, setConfirmDelete]   = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => { const { data } = await api.get(`/products?search=${search}`); return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => editId ? api.put(`/products/${editId}`, payload) : api.post('/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      setShowForm(false); setForm(emptyForm); setEditId(null); setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      setConfirmDelete(null);
    },
  });

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, price: String(p.price), cost: String(p.cost ?? ''), sku: p.sku ?? '', barcode: p.barcode ?? '', category: p.category ?? '', imageUrl: p.imageUrl ?? '' });
    setEditId(p.id); setShowForm(true); setError('');
  };

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (uploadingImage) return;
    saveMutation.mutate({ ...form, price: parseFloat(form.price), cost: form.cost ? parseFloat(form.cost) : undefined });
  };

  const categories = [...new Set((products as Product[]).map(p => p.category).filter(Boolean))];
  const filtered = (products as Product[]).filter(p => !categoryFilter || p.category === categoryFilter);
  const totalProducts = (products as Product[]).length;
  const activeProducts = (products as Product[]).filter(p => p.active !== false).length;
  const avgPrice = totalProducts ? (products as Product[]).reduce((s, p) => s + Number(p.price), 0) / totalProducts : 0;
  const withImage = (products as Product[]).filter(p => p.imageUrl).length;

  return (
    <div style={{ padding: 'clamp(16px,4vw,40px)', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', marginBottom: '4px' }}>Productos</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Gestiona tu catalogo de productos</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(255,92,53,.3)' }}>
          <Plus size={14} /> Nuevo producto
        </button>
      </div>

      {totalProducts > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total productos', value: totalProducts,            color: '#5AAAF0', icon: Package    },
            { label: 'Activos',         value: activeProducts,           color: '#3DBF7F', icon: TrendingUp },
            { label: 'Precio promedio', value: formatCurrency(avgPrice), color: '#FF5C35', icon: DollarSign },
            { label: 'Con imagen',      value: `${withImage}/${totalProducts}`, color: '#A78BFA', icon: Tag },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="dax-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${s.color}20` }}>
                  <Icon size={16} color={s.color} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '2px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="dax-card" style={{ padding: '12px 16px', marginBottom: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
          <input className="dax-input" placeholder="Buscar por nombre, SKU o codigo de barras..." value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0, paddingLeft: '30px', height: '36px', fontSize: '12px' }} />
        </div>
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={12} color="var(--dax-text-muted)" />
            {['', ...categories].map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: categoryFilter === cat ? 700 : 400, border: 'none', cursor: 'pointer', background: categoryFilter === cat ? '#FF5C35' : 'var(--dax-surface-2)', color: categoryFilter === cat ? '#fff' : 'var(--dax-text-muted)', transition: 'all .15s' }}>
                {cat || 'Todas'}
              </button>
            ))}
          </div>
        )}
        {(search || categoryFilter) && (
          <button onClick={() => { setSearch(''); setCategoryFilter(''); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-muted)', fontSize: '11px', cursor: 'pointer' }}>
            <X size={11} /> Limpiar
          </button>
        )}
      </div>

      <div className="dax-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--dax-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
            {isLoading ? 'Cargando...' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}${categoryFilter ? ` en "${categoryFilter}"` : ''}`}
          </p>
        </div>
        <div className="dax-table-wrap">
          <table className="dax-table">
            <thead>
              <tr>
                <th style={{ width: '56px' }}>Img</th>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'center' }}>Margen</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={20} style={{ animation: 'spin .7s linear infinite', margin: '0 auto', display: 'block', color: 'var(--dax-text-muted)' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px' }}>
                  <Package size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .15, color: 'var(--dax-text-muted)' }} />
                  <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>{search ? `Sin resultados para "${search}"` : 'No hay productos. Crea el primero.'}</p>
                </td></tr>
              ) : filtered.map((product: Product) => {
                const price = Number(product.price);
                const cost  = Number(product.cost);
                const margin = cost > 0 ? ((price - cost) / price * 100) : null;
                return (
                  <tr key={product.id}>
                    <td><ProductImage src={product.imageUrl} alt={product.name} size={42} radius={8} /></td>
                    <td>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{product.name}</p>
                      {product.barcode && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', fontFamily: 'monospace' }}>{product.barcode}</p>}
                    </td>
                    <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>{product.sku || '—'}</td>
                    <td>
                      {product.category
                        ? <span style={{ fontSize: '11px', fontWeight: 600, color: '#5AAAF0', background: 'rgba(90,170,240,.1)', padding: '2px 8px', borderRadius: '6px' }}>{product.category}</span>
                        : <span style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>—</span>
                      }
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)', fontSize: '12px' }}>{cost > 0 ? formatCurrency(cost) : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#FF5C35', fontSize: '13px' }}>{formatCurrency(price)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {margin !== null
                        ? <span style={{ fontSize: '11px', fontWeight: 700, color: margin > 30 ? '#3DBF7F' : margin > 10 ? '#F0A030' : '#E05050', background: margin > 30 ? 'rgba(61,191,127,.1)' : margin > 10 ? 'rgba(240,160,48,.1)' : 'rgba(224,80,80,.1)', padding: '2px 8px', borderRadius: '6px' }}>{margin.toFixed(0)}%</span>
                        : <span style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>—</span>
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleEdit(product)} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px', transition: 'all .15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#5AAAF0'; (e.currentTarget as HTMLElement).style.color='#5AAAF0'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--dax-border)'; (e.currentTarget as HTMLElement).style.color='var(--dax-text-muted)'; }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setConfirmDelete(product)} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#E05050'; (e.currentTarget as HTMLElement).style.color='#E05050'; (e.currentTarget as HTMLElement).style.background='rgba(224,80,80,.06)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--dax-border)'; (e.currentTarget as HTMLElement).style.color='var(--dax-text-muted)'; (e.currentTarget as HTMLElement).style.background='var(--dax-surface-2)'; }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '360px', padding: '28px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'rgba(224,80,80,.1)', border: '1px solid rgba(224,80,80,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={20} color="#E05050" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>Eliminar producto?</h3>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', textAlign: 'center', marginBottom: '20px', lineHeight: 1.6 }}>
              Se eliminara <strong style={{ color: 'var(--dax-text-primary)' }}>"{confirmDelete.name}"</strong>. Esta accion no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#E05050', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {deleteMutation.isPending ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Trash2 size={13} />} Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dax-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,92,53,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={15} color="#FF5C35" />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '2px' }}>{editId ? 'Editar producto' : 'Nuevo producto'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{editId ? 'Actualiza la informacion' : 'Completa los datos'}</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><Label>Nombre del producto *</Label><input className="dax-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej: Coca Cola 350ml" required style={{ margin: 0 }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Precio de venta *</Label><input className="dax-input" type="number" step="0.01" min="0" value={form.price} onChange={e => f('price', e.target.value)} placeholder="0.00" required style={{ margin: 0 }} /></div>
                <div><Label>Costo</Label><input className="dax-input" type="number" step="0.01" min="0" value={form.cost} onChange={e => f('cost', e.target.value)} placeholder="0.00" style={{ margin: 0 }} /></div>
                <div><Label>SKU</Label><input className="dax-input" value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="CC-350" style={{ margin: 0 }} /></div>
                <div><Label>Codigo de barras</Label><input className="dax-input" value={form.barcode} onChange={e => f('barcode', e.target.value)} placeholder="7501055300057" style={{ margin: 0 }} /></div>
              </div>
              <div><Label>Categoria</Label><input className="dax-input" value={form.category} onChange={e => f('category', e.target.value)} placeholder="Ej: Bebidas, Panaderia..." style={{ margin: 0 }} /></div>
              <div><Label>Imagen del producto</Label><ImageUploader value={form.imageUrl} onChange={url => f('imageUrl', url)} onUploading={setUploadingImage} /></div>
              {error && <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,.08)', borderRadius: '8px', border: '1px solid rgba(224,80,80,.2)' }}><p style={{ fontSize: '12px', color: '#E05050', fontWeight: 600 }}>* {error}</p></div>}
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--dax-border)', flexShrink: 0, display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleSubmit()} disabled={saveMutation.isPending || uploadingImage} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: saveMutation.isPending || uploadingImage ? 'var(--dax-surface-3)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: saveMutation.isPending || uploadingImage ? 'var(--dax-text-muted)' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saveMutation.isPending || uploadingImage ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: saveMutation.isPending || uploadingImage ? 'none' : '0 3px 12px rgba(255,92,53,.3)' }}>
                {saveMutation.isPending ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</> : uploadingImage ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Subiendo imagen...</> : editId ? 'Actualizar producto' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
