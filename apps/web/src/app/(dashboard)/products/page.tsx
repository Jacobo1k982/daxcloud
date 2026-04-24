'use client';
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import {
  Upload, X, Loader2, Package, Search, Pencil, Trash2, Plus,
  Tag, DollarSign, TrendingUp, Filter, Barcode, FileText,
  Image as ImageIcon, Link, ChevronDown, ToggleLeft, ToggleRight,
  Percent, Truck, Building, Hash, Scale, Star, Eye, EyeOff,
  AlertCircle, Check, ChevronRight, Copy,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string; name: string; price: number; cost: number;
  sku: string; barcode: string; category: string; description: string;
  imageUrl: string; active: boolean; metadata?: any;
  inventory?: { quantity: number }[];
}

interface ProductForm {
  // Básico
  name: string; description: string; category: string;
  // Identificación
  sku: string; barcode: string;
  // Precios
  price: string; cost: string;
  // IVA
  taxRate: string; taxIncluded: boolean;
  // Inventario
  minStock: string; unit: string;
  // Info adicional
  brand: string; supplier: string; notes: string;
  // Imagen
  imageUrl: string;
  // Estado
  active: boolean;
}

const emptyForm: ProductForm = {
  name: '', description: '', category: '',
  sku: '', barcode: '',
  price: '', cost: '',
  taxRate: '13', taxIncluded: true,
  minStock: '5', unit: 'unidad',
  brand: '', supplier: '', notes: '',
  imageUrl: '',
  active: true,
};

