'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Plus, X, Check, Shield, User, Users } from 'lucide-react';

const ROLES = [
  {
    value: 'admin',
    label: 'Administrador',
    desc: 'Acceso total al sistema incluyendo configuración, usuarios y reportes.',
    color: 'var(--dax-danger)',
    bg: 'var(--dax-danger-bg)',
    icon: Shield,
  },
  {
    value: 'manager',
    label: 'Gerente',
    desc: 'Acceso a ventas, inventario y reportes. Sin acceso a configuración.',
    color: 'var(--dax-warning)',
    bg: 'var(--dax-warning-bg)',
    icon: Users,
  },
  {
    value: 'cashier',
    label: 'Cajero',
    desc: 'Solo acceso al POS para procesar ventas.',
    color: 'var(--dax-success)',
    bg: 'var(--dax-success-bg)',
    icon: User,
  },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

export function UsersSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRolesInfo, setShowRolesInfo] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', role: 'cashier' });
  const [search, setSearch] = useState('');

  const { data: usersData = [], isLoading, refetch } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => api.post('/users/invite', inviteForm),
    onSuccess: (res) => {
      setInviteResult({ tempPassword: res.data.tempPassword, email: inviteForm.email });
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'cashier' });
      refetch();
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al crear usuario', 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: string) => api.put(`/users/${userId}/toggle`),
    onSuccess: () => { refetch(); showToast('Estado del usuario actualizado'); },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const filtered = usersData.filter((u: any) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const roleInfo = (role: string) => ROLES.find(r => r.value === role) ?? ROLES[2];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Contraseña copiada al portapapeles');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {ROLES.map(role => {
          const count = usersData.filter((u: any) => u.role === role.value).length;
          const Icon = role.icon;
          return (
            <div key={role.value} style={{ background: role.bg, borderRadius: 'var(--dax-radius-md)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={20} color={role.color} />
              <div>
                <p style={{ fontSize: '22px', fontWeight: 700, color: role.color, lineHeight: 1 }}>{count}</p>
                <p style={{ fontSize: '11px', color: role.color, opacity: 0.8, marginTop: '2px' }}>{role.label}{count !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <input
          className="dax-input"
          placeholder="Buscar usuario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '280px', margin: 0 }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowRolesInfo(true)} className="dax-btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}>
            Ver roles
          </button>
          <button onClick={() => setShowInviteModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Invitar usuario
          </button>
        </div>
      </div>

      {/* Lista de usuarios */}
      {isLoading ? (
        <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Cargando usuarios...</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-lg)' }}>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>No se encontraron usuarios</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((u: any) => {
            const role = roleInfo(u.role);
            const Icon = role.icon;
            const isMe = u.id === user?.id;
            return (
              <div key={u.id} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-lg)', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', border: isMe ? `1px solid var(--dax-coral-border)` : '1px solid transparent' }}>

                {/* Avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: role.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: role.color }}>
                      {u.firstName[0]}{u.lastName[0]}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>
                      {u.firstName} {u.lastName}
                    </p>
                    {isMe && (
                      <span style={{ fontSize: '10px', background: 'var(--dax-coral-soft)', color: 'var(--dax-coral)', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>
                        Tú
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{u.email}</p>
                </div>

                {/* Rol */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: role.bg, padding: '5px 10px', borderRadius: '20px', flexShrink: 0 }}>
                  <Icon size={12} color={role.color} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: role.color }}>{role.label}</span>
                </div>

                {/* Estado */}
                <span className={`dax-badge ${u.active ? 'dax-badge-success' : 'dax-badge-danger'}`} style={{ flexShrink: 0 }}>
                  {u.active ? 'Activo' : 'Inactivo'}
                </span>

                {/* Acciones */}
                {!isMe && (
                  <button
                    onClick={() => toggleMutation.mutate(u.id)}
                    disabled={toggleMutation.isPending}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: u.active ? 'var(--dax-danger)' : 'var(--dax-success)', flexShrink: 0 }}
                  >
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal invitar */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>Invitar usuario</h2>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Se generará una contraseña temporal</p>
              </div>
              <button onClick={() => { setShowInviteModal(false); setInviteResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {inviteResult ? (
              <div>
                <div style={{ background: 'var(--dax-success-bg)', borderRadius: 'var(--dax-radius-lg)', padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--dax-success-bg)', border: '2px solid var(--dax-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Check size={24} color="var(--dax-success)" />
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-success)', marginBottom: '4px' }}>Usuario creado exitosamente</p>
                  <p style={{ fontSize: '13px', color: 'var(--dax-text-secondary)', marginBottom: '16px' }}>{inviteResult.email}</p>

                  <div style={{ background: 'var(--dax-surface)', borderRadius: 'var(--dax-radius-md)', padding: '14px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Contraseña temporal:</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <code style={{ fontSize: '18px', fontWeight: 700, color: 'var(--dax-coral)', letterSpacing: '0.1em' }}>
                        {inviteResult.tempPassword}
                      </code>
                      <button
                        onClick={() => copyToClipboard(inviteResult.tempPassword)}
                        className="dax-btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 12px', flexShrink: 0 }}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '16px', textAlign: 'center' }}>
                  Comparte esta contraseña de forma segura. El usuario deberá cambiarla al iniciar sesión.
                </p>
                <button
                  onClick={() => { setShowInviteModal(false); setInviteResult(null); }}
                  className="dax-btn-primary"
                  style={{ width: '100%' }}
                >
                  Listo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label>Nombre</Label>
                    <input className="dax-input" value={inviteForm.firstName} onChange={e => setInviteForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Juan" />
                  </div>
                  <div>
                    <Label>Apellido</Label>
                    <input className="dax-input" value={inviteForm.lastName} onChange={e => setInviteForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Pérez" />
                  </div>
                </div>
                <div>
                  <Label>Correo electrónico</Label>
                  <input className="dax-input" type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} placeholder="juan@empresa.com" />
                </div>
                <div>
                  <Label>Rol</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ROLES.map(role => {
                      const Icon = role.icon;
                      const selected = inviteForm.role === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setInviteForm(p => ({ ...p, role: role.value }))}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: 'var(--dax-radius-md)', border: `1px solid ${selected ? role.color : 'var(--dax-border)'}`, background: selected ? role.bg : 'var(--dax-surface-2)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' }}
                        >
                          <Icon size={16} color={role.color} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: selected ? role.color : 'var(--dax-text-primary)', marginBottom: '2px' }}>{role.label}</p>
                            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{role.desc}</p>
                          </div>
                          {selected && <Check size={14} color={role.color} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button onClick={() => setShowInviteModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>
                    Cancelar
                  </button>
                  <button
                    onClick={() => inviteMutation.mutate()}
                    disabled={inviteMutation.isPending || !inviteForm.email || !inviteForm.firstName || !inviteForm.lastName}
                    className="dax-btn-primary"
                    style={{ flex: 1 }}
                  >
                    {inviteMutation.isPending ? 'Creando...' : 'Crear usuario'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal info roles */}
      {showRolesInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '520px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Roles del sistema</h2>
              <button onClick={() => setShowRolesInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ROLES.map(role => {
                const Icon = role.icon;
                const permissions: Record<string, string[]> = {
                  admin: ['POS', 'Productos', 'Inventario', 'Ventas', 'Sucursales', 'Usuarios', 'Configuración', 'Reportes', 'Exportar'],
                  manager: ['POS', 'Productos', 'Inventario', 'Ventas', 'Sucursales', 'Reportes'],
                  cashier: ['POS'],
                };
                return (
                  <div key={role.value} style={{ background: role.bg, borderRadius: 'var(--dax-radius-lg)', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <Icon size={18} color={role.color} />
                      <p style={{ fontSize: '14px', fontWeight: 700, color: role.color }}>{role.label}</p>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', marginBottom: '10px' }}>{role.desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {permissions[role.value].map(perm => (
                        <span key={perm} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', color: role.color }}>
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}