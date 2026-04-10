'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal }                from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth }      from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { api }          from '@/lib/api';
import { getImageUrl }  from '@/lib/imageUrl';
import {
  Building2, ChefHat, Pill, Scissors,
  Shirt, Leaf, Utensils, ShoppingCart, Package, Check,
  Upload, X, Loader2, Globe, Phone, Mail, MapPin, Save,
  FileText, Hash,
} from 'lucide-react';

// ── Industrias ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { value: 'general',     emoji: '🏪', label: 'Tienda General', desc: 'Retail, kiosko',    icon: Package,      color: '#FF5C35', price: 0  },
  { value: 'restaurant',  emoji: '🍽️', label: 'Restaurante',   desc: 'Comidas, bar',      icon: Utensils,     color: '#F97316', price: 22 },
  { value: 'bakery',      emoji: '🥖', label: 'Panadería',      desc: 'Pan, pasteles',     icon: ChefHat,      color: '#FF5C35', price: 22 },
  { value: 'pharmacy',    emoji: '💊', label: 'Farmacia',        desc: 'Medicamentos',      icon: Pill,         color: '#5AAAF0', price: 22 },
  { value: 'salon',       emoji: '✂️', label: 'Peluquería',     desc: 'Estética, spa',     icon: Scissors,     color: '#A78BFA', price: 22 },
  { value: 'clothing',    emoji: '👗', label: 'Ropa',            desc: 'Moda, calzado',     icon: Shirt,        color: '#EAB308', price: 22 },
  { value: 'produce',     emoji: '🥦', label: 'Verdulería',      desc: 'Frutas, verduras',  icon: Leaf,         color: '#22C55E', price: 22 },
  { value: 'supermarket', emoji: '🛒', label: 'Supermercado',    desc: 'Abarrotes, bodega', icon: ShoppingCart, color: '#5AAAF0', price: 22 },
];

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '.08em',
    textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px',
  }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '24px', marginBottom: '16px' }}>
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--dax-coral)' }}>
      {children}
    </p>
  </div>
);