const UNITS = ['unidad','kg','g','lb','oz','litro','ml','caja','paquete','docena','par','metro','cm'];
const TAX_RATES = [
  { value: '0',   label: 'Exento (0%)' },
  { value: '1',   label: 'Canasta básica (1%)' },
  { value: '2',   label: 'Medicamentos (2%)' },
  { value: '4',   label: 'Reducido (4%)' },
  { value: '13',  label: 'Estándar (13%)' },
  { value: 'custom', label: 'Personalizado' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
}

function calcMargin(price: string, cost: string) {
  const p = parseFloat(price), c = parseFloat(cost);
  if (!p || !c || p <= 0) return null;
  return ((p - c) / p * 100).toFixed(1);
}

function calcTaxAmount(price: string, taxRate: string, taxIncluded: boolean) {
  const p = parseFloat(price), r = parseFloat(taxRate) / 100;
  if (!p || !r) return { base: p || 0, tax: 0 };
  if (taxIncluded) {
    const base = p / (1 + r);
    return { base, tax: p - base };
  }
  return { base: p, tax: p * r };
}

// ── Image Uploader ────────────────────────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [tab, setTab] = useState<'upload'|'url'>('upload');
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/uploads/product-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url ?? data.imageUrl ?? '');
    } catch { alert('Error al subir imagen'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
        {['upload','url'].map(t => (
          <button key={t} type="button" onClick={() => setTab(t as any)}
            style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${tab===t ? 'rgba(255,92,53,0.4)' : 'var(--dax-surface-3)'}`, background: tab===t ? 'var(--dax-coral-soft)' : 'transparent', color: tab===t ? '#FF5C35' : 'var(--dax-white-35)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t === 'upload' ? 'Subir archivo' : 'URL'}
          </button>
        ))}
      </div>

      {/* Preview */}
      {value && (
        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,92,53,0.25)' }}>
          <img src={getImageUrl(value) ?? value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          <button type="button" onClick={() => onChange('')} style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '6px', background: 'var(--dax-overlay)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} color="#fff"/>
          </button>
        </div>
      )}

      {tab === 'upload' && !value && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
          onClick={() => inputRef.current?.click()}
          style={{ height: '100px', border: `2px dashed ${drag ? 'rgba(255,92,53,0.6)' : 'var(--dax-border)'}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px', background: drag ? 'var(--dax-coral-soft)' : 'transparent', transition: 'all .2s' }}>
          {loading ? <Loader2 size={22} color="rgba(255,92,53,0.7)" style={{ animation: 'spin .7s linear infinite' }}/> : <Upload size={22} color="rgba(255,255,255,0.25)"/>}
          <p style={{ fontSize: '11px', color: 'var(--dax-white-35)' }}>{loading ? 'Subiendo...' : 'Arrastra o haz clic · JPG, PNG, WebP · máx 2MB'}</p>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}/>
        </div>
      )}

      {tab === 'url' && !value && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." type="url"
            style={{ flex: 1, padding: '9px 12px', background: 'var(--dax-surface-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: 'var(--dax-text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}/>
          <button type="button" onClick={() => { if (urlInput.trim()) { onChange(urlInput.trim()); setUrlInput(''); }}}
            style={{ padding: '9px 14px', background: 'var(--dax-coral-soft)', border: '1px solid rgba(255,92,53,0.25)', borderRadius: '9px', color: 'var(--dax-coral)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, icon: Icon, prefix, suffix, required, hint }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: focused ? '#FF5C35' : 'var(--dax-text-muted)', marginBottom: '6px', transition: 'color .2s' }}>
        <span>{label}{required && <span style={{ color: 'var(--dax-coral)', marginLeft: '3px' }}>*</span>}</span>
        {hint && <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: 0, textTransform: 'none' as const, color: 'var(--dax-white-25)' }}>{hint}</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={13} color={focused ? '#FF5C35' : 'var(--dax-text-muted)'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color .2s' }}/>}
        {prefix && <span style={{ position: 'absolute', left: Icon ? '32px' : '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--dax-text-muted)', pointerEvents: 'none' }}>{prefix}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: `10px ${suffix ? '60px' : '14px'} 10px ${prefix ? (Icon ? '48px' : '30px') : Icon ? '34px' : '14px'}`, background: focused ? 'var(--dax-coral-soft)' : 'var(--dax-surface)', border: `1px solid ${focused ? 'rgba(255,92,53,0.4)' : 'var(--dax-surface-3)'}`, borderRadius: '10px', color: 'var(--dax-text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, transition: 'all .2s', boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.07)' : 'none' }}/>
        {suffix && <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, icon: Icon }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: focused ? '#FF5C35' : 'var(--dax-text-muted)', marginBottom: '6px', transition: 'color .2s' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={13} color={focused ? '#FF5C35' : 'var(--dax-text-muted)'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>}
        <select value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: `10px 32px 10px ${Icon ? '34px' : '14px'}`, background: focused ? 'var(--dax-coral-soft)' : 'var(--dax-surface)', border: `1px solid ${focused ? 'rgba(255,92,53,0.4)' : 'var(--dax-surface-3)'}`, borderRadius: '10px', color: 'var(--dax-text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' as const, transition: 'all .2s' }}>
          {options.map((o: any) => <option key={o.value} value={o.value} style={{ background: 'var(--dax-bg)' }}>{o.label}</option>)}
        </select>
        <ChevronDown size={11} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
      </div>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 2 }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: focused ? '#FF5C35' : 'var(--dax-text-muted)', marginBottom: '6px', transition: 'color .2s' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', padding: '10px 14px', background: focused ? 'var(--dax-coral-soft)' : 'var(--dax-surface)', border: `1px solid ${focused ? 'rgba(255,92,53,0.4)' : 'var(--dax-surface-3)'}`, borderRadius: '10px', color: 'var(--dax-text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, transition: 'all .2s' }}/>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: desc ? '2px' : 0 }}>{label}</p>
        {desc && <p style={{ fontSize: '11px', color: 'var(--dax-white-35)' }}>{desc}</p>}
      </div>
      <div onClick={() => onChange(!checked)} style={{ width: '38px', height: '21px', borderRadius: '12px', background: checked ? '#FF5C35' : 'var(--dax-border)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2.5px', left: checked ? '19px' : '2.5px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--dax-surface)', transition: 'left .2s cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}/>
      </div>
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', letterSpacing: '-.01em' }}>{title}</h3>
      {desc && <p style={{ fontSize: '11px', color: 'var(--dax-white-35)', marginTop: '2px' }}>{desc}</p>}
    </div>
  );
}

