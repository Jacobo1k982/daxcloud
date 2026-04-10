'use client';

import { useState, useRef } from 'react';
import { createPortal }     from 'react-dom';
import { useMutation }      from '@tanstack/react-query';
import { api }              from '@/lib/api';
import {
  X, Copy, Check, Upload, Loader2,
  Smartphone, AlertCircle, CheckCircle,
} from 'lucide-react';

interface Props {
  planName:     string;
  planLabel:    string;
  planColor:    string;
  monthlyPrice: number;
  annualPrice:  number;
  onClose:      () => void;
}

const SINPE_NUMBER = '87905876';
const SINPE_NAME   = 'Jacobo Gutiérrez Rodríguez';

export function SinpePaymentModal({
  planName, planLabel, planColor,
  monthlyPrice, annualPrice, onClose,
}: Props) {
  const [cycle,        setCycle]        = useState<'monthly' | 'annual'>('monthly');
  const [step,         setStep]         = useState<'instructions' | 'upload' | 'done'>('instructions');
  const [requestId,    setRequestId]    = useState<string | null>(null);
  const [reference,    setReference]    = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef,    setCopiedRef]    = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [receiptUrl,   setReceiptUrl]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const amount = cycle === 'annual' ? annualPrice : monthlyPrice;

  // ── Crear solicitud ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payment-requests', {
        planName,
        billingCycle: cycle,
      });
      return data;
    },
    onSuccess: (data) => {
      setRequestId(data.id);
      setReference(data.reference);
      setStep('upload');
    },
  });

  // ── Subir comprobante ─────────────────────────────────────────────────────
  const uploadReceiptMutation = useMutation({
    mutationFn: async (url: string) => {
      await api.put(`/payment-requests/${requestId}/receipt`, { receiptUrl: url });
    },
    onSuccess: () => setStep('done'),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Máximo 5MB'); return; }

    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/product-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = `${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api$/, '')}/api${data.url}`;
      setReceiptUrl(url);
      await uploadReceiptMutation.mutateAsync(url);
    } catch {
      alert('Error al subir el comprobante');
    } finally {
      setUploadingImg(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'number' | 'ref') => {
    await navigator.clipboard.writeText(text);
    if (type === 'number') {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{
        background: 'var(--dax-surface)', borderRadius: '20px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden', animation: 'modalIn .25s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--dax-border)',
          background: `linear-gradient(135deg, ${planColor}10, transparent)`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${planColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={18} color={planColor} />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1.1 }}>
                Pago por SINPE
              </p>
              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
                Plan {planLabel}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* ── STEP 1: Instrucciones ── */}
          {step === 'instructions' && (
            <>
              {/* Selector de ciclo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                {[
                  { key: 'monthly', label: 'Mensual',  price: `$${monthlyPrice}/mes`,          sub: 'Renovación mensual'          },
                  { key: 'annual',  label: 'Anual',     price: `$${annualPrice}/año`,            sub: `$${Math.round(annualPrice/12)}/mes · 2 meses gratis` },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setCycle(opt.key as any)}
                    style={{
                      padding: '12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                      border:     `1.5px solid ${cycle === opt.key ? planColor : 'var(--dax-border)'}`,
                      background: cycle === opt.key ? `${planColor}10` : 'var(--dax-surface-2)',
                      transition: 'all .15s',
                    }}
                  >
                    <p style={{ fontSize: '12px', fontWeight: 700, color: cycle === opt.key ? planColor : 'var(--dax-text-secondary)', marginBottom: '2px' }}>{opt.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{opt.price}</p>
                    <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{opt.sub}</p>
                  </button>
                ))}
              </div>

              {/* Instrucciones SINPE */}
              <div style={{ background: 'var(--dax-surface-2)', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid var(--dax-border)' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '14px' }}>
                  Instrucciones de pago
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Paso 1 */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: planColor, color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '6px' }}>
                        Transfiere exactamente <strong style={{ color: planColor }}>${amount} USD</strong> vía SINPE Móvil
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--dax-surface)', borderRadius: '8px', padding: '8px 12px', border: '1px solid var(--dax-border)' }}>
                        <div>
                          <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dax-text-primary)', letterSpacing: '2px' }}>{SINPE_NUMBER}</p>
                          <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{SINPE_NAME}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(SINPE_NUMBER, 'number')}
                          style={{ background: copiedNumber ? 'rgba(34,197,94,.1)' : 'var(--dax-surface-2)', border: 'none', cursor: 'pointer', color: copiedNumber ? '#22C55E' : 'var(--dax-text-muted)', padding: '6px 10px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}
                        >
                          {copiedNumber ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Paso 2 */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: planColor, color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>
                      Haz clic en <strong>"Continuar"</strong> — te asignaremos una referencia única para identificar tu pago
                    </p>
                  </div>

                  {/* Paso 3 */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: planColor, color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>
                      Sube una captura del comprobante — activamos tu plan en menos de <strong>2 horas hábiles</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(90,170,240,.08)', border: '1px solid rgba(90,170,240,.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                <AlertCircle size={14} color="#5AAAF0" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '11px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>
                  El tipo de cambio se aplica al momento de verificar el pago. Si tienes dudas escríbenos a <strong>ventas@daxcloud.shop</strong>
                </p>
              </div>

              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                  background: planColor, color: '#fff', fontSize: '14px', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: `0 4px 20px ${planColor}40`,
                }}
              >
                {createMutation.isPending
                  ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Generando referencia...</>
                  : 'Continuar →'
                }
              </button>
              {createMutation.isError && (
                <p style={{ fontSize: '12px', color: 'var(--dax-danger)', textAlign: 'center', marginTop: '8px' }}>
                  {(createMutation.error as any)?.response?.data?.message ?? 'Error al crear solicitud'}
                </p>
              )}
            </>
          )}

          {/* ── STEP 2: Subir comprobante ── */}
          {step === 'upload' && (
            <>
              {/* Referencia */}
              <div style={{ background: `${planColor}10`, border: `1px solid ${planColor}30`, borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>Tu referencia de pago</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: planColor, letterSpacing: '2px' }}>{reference}</span>
                  <button
                    onClick={() => reference && copyToClipboard(reference, 'ref')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedRef ? '#22C55E' : 'var(--dax-text-muted)', display: 'flex' }}
                  >
                    {copiedRef ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '4px' }}>
                  Incluye esta referencia en el mensaje del SINPE
                </p>
              </div>

              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '12px' }}>
                Sube el comprobante de pago
              </p>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${receiptUrl ? '#22C55E' : 'var(--dax-border)'}`,
                  borderRadius: '12px', padding: '32px',
                  textAlign: 'center', cursor: 'pointer',
                  background: receiptUrl ? 'rgba(34,197,94,.05)' : 'var(--dax-surface-2)',
                  transition: 'all .15s', marginBottom: '16px',
                }}
              >
                <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                {uploadingImg ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={24} color={planColor} style={{ animation: 'spin .7s linear infinite' }} />
                    <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Subiendo comprobante...</p>
                  </div>
                ) : receiptUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={28} color="#22C55E" />
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#22C55E' }}>Comprobante cargado</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Haz clic para cambiar</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <Upload size={24} color="var(--dax-text-muted)" />
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>Selecciona o arrastra el comprobante</p>
                    <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>JPG, PNG o PDF · Máx 5MB</p>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', textAlign: 'center' }}>
                También puedes enviar el comprobante a <strong>ventas@daxcloud.shop</strong> con el asunto <strong>{reference}</strong>
              </p>
            </>
          )}

          {/* ── STEP 3: Confirmación ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={32} color="#22C55E" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dax-text-primary)', marginBottom: '8px' }}>
                ¡Solicitud enviada!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)', lineHeight: 1.6, marginBottom: '8px' }}>
                Revisaremos tu comprobante y activaremos tu plan <strong style={{ color: planColor }}>{planLabel}</strong> en menos de <strong>2 horas hábiles</strong>.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '24px' }}>
                Referencia: <strong style={{ color: 'var(--dax-text-primary)' }}>{reference}</strong>
              </p>
              <button
                onClick={onClose}
                style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: planColor, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
}
