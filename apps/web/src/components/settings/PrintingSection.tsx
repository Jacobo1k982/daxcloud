'use client';

import { useState, useEffect } from 'react';
import { Printer, Eye, RotateCcw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePrintConfig } from '@/hooks/usePrintConfig';
import { useReceiptPrinter } from '@/hooks/useReceiptPrinter';
import type { ReceiptData } from '@/hooks/useReceiptPrinter';

interface Props {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    style={{
      width: '44px', height: '24px', borderRadius: '12px',
      border: 'none', cursor: 'pointer',
      background: value ? 'var(--dax-coral)' : 'var(--dax-surface-3)',
      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: '2px', left: value ? '22px' : '2px',
      width: '20px', height: '20px', borderRadius: '50%',
      background: '#fff', transition: 'left 0.2s ease', display: 'block',
    }} />
  </button>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    display: 'block', fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--dax-text-muted)', marginBottom: '8px',
  }}>
    {children}
  </label>
);

export function PrintingSection({ showToast }: Props) {
  const { tenant, user, formatCurrency } = useAuth();
  const { config, saveConfig, resetConfig } = usePrintConfig();
  const { print, preview }                  = useReceiptPrinter();

  const [printerStatus, setPrinterStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');
  const [detecting, setDetecting]         = useState(false);
  const [saved, setSaved]                 = useState(false);

  // Detecta si la API de impresión está disponible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // La Web Print API no permite detectar impresoras directamente por seguridad
      // pero podemos saber si el navegador soporta window.print
      setPrinterStatus(typeof window.print === 'function' ? 'available' : 'unavailable');
    }
  }, []);

  const handleDetect = async () => {
    setDetecting(true);
    setPrinterStatus('unknown');
    await new Promise(r => setTimeout(r, 1200));
    setPrinterStatus(typeof window.print === 'function' ? 'available' : 'unavailable');
    setDetecting(false);
  };

  const handleSave = () => {
    setSaved(true);
    showToast('Configuración de impresión guardada');
    setTimeout(() => setSaved(false), 2000);
  };

  // Datos de ejemplo para preview
  const sampleReceipt: ReceiptData = {
    businessName:  tenant?.name ?? 'Mi Negocio',
    branchName:    'Sucursal Principal',
    taxId:         tenant?.taxId ?? undefined,
    phone:         tenant?.phone ?? undefined,
    address:       tenant?.address ?? undefined,
    saleId:        'PREVIEW-ABCD1234',
    cashierName:   `${user?.firstName ?? 'Cajero'} ${user?.lastName ?? ''}`,
    createdAt:     new Date().toISOString(),
    items: [
      { name: 'Pan de queso (x6)', quantity: 2, unitPrice: 1500, subtotal: 3000 },
      { name: 'Café americano',    quantity: 1, unitPrice: 800,  subtotal: 800  },
      { name: 'Croissant',         quantity: 3, unitPrice: 600,  subtotal: 1800 },
    ],
    subtotal:      5600,
    discount:      0,
    tax:           0,
    total:         5600,
    paymentMethod: 'mixed',
    mixedPayments: { cash: 3000, card: 2600 },
    notes:         'Sin azúcar',
    header:        config.header,
    footer:        config.footer,
  };

  return (
    <div style={{ maxWidth: '560px' }}>

      {/* ── Estado de impresora ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: '12px', marginBottom: '24px',
        background: printerStatus === 'available'
          ? 'rgba(34,197,94,0.08)'
          : printerStatus === 'unavailable'
            ? 'var(--dax-danger-bg)'
            : 'var(--dax-surface-2)',
        border: `1px solid ${
          printerStatus === 'available'   ? 'rgba(34,197,94,0.25)' :
          printerStatus === 'unavailable' ? 'rgba(239,68,68,0.25)' :
          'var(--dax-border)'
        }`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: printerStatus === 'available' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Printer size={18} color={printerStatus === 'available' ? '#22C55E' : printerStatus === 'unavailable' ? 'var(--dax-danger)' : 'var(--dax-text-muted)'} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>
              {printerStatus === 'available'   ? 'Impresión disponible' :
               printerStatus === 'unavailable' ? 'Impresión no disponible' :
               'Verificando impresora...'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>
              {printerStatus === 'available'
                ? 'El sistema puede enviar recibos a tu impresora'
                : printerStatus === 'unavailable'
                  ? 'Este navegador no soporta impresión'
                  : 'Comprobando disponibilidad'
              }
            </p>
          </div>
        </div>
        <button
          onClick={handleDetect}
          disabled={detecting}
          style={{
            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            border: '1px solid var(--dax-border)', background: 'var(--dax-surface)',
            color: 'var(--dax-text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {detecting ? (
            <>
              <div style={{ width: '12px', height: '12px', border: '2px solid var(--dax-coral)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
              Detectando...
            </>
          ) : (
            <>
              <Wifi size={12} />
              Detectar
            </>
          )}
        </button>
      </div>

      {/* ── Nota sobre impresoras térmicas ── */}
      <div style={{
        padding: '12px 14px', borderRadius: '10px', marginBottom: '24px',
        background: 'rgba(90,170,240,0.08)', border: '1px solid rgba(90,170,240,0.2)',
        display: 'flex', gap: '10px', alignItems: 'flex-start',
      }}>
        <AlertCircle size={14} color="#5AAAF0" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#5AAAF0', marginBottom: '2px' }}>Impresoras térmicas 80mm</p>
          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', lineHeight: 1.5 }}>
            Configura tu impresora térmica como impresora predeterminada del sistema operativo. El recibo se enviará automáticamente al imprimir. Asegúrate de seleccionar papel de <strong>80mm</strong> en las preferencias de la impresora.
          </p>
        </div>
      </div>

      {/* ── Ancho de papel ── */}
      <div style={{ marginBottom: '20px' }}>
        <Label>Ancho de papel</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {(['58mm', '80mm'] as const).map(w => (
            <button
              key={w}
              onClick={() => saveConfig({ paperWidth: w })}
              style={{
                padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                border:      `1.5px solid ${config.paperWidth === w ? 'var(--dax-coral)' : 'var(--dax-border)'}`,
                background:  config.paperWidth === w ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                color:       config.paperWidth === w ? 'var(--dax-coral)' : 'var(--dax-text-secondary)',
                fontWeight:  config.paperWidth === w ? 700 : 400, fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {config.paperWidth === w && <CheckCircle size={13} />}
              Papel {w}
            </button>
          ))}
        </div>
      </div>

      {/* ── Encabezado ── */}
      <div style={{ marginBottom: '20px' }}>
        <Label>Encabezado del recibo</Label>
        <input
          className="dax-input"
          placeholder={`${tenant?.name ?? 'Mi Negocio'} — Gracias por visitarnos`}
          value={config.header}
          onChange={e => saveConfig({ header: e.target.value })}
          style={{ margin: 0 }}
        />
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
          Texto que aparece debajo del nombre del negocio
        </p>
      </div>

      {/* ── Pie de página ── */}
      <div style={{ marginBottom: '20px' }}>
        <Label>Pie de página</Label>
        <input
          className="dax-input"
          placeholder="Gracias por su compra. ¡Vuelva pronto!"
          value={config.footer}
          onChange={e => saveConfig({ footer: e.target.value })}
          style={{ margin: 0 }}
        />
      </div>

      {/* ── Copias ── */}
      <div style={{ marginBottom: '20px' }}>
        <Label>Copias por venta</Label>
        <select
          className="dax-input"
          value={config.copies}
          onChange={e => saveConfig({ copies: parseInt(e.target.value) })}
          style={{ margin: 0 }}
        >
          <option value={1}>1 copia</option>
          <option value={2}>2 copias</option>
          <option value={3}>3 copias</option>
        </select>
      </div>

      {/* ── Opciones de contenido ── */}
      <div style={{ marginBottom: '20px' }}>
        <Label>Mostrar en el recibo</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { key: 'showTaxId',   label: 'Cédula / RUC del negocio', desc: 'Número de identificación tributaria' },
            { key: 'showPhone',   label: 'Teléfono',                  desc: 'Número de contacto del negocio'     },
            { key: 'showAddress', label: 'Dirección',                 desc: 'Dirección de la sucursal'           },
          ].map(item => (
            <div key={item.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: 'var(--dax-surface-2)',
              borderRadius: '10px', gap: '16px',
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{item.label}</p>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.desc}</p>
              </div>
              <Toggle
                value={(config as any)[item.key] as boolean}
                onChange={() => saveConfig({ [item.key]: !(config as any)[item.key] })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Impresión automática ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderRadius: '12px', marginBottom: '24px',
        background: config.autoPrint ? 'rgba(255,92,53,0.06)' : 'var(--dax-surface-2)',
        border: `1.5px solid ${config.autoPrint ? 'rgba(255,92,53,0.3)' : 'var(--dax-border)'}`,
        gap: '16px',
      }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
            🖨️ Imprimir automáticamente
          </p>
          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
            {config.autoPrint
              ? 'Se imprimirá un recibo al completar cada venta'
              : 'Impresión manual — usa el botón en el POS'
            }
          </p>
        </div>
        <Toggle
          value={config.autoPrint}
          onChange={() => saveConfig({ autoPrint: !config.autoPrint })}
        />
      </div>

      {/* ── Botones de acción ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => preview(sampleReceipt, config)}
          style={{
            flex: 1, minWidth: '120px', padding: '11px 16px',
            borderRadius: '10px', border: '1.5px solid var(--dax-border)',
            background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Eye size={14} /> Vista previa
        </button>

        <button
          onClick={() => print(sampleReceipt, config)}
          style={{
            flex: 1, minWidth: '120px', padding: '11px 16px',
            borderRadius: '10px', border: '1.5px solid rgba(90,170,240,0.4)',
            background: 'rgba(90,170,240,0.08)', color: '#5AAAF0',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Printer size={14} /> Imprimir prueba
        </button>

        <button
          onClick={() => { resetConfig(); showToast('Configuración restablecida'); }}
          style={{
            padding: '11px 14px', borderRadius: '10px',
            border: '1px solid var(--dax-border)', background: 'transparent',
            color: 'var(--dax-text-muted)', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {config.autoPrint && (
        <div style={{
          marginTop: '16px', padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <CheckCircle size={14} color="#22C55E" />
          <p style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>
            Impresión automática activada — cada venta generará un recibo
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
