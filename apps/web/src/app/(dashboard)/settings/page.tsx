'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  User, Building2, CreditCard, Users, Globe,
  Bell, Shield, Printer, Palette, Database,
  ChevronRight, Check, ChevronLeft, Plus, X,
} from 'lucide-react';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { BusinessSection } from '@/components/settings/BusinessSection';
import { PlanSection } from '@/components/settings/PlanSection';
import { UsersSection } from '@/components/settings/UsersSection';
import { LocaleSection } from '@/components/settings/LocaleSection';
import { RolesSection } from '@/components/settings/RolesSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { DataSection } from '@/components/settings/DataSection';

const SECTIONS = [
  { id: 'profile', label: 'Perfil', icon: User, desc: 'Tu información personal' },
  { id: 'business', label: 'Negocio', icon: Building2, desc: 'Datos del tenant' },
  { id: 'plan', label: 'Plan y suscripción', icon: CreditCard, desc: 'Tu plan actual y módulos' },
  { id: 'users', label: 'Usuarios y roles', icon: Users, desc: 'Gestiona tu equipo' },
  { id: 'locale', label: 'Moneda e idioma', icon: Globe, desc: 'Región y formato' },
  { id: 'notifications', label: 'Notificaciones', icon: Bell, desc: 'Alertas y avisos' },
  { id: 'security', label: 'Seguridad', icon: Shield, desc: 'Contraseña y acceso' },
  { id: 'printing', label: 'Impresión', icon: Printer, desc: 'Recibos y tickets' },
  { id: 'appearance', label: 'Apariencia', icon: Palette, desc: 'Tema y visualización' },
  { id: 'data', label: 'Datos y backups', icon: Database, desc: 'Exportar y respaldar' },
  { id: 'roles', label: 'Roles', icon: Shield, desc: 'Roles y permisos personalizados' },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

const SectionHeader = ({ title, desc }: { title: string; desc: string }) => (
  <div style={{ marginBottom: '28px' }}>
    <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>{title}</h2>
    <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>{desc}</p>
  </div>
);

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: value ? 'var(--dax-coral)' : 'var(--dax-surface-3)', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
    <span style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease', display: 'block' }} />
  </button>
);

