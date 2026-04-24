'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import {
  X, User, Shield, Monitor, LogOut,
  Eye, EyeOff, Check, AlertTriangle,
  ChevronRight, Edit3, Save,
} from 'lucide-react';

type Tab = 'profile' | 'security' | 'session';

// ── Input compacto ────────────────────────────────────
function CompactField({
  label, value, onChange, type = 'text', disabled, suffix, placeholder,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; disabled?: boolean; suffix?: React.ReactNode; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} disabled={disabled}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '10px 40px 10px 12px',
            background: disabled ? 'rgba(15,25,36,0.3)' : focused ? 'rgba(15,25,36,0.9)' : 'rgba(15,25,36,0.6)',
            border: `1px solid ${focused ? '#FF5C35' : 'rgba(30,58,95,0.6)'}`,
            borderRadius: '10px', color: disabled ? 'var(--dax-text-muted)' : 'var(--dax-text-primary)',
            fontSize: '13px', fontFamily: 'var(--font-primary)',
            outline: 'none', boxSizing: 'border-box',
            transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            boxShadow: focused ? '0 0 0 3px rgba(255,92,53,.1)' : 'none',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        {suffix && <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
    </div>
  );
}

// ── Indicador fortaleza ───────────────────────────────
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const colors = ['', '#E05050', '#F0A030', '#5AAAF0', '#3DBF7F'];
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: '2px', borderRadius: '1px', background: i <= strength ? colors[strength] : 'rgba(30,58,95,0.4)', transition: 'all .3s' }} />
        ))}
      </div>
      <p style={{ fontSize: '10px', color: colors[strength] }}>{labels[strength]}</p>
    </div>
  );
}

