'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  X, DollarSign, FileText, Tag, Truck, Lock,
  Plus, Trash2, AlertCircle, CheckCircle, Loader2,
  ChevronDown, Wallet,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'compra_proveedor', label: 'Compra a proveedor', color: '#FF5C35' },
  { value: 'servicios', label: 'Servicios', color: '#5AAAF0' },
  { value: 'transporte', label: 'Transporte', color: '#F0A030' },
  { value: 'limpieza', label: 'Limpieza y aseo', color: '#3DBF7F' },
  { value: 'papeleria', label: 'Papeleria', color: '#A78BFA' },
  { value: 'alimentacion', label: 'Alimentacion', color: '#F97316' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: '#EAB308' },
  { value: 'varios', label: 'Varios', color: '#6B7280' },
];

interface Props {
  branchId: string;
  accentColor: string;
  formatCurrency: (n: number) => string;
  onClose: () => void;
}

export function CashExpenseModal({ branchId, accentColor: C, formatCurrency, onClose }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'new' | 'list'>('new');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('compra_proveedor');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');
  const [usePin, setUsePin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: shiftData, isLoading } = useQuery({
    queryKey: ['cash-expenses', branchId],
    queryFn: async () => {
      const r = await api.get(`/cash-expenses?branchId=${branchId}`);
      console.log('expenses response:', r.data);
      return r.data;
    },
    refetchInterval: 15000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/cash-expenses', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-expenses', branchId] });
      qc.invalidateQueries({ queryKey: ['cash-register-active', branchId] });
      setSuccess('Gasto registrado correctamente');
      setAmount(''); setConcept(''); setSupplier(''); setNotes(''); setPin('');
      setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Error al registrar gasto'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cash-expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-expenses', branchId] }),
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se puede eliminar'),
  });

  const handleSubmit = () => {
    setError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Ingresa un monto vÃ¡lido');
    if (!concept.trim()) return setError('El concepto es requerido');
    if (usePin && !pin.trim()) return setError('Ingresa el PIN del gerente');

    createMutation.mutate({
      branchId,
      amount: amt,
      concept: concept.trim(),
      category,
      supplier: supplier.trim() || undefined,
      notes: notes.trim() || undefined,
      managerPin: usePin ? pin : undefined,
    });
  };

  const catInfo = CATEGORIES.find(c => c.value === category);
  const expenses = shiftData?.expenses ?? [];
  const totalExp = shiftData?.totalExpenses ?? 0;
  const balance = shiftData?.currentBalance ?? 0;
  const opening = shiftData?.openingAmount ?? 0;
  const cashIn = shiftData?.cashIn ?? 0;

  const S = {
    label: { fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '6px', display: 'block' },
    input: { width: '100%', padding: '10px 13px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '9px', color: 'var(--dax-text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color .2s' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--dax-surface)', border: '1px solid var(--dax-border)', borderRadius: '18px', overflow: 'hidden', boxShadow: 'var(--dax-shadow-lg)', animation: 'modalOpen .25s cubic-bezier(.22,1,.36,1)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--dax-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(240,160,48,0.12)', border: '1px solid rgba(240,160,48,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={17} color="#F0A030" />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dax-text-primary)', margin: 0 }}>Gastos de caja</h2>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', margin: 0 }}>Control de salidas de efectivo</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={13} color="var(--dax-text-muted)" />
          </button>
        </div>

        {/* Saldo en tiempo real */}
        {!isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--dax-border)' }}>
            {[
              { label: 'Apertura', value: formatCurrency(opening), color: 'var(--dax-text-primary)' },
              { label: 'Gastos', value: `-${formatCurrency(totalExp)}`, color: '#E05050' },
              { label: 'Saldo caja', value: formatCurrency(balance), color: balance >= 0 ? '#3DBF7F' : '#E05050' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--dax-surface-2)', textAlign: 'center' as const }}>
                <p style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '3px' }}>{label}</p>
                <p style={{ fontSize: '15px', fontWeight: 900, color, letterSpacing: '-.02em' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', padding: '10px 20px 0', borderBottom: '1px solid var(--dax-border)' }}>
          {([['new', '+ Nuevo gasto'], ['list', `ðŸ“‹ Historial (${expenses.length})`]] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 14px', borderRadius: '8px 8px 0 0', border: 'none', borderBottom: tab === t ? '2px solid #F0A030' : '2px solid transparent', background: tab === t ? 'rgba(240,160,48,0.08)' : 'transparent', color: tab === t ? '#F0A030' : 'var(--dax-text-muted)', fontSize: '12px', fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px', transition: 'all .15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>

          {/* â”€â”€ NUEVO GASTO â”€â”€ */}
          {tab === 'new' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Monto */}
              <div>
                <label style={S.label}>Monto *</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="number" min="0" step="100" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0" style={{ ...S.input, paddingLeft: '32px', fontSize: '18px', fontWeight: 800 }}
                    onFocus={e => { e.target.style.borderColor = '#F0A030'; e.target.style.boxShadow = '0 0 0 3px rgba(240,160,48,.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--dax-border)'; e.target.style.boxShadow = 'none'; }}
                    autoFocus />
                </div>
                {/* Montos rÃ¡pidos */}
                <div style={{ display: 'flex', gap: '5px', marginTop: '7px', flexWrap: 'wrap' }}>
                  {[1000, 2000, 5000, 10000, 20000, 50000].map(q => (
                    <button key={q} type="button" onClick={() => setAmount(String(q))}
                      style={{ padding: '4px 10px', borderRadius: '7px', border: `1px solid ${parseFloat(amount) === q ? 'rgba(240,160,48,0.5)' : 'var(--dax-border)'}`, background: parseFloat(amount) === q ? 'rgba(240,160,48,0.1)' : 'var(--dax-surface-2)', color: parseFloat(amount) === q ? '#F0A030' : 'var(--dax-text-muted)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                      {formatCurrency(q)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label style={S.label}>Concepto *</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" value={concept} onChange={e => setConcept(e.target.value)} placeholder="Ej: Compra de verduras al proveedor..."
                    style={{ ...S.input, paddingLeft: '32px' }}
                    onFocus={e => { e.target.style.borderColor = '#F0A030'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--dax-border)'; }} />
                </div>
              </div>

              {/* CategorÃ­a */}
              <div>
                <label style={S.label}>CategorÃ­a</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    style={{ ...S.input, paddingLeft: '32px', paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: 'var(--dax-surface)' }}>{c.label}</option>)}
                  </select>
                  <ChevronDown size={11} color="var(--dax-text-muted)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Proveedor */}
              <div>
                <label style={S.label}>Proveedor <span style={{ fontWeight: 400, textTransform: 'none' as const }}>(opcional)</span></label>
                <div style={{ position: 'relative' }}>
                  <Truck size={13} color="var(--dax-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nombre del proveedor..."
                    style={{ ...S.input, paddingLeft: '32px' }} />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label style={S.label}>Notas <span style={{ fontWeight: 400, textTransform: 'none' as const }}>(opcional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones adicionales..." rows={2}
                  style={{ ...S.input, resize: 'vertical' as const }} />
              </div>

              {/* PIN gerente */}
              <div style={{ padding: '12px 14px', background: 'rgba(240,160,48,0.05)', border: '1px solid rgba(240,160,48,0.15)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: usePin ? '10px' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={13} color="#F0A030" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>AutorizaciÃ³n del gerente</span>
                  </div>
                  <div onClick={() => setUsePin(p => !p)} style={{ width: '34px', height: '19px', borderRadius: '10px', background: usePin ? '#F0A030' : 'var(--dax-border)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '2px', left: usePin ? '17px' : '2px', width: '15px', height: '15px', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                  </div>
                </div>
                {usePin && (
                  <input type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN del gerente"
                    style={{ ...S.input, textAlign: 'center' as const, fontSize: '20px', fontFamily: 'monospace', letterSpacing: '.3em' }} />
                )}
                {!usePin && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '2px' }}>Activa para requerir autorizaciÃ³n</p>}
              </div>

              {/* Error / Success */}
              {error && (
                <div style={{ display: 'flex', gap: '8px', padding: '9px 12px', background: 'var(--dax-danger-bg)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '9px' }}>
                  <AlertCircle size={13} color="#E05050" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#E05050' }}>{error}</p>
                </div>
              )}
              {success && (
                <div style={{ display: 'flex', gap: '8px', padding: '9px 12px', background: 'var(--dax-success-bg)', border: '1px solid rgba(61,191,127,.2)', borderRadius: '9px' }}>
                  <CheckCircle size={13} color="#3DBF7F" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '12px', color: '#3DBF7F' }}>{success}</p>
                </div>
              )}

              {/* BotÃ³n */}
              <button type="button" onClick={handleSubmit} disabled={createMutation.isPending}
                style={{ width: '100%', padding: '13px', background: createMutation.isPending ? 'var(--dax-surface-2)' : 'linear-gradient(135deg,#F0A030,#E08020)', border: 'none', borderRadius: '11px', color: createMutation.isPending ? 'var(--dax-text-muted)' : '#fff', fontSize: '14px', fontWeight: 800, cursor: createMutation.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: createMutation.isPending ? 'none' : '0 4px 16px rgba(240,160,48,0.3)', transition: 'all .2s' }}>
                {createMutation.isPending
                  ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Registrando...</>
                  : <><Plus size={14} /> Registrar gasto {parseFloat(amount) > 0 ? `Â· ${formatCurrency(parseFloat(amount))}` : ''}</>
                }
              </button>
            </div>
          )}

          {/* â”€â”€ HISTORIAL â”€â”€ */}
          {tab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isLoading && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--dax-text-muted)' }}>
                  <Loader2 size={24} style={{ animation: 'spin .7s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: '13px' }}>Cargando...</p>
                </div>
              )}
              {!isLoading && expenses.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--dax-text-muted)' }}>
                  <Wallet size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .2 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>Sin gastos registrados</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Los gastos del turno aparecerÃ¡n aquÃ­</p>
                </div>
              )}
              {expenses.map((exp: any) => {
                const cat = CATEGORIES.find(c => c.value === exp.category);
                return (
                  <div key={exp.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)', borderRadius: '11px' }}>
                    {/* CategorÃ­a Ã­cono */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${cat?.color ?? '#6B7280'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                      {cat?.label.split(' ')[0] ?? 'ðŸ“¦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1, marginRight: '8px' }}>{exp.concept}</p>
                        <p style={{ fontSize: '14px', fontWeight: 900, color: '#E05050', flexShrink: 0 }}>-{formatCurrency(Number(exp.amount))}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: cat?.color ?? '#6B7280', background: `${cat?.color ?? '#6B7280'}12`, padding: '2px 7px', borderRadius: '20px' }}>{cat?.label.split(' ').slice(1).join(' ') ?? exp.category}</span>
                        {exp.supplier && <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>Â· {exp.supplier}</span>}
                        {exp.authorized && <span style={{ fontSize: '9px', fontWeight: 700, color: '#3DBF7F', background: 'var(--dax-success-bg)', padding: '1px 6px', borderRadius: '4px' }}>âœ“ Autorizado</span>}
                        <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)', marginLeft: 'auto' }}>{new Date(exp.createdAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {exp.notes && <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '3px' }}>{exp.notes}</p>}
                    </div>
                    {/* BotÃ³n eliminar */}
                    {!exp.authorized && (
                      <button onClick={() => deleteMutation.mutate(exp.id)} style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid rgba(224,80,80,.15)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all .15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--dax-danger-bg)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                        <Trash2 size={11} color="#E07070" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Total */}
              {expenses.length > 0 && (
                <div style={{ padding: '12px 16px', background: 'rgba(224,80,80,0.05)', border: '1px solid rgba(224,80,80,0.15)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-secondary)' }}>Total gastos del turno</span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#E05050' }}>-{formatCurrency(totalExp)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes modalOpen{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
