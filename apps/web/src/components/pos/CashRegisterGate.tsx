'use client';
import { useState }        from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useRouter }       from 'next/navigation';
import { useCashRegister } from '@/hooks/useCashRegister';
import { OpenShiftModal }  from '@/components/pos/OpenShiftModal';
import { CloseShiftModal } from '@/components/pos/CloseShiftModal';

interface Props {
  branchId:       string | undefined;
  branchName:     string;
  accentColor:    string;
  formatCurrency: (n: number) => string;
  children:       React.ReactNode;
}

export function CashRegisterGate({
  branchId, branchName, accentColor: C, formatCurrency, children,
}: Props) {
  const [showClose, setShowClose] = useState(false);
  const router = useRouter();
  const { activeShift, isLoading, isOpen, openMutation, closeMutation } = useCashRegister(branchId);

  const totalExpenses  = activeShift?.totalExpenses ?? 0;
  const bd             = activeShift?.paymentBreakdown;
  const cashReal       = bd?.cashReal ?? bd?.cashTotal ?? 0;
  const currentBalance = activeShift
    ? Number(activeShift.openingAmount) + cashReal - totalExpenses
    : null;

  if (isLoading || !branchId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--dax-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--dax-text-muted)' }}>
          <Loader2 size={28} style={{ animation: 'spin 0.7s linear infinite', margin: '0 auto 12px', display: 'block', color: C }} />
          <p style={{ fontSize: '13px' }}>Verificando estado de caja...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
        onCancel={() => router.back()}
      />
    );
  }

  const openedAt = new Date(activeShift!.openedAt).toLocaleTimeString('es-CR', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '28px', background: `${C}12`, borderBottom: `1px solid ${C}25`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E', animation: 'pulse 2s infinite', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: 'var(--dax-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Caja abierta · {activeShift?.user.firstName} {activeShift?.user.lastName} · desde {openedAt}
        </span>
        <span style={{ fontSize: '11px', color: C, fontWeight: 700 }}>
          {formatCurrency(Number(activeShift?.openingAmount ?? 0))} apertura
        </span>
        {totalExpenses > 0 && (
          <span style={{ fontSize: '11px', color: '#E05050', fontWeight: 700 }}>
            -{formatCurrency(totalExpenses)} gastos
          </span>
        )}
        {currentBalance !== null && (
          <span style={{ fontSize: '11px', color: currentBalance >= 0 ? '#22C55E' : '#E05050', fontWeight: 800, background: currentBalance >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '1px 8px', borderRadius: '5px' }}>
            Saldo: {formatCurrency(currentBalance)}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
          {activeShift?.totalOrders ?? 0} ventas · {formatCurrency(Number(activeShift?.totalSales ?? 0))}
        </span>
        <button onClick={() => setShowClose(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '10px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          <LogOut size={10} /> Cerrar caja
        </button>
      </div>
      <div style={{ paddingTop: '28px', height: '100vh', boxSizing: 'border-box' }}>
        {children}
      </div>
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </>
  );
}
