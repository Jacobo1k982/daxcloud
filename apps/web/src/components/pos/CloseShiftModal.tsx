'use client';

import { useState, useMemo } from 'react';
import { X, TrendingUp, Clock, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import type { CashShift, PaymentBreakdown } from '@/hooks/useCashRegister';

interface Props {
  shift:          CashShift;
  accentColor:    string;
  formatCurrency: (n: number) => string;
  onClose:        (amount: number, notes?: string) => Promise<void>;
  onCancel:       () => void;
  isLoading:      boolean;
}

const METHOD_CFG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  cash:     { label: 'Efectivo', icon: '💵', color: '#22C55E', bg: 'rgba(34,197,94,0.1)'   },
  card:     { label: 'Tarjeta',  icon: '💳', color: 'var(--dax-blue)', bg: 'var(--dax-info-bg)'  },
  transfer: { label: 'SINPE',    icon: '📱', color: 'var(--dax-purple)', bg: 'var(--dax-purple-bg)' },
  mixed:    { label: 'Mixto',    icon: '🔀', color: 'var(--dax-amber)', bg: 'rgba(249,115,22,0.1)'  },
};

function fmtDuration(from: string): string {
  const ms = Date.now() - new Date(from).getTime();
  const h  = Math.floor(ms / 3_600_000);
  const m  = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '12px 14px' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '17px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{sub}</p>}
    </div>
  );
}