export function BusinessSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { tenant, industry: currentIndustry } = useAuth();
  const { setAuth, token, user, features }    = useAuthStore();
  const queryClient  = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [hovered,         setHovered]         = useState('');
  const [confirmIndustry, setConfirmIndustry] = useState(false);
  const [pendingIndustry, setPendingIndustry] = useState('');
  const [uploadingLogo,   setUploadingLogo]   = useState(false);

  const emptyForm = {
    name:      '', legalName: '', taxId:   '',
    industry:  'general',
    phone:     '', email:     '', website: '',
    address:   '', city:      '', state:   '', zipCode: '',
    logoUrl:   '',
  };

  const [form, setForm] = useState(emptyForm);

  const { data: tenantData } = useQuery({
    queryKey: ['tenant-me'],
    queryFn:  async () => { const { data } = await api.get('/tenants/me'); return data; },
  });

  useEffect(() => {
    if (!tenantData) return;
    setForm({
      name:      tenantData.name      ?? '',
      legalName: tenantData.legalName ?? '',
      taxId:     tenantData.taxId     ?? '',
      industry:  tenantData.industry  ?? 'general',
      phone:     tenantData.phone     ?? '',
      email:     tenantData.email     ?? '',
      website:   tenantData.website   ?? '',
      address:   tenantData.address   ?? '',
      city:      tenantData.city      ?? '',
      state:     tenantData.state     ?? '',
      zipCode:   tenantData.zipCode   ?? '',
      logoUrl:   tenantData.logoUrl   ?? '',
    });
  }, [tenantData]);

  const f = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  // ── Mutación principal ────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<typeof form>) =>
      api.put('/tenants/me/profile', payload),
    onSuccess: (_, variables) => {
      if (variables.industry && token && user && features && tenant) {
        setAuth(token, user, { ...tenant, industry: variables.industry }, features);
      }
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
      showToast('Datos del negocio actualizados');
      setConfirmIndustry(false);
      setPendingIndustry('');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al guardar', 'error'),
  });

  // ── Subir logo ────────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Solo se permiten imágenes', 'error'); return; }
    if (file.size > 3 * 1024 * 1024)    { showToast('Máximo 3MB para el logo', 'error'); return; }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/product-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newLogoUrl = data.url;
      setForm(p => ({ ...p, logoUrl: newLogoUrl }));
      await api.put('/tenants/me/profile', { logoUrl: newLogoUrl });
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
      showToast('Logo actualizado');
    } catch {
      showToast('Error al subir el logo', 'error');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // ── Industria ─────────────────────────────────────────────────────────────
  const handleIndustryClick = (value: string) => {
    if (value === form.industry) return;
    setPendingIndustry(value);
    setConfirmIndustry(true);
  };

  const confirmChange = () => {
    setForm(p => ({ ...p, industry: pendingIndustry }));
    updateMutation.mutate({ industry: pendingIndustry });
  };

  const handleSave = () => {
    if (!form.name.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    updateMutation.mutate(form);
  };

  const selectedInd = INDUSTRIES.find(i => i.value === form.industry);
  const logoUrl     = getImageUrl(form.logoUrl);

  return (
    <div style={{ maxWidth: '620px' }}>

      {/* ── Logo del negocio ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '16px',
            overflow: 'hidden', border: '2px solid var(--dax-border)',
            background: 'var(--dax-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {uploadingLogo ? (
              <Loader2 size={24} color="var(--dax-coral)" style={{ animation: 'spin .7s linear infinite' }} />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <Building2 size={28} color="var(--dax-text-muted)" style={{ opacity: .4 }} />
            )}
          </div>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--dax-coral)', borderRadius: '50%',
              width: '26px', height: '26px', border: '2px solid var(--dax-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Upload size={11} color="#fff" />
          </button>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>
            {form.name || 'Tu negocio'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>
            {tenantData?.slug ?? '—'}
          </p>
          {selectedInd && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: selectedInd.color, background: `${selectedInd.color}15`,
              border: `1px solid ${selectedInd.color}30`,
              padding: '2px 8px', borderRadius: '6px',
            }}>
              {selectedInd.emoji} {selectedInd.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Información básica ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label>Nombre comercial *</Label>
          <input className="dax-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Mi Tienda" style={{ margin: 0 }} />
        </div>
        <div>
          <Label optional>Razón social / Nombre legal</Label>
          <input className="dax-input" value={form.legalName} onChange={e => f('legalName', e.target.value)} placeholder="Mi Tienda S.A." style={{ margin: 0 }} />
        </div>
        <div>
          <Label optional>Cédula jurídica / RUC</Label>
          <input className="dax-input" value={form.taxId} onChange={e => f('taxId', e.target.value)} placeholder="3-101-123456" style={{ margin: 0 }} />
        </div>
      </div>

      {/* ── Contacto ── */}
      <SectionTitle>Información de contacto</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <Label optional>Teléfono</Label>
          <div style={{ position: 'relative' }}>
            <Phone size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="dax-input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+506 2222-3333" style={{ margin: 0, paddingLeft: '34px' }} />
          </div>
        </div>
        <div>
          <Label optional>Correo del negocio</Label>
          <div style={{ position: 'relative' }}>
            <Mail size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="dax-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="info@mitienda.com" style={{ margin: 0, paddingLeft: '34px' }} />
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label optional>Sitio web</Label>
          <div style={{ position: 'relative' }}>
            <Globe size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="dax-input" type="url" value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://mitienda.com" style={{ margin: 0, paddingLeft: '34px' }} />
          </div>
        </div>
      </div>

      {/* ── Dirección ── */}
      <SectionTitle>Dirección</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label optional>Dirección</Label>
          <div style={{ position: 'relative' }}>
            <MapPin size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="dax-input" value={form.address} onChange={e => f('address', e.target.value)} placeholder="100m norte del parque central" style={{ margin: 0, paddingLeft: '34px' }} />
          </div>
        </div>
        <div>
          <Label optional>Ciudad</Label>
          <input className="dax-input" value={form.city} onChange={e => f('city', e.target.value)} placeholder="San José" style={{ margin: 0 }} />
        </div>
        <div>
          <Label optional>Provincia / Estado</Label>
          <input className="dax-input" value={form.state} onChange={e => f('state', e.target.value)} placeholder="San José" style={{ margin: 0 }} />
        </div>
        <div>
          <Label optional>Código postal</Label>
          <input className="dax-input" value={form.zipCode} onChange={e => f('zipCode', e.target.value)} placeholder="10101" style={{ margin: 0 }} />
        </div>
      </div>

      {/* ── Industria ── */}
      <SectionTitle>Tipo de industria</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '10px' }}>
        {INDUSTRIES.map((ind, i) => {
          const selected = form.industry === ind.value;
          const isHov    = hovered === ind.value;
          return (
            <button
              key={ind.value}
              type="button"
              onClick={() => handleIndustryClick(ind.value)}
              onMouseEnter={() => setHovered(ind.value)}
              onMouseLeave={() => setHovered('')}
              style={{
                padding: '12px 8px', borderRadius: '12px', textAlign: 'center',
                border:      `1.5px solid ${selected ? ind.color : isHov ? 'var(--dax-navy-400)' : 'var(--dax-border)'}`,
                background:  selected ? `${ind.color}10` : isHov ? 'var(--dax-surface-2)' : 'var(--dax-surface)',
                cursor:      selected ? 'default' : 'pointer',
                transition:  'all .18s cubic-bezier(.4,0,.2,1)',
                transform:   selected ? 'scale(1.03)' : isHov ? 'scale(1.01)' : 'scale(1)',
                boxShadow:   selected ? `0 0 0 1px ${ind.color}30, 0 4px 12px ${ind.color}15` : 'none',
                position:    'relative',
                animation:   'industryIn .3s ease both',
                animationDelay: `${i * 35}ms`,
              }}
            >
              {selected && (
                <div style={{ position: 'absolute', top: '6px', right: '6px', width: '14px', height: '14px', borderRadius: '50%', background: ind.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={8} color="#fff" strokeWidth={3} />
                </div>
              )}
              {ind.price > 0 && !selected && (
                <div style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '8px', fontWeight: 700, color: '#F0A030', background: 'rgba(240,160,48,.12)', border: '1px solid rgba(240,160,48,.25)', padding: '1px 5px', borderRadius: '4px' }}>
                  +$22
                </div>
              )}
              {ind.price === 0 && !selected && (
                <div style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '8px', fontWeight: 700, color: 'var(--dax-success)', background: 'var(--dax-success-bg)', padding: '1px 5px', borderRadius: '4px' }}>
                  Gratis
                </div>
              )}
              <div style={{ fontSize: '22px', marginBottom: '5px', lineHeight: 1, marginTop: '6px' }}>{ind.emoji}</div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: selected ? ind.color : 'var(--dax-text-primary)', marginBottom: '2px', lineHeight: 1.2 }}>{ind.label}</p>
              <p style={{ fontSize: '9px', color: selected ? `${ind.color}90` : 'var(--dax-text-muted)', lineHeight: 1.3 }}>{ind.desc}</p>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '24px' }}>
        Cambia la industria para adaptar el POS, módulos y flujos a tu tipo de negocio.
      </p>

      {/* ── Info del plan ── */}
      <div style={{ padding: '14px 16px', background: 'var(--dax-surface-2)', borderRadius: '12px', border: '1px solid var(--dax-border)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {[
          { label: 'Plan actual',    value: tenantData?.subscription?.plan?.displayName ?? tenant?.plan ?? 'Starter' },
          { label: 'País',           value: tenantData?.country   ?? '—' },
          { label: 'Moneda',         value: tenantData?.currency  ?? '—' },
          { label: 'ID del negocio', value: tenantData?.slug      ?? '—' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{item.label}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* ── Botón guardar ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="dax-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {updateMutation.isPending
            ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
            : <><Save size={13} /> Guardar cambios</>
          }
        </button>
      </div>

      {/* ── Modal confirmación cambio de industria ── */}
      {confirmIndustry && typeof window !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="dax-card" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
            {(() => {
              const pendingInd = INDUSTRIES.find(i => i.value === pendingIndustry);
              const currentInd = INDUSTRIES.find(i => i.value === form.industry);
              const willCharge = (pendingInd?.price ?? 0) > 0;
              const planBase   = tenantData?.subscription?.plan?.priceMonthly ?? 29;
              const planName   = tenantData?.subscription?.plan?.displayName  ?? 'Starter';
              return (
                <>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: willCharge ? 'rgba(255,92,53,.1)' : 'rgba(61,191,127,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
                    {pendingInd?.emoji}
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>
                    Cambiar a {pendingInd?.label}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
                    {currentInd?.label} → {pendingInd?.label}
                  </p>
                  {willCharge ? (
                    <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '16px', marginBottom: '20px', border: '1px solid var(--dax-border)' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '12px' }}>Resumen de facturación</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>Plan {planName}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)' }}>${planBase}/mes</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: 'var(--dax-text-secondary)' }}>Módulo {pendingInd?.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0A030' }}>+$22/mes</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--dax-border)', marginTop: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Total mensual</span>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#FF5C35' }}>${planBase + 22}/mes</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--dax-success-bg)', border: '1px solid rgba(61,191,127,.2)', borderRadius: 'var(--dax-radius-md)', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="var(--dax-success)" />
                      <p style={{ fontSize: '13px', color: 'var(--dax-success)', fontWeight: 600 }}>Tienda General está incluida en tu plan — sin costo adicional.</p>
                    </div>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '20px' }}>
                    {willCharge ? 'El módulo se activará inmediatamente. El cobro aplica en tu próximo ciclo.' : 'Tus datos existentes no se eliminan al cambiar de industria.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setConfirmIndustry(false); setPendingIndustry(''); }} className="dax-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                    <button onClick={confirmChange} disabled={updateMutation.isPending} className="dax-btn-primary" style={{ flex: 1 }}>
                      {updateMutation.isPending ? 'Activando...' : willCharge ? `Activar · $${planBase + 22}/mes` : 'Confirmar cambio'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes industryIn { from { opacity:0; transform:scale(.94) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
