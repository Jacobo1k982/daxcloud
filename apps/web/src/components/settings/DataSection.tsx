'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  Download, Package, TrendingUp, Warehouse,
  Database, Calendar, Loader2, CheckCircle,
  AlertTriangle, FileSpreadsheet,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface ExportItem {
  label:    string;
  desc:     string;
  endpoint: string;
  filename: string;
  icon:     any;
  color:    string;
  hasDateRange?: boolean;
}

const EXPORTS: ExportItem[] = [
  {
    label:    'Exportar productos',
    desc:     'Catálogo completo con precios, SKU y categorías',
    endpoint: '/exports/products',
    filename: 'productos',
    icon:     Package,
    color:    '#5AAAF0',
  },
  {
    label:        'Exportar ventas',
    desc:         'Historial de transacciones con detalle por ítem',
    endpoint:     '/exports/sales',
    filename:     'ventas',
    icon:         TrendingUp,
    color:        '#3DBF7F',
    hasDateRange: true,
  },
  {
    label:    'Exportar inventario',
    desc:     'Stock actual por sucursal con ubicaciones',
    endpoint: '/exports/inventory',
    filename: 'inventario',
    icon:     Warehouse,
    color:    '#A78BFA',
  },
  {
    label:    'Backup completo',
    desc:     'Todos los datos del negocio en un solo archivo',
    endpoint: '/exports/backup',
    filename: 'backup-daxcloud',
    icon:     Database,
    color:    '#FF5C35',
  },
];

export function DataSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { token } = useAuthStore();

  const [loading,    setLoading]    = useState<string | null>(null);
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');

  const handleExport = async (item: ExportItem) => {
    setLoading(item.endpoint);
    try {
      let url = `${API_URL}${item.endpoint}`;
      if (item.hasDateRange && startDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate)   params.append('endDate',   endDate);
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Export error:', res.status, text);
        showToast(`Error al exportar: ${res.status}`, 'error');
        return;
      }

      const blob     = await res.blob();
      const blobUrl  = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = blobUrl;
      a.download     = `${item.filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      showToast(`${item.label} descargado correctamente`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Intro */}
      <div style={{ padding: '14px 16px', background: 'var(--dax-surface-2)', borderRadius: '10px', border: '1px solid var(--dax-border)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <FileSpreadsheet size={18} color="#3DBF7F" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '3px' }}>Exportaciones en formato Excel</p>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.5 }}>
            Descarga tus datos en archivos .xlsx compatibles con Excel, Google Sheets y LibreOffice.
          </p>
        </div>
      </div>

      {/* Filtro de fechas para ventas */}
      <div style={{ padding: '14px 16px', background: 'var(--dax-surface-2)', borderRadius: '10px', border: '1px solid var(--dax-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
          <Calendar size={13} color="var(--dax-text-muted)" />
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
            Rango de fechas para ventas
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>Desde</p>
            <input
              type="date"
              className="dax-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ margin: 0, fontSize: '12px' }}
            />
          </div>
          <div>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>Hasta</p>
            <input
              type="date"
              className="dax-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ margin: 0, fontSize: '12px' }}
            />
          </div>
        </div>
        <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '6px' }}>
          Sin fechas se exportan todas las ventas disponibles
        </p>
      </div>

      {/* Lista de exportaciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {EXPORTS.map(item => {
          const Icon      = item.icon;
          const isLoading = loading === item.endpoint;

          return (
            <div
              key={item.endpoint}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--dax-surface-2)', borderRadius: '10px', border: '1px solid var(--dax-border)', gap: '12px', flexWrap: 'wrap', transition: 'border-color .15s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={item.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleExport(item)}
                disabled={!!loading}
                className="dax-btn-secondary"
                style={{ fontSize: '12px', padding: '8px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', borderColor: isLoading ? item.color : undefined, color: isLoading ? item.color : undefined }}
              >
                {isLoading
                  ? <><Loader2 size={12} style={{ animation: 'spin .7s linear infinite' }} /> Exportando...</>
                  : <><Download size={12} /> Descargar</>
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* Nota */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', background: 'rgba(240,160,48,.06)', border: '1px solid rgba(240,160,48,.2)', borderRadius: '10px' }}>
        <AlertTriangle size={13} color="#F0A030" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', lineHeight: 1.5 }}>
          Los archivos exportados contienen información sensible de tu negocio. Manéjalos con cuidado y no los compartas con personas no autorizadas.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
