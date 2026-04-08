'use client';

import { useState } from 'react';
import { X, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CashShift } from './useCashRegister';

interface Props {
  shift:          CashShift;
  accentColor:    string;
  formatCurrency: (n: number) => string;
  onClose:        (amount: number, notes?: string) => Promise<void>;
  onCancel:       () => void;
  isLoading:      boolean;
}

export function CloseShiftModal({ shift, accentColor: C, formatCurrency, onClose, onCancel, isLoading }: Props) {
  const [amount, setAmount] = useState('');
  const [notes,  setNotes]  = useState('');
  const [error,  setError]  = useState('');

  const parsed       = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const openingAmt   = Number(shift.openingAmount);
  const totalSales   = Number(shift.totalSales);
  const expectedCash = openingAmt + totalSales; // simplificado — diferencia se calcula en backend
  const diff         = parsed - expectedCash;
  const hasDiff      = amount !== '' && Math.abs(diff) > 0;

  const elapsed = (() => {
    const ms   = Date.now() - new Date(shift.openedAt).getTime();
    const h    = Math.floor(ms / 3_600_000);
    const m    = Math.floor((ms % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  const handleSubmit = async () => {
    setError('');
    if (parsed < 0) { setError('El monto no puede ser negativo.'); return; }
    try {
      await onClose(parsed, notes || undefined);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al cerrar la caja');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--dax-surface)', borderRadius: '18px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid var(--dax-border)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, transparent 60%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={20} color="#EF4444" />
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>
                Cierre de caja
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>
                {shift.branch.name} · {shift.user.firstName} {shift.user.lastName}
              </p>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Resumen del turno */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px', marginBottom: '20px',
          }}>
            {[
              { label: 'Apertura',  value: formatCurrency(openingAmt),     color: 'var(--dax-text-secondary)' },
              { label: 'Ventas',    value: formatCurrency(totalSales),      color: C },
              { label: 'Órdenes',   value: String(shift.totalOrders),       color: C },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--dax-surface-2)', borderRadius: '10px',
                padding: '10px 12px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '15px', fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Duración */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <Clock size={12} color="var(--dax-text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
              Turno activo por <strong style={{ color: 'var(--dax-text-secondary)' }}>{elapsed}</strong> · abierto {new Date(shift.openedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Monto de cierre */}
          <label style={{ display: 'block', marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
              Efectivo contado en caja
            </p>
            <input
              type="number" min="0" step="1000" placeholder="0" autoFocus
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
              style={{
                width: '100%', padding: '11px 12px',
                borderRadius: '10px',
                border: `1.5px solid ${error ? 'var(--dax-danger)' : hasDiff ? (diff < 0 ? 'var(--dax-danger)' : '#22C55E') : 'var(--dax-border)'}`,
                background: 'var(--dax-surface-2)',
                color: 'var(--dax-text-primary)',
                fontSize: '20px', fontWeight: 800, boxSizing: 'border-box', outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />

            {/* Diferencia en tiempo real */}
            {hasDiff && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                padding: '6px 10px', borderRadius: '8px',
                background: diff < 0 ? 'var(--dax-danger-bg)' : 'rgba(34,197,94,0.08)',
              }}>
                {diff < 0
                  ? <AlertTriangle size={12} color="var(--dax-danger)" />
                  : <CheckCircle   size={12} color="#22C55E" />
                }
                <p style={{ fontSize: '12px', fontWeight: 700, color: diff < 0 ? 'var(--dax-danger)' : '#22C55E' }}>
                  {diff < 0 ? `Faltante: ${formatCurrency(Math.abs(diff))}` : `Sobrante: ${formatCurrency(diff)}`}
                </p>
              </div>
            )}
          </label>

          {/* Nota */}
          <label style={{ display: 'block', marginBottom: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
              Nota de cierre <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
            </p>
            <input
              type="text" placeholder="Observaciones del turno..."
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '10px',
                border: '1.5px solid var(--dax-border)',
                background: 'var(--dax-surface-2)',
                color: 'var(--dax-text-primary)',
                fontSize: '13px', boxSizing: 'border-box',
              }}
            />
          </label>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--dax-danger-bg)', border: '1px solid var(--dax-danger)',
              borderRadius: '8px', padding: '9px 12px', marginBottom: '12px',
              display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <AlertTriangle size={13} color="var(--dax-danger)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '12px', borderRadius: '12px',
                border: '1.5px solid var(--dax-border)',
                background: 'transparent',
                color: 'var(--dax-text-secondary)',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || amount === ''}
              style={{
                padding: '12px', borderRadius: '12px', border: 'none',
                background: isLoading || amount === '' ? 'var(--dax-surface-2)' : '#EF4444',
                color: isLoading || amount === '' ? 'var(--dax-text-muted)' : '#fff',
                fontSize: '13px', fontWeight: 800,
                cursor: isLoading || amount === '' ? 'not-allowed' : 'pointer',
                boxShadow: isLoading || amount === '' ? 'none' : '0 4px 16px rgba(239,68,68,0.35)',
                transition: 'all .15s',
              }}
            >
              {isLoading ? '⏳ Cerrando...' : '🔒 Cerrar turno'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
