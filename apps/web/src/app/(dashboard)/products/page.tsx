'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  sku: string;
  barcode: string;
  category: string;
  imageUrl: string;
  active: boolean;
}

const emptyForm = {
  name: '',
  price: '',
  cost: '',
  sku: '',
  barcode: '',
  category: '',
  imageUrl: '',
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

export default function ProductsPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const { data } = await api.get(`/products?search=${search}`);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editId) return api.put(`/products/${editId}`, data);
      return api.post('/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, imageUrl: `http://localhost:3001${data.url}` }));
    } catch {
      setError('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      price: String(product.price),
      cost: String(product.cost ?? ''),
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      category: product.category ?? '',
      imageUrl: product.imageUrl ?? '',
    });
    setEditId(product.id);
    setShowForm(true);
  };

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      price: parseFloat(form.price),
      cost: form.cost ? parseFloat(form.cost) : undefined,
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
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="dax-btn-primary"
        >
          + Nuevo producto
        </button>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--dax-text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <Label>Nombre del producto</Label>
                <input className="dax-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej: Coca Cola 350ml" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <Label>Precio de venta</Label>
                  <input className="dax-input" type="number" step="0.01" value={form.price} onChange={e => f('price', e.target.value)} placeholder="0.00" required />
                </div>
                <div>
                  <Label>Costo</Label>
                  <input className="dax-input" type="number" step="0.01" value={form.cost} onChange={e => f('cost', e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>SKU</Label>
                  <input className="dax-input" value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="CC-350" />
                </div>
                <div>
                  <Label>Código de barras</Label>
                  <input className="dax-input" value={form.barcode} onChange={e => f('barcode', e.target.value)} placeholder="7501055300057" />
                </div>
              </div>

              <div>
                <Label>Categoría</Label>
                <input className="dax-input" value={form.category} onChange={e => f('category', e.target.value)} placeholder="Ej: Bebidas, Panadería, Abarrotes..." />
              </div>

              {/* Imagen */}
              <div>
                <Label>Imagen del producto</Label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {(['url', 'upload'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setImageTab(tab)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        border: 'none', cursor: 'pointer',
                        background: imageTab === tab ? 'var(--dax-coral)' : 'var(--dax-surface-2)',
                        color: imageTab === tab ? '#fff' : 'var(--dax-text-muted)',
                      }}
                    >
                      {tab === 'url' ? 'URL externa' : 'Subir archivo'}
                    </button>
                  ))}
                </div>

                {imageTab === 'url' ? (
                  <input
                    className="dax-input"
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={form.imageUrl}
                    onChange={e => f('imageUrl', e.target.value)}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      cursor: 'pointer', background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)',
                      padding: '10px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '13px',
                      border: '1px solid var(--dax-border)', display: 'inline-block',
                    }}>
                      {uploadingImage ? 'Subiendo...' : 'Seleccionar imagen'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                    {form.imageUrl && <span style={{ fontSize: '12px', color: 'var(--dax-success)' }}>✓ Imagen cargada</span>}
                  </div>
                )}

                {form.imageUrl && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={form.imageUrl} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <button type="button" onClick={() => f('imageUrl', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', fontSize: '12px', fontWeight: 700 }}>
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>

              {error && <p style={{ fontSize: '13px', color: 'var(--dax-danger)' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="dax-btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="dax-btn-primary" disabled={saveMutation.isPending} style={{ flex: 1 }}>
                  {saveMutation.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="dax-card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <input
          className="dax-input"
          placeholder="Buscar por nombre, SKU o código de barras..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ margin: 0 }}
        />
      </div>

      {/* Tabla */}
      <div className="dax-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dax-border)' }}>
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
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>Cargando...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>No hay productos. Crea el primero.</td></tr>
              ) : (
                products.map((product: Product) => (
                  <tr key={product.id}>
                    <td>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--dax-radius-md)', background: 'var(--dax-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dax-text-muted)', fontSize: '16px' }}>◻</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{product.sku ?? '-'}</td>
                    <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{product.category ?? '-'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
                      {product.cost ? formatCurrency(Number(product.cost)) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--dax-coral)' }}>
                      {formatCurrency(Number(product.price))}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleEdit(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', fontSize: '12px', fontWeight: 700, marginRight: '12px' }}>
                        Editar
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar este producto?')) deleteMutation.mutate(product.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', fontSize: '12px', fontWeight: 700 }}>
                        Eliminar
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