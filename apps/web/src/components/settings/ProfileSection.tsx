'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Camera, User } from 'lucide-react';

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--dax-text-muted)', textTransform: 'none', letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '8px', marginBottom: '16px' }}>
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dax-coral)' }}>
      {children}
    </p>
  </div>
);

export function ProfileSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: '', confirmPin: '' });
  const [showPin, setShowPin] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
  });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    avatarUrl: '',
    language: 'es',
    timezone: 'America/Costa_Rica',
    signature: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName:  profile.firstName ?? '',
        lastName:   profile.lastName ?? '',
        email:      profile.email ?? '',
        phone:      profile.phone ?? '',
        jobTitle:   profile.jobTitle ?? '',
        avatarUrl:  profile.avatarUrl ?? '',
        language:   profile.language ?? 'es',
        timezone:   profile.timezone ?? 'America/Costa_Rica',
        signature:  profile.signature ?? '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => api.put('/users/me', form),
    onSuccess: () => showToast('Perfil actualizado correctamente'),
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al actualizar', 'error'),
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      if (pinForm.pin !== pinForm.confirmPin) throw new Error('Los PINs no coinciden');
      if (!/^\d{4,6}$/.test(pinForm.pin)) throw new Error('El PIN debe ser de 4 a 6 dígitos numéricos');
      return api.put('/users/me/pin', { pin: pinForm.pin });
    },
    onSuccess: () => {
      showToast('PIN de caja actualizado');
      setPinForm({ pin: '', confirmPin: '' });
    },
    onError: (err: any) => showToast(err.message ?? err.response?.data?.message ?? 'Error al actualizar PIN', 'error'),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, avatarUrl: `http://localhost:3001${data.url}` }));
      showToast('Foto actualizada');
    } catch {
      showToast('Error al subir la foto', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) return <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Cargando perfil...</p>;

  const initials = `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt="Avatar"
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--dax-border)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--dax-coral-soft)', border: '2px solid var(--dax-coral-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initials ? (
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dax-coral)' }}>{initials}</span>
              ) : (
                <User size={32} color="var(--dax-coral)" />
              )}
            </div>
          )}
          <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--dax-coral)', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--dax-bg)' }}>
            <Camera size={12} color="#fff" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>
            {form.firstName} {form.lastName}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>{form.email}</p>
          <span className="dax-badge dax-badge-info" style={{ marginTop: '4px' }}>{user?.role}</span>
        </div>
      </div>

      {/* Información personal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '4px' }}>
        <div>
          <Label>Nombre</Label>
          <input className="dax-input" value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="Juan" />
        </div>
        <div>
          <Label>Apellido</Label>
          <input className="dax-input" value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Pérez" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '4px', marginTop: '16px' }}>
        <div>
          <Label>Correo electrónico</Label>
          <input className="dax-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="juan@empresa.com" />
        </div>
        <div>
          <Label optional>Teléfono</Label>
          <input className="dax-input" type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+506 8888-9999" />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Label optional>Cargo / Puesto</Label>
        <input className="dax-input" value={form.jobTitle} onChange={e => f('jobTitle', e.target.value)} placeholder="Ej: Gerente de tienda, Cajero principal..." />
      </div>

      {/* Preferencias */}
      <SectionTitle>Preferencias personales</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <Label>Idioma de la interfaz</Label>
          <select className="dax-input" value={form.language} onChange={e => f('language', e.target.value)}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>
        <div>
          <Label>Zona horaria</Label>
          <select className="dax-input" value={form.timezone} onChange={e => f('timezone', e.target.value)}>
            <option value="America/Costa_Rica">Costa Rica (GMT-6)</option>
            <option value="America/Mexico_City">México (GMT-6)</option>
            <option value="America/Bogota">Colombia (GMT-5)</option>
            <option value="America/Lima">Perú (GMT-5)</option>
            <option value="America/Santiago">Chile (GMT-4)</option>
            <option value="America/Buenos_Aires">Argentina (GMT-3)</option>
            <option value="America/New_York">Nueva York (GMT-5)</option>
            <option value="Europe/Madrid">España (GMT+1)</option>
          </select>
        </div>
      </div>

      {/* Firma */}
      <SectionTitle>Firma digital</SectionTitle>

      <div>
        <Label optional>Firma para documentos y reportes</Label>
        <input className="dax-input" value={form.signature} onChange={e => f('signature', e.target.value)} placeholder="Ej: Juan Pérez · Gerente de Ventas" />
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '6px' }}>
          Aparecerá en reportes exportados y documentos generados por el sistema.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="dax-btn-primary"
        >
          {updateMutation.isPending ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>

      {/* PIN de caja */}
      <SectionTitle>PIN de acceso al POS</SectionTitle>

      <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>
          El PIN te permite acceder rápidamente al POS sin escribir tu contraseña completa. Usa entre 4 y 6 dígitos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div>
          <Label>Nuevo PIN</Label>
          <input
            className="dax-input"
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={6}
            value={pinForm.pin}
            onChange={e => setPinForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
            placeholder="••••"
          />
        </div>
        <div>
          <Label>Confirmar PIN</Label>
          <input
            className="dax-input"
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={6}
            value={pinForm.confirmPin}
            onChange={e => setPinForm(p => ({ ...p, confirmPin: e.target.value.replace(/\D/g, '') }))}
            placeholder="••••"
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <input
          type="checkbox"
          id="showPin"
          checked={showPin}
          onChange={e => setShowPin(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="showPin" style={{ fontSize: '12px', color: 'var(--dax-text-muted)', cursor: 'pointer' }}>
          Mostrar PIN
        </label>
      </div>

      {pinForm.pin && pinForm.confirmPin && pinForm.pin !== pinForm.confirmPin && (
        <p style={{ fontSize: '12px', color: 'var(--dax-danger)', marginTop: '8px' }}>Los PINs no coinciden</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          onClick={() => pinMutation.mutate()}
          disabled={pinMutation.isPending || !pinForm.pin || pinForm.pin !== pinForm.confirmPin}
          className="dax-btn-primary"
        >
          {pinMutation.isPending ? 'Guardando...' : 'Actualizar PIN'}
        </button>
      </div>

    </div>
  );
}