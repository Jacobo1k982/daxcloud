'use client';

import { useState } from 'react';
import { X, DollarSign, Lock, AlertTriangle } from 'lucide-react';

interface Props {
  branchName:   string;
  accentColor:  string;
  formatCurrency: (n: number) => string;
  onOpen:       (amount: number, notes?: string) => Promise<void>;
  isLoading:    boolean;
}

const QUICK_AMOUNTS = [0, 5000, 10000, 20000, 50000];

export function OpenShiftModal({ branchName, accentColor: C, formatCurrency, onOpen, isLoading }: Props) {
  const [amount, setAmount]   = useState('');
  const [notes,  setNotes]    = useState('');
  const [error,  setError]    = useState('');

  const parsed = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;

  const handleSubmit = async () => {
    setError('');
    if (parsed < 0) { setError('El monto no puede ser negativo.'); return; }
    try {
      await onOpen(parsed, notes || undefined);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Error al abrir la caja');
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
        width: '100%', maxWidth: '420px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid var(--dax-border)',
          background: `linear-gradient(135deg, ${C}18 0%, transparent 60%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: `${C}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={20} color={C} />
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>
                Apertura de caja
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>
                {branchName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px' }}>

          {/* Aviso informativo */}
          <div style={{
            background: `${C}10`, border: `1px solid ${C}30`,
            borderRadius: '10px', padding: '10px 14px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            marginBottom: '20px',
          }}>
            <AlertTriangle size={15} color={C} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>
              Para registrar ventas es necesario abrir la caja con el monto de efectivo inicial disponible.
            </p>
          </div>

          {/* Monto de apertura */}
          <label style={{ display: 'block', marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
              Monto de apertura
            </p>

            {/* Montos rápidos */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  style={{
                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                    border:  `1.5px solid ${parsed === q ? C : 'var(--dax-border)'}`,
                    background: parsed === q ? `${C}15` : 'var(--dax-surface-2)',
                    color:      parsed === q ? C : 'var(--dax-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {q === 0 ? '₡0' : formatCurrency(q)}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ position: 'relative' }}>
              <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dax-text-muted)' }} />
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                autoFocus
                style={{
                  width: '100%', padding: '11px 12px 11px 34px',
                  borderRadius: '10px',
                  border: `1.5px solid ${error ? 'var(--dax-danger)' : 'var(--dax-border)'}`,
                  background: 'var(--dax-surface-2)',
                  color: 'var(--dax-text-primary)',
                  fontSize: '20px', fontWeight: 800,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Preview monto */}
            {parsed > 0 && (
              <p style={{ fontSize: '12px', color: C, fontWeight: 600, marginTop: '5px', textAlign: 'right' }}>
                {formatCurrency(parsed)} en caja
              </p>
            )}
          </label>

          {/* Nota opcional */}
          <label style={{ display: 'block', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
              Nota <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
            </p>
            <input
              type="text"
              placeholder="Ej: Turno mañana, efectivo contado..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
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
              borderRadius: '8px', padding: '9px 12px', marginBottom: '14px',
              display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <AlertTriangle size={13} color="var(--dax-danger)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: 'var(--dax-danger)', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Botón */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              width: '100%', padding: '13px',
              background: isLoading ? 'var(--dax-surface-2)' : C,
              color: isLoading ? 'var(--dax-text-muted)' : '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : `0 4px 16px ${C}40`,
              transition: 'all .15s',
            }}
          >
            {isLoading ? '⏳ Abriendo caja...' : '🔓 Abrir caja y comenzar a vender'}
          </button>
        </div>
      </div>
    </div>
  );
}
