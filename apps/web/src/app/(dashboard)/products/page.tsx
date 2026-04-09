'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api }    from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import {
  Upload, Link, X, ImageOff, Loader2,
  Package, Search, Pencil, Trash2, Plus,
} from 'lucide-react';

interface Product {
  id:       string;
  name:     string;
  price:    number;
  cost:     number;
  sku:      string;
  barcode:  string;
  category: string;
  imageUrl: string;
  active:   boolean;
}

const emptyForm = {
  name: '', price: '', cost: '',
  sku: '', barcode: '', category: '', imageUrl: '',
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    display: 'block', fontSize: '11px', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: 'var(--dax-text-muted)', marginBottom: '8px',
  }}>
    {children}
  </label>
);

// ── Componente de imagen con fallback ─────────────────────────────────────────
function ProductImage({ src, alt, size = 40, radius = 8 }: {
  src?: string | null; alt: string; size?: number; radius?: number;
}) {
  const [error, setError] = useState(false);
  const url = getImageUrl(src);

  if (!url || error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: 'var(--dax-surface-2)',
        border: '1px solid var(--dax-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Package size={size * 0.4} color="var(--dax-text-muted)" style={{ opacity: .4 }} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      onError={() => setError(true)}
      style={{
        width: size, height: size, borderRadius: radius,
        objectFit: 'cover', border: '1px solid var(--dax-border)',
        flexShrink: 0, display: 'block',
      }}
    />
  );
}

