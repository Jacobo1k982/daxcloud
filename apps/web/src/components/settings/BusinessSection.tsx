'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api }         from '@/lib/api';
import { useAuth }     from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/imageUrl';
import { Building2, Camera, Loader2 } from 'lucide-react';

const INDUSTRIES = [
  'Retail / Tienda',
  'Restaurante / Comida',
  'Farmacia / Salud',
  'Supermercado',
  'Ferretería',
  'Panadería / Pastelería',
  'Cafetería',
  'Boutique / Ropa',
  'Electrónica',
  'Papelería',
  'Veterinaria',
  'Servicio automotriz',
  'Peluquería / Estética',
  'Otro',
];

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
    {optional && <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--dax-text-muted)', textTransform: 'none' as const, letterSpacing: 0 }}>· opcional</span>}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '8px', marginBottom: '16px' }}>
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--dax-coral)' }}>
      {children}
    </p>
  </div>
);

export function BusinessSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { tenant }   = useAuth();
  const queryClient  = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['tenant-me'],
    queryFn:  async () => { const { data } = await api.get('/tenants/me'); return data; },
  });

  const [form, setForm] = useState({
    name: '', legalName: '', taxId: '', industry: '',
    website: '', phone: '', email: '',
    address: '', city: '', state: '', zipCode: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (tenantData) {
      setForm({
        name:      tenantData.name      ?? '',
        legalName: tenantData.legalName ?? '',
        taxId:     tenantData.taxId     ?? '',
        industry:  tenantData.industry  ?? '',
        website:   tenantData.website   ?? '',
        phone:     tenantData.phone     ?? '',
        email:     tenantData.email     ?? '',
        address:   tenantData.address   ?? '',
        city:      tenantData.city      ?? '',
        state:     tenantData.state     ?? '',
        zipCode:   tenantData.zipCode   ?? '',
        logoUrl:   tenantData.logoUrl   ?? '',
      });
    }
  }, [tenantData]);

  const updateMutation = useMutation({
    mutationFn: async () => api.put('/tenants/me/profile', form),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
      showToast('Datos del negocio actualizados correctamente');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al actualizar', 'error'),
  });

  // ── Subir logo ──────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Solo se permiten imágenes', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('Máximo 5MB para el logo',  'error'); return; }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const { data } = await api.post('/uploads/product-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // data.url viene como '/uploads/products/uuid.jpg' (relativa)
      const relativeUrl = data.url;

      // Actualiza estado local
      setForm(p => ({ ...p, logoUrl: relativeUrl }));

      // Persiste en la BD
      await api.put('/tenants/me/profile', { logoUrl: relativeUrl });

      // Refresca query
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });

      showToast('Logo actualizado');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Error al subir el logo';
      showToast(msg, 'error');
      console.error('Logo upload error:', err?.response?.data ?? err);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const f = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Construye URL completa para mostrar
  const logoDisplayUrl = getImageUrl(form.logoUrl);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dax-text-muted)', fontSize: '13px', padding: '20px 0' }}>
      <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Cargando...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: 'var(--dax-radius-lg)', overflow: 'hidden', border: '2px solid var(--dax-border)', background: 'var(--dax-coral-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {uploadingLogo ? (
              <Loader2 size={24} color="var(--dax-coral)" style={{ animation: 'spin .7s linear infinite' }} />
            ) : logoDisplayUrl ? (
              <img
                src={logoDisplayUrl}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Building2 size={32} color="var(--dax-coral)" style={{ opacity: .6 }} />
            )}
          </div>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--dax-coral)', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--dax-bg)', cursor: 'pointer' }}
          >
            <Camera size={12} color="#fff" />
          </button>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
        </div>

        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '4px' }}>
            {form.name || 'Sin nombre'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>{tenant?.slug}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="dax-badge dax-badge-info">{tenant?.currency}</span>
            <span className="dax-badge dax-badge-muted">{tenant?.country}</span>
          </div>
        </div>
      </div>

      {/* ── Información básica ── */}
      <div>
        <Label>Nombre comercial</Label>
        <input className="dax-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Nombre de tu negocio" />
      </div>

      <div style={{ marginTop: '16px' }}>
        <Label optional>Razón social / Nombre legal</Label>
        <input className="dax-input" value={form.legalName} onChange={e => f('legalName', e.target.value)} placeholder="Nombre legal registrado ante el gobierno" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <div>
          <Label optional>Número de identificación fiscal</Label>
          <input className="dax-input" value={form.taxId} onChange={e => f('taxId', e.target.value)} placeholder="Ej: 3-101-123456" />
        </div>
        <div>
          <Label optional>Industria / Sector</Label>
          <select className="dax-input" value={form.industry} onChange={e => f('industry', e.target.value)}>
            <option value="">Selecciona tu industria</option>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
      </div>

      {/* ── Contacto ── */}
      <SectionTitle>Información de contacto</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <Label optional>Teléfono del negocio</Label>
          <input className="dax-input" type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+506 2222-3333" />
        </div>
        <div>
          <Label optional>Correo del negocio</Label>
          <input className="dax-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="info@minegocio.com" />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <Label optional>Sitio web</Label>
        <input className="dax-input" type="url" value={form.website} onChange={e => f('website', e.target.value)} placeholder="https://minegocio.com" />
      </div>

      {/* ── Dirección ── */}
      <SectionTitle>Dirección principal</SectionTitle>

      <div>
        <Label optional>Dirección</Label>
        <input className="dax-input" value={form.address} onChange={e => f('address', e.target.value)} placeholder="Calle, número, edificio..." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginTop: '16px' }}>
        <div>
          <Label optional>Ciudad</Label>
          <input className="dax-input" value={form.city} onChange={e => f('city', e.target.value)} placeholder="San José" />
        </div>
        <div>
          <Label optional>Provincia / Estado</Label>
          <input className="dax-input" value={form.state} onChange={e => f('state', e.target.value)} placeholder="San José" />
        </div>
        <div>
          <Label optional>Código postal</Label>
          <input className="dax-input" value={form.zipCode} onChange={e => f('zipCode', e.target.value)} placeholder="10101" />
        </div>
      </div>

      {/* ── Región y moneda ── */}
      <SectionTitle>Región y moneda</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <Label>País</Label>
          <input className="dax-input" value={tenant?.country ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </div>
        <div>
          <Label>Moneda</Label>
          <input className="dax-input" value={`${tenant?.currency} · ${tenant?.locale}`} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '8px' }}>
        El país y la moneda no pueden modificarse. Contacta a{' '}
        <a href="mailto:ventas@daxcloud.shop" style={{ color: 'var(--dax-coral)', textDecoration: 'none', fontWeight: 600 }}>ventas@daxcloud.shop</a>
        {' '}para cambiarlos.
      </p>

      {/* ── ID del negocio ── */}
      <SectionTitle>Identificador del sistema</SectionTitle>

      <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '4px' }}>ID del negocio (slug)</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dax-text-primary)', fontFamily: 'monospace' }}>{tenant?.slug}</p>
          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>Usado para iniciar sesión y en la URL del sistema.</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(tenant?.slug ?? ''); showToast('ID copiado al portapapeles'); }}
          className="dax-btn-secondary"
          style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}
        >
          Copiar ID
        </button>
      </div>

      {/* ── Guardar ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="dax-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {updateMutation.isPending
            ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
            : 'Guardar datos del negocio'
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
