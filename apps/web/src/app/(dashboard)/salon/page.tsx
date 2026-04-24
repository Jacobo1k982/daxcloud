'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  Plus, X, Search, Users, Scissors, Calendar,
  Clock, TrendingUp, CheckCircle, ChevronLeft,
  ChevronRight, Star,
} from 'lucide-react';

type Tab = 'agenda' | 'services' | 'employees' | 'clients' | 'stats';

const APPOINTMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:   { label: 'Agendada',    color: 'var(--dax-blue)',             bg: 'rgba(90,170,240,.12)' },
  confirmed:   { label: 'Confirmada',  color: 'var(--dax-success)',  bg: 'var(--dax-success-bg)' },
  in_progress: { label: 'En curso',    color: 'var(--dax-coral)',    bg: 'var(--dax-coral-soft)' },
  completed:   { label: 'Completada',  color: 'var(--dax-text-muted)', bg: 'var(--dax-surface-2)' },
  cancelled:   { label: 'Cancelada',   color: 'var(--dax-danger)',   bg: 'var(--dax-danger-bg)' },
  no_show:     { label: 'No asistió',  color: 'var(--dax-amber)',             bg: 'rgba(240,160,48,.12)' },
};

const COLORS = ['#FF5C35', '#5AAAF0', '#3DBF7F', '#F0A030', '#A78BFA', '#F472B6', '#34D399', '#60A5FA'];

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });

const formatDate = (date: Date) =>
  date.toLocaleDateString('es-CR', { weekday: 'long', day: '2-digit', month: 'long' });