const Toast = ({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) => (
  <div style={{ background: type === 'success' ? 'var(--dax-success-bg)' : 'var(--dax-danger-bg)', border: `1px solid ${type === 'success' ? 'rgba(61,191,127,0.2)' : 'rgba(224,80,80,0.2)'}`, borderRadius: 'var(--dax-radius-md)', padding: '10px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Check size={14} color={type === 'success' ? 'var(--dax-success)' : 'var(--dax-danger)'} />
    <p style={{ fontSize: '13px', color: type === 'success' ? 'var(--dax-success)' : 'var(--dax-danger)', fontWeight: 600 }}>{message}</p>
  </div>
);

const planFeatures: Record<string, { label: string; included: boolean }[]> = {
  starter: [
    { label: 'POS básico', included: true },
    { label: 'Inventario básico', included: true },
    { label: '1 sucursal', included: true },
    { label: '3 usuarios', included: true },
    { label: 'Reportes avanzados', included: false },
    { label: 'Múltiples sucursales', included: false },
    { label: 'Módulos de industria', included: false },
  ],
  growth: [
    { label: 'POS completo', included: true },
    { label: 'Inventario avanzado', included: true },
    { label: 'Hasta 3 sucursales', included: true },
    { label: 'Hasta 15 usuarios', included: true },
    { label: 'Reportes y analytics', included: true },
    { label: 'Módulos de industria', included: true },
    { label: 'Exportar reportes', included: false },
  ],
  scale: [
    { label: 'POS completo', included: true },
    { label: 'Inventario con lotes', included: true },
    { label: 'Sucursales ilimitadas', included: true },
    { label: 'Usuarios ilimitados', included: true },
    { label: 'Analytics avanzado', included: true },
    { label: 'Exportar reportes', included: true },
    { label: 'White-label', included: true },
  ],
};

export default function SettingsPage() {
  const { user, tenant } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !activeSection) setActiveSection('profile');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [notifForm, setNotifForm] = useState({ lowStock: true, dailySummary: true, newSale: false, systemAlerts: true });
  const [printForm, setPrintForm] = useState({ receiptHeader: tenant?.name ?? '', receiptFooter: 'Gracias por su compra', printCopies: '1', autoPrint: false });
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', role: 'cashier' });
  const [inviteResult, setInviteResult] = useState<{ tempPassword: string; email: string } | null>(null);

  const { data: tenantData } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: async () => { const { data } = await api.get('/tenants/me'); return data; },
  });

  const { data: usersData = [], refetch: refetchUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => { const { data } = await api.get('/users'); return data; },
    enabled: activeSection === 'users',
  });

  const inviteMutation = useMutation({
    mutationFn: async () => api.post('/users/invite', inviteForm),
    onSuccess: (res) => {
      setInviteResult({ tempPassword: res.data.tempPassword, email: inviteForm.email });
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'cashier' });
      refetchUsers();
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al invitar usuario', 'error'),
  });

  const toggleUserMutation = useMutation({
    mutationFn: async (userId: string) => api.put(`/users/${userId}/toggle`),
    onSuccess: () => refetchUsers(),
  });

  const planName = (tenantData?.subscription?.plan?.name ?? 'starter') as string;
  const planDisplay = tenantData?.subscription?.plan?.displayName ?? 'Starter';
  const planPrice = tenantData?.subscription?.plan?.priceMonthly ?? 29;

  const SectionContent = () => (
    <div className="dax-card" style={{ padding: 'clamp(20px, 4vw, 32px)', flex: 1 }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {activeSection === 'profile' && (
        <div>
          <SectionHeader title="Perfil de usuario" desc="Tu información personal y profesional" />
          <ProfileSection showToast={showToast} />
        </div>
      )}

      {activeSection === 'business' && (
        <div>
          <SectionHeader title="Datos del negocio" desc="Información de tu empresa en DaxCloud" />
          <BusinessSection showToast={showToast} />
        </div>
      )}

      {activeSection === 'plan' && (
        <div>
          <SectionHeader title="Plan y suscripción" desc="Gestiona tu plan y facturación" />
          <PlanSection showToast={showToast} />
        </div>
      )}
      {activeSection === 'users' && (
        <div>
          <SectionHeader title="Usuarios y roles" desc="Gestiona quién tiene acceso a DaxCloud" />
          <UsersSection showToast={showToast} />
          {showInviteModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>Invitar usuario</h2>
                  <button onClick={() => { setShowInviteModal(false); setInviteResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>
                {inviteResult ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ background: 'var(--dax-success-bg)', borderRadius: 'var(--dax-radius-md)', padding: '20px', marginBottom: '20px' }}>
                      <Check size={32} color="var(--dax-success)" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-success)', marginBottom: '8px' }}>Usuario creado</p>
                      <p style={{ fontSize: '13px', color: 'var(--dax-text-secondary)', marginBottom: '12px' }}>{inviteResult.email}</p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Contraseña temporal:</p>
                      <div style={{ background: 'var(--dax-surface)', borderRadius: 'var(--dax-radius-md)', padding: '12px', fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: 'var(--dax-coral)', letterSpacing: '0.1em' }}>
                        {inviteResult.tempPassword}
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '16px' }}>Comparte esta contraseña con el usuario.</p>
                    <button onClick={() => { setShowInviteModal(false); setInviteResult(null); }} className="dax-btn-primary" style={{ width: '100%' }}>Entendido</button>
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
                      <select className="dax-input" value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}>
                        <option value="cashier">Cajero — Solo POS</option>
                        <option value="manager">Manager — Sin configuración</option>
                        <option value="admin">Admin — Acceso total</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button onClick={() => setShowInviteModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                      <button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !inviteForm.email || !inviteForm.firstName} className="dax-btn-primary" style={{ flex: 1 }}>
                        {inviteMutation.isPending ? 'Creando...' : 'Crear usuario'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>{usersData.length} usuario{usersData.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowInviteModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Invitar usuario
            </button>
          </div>
          <div className="dax-table-wrap">
            <table className="dax-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {usersData.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '24px' }}>No hay usuarios</td></tr>
                ) : usersData.map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                    <td style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>{u.email}</td>
                    <td><span className="dax-badge dax-badge-info">{u.role}</span></td>
                    <td style={{ textAlign: 'center' }}><span className={`dax-badge ${u.active ? 'dax-badge-success' : 'dax-badge-danger'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      {u.id !== user?.id && (
                        <button onClick={() => toggleUserMutation.mutate(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: u.active ? 'var(--dax-danger)' : 'var(--dax-success)' }}>
                          {u.active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'roles' && (
        <div>
          <SectionHeader title="Roles y permisos" desc="Crea roles personalizados para tu equipo" />
          <RolesSection showToast={showToast} />
        </div>
      )}

      {activeSection === 'locale' && (
        <div>
          <SectionHeader title="Moneda e idioma" desc="Región, formato y preferencias de visualización" />
          <LocaleSection showToast={showToast} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
            <div>
              <Label>Moneda activa</Label>
              <input className="dax-input" value={`${tenant?.currency} — ${tenant?.locale}`} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '6px' }}>Para cambiar la moneda contacta a soporte en jacana-dev.com</p>
            </div>
            <div>
              <Label>País</Label>
              <input className="dax-input" value={tenant?.country ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div>
              <Label>Formato de fecha</Label>
              <select className="dax-input">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <Label>Zona horaria</Label>
              <select className="dax-input">
                <option>America/Costa_Rica (GMT-6)</option>
                <option>America/Mexico_City (GMT-6)</option>
                <option>America/Bogota (GMT-5)</option>
                <option>America/Lima (GMT-5)</option>
                <option>America/Santiago (GMT-4)</option>
                <option>America/Buenos_Aires (GMT-3)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => showToast('Preferencias de región guardadas')} className="dax-btn-primary">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div>
          <SectionHeader title="Notificaciones" desc="Configura qué alertas quieres recibir" />
          <NotificationsSection showToast={showToast} />
        </div>
      )}

      {activeSection === 'security' && (
        <div>
          <SectionHeader title="Seguridad" desc="Contraseña y acceso a tu cuenta" />
          <SecuritySection showToast={showToast} />
        </div>
      )}

      {activeSection === 'printing' && (
        <div>
          <SectionHeader title="Configuración de impresión" desc="Personaliza tus recibos y tickets" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
            <div>
              <Label>Encabezado del recibo</Label>
              <input className="dax-input" value={printForm.receiptHeader} onChange={e => setPrintForm(p => ({ ...p, receiptHeader: e.target.value }))} />
            </div>
            <div>
              <Label>Pie del recibo</Label>
              <input className="dax-input" value={printForm.receiptFooter} onChange={e => setPrintForm(p => ({ ...p, receiptFooter: e.target.value }))} />
            </div>
            <div>
              <Label>Copias por venta</Label>
              <select className="dax-input" value={printForm.printCopies} onChange={e => setPrintForm(p => ({ ...p, printCopies: e.target.value }))}>
                <option value="1">1 copia</option>
                <option value="2">2 copias</option>
                <option value="3">3 copias</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>Imprimir automáticamente</p>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Al completar una venta</p>
              </div>
              <Toggle value={printForm.autoPrint} onChange={() => setPrintForm(p => ({ ...p, autoPrint: !p.autoPrint }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => showToast('Configuración de impresión guardada')} className="dax-btn-primary">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'appearance' && (
        <div>
          <SectionHeader title="Apariencia" desc="Personaliza la visualización del sistema" />
          <AppearanceSection showToast={showToast} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
            <div>
              <Label>Tema</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[{ value: 'dark', label: 'Carbón', color: '#1A1A1A' }, { value: 'light', label: 'Claro', color: '#F4F2EE' }].map(theme => (
                  <button key={theme.value} style={{ padding: '16px', borderRadius: 'var(--dax-radius-lg)', border: theme.value === 'dark' ? '2px solid var(--dax-coral)' : '1px solid var(--dax-border)', background: theme.color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FF5C35', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.value === 'dark' ? '#fff' : '#0F0F0F' }}>{theme.label}</span>
                    {theme.value === 'dark' && <Check size={14} color="#FF5C35" style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Densidad</Label>
              <select className="dax-input">
                <option>Cómoda (recomendada)</option>
                <option>Compacta</option>
                <option>Espaciosa</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => showToast('Preferencias de apariencia guardadas')} className="dax-btn-primary">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'data' && (
        <div>
          <SectionHeader title="Datos y backups" desc="Exporta y respalda tu información" />
          <DataSection showToast={showToast} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>
            {[
              { label: 'Exportar productos', desc: 'Catálogo completo en Excel', endpoint: '/exports/products', filename: 'productos' },
              { label: 'Exportar ventas', desc: 'Historial de transacciones', endpoint: '/exports/sales', filename: 'ventas' },
              { label: 'Exportar inventario', desc: 'Stock actual por sucursal', endpoint: '/exports/inventory', filename: 'inventario' },
              { label: 'Backup completo', desc: 'Todos los datos en Excel', endpoint: '/exports/backup', filename: 'backup-daxcloud' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.desc}</p>
                </div>
                <button
                  className="dax-btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('nexora_token');
                      const res = await fetch(`http://localhost:3001/api${item.endpoint}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (!res.ok) {
                        const errorText = await res.text();
                        console.error('Error response:', res.status, errorText);
                        showToast(`Error ${res.status}`, 'error');
                        return;
                      }
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${item.filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast(`${item.label} descargado correctamente`);
                    } catch (err: any) {
                      showToast(`Error: ${err.message}`, 'error');
                    }
                  }}
                >
                  Exportar
                </button>
              </div>
            ))}
            <div style={{ marginTop: '8px', padding: '16px', background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,0.15)', borderRadius: 'var(--dax-radius-md)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-danger)', marginBottom: '4px' }}>Zona de peligro</p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '12px' }}>Esta acción es irreversible.</p>
              <button style={{ background: 'none', border: '1px solid var(--dax-danger)', color: 'var(--dax-danger)', padding: '8px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Eliminar todos los datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 48px)', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isMobile && activeSection && (
          <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', marginBottom: '4px' }}>
            {isMobile && activeSection ? SECTIONS.find(s => s.id === activeSection)?.label : 'Configuración'}
          </h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>
            {isMobile && activeSection ? SECTIONS.find(s => s.id === activeSection)?.desc : 'Gestiona tu cuenta y preferencias'}
          </p>
        </div>
      </div>

      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'start' }}>
          <div className="dax-card" style={{ padding: '8px', position: 'sticky', top: '24px' }}>
            {SECTIONS.map(section => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button key={section.id} onClick={() => setActiveSection(section.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--dax-radius-md)', background: active ? 'var(--dax-coral-soft)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', marginBottom: '2px' }}>
                  <Icon size={15} color={active ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} strokeWidth={active ? 2.2 : 1.8} />
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 400, color: active ? 'var(--dax-coral)' : 'var(--dax-text-secondary)', flex: 1 }}>{section.label}</span>
                  {active && <ChevronRight size={14} color="var(--dax-coral)" />}
                </button>
              );
            })}
          </div>
          <SectionContent />
        </div>
      )}

      {isMobile && !activeSection && (
        <div className="dax-card" style={{ padding: '8px' }}>
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <button key={section.id} onClick={() => setActiveSection(section.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--dax-border-soft)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--dax-radius-md)', background: 'var(--dax-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="var(--dax-coral)" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{section.label}</p>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{section.desc}</p>
                </div>
                <ChevronRight size={16} color="var(--dax-text-muted)" />
              </button>
            );
          })}
        </div>
      )}

      {isMobile && activeSection && <SectionContent />}
    </div>
  );
}