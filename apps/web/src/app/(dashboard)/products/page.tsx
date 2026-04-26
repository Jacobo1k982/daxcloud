'use client';
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import {
  Upload, X, Loader2, Package, Search, Pencil, Trash2, Plus,
  Tag, DollarSign, TrendingUp, Filter, Barcode, Hash, Scale,
  Star, AlertCircle, Check, ChevronDown, LayoutGrid, List,
  SlidersHorizontal, ChevronRight, Eye, EyeOff, ArrowUpDown,
  Image as ImageIcon, MoreVertical,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string; name: string; price: number; cost: number;
  sku: string; barcode: string; category: string; description: string;
  imageUrl: string; active: boolean; metadata?: any;
  inventory?: { quantity: number }[];
}

interface ProductForm {
  name: string; description: string; category: string;
  sku: string; barcode: string;
  price: string; cost: string;
  taxRate: string; taxIncluded: boolean;
  minStock: string; unit: string;
  brand: string; supplier: string; notes: string;
  imageUrl: string; active: boolean;
}

const emptyForm: ProductForm = {
  name: '', description: '', category: '',
  sku: '', barcode: '',
  price: '', cost: '',
  taxRate: '13', taxIncluded: true,
  minStock: '5', unit: 'unidad',
  brand: '', supplier: '', notes: '',
  imageUrl: '', active: true,
};

const UNITS = ['unidad','kg','g','lb','oz','litro','ml','caja','paquete','docena','par','metro','cm'];
const TAX_RATES = [
  { value: '0',      label: 'Exento (0%)' },
  { value: '1',      label: 'Canasta básica (1%)' },
  { value: '2',      label: 'Medicamentos (2%)' },
  { value: '4',      label: 'Reducido (4%)' },
  { value: '13',     label: 'Estándar (13%)' },
  { value: 'custom', label: 'Personalizado' },
];

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
  if (taxIncluded) { const base = p / (1 + r); return { base, tax: p - base }; }
  return { base: p, tax: p * r };
}

// ── Image Uploader ────────────────────────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [tab, setTab]         = useState<'upload'|'url'>('upload');
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [drag, setDrag]       = useState(false);
  const [imgError, setImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset error cuando cambia la imagen
  const handleChange = (url: string) => { setImgError(false); onChange(url); };

  const uploadFile = async (file: File) => {
    setLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/uploads/product-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data.url ?? data.imageUrl ?? '';
      if (!url) throw new Error('No se recibió URL');
      handleChange(url);
    } catch (e: any) {
      alert('Error al subir imagen: ' + (e?.response?.data?.message ?? e?.message ?? 'Error'));
    } finally { setLoading(false); }
  };

  const imgSrc = value ? (getImageUrl(value) ?? value) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Preview */}
      {value && imgSrc && !imgError ? (
        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={imgSrc}
            alt="preview"
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '8px', display: 'block' }}
          />
          <button type="button" onClick={() => handleChange('')}
            style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <X size={13} color="#fff"/>
          </button>
        </div>
      ) : value && (imgError || !imgSrc) ? (
        /* URL guardada pero imagen no carga */
        <div style={{ width: '100%', height: '80px', borderRadius: '10px', border: '1px dashed var(--dax-border)', background: 'var(--dax-surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ImageIcon size={18} color="var(--dax-text-muted)"/>
          <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Imagen no disponible</p>
          <button type="button" onClick={() => handleChange('')} style={{ fontSize: '10px', color: '#FF5C35', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cambiar imagen</button>
        </div>
      ) : null}

      {/* Tabs solo si no hay imagen */}
      {!value && (
        <>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--dax-surface-2)', padding: '3px', borderRadius: '9px', border: '1px solid var(--dax-border)' }}>
            {[{ k:'upload', label:'📁 Subir archivo' }, { k:'url', label:'🔗 URL' }].map(t => (
              <button key={t.k} type="button" onClick={() => setTab(t.k as any)}
                style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', border: 'none', background: tab===t.k ? 'var(--dax-surface)' : 'transparent', color: tab===t.k ? '#FF5C35' : 'var(--dax-text-muted)', fontSize: '11px', fontWeight: tab===t.k ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', boxShadow: tab===t.k ? 'var(--dax-shadow-sm)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
              onClick={() => inputRef.current?.click()}
              style={{ height: '80px', border: `2px dashed ${drag ? '#FF5C35' : 'var(--dax-border)'}`, borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '5px', background: drag ? 'rgba(255,92,53,0.04)' : 'transparent', transition: 'all .2s' }}>
              {loading
                ? <><Loader2 size={18} color="#FF5C35" style={{ animation: 'spin .7s linear infinite' }}/><p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Subiendo...</p></>
                : <><Upload size={18} color="var(--dax-text-muted)"/><p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Arrastra o haz clic · JPG, PNG, WebP</p></>
              }
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}/>
            </div>
          )}

          {tab === 'url' && (
            <div style={{ display: 'flex', gap: '7px' }}>
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg" type="url"
                onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) handleChange(urlInput.trim()); }}
                style={{ flex: 1, padding: '9px 12px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '9px', color: 'var(--dax-text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', minWidth: 0 }}/>
              <button type="button" onClick={() => { if (urlInput.trim()) handleChange(urlInput.trim()); }}
                style={{ padding: '9px 14px', background: '#FF5C35', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Aplicar
              </button>
            </div>
          )}
        </>
      )}

      {/* Botón cambiar imagen si ya hay una */}
      {value && (
        <button type="button" onClick={() => { handleChange(''); setTab('upload'); }}
          style={{ padding: '7px 12px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '8px', color: 'var(--dax-text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center', transition: 'all .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,92,53,0.3)'; (e.currentTarget as HTMLElement).style.color = '#FF5C35'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--dax-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}>
          <Upload size={11}/> Cambiar imagen
        </button>
      )}
    </div>
  );
}

// ── Field components ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, type='text', placeholder, icon:Icon, required, hint }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: focused ? '#FF5C35' : 'var(--dax-text-muted)', marginBottom: '6px', transition: 'color .2s' }}>
        <span>{label}{required && <span style={{ color: '#FF5C35', marginLeft: '3px' }}>*</span>}</span>
        {hint && <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'none' as const, letterSpacing: 0, color: 'var(--dax-text-muted)' }}>{hint}</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={13} color={focused ? '#FF5C35' : 'var(--dax-text-muted)'} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color .2s' }}/>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: `10px ${Icon?'11px':'12px'} 10px ${Icon?'32px':'12px'}`, background: focused ? 'rgba(255,92,53,0.03)' : 'var(--dax-surface-2)', border: `1px solid ${focused ? 'rgba(255,92,53,0.4)' : 'var(--dax-border)'}`, borderRadius: '9px', color: 'var(--dax-text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, transition: 'all .2s', boxShadow: focused ? '0 0 0 3px rgba(255,92,53,0.07)' : 'none' }}/>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, icon:Icon }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>}
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: `10px 28px 10px ${Icon?'32px':'12px'}`, background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '9px', color: 'var(--dax-text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}>
          {options.map((o: any) => <option key={o.value} value={o.value} style={{ background: 'var(--dax-surface)' }}>{o.label}</option>)}
        </select>
        <ChevronDown size={11} color="var(--dax-text-muted)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '9px' }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: desc?'2px':0 }}>{label}</p>
        {desc && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{desc}</p>}
      </div>
      <div onClick={() => onChange(!checked)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: checked ? '#FF5C35' : 'var(--dax-border)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2px', left: checked ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }}/>
      </div>
    </div>
  );
}