export default function SalonPage() {
  const { formatCurrency } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('agenda');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [editEmployee, setEditEmployee] = useState<any>(null);

  const [appointmentForm, setAppointmentForm] = useState({
    clientName: '', clientPhone: '', employeeId: '',
    serviceId: '', startTime: '', notes: '',
  });

  const [serviceForm, setServiceForm] = useState({
    name: '', description: '', duration: 60,
    price: 0, category: '', color: 'var(--dax-coral)',
  });

  const [employeeForm, setEmployeeForm] = useState({
    firstName: '', lastName: '', phone: '',
    email: '', role: '', color: 'var(--dax-coral)',
  });

  const [clientForm, setClientForm] = useState({
    firstName: '', lastName: '', phone: '',
    email: '', birthDate: '', notes: '',
  });

  const dateStr = selectedDate.toISOString().split('T')[0];

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['salon-stats'],
    queryFn: async () => { const { data } = await api.get('/salon/stats'); return data; },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['salon-appointments', dateStr, selectedEmployee],
    queryFn: async () => {
      const params = new URLSearchParams({ date: dateStr });
      if (selectedEmployee) params.append('employeeId', selectedEmployee);
      const { data } = await api.get(`/salon/appointments?${params}`);
      return data;
    },
    enabled: tab === 'agenda' || tab === 'stats',
  });

  const { data: services = [] } = useQuery({
    queryKey: ['salon-services'],
    queryFn: async () => { const { data } = await api.get('/salon/services'); return data; },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['salon-employees'],
    queryFn: async () => { const { data } = await api.get('/salon/employees'); return data; },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['salon-clients', clientSearch],
    queryFn: async () => { const { data } = await api.get(`/salon/clients?search=${clientSearch}`); return data; },
    enabled: tab === 'clients',
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['salon-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['salon-stats'] });
  };

  // Mutations
  const appointmentMutation = useMutation({
    mutationFn: async () => api.post('/salon/appointments', {
      ...appointmentForm,
      startTime: new Date(appointmentForm.startTime).toISOString(),
    }),
    onSuccess: () => {
      invalidate();
      setShowAppointmentModal(false);
      setAppointmentForm({ clientName: '', clientPhone: '', employeeId: '', serviceId: '', startTime: '', notes: '' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.put(`/salon/appointments/${id}/status`, { status }),
    onSuccess: () => invalidate(),
  });

  const serviceMutation = useMutation({
    mutationFn: async () => editService
      ? api.put(`/salon/services/${editService.id}`, serviceForm)
      : api.post('/salon/services', serviceForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon-services'] });
      setShowServiceModal(false);
      setEditService(null);
      setServiceForm({ name: '', description: '', duration: 60, price: 0, category: '', color: 'var(--dax-coral)' });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/salon/services/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salon-services'] }),
  });

  const employeeMutation = useMutation({
    mutationFn: async () => editEmployee
      ? api.put(`/salon/employees/${editEmployee.id}`, employeeForm)
      : api.post('/salon/employees', employeeForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon-employees'] });
      setShowEmployeeModal(false);
      setEditEmployee(null);
      setEmployeeForm({ firstName: '', lastName: '', phone: '', email: '', role: '', color: 'var(--dax-coral)' });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/salon/employees/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salon-employees'] }),
  });

  const clientMutation = useMutation({
    mutationFn: async () => api.post('/salon/clients', clientForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon-clients'] });
      setShowClientModal(false);
      setClientForm({ firstName: '', lastName: '', phone: '', email: '', birthDate: '', notes: '' });
    },
  });

  const openEditService = (service: any) => {
    setEditService(service);
    setServiceForm({ name: service.name, description: service.description ?? '', duration: service.duration, price: Number(service.price), category: service.category ?? '', color: service.color });
    setShowServiceModal(true);
  };

  const openEditEmployee = (employee: any) => {
    setEditEmployee(employee);
    setEmployeeForm({ firstName: employee.firstName, lastName: employee.lastName, phone: employee.phone ?? '', email: employee.email ?? '', role: employee.role ?? '', color: employee.color });
    setShowEmployeeModal(true);
  };

  const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };

  const filteredServices = services.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()));

  const TABS = [
    { id: 'agenda',    label: 'Agenda',    icon: Calendar },
    { id: 'services',  label: 'Servicios', icon: Scissors },
    { id: 'employees', label: 'Estilistas', icon: Users },
    { id: 'clients',   label: 'Clientes',  icon: Star },
    { id: 'stats',     label: 'Estadísticas', icon: TrendingUp },
  ] as { id: Tab; label: string; icon: any }[];

  const CORAL = '#FF5C35';

  // Genera slots de hora para la agenda
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  const appointmentsByHour: Record<number, any[]> = {};
  appointments.forEach((apt: any) => {
    const hour = new Date(apt.startTime).getHours();
    if (!appointmentsByHour[hour]) appointmentsByHour[hour] = [];
    appointmentsByHour[hour].push(apt);
  });

  return (
    <div style={{ padding: 'clamp(20px,4vw,48px)', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--dax-radius-lg)', background: 'rgba(167,139,250,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={22} color="#A78BFA" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(18px,3vw,24px)', marginBottom: '2px' }}>Peluquería y Estética</h1>
            <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>Agenda, servicios y gestión de clientes</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tab === 'agenda' && <button onClick={() => setShowAppointmentModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nueva cita</button>}
          {tab === 'services' && <button onClick={() => { setEditService(null); setShowServiceModal(true); }} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nuevo servicio</button>}
          {tab === 'employees' && <button onClick={() => { setEditEmployee(null); setShowEmployeeModal(true); }} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nuevo estilista</button>}
          {tab === 'clients' && <button onClick={() => setShowClientModal(true)} className="dax-btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={13} /> Nuevo cliente</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', background: active ? '#A78BFA' : 'var(--dax-surface)', color: active ? '#fff' : 'var(--dax-text-muted)', flexShrink: 0 }}>
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: AGENDA ── */}
      {tab === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Navegación de fecha + filtro empleado */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: 'var(--dax-radius-lg)', padding: '6px 12px' }}>
              <button onClick={prevDay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><ChevronLeft size={16} /></button>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', whiteSpace: 'nowrap', minWidth: '200px', textAlign: 'center', textTransform: 'capitalize' }}>
                {formatDate(selectedDate)}
              </p>
              <button onClick={nextDay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}><ChevronRight size={16} /></button>
            </div>
            <button onClick={() => setSelectedDate(new Date())} style={{ background: 'none', border: '1px solid var(--dax-border)', borderRadius: 'var(--dax-radius-md)', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-muted)', cursor: 'pointer' }}>
              Hoy
            </button>
            {employees.length > 0 && (
              <select style={{ padding: '8px 14px', borderRadius: 'var(--dax-radius-md)', border: '1px solid var(--dax-border)', background: 'var(--dax-surface)', color: 'var(--dax-text-secondary)', fontSize: '12px', cursor: 'pointer' }}
                value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                <option value="">Todos los estilistas</option>
                {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            )}
          </div>

          {/* Stats rápidos del día */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Total citas', value: appointments.length, color: 'var(--dax-purple)' },
              { label: 'Pendientes', value: appointments.filter((a: any) => ['scheduled', 'confirmed'].includes(a.status)).length, color: 'var(--dax-blue)' },
              { label: 'Completadas', value: appointments.filter((a: any) => a.status === 'completed').length, color: 'var(--dax-success)' },
              { label: 'Canceladas', value: appointments.filter((a: any) => a.status === 'cancelled').length, color: 'var(--dax-danger)' },
            ].map((s, i) => (
              <div key={i} className="dax-card" style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Vista de agenda por hora */}
          <div className="dax-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dax-border)' }}>
              <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>{appointments.length} cita{appointments.length !== 1 ? 's' : ''} programada{appointments.length !== 1 ? 's' : ''}</p>
            </div>

            {appointments.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Calendar size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay citas para este día</p>
                <button onClick={() => setShowAppointmentModal(true)} style={{ marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--dax-purple)', fontWeight: 600 }}>
                  + Agendar cita
                </button>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
                {timeSlots.filter(h => h >= 7 && h <= 21).map(hour => {
                  const hourAppointments = appointmentsByHour[hour] ?? [];
                  if (hourAppointments.length === 0) return (
                    <div key={hour} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--dax-border-soft)', minHeight: '48px' }}>
                      <div style={{ width: '60px', padding: '12px 12px 12px 16px', fontSize: '11px', color: 'var(--dax-text-muted)', flexShrink: 0, borderRight: '1px solid var(--dax-border-soft)' }}>
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div style={{ flex: 1 }} />
                    </div>
                  );
                  return (
                    <div key={hour} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--dax-border-soft)' }}>
                      <div style={{ width: '60px', padding: '12px 12px 12px 16px', fontSize: '11px', color: 'var(--dax-text-muted)', flexShrink: 0, borderRight: '1px solid var(--dax-border-soft)' }}>
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div style={{ flex: 1, padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {hourAppointments.map((apt: any) => {
                          const sc = APPOINTMENT_STATUS[apt.status];
                          const empColor = apt.employee?.color ?? '#A78BFA';
                          return (
                            <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--dax-radius-md)', background: `${empColor}18`, borderLeft: `3px solid ${empColor}`, flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '160px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>{apt.clientName}</p>
                                  {apt.clientPhone && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{apt.clientPhone}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {apt.service && (
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: empColor }}>{apt.service.name}</span>
                                  )}
                                  {apt.employee && (
                                    <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>· {apt.employee.firstName}</span>
                                  )}
                                  <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                                    {formatTime(apt.startTime)} — {formatTime(apt.endTime)}
                                  </span>
                                  {apt.service?.price && (
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: CORAL }}>{formatCurrency(Number(apt.service.price))}</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: '8px' }}>{sc.label}</span>
                                {apt.status === 'scheduled' && (
                                  <button onClick={() => statusMutation.mutate({ id: apt.id, status: 'confirmed' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-success)' }}>Confirmar</button>
                                )}
                                {apt.status === 'confirmed' && (
                                  <button onClick={() => statusMutation.mutate({ id: apt.id, status: 'in_progress' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: CORAL }}>Iniciar</button>
                                )}
                                {apt.status === 'in_progress' && (
                                  <button onClick={() => statusMutation.mutate({ id: apt.id, status: 'completed' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-success)' }}>Completar</button>
                                )}
                                {['scheduled', 'confirmed'].includes(apt.status) && (
                                  <button onClick={() => statusMutation.mutate({ id: apt.id, status: 'cancelled' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-danger)' }}>Cancelar</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: SERVICIOS ── */}
      {tab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dax-card" style={{ padding: '14px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
              <input className="dax-input" style={{ paddingLeft: '36px', margin: 0 }} placeholder="Buscar servicio..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {filteredServices.length === 0 ? (
              <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                <Scissors size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay servicios. Crea el primero.</p>
              </div>
            ) : filteredServices.map((service: any) => (
              <div key={service.id} className="dax-card" style={{ padding: '20px', borderLeft: `3px solid ${service.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>{service.name}</p>
                    {service.category && <span style={{ fontSize: '11px', background: `${service.color}18`, color: service.color, padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>{service.category}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEditService(service)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)' }}>Editar</button>
                    <button onClick={() => { if (confirm('¿Eliminar?')) deleteServiceMutation.mutate(service.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--dax-danger)' }}>Eliminar</button>
                  </div>
                </div>
                {service.description && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>{service.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--dax-text-muted)', fontSize: '12px' }}>
                    <Clock size={13} />
                    {service.duration} min
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: service.color }}>{formatCurrency(Number(service.price))}</p>
                </div>
                {service._count?.appointments > 0 && (
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '8px' }}>{service._count.appointments} citas realizadas</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ESTILISTAS ── */}
      {tab === 'employees' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {employees.length === 0 ? (
            <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
              <Users size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay estilistas. Agrega el primero.</p>
            </div>
          ) : employees.map((emp: any) => (
            <div key={emp.id} className="dax-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${emp.color}22`, border: `2px solid ${emp.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: emp.color }}>
                    {emp.firstName[0]}{emp.lastName?.[0] ?? ''}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{emp.firstName} {emp.lastName}</p>
                  {emp.role && <p style={{ fontSize: '12px', color: emp.color, fontWeight: 600 }}>{emp.role}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                {emp.phone && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>📞 {emp.phone}</p>}
                {emp.email && <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>✉ {emp.email}</p>}
                {emp._count?.appointments > 0 && <p style={{ fontSize: '12px', color: emp.color, fontWeight: 600, marginTop: '4px' }}>{emp._count.appointments} citas realizadas</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEditEmployee(emp)} className="dax-btn-secondary" style={{ flex: 1, fontSize: '12px' }}>Editar</button>
                <button onClick={() => { if (confirm('¿Desactivar este estilista?')) deleteEmployeeMutation.mutate(emp.id); }} style={{ background: 'none', border: '1px solid var(--dax-danger)', color: 'var(--dax-danger)', padding: '8px 12px', borderRadius: 'var(--dax-radius-md)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Desactivar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: CLIENTES ── */}
      {tab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dax-card" style={{ padding: '14px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
              <input className="dax-input" style={{ paddingLeft: '36px', margin: 0 }} placeholder="Buscar cliente..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {clients.length === 0 ? (
              <div className="dax-card" style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1' }}>
                <Users size={36} color="var(--dax-text-muted)" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
                <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>No hay clientes registrados</p>
              </div>
            ) : clients.map((client: any) => (
              <div key={client.id} className="dax-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(167,139,250,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-purple)' }}>{client.firstName[0]}{client.lastName?.[0] ?? ''}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{client.firstName} {client.lastName}</p>
                    {client.phone && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{client.phone}</p>}
                    {client._count?.appointments > 0 && (
                      <p style={{ fontSize: '11px', color: 'var(--dax-purple)', marginTop: '2px' }}>{client._count.appointments} visita{client._count.appointments !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ESTADÍSTICAS ── */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Citas hoy',        value: stats?.todayAppointments ?? 0, color: 'var(--dax-purple)' },
              { label: 'Pendientes hoy',   value: stats?.pendingToday ?? 0,      color: 'var(--dax-amber)' },
              { label: 'Completadas hoy',  value: stats?.completedToday ?? 0,    color: 'var(--dax-success)' },
              { label: 'Citas este mes',   value: stats?.monthAppointments ?? 0, color: 'var(--dax-blue)' },
              { label: 'Clientes totales', value: stats?.totalClients ?? 0,      color: CORAL },
              { label: 'Ingresos del mes', value: formatCurrency(stats?.monthRevenue ?? 0), color: 'var(--dax-success)', isText: true },
            ].map((s, i) => (
              <div key={i} className="dax-card" style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: s.isText ? '16px' : '22px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Top servicios */}
          {stats?.topServices?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Scissors size={15} color="#A78BFA" />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Servicios más solicitados</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.topServices.map((s: any, i: number) => {
                  const max = stats.topServices[0].count;
                  const pct = max > 0 ? (s.count / max) * 100 : 0;
                  return (
                    <div key={s.serviceId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? '#A78BFA' : 'var(--dax-text-muted)' }}>#{i+1}</span>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{s.name}</p>
                        </div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-purple)' }}>{s.count} citas</p>
                      </div>
                      <div style={{ height: '3px', background: 'var(--dax-surface-2)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? '#A78BFA' : 'var(--dax-border)', borderRadius: '2px', transition: 'width .5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top estilistas */}
          {stats?.topEmployees?.length > 0 && (
            <div className="dax-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Star size={15} color="#A78BFA" />
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Estilistas más activos este mes</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.topEmployees.map((e: any, i: number) => (
                  <div key={e.employeeId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${e.color ?? '#A78BFA'}22`, border: `1px solid ${e.color ?? '#A78BFA'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: e.color ?? '#A78BFA' }}>{e.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</span>
                    </div>
                    <p style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>{e.name}</p>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: e.color ?? '#A78BFA' }}>{e.count} citas</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          MODALES
      ══════════════════════════════════════ */}

      {/* Modal Nueva cita */}
      {showAppointmentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nueva cita</h2>
              <button onClick={() => setShowAppointmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Nombre del cliente</Label><input className="dax-input" value={appointmentForm.clientName} onChange={e => setAppointmentForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Juan Pérez" /></div>
                <div><Label optional>Teléfono</Label><input className="dax-input" value={appointmentForm.clientPhone} onChange={e => setAppointmentForm(p => ({ ...p, clientPhone: e.target.value }))} placeholder="+506 8888-9999" /></div>
              </div>
              <div><Label>Fecha y hora</Label><input className="dax-input" type="datetime-local" value={appointmentForm.startTime} onChange={e => setAppointmentForm(p => ({ ...p, startTime: e.target.value }))} /></div>
              <div><Label>Servicio</Label>
                <select className="dax-input" value={appointmentForm.serviceId} onChange={e => setAppointmentForm(p => ({ ...p, serviceId: e.target.value }))}>
                  <option value="">Sin servicio específico</option>
                  {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {s.duration}min — {formatCurrency(Number(s.price))}</option>)}
                </select>
              </div>
              <div><Label optional>Estilista</Label>
                <select className="dax-input" value={appointmentForm.employeeId} onChange={e => setAppointmentForm(p => ({ ...p, employeeId: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div><Label optional>Notas</Label><input className="dax-input" value={appointmentForm.notes} onChange={e => setAppointmentForm(p => ({ ...p, notes: e.target.value }))} placeholder="Preferencias del cliente..." /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowAppointmentModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => appointmentMutation.mutate()} disabled={appointmentMutation.isPending || !appointmentForm.clientName || !appointmentForm.startTime} className="dax-btn-primary" style={{ flex: 1 }}>
                  {appointmentMutation.isPending ? 'Guardando...' : 'Agendar cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Servicio */}
      {showServiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{editService ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              <button onClick={() => { setShowServiceModal(false); setEditService(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><Label>Nombre del servicio</Label><input className="dax-input" value={serviceForm.name} onChange={e => setServiceForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Corte de cabello, Manicure..." /></div>
              <div><Label optional>Descripción</Label><input className="dax-input" value={serviceForm.description} onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción breve..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div><Label>Duración (min)</Label><input className="dax-input" type="number" min="5" step="5" value={serviceForm.duration} onChange={e => setServiceForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))} /></div>
                <div><Label>Precio</Label><input className="dax-input" type="number" min="0" step="0.01" value={serviceForm.price} onChange={e => setServiceForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label optional>Categoría</Label><input className="dax-input" value={serviceForm.category} onChange={e => setServiceForm(p => ({ ...p, category: e.target.value }))} placeholder="Ej: Cabello" /></div>
              </div>
              <div>
                <Label>Color identificador</Label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(color => (
                    <button key={color} onClick={() => setServiceForm(p => ({ ...p, color }))} style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, border: serviceForm.color === color ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: serviceForm.color === color ? `0 0 0 2px ${color}` : 'none', transition: 'all .15s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowServiceModal(false); setEditService(null); }} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => serviceMutation.mutate()} disabled={serviceMutation.isPending || !serviceForm.name} className="dax-btn-primary" style={{ flex: 1 }}>
                  {serviceMutation.isPending ? 'Guardando...' : editService ? 'Actualizar' : 'Crear servicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estilista */}
      {showEmployeeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{editEmployee ? 'Editar estilista' : 'Nuevo estilista'}</h2>
              <button onClick={() => { setShowEmployeeModal(false); setEditEmployee(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Nombre</Label><input className="dax-input" value={employeeForm.firstName} onChange={e => setEmployeeForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Ana" /></div>
                <div><Label>Apellido</Label><input className="dax-input" value={employeeForm.lastName} onChange={e => setEmployeeForm(p => ({ ...p, lastName: e.target.value }))} placeholder="García" /></div>
              </div>
              <div><Label optional>Especialidad / Rol</Label><input className="dax-input" value={employeeForm.role} onChange={e => setEmployeeForm(p => ({ ...p, role: e.target.value }))} placeholder="Ej: Colorista, Manicurista..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label optional>Teléfono</Label><input className="dax-input" value={employeeForm.phone} onChange={e => setEmployeeForm(p => ({ ...p, phone: e.target.value }))} placeholder="+506 8888-9999" /></div>
                <div><Label optional>Correo</Label><input className="dax-input" type="email" value={employeeForm.email} onChange={e => setEmployeeForm(p => ({ ...p, email: e.target.value }))} placeholder="ana@salon.com" /></div>
              </div>
              <div>
                <Label>Color en agenda</Label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(color => (
                    <button key={color} onClick={() => setEmployeeForm(p => ({ ...p, color }))} style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, border: employeeForm.color === color ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: employeeForm.color === color ? `0 0 0 2px ${color}` : 'none', transition: 'all .15s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => { setShowEmployeeModal(false); setEditEmployee(null); }} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => employeeMutation.mutate()} disabled={employeeMutation.isPending || !employeeForm.firstName} className="dax-btn-primary" style={{ flex: 1 }}>
                  {employeeMutation.isPending ? 'Guardando...' : editEmployee ? 'Actualizar' : 'Crear estilista'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cliente */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--dax-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Nuevo cliente</h2>
              <button onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Nombre</Label><input className="dax-input" value={clientForm.firstName} onChange={e => setClientForm(p => ({ ...p, firstName: e.target.value }))} placeholder="María" /></div>
                <div><Label optional>Apellido</Label><input className="dax-input" value={clientForm.lastName} onChange={e => setClientForm(p => ({ ...p, lastName: e.target.value }))} placeholder="López" /></div>
              </div>
              <div><Label optional>Teléfono</Label><input className="dax-input" value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} placeholder="+506 8888-9999" /></div>
              <div><Label optional>Correo</Label><input className="dax-input" type="email" value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} placeholder="maria@email.com" /></div>
              <div><Label optional>Fecha de cumpleaños</Label><input className="dax-input" type="date" value={clientForm.birthDate} onChange={e => setClientForm(p => ({ ...p, birthDate: e.target.value }))} /></div>
              <div><Label optional>Notas</Label><input className="dax-input" value={clientForm.notes} onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))} placeholder="Preferencias, alergias, historial..." /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={() => setShowClientModal(false)} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={() => clientMutation.mutate()} disabled={clientMutation.isPending || !clientForm.firstName} className="dax-btn-primary" style={{ flex: 1 }}>
                  {clientMutation.isPending ? 'Guardando...' : 'Registrar cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