// ── Modal principal ───────────────────────────────────
export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, tenant, industry, logout } = useAuth();
  const { setAuth, token, features } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [editing, setEditing] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: '',
  });

  const [passForm, setPassForm] = useState({
    current: '', newPass: '', confirm: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const profileMutation = useMutation({
    mutationFn: async () => api.put('/users/me/profile', {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone,
    }),
    onSuccess: (res) => {
      if (token && tenant && features) {
        setAuth(token, {
          ...user!,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
        }, tenant, features);
      }
      showToast('Perfil actualizado correctamente');
      setEditing(false);
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al guardar', 'error'),
  });

  const passMutation = useMutation({
    mutationFn: async () => {
      if (passForm.newPass !== passForm.confirm) throw new Error('Las contraseñas no coinciden');
      if (passForm.newPass.length < 8) throw new Error('Mínimo 8 caracteres');
      return api.put('/users/me/password', {
        currentPassword: passForm.current,
        newPassword: passForm.newPass,
      });
    },
    onSuccess: () => {
      showToast('Contraseña actualizada correctamente');
      setPassForm({ current: '', newPass: '', confirm: '' });
    },
    onError: (err: any) => showToast(err.message ?? err.response?.data?.message ?? 'Error', 'error'),
  });

  const TABS = [
    { id: 'profile',  label: 'Perfil',   icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'session',  label: 'Sesión',    icon: Monitor },
  ] as { id: Tab; label: string; icon: any }[];

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleLabels: Record<string, string> = { admin: 'Administrador', manager: 'Gerente', cashier: 'Cajero', superadmin: 'Super Admin' };

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '520px', maxHeight: '90vh',
        background: 'rgba(22,34,53,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(30,58,95,0.7)',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)',
        animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 22px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            {/* Avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(255,92,53,.25), rgba(255,61,31,.15))',
                  border: '1.5px solid rgba(255,92,53,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(255,92,53,.15)',
                }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dax-coral)', letterSpacing: '-.02em' }}>{initials}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#3DBF7F', border: '2px solid rgba(22,34,53,.97)', boxShadow: '0 0 6px rgba(61,191,127,.5)' }} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px', letterSpacing: '-.01em' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-coral)', background: 'var(--dax-coral-soft)', border: '1px solid rgba(255,92,53,.2)', padding: '1px 7px', borderRadius: '5px' }}>
                    {roleLabels[user?.role ?? ''] ?? user?.role}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{tenant?.name}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '4px', borderRadius: '8px', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,0.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}>
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(15,25,36,0.5)', borderRadius: '10px', padding: '3px' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  padding: '7px', borderRadius: '8px', border: 'none',
                  background: active ? 'rgba(255,92,53,.12)' : 'transparent',
                  color: active ? '#FF5C35' : 'var(--dax-text-muted)',
                  fontSize: '11px', fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all .15s',
                  fontFamily: 'var(--font-primary)',
                }}>
                  <Icon size={13} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Contenido ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 22px' }}>

          {/* Toast */}
          {toast && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', marginBottom: '16px',
              background: toast.type === 'success' ? 'rgba(61,191,127,.08)' : 'rgba(224,80,80,.08)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(61,191,127,.2)' : 'rgba(224,80,80,.2)'}`,
              borderRadius: '10px', animation: 'fadeUp .2s ease',
            }}>
              <Check size={13} color={toast.type === 'success' ? '#3DBF7F' : '#E05050'} />
              <p style={{ fontSize: '12px', color: toast.type === 'success' ? '#3DBF7F' : '#E05050', fontWeight: 600 }}>{toast.msg}</p>
            </div>
          )}

          {/* ── TAB: PERFIL ── */}
          {tab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>Información personal</p>
                <button onClick={() => setEditing(e => !e)} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: '8px',
                  background: editing ? 'rgba(255,92,53,.1)' : 'rgba(30,58,95,.4)',
                  border: `1px solid ${editing ? 'rgba(255,92,53,.3)' : 'rgba(30,58,95,.6)'}`,
                  color: editing ? '#FF5C35' : 'var(--dax-text-muted)',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-primary)', transition: 'all .15s',
                }}>
                  {editing ? <><Save size={11} /> Cancelar</> : <><Edit3 size={11} /> Editar</>}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <CompactField label="Nombre" value={profileForm.firstName} onChange={v => setProfileForm(p => ({ ...p, firstName: v }))} disabled={!editing} />
                <CompactField label="Apellido" value={profileForm.lastName} onChange={v => setProfileForm(p => ({ ...p, lastName: v }))} disabled={!editing} />
              </div>
              <CompactField label="Correo electrónico" type="email" value={profileForm.email} disabled placeholder="tu@email.com" />
              <CompactField label="Teléfono" value={profileForm.phone} onChange={v => setProfileForm(p => ({ ...p, phone: v }))} disabled={!editing} placeholder="+506 8888-9999" />

              {/* Info del tenant */}
              <div style={{ padding: '12px 14px', background: 'rgba(15,25,36,0.5)', border: '1px solid rgba(30,58,95,.4)', borderRadius: '10px', marginTop: '4px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '10px' }}>Cuenta</p>
                {[
                  { label: 'Empresa',   value: tenant?.name ?? '—' },
                  { label: 'Plan',      value: tenant?.plan ?? '—' },
                  { label: 'Industria', value: industry },
                  { label: 'País',      value: tenant?.country ?? '—' },
                  { label: 'Moneda',    value: tenant?.currency ?? '—' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)', textTransform: 'capitalize' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {editing && (
                <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending} style={{
                  width: '100%', padding: '12px',
                  background: profileMutation.isPending ? 'rgba(30,58,95,.5)' : 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                  color: profileMutation.isPending ? 'var(--dax-text-muted)' : '#fff',
                  border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                  cursor: profileMutation.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-primary)', transition: 'all .2s',
                  boxShadow: profileMutation.isPending ? 'none' : '0 4px 14px rgba(255,92,53,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}>
                  {profileMutation.isPending ? (
                    <><span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(30,58,95,.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Guardando...</>
                  ) : (
                    <><Check size={14} /> Guardar cambios</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── TAB: SEGURIDAD ── */}
          {tab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)', marginBottom: '4px' }}>Cambiar contraseña</p>

              <CompactField
                label="Contraseña actual" type={showPass ? 'text' : 'password'}
                value={passForm.current} onChange={v => setPassForm(p => ({ ...p, current: v }))}
                suffix={
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--dax-text-muted)')}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <div>
                <CompactField
                  label="Nueva contraseña" type={showNew ? 'text' : 'password'}
                  value={passForm.newPass} onChange={v => setPassForm(p => ({ ...p, newPass: v }))}
                  placeholder="Mínimo 8 caracteres"
                  suffix={
                    <button type="button" onClick={() => setShowNew(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', transition: 'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--dax-text-muted)')}>
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                <StrengthBar password={passForm.newPass} />
              </div>

              <div>
                <CompactField
                  label="Confirmar contraseña" type={showConfirm ? 'text' : 'password'}
                  value={passForm.confirm} onChange={v => setPassForm(p => ({ ...p, confirm: v }))}
                  placeholder="••••••••"
                  suffix={
                    <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', transition: 'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--dax-text-muted)')}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                {passForm.confirm && passForm.newPass !== passForm.confirm && (
                  <p style={{ fontSize: '10px', color: 'var(--dax-danger)', marginTop: '4px' }}>⚠️ Las contraseñas no coinciden</p>
                )}
                {passForm.confirm && passForm.newPass === passForm.confirm && passForm.newPass.length >= 8 && (
                  <p style={{ fontSize: '10px', color: 'var(--dax-success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={9} /> Contraseñas coinciden
                  </p>
                )}
              </div>

              <button
                onClick={() => passMutation.mutate()}
                disabled={passMutation.isPending || !passForm.current || !passForm.newPass || passForm.newPass !== passForm.confirm}
                style={{
                  width: '100%', padding: '12px',
                  background: passMutation.isPending || !passForm.current || !passForm.newPass || passForm.newPass !== passForm.confirm
                    ? 'rgba(30,58,95,.4)' : 'linear-gradient(135deg, #FF5C35, #FF3D1F)',
                  color: passMutation.isPending || !passForm.current || !passForm.newPass || passForm.newPass !== passForm.confirm
                    ? 'var(--dax-text-muted)' : '#fff',
                  border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-primary)', transition: 'all .2s',
                  boxShadow: '0 4px 14px rgba(255,92,53,.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}>
                {passMutation.isPending ? (
                  <><span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(30,58,95,.6)', borderTopColor: '#3A6A9A', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Actualizando...</>
                ) : (
                  <><Shield size={13} /> Actualizar contraseña</>
                )}
              </button>

              {/* Recomendaciones */}
              <div style={{ padding: '12px 14px', background: 'rgba(90,170,240,.06)', border: '1px solid rgba(90,170,240,.15)', borderRadius: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-blue)', marginBottom: '8px' }}>💡 Recomendaciones</p>
                {['Usa al menos 8 caracteres', 'Incluye mayúsculas y números', 'Agrega símbolos especiales', 'No uses la misma contraseña en otros sitios'].map(r => (
                  <p key={r} style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: 'var(--dax-blue)', fontSize: '8px' }}>●</span> {r}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: SESIÓN ── */}
          {tab === 'session' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)', marginBottom: '4px' }}>Sesión activa</p>

              {/* Sesión actual */}
              <div style={{ padding: '14px 16px', background: 'rgba(61,191,127,.06)', border: '1px solid rgba(61,191,127,.15)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(61,191,127,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Monitor size={16} color="#3DBF7F" />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>Navegador web</p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Sesión actual</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-success)', background: 'rgba(61,191,127,.12)', padding: '2px 8px', borderRadius: '5px' }}>
                    Activa
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', paddingTop: '10px', borderTop: '1px solid rgba(61,191,127,.1)' }}>
                  {[
                    { label: 'Usuario', value: `${user?.firstName} ${user?.lastName}` },
                    { label: 'Rol',     value: user?.role ?? '—' },
                    { label: 'Empresa', value: tenant?.name ?? '—' },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ fontSize: '9px', color: 'var(--dax-text-muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</p>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-secondary)', textTransform: 'capitalize' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info de seguridad */}
              <div style={{ padding: '12px 14px', background: 'rgba(15,25,36,0.5)', border: '1px solid rgba(30,58,95,.4)', borderRadius: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', marginBottom: '8px', letterSpacing: '.06em', textTransform: 'uppercase' }}>Detalles de sesión</p>
                {[
                  { label: 'Autenticación', value: 'JWT · 24h' },
                  { label: 'Tenant ID',     value: tenant?.slug ?? '—' },
                  { label: 'Moneda',        value: `${tenant?.currency} · ${tenant?.locale}` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-secondary)', fontFamily: 'monospace' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Cerrar sesión */}
              <div style={{ padding: '14px', background: 'rgba(224,80,80,.05)', border: '1px solid rgba(224,80,80,.12)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <AlertTriangle size={14} color="#E05050" />
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-danger)' }}>Cerrar sesión</p>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
                  Al cerrar sesión serás redirigido al login. Necesitarás tus credenciales para volver a ingresar.
                </p>
                <button onClick={logout} style={{
                  width: '100%', padding: '10px',
                  background: 'rgba(224,80,80,.1)',
                  border: '1px solid rgba(224,80,80,.25)',
                  borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                  color: 'var(--dax-danger)', cursor: 'pointer', fontFamily: 'var(--font-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  transition: 'all .15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,80,80,.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,80,80,.1)'; }}>
                  <LogOut size={13} /> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modal, document.body) : null;
}