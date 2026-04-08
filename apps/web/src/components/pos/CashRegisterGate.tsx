'use client';

import { useState }            from 'react';
import { Lock, LogOut }        from 'lucide-react';
import { useCashRegister }     from '@/hooks/useCashRegister';
import { OpenShiftModal }      from '@/components/pos/OpenShiftModal';
import { CloseShiftModal }     from '@/components/pos/CloseShiftModal';

interface Props {
  branchId:       string | undefined;
  branchName:     string;
  accentColor:    string;
  formatCurrency: (n: number) => string;
  children:       React.ReactNode;
}

/**
 * CashRegisterGate
 *
 * Envuelve el POS completo. Si no hay turno de caja abierto,
 * muestra el modal de apertura en lugar del POS.
 * Si hay turno abierto, renderiza los hijos y expone el botón
 * de cierre de caja en el topbar mediante un portal/slot.
 */
export function CashRegisterGate({
  branchId,
  branchName,
  accentColor: C,
  formatCurrency,
  children,
}: Props) {
  const [showClose, setShowClose] = useState(false);

  const { activeShift, isLoading, isOpen, openMutation, closeMutation } =
    useCashRegister(branchId);

  // ── Cargando estado inicial ────────────────────────────────────────────────
  if (isLoading || !branchId) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--dax-bg)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--dax-text-muted)' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: `3px solid ${C}`, borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: '13px' }}>Verificando estado de caja...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Sin caja abierta → muestra modal de apertura bloqueante ───────────────
  if (!isOpen) {
    return (
      <OpenShiftModal
        branchName={branchName}
        accentColor={C}
        formatCurrency={formatCurrency}
        isLoading={openMutation.isPending}
        onOpen={async (amount, notes) => {
          await openMutation.mutateAsync({ openingAmount: amount, notes });
        }}
      />
    );
  }

  // ── Caja abierta → POS normal + barra de estado de caja ───────────────────
  return (
    <>
      {/* Barra de estado de caja — aparece encima del POS */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '28px',
        background: `${C}15`,
        borderBottom: `1px solid ${C}30`,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: '8px',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#22C55E',
          boxShadow: '0 0 6px #22C55E',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)', fontWeight: 600 }}>
          Caja abierta · {activeShift?.user.firstName} {activeShift?.user.lastName} · desde {new Date(activeShift!.openedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ fontSize: '11px', color: C, fontWeight: 700, marginLeft: '4px' }}>
          {formatCurrency(Number(activeShift?.openingAmount ?? 0))} apertura
        </span>

        <button
          onClick={() => setShowClose(true)}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 10px', borderRadius: '6px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#EF4444', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          <LogOut size={10} /> Cerrar caja
        </button>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }
        `}</style>
      </div>

      {/* POS desplazado para dar espacio a la barra */}
      <div style={{ paddingTop: '28px', height: '100vh', boxSizing: 'border-box' }}>
        {children}
      </div>

      {/* Modal de cierre */}
      {showClose && activeShift && (
        <CloseShiftModal
          shift={activeShift}
          accentColor={C}
          formatCurrency={formatCurrency}
          isLoading={closeMutation.isPending}
          onCancel={() => setShowClose(false)}
          onClose={async (amount, notes) => {
            await closeMutation.mutateAsync({ closingAmount: amount, notes });
            setShowClose(false);
          }}
        />
      )}
    </>
  );
}
