'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api }         from '@/lib/api';
import { useAuth }     from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/imageUrl';
import {
  Plus, X, Check, Shield, User, Users,
  Copy, Loader2, Pencil, Trash2, RefreshCw,
  KeyRound, Eye, EyeOff, Mail, Phone,
  Calendar, ChevronDown,
} from 'lucide-react';

// ── Config de roles ───────────────────────────────────────────────────────────
const ROLES = [
  { value: 'admin',   label: 'Administrador', color: 'var(--dax-danger)',  bg: 'var(--dax-danger-bg)',  icon: Shield },
  { value: 'manager', label: 'Gerente',        color: 'var(--dax-warning)', bg: 'var(--dax-warning-bg)', icon: Users  },
  { value: 'cashier', label: 'Cajero',          color: 'var(--dax-success)', bg: 'var(--dax-success-bg)', icon: User   },
];

const PERMISSIONS: Record<string, string[]> = {
  admin:   ['POS', 'Productos', 'Inventario', 'Ventas', 'Sucursales', 'Usuarios', 'Configuración', 'Reportes', 'Exportar'],
  manager: ['POS', 'Productos', 'Inventario', 'Ventas', 'Sucursales', 'Reportes'],
  cashier: ['POS'],
};

const roleInfo = (role: string) => ROLES.find(r => r.value === role) ?? ROLES[2];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ u, size = 40 }: { u: any; size?: number }) {
  const role = roleInfo(u.role);
  const url  = getImageUrl(u.avatarUrl);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: role.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: `1.5px solid ${role.color}30` }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: role.color }}>{u.firstName?.[0]}{u.lastName?.[0]}</span>
      }
    </div>
  );
}