// ── Product Form Modal ────────────────────────────────────────────────────────
function ProductFormModal({ form, setForm, editId, onSave, onClose, saving, error }: any) {
  const [customTax, setCustomTax] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const taxRate = form.taxRate === 'custom' ? customTax : form.taxRate;
  const taxCalc = calcTaxAmount(form.price, taxRate, form.taxIncluded);
  const priceWithTax = form.taxIncluded ? parseFloat(form.price||'0') : taxCalc.base + taxCalc.tax;
  const margin = calcMargin(form.price, form.cost);
  const f = (key: keyof ProductForm) => (v: any) => setForm((p: ProductForm) => ({ ...p, [key]: v }));
  const TABS = [{ id:'basic',label:'General' },{ id:'pricing',label:'Precio e IVA' },{ id:'inventory',label:'Inventario' },{ id:'extra',label:'Más info' }];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflow: 'auto', background: 'var(--dax-overlay)', backdropFilter: 'blur(8px)' }}>
      <div className="prod-modal" style={{ width: '100%', maxWidth: '660px', background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: '18px', overflow: 'hidden', boxShadow: 'var(--dax-shadow-lg)', marginTop: '16px', animation: 'modalOpen .25s cubic-bezier(.22,1,.36,1)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--dax-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--dax-coral-soft)', border: '1px solid var(--dax-coral-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color="#FF5C35"/>
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dax-text-primary)', margin: 0 }}>{editId ? 'Editar producto' : 'Nuevo producto'}</h2>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', margin: 0 }}>{editId ? 'Modifica los datos' : 'Completa la información'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={13} color="var(--dax-text-muted)"/>
          </button>
        </div>

        {/* Tabs */}
        <div className="prod-tabs" style={{ display: 'flex', gap: '2px', padding: '10px 22px 0', borderBottom: '1px solid var(--dax-border)', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '8px 14px', borderRadius: '8px 8px 0 0', border: 'none', borderBottom: activeTab===t.id ? '2px solid #FF5C35' : '2px solid transparent', background: activeTab===t.id ? 'var(--dax-coral-soft)' : 'transparent', color: activeTab===t.id ? '#FF5C35' : 'var(--dax-text-muted)', fontSize: '12px', fontWeight: activeTab===t.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', marginBottom: '-1px', whiteSpace: 'nowrap' as const }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="prod-modal-body" style={{ padding: '20px 22px', maxHeight: '62vh', overflowY: 'auto' }}>

          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="prod-img-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '14px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Field label="Nombre del producto" value={form.name} onChange={f('name')} placeholder="Ej: Coca Cola 350ml" required icon={Package}/>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '6px' }}>Descripción</label>
                    <textarea value={form.description} onChange={e => f('description')(e.target.value)} placeholder="Descripción visible en catálogo..." rows={2}
                      style={{ width: '100%', padding: '10px 12px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '9px', color: 'var(--dax-text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const }}/>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <Field label="Categoría" value={form.category} onChange={f('category')} placeholder="Bebidas..." icon={Tag}/>
                    <SelectField label="Unidad" value={form.unit} onChange={f('unit')} icon={Scale} options={UNITS.map(u => ({ value: u, label: u.charAt(0).toUpperCase()+u.slice(1) }))}/>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>Imagen</label>
                  <ImageUploader value={form.imageUrl} onChange={f('imageUrl')}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="SKU" value={form.sku} onChange={f('sku')} placeholder="CC-231" icon={Hash}
                  suffix={<button type="button" onClick={() => f('sku')(`SKU-${Date.now().toString(36).toUpperCase()}`)} style={{ fontSize: '9px', fontWeight: 700, color: '#FF5C35', background: 'rgba(255,92,53,0.08)', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '5px', padding: '3px 7px', cursor: 'pointer', fontFamily: 'inherit' }}>Generar</button>}/>
                <Field label="Código de barras" value={form.barcode} onChange={f('barcode')} placeholder="7501234567890" icon={Barcode}/>
              </div>
              <Toggle label="Producto activo" desc="Visible en POS y catálogo" checked={form.active} onChange={f('active')}/>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="Precio de venta" value={form.price} onChange={f('price')} type="number" placeholder="0" icon={DollarSign} hint={form.taxIncluded?'IVA incluido':'Sin IVA'}/>
                <Field label="Costo / Compra" value={form.cost} onChange={f('cost')} type="number" placeholder="0" icon={TrendingUp}/>
              </div>
              {margin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 13px', background: parseFloat(margin)>=20?'var(--dax-success-bg)':parseFloat(margin)>=10?'var(--dax-warning-bg)':'var(--dax-danger-bg)', border: `1px solid ${parseFloat(margin)>=20?'rgba(61,191,127,.25)':parseFloat(margin)>=10?'rgba(240,160,48,.25)':'rgba(224,80,80,.25)'}`, borderRadius: '9px' }}>
                  <TrendingUp size={14} color={parseFloat(margin)>=20?'#3DBF7F':parseFloat(margin)>=10?'#F0A030':'#E05050'}/>
                  <span style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Margen de ganancia:</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: parseFloat(margin)>=20?'#3DBF7F':parseFloat(margin)>=10?'#F0A030':'#E05050' }}>{margin}%</span>
                  <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginLeft: 'auto' }}>Ganancia: {fmt(parseFloat(form.price||'0')-parseFloat(form.cost||'0'))}</span>
                </div>
              )}
              <Toggle label="Precio incluye IVA" desc={form.taxIncluded?'El precio ya tiene IVA':'El IVA se suma al precio'} checked={form.taxIncluded} onChange={f('taxIncluded')}/>
              <SelectField label="Tasa de IVA" value={form.taxRate} onChange={f('taxRate')} icon={() => <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)', position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}>%</span>} options={TAX_RATES}/>
              {form.taxRate === 'custom' && <Field label="Tasa personalizada (%)" value={customTax} onChange={setCustomTax} type="number" placeholder="0"/>}
              {parseFloat(form.price)>0 && parseFloat(taxRate)>0 && (
                <div style={{ padding: '12px 14px', background: 'var(--dax-info-bg)', border: '1px solid rgba(90,170,240,.2)', borderRadius: '9px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-blue)', marginBottom: '8px' }}>Desglose del precio</p>
                  {[{ label:'Base imponible', value:fmt(taxCalc.base) },{ label:`IVA (${taxRate}%)`, value:fmt(taxCalc.tax), color:'var(--dax-blue)' },{ label:'Total al cliente', value:fmt(priceWithTax), bold:true }].map(({ label,value,color,bold }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                      <span style={{ fontSize:'12px', color:'var(--dax-text-muted)' }}>{label}</span>
                      <span style={{ fontSize: bold?'14px':'12px', fontWeight: bold?800:600, color: color??(bold?'var(--dax-text-primary)':'var(--dax-text-secondary)') }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="Stock mínimo (alerta)" value={form.minStock} onChange={f('minStock')} type="number" placeholder="5" icon={AlertCircle}/>
                <SelectField label="Unidad de medida" value={form.unit} onChange={f('unit')} icon={Scale} options={UNITS.map(u => ({ value: u, label: u.charAt(0).toUpperCase()+u.slice(1) }))}/>
              </div>
              <div style={{ padding: '11px 13px', background: 'var(--dax-info-bg)', border: '1px solid rgba(90,170,240,.15)', borderRadius: '9px' }}>
                <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.6 }}>💡 El stock se actualiza automáticamente al vender. Para ajustes manuales usa el módulo de <strong style={{ color: 'var(--dax-text-secondary)' }}>Inventario</strong>.</p>
              </div>
            </div>
          )}

          {activeTab === 'extra' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="Marca" value={form.brand} onChange={f('brand')} placeholder="Nike, Coca-Cola..." icon={Star}/>
                <Field label="Proveedor" value={form.supplier} onChange={f('supplier')} placeholder="Distribuidora..." icon={() => <Package size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}/>}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '6px' }}>Notas internas</label>
                <textarea value={form.notes} onChange={e => f('notes')(e.target.value)} placeholder="Notas para el equipo..." rows={3}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '9px', color: 'var(--dax-text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const }}/>
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', gap: '8px', padding: '10px 13px', background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '9px', marginTop: '12px' }}>
              <AlertCircle size={13} color="#E05050" style={{ flexShrink: 0, marginTop: '1px' }}/>
              <p style={{ fontSize: '12px', color: '#E05050' }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 22px', borderTop: '1px solid var(--dax-border)', background: 'var(--dax-surface)' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '9px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button type="button" onClick={onSave} disabled={saving}
            style={{ padding: '9px 22px', borderRadius: '9px', border: 'none', background: saving ? 'var(--dax-surface-2)' : 'linear-gradient(135deg,#FF5C35,#FF3D1F)', color: saving ? 'var(--dax-text-muted)' : '#fff', fontSize: '13px', fontWeight: 800, cursor: saving?'not-allowed':'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: saving?'none':'var(--dax-shadow-coral)', transition: 'all .2s' }}>
            {saving ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }}/> Guardando...</> : <><Check size={13}/> {editId?'Guardar cambios':'Crear producto'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Image ─────────────────────────────────────────────────────────────
function ProductImg({ src, name, size=40 }: { src?:string|null; name:string; size?:number }) {
  const [error, setError] = useState(false);
  const url = getImageUrl(src);
  if (!url || error) return (
    <div style={{ width:size, height:size, borderRadius:'8px', background:'var(--dax-surface-2)', border:'1px solid var(--dax-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Package size={size*.35} color="var(--dax-text-muted)" style={{ opacity:.4 }}/>
    </div>
  );
  return <img src={url} alt={name} onError={() => setError(true)} style={{ width:size, height:size, borderRadius:'8px', objectFit:'contain', border:'1px solid var(--dax-border)', flexShrink:0, background:'var(--dax-surface-2)', padding:'2px' }}/>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const qc = useQueryClient();
  const [showForm,       setShowForm]       = useState(false);
  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter,   setActiveFilter]   = useState<'all'|'active'|'inactive'>('all');
  const [priceMin,       setPriceMin]       = useState('');
  const [priceMax,       setPriceMax]       = useState('');
  const [viewMode,       setViewMode]       = useState<'list'|'grid'>('list');
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [form,           setForm]           = useState<ProductForm>(emptyForm);
  const [editId,         setEditId]         = useState<string|null>(null);
  const [error,          setError]          = useState('');
  const [confirmDelete,  setConfirmDelete]  = useState<Product|null>(null);
  const [sortBy,         setSortBy]         = useState<'name'|'price'|'stock'>('name');
  const [sortDir,        setSortDir]        = useState<'asc'|'desc'>('asc');

  const { data: rawProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products?limit=2000&include=inventory');
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
    saveMutation.mutate({
      name: form.name.trim(), description: form.description||undefined, category: form.category||undefined,
      sku: form.sku||undefined, barcode: form.barcode||undefined,
      price: parseFloat(form.price), cost: form.cost?parseFloat(form.cost):undefined,
      imageUrl: form.imageUrl||undefined, active: form.active,
      metadata: { taxRate: parseFloat(taxRate), taxIncluded: form.taxIncluded, minStock: parseInt(form.minStock)||5, unit: form.unit, brand: form.brand||undefined, supplier: form.supplier||undefined, notes: form.notes||undefined },
    });
  };

  const openEdit = (p: Product) => {
    const m = p.metadata ?? {};
    setForm({ name:p.name, description:p.description??'', category:p.category??'', sku:p.sku??'', barcode:p.barcode??'', price:String(p.price), cost:String(p.cost??''), taxRate:String(m.taxRate??'13'), taxIncluded:m.taxIncluded??true, minStock:String(m.minStock??5), unit:m.unit??'unidad', brand:m.brand??'', supplier:m.supplier??'', notes:m.notes??'', imageUrl:p.imageUrl??'', active:p.active??true });
    setEditId(p.id); setError(''); setShowForm(true);
  };

  const products = (rawProducts as Product[]).filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(q);
    const matchCat    = !categoryFilter || p.category === categoryFilter;
    const matchActive = activeFilter==='all' || (activeFilter==='active'?p.active:!p.active);
    const matchPrice  = (!priceMin || Number(p.price)>=parseFloat(priceMin)) && (!priceMax || Number(p.price)<=parseFloat(priceMax));
    return matchSearch && matchCat && matchActive && matchPrice;
  }).sort((a, b) => {
    let va: any, vb: any;
    if (sortBy==='name')  { va=a.name.toLowerCase(); vb=b.name.toLowerCase(); }
    else if (sortBy==='price') { va=Number(a.price); vb=Number(b.price); }
    else { va=a.inventory?.[0]?.quantity??0; vb=b.inventory?.[0]?.quantity??0; }
    return sortDir==='asc' ? (va>vb?1:-1) : (va<vb?1:-1);
  });

  const stats = {
    total:    (rawProducts as Product[]).length,
    active:   (rawProducts as Product[]).filter((p:Product)=>p.active).length,
    lowStock: (rawProducts as Product[]).filter((p:Product)=>{const s=p.inventory?.[0]?.quantity??99;return s<=(p.metadata?.minStock??5)&&s>0;}).length,
    outStock: (rawProducts as Product[]).filter((p:Product)=>(p.inventory?.[0]?.quantity??1)===0).length,
  };

  const toggleSort = (col: 'name'|'price'|'stock') => {
    if (sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:"'Inter','Outfit',system-ui,sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div className='prod-topbar' style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 0', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:800, color:'var(--dax-text-primary)', letterSpacing:'-.02em', marginBottom:'2px' }}>Productos</h1>
          <p style={{ fontSize:'12px', color:'var(--dax-text-muted)' }}>{stats.total.toLocaleString()} productos · {stats.active.toLocaleString()} activos</p>
        </div>
        <div className='prod-actions' style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {/* Search */}
          <div className='prod-search-wrap' style={{ position:'relative' }}>
            <Search size={13} color="var(--dax-text-muted)" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar producto, SKU, código..."
              style={{ padding:'9px 14px 9px 32px', background:'var(--dax-surface)', border:'1px solid var(--dax-border)', borderRadius:'9px', color:'var(--dax-text-primary)', fontSize:'13px', fontFamily:'inherit', outline:'none', width:'260px', transition:'all .2s' }}
              onFocus={e=>{e.target.style.borderColor='rgba(255,92,53,0.4)';e.target.style.width='320px';}}
              onBlur={e=>{e.target.style.borderColor='var(--dax-border)';e.target.style.width='260px';}}/>
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={12} color="var(--dax-text-muted)"/></button>}
          </div>
          {/* View toggle */}
          <div style={{ display:'flex', background:'var(--dax-surface-2)', border:'1px solid var(--dax-border)', borderRadius:'9px', padding:'2px', gap:'2px' }}>
            {(['list','grid'] as const).map(v => (
              <button key={v} onClick={()=>setViewMode(v)}
                style={{ width:'30px', height:'30px', borderRadius:'7px', border:'none', background:viewMode===v?'var(--dax-surface)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:viewMode===v?'var(--dax-shadow-sm)':'none', transition:'all .15s' }}>
                {v==='list'?<List size={14} color={viewMode===v?'#FF5C35':'var(--dax-text-muted)'}/>:<LayoutGrid size={14} color={viewMode===v?'#FF5C35':'var(--dax-text-muted)'}/>}
              </button>
            ))}
          </div>
          {/* Sidebar toggle */}
          <button onClick={()=>setSidebarOpen(p=>!p)}
            style={{ width:'34px', height:'34px', borderRadius:'9px', border:'1px solid var(--dax-border)', background: sidebarOpen?'var(--dax-coral-soft)':'var(--dax-surface-2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}>
            <SlidersHorizontal size={14} color={sidebarOpen?'#FF5C35':'var(--dax-text-muted)'}/>
          </button>
          <button onClick={()=>{setForm(emptyForm);setEditId(null);setError('');setShowForm(true);}}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', border:'none', borderRadius:'9px', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--dax-shadow-coral)', transition:'all .2s', whiteSpace:'nowrap' as const }}>
            <Plus size={14}/> Nuevo producto
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className='prod-stats' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', padding:'16px 20px 0' }}>
        {[
          { label:'Total',      value:stats.total,    color:'#FF5C35' },
          { label:'Activos',    value:stats.active,   color:'#3DBF7F' },
          { label:'Stock bajo', value:stats.lowStock, color:'#F0A030' },
          { label:'Agotados',   value:stats.outStock, color:'#E05050' },
        ].map(({label,value,color}) => (
          <div key={label} style={{ padding:'12px 16px', background:'var(--dax-surface)', border:'1px solid var(--dax-border)', borderRadius:'10px', display:'flex', alignItems:'center', gap:'12px' }}>
            <p style={{ fontSize:'22px', fontWeight:900, color, letterSpacing:'-.02em', lineHeight:1 }}>{value.toLocaleString()}</p>
            <p style={{ fontSize:'11px', color:'var(--dax-text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN BODY ── */}
      <div className='prod-layout' style={{ display:'flex', flex:1, overflow:'hidden', padding:'16px 20px', gap:'16px' }}>

        {/* ── OVERLAY MÓVIL ── */}
        {sidebarOpen && <div className="prod-sidebar-overlay" onClick={() => setSidebarOpen(false)}/>}

        {/* ── SIDEBAR FILTROS ── */}
        {sidebarOpen && (
          <div className='prod-sidebar' style={{ width:'220px', flexShrink:0, display:'flex', flexDirection:'column', gap:'16px', overflowY:'auto' }}>

            {/* Estado */}
            <div style={{ background:'var(--dax-surface)', border:'1px solid var(--dax-border)', borderRadius:'12px', padding:'14px 16px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'var(--dax-text-muted)', marginBottom:'10px' }}>Estado</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                {([['all','Todos',stats.total],['active','Activos',stats.active],['inactive','Inactivos',stats.total-stats.active]] as const).map(([val,label,count]) => (
                  <button key={val} onClick={()=>setActiveFilter(val as any)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:'7px', border:'none', background:activeFilter===val?'var(--dax-coral-soft)':'transparent', color:activeFilter===val?'#FF5C35':'var(--dax-text-secondary)', fontSize:'12px', fontWeight:activeFilter===val?700:400, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', textAlign:'left' as const }}>
                    <span>{label}</span>
                    <span style={{ fontSize:'10px', background:activeFilter===val?'rgba(255,92,53,0.15)':'var(--dax-surface-2)', padding:'2px 7px', borderRadius:'20px', color:activeFilter===val?'#FF5C35':'var(--dax-text-muted)' }}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categorías */}
            <div style={{ background:'var(--dax-surface)', border:'1px solid var(--dax-border)', borderRadius:'12px', padding:'14px 16px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'var(--dax-text-muted)', marginBottom:'10px' }}>Categorías</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px', maxHeight:'220px', overflowY:'auto' }}>
                <button onClick={()=>setCategoryFilter('')}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:'7px', border:'none', background:!categoryFilter?'var(--dax-coral-soft)':'transparent', color:!categoryFilter?'#FF5C35':'var(--dax-text-secondary)', fontSize:'12px', fontWeight:!categoryFilter?700:400, cursor:'pointer', fontFamily:'inherit', textAlign:'left' as const }}>
                  <span>Todas</span>
                  <span style={{ fontSize:'10px', background:!categoryFilter?'rgba(255,92,53,0.15)':'var(--dax-surface-2)', padding:'2px 7px', borderRadius:'20px', color:!categoryFilter?'#FF5C35':'var(--dax-text-muted)' }}>{(rawProducts as Product[]).length}</span>
                </button>
                {(categories as string[]).map(cat => {
                  const count = (rawProducts as Product[]).filter((p:Product)=>p.category===cat).length;
                  return (
                    <button key={cat} onClick={()=>setCategoryFilter(cat)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:'7px', border:'none', background:categoryFilter===cat?'var(--dax-coral-soft)':'transparent', color:categoryFilter===cat?'#FF5C35':'var(--dax-text-secondary)', fontSize:'12px', fontWeight:categoryFilter===cat?700:400, cursor:'pointer', fontFamily:'inherit', textAlign:'left' as const, overflow:'hidden' }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{cat}</span>
                      <span style={{ fontSize:'10px', background:categoryFilter===cat?'rgba(255,92,53,0.15)':'var(--dax-surface-2)', padding:'2px 7px', borderRadius:'20px', color:categoryFilter===cat?'#FF5C35':'var(--dax-text-muted)', flexShrink:0 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Precio */}
            <div style={{ background:'var(--dax-surface)', border:'1px solid var(--dax-border)', borderRadius:'12px', padding:'14px 16px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'var(--dax-text-muted)', marginBottom:'10px' }}>Rango de precio</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <input value={priceMin} onChange={e=>setPriceMin(e.target.value)} type="number" placeholder="Mínimo ₡"
                  style={{ padding:'8px 10px', background:'var(--dax-surface-2)', border:'1px solid var(--dax-border)', borderRadius:'7px', color:'var(--dax-text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' as const }}/>
                <input value={priceMax} onChange={e=>setPriceMax(e.target.value)} type="number" placeholder="Máximo ₡"
                  style={{ padding:'8px 10px', background:'var(--dax-surface-2)', border:'1px solid var(--dax-border)', borderRadius:'7px', color:'var(--dax-text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' as const }}/>
                {(priceMin||priceMax) && <button onClick={()=>{setPriceMin('');setPriceMax('');}} style={{ fontSize:'11px', color:'#FF5C35', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' as const }}>Limpiar filtro</button>}
              </div>
            </div>

            {/* Ordenar */}
            <div style={{ background:'var(--dax-surface)', border:'1px solid var(--dax-border)', borderRadius:'12px', padding:'14px 16px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, color:'var(--dax-text-muted)', marginBottom:'10px' }}>Ordenar por</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                {([['name','Nombre'],['price','Precio'],['stock','Stock']] as const).map(([val,label]) => (
                  <button key={val} onClick={()=>toggleSort(val)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:'7px', border:'none', background:sortBy===val?'var(--dax-coral-soft)':'transparent', color:sortBy===val?'#FF5C35':'var(--dax-text-secondary)', fontSize:'12px', fontWeight:sortBy===val?700:400, cursor:'pointer', fontFamily:'inherit', textAlign:'left' as const }}>
                    <span>{label}</span>
                    {sortBy===val && <span style={{ fontSize:'10px' }}>{sortDir==='asc'?'↑':'↓'}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minWidth:0 }}>
          {/* Barra de resultados */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
            <p style={{ fontSize:'12px', color:'var(--dax-text-muted)' }}>
              {products.length < (rawProducts as Product[]).length
                ? <><strong style={{ color:'var(--dax-text-primary)' }}>{products.length.toLocaleString()}</strong> de {(rawProducts as Product[]).length.toLocaleString()} productos</>
                : <><strong style={{ color:'var(--dax-text-primary)' }}>{products.length.toLocaleString()}</strong> productos</>
              }
              {(search||categoryFilter) && <button onClick={()=>{setSearch('');setCategoryFilter('');}} style={{ marginLeft:'8px', fontSize:'11px', color:'#FF5C35', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Limpiar filtros</button>}
            </p>
          </div>

          {isLoading && (
            <div style={{ textAlign:'center', padding:'60px', color:'var(--dax-text-muted)' }}>
              <Loader2 size={28} color="rgba(255,92,53,0.5)" style={{ animation:'spin .7s linear infinite', margin:'0 auto 12px', display:'block' }}/>
              <p style={{ fontSize:'13px' }}>Cargando productos...</p>
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px', color:'var(--dax-text-muted)' }}>
              <Package size={40} color="var(--dax-border)" style={{ margin:'0 auto 16px', display:'block' }}/>
              <p style={{ fontSize:'15px', fontWeight:700, marginBottom:'8px' }}>{search||categoryFilter?'Sin resultados':'Sin productos'}</p>
              <p style={{ fontSize:'13px' }}>{search||categoryFilter?'Prueba con otros filtros':'Crea tu primer producto'}</p>
            </div>
          )}

          {/* ── VISTA LISTA ── */}
          {!isLoading && products.length > 0 && viewMode === 'list' && (
            <div style={{ flex:1, overflowY:'auto', borderRadius:'12px', border:'1px solid var(--dax-border)', background:'var(--dax-surface)' }}>
              {/* Cabecera tabla */}
              <div className='prod-list-header' style={{ display:'grid', gridTemplateColumns:'42px 2fr 1fr 100px 80px 90px 90px', gap:'0', padding:'9px 14px', borderBottom:'1px solid var(--dax-border)', background:'var(--dax-surface-2)', position:'sticky', top:0, zIndex:1 }}>
                {['','Producto','Categoría','Precio','Stock','Estado',''].map((h,i) => (
                  <div key={i} style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' as const, color:'var(--dax-text-muted)', display:'flex', alignItems:'center', gap:'4px', cursor: h&&i<6?'pointer':'default' }}
                    onClick={() => { if(h==='Precio') toggleSort('price'); else if(h==='Producto') toggleSort('name'); else if(h==='Stock') toggleSort('stock'); }}>
                    {h}
                    {((h==='Precio'&&sortBy==='price')||(h==='Producto'&&sortBy==='name')||(h==='Stock'&&sortBy==='stock')) && <span>{sortDir==='asc'?'↑':'↓'}</span>}
                  </div>
                ))}
              </div>

              {products.map((p, i) => {
                const stock = p.inventory?.[0]?.quantity ?? null;
                const meta  = p.metadata ?? {};
                const taxRate = meta.taxRate ?? 0;
                const margin  = p.cost > 0 ? ((Number(p.price)-Number(p.cost))/Number(p.price)*100).toFixed(0) : null;
                const isLow = stock !== null && stock <= (meta.minStock??5) && stock > 0;
                const isOut = stock === 0;

                return (
                  <div key={p.id} className='prod-list-row' style={{ display:'grid', gridTemplateColumns:'42px 2fr 1fr 100px 80px 90px 90px', gap:'0', padding:'10px 14px', borderBottom:'1px solid var(--dax-border)', alignItems:'center', background:i%2===0?'transparent':'var(--dax-surface-2)', opacity:p.active?1:.55, transition:'background .15s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--dax-coral-soft)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=i%2===0?'transparent':'var(--dax-surface-2)';}}>

                    <ProductImg src={p.imageUrl} name={p.name} size={34}/>

                    <div style={{ minWidth:0, paddingRight:'8px' }}>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'var(--dax-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, marginBottom:'2px' }}>{p.name}</p>
                      <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' as const }}>
                        {p.sku && <span style={{ fontSize:'10px', color:'var(--dax-text-muted)', fontFamily:'monospace' }}>{p.sku}</span>}
                        {p.barcode && <span style={{ fontSize:'10px', color:'var(--dax-text-muted)', fontFamily:'monospace' }}>· {p.barcode}</span>}
                      </div>
                    </div>

                    <div style={{ minWidth:0 }}>
                      {p.category && <span style={{ fontSize:'11px', color:'#FF5C35', background:'var(--dax-coral-soft)', padding:'2px 8px', borderRadius:'20px', whiteSpace:'nowrap' as const, overflow:'hidden', textOverflow:'ellipsis', display:'block', width:'fit-content', maxWidth:'100%' }}>{p.category}</span>}
                    </div>

                    <div>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'var(--dax-text-primary)', letterSpacing:'-.01em' }}>{fmt(Number(p.price))}</p>
                      <div style={{ display:'flex', gap:'4px', alignItems:'center', flexWrap:'wrap' as const }}>
                        {taxRate > 0 && <span style={{ fontSize:'9px', fontWeight:700, color:'#5AAAF0', background:'var(--dax-info-bg)', padding:'1px 5px', borderRadius:'4px' }}>IVA {taxRate}%</span>}
                        {margin && <span style={{ fontSize:'9px', fontWeight:700, color: parseFloat(margin)>=20?'#3DBF7F':parseFloat(margin)>=10?'#F0A030':'#E05050' }}>{margin}%</span>}
                      </div>
                    </div>

                    <div>
                      {stock !== null ? (
                        <span style={{ fontSize:'12px', fontWeight:700, color:isOut?'#E05050':isLow?'#F0A030':'var(--dax-text-secondary)' }}>
                          {isOut ? 'Agotado' : `${stock} ${meta.unit??'uds'}`}
                        </span>
                      ) : <span style={{ fontSize:'11px', color:'var(--dax-text-muted)' }}>—</span>}
                    </div>

                    <div>
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'20px', background:p.active?'var(--dax-success-bg)':'var(--dax-surface-2)', color:p.active?'#3DBF7F':'var(--dax-text-muted)', border:`1px solid ${p.active?'rgba(61,191,127,.2)':'var(--dax-border)'}` }}>
                        {p.active?'Activo':'Inactivo'}
                      </span>
                    </div>

                    <div style={{ display:'flex', gap:'6px', justifyContent:'flex-end' }}>
                      <button onClick={()=>openEdit(p)} style={{ width:'28px', height:'28px', borderRadius:'7px', border:'1px solid var(--dax-border)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.4)';(e.currentTarget as HTMLElement).style.background='var(--dax-coral-soft)';}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--dax-border)';(e.currentTarget as HTMLElement).style.background='transparent';}}>
                        <Pencil size={12} color="var(--dax-text-muted)"/>
                      </button>
                      <button onClick={()=>setConfirmDelete(p)} style={{ width:'28px', height:'28px', borderRadius:'7px', border:'1px solid rgba(224,80,80,.15)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(224,80,80,0.4)';(e.currentTarget as HTMLElement).style.background='var(--dax-danger-bg)';}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(224,80,80,.15)';(e.currentTarget as HTMLElement).style.background='transparent';}}>
                        <Trash2 size={12} color="#E07070"/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── VISTA GRID ── */}
          {!isLoading && products.length > 0 && viewMode === 'grid' && (
            <div style={{ flex:1, overflowY:'auto' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'12px' }}>
                {products.map(p => {
                  const stock = p.inventory?.[0]?.quantity ?? null;
                  const meta  = p.metadata ?? {};
                  const taxRate = meta.taxRate ?? 0;
                  const isLow = stock !== null && stock <= (meta.minStock??5) && stock > 0;
                  const isOut = stock === 0;
                  return (
                    <div key={p.id} style={{ background:'var(--dax-surface)', border:'1px solid var(--dax-border)', borderRadius:'12px', overflow:'hidden', opacity:p.active?1:.55, transition:'all .2s', cursor:'pointer' }}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.3)';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='var(--dax-shadow-md)';}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--dax-border)';(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none';}}>
                      <div style={{ height:'110px', background:'var(--dax-surface-2)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                        {p.imageUrl
                          ? <img src={getImageUrl(p.imageUrl)??p.imageUrl} alt={p.name} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'6px' }}/>
                          : <Package size={28} color="var(--dax-border)"/>
                        }
                        {taxRate>0 && <span style={{ position:'absolute', top:'6px', left:'6px', fontSize:'8px', fontWeight:700, color:'#fff', background:'rgba(90,170,240,0.85)', padding:'2px 5px', borderRadius:'4px' }}>IVA {taxRate}%</span>}
                        {isOut && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:'9px', fontWeight:700, color:'#fff', background:'rgba(224,80,80,0.9)', padding:'2px 7px', borderRadius:'5px' }}>AGOTADO</span></div>}
                        {isLow && !isOut && <span style={{ position:'absolute', top:'6px', right:'6px', fontSize:'8px', fontWeight:700, color:'#fff', background:'rgba(240,160,48,0.9)', padding:'2px 5px', borderRadius:'4px' }}>⚠ {stock}</span>}
                      </div>
                      <div style={{ padding:'10px 12px 12px' }}>
                        <p style={{ fontSize:'12px', fontWeight:700, color:'var(--dax-text-primary)', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{p.name}</p>
                        {p.category && <p style={{ fontSize:'10px', color:'#FF5C35', fontWeight:600, marginBottom:'6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{p.category}</p>}
                        <p style={{ fontSize:'16px', fontWeight:900, color:'var(--dax-coral)', letterSpacing:'-.02em', marginBottom:'8px' }}>{fmt(Number(p.price))}</p>
                        <div style={{ display:'flex', gap:'5px' }}>
                          <button onClick={()=>openEdit(p)} style={{ flex:1, padding:'6px', borderRadius:'7px', border:'1px solid var(--dax-border)', background:'transparent', color:'var(--dax-text-muted)', fontSize:'10px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', transition:'all .15s' }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.3)';(e.currentTarget as HTMLElement).style.color='#FF5C35';}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--dax-border)';(e.currentTarget as HTMLElement).style.color='var(--dax-text-muted)';}}>
                            <Pencil size={10}/> Editar
                          </button>
                          <button onClick={()=>setConfirmDelete(p)} style={{ width:'28px', height:'28px', borderRadius:'7px', border:'1px solid rgba(224,80,80,.15)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--dax-danger-bg)';}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';}}>
                            <Trash2 size={11} color="#E07070"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL FORM ── */}
      {showForm && (
        <ProductFormModal form={form} setForm={setForm} editId={editId}
          onSave={handleSave} onClose={()=>setShowForm(false)}
          saving={saveMutation.isPending} error={error}/>
      )}

      {/* ── CONFIRM DELETE ── */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', background:'var(--dax-overlay)', backdropFilter:'blur(8px)' }}>
          <div style={{ width:'100%', maxWidth:'360px', background:'var(--dax-surface)', border:'1px solid rgba(224,80,80,.25)', borderRadius:'16px', padding:'24px', animation:'modalOpen .2s ease' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'11px', background:'var(--dax-danger-bg)', border:'1px solid rgba(224,80,80,.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 0 16px' }}>
              <Trash2 size={20} color="#E07070"/>
            </div>
            <h3 style={{ fontSize:'16px', fontWeight:800, color:'var(--dax-text-primary)', marginBottom:'6px' }}>¿Eliminar producto?</h3>
            <p style={{ fontSize:'13px', color:'var(--dax-text-muted)', lineHeight:1.6, marginBottom:'20px' }}>
              <strong style={{ color:'var(--dax-text-primary)' }}>{confirmDelete.name}</strong> será eliminado permanentemente.
            </p>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={()=>setConfirmDelete(null)} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'1px solid var(--dax-border)', background:'transparent', color:'var(--dax-text-muted)', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancelar</button>
              <button onClick={()=>deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending}
                style={{ flex:1, padding:'11px', borderRadius:'10px', border:'none', background:'#E05050', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity:deleteMutation.isPending?.6:1 }}>
                {deleteMutation.isPending?'Eliminando...':'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes modalOpen { from{opacity:0;transform:scale(.97) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideInLeft { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }

        /* ── Responsive productos ── */
        @media(max-width:900px){
          /* Top bar */
          .prod-topbar     { flex-direction:column!important; align-items:stretch!important; gap:10px!important }
          .prod-search-wrap { width:100%!important }
          .prod-search-wrap input { width:100%!important }
          .prod-actions    { display:grid!important; grid-template-columns:1fr 1fr auto auto auto!important; gap:8px!important }

          /* Stats */
          .prod-stats      { grid-template-columns:repeat(2,1fr)!important }

          /* Layout — ocultar sidebar, mostrar como drawer */
          .prod-layout     { position:relative!important }
          .prod-sidebar    { position:fixed!important; top:0!important; left:0!important; bottom:0!important; zIndex:200!important; width:280px!important; background:var(--dax-surface)!important; border-right:1px solid var(--dax-border)!important; padding:16px!important; overflow-y:auto!important; animation:slideInLeft .25s cubic-bezier(.22,1,.36,1)!important; box-shadow:4px 0 24px rgba(0,0,0,.15)!important }
          .prod-sidebar-overlay { display:block!important }

          /* Lista — simplificar columnas */
          .prod-list-header { grid-template-columns:36px 1fr 80px 70px!important }
          .prod-list-row    { grid-template-columns:36px 1fr 80px 70px!important }
          .prod-list-col-cat  { display:none!important }
          .prod-list-col-status { display:none!important }
          .prod-list-col-price { font-size:12px!important }

          /* Modal */
          .prod-modal      { margin:8px!important; max-width:calc(100vw - 16px)!important; border-radius:16px!important; max-height:calc(100vh - 16px)!important }
          .prod-modal-body { max-height:calc(70vh)!important; padding:16px!important }
          .prod-tabs       { overflow-x:auto!important; scrollbar-width:none!important }
          .prod-img-grid   { grid-template-columns:1fr!important }
        }

        @media(max-width:480px){
          .prod-stats      { grid-template-columns:repeat(2,1fr)!important }
          .prod-list-header { grid-template-columns:36px 1fr 80px!important }
          .prod-list-row    { grid-template-columns:36px 1fr 80px!important }
          .prod-list-col-actions { flex-direction:column!important; gap:4px!important }
        }

        .prod-sidebar-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:199; backdrop-filter:blur(2px); }
      `}</style>
    </div>
  );
}
