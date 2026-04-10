'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth }      from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { api }          from '@/lib/api';
import { getImageUrl }  from '@/lib/imageUrl';
import {
  Camera, User, Loader2, Check,
  Eye, EyeOff, KeyRound, Save,
} from 'lucide-react';

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px',
  }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--dax-text-muted)', textTransform: 'none' as const, letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '24px', marginBottom: '16px' }}>
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--dax-coral)' }}>
      {children}
    </p>
  </div>
);

export function ProfileSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user }            = useAuth();
  const { token, features } = useAuthStore();
  const { setAuth }         = useAuthStore();
  const queryClient         = useQueryClient();
  const avatarInputRef      = useRef<HTMLInputElement>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pinForm,          setPinForm]         = useState({ pin: '', confirmPin: '' });
  const [showPin,          setShowPin]         = useState(false);
  const [tenant,           setTenant]          = useState<any>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn:  async () => { const { data } = await api.get('/users/me'); return data; },
  });

  const { data: tenantData } = useQuery({
    queryKey: ['tenant-me'],
    queryFn:  async () => { const { data } = await api.get('/tenants/me'); return data; },
  });

  useEffect(() => { if (tenantData) setTenant(tenantData); }, [tenantData]);

  const [form, setForm] = useState({
    firstName: '', lastName:  '', email:    '',
    phone:     '', jobTitle:  '', avatarUrl: '',
    language:  'es', timezone: 'America/Costa_Rica', signature: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName  ?? '',
        lastName:  profile.lastName   ?? '',
        email:     profile.email      ?? '',
        phone:     profile.phone      ?? '',
        jobTitle:  profile.jobTitle   ?? '',
        avatarUrl: profile.avatarUrl  ?? '',
        language:  profile.language   ?? 'es',
        timezone:  profile.timezone   ?? 'America/Costa_Rica',
        signature: profile.signature  ?? '',
      });
    }
  }, [profile]);

  // ── Guardar perfil ────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async () => api.put('/users/me', form),
    onSuccess: () => {
      showToast('Perfil actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al actualizar', 'error'),
  });

  // ── Actualizar PIN ────────────────────────────────────────────────────────
  const pinMutation = useMutation({
    mutationFn: async () => {
      if (pinForm.pin !== pinForm.confirmPin) throw new Error('Los PINs no coinciden');
      if (!/^\d{4,6}$/.test(pinForm.pin))    throw new Error('El PIN debe ser de 4 a 6 dígitos numéricos');
      return api.put('/users/me/pin', { pin: pinForm.pin });
    },
    onSuccess: () => {
      showToast('PIN de caja actualizado');
      setPinForm({ pin: '', confirmPin: '' });
    },
    onError: (err: any) => showToast(err.message ?? err.response?.data?.message ?? 'Error al actualizar PIN', 'error'),
  });

  // ── Subir avatar ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) { showToast('Solo se permiten imágenes', 'error'); return; }
    if (file.size > 3 * 1024 * 1024)    { showToast('Máximo 3MB para la foto de perfil', 'error'); return; }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // data.url es relativa: /uploads/avatars/uuid.jpg
      const newAvatarUrl = data.url;
      setForm(prev => ({ ...prev, avatarUrl: newAvatarUrl }));

      // Guarda inmediatamente en el perfil
      await api.put('/users/me', { avatarUrl: newAvatarUrl });
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      showToast('Foto de perfil actualizada');
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? 'Error al subir la foto', 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dax-text-muted)', fontSize: '13px' }}>
      <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} />
      Cargando perfil...
    </div>
  );

  const initials   = `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase();
  const avatarUrl  = getImageUrl(form.avatarUrl);
  const pinIsValid = pinForm.pin.length >= 4 && pinForm.pin === pinForm.confirmPin;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '560px' }}>

      {/* ── Avatar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Círculo del avatar */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid var(--dax-border)',
            background: 'var(--dax-coral-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {uploadingAvatar ? (
              <Loader2 size={24} color="var(--dax-coral)" style={{ animation: 'spin .7s linear infinite' }} />
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : initials ? (
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dax-coral)' }}>{initials}</span>
            ) : (
              <User size={32} color="var(--dax-coral)" />
            )}
          </div>

          {/* Botón cámara */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--dax-coral)', borderRadius: '50%',
              width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '2px solid var(--dax-bg)',
              transition: 'transform .15s',
            }}
          >
            <Camera size={12} color="#fff" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>
            {form.firstName} {form.lastName}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>{form.email}</p>
          <span className="dax-badge dax-badge-info">{user?.role}</span>
        </div>
      </div>

      {/* ── Información personal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <Label>Nombre</Label>
          <input className="dax-input" value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="Juan" style={{ margin: 0 }} />
        </div>
        <div>
          <Label>Apellido</Label>
          <input className="dax-input" value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Pérez" style={{ margin: 0 }} />
        </div>
        <div>
          <Label>Correo electrónico</Label>
          <input className="dax-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="juan@empresa.com" style={{ margin: 0 }} />
        </div>
        <div>
          <Label optional>Teléfono</Label>
          <input className="dax-input" type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+506 8888-9999" style={{ margin: 0 }} />
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <Label optional>Cargo / Puesto</Label>
        <input className="dax-input" value={form.jobTitle} onChange={e => f('jobTitle', e.target.value)} placeholder="Ej: Gerente de tienda, Cajero principal..." style={{ margin: 0 }} />
      </div>

      {/* ── Preferencias ── */}
      <SectionTitle>Preferencias personales</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <Label>Idioma</Label>
          <select className="dax-input" value={form.language} onChange={e => f('language', e.target.value)} style={{ margin: 0 }}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>
        <div>
          <Label>Zona horaria</Label>
          <select className="dax-input" value={form.timezone} onChange={e => f('timezone', e.target.value)} style={{ margin: 0 }}>
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

      {/* ── Firma ── */}
      <div style={{ marginBottom: '4px' }}>
        <Label optional>Firma para documentos y reportes</Label>
        <input className="dax-input" value={form.signature} onChange={e => f('signature', e.target.value)} placeholder="Ej: Juan Pérez · Gerente de Ventas" style={{ margin: 0 }} />
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '5px' }}>
          Aparecerá en reportes exportados y documentos del sistema.
        </p>
      </div>

      {/* Botón guardar perfil */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="dax-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {updateMutation.isPending
            ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
            : <><Save size={13} /> Guardar perfil</>
          }
        </button>
      </div>

      {/* ── PIN de caja ── */}
      <SectionTitle>PIN de acceso al POS</SectionTitle>

      <div style={{ background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', border: '1px solid var(--dax-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={14} color="var(--dax-text-muted)" />
          <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>
            El PIN te permite acceder rápidamente al POS sin escribir tu contraseña completa. Usa entre <strong>4 y 6 dígitos</strong>.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <Label>Nuevo PIN</Label>
          <div style={{ position: 'relative' }}>
            <input
              className="dax-input"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={6}
              value={pinForm.pin}
              onChange={e => setPinForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
              placeholder="••••"
              style={{ margin: 0, paddingRight: '40px', letterSpacing: showPin ? 'normal' : '6px' }}
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}
            >
              {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <Label>Confirmar PIN</Label>
          <div style={{ position: 'relative' }}>
            <input
              className="dax-input"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={6}
              value={pinForm.confirmPin}
              onChange={e => setPinForm(p => ({ ...p, confirmPin: e.target.value.replace(/\D/g, '') }))}
              placeholder="••••"
              style={{
                margin: 0, paddingRight: '40px',
                letterSpacing: showPin ? 'normal' : '6px',
                borderColor: pinForm.confirmPin && pinForm.pin !== pinForm.confirmPin ? 'var(--dax-danger)' : undefined,
              }}
            />
            {pinIsValid && (
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                <Check size={14} color="#22C55E" />
              </div>
            )}
          </div>
        </div>
      </div>

      {pinForm.pin && pinForm.confirmPin && pinForm.pin !== pinForm.confirmPin && (
        <p style={{ fontSize: '12px', color: 'var(--dax-danger)', marginTop: '6px', fontWeight: 600 }}>
          ⚠ Los PINs no coinciden
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          onClick={() => pinMutation.mutate()}
          disabled={pinMutation.isPending || !pinIsValid}
          className="dax-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {pinMutation.isPending
            ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
            : <><KeyRound size={13} /> Actualizar PIN</>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
