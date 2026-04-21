'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Store, Upload, Globe, Phone, Mail, MapPin, FileText,
  Share2, Users, Clock, DollarSign, Percent,
  Save, ExternalLink, Copy, Check, Image as ImageIcon,
  Sparkles, AlertCircle, Eye, MessageCircle,
} from 'lucide-react';

interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  currency?: string;
  logoUrl?: string;
  settings?: any;
}

const CURRENCIES = [
  { code: 'CRC', label: '🇨🇷 Colón costarricense', symbol: '₡' },
  { code: 'USD', label: '🇺🇸 Dólar estadounidense', symbol: '$' },
  { code: 'MXN', label: '🇲🇽 Peso mexicano', symbol: '$' },
  { code: 'GTQ', label: '🇬🇹 Quetzal guatemalteco', symbol: 'Q' },
  { code: 'HNL', label: '🇭🇳 Lempira hondureño', symbol: 'L' },
  { code: 'NIO', label: '🇳🇮 Córdoba nicaragüense', symbol: 'C$' },
  { code: 'COP', label: '🇨🇴 Peso colombiano', symbol: '$' },
  { code: 'PEN', label: '🇵🇪 Sol peruano', symbol: 'S/' },
];

const INDUSTRIES = [
  { value: 'general', label: '🛒 Tienda / Retail' },
  { value: 'restaurant', label: '🍽️ Restaurante' },
  { value: 'bakery', label: '🥖 Panadería' },
  { value: 'pharmacy', label: '💊 Farmacia' },
  { value: 'salon', label: '✂️ Peluquería / Salón' },
  { value: 'clothing', label: '👕 Ropa / Moda' },
  { value: 'produce', label: '🥬 Verdulería' },
  { value: 'supermarket', label: '🛒 Supermercado' },
];

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '-.01em', marginBottom: '3px' }}>{title}</h3>
        {desc && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon: Icon, prefix }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: focused ? '#FF5C35' : 'rgba(255,255,255,0.3)', marginBottom: '6px', transition: 'color .2s' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={13} color={focused ? '#FF5C35' : 'rgba(255,255,255,0.2)'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color .2s' }} />}
        {prefix && <span style={{ position: 'absolute', left: Icon ? '32px' : '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }}>{prefix}</span>}
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: `10px 14px 10px ${prefix ? (Icon ? '52px' : '34px') : (Icon ? '34px' : '14px')}`,
            background: focused ? 'rgba(255,92,53,0.04)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? 'rgba(255,92,53,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '10px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box' as const,
            boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.07)' : 'none', transition: 'all .2s',
          }}
        />
      </div>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, maxLength }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: focused ? '#FF5C35' : 'rgba(255,255,255,0.3)', marginBottom: '6px', transition: 'color .2s' }}>
        <span>{label}</span>
        {maxLength && <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none' as const, color: 'rgba(255,255,255,0.2)' }}>{(value ?? '').length}/{maxLength}</span>}
      </label>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} rows={3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px',
          background: focused ? 'rgba(255,92,53,0.04)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? 'rgba(255,92,53,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'inherit',
          outline: 'none', boxSizing: 'border-box' as const, resize: 'vertical' as const, minHeight: '70px',
          boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.07)' : 'none', transition: 'all .2s',
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, icon: Icon }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: focused ? '#FF5C35' : 'rgba(255,255,255,0.3)', marginBottom: '6px', transition: 'color .2s' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={13} color={focused ? '#FF5C35' : 'rgba(255,255,255,0.2)'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />}
        <select value={value ?? ''} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: `10px 36px 10px ${Icon ? '34px' : '14px'}`,
            background: focused ? 'rgba(255,92,53,0.04)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? 'rgba(255,92,53,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '10px', color: '#F0F4FF', fontSize: '13px', fontFamily: 'inherit',
            outline: 'none', appearance: 'none' as const, WebkitAppearance: 'none' as const,
            cursor: 'pointer', boxSizing: 'border-box' as const, transition: 'all .2s',
          }}>
          {options.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#080C14' }}>{o.label}</option>)}
        </select>
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>{label}</p>
        {desc && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{desc}</p>}
      </div>
      <div onClick={() => onChange(!checked)}
        style={{ width: '40px', height: '22px', borderRadius: '12px', background: checked ? '#FF5C35' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: checked ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export function PublicProfileSection() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<TenantProfile>({
    id: '', name: '', slug: '', currency: 'CRC',
  });

  const [settings, setSettings] = useState({
    publicDescription: '',
    publicBanner: '',
    acceptingOrders: true,
    businessHours: { open: '08:00', close: '18:00' },
    instagram: '',
    facebook: '',
    whatsapp: '',
    taxRate: 13,
    primaryColor: '#FF5C35',
  });

  // Fetch
  const { data: tenantData } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api.get('/tenants/me').then(r => r.data),
  });

  useEffect(() => {
    if (tenantData) {
      setProfile(tenantData);
      const s = tenantData.settings ?? {};
      setSettings({
        publicDescription: s.publicDescription ?? '',
        publicBanner: s.publicBanner ?? '',
        acceptingOrders: s.acceptingOrders ?? true,
        businessHours: s.businessHours ?? { open: '08:00', close: '18:00' },
        instagram: s.instagram ?? '',
        facebook: s.facebook ?? '',
        whatsapp: s.whatsapp ?? '',
        taxRate: s.taxRate ?? 13,
        primaryColor: s.primaryColor ?? '#FF5C35',
      });
    }
  }, [tenantData]);

  // Save mutations
  const saveProfile = useMutation({
    mutationFn: (data: any) => api.put('/tenants/me/profile', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-me'] }),
  });

  const saveSettings = useMutation({
    mutationFn: (data: any) => api.put('/tenants/me/settings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-me'] }),
  });

  const handleSaveAll = async () => {
    const profilePayload = {
      name: profile.name,
      legalName: profile.legalName,
      taxId: profile.taxId,
      industry: profile.industry,
      website: profile.website,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      city: profile.city,
      state: profile.state,
    };
    await saveProfile.mutateAsync(profilePayload);
    await saveSettings.mutateAsync(settings);
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await saveProfile.mutateAsync({ logoUrl: data.url });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/order/${profile.slug}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saving = saveProfile.isPending || saveSettings.isPending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '860px' }}>

      {/* Header con link público */}
      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg,rgba(255,92,53,0.08),rgba(255,92,53,0.03))', border: '1px solid rgba(255,92,53,0.18)', borderRadius: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'rgba(255,92,53,0.15)', border: '1px solid rgba(255,92,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#FF5C35" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Perfil público de tu negocio</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Así lo verán tus clientes en el catálogo online</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(8,12,20,0.5)', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '10px', flexWrap: 'wrap' as const }}>
          <Globe size={13} color="rgba(255,92,53,0.6)" />
          <span style={{ flex: 1, fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{publicUrl}</span>
          <button onClick={handleCopyLink} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,92,53,0.2)', background: 'rgba(255,92,53,0.08)', color: '#FF5C35', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {copied ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: '#fff', fontSize: '11px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Eye size={11} /> Ver
          </a>
        </div>
      </div>

      {/* Logo */}
      <Section title="Logo del negocio" desc="Se muestra en el catálogo público, recibos e interfaz (recomendado 500x500px)">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '16px', background: 'rgba(255,92,53,0.06)', border: '2px dashed rgba(255,92,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
            {profile.logoUrl
              ? <img src={profile.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <ImageIcon size={28} color="rgba(255,92,53,0.4)" />
            }
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,92,53,0.3)', borderTopColor: '#FF5C35', animation: 'spin .7s linear infinite' }} />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
            <button onClick={() => logoInputRef.current?.click()} disabled={uploading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,92,53,0.25)', background: 'rgba(255,92,53,0.08)', color: '#FF5C35', fontSize: '12px', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              <Upload size={12} /> {profile.logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', lineHeight: 1.5 }}>
              JPG o PNG · Máximo 2MB · Recomendado cuadrado 500x500
            </p>
          </div>
        </div>
      </Section>

      {/* Información básica */}
      <Section title="Información del negocio" desc="Datos visibles para tus clientes">
        <Field label="Nombre comercial" value={profile.name} onChange={(v: string) => setProfile(p => ({ ...p, name: v }))} placeholder="Panadería San José" icon={Store} />
        <Textarea label="Descripción pública" value={settings.publicDescription} onChange={(v: string) => setSettings(p => ({ ...p, publicDescription: v }))} placeholder="Contanos sobre tu negocio..." maxLength={200} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Teléfono" value={profile.phone} onChange={(v: string) => setProfile(p => ({ ...p, phone: v }))} placeholder="+506 8888 8888" icon={Phone} />
          <Field label="Correo" value={profile.email} onChange={(v: string) => setProfile(p => ({ ...p, email: v }))} placeholder="hola@minegocio.com" icon={Mail} type="email" />
        </div>
        <Field label="Dirección" value={profile.address} onChange={(v: string) => setProfile(p => ({ ...p, address: v }))} placeholder="Calle, número, barrio" icon={MapPin} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Ciudad" value={profile.city} onChange={(v: string) => setProfile(p => ({ ...p, city: v }))} placeholder="San José" />
          <Field label="Provincia / Estado" value={profile.state} onChange={(v: string) => setProfile(p => ({ ...p, state: v }))} placeholder="San José" />
        </div>
        <Select label="Industria" value={profile.industry} icon={Store}
          onChange={(v: string) => setProfile(p => ({ ...p, industry: v }))}
          options={INDUSTRIES} />
        <Field label="Sitio web" value={profile.website} onChange={(v: string) => setProfile(p => ({ ...p, website: v }))} placeholder="https://minegocio.com" icon={Globe} />
      </Section>

      {/* Horario y disponibilidad */}
      <Section title="Horario y disponibilidad" desc="Controla cuando recibes pedidos en línea">
        <Toggle label="Aceptando pedidos online"
          desc={settings.acceptingOrders ? 'Los clientes pueden hacer pedidos ahora' : 'El catálogo está cerrado — los clientes ven un mensaje de cerrado'}
          checked={settings.acceptingOrders} onChange={(v: boolean) => setSettings(p => ({ ...p, acceptingOrders: v }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Apertura" type="time" icon={Clock}
            value={settings.businessHours.open}
            onChange={(v: string) => setSettings(p => ({ ...p, businessHours: { ...p.businessHours, open: v } }))} />
          <Field label="Cierre" type="time" icon={Clock}
            value={settings.businessHours.close}
            onChange={(v: string) => setSettings(p => ({ ...p, businessHours: { ...p.businessHours, close: v } }))} />
        </div>
      </Section>

      {/* Redes sociales */}
      <Section title="Redes sociales" desc="Enlaces que aparecen en tu catálogo público">
        <Field label="Instagram" value={settings.instagram} icon={Share2}
          onChange={(v: string) => setSettings(p => ({ ...p, instagram: v }))}
          placeholder="@minegocio" prefix="@" />
        <Field label="Facebook" value={settings.facebook} icon={Users}
          onChange={(v: string) => setSettings(p => ({ ...p, facebook: v }))}
          placeholder="facebook.com/minegocio" />
        <Field label="WhatsApp" value={settings.whatsapp} icon={MessageCircle}
          onChange={(v: string) => setSettings(p => ({ ...p, whatsapp: v }))}
          placeholder="+506 8888 8888" />
      </Section>

      {/* Configuración avanzada */}
      <Section title="Configuración fiscal" desc="Moneda e impuestos aplicables a tus ventas">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Select label="Moneda" value={profile.currency} icon={DollarSign}
            onChange={(v: string) => setProfile(p => ({ ...p, currency: v }))}
            options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))} />
          <Field label="IVA / Impuesto" value={settings.taxRate} type="number" icon={Percent}
            onChange={(v: number) => setSettings(p => ({ ...p, taxRate: v }))}
            placeholder="13" />
        </div>
        <Field label="Identificación tributaria" value={profile.taxId}
          onChange={(v: string) => setProfile(p => ({ ...p, taxId: v }))}
          placeholder="3-101-123456" icon={FileText} />
        <Field label="Razón social" value={profile.legalName}
          onChange={(v: string) => setProfile(p => ({ ...p, legalName: v }))}
          placeholder="Mi Negocio S.A." />
      </Section>

      {/* Save bar fija */}
      <div style={{ position: 'sticky', bottom: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 16px', background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <button onClick={handleSaveAll} disabled={saving}
          style={{ padding: '11px 24px', background: saving ? 'rgba(255,92,53,0.2)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)', border: 'none', borderRadius: '10px', color: saving ? 'rgba(255,92,53,0.5)' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: saving ? 'none' : '0 4px 16px rgba(255,92,53,0.3)', transition: 'all .2s' }}>
          {saving
            ? <><span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(255,92,53,0.3)', borderTopColor: '#FF5C35', animation: 'spin .7s linear infinite' }} /> Guardando...</>
            : <><Save size={13} /> Guardar cambios</>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
