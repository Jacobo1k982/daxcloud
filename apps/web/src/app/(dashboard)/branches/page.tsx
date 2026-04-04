'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

const emptyForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  manager: '',
  taxId: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  openingHours: '',
  notes: '',
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '4px' }}>
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dax-coral)', marginBottom: '16px' }}>
      {children}
    </p>
  </div>
);

export default function BranchesPage() {
  const { hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const isMultiBranch = hasFeature('multi_branch');

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await api.get('/branches');
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        address: [data.address, data.city, data.state, data.country, data.zipCode].filter(Boolean).join(', '),
        phone: data.phone,
      };
      if (editId) return api.put(`/branches/${editId}`, payload);
      return api.post('/branches', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/branches/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });

  const handleEdit = (branch: Branch) => {
    setForm({ ...emptyForm, name: branch.name, address: branch.address ?? '', phone: branch.phone ?? '' });
    setEditId(branch.id);
    setShowForm(true);
  };

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 48px)', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>Sucursales</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>
            {isMultiBranch ? `${branches.length} sucursal${branches.length !== 1 ? 'es' : ''} activa${branches.length !== 1 ? 's' : ''}` : 'Plan Starter · 1 sucursal'}
          </p>
        </div>
        {isMultiBranch ? (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="dax-btn-primary">
            + Nueva sucursal
          </button>
        ) : (
          <a href="/settings" className="dax-btn-secondary" style={{ textDecoration: 'none' }}>Actualizar plan →</a>
        )}
      </div>

      {/* Banner upgrade */}
      {!isMultiBranch && (
        <div style={{ background: 'var(--dax-coral-soft)', border: '1px solid var(--dax-coral-border)', borderRadius: 'var(--dax-radius-md)', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '13px', color: 'var(--dax-coral)' }}>
            Actualiza a <strong>Growth</strong> para manejar múltiples sucursales.
          </p>
          <a href="/settings" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-coral)', textDecoration: 'none' }}>Ver planes →</a>
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>{editId ? 'Editar sucursal' : 'Nueva sucursal'}</h2>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>Completa los datos de la sucursal</p>
              </div>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--dax-text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Información básica */}
              <div>
                <Label>Nombre de la sucursal *</Label>
                <input className="dax-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Ej: Sucursal Central" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <Label>Teléfono</Label>
                  <input className="dax-input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+506 2222-3333" />
                </div>
                <div>
                  <Label>Correo electrónico</Label>
                  <input className="dax-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="sucursal@empresa.com" />
                </div>
              </div>

              <div>
                <Label>Encargado / Gerente</Label>
                <input className="dax-input" value={form.manager} onChange={e => f('manager', e.target.value)} placeholder="Nombre del encargado" />
              </div>

              <div>
                <Label>Número de identificación fiscal</Label>
                <input className="dax-input" value={form.taxId} onChange={e => f('taxId', e.target.value)} placeholder="Ej: 3-101-123456" />
              </div>

              {/* Dirección */}
              <SectionTitle>Dirección</SectionTitle>

              <div>
                <Label>Dirección</Label>
                <input className="dax-input" value={form.address} onChange={e => f('address', e.target.value)} placeholder="Calle, número, edificio..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <Label>Ciudad</Label>
                  <input className="dax-input" value={form.city} onChange={e => f('city', e.target.value)} placeholder="San José" />
                </div>
                <div>
                  <Label>Provincia / Estado</Label>
                  <input className="dax-input" value={form.state} onChange={e => f('state', e.target.value)} placeholder="San José" />
                </div>
                <div>
                  <Label>País</Label>
                  <input className="dax-input" value={form.country} onChange={e => f('country', e.target.value)} placeholder="Costa Rica" />
                </div>
                <div>
                  <Label>Código postal</Label>
                  <input className="dax-input" value={form.zipCode} onChange={e => f('zipCode', e.target.value)} placeholder="10101" />
                </div>
              </div>

              {/* Operación */}
              <SectionTitle>Operación</SectionTitle>

              <div>
                <Label>Horario de atención</Label>
                <input className="dax-input" value={form.openingHours} onChange={e => f('openingHours', e.target.value)} placeholder="Lun-Vie 8am-6pm, Sáb 9am-2pm" />
              </div>

              <div>
                <Label>Notas internas</Label>
                <input className="dax-input" value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Información adicional para el equipo..." />
              </div>

              {error && <p style={{ fontSize: '13px', color: 'var(--dax-danger)' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowForm(false); setError(''); }} className="dax-btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button
                  onClick={() => saveMutation.mutate(form)}
                  className="dax-btn-primary"
                  disabled={saveMutation.isPending || !form.name}
                  style={{ flex: 1 }}
                >
                  {saveMutation.isPending ? 'Guardando...' : editId ? 'Actualizar' : 'Crear sucursal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de sucursales */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--dax-text-muted)' }}>Cargando...</div>
      ) : branches.length === 0 ? (
        <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--dax-text-muted)' }}>No hay sucursales registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {branches.map((branch: Branch) => (
            <div key={branch.id} className="dax-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: branch.active ? 'var(--dax-success)' : 'var(--dax-danger)', flexShrink: 0 }} />
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{branch.name}</p>
                  </div>
                  <span className={`dax-badge ${branch.active ? 'dax-badge-success' : 'dax-badge-danger'}`}>
                    {branch.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                {isMultiBranch && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(branch)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', fontSize: '12px', fontWeight: 600 }}>
                      Editar
                    </button>
                    <button onClick={() => { if (confirm('¿Desactivar esta sucursal?')) deleteMutation.mutate(branch.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', fontSize: '12px', fontWeight: 600 }}>
                      Desactivar
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {branch.address && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--dax-coral)', fontSize: '13px', flexShrink: 0 }}>◆</span>
                    <p style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>{branch.address}</p>
                  </div>
                )}
                {branch.phone && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--dax-coral)', fontSize: '13px', flexShrink: 0 }}>◆</span>
                    <p style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>{branch.phone}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--dax-coral)', fontSize: '13px', flexShrink: 0 }}>◆</span>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                    Desde {new Date(branch.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}