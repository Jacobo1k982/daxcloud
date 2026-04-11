'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Printer, Eye, RotateCcw, CheckCircle,
  AlertCircle, Wifi, Loader2, Save,
  FileText, Settings2, Zap,
} from 'lucide-react';
import { useAuth }           from '@/hooks/useAuth';
import { usePrintConfig }    from '@/hooks/usePrintConfig';
import { useReceiptPrinter, buildReceiptHTML } from '@/hooks/useReceiptPrinter';
import type { ReceiptData }  from '@/hooks/useReceiptPrinter';

interface Props {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: value ? 'var(--dax-coral)' : 'var(--dax-surface-3)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
    <span style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left .2s', display: 'block' }} />
  </button>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '18px', marginTop: '4px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
    <Icon size={13} color="var(--dax-coral)" />
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--dax-coral)' }}>{children}</p>
  </div>
);

export function PrintingSection({ showToast }: Props) {
  const { tenant, user } = useAuth();
  const { config, saveConfig, resetConfig } = usePrintConfig();
  const { print, preview }                  = useReceiptPrinter();

  const [tab,          setTab]          = useState<'config' | 'preview'>('config');
  const [printerReady, setPrinterReady] = useState(false);
  const [detecting,    setDetecting]    = useState(false);
  const [saved,        setSaved]        = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPrinterReady(typeof window.print === 'function');
    }
  }, []);

  const handleDetect = async () => {
    setDetecting(true);
    setPrinterReady(false);
    await new Promise(r => setTimeout(r, 1200));
    setPrinterReady(typeof window.print === 'function');
    setDetecting(false);
  };

  const handleSave = () => {
    setSaved(true);
    showToast('Configuración de impresión guardada');
    setTimeout(() => setSaved(false), 2000);
  };

  // Recibo de muestra para el preview
  const sampleReceipt: ReceiptData = useMemo(() => ({
    businessName:  tenant?.name ?? 'Mi Negocio',
    branchName:    'Sucursal Principal',
    taxId:         (tenant as any)?.taxId   ?? undefined,
    phone:         (tenant as any)?.phone   ?? undefined,
    address:       (tenant as any)?.address ?? undefined,
    saleId:        'PREVIEW-ABCD1234',
    cashierName:   `${user?.firstName ?? 'Cajero'} ${user?.lastName ?? ''}`.trim(),
    createdAt:     new Date().toISOString(),
    items: [
      { name: 'Café americano',    quantity: 2, unitPrice: 1500, subtotal: 3000 },
      { name: 'Pan de queso',      quantity: 3, unitPrice: 600,  subtotal: 1800 },
      { name: 'Croissant integral', quantity: 1, unitPrice: 800,  subtotal: 800  },
    ],
    subtotal:      5600,
    discount:      200,
    tax:           0,
    total:         5400,
    paymentMethod: 'mixed',
    mixedPayments: { cash: 3000, card: 2400 },
    notes:         'Sin azúcar en el café',
    header:        config.header,
    footer:        config.footer,
  }), [tenant, user, config.header, config.footer]);

  // HTML del recibo para el preview en vivo
  const previewHTML = useMemo(() => buildReceiptHTML(sampleReceipt, config), [sampleReceipt, config]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Estado de impresora ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: '12px', marginBottom: '20px',
        background:  printerReady ? 'rgba(34,197,94,.07)' : 'var(--dax-surface-2)',
        border:      `1px solid ${printerReady ? 'rgba(34,197,94,.25)' : 'var(--dax-border)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: printerReady ? 'rgba(34,197,94,.15)' : 'var(--dax-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Printer size={17} color={printerReady ? '#22C55E' : 'var(--dax-text-muted)'} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>
              {printerReady ? 'Impresión disponible' : 'Verificando impresora...'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>
              {printerReady ? 'El sistema puede enviar recibos a tu impresora' : 'Haz clic en Detectar para verificar'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDetect}
          disabled={detecting}
          style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--dax-border)', background: 'var(--dax-surface)', color: 'var(--dax-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {detecting
            ? <><div style={{ width: '12px', height: '12px', border: '2px solid var(--dax-coral)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} /> Detectando...</>
            : <><Wifi size={12} /> Detectar</>
          }
        </button>
      </div>

      {/* ── Nota impresoras térmicas ── */}
      <div style={{ padding: '11px 14px', borderRadius: '10px', marginBottom: '20px', background: 'rgba(90,170,240,.07)', border: '1px solid rgba(90,170,240,.2)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <AlertCircle size={14} color="#5AAAF0" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '11px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>
          Configura tu <strong>impresora térmica 80mm</strong> como impresora predeterminada del SO. El recibo se enviará automáticamente al imprimir. Selecciona papel de <strong>80mm</strong> en las preferencias de tu impresora.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--dax-surface-2)', padding: '4px', borderRadius: '12px' }}>
        {[
          { key: 'config',  label: 'Configuración', icon: Settings2 },
          { key: 'preview', label: 'Vista previa',  icon: Eye       },
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ flex: 1, padding: '9px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer', background: active ? 'var(--dax-surface)' : 'transparent', color: active ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)', fontSize: '13px', fontWeight: active ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all .15s', boxShadow: active ? '0 1px 4px rgba(0,0,0,.1)' : 'none' }}>
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Configuración ── */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          <SectionTitle icon={FileText}>Papel y formato</SectionTitle>

          {/* Ancho de papel */}
          <div style={{ marginBottom: '16px' }}>
            <Label>Ancho de papel</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['58mm', '80mm'] as const).map(w => (
                <button key={w} onClick={() => saveConfig({ paperWidth: w })} style={{ padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', border: `1.5px solid ${config.paperWidth === w ? 'var(--dax-coral)' : 'var(--dax-border)'}`, background: config.paperWidth === w ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)', color: config.paperWidth === w ? 'var(--dax-coral)' : 'var(--dax-text-secondary)', fontWeight: config.paperWidth === w ? 700 : 400, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all .15s' }}>
                  {config.paperWidth === w && <CheckCircle size={13} />}
                  Papel {w}
                </button>
              ))}
            </div>
          </div>

          {/* Copias */}
          <div style={{ marginBottom: '16px' }}>
            <Label>Copias por venta</Label>
            <select className="dax-input" value={config.copies} onChange={e => saveConfig({ copies: parseInt(e.target.value) })} style={{ margin: 0 }}>
              <option value={1}>1 copia</option>
              <option value={2}>2 copias</option>
              <option value={3}>3 copias</option>
            </select>
          </div>

          <SectionTitle icon={FileText}>Contenido del recibo</SectionTitle>

          {/* Encabezado */}
          <div style={{ marginBottom: '14px' }}>
            <Label>Texto de encabezado</Label>
            <input className="dax-input" placeholder={`${tenant?.name ?? 'Mi Negocio'} — ¡Gracias por visitarnos!`} value={config.header} onChange={e => saveConfig({ header: e.target.value })} style={{ margin: 0 }} />
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>Aparece debajo del nombre del negocio</p>
          </div>

          {/* Pie */}
          <div style={{ marginBottom: '14px' }}>
            <Label>Pie de página</Label>
            <input className="dax-input" placeholder="Gracias por su compra. ¡Vuelva pronto!" value={config.footer} onChange={e => saveConfig({ footer: e.target.value })} style={{ margin: 0 }} />
          </div>

          {/* Mostrar en recibo */}
          <div style={{ marginBottom: '16px' }}>
            <Label>Mostrar en el recibo</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'showTaxId',   label: 'Cédula / RUC',  desc: 'Número de identificación tributaria del negocio' },
                { key: 'showPhone',   label: 'Teléfono',       desc: 'Número de contacto del negocio'                 },
                { key: 'showAddress', label: 'Dirección',      desc: 'Dirección de la sucursal'                       },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--dax-surface-2)', borderRadius: '10px', gap: '16px', border: `1px solid ${(config as any)[item.key] ? 'var(--dax-coral-border)' : 'transparent'}`, transition: 'border-color .15s' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{item.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.desc}</p>
                  </div>
                  <Toggle value={(config as any)[item.key]} onChange={() => saveConfig({ [item.key]: !(config as any)[item.key] })} />
                </div>
              ))}
            </div>
          </div>

          <SectionTitle icon={Zap}>Impresión automática</SectionTitle>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', marginBottom: '20px', background: config.autoPrint ? 'rgba(255,92,53,.06)' : 'var(--dax-surface-2)', border: `1.5px solid ${config.autoPrint ? 'rgba(255,92,53,.3)' : 'var(--dax-border)'}`, gap: '16px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
                🖨️ Imprimir al completar venta
              </p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                {config.autoPrint ? 'Se imprime un recibo automáticamente en cada venta' : 'Impresión manual desde el POS'}
              </p>
            </div>
            <Toggle value={config.autoPrint} onChange={() => saveConfig({ autoPrint: !config.autoPrint })} />
          </div>

          {config.autoPrint && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color="#22C55E" />
              <p style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>
                Impresión automática activada — cada venta generará un recibo
              </p>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTab('preview')}
              style={{ flex: 1, minWidth: '120px', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Eye size={14} /> Ver preview
            </button>
            <button
              onClick={() => print(sampleReceipt, config)}
              style={{ flex: 1, minWidth: '120px', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid rgba(90,170,240,.4)', background: 'rgba(90,170,240,.08)', color: '#5AAAF0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Printer size={14} /> Imprimir prueba
            </button>
            <button
              onClick={() => { resetConfig(); showToast('Configuración restablecida'); }}
              style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-muted)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Restablecer"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Vista previa ── */}
      {tab === 'preview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
                Vista previa en tiempo real
              </p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                Se actualiza automáticamente al cambiar la configuración
              </p>
            </div>
            <button
              onClick={() => print(sampleReceipt, config)}
              style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--dax-coral)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 12px rgba(255,92,53,.3)' }}
            >
              <Printer size={13} /> Imprimir prueba
            </button>
          </div>

          {/* Preview del recibo */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 24px rgba(0,0,0,.3)',
              width: config.paperWidth === '80mm' ? '302px' : '220px',
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,.1)',
            }}>
              {/* Simulación corte de papel arriba */}
              <div style={{ height: '6px', background: 'repeating-linear-gradient(90deg, #ddd 0px, #ddd 4px, transparent 4px, transparent 8px)', marginBottom: '4px', borderRadius: '2px' }} />
              <iframe
                srcDoc={previewHTML}
                title="Preview recibo"
                style={{ width: '100%', border: 'none', minHeight: '500px', display: 'block', background: '#fff' }}
                sandbox="allow-same-origin"
              />
              {/* Simulación corte de papel abajo */}
              <div style={{ height: '6px', background: 'repeating-linear-gradient(90deg, #ddd 0px, #ddd 4px, transparent 4px, transparent 8px)', marginTop: '4px', borderRadius: '2px' }} />
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', textAlign: 'center', marginTop: '12px' }}>
            Escala visual — el recibo real se imprime en papel {config.paperWidth}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
