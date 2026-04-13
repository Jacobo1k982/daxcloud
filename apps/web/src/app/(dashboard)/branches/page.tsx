'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  GitBranch, Plus, MapPin, Phone, Mail, User,
  Clock, FileText, Edit2, PowerOff, X, Loader2,
  CheckCircle, XCircle, Building2, Zap, ArrowRight,
} from 'lucide-react';

interface Branch {
  id: string; name: string; address: string;
  phone: string; active: boolean; createdAt: string;
}

const emptyForm = {
  name: '', address: '', phone: '', email: '',
  manager: '', taxId: '', city: '', state: '',
  country: '', zipCode: '', openingHours: '', notes: '',
};

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '7px' }}>{label}</label>
      <input className="dax-input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ margin: 0 }} />
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--dax-border)' }} />
      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#FF5C35' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--dax-border)' }} />
    </div>
  );
}

export default function BranchesPage() {
  const { hasFeature } = useAuth();
  const queryClient   = useQueryClient();
  const [showForm,    setShowForm]  = useState(false);
  const [editId,      setEditId]    = useState<string | null>(null);
  const [form,        setForm]      = useState(emptyForm);
  const [error,       setError]     = useState('');
  const [confirmId,   setConfirmId] = useState<string | null>(null);

  const isMultiBranch = hasFeature('multi_branch');

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => { const { data } = await api.get('/branches'); return data; },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const payload = {
        name:    data.name,
        address: [data.address, data.city, data.state, data.country, data.zipCode].filter(Boolean).join(', '),
        phone:   data.phone,
      };
      return editId ? api.put(`/branches/${editId}`, payload) : api.post('/branches', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowForm(false); setForm(emptyForm); setEditId(null); setError('');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/branches/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); setConfirmId(null); },
  });

  const handleEdit = (b: Branch) => {
    setForm({ ...emptyForm, name: b.name, address: b.address ?? '', phone: b.phone ?? '' });
    setEditId(b.id); setShowForm(true);
  };

  const f = (field: string, v: string) => setForm(p => ({ ...p, [field]: v }));

  const activeCount   = (branches as Branch[]).filter(b => b.active).length;
  const inactiveCount = (branches as Branch[]).filter(b => !b.active).length;

  return (
    <div style={{ padding: 'clamp(16px,4vw,40px)', maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', marginBottom: '4px' }}>Sucursales</h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>
            {isMultiBranch ? `${(branches as Branch[]).length} sucursal${(branches as Branch[]).length !== 1 ? 'es' : ''} registrada${(branches as Branch[]).length !== 1 ? 's' : ''}` : 'Plan Starter · 1 sucursal'}
          </p>
        </div>
        {isMultiBranch ? (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(255,92,53,.3)' }}>
            <Plus size={14} /> Nueva sucursal
          </button>
        ) : (
          <a href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Actualizar plan <ArrowRight size={13} />
          </a>
        )}
      </div>

      {/* Banner upgrade */}
      {!isMultiBranch && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', marginBottom: '20px', background: 'rgba(255,92,53,.06)', border: '1px solid rgba(255,92,53,.2)', borderRadius: '10px', flexWrap: 'wrap' }}>
          <Zap size={15} color="#FF5C35" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#FF5C35', flex: 1 }}>
            Actualiza a <strong>Growth</strong> para manejar múltiples sucursales.
          </p>
          <a href="/settings" style={{ fontSize: '12px', fontWeight: 700, color: '#FF5C35', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>Ver planes <ArrowRight size={12} /></a>
        </div>
      )}

      {/* Stats */}
      {(branches as Branch[]).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total',      value: (branches as Branch[]).length, color: '#5AAAF0', icon: GitBranch  },
            { label: 'Activas',    value: activeCount,                    color: '#3DBF7F', icon: CheckCircle },
            { label: 'Inactivas',  value: inactiveCount,                  color: '#E05050', icon: XCircle    },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="dax-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${s.color}20` }}>
                  <Icon size={16} color={s.color} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '2px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid sucursales */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--dax-text-muted)' }}>
          <Loader2 size={20} style={{ animation: 'spin .7s linear infinite', margin: '0 auto', display: 'block' }} />
        </div>
      ) : (branches as Branch[]).length === 0 ? (
        <div className="dax-card" style={{ padding: '56px', textAlign: 'center' }}>
          <Building2 size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 14px', display: 'block', opacity: .2 }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dax-text-secondary)', marginBottom: '6px' }}>Sin sucursales registradas</p>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>Crea tu primera sucursal para comenzar.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px' }}>
          {(branches as Branch[]).map(branch => (
            <div key={branch.id} className="dax-card" style={{ padding: '20px', border: `1px solid ${branch.active ? 'var(--dax-border)' : 'rgba(224,80,80,.15)'}` }}>

              {/* Header card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: branch.active ? 'rgba(61,191,127,.1)' : 'rgba(224,80,80,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${branch.active ? 'rgba(61,191,127,.2)' : 'rgba(224,80,80,.15)'}` }}>
                      <Building2 size={14} color={branch.active ? '#3DBF7F' : '#E05050'} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branch.name}</p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: branch.active ? '#3DBF7F' : '#E05050', background: branch.active ? 'rgba(61,191,127,.1)' : 'rgba(224,80,80,.08)', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
                    {branch.active ? '● Activa' : '● Inactiva'}
                  </span>
                </div>
                {isMultiBranch && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => handleEdit(branch)} title="Editar" style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#5AAAF0'; (e.currentTarget as HTMLElement).style.color = '#5AAAF0'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => setConfirmId(branch.id)} title="Desactivar" style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E05050'; (e.currentTarget as HTMLElement).style.color = '#E05050'; (e.currentTarget as HTMLElement).style.background = 'rgba(224,80,80,.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; (e.currentTarget as HTMLElement).style.background = 'var(--dax-surface-2)'; }}>
                      <PowerOff size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {branch.address && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <MapPin size={12} color="#FF5C35" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>{branch.address}</p>
                  </div>
                )}
                {branch.phone && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Phone size={12} color="#5AAAF0" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>{branch.phone}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Clock size={12} color="var(--dax-text-muted)" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                    Desde {new Date(branch.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmación desactivar */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '380px', padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(224,80,80,.1)', border: '1px solid rgba(224,80,80,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <PowerOff size={20} color="#E05050" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>¿Desactivar sucursal?</h3>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 }}>
              Esta acción desactivará la sucursal. Podrás reactivarla más adelante.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => deleteMutation.mutate(confirmId)} disabled={deleteMutation.isPending} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#E05050', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {deleteMutation.isPending ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <PowerOff size={13} />}
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Header modal */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dax-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,92,53,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16} color="#FF5C35" />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1, marginBottom: '2px' }}>{editId ? 'Editar sucursal' : 'Nueva sucursal'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Completa los datos de la sucursal</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
            </div>

            {/* Cuerpo modal */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <Field label="Nombre de la sucursal *" value={form.name} onChange={v => f('name', v)} placeholder="Ej: Sucursal Central" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Teléfono" value={form.phone} onChange={v => f('phone', v)} placeholder="+506 2222-3333" />
                <Field label="Correo electrónico" value={form.email} onChange={v => f('email', v)} placeholder="sucursal@empresa.com" type="email" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Encargado / Gerente" value={form.manager} onChange={v => f('manager', v)} placeholder="Nombre del encargado" />
                <Field label="ID fiscal" value={form.taxId} onChange={v => f('taxId', v)} placeholder="3-101-123456" />
              </div>

              <SectionDivider label="Dirección" />

              <Field label="Dirección" value={form.address} onChange={v => f('address', v)} placeholder="Calle, número, edificio..." />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Ciudad" value={form.city} onChange={v => f('city', v)} placeholder="San José" />
                <Field label="Provincia / Estado" value={form.state} onChange={v => f('state', v)} placeholder="San José" />
                <Field label="País" value={form.country} onChange={v => f('country', v)} placeholder="Costa Rica" />
                <Field label="Código postal" value={form.zipCode} onChange={v => f('zipCode', v)} placeholder="10101" />
              </div>

              <SectionDivider label="Operación" />

              <Field label="Horario de atención" value={form.openingHours} onChange={v => f('openingHours', v)} placeholder="Lun-Vie 8am-6pm, Sáb 9am-2pm" />
              <Field label="Notas internas" value={form.notes} onChange={v => f('notes', v)} placeholder="Información adicional para el equipo..." />

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(224,80,80,.08)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '9px' }}>
                  <p style={{ fontSize: '12px', color: '#E05050' }}>⚠️ {error}</p>
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--dax-border)', flexShrink: 0, display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: saveMutation.isPending || !form.name ? 'var(--dax-surface-3)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: saveMutation.isPending || !form.name ? 'var(--dax-text-muted)' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saveMutation.isPending || !form.name ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: saveMutation.isPending || !form.name ? 'none' : '0 3px 12px rgba(255,92,53,.3)' }}>
                {saveMutation.isPending
                  ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
                  : <>{editId ? 'Actualizar' : 'Crear sucursal'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
