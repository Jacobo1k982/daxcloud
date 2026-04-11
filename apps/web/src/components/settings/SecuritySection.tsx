'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth }      from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { api }          from '@/lib/api';
import {
  Eye, EyeOff, KeyRound, Shield, Lock,
  CheckCircle, AlertTriangle, Loader2,
  LogOut, Monitor, Clock, Check,
} from 'lucide-react';

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Icon size={13} color="var(--dax-coral)" />
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--dax-coral)' }}>
      {children}
    </p>
  </div>
);

// ── Medidor de fortaleza de contraseña ────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: 'Mínimo 8 caracteres',          pass: password.length >= 8          },
    { label: 'Letras mayúsculas',             pass: /[A-Z]/.test(password)        },
    { label: 'Letras minúsculas',             pass: /[a-z]/.test(password)        },
    { label: 'Números',                       pass: /[0-9]/.test(password)        },
    { label: 'Caracteres especiales (!@#$)',  pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const score  = checks.filter(c => c.pass).length;
  const levels = [
    { label: 'Muy débil', color: '#E05050' },
    { label: 'Débil',     color: '#F0A030' },
    { label: 'Regular',   color: '#EAB308' },
    { label: 'Buena',     color: '#3DBF7F' },
    { label: 'Excelente', color: '#22C55E' },
  ];
  const level = levels[Math.min(score - 1, 4)] ?? levels[0];

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Barra */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i <= score ? level.color : 'var(--dax-border)', transition: 'background .3s' }} />
        ))}
      </div>
      <p style={{ fontSize: '11px', fontWeight: 600, color: level.color, marginBottom: '6px' }}>
        {level.label}
      </p>
      {/* Checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={10} color={c.pass ? '#22C55E' : 'var(--dax-text-muted)'} strokeWidth={3} />
            <span style={{ fontSize: '10px', color: c.pass ? 'var(--dax-text-secondary)' : 'var(--dax-text-muted)' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function SecuritySection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { user }   = useAuth();
  const { logout } = useAuthStore();

  // Estado cambio de contraseña
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const passMismatch = passForm.newPass && passForm.confirm && passForm.newPass !== passForm.confirm;
  const passValid    = passForm.current && passForm.newPass && passForm.newPass === passForm.confirm && passForm.newPass.length >= 8;

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (passForm.newPass !== passForm.confirm) throw new Error('Las contraseñas no coinciden');
      if (passForm.newPass.length < 8)           throw new Error('Mínimo 8 caracteres');
      return api.put('/users/me/password', {
        currentPassword: passForm.current,
        newPassword:     passForm.newPass,
      });
    },
    onSuccess: () => {
      showToast('Contraseña actualizada correctamente');
      setPassForm({ current: '', newPass: '', confirm: '' });
    },
    onError: (err: any) => showToast(err.message ?? err.response?.data?.message ?? 'Error al actualizar', 'error'),
  });

  // ── Info de sesión ────────────────────────────────────────────────────────
  const sessionInfo = {
    device:    typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? '📱 Dispositivo móvil' : '🖥️ Navegador web') : 'Navegador web',
    browser:   typeof navigator !== 'undefined' ? getBrowser(navigator.userAgent) : 'Desconocido',
    loginTime: new Date().toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '520px' }}>

      {/* ── Estado de seguridad ── */}
      <div style={{ background: 'var(--dax-surface-2)', borderRadius: '14px', padding: '16px 18px', marginBottom: '8px', border: '1px solid var(--dax-border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(61,191,127,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={22} color="#3DBF7F" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#3DBF7F', marginBottom: '2px' }}>Cuenta protegida</p>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
            {user?.email} · Rol: <strong style={{ color: 'var(--dax-text-secondary)', textTransform: 'capitalize' }}>{user?.role}</strong>
          </p>
        </div>
        <CheckCircle size={18} color="#3DBF7F" />
      </div>

      {/* ── Cambiar contraseña ── */}
      <SectionTitle icon={Lock}>Cambiar contraseña</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Contraseña actual */}
        <div>
          <Label>Contraseña actual</Label>
          <div style={{ position: 'relative' }}>
            <input
              className="dax-input"
              type={showCurrent ? 'text' : 'password'}
              placeholder="••••••••"
              value={passForm.current}
              onChange={e => setPassForm(p => ({ ...p, current: e.target.value }))}
              style={{ margin: 0, paddingRight: '40px' }}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}>
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Nueva contraseña */}
        <div>
          <Label>Nueva contraseña</Label>
          <div style={{ position: 'relative' }}>
            <input
              className="dax-input"
              type={showNew ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              value={passForm.newPass}
              onChange={e => setPassForm(p => ({ ...p, newPass: e.target.value }))}
              style={{ margin: 0, paddingRight: '40px' }}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}>
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {passForm.newPass && <PasswordStrength password={passForm.newPass} />}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <Label>Confirmar nueva contraseña</Label>
          <div style={{ position: 'relative' }}>
            <input
              className="dax-input"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              value={passForm.confirm}
              onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))}
              style={{
                margin: 0, paddingRight: '40px',
                borderColor: passMismatch ? 'var(--dax-danger)' : undefined,
              }}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex' }}>
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {passMismatch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
              <AlertTriangle size={11} color="var(--dax-danger)" />
              <p style={{ fontSize: '11px', color: 'var(--dax-danger)', fontWeight: 600 }}>Las contraseñas no coinciden</p>
            </div>
          )}
          {passForm.confirm && passForm.newPass === passForm.confirm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
              <CheckCircle size={11} color="#22C55E" />
              <p style={{ fontSize: '11px', color: '#22C55E', fontWeight: 600 }}>Las contraseñas coinciden</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending || !passValid}
            className="dax-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {passwordMutation.isPending
              ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Actualizando...</>
              : <><KeyRound size={13} /> Cambiar contraseña</>
            }
          </button>
        </div>
      </div>

      {/* ── Sesión activa ── */}
      <SectionTitle icon={Monitor}>Sesión activa</SectionTitle>

      <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--dax-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(61,191,127,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Monitor size={16} color="#3DBF7F" />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
              {sessionInfo.device}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>
              {sessionInfo.browser}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Clock size={10} color="var(--dax-text-muted)" />
              <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>{sessionInfo.loginTime}</span>
            </div>
          </div>
        </div>
        <span className="dax-badge dax-badge-success">Activa ahora</span>
      </div>

      {/* ── Zona de peligro ── */}
      <SectionTitle icon={AlertTriangle}>Zona de peligro</SectionTitle>

      <div style={{ background: 'rgba(224,80,80,.04)', border: '1px solid rgba(224,80,80,.2)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-danger)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={14} /> Cerrar sesión
            </p>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', lineHeight: 1.5 }}>
              Cierra tu sesión en este dispositivo. Necesitarás iniciar sesión nuevamente.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('¿Cerrar sesión?')) logout();
            }}
            style={{
              padding: '9px 18px', borderRadius: '10px', flexShrink: 0,
              border: '1px solid rgba(224,80,80,.4)',
              background: 'rgba(224,80,80,.06)',
              color: 'var(--dax-danger)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Helper: detectar navegador ────────────────────────────────────────────────
function getBrowser(ua: string): string {
  if (ua.includes('Chrome') && !ua.includes('Edg'))  return 'Google Chrome';
  if (ua.includes('Firefox'))                         return 'Mozilla Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg'))                             return 'Microsoft Edge';
  if (ua.includes('Opera') || ua.includes('OPR'))     return 'Opera';
  return 'Navegador desconocido';
}
