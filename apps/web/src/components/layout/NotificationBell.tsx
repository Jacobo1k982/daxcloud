'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/hooks/useNotifications';

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const TYPE_COLORS: Record<string, string> = {
  sale:       '#3DBF7F',
  stock:      '#F0A030',
  alert:      '#E05050',
  info:       '#5AAAF0',
  system:     '#A78BFA',
};

// ── Panel de notificaciones ───────────────────────────────────────────────────
function NotificationPanel({
  notifications, unreadCount, connected,
  markRead, markAllRead, onClose,
}: {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0,
      background: 'var(--dax-surface)',
      border: '1px solid var(--dax-border)',
      borderRadius: '16px',
      boxShadow: '0 -8px 32px rgba(0,0,0,.25)',
      overflow: 'hidden',
      zIndex: 200,
      maxHeight: '420px',
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '8px',
    }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--dax-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dax-text-primary)' }}>Notificaciones</p>
            {unreadCount > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--dax-coral)', background: 'rgba(255,92,53,.12)', padding: '2px 7px', borderRadius: '10px' }}>
                {unreadCount}
              </span>
            )}
            {/* Indicador WS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {connected
                ? <Wifi size={11} color="#3DBF7F" />
                : <WifiOff size={11} color="var(--dax-text-muted)" />
              }
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} title="Marcar todas como leídas" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '3px', borderRadius: '6px', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FF5C35')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--dax-text-muted)')}>
                <CheckCheck size={14} />
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '3px', borderRadius: '6px' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Bell size={24} color="var(--dax-text-muted)" style={{ margin: '0 auto 10px', display: 'block', opacity: .2 }} />
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Sin notificaciones</p>
          </div>
        ) : (
          notifications.map(n => {
            const color = TYPE_COLORS[n.type] ?? '#5AAAF0';
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markRead(n.id); if (n.link) window.location.href = n.link; }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '11px 14px',
                  background: n.read ? 'transparent' : `${color}06`,
                  borderLeft: `3px solid ${n.read ? 'transparent' : color}`,
                  borderBottom: '1px solid var(--dax-border-soft)',
                  cursor: n.link || !n.read ? 'pointer' : 'default',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--dax-surface-2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : `${color}06`; }}
              >
                {/* Icono */}
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                  {n.icon || '🔔'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: n.read ? 500 : 700, color: 'var(--dax-text-primary)', lineHeight: 1.3, marginBottom: '2px' }}>{n.title}</p>
                    <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)', flexShrink: 0, marginTop: '1px' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</p>
                </div>

                {/* Dot no leído */}
                {!n.read && (
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0, marginTop: '4px', boxShadow: `0 0 5px ${color}80` }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Bell para Sidebar ─────────────────────────────────────────────────────────
export function NotificationBell() {
  const { notifications, unreadCount, connected, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', padding: '0 8px', marginTop: '6px' }}>

      {/* Botón campana */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
          padding: '8px 10px', borderRadius: 'var(--dax-radius-md)',
          background: open ? 'rgba(255,92,53,.08)' : 'transparent',
          border: 'none', cursor: 'pointer',
          color: open ? '#FF5C35' : 'var(--dax-text-muted)',
          fontSize: '13px', fontWeight: 400,
          transition: 'all .15s', fontFamily: 'var(--font-primary)',
          position: 'relative',
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,0.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-secondary)'; }}}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Bell size={15} strokeWidth={open ? 2.2 : 1.8} style={{ color: 'inherit' }} />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-5px', right: '-6px',
              width: '14px', height: '14px', borderRadius: '50%',
              background: '#FF5C35', color: 'var(--dax-text-primary)',
              fontSize: '8px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--dax-navy-900)',
              animation: unreadCount > 0 ? 'notifPulse 2s infinite' : 'none',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        <span>Notificaciones</span>
        {!connected && (
          <WifiOff size={11} color="var(--dax-text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          connected={connected}
          markRead={markRead}
          markAllRead={markAllRead}
          onClose={() => setOpen(false)}
        />
      )}

      <style>{`@keyframes notifPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,92,53,.4)}50%{box-shadow:0 0 0 4px rgba(255,92,53,0)}}`}</style>
    </div>
  );
}

// ── Bell para BottomNav (versión compacta) ────────────────────────────────────
export function NotificationBellMobile() {
  const { notifications, unreadCount, connected, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(p => !p)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', flex: 1, position: 'relative' }}>
        <div style={{ width: '44px', height: '28px', borderRadius: '14px', background: open ? 'var(--dax-coral-soft)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', position: 'relative' }}>
          <Bell size={21} color={open ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <div style={{ position: 'absolute', top: '2px', right: '6px', width: '14px', height: '14px', borderRadius: '50%', background: '#FF5C35', color: 'var(--dax-text-primary)', fontSize: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--dax-surface)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        <span style={{ fontSize: '10px', fontWeight: open ? 700 : 400, color: open ? 'var(--dax-coral)' : 'var(--dax-text-muted)' }}>Alertas</span>
      </button>

      {/* Panel móvil — aparece desde abajo sobre la barra */}
      {open && (
        <div style={{ position: 'fixed', bottom: '72px', left: '8px', right: '8px', zIndex: 200 }}>
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            connected={connected}
            markRead={markRead}
            markAllRead={markAllRead}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