// ── Product Form Modal ────────────────────────────────────────────────────────
function ProductFormModal({ form, setForm, editId, onSave, onClose, saving, error, categories }: any) {
  const [customTax, setCustomTax] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const margin  = calcMargin(form.price, form.cost);
  const taxRate = form.taxRate === 'custom' ? customTax : form.taxRate;
  const taxCalc = calcTaxAmount(form.price, taxRate, form.taxIncluded);
  const priceWithTax = form.taxIncluded ? parseFloat(form.price || '0') : taxCalc.base + taxCalc.tax;

  const TABS = [
    { id: 'basic',     label: 'General' },
    { id: 'pricing',   label: 'Precio e IVA' },
    { id: 'inventory', label: 'Inventario' },
    { id: 'extra',     label: 'Más info' },
  ];

  const f = (key: keyof ProductForm) => (v: any) => setForm((p: ProductForm) => ({ ...p, [key]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflow: 'auto', background: 'var(--dax-overlay)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: '680px', background: 'var(--dax-bg)', border: '1px solid rgba(255,92,53,0.18)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', animation: 'modalOpen .25s cubic-bezier(.22,1,.36,1)', marginTop: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,92,53,0.4),transparent)' }}/>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--dax-coral-soft)', border: '1px solid rgba(255,92,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={17} color="#FF5C35"/>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--dax-text-primary)', letterSpacing: '-.02em', margin: 0 }}>
                {editId ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--dax-white-35)', margin: 0, marginTop: '1px' }}>
                {editId ? 'Modifica los datos del producto' : 'Completa la información del producto'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--dax-surface-2)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="rgba(255,255,255,0.5)"/>
          </button>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '12px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '8px 14px', borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab === t.id ? '2px solid #FF5C35' : '2px solid transparent', background: activeTab === t.id ? 'var(--dax-coral-soft)' : 'transparent', color: activeTab === t.id ? '#FF5C35' : 'var(--dax-white-35)', fontSize: '12px', fontWeight: activeTab === t.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', marginBottom: '-1px' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px', maxHeight: '65vh', overflowY: 'auto' }}>

          {/* ── GENERAL ── */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Field label="Nombre del producto" value={form.name} onChange={f('name')} placeholder="Ej: Coca Cola 350ml" required icon={Package}/>
                  <TextareaField label="Descripción" value={form.description} onChange={f('description')} placeholder="Descripción visible en el catálogo online..."/>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <Field label="Categoría" value={form.category} onChange={f('category')} placeholder="Bebidas, Lácteos..." icon={Tag}/>
                    <SelectField label="Unidad de medida" value={form.unit} onChange={f('unit')} icon={Scale}
                      options={UNITS.map(u => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}/>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Imagen</label>
                  <ImageUploader value={form.imageUrl} onChange={f('imageUrl')}/>
                </div>
              </div>

              <SectionTitle title="Identificación" desc="Códigos para búsqueda y escaneo"/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="SKU / Código interno" value={form.sku} onChange={f('sku')} placeholder="CC-231" icon={Hash}
                  suffix={
                    <button type="button" onClick={() => f('sku')(`SKU-${Date.now().toString(36).toUpperCase()}`)}
                      style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,92,53,0.7)', background: 'var(--dax-coral-soft)', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '5px', padding: '3px 7px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
                      Generar
                    </button>
                  }/>
                <Field label="Código de barras" value={form.barcode} onChange={f('barcode')} placeholder="7501234567890" icon={Barcode}/>
              </div>

              <Toggle label="Producto activo"
                desc="Visible en el POS y catálogo online"
                checked={form.active} onChange={f('active')}/>
            </div>
          )}

          {/* ── PRECIO E IVA ── */}
          {activeTab === 'pricing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SectionTitle title="Precios" desc="Configura precio de venta, costo y margen"/>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="Precio de venta" value={form.price} onChange={f('price')} type="number" placeholder="0" icon={DollarSign}
                  hint={form.taxIncluded ? 'IVA incluido' : 'Sin IVA'}/>
                <Field label="Costo / Precio compra" value={form.cost} onChange={f('cost')} type="number" placeholder="0" icon={TrendingUp}/>
              </div>

              {/* Margen */}
              {margin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: parseFloat(margin) >= 20 ? 'var(--dax-success-bg)' : parseFloat(margin) >= 10 ? 'var(--dax-warning-bg)' : 'var(--dax-danger-bg)', border: `1px solid ${parseFloat(margin) >= 20 ? 'rgba(61,191,127,0.2)' : parseFloat(margin) >= 10 ? 'rgba(240,160,48,0.2)' : 'rgba(224,80,80,0.2)'}`, borderRadius: '10px' }}>
                  <TrendingUp size={14} color={parseFloat(margin) >= 20 ? '#3DBF7F' : parseFloat(margin) >= 10 ? '#F0A030' : '#E05050'}/>
                  <span style={{ fontSize: '12px', color: 'var(--dax-white-60)' }}>Margen de ganancia:</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: parseFloat(margin) >= 20 ? '#3DBF7F' : parseFloat(margin) >= 10 ? '#F0A030' : '#E05050' }}>{margin}%</span>
                  <span style={{ fontSize: '11px', color: 'var(--dax-white-35)', marginLeft: 'auto' }}>
                    Ganancia: {fmt(parseFloat(form.price || '0') - parseFloat(form.cost || '0'))}
                  </span>
                </div>
              )}

              <SectionTitle title="Configuración de IVA" desc="Impuesto al Valor Agregado"/>

              <Toggle label="Precio incluye IVA"
                desc={form.taxIncluded ? 'El precio ya tiene el IVA incluido' : 'El IVA se suma al precio de venta'}
                checked={form.taxIncluded} onChange={f('taxIncluded')}/>

              <SelectField label="Tasa de IVA" value={form.taxRate} onChange={f('taxRate')} icon={Percent}
                options={TAX_RATES}/>

              {form.taxRate === 'custom' && (
                <Field label="Tasa personalizada (%)" value={customTax} onChange={setCustomTax} type="number" placeholder="0" icon={Percent}/>
              )}

              {/* Desglose IVA */}
              {parseFloat(form.price) > 0 && parseFloat(taxRate) > 0 && (
                <div style={{ padding: '14px', background: 'var(--dax-info-bg)', border: '1px solid rgba(90,170,240,0.15)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'rgba(90,170,240,0.7)', marginBottom: '10px' }}>Desglose del precio</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: 'Base imponible', value: fmt(taxCalc.base) },
                      { label: `IVA (${taxRate}%)`, value: fmt(taxCalc.tax), color: 'var(--dax-blue)' },
                      { label: 'Precio total al cliente', value: fmt(priceWithTax), bold: true },
                    ].map(({ label, value, color, bold }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'var(--dax-white-35)' }}>{label}</span>
                        <span style={{ fontSize: bold ? '14px' : '12px', fontWeight: bold ? 800 : 600, color: color ?? (bold ? '#fff' : 'var(--dax-white-60)') }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INVENTARIO ── */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SectionTitle title="Control de inventario" desc="Stock mínimo y alertas"/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="Stock mínimo (alerta)" value={form.minStock} onChange={f('minStock')} type="number" placeholder="5" icon={AlertCircle}
                  hint="Alerta cuando llegue a este nivel"/>
                <SelectField label="Unidad de medida" value={form.unit} onChange={f('unit')} icon={Scale}
                  options={UNITS.map(u => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}/>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                <p style={{ fontSize: '12px', color: 'var(--dax-white-35)', lineHeight: 1.6 }}>
                  💡 El stock se actualiza automáticamente al procesar ventas en el POS. Para ajustes manuales, usa el módulo de <strong style={{ color: 'var(--dax-white-60)' }}>Inventario</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ── EXTRA ── */}
          {activeTab === 'extra' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SectionTitle title="Información adicional" desc="Marca, proveedor y notas internas"/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="Marca" value={form.brand} onChange={f('brand')} placeholder="Coca Cola, Nike..." icon={Star}/>
                <Field label="Proveedor" value={form.supplier} onChange={f('supplier')} placeholder="Distribuidora..." icon={Truck}/>
              </div>
              <TextareaField label="Notas internas" value={form.notes} onChange={f('notes')} placeholder="Notas para el equipo (no visibles para clientes)..." rows={3}/>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,0.2)', borderRadius: '10px', marginTop: '14px', animation: 'shake .3s ease' }}>
              <AlertCircle size={14} color="#E07070" style={{ flexShrink: 0, marginTop: '1px' }}/>
              <p style={{ fontSize: '12px', color: '#E07070' }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,12,20,0.8)' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--dax-white-35)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
            Cancelar
          </button>
          <button type="button" onClick={onSave} disabled={saving}
            style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: saving ? 'var(--dax-coral-border)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: saving ? 'rgba(255,92,53,0.5)' : '#fff', fontSize: '13px', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: saving ? 'none' : '0 4px 16px rgba(255,92,53,0.3)', transition: 'all .2s' }}>
            {saving ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }}/> Guardando...</> : <><Check size={13}/> {editId ? 'Guardar cambios' : 'Crear producto'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  const stock = product.inventory?.[0]?.quantity ?? null;
  const meta  = product.metadata ?? {};
  const taxRate = meta.taxRate ?? 0;

  return (
    <div style={{ background: 'rgba(10,18,32,0.95)', border: `1px solid ${!product.active ? 'var(--dax-surface-2)' : 'var(--dax-surface-2)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'all .2s', opacity: product.active ? 1 : .5 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-coral-border)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = !product.active ? 'var(--dax-surface-2)' : 'var(--dax-surface-2)'; }}>

      {/* Imagen */}
      <div style={{ position: 'relative', height: '120px', background: 'var(--dax-surface)' }}>
        {product.imageUrl
          ? <img src={getImageUrl(product.imageUrl) ?? product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} color="rgba(255,255,255,0.1)"/></div>
        }
        {!product.active && <div style={{ position: 'absolute', inset: 0, background: 'var(--dax-overlay-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-primary)', background: 'var(--dax-overlay)', padding: '3px 8px', borderRadius: '6px' }}>INACTIVO</span></div>}
        {stock !== null && stock <= (meta.minStock ?? 5) && stock > 0 && (
          <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(240,160,48,0.9)', borderRadius: '6px', padding: '2px 7px', fontSize: '9px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>⚠ {stock}</div>
        )}
        {stock === 0 && <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(224,80,80,0.9)', borderRadius: '6px', padding: '2px 7px', fontSize: '9px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>AGOTADO</div>}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{product.name}</p>
        {product.category && <p style={{ fontSize: '10px', color: 'rgba(255,92,53,0.7)', fontWeight: 600, marginBottom: '6px' }}>{product.category}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 900, color: 'var(--dax-coral)', letterSpacing: '-.02em', lineHeight: 1 }}>{fmt(Number(product.price))}</p>
            {product.cost > 0 && <p style={{ fontSize: '10px', color: 'var(--dax-white-35)', marginTop: '1px' }}>Costo: {fmt(Number(product.cost))}</p>}
          </div>
          {taxRate > 0 && <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--dax-blue)', background: 'var(--dax-info-bg)', border: '1px solid rgba(90,170,240,0.2)', borderRadius: '5px', padding: '2px 6px' }}>IVA {taxRate}%</span>}
        </div>

        {/* SKU/Barcode */}
        {(product.sku || product.barcode) && (
          <p style={{ fontSize: '10px', color: 'var(--dax-white-25)', fontFamily: 'monospace', marginBottom: '8px' }}>
            {product.sku && <span>{product.sku}</span>}
            {product.sku && product.barcode && <span> · </span>}
            {product.barcode && <span>{product.barcode}</span>}
          </p>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onEdit} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--dax-white-60)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-coral-border)'; (e.currentTarget as HTMLElement).style.color = '#FF5C35'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-surface-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-white-60)'; }}>
            <Pencil size={11}/> Editar
          </button>
          <button onClick={onDelete} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(224,80,80,0.15)', background: 'transparent', color: 'rgba(224,80,80,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(224,80,80,0.4)'; (e.currentTarget as HTMLElement).style.color = '#E07070'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(224,80,80,0.15)'; (e.currentTarget as HTMLElement).style.color = 'rgba(224,80,80,0.4)'; }}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { industry } = useAuth();
  const qc = useQueryClient();

  const [showForm,       setShowForm]       = useState(false);
  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter,   setActiveFilter]   = useState<'all'|'active'|'inactive'>('all');
  const [form,           setForm]           = useState<ProductForm>(emptyForm);
  const [editId,         setEditId]         = useState<string | null>(null);
  const [error,          setError]          = useState('');
  const [confirmDelete,  setConfirmDelete]  = useState<Product | null>(null);
  const [viewMode,       setViewMode]       = useState<'grid'|'list'>('grid');

  const { data: rawProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products?limit=500&include=inventory');
      return data?.data ?? data ?? [];
    },
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['product-categories'],
    queryFn: async () => { const { data } = await api.get('/products/categories'); return data ?? []; },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => editId ? api.put(`/products/${editId}`, payload) : api.post('/products', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['product-categories'] }); setShowForm(false); setForm(emptyForm); setEditId(null); setError(''); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setConfirmDelete(null); },
  });

  const handleSave = () => {
    if (!form.name.trim()) return setError('El nombre es requerido');
    if (!form.price || parseFloat(form.price) <= 0) return setError('El precio es requerido');
    const taxRate = form.taxRate === 'custom' ? '0' : form.taxRate;
    const payload = {
      name:        form.name.trim(),
      description: form.description || undefined,
      category:    form.category    || undefined,
      sku:         form.sku         || undefined,
      barcode:     form.barcode     || undefined,
      price:       parseFloat(form.price),
      cost:        form.cost ? parseFloat(form.cost) : undefined,
      imageUrl:    form.imageUrl    || undefined,
      active:      form.active,
      metadata: {
        taxRate:     parseFloat(taxRate),
        taxIncluded: form.taxIncluded,
        minStock:    parseInt(form.minStock) || 5,
        unit:        form.unit,
        brand:       form.brand    || undefined,
        supplier:    form.supplier || undefined,
        notes:       form.notes    || undefined,
      },
    };
    saveMutation.mutate(payload);
  };

  const openEdit = (p: Product) => {
    const meta = p.metadata ?? {};
    setForm({
      name: p.name, description: p.description ?? '', category: p.category ?? '',
      sku: p.sku ?? '', barcode: p.barcode ?? '',
      price: String(p.price), cost: String(p.cost ?? ''),
      taxRate: String(meta.taxRate ?? '13'), taxIncluded: meta.taxIncluded ?? true,
      minStock: String(meta.minStock ?? 5), unit: meta.unit ?? 'unidad',
      brand: meta.brand ?? '', supplier: meta.supplier ?? '', notes: meta.notes ?? '',
      imageUrl: p.imageUrl ?? '', active: p.active ?? true,
    });
    setEditId(p.id); setError(''); setShowForm(true);
  };

  const products = (rawProducts as Product[]).filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCat    = !categoryFilter || p.category === categoryFilter;
    const matchActive = activeFilter === 'all' || (activeFilter === 'active' ? p.active : !p.active);
    return matchSearch && matchCat && matchActive;
  });

  const stats = {
    total:    (rawProducts as Product[]).length,
    active:   (rawProducts as Product[]).filter((p: Product) => p.active).length,
    lowStock: (rawProducts as Product[]).filter((p: Product) => { const s = p.inventory?.[0]?.quantity ?? 99; return s <= ((p.metadata as any)?.minStock ?? 5) && s > 0; }).length,
    outStock: (rawProducts as Product[]).filter((p: Product) => (p.inventory?.[0]?.quantity ?? 1) === 0).length,
  };

  const S = { muted: 'var(--dax-white-35)', border: 'var(--dax-surface-2)' };

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', fontFamily: "'Inter','Outfit',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--dax-text-primary)', letterSpacing: '-.02em', marginBottom: '3px' }}>Productos</h1>
          <p style={{ fontSize: '13px', color: S.muted }}>{stats.total} productos · {stats.active} activos</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setError(''); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: 'linear-gradient(135deg,#FF5C35,#FF3D1F)', border: 'none', borderRadius: '11px', color: 'var(--dax-text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,92,53,0.3)', transition: 'all .2s' }}>
          <Plus size={15}/> Nuevo producto
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total',       value: stats.total,    color: 'var(--dax-coral)' },
          { label: 'Activos',     value: stats.active,   color: 'var(--dax-success)' },
          { label: 'Stock bajo',  value: stats.lowStock, color: 'var(--dax-amber)' },
          { label: 'Agotados',    value: stats.outStock, color: 'var(--dax-danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '14px 16px', background: 'var(--dax-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
            <p style={{ fontSize: '22px', fontWeight: 900, color, letterSpacing: '-.02em' }}>{value}</p>
            <p style={{ fontSize: '11px', color: S.muted, marginTop: '2px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={13} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU o código de barras..."
            style={{ width: '100%', padding: '9px 14px 9px 34px', background: 'var(--dax-surface-2)', border: `1px solid ${S.border}`, borderRadius: '10px', color: 'var(--dax-text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,92,53,0.4)'; }}
            onBlur={e => { e.target.style.borderColor = S.border; }}/>
        </div>

        <div style={{ position: 'relative' }}>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '9px 28px 9px 12px', background: 'var(--dax-surface-2)', border: `1px solid ${S.border}`, borderRadius: '10px', color: categoryFilter ? '#FF5C35' : S.muted, fontSize: '12px', fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
            <option value="">Todas las categorías</option>
            {(categories as string[]).map(c => <option key={c} value={c} style={{ background: 'var(--dax-bg)' }}>{c}</option>)}
          </select>
          <ChevronDown size={11} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all','active','inactive'] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              style={{ padding: '8px 12px', borderRadius: '9px', border: `1px solid ${activeFilter === f ? 'rgba(255,92,53,0.35)' : S.border}`, background: activeFilter === f ? 'var(--dax-coral-soft)' : 'transparent', color: activeFilter === f ? '#FF5C35' : S.muted, fontSize: '11px', fontWeight: activeFilter === f ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Loader2 size={28} color="rgba(255,92,53,0.5)" style={{ animation: 'spin .7s linear infinite', margin: '0 auto 12px', display: 'block' }}/>
          <p style={{ fontSize: '13px', color: S.muted }}>Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Package size={40} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 16px', display: 'block' }}/>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-white-35)', marginBottom: '8px' }}>
            {search || categoryFilter ? 'Sin resultados' : 'Sin productos'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>
            {search || categoryFilter ? 'Prueba con otros filtros' : 'Crea tu primer producto'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
          {products.map((p: Product) => (
            <ProductCard key={p.id} product={p} onEdit={() => openEdit(p)} onDelete={() => setConfirmDelete(p)}/>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <ProductFormModal
          form={form} setForm={setForm} editId={editId}
          onSave={handleSave} onClose={() => setShowForm(false)}
          saving={saveMutation.isPending} error={error}
          categories={categories}
        />
      )}

      {/* Modal confirmar borrar */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--dax-overlay)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '100%', maxWidth: '360px', background: 'var(--dax-bg)', border: '1px solid rgba(224,80,80,0.25)', borderRadius: '16px', padding: '24px', animation: 'modalOpen .2s ease' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 16px' }}>
              <Trash2 size={20} color="#E07070"/>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--dax-text-primary)', marginBottom: '6px' }}>¿Eliminar producto?</h3>
            <p style={{ fontSize: '13px', color: S.muted, lineHeight: 1.6, marginBottom: '20px' }}>
              <strong style={{ color: 'var(--dax-text-primary)' }}>{confirmDelete.name}</strong> será eliminado permanentemente. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: `1px solid ${S.border}`, background: 'transparent', color: S.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={() => deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#E05050', color: 'var(--dax-text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: deleteMutation.isPending ? .6 : 1 }}>
                {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes modalOpen { from{opacity:0;transform:scale(.97) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
      `}</style>
    </div>
  );
}
