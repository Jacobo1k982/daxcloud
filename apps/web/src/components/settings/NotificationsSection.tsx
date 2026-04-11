'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api }                    from '@/lib/api';
import { useNotificationPrefs }   from '@/hooks/useNotificationPrefs';
import {
  Bell, Package, ShoppingCart, Target,
  AlertTriangle, Users, Zap, Save,
  Loader2, Trash2, CheckCheck, Volume2, VolumeX, Monitor,
} from 'lucide-react';

// ── Config visual de tipos ────────────────────────────────────────────────────
const NOTIF_TYPES = [
  {
    key:   'low_stock',
    label: 'Stock bajo',
    desc:  'Cuando un producto baja del nivel mínimo de inventario',
    icon:  Package,
    color: '#F0A030',
    recommended: true,
  },
  {
    key:   'new_sale',
    label: 'Nueva venta',
    desc:  'Cada vez que se registra una venta en el POS',
    icon:  ShoppingCart,
    color: '#3DBF7F',
    recommended: false,
  },
  {
    key:   'daily_goal',
    label: 'Metas diarias',
    desc:  'Al alcanzar hitos de ventas (10, 20, 50 ventas en el día)',
    icon:  Target,
    color: '#A78BFA',
    recommended: true,
  },
  {
    key:   'system',
    label: 'Alertas del sistema',
    desc:  'Avisos importantes sobre el funcionamiento de DaxCloud',
    icon:  AlertTriangle,
    color: '#E05050',
    recommended: true,
  },
  {
    key:   'new_user',
    label: 'Nuevos usuarios',
    desc:  'Cuando se agrega un nuevo miembro al equipo',
    icon:  Users,
    color: '#5AAAF0',
    recommended: true,
  },
  {
    key:   'achievement',
    label: 'Logros',
    desc:  'Celebraciones y hitos del negocio',
    icon:  Zap,
    color: '#F0A030',
    recommended: false,
  },
];

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    style={{
      width: '44px', height: '24px', borderRadius: '12px',
      border: 'none', cursor: 'pointer', flexShrink: 0,
      background: value ? 'var(--dax-coral)' : 'var(--dax-surface-3)',
      position: 'relative', transition: 'background 0.2s ease',
    }}
  >
    <span style={{
      position: 'absolute', top: '2px', left: value ? '22px' : '2px',
      width: '20px', height: '20px', borderRadius: '50%',
      background: '#fff', transition: 'left 0.2s ease', display: 'block',
    }} />
  </button>
);

export function NotificationsSection({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const queryClient = useQueryClient();
  const { prefs, savePrefs } = useNotificationPrefs();
  const [saved, setSaved]    = useState(false);

  // Notificaciones recientes
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn:  async () => { const { data } = await api.get('/notifications?page=1'); return data; },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => api.put('/notifications/read-all'),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      showToast('Todas marcadas como leídas');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete('/notifications/all').catch(() => {}),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      showToast('Notificaciones eliminadas');
    },
  });

  const handleSave = () => {
    setSaved(true);
    showToast('Preferencias de notificaciones guardadas');
    setTimeout(() => setSaved(false), 2000);
  };

  const unreadCount = (notifications as any[]).filter((n: any) => !n.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px' }}>

      {/* ── Resumen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--dax-border)' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '6px' }}>Sin leer</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: unreadCount > 0 ? 'var(--dax-coral)' : 'var(--dax-text-primary)', lineHeight: 1 }}>{unreadCount}</p>
        </div>
        <div style={{ background: 'var(--dax-surface-2)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--dax-border)' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dax-text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '6px' }}>Total</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--dax-text-primary)', lineHeight: 1 }}>{(notifications as any[]).length}</p>
        </div>
      </div>

      {/* ── Acciones rápidas ── */}
      {unreadCount > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--dax-border)', background: 'var(--dax-surface-2)', color: 'var(--dax-text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            {markAllMutation.isPending
              ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} />
              : <CheckCheck size={13} />
            }
            Marcar todas como leídas
          </button>
        </div>
      )}

      {/* ── Tipos de notificaciones ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Bell size={14} color="var(--dax-coral)" />
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-coral)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Tipos de notificaciones
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {NOTIF_TYPES.map(item => {
            const Icon    = item.icon;
            const enabled = (prefs as any)[item.key] !== false;
            return (
              <div
                key={item.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '12px',
                  background: enabled ? `${item.color}06` : 'var(--dax-surface-2)',
                  border: `1px solid ${enabled ? `${item.color}20` : 'var(--dax-border)'}`,
                  transition: 'all .15s',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: enabled ? `${item.color}15` : 'var(--dax-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={enabled ? item.color : 'var(--dax-text-muted)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: enabled ? 'var(--dax-text-primary)' : 'var(--dax-text-muted)' }}>
                      {item.label}
                    </p>
                    {item.recommended && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: `${item.color}15`, color: item.color }}>
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', lineHeight: 1.4 }}>{item.desc}</p>
                </div>
                <Toggle
                  value={enabled}
                  onChange={() => savePrefs({ [item.key]: !enabled } as any)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Preferencias adicionales ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Monitor size={14} color="var(--dax-coral)" />
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dax-coral)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Comportamiento
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            {
              key:   'sound',
              label: 'Sonido de notificación',
              desc:  'Reproduce un sonido al recibir nuevas alertas',
              icon:  prefs.sound ? Volume2 : VolumeX,
              color: '#5AAAF0',
            },
            {
              key:   'desktop',
              label: 'Notificaciones del escritorio',
              desc:  'Muestra alertas del sistema operativo cuando la ventana está en segundo plano',
              icon:  Monitor,
              color: '#A78BFA',
            },
          ].map(item => {
            const Icon    = item.icon;
            const enabled = (prefs as any)[item.key] as boolean;
            return (
              <div
                key={item.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'var(--dax-surface-2)', border: '1px solid var(--dax-border)',
                }}
              >
                <Icon size={16} color={enabled ? item.color : 'var(--dax-text-muted)'} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{item.desc}</p>
                </div>
                <Toggle
                  value={enabled}
                  onChange={() => {
                    if (item.key === 'desktop' && !enabled) {
                      Notification.requestPermission().then(perm => {
                        if (perm === 'granted') savePrefs({ desktop: true });
                        else showToast('El navegador bloqueó los permisos de notificación', 'error');
                      });
                    } else {
                      savePrefs({ [item.key]: !enabled } as any);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón guardar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          className="dax-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {saved
            ? <><CheckCheck size={13} /> Guardado</>
            : <><Save size={13} /> Guardar preferencias</>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
