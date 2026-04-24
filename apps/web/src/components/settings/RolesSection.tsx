'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Plus, X, Check, Trash2, Pencil,
  Loader2, Shield, Lock, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Colores disponibles para roles ───────────────────────────────────────────
const COLORS = [
  '#FF5C35', '#F97316', '#F0A030', '#EAB308',
  '#22C55E', '#3DBF7F', '#5AAAF0', '#0EA5E9',
  '#A78BFA', '#EC4899', '#E05050', '#64748B',
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

// ── Modal crear / editar rol ──────────────────────────────────────────────────
function RoleFormModal({ role, permissions, onClose, onSave, showToast }: {
  role?:        any;
  permissions:  any[];
  onClose:      () => void;
  onSave:       () => void;
  showToast:    (m: string, t?: 'success' | 'error') => void;
}) {
  const isEdit = !!role;

  const [form, setForm] = useState({
    displayName: role?.displayName ?? '',
    name:        role?.name        ?? '',
    color:       role?.color       ?? '#FF5C35',
    permissions: (role?.permissions as string[]) ?? [],
  });

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Agrupa permisos por categoría
  const groups: Record<string, any[]> = {};
  for (const p of permissions) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }

  const togglePerm = useCallback((key: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(k => k !== key)
        : [...prev.permissions, key],
    }));
  }, []);

  const toggleGroup = useCallback((group: string, perms: any[]) => {
    const keys = perms.map(p => p.key);
    const allSelected = keys.every(k => form.permissions.includes(k));
    setForm(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(k => !keys.includes(k))
        : [...new Set([...prev.permissions, ...keys])],
    }));
  }, [form.permissions]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) return api.put(`/roles/${role.id}`, { displayName: form.displayName, color: form.color, permissions: form.permissions });
      return api.post('/roles', form);
    },
    onSuccess: () => { showToast(isEdit ? 'Rol actualizado' : 'Rol creado'); onSave(); },
    onError:   (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="dax-card" style={{ width: '100%', maxWidth: '580px', padding: '28px', maxHeight: '92vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 3px' }}>
              {isEdit ? 'Editar rol' : 'Nuevo rol'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
              {isEdit ? 'Modifica permisos y apariencia' : 'Define un rol personalizado para tu equipo'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Nombre */}
          <div>
            <Label>Nombre del rol</Label>
            <input
              className="dax-input"
              value={form.displayName}
              onChange={e => setForm(p => ({
                ...p,
                displayName: e.target.value,
                name: isEdit ? p.name : e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
              }))}
              placeholder="Ej: Supervisor de turno"
              autoComplete="off"
              style={{ margin: 0 }}
            />
            {!isEdit && form.name && (
              <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
                ID interno: <code style={{ color: 'var(--dax-coral)' }}>{form.name}</code>
              </p>
            )}
          </div>

          {/* Color */}
          <div>
            <Label>Color del rol</Label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: c, border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`,
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                />
              ))}
              {/* Preview */}
              <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: `${form.color}15`, border: `1px solid ${form.color}30` }}>
                <Shield size={12} color={form.color} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: form.color }}>
                  {form.displayName || 'Nombre del rol'}
                </span>
              </div>
            </div>
          </div>

          {/* Permisos */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <Label>Permisos</Label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setForm(p => ({ ...p, permissions: permissions.map(x => x.key) }))} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-coral)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Todos
                </button>
                <span style={{ color: 'var(--dax-border)' }}>·</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, permissions: [] }))} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Ninguno
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(groups).map(([group, perms]) => {
                const allSelected  = perms.every(p => form.permissions.includes(p.key));
                const someSelected = perms.some(p => form.permissions.includes(p.key));
                const isOpen       = openGroups[group] !== false; // abierto por defecto

                return (
                  <div key={group} style={{ border: '1px solid var(--dax-border)', borderRadius: '10px', overflow: 'hidden' }}>
                    {/* Header del grupo */}
                    <div
                      onClick={() => setOpenGroups(p => ({ ...p, [group]: !isOpen }))}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--dax-surface-2)', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggleGroup(group, perms); }}
                          style={{
                            width: '18px', height: '18px', borderRadius: '5px',
                            border: `2px solid ${allSelected ? form.color : someSelected ? form.color : 'var(--dax-border)'}`,
                            background: allSelected ? form.color : someSelected ? `${form.color}30` : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          {allSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                          {someSelected && !allSelected && <div style={{ width: '8px', height: '2px', background: form.color, borderRadius: '1px' }} />}
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{group}</span>
                        <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
                          {perms.filter(p => form.permissions.includes(p.key)).length}/{perms.length}
                        </span>
                      </div>
                      {isOpen ? <ChevronUp size={14} color="var(--dax-text-muted)" /> : <ChevronDown size={14} color="var(--dax-text-muted)" />}
                    </div>

                    {/* Permisos del grupo */}
                    {isOpen && (
                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {perms.map(perm => {
                          const selected = form.permissions.includes(perm.key);
                          return (
                            <button
                              key={perm.key}
                              type="button"
                              onClick={() => togglePerm(perm.key)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '7px 10px', borderRadius: '8px',
                                border: `1px solid ${selected ? `${form.color}40` : 'transparent'}`,
                                background: selected ? `${form.color}08` : 'transparent',
                                cursor: 'pointer', textAlign: 'left', transition: 'all .1s',
                              }}
                            >
                              <div style={{
                                width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                                border: `2px solid ${selected ? form.color : 'var(--dax-border)'}`,
                                background: selected ? form.color : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {selected && <Check size={9} color="#fff" strokeWidth={3} />}
                              </div>
                              <span style={{ fontSize: '12px', color: selected ? 'var(--dax-text-primary)' : 'var(--dax-text-secondary)' }}>
                                {perm.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '8px' }}>
              {form.permissions.length} de {permissions.length} permisos seleccionados
            </p>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.displayName || form.permissions.length === 0}
              className="dax-btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {mutation.isPending
                ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
                : isEdit ? 'Guardar cambios' : 'Crear rol'
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function RolesSection({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const queryClient = useQueryClient();

  const [showForm,    setShowForm]    = useState(false);
  const [editRole,    setEditRole]    = useState<any | null>(null);
  const [deleteRole,  setDeleteRole]  = useState<any | null>(null);

  const { data: roles = [], isLoading, refetch } = useQuery({
    queryKey: ['roles-list'],
    queryFn:  async () => { const { data } = await api.get('/roles'); return data; },
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['roles-permissions'],
    queryFn:  async () => { const { data } = await api.get('/roles/permissions'); return data; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/roles/${id}`),
    onSuccess:  () => { refetch(); showToast('Rol eliminado'); setDeleteRole(null); },
    onError:    (err: any) => showToast(err.response?.data?.message ?? 'Error al eliminar', 'error'),
  });

  const seedMutation = useMutation({
    mutationFn: async () => api.post('/roles/seed-defaults'),
    onSuccess:  () => { refetch(); showToast('Roles predeterminados creados'); },
    onError:    (err: any) => showToast(err.response?.data?.message ?? 'Error', 'error'),
  });

  const customRoles  = (roles as any[]).filter((r: any) => !r.isDefault);
  const defaultRoles = (roles as any[]).filter((r: any) =>  r.isDefault);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>
            {(roles as any[]).length} rol{(roles as any[]).length !== 1 ? 'es' : ''} · {customRoles.length} personalizado{customRoles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {defaultRoles.length === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="dax-btn-secondary"
              style={{ fontSize: '12px', padding: '8px 14px' }}
            >
              {seedMutation.isPending ? 'Creando...' : 'Crear roles base'}
            </button>
          )}
          <button
            onClick={() => { setEditRole(null); setShowForm(true); }}
            className="dax-btn-primary"
            style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Nuevo rol
          </button>
        </div>
      </div>

      {/* Roles del sistema */}
      {defaultRoles.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={11} /> Roles del sistema
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {defaultRoles.map((role: any) => (
              <RoleCard
                key={role.id}
                role={role}
                permissions={permissions as any[]}
                isDefault
                onEdit={() => { setEditRole(role); setShowForm(true); }}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Roles personalizados */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>
          Roles personalizados
        </p>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dax-text-muted)', fontSize: '13px', padding: '16px 0' }}>
            <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Cargando...
          </div>
        ) : customRoles.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', background: 'var(--dax-surface-2)', borderRadius: '14px', border: '2px dashed var(--dax-border)' }}>
            <Shield size={28} color="var(--dax-text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-muted)', marginBottom: '4px' }}>No hay roles personalizados</p>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', opacity: .7, marginBottom: '16px' }}>
              Crea roles con permisos específicos para tu equipo
            </p>
            <button onClick={() => setShowForm(true)} className="dax-btn-primary" style={{ fontSize: '12px', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={13} /> Crear primer rol
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customRoles.map((role: any) => (
              <RoleCard
                key={role.id}
                role={role}
                permissions={permissions as any[]}
                isDefault={false}
                onEdit={() => { setEditRole(role); setShowForm(true); }}
                onDelete={() => setDeleteRole(role)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <RoleFormModal
          role={editRole}
          permissions={permissions as any[]}
          onClose={() => { setShowForm(false); setEditRole(null); }}
          onSave={() => { setShowForm(false); setEditRole(null); refetch(); }}
          showToast={showToast}
        />
      )}

      {/* Modal confirmar eliminación */}
      {deleteRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '400px', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dax-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} color="var(--dax-danger)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>¿Eliminar rol?</h3>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Se eliminará el rol <strong style={{ color: deleteRole.color }}>{deleteRole.displayName}</strong>. Los usuarios con este rol perderán sus permisos personalizados.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setDeleteRole(null)} className="dax-btn-secondary">Cancelar</button>
              <button
                onClick={() => deleteMutation.mutate(deleteRole.id)}
                disabled={deleteMutation.isPending}
                style={{ padding: '11px', borderRadius: '12px', border: 'none', background: 'var(--dax-danger)', color: 'var(--dax-text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {deleteMutation.isPending ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Trash2 size={13} />}
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card de rol ───────────────────────────────────────────────────────────────
function RoleCard({ role, permissions, isDefault, onEdit, onDelete }: {
  role:        any;
  permissions: any[];
  isDefault:   boolean;
  onEdit:      () => void;
  onDelete:    () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rolePerms = (role.permissions as string[]) ?? [];
  const total     = permissions.length;
  const count     = rolePerms.length;
  const pct       = total > 0 ? Math.round((count / total) * 100) : 0;

  // Agrupa permisos activos por categoría
  const activeGroups: Record<string, string[]> = {};
  for (const p of permissions) {
    if (rolePerms.includes(p.key)) {
      if (!activeGroups[p.group]) activeGroups[p.group] = [];
      activeGroups[p.group].push(p.label);
    }
  }

  return (
    <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', border: `1px solid ${role.color}20`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Ícono color */}
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${role.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${role.color}25` }}>
          <Shield size={16} color={role.color} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{role.displayName}</p>
            {isDefault && (
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', background: `${role.color}15`, color: role.color, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Lock size={8} /> Sistema
              </span>
            )}
          </div>
          {/* Barra de permisos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '4px', background: 'var(--dax-border)', borderRadius: '99px', overflow: 'hidden', maxWidth: '120px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: role.color, borderRadius: '99px', transition: 'width .4s' }} />
            </div>
            <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{count}/{total} permisos</span>
          </div>
        </div>

        {/* Usuarios */}
        <div style={{ textAlign: 'center', minWidth: '50px' }}>
          <p style={{ fontSize: '16px', fontWeight: 800, color: role.color, lineHeight: 1 }}>{role._count?.users ?? 0}</p>
          <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>usuario{role._count?.users !== 1 ? 's' : ''}</p>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '7px', display: 'flex' }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button onClick={onEdit} style={{ background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '7px', display: 'flex' }}>
            <Pencil size={13} />
          </button>
          {!isDefault && (
            <button onClick={onDelete} style={{ background: 'var(--dax-surface)', border: '1px solid rgba(224,80,80,.2)', cursor: 'pointer', color: 'var(--dax-danger)', padding: '6px', borderRadius: '7px', display: 'flex' }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Permisos expandidos */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--dax-border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(activeGroups).map(([group, labels]) => (
            <div key={group}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>{group}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {labels.map(label => (
                  <span key={label} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: `${role.color}12`, color: role.color, fontWeight: 600 }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(activeGroups).length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Sin permisos asignados</p>
          )}
        </div>
      )}
    </div>
  );
}
