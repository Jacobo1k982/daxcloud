'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

type State = 'loading' | 'success' | 'pending' | 'failed';

function PaymentReturnInner() {
  const params    = useSearchParams();
  const router    = useRouter();
  const [state,   setState]   = useState<State>('loading');
  const [message, setMessage] = useState('');
  const [plan,    setPlan]    = useState('');

  useEffect(() => {
    const tokenTrans   = params.get('token');
    const ern          = params.get('ern');
    const sessionToken = sessionStorage.getItem('pagadito_session_token');

    if (!tokenTrans || !ern || !sessionToken) {
      setState('failed');
      setMessage('Parámetros de retorno inválidos.');
      return;
    }

    api.post('/billing/pagadito/verify', { tokenTrans, ern, sessionToken })
      .then(({ data }) => {
        if (data.status === 'COMPLETED') {
          setState('success');
          setMessage(data.message ?? 'Plan activado exitosamente');
          sessionStorage.removeItem('pagadito_session_token');
          sessionStorage.removeItem('pagadito_ern');
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => router.push('/dashboard'), 3000);
        } else {
          setState('pending');
          setMessage(`Estado: ${data.status}. ${data.message ?? 'El pago está en proceso.'}`);
        }
      })
      .catch(err => {
        setState('failed');
        setMessage(err?.response?.data?.message ?? 'Error al verificar el pago.');
      });
  }, []);

  const CONFIG: Record<State, { icon: any; color: string; bg: string; title: string }> = {
    loading: { icon: Loader2,      color: '#5AAAF0', bg: 'rgba(90,170,240,.1)',   title: 'Verificando pago...'   },
    success: { icon: CheckCircle,  color: '#3DBF7F', bg: 'rgba(61,191,127,.1)',   title: '¡Pago confirmado!'     },
    pending: { icon: AlertCircle,  color: '#F0A030', bg: 'rgba(240,160,48,.1)',   title: 'Pago en proceso'       },
    failed:  { icon: XCircle,      color: '#E05050', bg: 'rgba(224,80,80,.1)',    title: 'Error en el pago'      },
  };

  const cfg  = CONFIG[state];
  const Icon = cfg.icon;

  return (
    <div style={{ minHeight: '100vh', background: '#060D16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Outfit, system-ui, sans-serif' }}>
      <div style={{ background: 'rgba(16,26,42,.95)', border: '1px solid rgba(30,58,95,.6)', borderRadius: '20px', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>

        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Icon size={36} color={cfg.color} style={{ animation: state === 'loading' ? 'spin .7s linear infinite' : 'none' }} />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F4FF', marginBottom: '12px' }}>{cfg.title}</h1>
        <p style={{ fontSize: '14px', color: '#3A6A9A', lineHeight: 1.7, marginBottom: '28px' }}>{message}</p>

        {state === 'success' && (
          <p style={{ fontSize: '12px', color: '#3A6A9A' }}>Redirigiendo al dashboard en 3 segundos...</p>
        )}

        {state !== 'loading' && state !== 'success' && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <a href="/dashboard" style={{ padding: '11px 24px', borderRadius: '10px', border: '1px solid rgba(30,58,95,.6)', background: 'transparent', color: '#7BBEE8', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              Ir al dashboard
            </a>
            <a href="/pricing" style={{ padding: '11px 24px', borderRadius: '10px', border: 'none', background: '#FF5C35', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
              Ver planes
            </a>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#060D16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#3A6A9A', fontSize: '14px', fontFamily: 'Outfit, sans-serif' }}>Cargando...</div>
      </div>
    }>
      <PaymentReturnInner />
    </Suspense>
  );
}