// ── Zona de drop para subir imagen ────────────────────────────────────────────
function ImageUploader({ value, onChange, onUploading }: {
  value: string;
  onChange: (url: string) => void;
  onUploading: (v: boolean) => void;
}) {
  const [tab,      setTab]     = useState<'upload' | 'url'>(value && !value.startsWith('/') && !value.startsWith('http://localhost') ? 'url' : 'upload');
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [urlInput, setUrlInput] = useState(value && (value.startsWith('http') && !value.startsWith('http://localhost')) ? value : '');
  const [error,    setError]    = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('Máximo 5MB por imagen'); return; }

    setError('');
    setLoading(true);
    onUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // data.url es relativa: /uploads/products/uuid.jpg
      onChange(data.url);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al subir la imagen');
    } finally {
      setLoading(false);
      onUploading(false);
    }
  }, [onChange, onUploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const previewUrl = getImageUrl(value);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {([['upload', '📁 Subir archivo'], ['url', '🔗 URL externa']] as const).map(([t, label]) => (
          <button
            key={t} type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--dax-coral)' : 'var(--dax-surface-2)',
              color:      tab === t ? '#fff' : 'var(--dax-text-muted)',
              transition: 'all .15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--dax-coral)' : 'var(--dax-border)'}`,
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(255,92,53,0.04)' : 'var(--dax-surface-2)',
            transition: 'all .15s',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={24} color="var(--dax-coral)" style={{ animation: 'spin .7s linear infinite' }} />
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Subiendo imagen...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Upload size={22} color="var(--dax-text-muted)" />
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>
                Arrastra una imagen o haz clic
              </p>
              <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
                JPG, PNG o WebP · Máx 5MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="dax-input"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            style={{ margin: 0, flex: 1 }}
          />
          <button
            type="button"
            onClick={() => {
              if (!urlInput.trim()) return;
              try {
                new URL(urlInput);
                onChange(urlInput.trim());
                setError('');
              } catch {
                setError('URL inválida');
              }
            }}
            style={{
              padding: '0 16px', borderRadius: '10px', border: 'none',
              background: 'var(--dax-coral)', color: '#fff',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            }}
          >
            Aplicar
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '11px', color: 'var(--dax-danger)', marginTop: '6px', fontWeight: 600 }}>
          ⚠ {error}
        </p>
      )}

      {/* Preview */}
      {previewUrl && (
        <div style={{
          marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 12px', background: 'var(--dax-surface-2)', borderRadius: '10px',
          border: '1px solid var(--dax-border)',
        }}>
          <img
            src={previewUrl}
            alt="Preview"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--dax-border)' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
              Vista previa
            </p>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onChange(''); setUrlInput(''); }}
            style={{ background: 'var(--dax-danger-bg)', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', padding: '6px', borderRadius: '7px', display: 'flex' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { formatCurrency } = useAuth();
  const queryClient        = useQueryClient();

  const [showForm,       setShowForm]       = useState(false);
  const [search,         setSearch]         = useState('');
  const [form,           setForm]           = useState(emptyForm);
  const [editId,         setEditId]         = useState<string | null>(null);
  const [error,          setError]          = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn:  async () => {
      const { data } = await api.get(`/products?search=${search}`);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editId) return api.put(`/products/${editId}`, payload);
      return api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] }); // refresca el POS
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    },
  });

  const handleEdit = (product: Product) => {
    setForm({
      name:     product.name,
      price:    String(product.price),
      cost:     String(product.cost ?? ''),
      sku:      product.sku      ?? '',
      barcode:  product.barcode  ?? '',
      category: product.category ?? '',
      imageUrl: product.imageUrl ?? '',
    });
    setEditId(product.id);
    setShowForm(true);
    setError('');
  };

  const f = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage) return;
    saveMutation.mutate({
      ...form,
      price: parseFloat(form.price),
      cost:  form.cost ? parseFloat(form.cost) : undefined,
    });
  };

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Productos</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Gestiona tu catálogo de productos</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setError(''); }}
          className="dax-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} /> Nuevo producto
        </button>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '580px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>
                  {editId ? 'Actualiza la información del producto' : 'Completa los datos del nuevo producto'}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(false); setError(''); }}
                style={{ background: 'var(--dax-surface-2)', border: 'none', color: 'var(--dax-text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Nombre */}
              <div>
                <Label>Nombre del producto *</Label>
                <input
                  className="dax-input"
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  placeholder="Ej: Coca Cola 350ml"
                  required
                  style={{ margin: 0 }}
                />
              </div>

              {/* Precio y costo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <Label>Precio de venta *</Label>
                  <input className="dax-input" type="number" step="0.01" min="0" value={form.price} onChange={e => f('price', e.target.value)} placeholder="0.00" required style={{ margin: 0 }} />
                </div>
                <div>
                  <Label>Costo</Label>
                  <input className="dax-input" type="number" step="0.01" min="0" value={form.cost} onChange={e => f('cost', e.target.value)} placeholder="0.00" style={{ margin: 0 }} />
                </div>
                <div>
                  <Label>SKU</Label>
                  <input className="dax-input" value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="CC-350" style={{ margin: 0 }} />
                </div>
                <div>
                  <Label>Código de barras</Label>
                  <input className="dax-input" value={form.barcode} onChange={e => f('barcode', e.target.value)} placeholder="7501055300057" style={{ margin: 0 }} />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <Label>Categoría</Label>
                <input className="dax-input" value={form.category} onChange={e => f('category', e.target.value)} placeholder="Ej: Bebidas, Panadería..." style={{ margin: 0 }} />
              </div>

              {/* Imagen */}
              <div>
                <Label>Imagen del producto</Label>
                <ImageUploader
                  value={form.imageUrl}
                  onChange={url => f('imageUrl', url)}
                  onUploading={setUploadingImage}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--dax-danger-bg)', borderRadius: '8px', border: '1px solid var(--dax-danger)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 600 }}>⚠ {error}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="dax-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dax-btn-primary"
                  disabled={saveMutation.isPending || uploadingImage}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {saveMutation.isPending ? (
                    <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
                  ) : uploadingImage ? (
                    <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Subiendo imagen...</>
                  ) : (
                    editId ? 'Actualizar producto' : 'Crear producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="dax-card" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Search size={15} color="var(--dax-text-muted)" style={{ flexShrink: 0 }} />
        <input
          className="dax-input"
          placeholder="Buscar por nombre, SKU o código de barras..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ margin: 0, border: 'none', background: 'transparent', flex: 1, padding: '0' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="dax-card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--dax-border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>
            {isLoading ? 'Cargando...' : `${products.length} producto${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="dax-table-wrap">
          <table className="dax-table">
            <thead>
              <tr>
                <th style={{ width: '56px' }}>Img</th>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>
                  <Loader2 size={20} style={{ animation: 'spin .7s linear infinite', margin: '0 auto', display: 'block' }} />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '40px' }}>
                  <Package size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
                  <p style={{ fontSize: '13px' }}>No hay productos. Crea el primero.</p>
                </td></tr>
              ) : (
                products.map((product: Product) => (
                  <tr key={product.id}>
                    <td>
                      <ProductImage src={product.imageUrl} alt={product.name} size={42} radius={8} />
                    </td>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>{product.sku ?? '—'}</td>
                    <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{product.category ?? '—'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
                      {product.cost ? formatCurrency(Number(product.cost)) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--dax-coral)' }}>
                      {formatCurrency(Number(product.price))}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '4px 8px', borderRadius: '6px' }}
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { if (confirm(`¿Eliminar "${product.name}"?`)) deleteMutation.mutate(product.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', padding: '4px 8px', borderRadius: '6px' }}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