export function CloseShiftModal({
  shift, accentColor: C, formatCurrency,
  onClose, onCancel, isLoading,
}: Props) {
  const [amount, setAmount] = useState('');
  const [notes,  setNotes]  = useState('');
  const [error,  setError]  = useState('');

  const bd: PaymentBreakdown | undefined = shift.paymentBreakdown;

  const parsed     = useMemo(() => parseFloat(amount.replace(/[^0-9.]/g, '')) || 0, [amount]);
  const openingAmt = Number(shift.openingAmount);

  // ── Usa el breakdown para los totales reales en tiempo real ───────────────
  const totalSalesReal  = bd?.total  ?? Number(shift.totalSales);
  const totalOrdersReal = bd?.breakdown.reduce((a, r) => a + r.count, 0) ?? shift.totalOrders;

  const cashReal    = bd?.cashReal ?? bd?.cashTotal ?? 0;
  const expectedAmt = openingAmt + cashReal;

  const diff    = amount !== '' ? parsed - expectedAmt : null;
  const diffAbs = diff !== null ? Math.abs(diff) : 0;
  const isExact = diff !== null && diffAbs < 1;
  const isOver  = diff !== null && diff >  0.99;
  const isUnder = diff !== null && diff < -0.99;

  const elapsed  = fmtDuration(shift.openedAt);
  const openTime = new Date(shift.openedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });

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
      background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--dax-surface)', borderRadius: '20px',
        width: '100%', maxWidth: '520px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxHeight: '96vh',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--dax-border)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, transparent 70%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="#EF4444" />
            </div>
            <div>
              <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>Cierre de caja</p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>
                {shift.branch.name} · {shift.user.firstName} {shift.user.lastName}
              </p>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '6px', borderRadius: '8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scroll body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>

          {/* Duración */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px', padding: '8px 12px', background: `${C}10`, borderRadius: '10px', border: `1px solid ${C}20` }}>
            <Clock size={13} color={C} />
            <span style={{ fontSize: '12px', color: 'var(--dax-text-secondary)' }}>
              Turno activo hace <strong style={{ color: C }}>{elapsed}</strong> · abierto a las <strong style={{ color: C }}>{openTime}</strong>
            </span>
          </div>

          {/* Stats — usa totales reales del breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <StatCard
              label="Apertura"
              value={formatCurrency(openingAmt)}
              color="var(--dax-text-secondary)"
            />
            <StatCard
              label="Total ventas"
              value={formatCurrency(totalSalesReal)}
              color={C}
              sub={`${totalOrdersReal} transacc.`}
            />
            <StatCard
              label="Efectivo esp."
              value={formatCurrency(expectedAmt)}
              color="#22C55E"
              sub="Apertura + efectivo"
            />
          </div>

          {/* Desglose por método */}
          <div style={{
            background: 'var(--dax-surface-2)', borderRadius: '14px',
            padding: '16px', marginBottom: '16px',
            border: '1px solid var(--dax-border)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '14px' }}>
              Desglose por método de pago
            </p>

            {(!bd || bd.breakdown.length === 0) && (
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', padding: '8px 0' }}>
                Sin ventas registradas en este turno
              </p>
            )}

            {bd?.breakdown.map((row) => {
              const cfg = METHOD_CFG[row.method] ?? { label: row.label, icon: '💰', color: C, bg: `${C}10` };
              const pct = bd.total > 0 ? (row.amount / bd.total) * 100 : 0;
              return (
                <div key={row.method} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                        {cfg.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', lineHeight: 1 }}>{cfg.label}</p>
                        <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{row.count} venta{row.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: cfg.color }}>{formatCurrency(row.amount)}</p>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{pct.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div style={{ height: '3px', background: 'var(--dax-border)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: '99px', transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}

            {/* Sub-desglose mixtos */}
            {bd && bd.mixed > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed var(--dax-border)' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '8px' }}>
                  Distribución real de ventas mixtas
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {[
                    { key: 'cashTotal',     label: 'Efectivo', color: '#22C55E', icon: '💵' },
                    { key: 'cardTotal',     label: 'Tarjeta',  color: 'var(--dax-blue)', icon: '💳' },
                    { key: 'transferTotal', label: 'SINPE',    color: 'var(--dax-purple)', icon: '📱' },
                  ].filter(({ key }) => (bd as any)[key] > 0).map(({ key, label, color, icon }) => (
                    <div key={key} style={{ background: `${color}12`, borderRadius: '9px', padding: '8px 10px', border: `1px solid ${color}25`, textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', marginBottom: '2px' }}>{icon}</p>
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginBottom: '2px' }}>{label}</p>
                      <p style={{ fontSize: '12px', fontWeight: 800, color }}>{formatCurrency((bd as any)[key])}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total + efectivo esperado */}
            {bd && bd.breakdown.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--dax-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Total recaudado</p>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: C }}>{formatCurrency(bd.total)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(34,197,94,0.08)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#22C55E' }}>💵 Efectivo esperado en caja</p>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
                      Apertura {formatCurrency(openingAmt)} + cobrado en efectivo {formatCurrency(cashReal)}
                    </p>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#22C55E' }}>{formatCurrency(expectedAmt)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Input conteo físico */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
              Efectivo contado físicamente
            </p>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <DollarSign size={16} color="var(--dax-text-muted)" />
              </div>
              <input
                type="number" min="0" step="1000" placeholder="0"
                autoFocus
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', padding: '13px 14px 13px 38px',
                  borderRadius: '12px',
                  border: `2px solid ${
                    error   ? 'var(--dax-danger)' :
                    isExact ? '#22C55E' :
                    isOver  ? '#22C55E' :
                    isUnder ? 'var(--dax-danger)' :
                    'var(--dax-border)'
                  }`,
                  background: 'var(--dax-surface-2)', color: 'var(--dax-text-primary)',
                  fontSize: '22px', fontWeight: 800,
                  boxSizing: 'border-box', outline: 'none', transition: 'border-color .15s',
                }}
              />
            </div>

            {diff !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginTop: '8px', padding: '9px 12px', borderRadius: '10px',
                background: isExact || isOver ? 'rgba(34,197,94,0.1)' : 'var(--dax-danger-bg)',
                border: `1px solid ${isExact || isOver ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {isExact || isOver
                  ? <CheckCircle   size={14} color="#22C55E" />
                  : <AlertTriangle size={14} color="var(--dax-danger)" />
                }
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: isExact || isOver ? '#22C55E' : 'var(--dax-danger)', lineHeight: 1.2 }}>
                    {isExact
                      ? '✓ El efectivo cuadra perfectamente'
                      : isOver
                        ? `Sobrante de ${formatCurrency(diffAbs)}`
                        : `Faltante de ${formatCurrency(diffAbs)}`
                    }
                  </p>
                  {!isExact && (
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginTop: '1px' }}>
                      Esperado: {formatCurrency(expectedAmt)} · Contado: {formatCurrency(parsed)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nota */}
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
              Nota de cierre <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '10px' }}>(opcional)</span>
            </p>
            <input
              type="text" placeholder="Observaciones, incidencias del turno..."
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-primary)', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'var(--dax-danger-bg)', border: '1px solid var(--dax-danger)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertTriangle size={14} color="var(--dax-danger)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <button
              onClick={onCancel}
              style={{ padding: '13px', borderRadius: '12px', border: '1.5px solid var(--dax-border)', background: 'transparent', color: 'var(--dax-text-secondary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || amount === ''}
              style={{
                padding: '13px', borderRadius: '12px', border: 'none',
                background:  isLoading || amount === '' ? 'var(--dax-surface-2)' : '#EF4444',
                color:       isLoading || amount === '' ? 'var(--dax-text-muted)' : '#fff',
                fontSize: '14px', fontWeight: 800,
                cursor:   isLoading || amount === '' ? 'not-allowed' : 'pointer',
                boxShadow: isLoading || amount === '' ? 'none' : '0 4px 20px rgba(239,68,68,0.4)',
                transition: 'all .15s',
              }}
            >
              {isLoading ? '⏳ Cerrando turno...' : '🔒 Cerrar turno'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


