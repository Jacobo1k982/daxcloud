'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Plus, X, Search, AlertTriangle, Package,
  Users, FileText, Clock, TrendingUp, CheckCircle,
  AlertCircle, Calendar,
} from 'lucide-react';

type Tab = 'dashboard' | 'lots' | 'expiring' | 'prescriptions' | 'clients';

const PRESCRIPTION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pendiente',  color: '#F0A030',            bg: 'rgba(240,160,48,.12)' },
  dispensed: { label: 'Despachada', color: 'var(--dax-success)', bg: 'var(--dax-success-bg)' },
  partial:   { label: 'Parcial',    color: '#5AAAF0',            bg: 'rgba(90,170,240,.12)' },
  cancelled: { label: 'Cancelada',  color: 'var(--dax-danger)',  bg: 'var(--dax-danger-bg)' },
};

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const daysUntil = (date: string) => {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function PharmacyPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [search, setSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const [showLotModal, setShowLotModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [lotForm, setLotForm] = useState({
    productId: '', lotNumber: '', quantity: 1,
    expirationDate: '', supplier: '', unitCost: 0,
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    clientName: '', clientId: '', doctorName: '', notes: '',
    items: [] as { productId: string; quantity: number; dosage: string; instructions: string }[],
  });

  const [clientForm, setClientForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    idNumber: '', birthDate: '', notes: '',
  });

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['pharmacy-stats'],
    queryFn: async () => { const { data } = await api.get('/pharmacy/stats'); return data; },
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['pharmacy-lots'],
    queryFn: async () => { const { data } = await api.get('/pharmacy/lots'); return data; },
    enabled: tab === 'lots' || tab === 'dashboard',
  });

  const { data: expiringLots = [] } = useQuery({
    queryKey: ['pharmacy-expiring'],
    queryFn: async () => { const { data } = await api.get('/pharmacy/lots/expiring?days=30'); return data; },
    enabled: tab === 'expiring' || tab === 'dashboard',
  });

  const { data: expiredLots = [] } = useQuery({
    queryKey: ['pharmacy-expired'],
    queryFn: async () => { const { data } = await api.get('/pharmacy/lots/expired'); return data; },
    enabled: tab === 'expiring' || tab === 'dashboard',
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['pharmacy-prescriptions'],
    queryFn: async () => { const { data } = await api.get('/pharmacy/prescriptions'); return data; },
    enabled: tab === 'prescriptions' || tab === 'dashboard',
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['pharmacy-clients', clientSearch],
    queryFn: async () => { const { data } = await api.get(`/pharmacy/clients?search=${clientSearch}`); return data; },
    enabled: tab === 'clients',
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await api.get('/products'); return data; },
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => { const { data } = await api.get('/branches'); return data; },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['pharmacy-stats'] });
    queryClient.invalidateQueries({ queryKey: ['pharmacy-lots'] });
    queryClient.invalidateQueries({ queryKey: ['pharmacy-expiring'] });
    queryClient.invalidateQueries({ queryKey: ['pharmacy-expired'] });
  };

  // Mutations
  const lotMutation = useMutation({
    mutationFn: async () => api.post('/pharmacy/lots', lotForm),
    onSuccess: () => {
      invalidateAll();
      setShowLotModal(false);
      setLotForm({ productId: '', lotNumber: '', quantity: 1, expirationDate: '', supplier: '', unitCost: 0 });
    },
  });

  const prescriptionMutation = useMutation({
    mutationFn: async () => api.post('/pharmacy/prescriptions', prescriptionForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-stats'] });
      setShowPrescriptionModal(false);
      setPrescriptionForm({ clientName: '', clientId: '', doctorName: '', notes: '', items: [] });
    },
  });

  const prescriptionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.put(`/pharmacy/prescriptions/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pharmacy-prescriptions'] }),
  });

  const clientMutation = useMutation({
    mutationFn: async () => api.post('/pharmacy/clients', clientForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-clients'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-stats'] });
      setShowClientModal(false);
      setClientForm({ firstName: '', lastName: '', phone: '', email: '', idNumber: '', birthDate: '', notes: '' });
    },
  });

  const lotStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/pharmacy/lots/${id}`, { active }),
    onSuccess: () => invalidateAll(),
  });

  const addPrescriptionItem = () => {
    setPrescriptionForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1, dosage: '', instructions: '' }] }));
  };

  const removePrescriptionItem = (i: number) => {
    setPrescriptionForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  };

  const updatePrescriptionItem = (i: number, field: string, value: any) => {
    setPrescriptionForm(p => ({ ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));
  };

  const filteredLots = lots.filter((l: any) =>
    l.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.lotNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { id: 'dashboard',     label: 'Dashboard',      icon: TrendingUp },
    { id: 'lots',          label: 'Lotes',           icon: Package },
    { id: 'expiring',      label: 'Vencimientos',    icon: Clock },
    { id: 'prescriptions', label: 'Recetas médicas', icon: FileText },
    { id: 'clients',       label: 'Pacientes',       icon: Users },
  ] as { id: Tab; label: string; icon: any }[];

  return (
    <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--dax-radius-lg)', background: 'rgba(90,170,240,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '22px' }}>💊</span>
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '2px' }}>Farmacia y Salud</h1>
            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Control de lotes, vencimientos y recetas médicas</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tab === 'lots' && <button onClick={() => setShowLotModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nuevo lote</button>}
          {tab === 'prescriptions' && <button onClick={() => setShowPrescriptionModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nueva receta</button>}
          {tab === 'clients' && <button onClick={() => setShowClientModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nuevo paciente</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? '#5AAAF0' : 'var(--dax-surface)', color: active ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0 }}>
              <Icon size={13} />
              {t.label}
              {t.id === 'expiring' && (stats?.expiringIn30 > 0 || stats?.expiredLots > 0) && (
                <span style={{ background: '#fff', color: '#5AAAF0', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                  {(stats?.expiredLots ?? 0) + (stats?.expiringIn30 ?? 0)}
                </span>
              )}
              {t.id === 'prescriptions' && stats?.pendingPrescriptions > 0 && (
                <span style={{ background: '#fff', color: '#5AAAF0', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                  {stats.pendingPrescriptions}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Lotes activos',      value: stats?.totalLots ?? 0,            color: '#5AAAF0',            icon: Package },
              { label: 'Vencen en 7 días',   value: stats?.expiringIn7 ?? 0,          color: '#F0A030',            icon: AlertCircle },
              { label: 'Vencen en 30 días',  value: stats?.expiringIn30 ?? 0,         color: '#F0A030',            icon: Calendar },
              { label: 'Lotes vencidos',     value: stats?.expiredLots ?? 0,          color: 'var(--dax-danger)',  icon: AlertTriangle },
              { label: 'Recetas pendientes', value: stats?.pendingPrescriptions ?? 0,  color: '#F0A030',            icon: FileText },
              { label: 'Pacientes',          value: stats?.totalClients ?? 0,          color: 'var(--dax-success)', icon: Users },
              { label: 'Ventas del mes',     value: formatCurrency(stats?.monthRevenue ?? 0), color: 'var(--dax-coral)', icon: TrendingUp, isText: true },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="dax-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--dax-radius-md)', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={s.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alertas vencidos */}
          {expiredLots.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(224,80,80,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={15} color="var(--dax-danger)" />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Lotes vencidos — Acción requerida</p>
                <span style={{ fontSize: '11px', background: 'var(--dax-danger-bg)', color: 'var(--dax-danger)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{expiredLots.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {expiredLots.slice(0, 5).map((lot: any) => (
                  <div key={lot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--dax-danger-bg)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{lot.product?.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Lote: {lot.lotNumber} · {lot.quantity} unidades · Venció {new Date(lot.expirationDate).toLocaleDateString('es-CR')}</p>
                    </div>
                    <button onClick={() => lotStatusMutation.mutate({ id: lot.id, active: false })} style={{ background: 'none', border: '1px solid var(--dax-danger)', color: 'var(--dax-danger)', padding: '5px 12px', borderRadius: 'var(--dax-radius-md)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      Dar de baja
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximos a vencer */}
          {expiringLots.filter((l: any) => daysUntil(l.expirationDate) > 0).length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(240,160,48,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Clock size={15} color="#F0A030" />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Próximos a vencer (30 días)</p>
              </div>
              <div className="dax-table-wrap">
                <table className="dax-table">
                  <thead>
                    <tr><th>Producto</th><th>Lote</th><th>Cantidad</th><th>Vence</th><th style={{ textAlign: 'center' }}>Días restantes</th></tr>
                  </thead>
                  <tbody>
                    {expiringLots.filter((l: any) => daysUntil(l.expirationDate) > 0).map((lot: any) => {
                      const days = daysUntil(lot.expirationDate);
                      return (
                        <tr key={lot.id}>
                          <td>
                            <p style={{ fontWeight: 600 }}>{lot.product?.name}</p>
                            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{lot.product?.sku}</p>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{lot.lotNumber}</td>
                          <td style={{ fontWeight: 600 }}>{lot.quantity}</td>
                          <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{new Date(lot.expirationDate).toLocaleDateString('es-CR')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: days <= 7 ? 'var(--dax-danger)' : '#F0A030', background: days <= 7 ? 'var(--dax-danger-bg)' : 'rgba(240,160,48,.12)', padding: '3px 10px', borderRadius: '10px' }}>
                              {days} días
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recetas pendientes */}
          {prescriptions.filter((p: any) => p.status === 'pending').length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FileText size={15} color="var(--dax-coral)" />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Recetas pendientes de despacho</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prescriptions.filter((p: any) => p.status === 'pending').slice(0, 5).map((rx: any) => (
                  <div key={rx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{rx.clientName}</p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                        {rx.doctorName && `Dr. ${rx.doctorName} · `}{rx.items.length} medicamento{rx.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button onClick={() => { prescriptionStatusMutation.mutate({ id: rx.id, status: 'dispensed' }); }} className="dax-btn-primary" style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Despachar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LOTES ── */}
      {tab === 'lots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dax-card" style={{ padding: '14px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
              <input className="dax-input" style={{ paddingLeft: '36px', margin: 0 }} placeholder="Buscar por producto o número de lote..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="dax-card">
            <div className="dax-table-wrap">
              <table className="dax-table">
                <thead>
                  <tr><th>Producto</th><th>Lote</th><th>Cantidad</th><th>Proveedor</th><th>Costo unit.</th><th>Vencimiento</th><th style={{ textAlign: 'center' }}>Estado</th><th style={{ textAlign: 'center' }}>Acción</th></tr>
                </thead>
                <tbody>
                  {filteredLots.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--dax-text-muted)', padding: '32px' }}>No hay lotes registrados</td></tr>
                  ) : filteredLots.map((lot: any) => {
                    const days = lot.expirationDate ? daysUntil(lot.expirationDate) : null;
                    const expired = days !== null && days <= 0;
                    const warning = days !== null && days > 0 && days <= 30;
                    return (
                      <tr key={lot.id}>
                        <td>
                          <p style={{ fontWeight: 600 }}>{lot.product?.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{lot.product?.sku} · {lot.branch?.name}</p>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{lot.lotNumber}</td>
                        <td style={{ fontWeight: 700, color: lot.quantity === 0 ? 'var(--dax-danger)' : 'var(--dax-text-primary)' }}>{lot.quantity}</td>
                        <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{lot.supplier ?? '—'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{lot.unitCost ? formatCurrency(Number(lot.unitCost)) : '—'}</td>
                        <td>
                          {lot.expirationDate ? (
                            <div>
                              <p style={{ fontSize: '12px', color: expired ? 'var(--dax-danger)' : warning ? '#F0A030' : 'var(--dax-text-secondary)', fontWeight: 600 }}>
                                {new Date(lot.expirationDate).toLocaleDateString('es-CR')}
                              </p>
                              {days !== null && (
                                <p style={{ fontSize: '10px', color: expired ? 'var(--dax-danger)' : warning ? '#F0A030' : 'var(--dax-text-muted)' }}>
                                  {expired ? `Venció hace ${Math.abs(days)} días` : `${days} días`}
                                </p>
                              )}
                            </div>
                          ) : <span style={{ color: 'var(--dax-text-muted)', fontSize: '12px' }}>Sin fecha</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`dax-badge ${expired ? 'dax-badge-danger' : warning ? 'dax-badge-warning' : 'dax-badge-success'}`}>
                            {expired ? 'Vencido' : warning ? 'Por vencer' : 'OK'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {expired && (
                            <button onClick={() => lotStatusMutation.mutate({ id: lot.id, active: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-danger)' }}>
                              Dar de baja
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: VENCIMIENTOS ── */}
      {tab === 'expiring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {expiredLots.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px', border: '1px solid rgba(224,80,80,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertTriangle size={15} color="var(--dax-danger)" />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-danger)' }}>Lotes vencidos ({expiredLots.length})</p>
              </div>
              <div className="dax-table-wrap">
                <table className="dax-table">
                  <thead><tr><th>Producto</th><th>Lote</th><th>Cantidad</th><th>Venció</th><th style={{ textAlign: 'center' }}>Acción</th></tr></thead>
                  <tbody>
                    {expiredLots.map((lot: any) => (
                      <tr key={lot.id}>
                        <td><p style={{ fontWeight: 600 }}>{lot.product?.name}</p><p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{lot.branch?.name}</p></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{lot.lotNumber}</td>
                        <td style={{ fontWeight: 700, color: 'var(--dax-danger)' }}>{lot.quantity}</td>
                        <td style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 600 }}>{new Date(lot.expirationDate).toLocaleDateString('es-CR')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => lotStatusMutation.mutate({ id: lot.id, active: false })} style={{ background: 'none', border: '1px solid var(--dax-danger)', color: 'var(--dax-danger)', padding: '5px 12px', borderRadius: 'var(--dax-radius-md)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            Dar de baja
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="dax-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Clock size={15} color="#F0A030" />
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Próximos a vencer — 30 días</p>
            </div>
            {expiringLots.filter((l: any) => daysUntil(l.expirationDate) > 0).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <CheckCircle size={32} color="var(--dax-success)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>No hay lotes próximos a vencer en los próximos 30 días</p>
              </div>
            ) : (
              <div className="dax-table-wrap">
                <table className="dax-table">
                  <thead><tr><th>Producto</th><th>Lote</th><th>Sucursal</th><th>Cantidad</th><th>Vencimiento</th><th style={{ textAlign: 'center' }}>Urgencia</th></tr></thead>
                  <tbody>
                    {expiringLots.filter((l: any) => daysUntil(l.expirationDate) > 0).map((lot: any) => {
                      const days = daysUntil(lot.expirationDate);
                      return (
                        <tr key={lot.id}>
                          <td><p style={{ fontWeight: 600 }}>{lot.product?.name}</p><p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{lot.product?.category}</p></td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{lot.lotNumber}</td>
                          <td style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{lot.branch?.name ?? '—'}</td>
                          <td style={{ fontWeight: 600 }}>{lot.quantity}</td>
                          <td style={{ fontSize: '12px' }}>{new Date(lot.expirationDate).toLocaleDateString('es-CR')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: days <= 7 ? 'var(--dax-danger)' : '#F0A030', background: days <= 7 ? 'var(--dax-danger-bg)' : 'rgba(240,160,48,.12)', padding: '3px 10px', borderRadius: '10px' }}>
                              {days <= 7 ? '🔴' : '🟡'} {days} días
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: PRESCRIPCIONES ── */}
      {tab === 'prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {prescriptions.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center' }}>
              <FileText size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay recetas médicas registradas</p>
            </div>
          ) : prescriptions.map((rx: any) => {
            const sc = PRESCRIPTION_STATUS[rx.status];
            return (
              <div key={rx.id} className="dax-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: '10px' }}>{sc.label}</span>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{rx.clientName}</p>
                    </div>
                    {rx.doctorName && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Prescrito por: Dr. {rx.doctorName}</p>}
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>
                      {new Date(rx.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {rx.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => prescriptionStatusMutation.mutate({ id: rx.id, status: 'partial' })} className="dax-btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>
                        Parcial
                      </button>
                      <button onClick={() => prescriptionStatusMutation.mutate({ id: rx.id, status: 'dispensed' })} className="dax-btn-primary" style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> Despachar
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '10px' }}>
                  {rx.items.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{item.product?.name} × {item.quantity}</p>
                        {item.dosage && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Dosis: {item.dosage}</p>}
                        {item.instructions && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.instructions}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {rx.notes && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '8px', fontStyle: 'italic' }}>{rx.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: CLIENTES / PACIENTES ── */}
      {tab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dax-card" style={{ padding: '14px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
              <input className="dax-input" style={{ paddingLeft: '36px', margin: 0 }} placeholder="Buscar por nombre, teléfono o cédula..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
            </div>
          </div>

          {selectedClient ? (
            <div>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--dax-coral)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                ← Volver a pacientes
              </button>
              <div className="dax-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(90,170,240,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#5AAAF0' }}>{selectedClient.firstName[0]}{selectedClient.lastName?.[0] ?? ''}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>{selectedClient.firstName} {selectedClient.lastName}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedClient.phone && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📞 {selectedClient.phone}</span>}
                      {selectedClient.idNumber && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>🪪 {selectedClient.idNumber}</span>}
                      {selectedClient.birthDate && <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>🎂 {new Date(selectedClient.birthDate).toLocaleDateString('es-CR')}</span>}
                    </div>
                  </div>
                </div>
                {selectedClient.notes && (
                  <div style={{ padding: '12px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', fontStyle: 'italic' }}>{selectedClient.notes}</p>
                  </div>
                )}
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-secondary)', marginBottom: '12px' }}>Historial de recetas ({selectedClient.prescriptions?.length ?? 0})</p>
                {selectedClient.prescriptions?.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '20px' }}>Sin historial de recetas</p>
                ) : selectedClient.prescriptions?.map((rx: any) => (
                  <div key={rx.id} style={{ padding: '12px 16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{new Date(rx.createdAt).toLocaleDateString('es-CR')}</p>
                      <span className={`dax-badge ${rx.status === 'dispensed' ? 'dax-badge-success' : 'dax-badge-warning'}`}>{PRESCRIPTION_STATUS[rx.status]?.label}</span>
                    </div>
                    {rx.items.map((item: any, i: number) => (
                      <p key={i} style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>• {item.product?.name} × {item.quantity}{item.dosage ? ` — ${item.dosage}` : ''}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {clients.length === 0 ? (
                <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                  <Users size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                  <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay pacientes registrados</p>
                </div>
              ) : clients.map((client: any) => (
                <div key={client.id} className="dax-card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'all .15s' }} onClick={() => setSelectedClient(client)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(90,170,240,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#5AAAF0' }}>{client.firstName[0]}{client.lastName?.[0] ?? ''}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{client.firstName} {client.lastName}</p>
                      {client.phone && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{client.phone}</p>}
                      {client.idNumber && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Cédula: {client.idNumber}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {client._count?.prescriptions > 0 && <p style={{ fontSize: '11px', color: '#5AAAF0' }}>{client._count.prescriptions} receta{client._count.prescriptions !== 1 ? 's' : ''}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          MODALES
      ══════════════════════════════════════ */}

      {/* Modal Lote */}
      {showLotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Registrar lote</h2>
              <button onClick={() => setShowLotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <Label>Producto / Medicamento</Label>
                <select className="dax-input" value={lotForm.productId} onChange={e => setLotForm(p => ({ ...p, productId: e.target.value }))}>
                  <option value="">Selecciona producto...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label>Número de lote</Label>
                  <input className="dax-input" value={lotForm.lotNumber} onChange={e => setLotForm(p => ({ ...p, lotNumber: e.target.value }))} placeholder="Ej: LOT-2024-001" />
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <input className="dax-input" type="number" min="1" value={lotForm.quantity} onChange={e => setLotForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div>
                <Label>Fecha de vencimiento</Label>
                <input className="dax-input" type="date" value={lotForm.expirationDate} onChange={e => setLotForm(p => ({ ...p, expirationDate: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label optional>Proveedor</Label>
                  <input className="dax-input" value={lotForm.supplier} onChange={e => setLotForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Distribuidora..." />
                </div>
                <div>
                  <Label optional>Costo unitario</Label>
                  <input className="dax-input" type="number" min="0" step="0.01" value={lotForm.unitCost} onChange={e => setLotForm(p => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              {branches.length > 0 && (
                <div>
                  <Label optional>Sucursal de destino</Label>
                  <select className="dax-input" onChange={e => setLotForm(p => ({ ...p, branchId: e.target.value } as any))}>
                    <option value="">Sin sucursal específica</option>
                    {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowLotModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => lotMutation.mutate()} disabled={lotMutation.isPending || !lotForm.productId || !lotForm.lotNumber} className="dax-btn-primary" style={{ flex: 1 }}>
                  {lotMutation.isPending ? 'Guardando...' : 'Registrar lote'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prescripción */}
      {showPrescriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nueva receta médica</h2>
              <button onClick={() => setShowPrescriptionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label>Nombre del paciente</Label>
                  <input className="dax-input" value={prescriptionForm.clientName} onChange={e => setPrescriptionForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Juan Pérez" />
                </div>
                <div>
                  <Label optional>Médico que prescribe</Label>
                  <input className="dax-input" value={prescriptionForm.doctorName} onChange={e => setPrescriptionForm(p => ({ ...p, doctorName: e.target.value }))} placeholder="Dr. García" />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Label>Medicamentos</Label>
                  <button onClick={addPrescriptionItem} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--dax-coral)', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>
                </div>
                {prescriptionForm.items.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '16px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>Agrega los medicamentos de la receta</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {prescriptionForm.items.map((item, i) => (
                    <div key={i} style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <select className="dax-input" style={{ margin: 0 }} value={item.productId} onChange={e => updatePrescriptionItem(i, 'productId', e.target.value)}>
                          <option value="">Selecciona medicamento...</option>
                          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input className="dax-input" style={{ margin: 0 }} type="number" min="1" value={item.quantity} onChange={e => updatePrescriptionItem(i, 'quantity', parseInt(e.target.value) || 1)} placeholder="Cant." />
                        <button onClick={() => removePrescriptionItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input className="dax-input" style={{ margin: 0 }} value={item.dosage} onChange={e => updatePrescriptionItem(i, 'dosage', e.target.value)} placeholder="Dosis (ej: 500mg cada 8h)" />
                        <input className="dax-input" style={{ margin: 0 }} value={item.instructions} onChange={e => updatePrescriptionItem(i, 'instructions', e.target.value)} placeholder="Instrucciones adicionales" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label optional>Notas adicionales</Label>
                <input className="dax-input" value={prescriptionForm.notes} onChange={e => setPrescriptionForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowPrescriptionModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => prescriptionMutation.mutate()} disabled={prescriptionMutation.isPending || !prescriptionForm.clientName || prescriptionForm.items.length === 0} className="dax-btn-primary" style={{ flex: 1 }}>
                  {prescriptionMutation.isPending ? 'Guardando...' : 'Registrar receta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cliente / Paciente */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo paciente</h2>
              <button onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Nombre</Label><input className="dax-input" value={clientForm.firstName} onChange={e => setClientForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Juan" /></div>
                <div><Label optional>Apellido</Label><input className="dax-input" value={clientForm.lastName} onChange={e => setClientForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Pérez" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Teléfono</Label><input className="dax-input" value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} placeholder="+506 8888-9999" /></div>
                <div><Label optional>Cédula / ID</Label><input className="dax-input" value={clientForm.idNumber} onChange={e => setClientForm(p => ({ ...p, idNumber: e.target.value }))} placeholder="1-1234-5678" /></div>
              </div>
              <div><Label optional>Correo electrónico</Label><input className="dax-input" type="email" value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} placeholder="paciente@email.com" /></div>
              <div><Label optional>Fecha de nacimiento</Label><input className="dax-input" type="date" value={clientForm.birthDate} onChange={e => setClientForm(p => ({ ...p, birthDate: e.target.value }))} /></div>
              <div><Label optional>Notas médicas</Label><input className="dax-input" value={clientForm.notes} onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))} placeholder="Alergias, condiciones especiales..." /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowClientModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => clientMutation.mutate()} disabled={clientMutation.isPending || !clientForm.firstName} className="dax-btn-primary" style={{ flex: 1 }}>
                  {clientMutation.isPending ? 'Guardando...' : 'Registrar paciente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}