// ── Modal: Invitar usuario ────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess, showToast }: {
  onClose:   () => void;
  onSuccess: (r: { tempPassword: string; email: string }) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'cashier' });
  const f = useCallback((k: string, v: string) => setForm(p => ({ ...p, [k]: v })), []);

  const mutation = useMutation({
    mutationFn: async () => api.post('/users/invite', form),
    onSuccess:  (res) => onSuccess({ tempPassword: res.data.tempPassword, email: form.email }),
    onError:    (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: '0 0 3px' }}>Invitar usuario</h2>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Se generará una contraseña temporal</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Label>Nombre</Label>
              <input className="dax-input" value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="Juan" autoComplete="off" style={{ margin: 0 }} />
            </div>
            <div>
              <Label>Apellido</Label>
              <input className="dax-input" value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Pérez" autoComplete="off" style={{ margin: 0 }} />
            </div>
          </div>
          <div>
            <Label>Correo electrónico</Label>
            <input className="dax-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="juan@empresa.com" autoComplete="off" style={{ margin: 0 }} />
          </div>
          <div>
            <Label>Rol</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ROLES.map(role => {
                const Icon = role.icon;
                const sel  = form.role === role.value;
                return (
                  <button key={role.value} type="button" onClick={() => f('role', role.value)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${sel ? role.color : 'var(--dax-border)'}`, background: sel ? role.bg : 'var(--dax-surface-2)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                    <Icon size={16} color={role.color} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: sel ? role.color : 'var(--dax-text-primary)', marginBottom: '1px' }}>{role.label}</p>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{PERMISSIONS[role.value].join(' · ')}</p>
                    </div>
                    {sel && <Check size={14} color={role.color} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.email || !form.firstName || !form.lastName} className="dax-btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {mutation.isPending ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Creando...</> : 'Crear usuario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Contraseña temporal ────────────────────────────────────────────────
function TempPasswordModal({ email, password, onClose, showToast }: {
  email: string; password: string;
  onClose: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [copied, setCopied] = useState(false);
  const [show,   setShow]   = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    showToast('Contraseña copiada');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '420px', padding: '32px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--dax-success-bg)', border: '2px solid var(--dax-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Check size={26} color="var(--dax-success)" />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>Usuario listo</h3>
        <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', marginBottom: '20px' }}>{email}</p>

        <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '10px' }}>Contraseña temporal</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <code style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dax-coral)', letterSpacing: show ? '0.1em' : '0.3em' }}>
              {show ? password : '•'.repeat(password.length)}
            </code>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShow(v => !v)} style={{ background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '7px', display: 'flex' }}>
                {show ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={copy} style={{ background: copied ? 'var(--dax-success-bg)' : 'var(--dax-surface)', border: `1px solid ${copied ? 'var(--dax-success)' : 'var(--dax-border)'}`, cursor: 'pointer', color: copied ? 'var(--dax-success)' : 'var(--dax-text-muted)', padding: '6px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
              </button>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
          Comparte esta contraseña de forma segura. El usuario deberá cambiarla al iniciar sesión.
        </p>
        <button onClick={onClose} className="dax-btn-primary" style={{ width: '100%' }}>Entendido</button>
      </div>
    </div>
  );
}

// ── Modal: Detalle de usuario ─────────────────────────────────────────────────
function UserDetailModal({ u, onClose, onRoleChange, onToggle, onResetPassword, onDelete, showToast, currentUserId, refetch }: {
  u: any; onClose: () => void;
  onRoleChange: (id: string, role: string) => void;
  onToggle: (id: string) => void;
  onResetPassword: (id: string) => void;
  onDelete: (u: any) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
  currentUserId: string;
  refetch: () => void;
}) {
  const role    = roleInfo(u.role);
  const Icon    = role.icon;
  const isMe    = u.id === currentUserId;
  const avatarUrl = getImageUrl(u.avatarUrl);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: role.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `2px solid ${role.color}30`, flexShrink: 0 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '20px', fontWeight: 700, color: role.color }}>{u.firstName?.[0]}{u.lastName?.[0]}</span>
              }
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 3px' }}>{u.firstName} {u.lastName}</h2>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{u.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[
            { icon: Mail,     label: 'Correo',   value: u.email       },
            { icon: Phone,    label: 'Teléfono', value: u.phone || '—' },
            { icon: User,     label: 'Cargo',    value: u.jobTitle || '—' },
            { icon: Calendar, label: 'Desde',    value: fmtDate(u.createdAt) },
          ].map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: '10px', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <ItemIcon size={13} color="var(--dax-text-muted)" style={{ marginTop: '1px', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', wordBreak: 'break-all' }}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado y rol */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span className={`dax-badge ${u.active ? 'dax-badge-success' : 'dax-badge-danger'}`}>
            {u.active ? 'Activo' : 'Inactivo'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: role.bg, padding: '3px 10px', borderRadius: '20px' }}>
            <Icon size={11} color={role.color} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: role.color }}>{role.label}</span>
          </div>
        </div>

        {/* Permisos */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>Accesos</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PERMISSIONS[u.role]?.map(p => (
              <span key={p} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: role.bg, color: role.color }}>{p}</span>
            ))}
          </div>
        </div>

        {/* Cambiar rol (solo si no soy yo) */}
        {!isMe && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>Cambiar rol</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {ROLES.map(r => {
                const RIcon = r.icon;
                const sel   = u.role === r.value;
                return (
                  <button key={r.value} onClick={() => !sel && onRoleChange(u.id, r.value)} style={{ flex: 1, padding: '8px 6px', borderRadius: '10px', border: `1.5px solid ${sel ? r.color : 'var(--dax-border)'}`, background: sel ? r.bg : 'var(--dax-surface-2)', cursor: sel ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all .15s' }}>
                    <RIcon size={14} color={r.color} />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: sel ? r.color : 'var(--dax-text-muted)' }}>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones */}
        {!isMe && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => onToggle(u.id)} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${u.active ? 'rgba(224,80,80,.3)' : 'rgba(61,191,127,.3)'}`, background: u.active ? 'rgba(224,80,80,.06)' : 'rgba(61,191,127,.06)', color: u.active ? 'var(--dax-danger)' : 'var(--dax-success)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {u.active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => onResetPassword(u.id)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(90,170,240,.3)', background: 'rgba(90,170,240,.06)', color: '#5AAAF0', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <KeyRound size={13} /> Resetear clave
              </button>
            </div>
            <button onClick={() => onDelete(u)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(224,80,80,.3)', background: 'rgba(224,80,80,.06)', color: 'var(--dax-danger)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
              <Trash2 size={13} /> Eliminar usuario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function UsersSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user }    = useAuth();
  const queryClient = useQueryClient();

  const [showInvite,   setShowInvite]   = useState(false);
  const [showRoles,    setShowRoles]    = useState(false);
  const [tempPass,     setTempPass]     = useState<{ email: string; password: string } | null>(null);
  const [selected,     setSelected]     = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('all');

  const { data: usersData = [], isLoading, refetch } = useQuery({
    queryKey: ['users-list'],
    queryFn:  async () => { const { data } = await api.get('/users'); return data; },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => { refetch(); showToast('Rol actualizado'); setSelected(null); },
    onError:   (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => api.put(`/users/${id}/toggle`),
    onSuccess: () => { refetch(); showToast('Estado actualizado'); setSelected(null); },
    onError:   (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const resetMutation = useMutation({
    mutationFn: async (id: string) => { const { data } = await api.put(`/users/${id}/reset-password`); return data; },
    onSuccess: (data, id) => {
      const u = (usersData as any[]).find((x: any) => x.id === id);
      setTempPass({ email: u?.email ?? '', password: data.tempPassword });
      setSelected(null);
      showToast('Contraseña reseteada');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { refetch(); showToast('Usuario eliminado'); setDeleteTarget(null); setSelected(null); },
    onError:   (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const filtered = (usersData as any[]).filter((u: any) => {
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        {[
          { label: 'Total', count: (usersData as any[]).length, color: 'var(--dax-coral)', bg: 'var(--dax-coral-soft)', icon: Users },
          ...ROLES.map(r => ({ ...r, count: (usersData as any[]).filter((u: any) => u.role === r.value).length })),
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} style={{ background: bg, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon size={18} color={color} />
            <div>
              <p style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: '11px', color, opacity: .8, marginTop: '2px' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de acciones */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
          <input
            className="dax-input"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '260px', margin: 0 }}
          />
          <select
            className="dax-input"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ maxWidth: '160px', margin: 0 }}
          >
            <option value="all">Todos los roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => refetch()} style={{ background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowRoles(true)} className="dax-btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
            Ver roles
          </button>
          <button onClick={() => setShowInvite(true)} className="dax-btn-primary" style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Invitar
          </button>
        </div>
      </div>

      {/* Lista de usuarios */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dax-text-muted)', fontSize: '13px', padding: '20px 0' }}>
          <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Cargando usuarios...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--dax-surface-2)', borderRadius: '14px' }}>
          <Users size={28} color="var(--dax-text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>No se encontraron usuarios</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((u: any) => {
            const role = roleInfo(u.role);
            const Icon = role.icon;
            const isMe = u.id === user?.id;
            return (
              <div key={u.id} style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', border: isMe ? '1px solid var(--dax-coral-border)' : '1px solid transparent', transition: 'border-color .15s' }}
                onMouseEnter={e => { if (!isMe) (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-border)'; }}
                onMouseLeave={e => { if (!isMe) (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
              >
                <UserAvatar u={u} size={42} />

                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                      {u.firstName} {u.lastName}
                    </p>
                    {isMe && <span style={{ fontSize: '10px', background: 'var(--dax-coral-soft)', color: 'var(--dax-coral)', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>Tú</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{u.email}</p>
                  {u.jobTitle && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', opacity: .7 }}>{u.jobTitle}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: role.bg, padding: '5px 10px', borderRadius: '20px', flexShrink: 0 }}>
                  <Icon size={11} color={role.color} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: role.color }}>{role.label}</span>
                </div>

                <span className={`dax-badge ${u.active ? 'dax-badge-success' : 'dax-badge-danger'}`} style={{ flexShrink: 0 }}>
                  {u.active ? 'Activo' : 'Inactivo'}
                </span>

                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', flexShrink: 0 }}>{fmtDate(u.createdAt)}</p>

                <button onClick={() => setSelected(u)} style={{ background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-coral)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Pencil size={11} /> Gestionar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal invitar */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={(r) => { setShowInvite(false); setTempPass({ email: r.email, password: r.tempPassword }); refetch(); }}
          showToast={showToast}
        />
      )}

      {/* Modal contraseña temporal */}
      {tempPass && (
        <TempPasswordModal
          email={tempPass.email}
          password={tempPass.password}
          onClose={() => setTempPass(null)}
          showToast={showToast}
        />
      )}

      {/* Modal detalle/gestión */}
      {selected && (
        <UserDetailModal
          u={selected}
          onClose={() => setSelected(null)}
          onRoleChange={(id, role) => roleMutation.mutate({ id, role })}
          onToggle={(id) => toggleMutation.mutate(id)}
          onResetPassword={(id) => resetMutation.mutate(id)}
          onDelete={(u) => setDeleteTarget(u)}
          showToast={showToast}
          currentUserId={user?.id ?? ''}
          refetch={refetch}
        />
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dax-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="var(--dax-danger)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>
              ¿Eliminar usuario?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
              Se eliminará permanentemente a <strong style={{ color: 'var(--dax-text-primary)' }}>{deleteTarget.firstName} {deleteTarget.lastName}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} className="dax-btn-secondary">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} style={{ padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--dax-danger)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {deleteMutation.isPending ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Trash2 size={13} />}
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal info roles */}
      {showRoles && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Roles del sistema</h2>
              <button onClick={() => setShowRoles(false)} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ROLES.map(role => {
                const Icon = role.icon;
                return (
                  <div key={role.value} style={{ background: role.bg, borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <Icon size={16} color={role.color} />
                      <p style={{ fontSize: '14px', fontWeight: 700, color: role.color }}>{role.label}</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {PERMISSIONS[role.value].map(p => (
                        <span key={p} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,.15)', color: role.color }}>{p}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
