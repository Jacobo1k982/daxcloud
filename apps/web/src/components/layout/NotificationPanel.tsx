'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import {
  X, Bell, Check, CheckCheck, Package,
  ShoppingCart, Users, AlertTriangle,
  Target, Clock, Zap, ExternalLink,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  low_stock:   { icon: Package,       color: '#F0A030' },
  new_sale:    { icon: ShoppingCart,  color: '#3DBF7F' },
  new_user:    { icon: Users,         color: '#5AAAF0' },
  system:      { icon: AlertTriangle, color: '#E05050' },
  daily_goal:  { icon: Target,        color: '#A78BFA' },
  reminder:    { icon: Clock,         color: '#FF5C35' },
  achievement: { icon: Zap,           color: '#F0A030' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const cfg  = TYPE_CONFIG[notif.type] ?? { icon: Bell, color: '#5AAAF0' };
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => { if (!notif.read) onRead(notif.id); if (notif.link) window.location.href = notif.link; }}
      style={{
        display: 'flex', gap: '12px', alignItems: 'flex-start',
        padding: '12px 16px', cursor: 'pointer',
        background: notif.read ? 'transparent' : `${cfg.color}06`,
        borderLeft: `3px solid ${notif.read ? 'transparent' : cfg.color}`,
        transition: 'all .15s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${cfg.color}08`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = notif.read ? 'transparent' : `${cfg.color}06`}
    >
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={cfg.color} strokeWidth={1.8} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '2px' }}>
          <p style={{ fontSize: '12px', fontWeight: notif.read ? 500 : 700, color: notif.read ? 'var(--dax-text-secondary)' : 'var(--dax-text-primary)', lineHeight: 1.3 }}>
            {notif.title}
          </p>
          <span style={{ fontSize: '10px', color: 'var(--dax-text-muted)', flexShrink: 0 }}>
            {timeAgo(notif.createdAt)}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', lineHeight: 1.5 }}>
          {notif.message}
        </p>
        {notif.link && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
            <ExternalLink size={9} color={cfg.color} />
            <span style={{ fontSize: '10px', color: cfg.color, fontWeight: 600 }}>Ver detalles</span>
          </div>
        )}
      </div>

      {!notif.read && (
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: '4px', boxShadow: `0 0 5px ${cfg.color}60` }} />
      )}
    </div>
  );
}

interface NotificationPanelProps {
  open:          boolean;
  onClose:       () => void;
  notifications: Notification[];
  unreadCount:   number;
  onRead:        (id: string) => void;
  onReadAll:     () => void;
}

export function NotificationPanel({ open, onClose, notifications, unreadCount, onRead, onReadAll }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open || typeof window === 'undefined') return null;

  const grouped = {
    unread: notifications.filter(n => !n.read),
    read:   notifications.filter(n =>  n.read).slice(0, 10),
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} />

      <div ref={panelRef} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(380px, 100vw)',
        background: 'rgba(15,25,36,0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(30,58,95,0.7)',
        borderRight: 'none',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,.5)',
        animation: 'slideInRight .25s cubic-bezier(.22,1,.36,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,92,53,.12)', border: '1px solid rgba(255,92,53,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={15} color="#FF5C35" />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', lineHeight: 1.2 }}>Notificaciones</p>
                {unreadCount > 0 && (
                  <p style={{ fontSize: '11px', color: '#FF5C35', fontWeight: 600 }}>{unreadCount} sin leer</p>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '4px', borderRadius: '7px', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}>
              <X size={18} />
            </button>
          </div>

          {unreadCount > 0 && (
            <button onClick={onReadAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#FF5C35', fontSize: '11px', fontWeight: 700, padding: '4px 0', fontFamily: 'var(--font-primary)', transition: 'opacity .15s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              <CheckCheck size={12} /> Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '40px 24px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={22} color="var(--dax-text-muted)" strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dax-text-secondary)' }}>Sin notificaciones</p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Aquí verás alertas de stock, ventas, metas y más.
              </p>
            </div>
          ) : (
            <>
              {grouped.unread.length > 0 && (
                <div>
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', padding: '12px 16px 6px' }}>
                    Sin leer · {grouped.unread.length}
                  </p>
                  {grouped.unread.map(n => <NotifItem key={n.id} notif={n} onRead={onRead} />)}
                </div>
              )}
              {grouped.read.length > 0 && (
                <div>
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', padding: '12px 16px 6px' }}>
                    Anteriores
                  </p>
                  {grouped.read.map(n => <NotifItem key={n.id} notif={n} onRead={onRead} />)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(30,58,95,.4)', padding: '12px 16px', flexShrink: 0 }}>
          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', textAlign: 'center' }}>
            Solo se muestran las últimas 50 notificaciones
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}

// ── Campana con badge ─────────────────────────────────────────────────────────
export function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [mounted, setMounted] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'relative', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '10px',
          color:      open ? '#FF5C35' : 'var(--dax-text-muted)',
          background: open ? 'rgba(255,92,53,.1)' : 'transparent',
          transition: 'all .15s',
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-secondary)'; }}}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--dax-text-muted)'; }}}
      >
        <Bell size={17} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '4px', right: '4px',
            minWidth: '16px', height: '16px', borderRadius: '8px',
            background: '#FF5C35', border: '1.5px solid var(--dax-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 800, color: '#fff',
            padding: '0 3px', lineHeight: 1,
            animation: 'badgePop .3s cubic-bezier(.22,1,.36,1)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      <NotificationPanel
        open={open} onClose={() => setOpen(false)}
        notifications={notifications} unreadCount={unreadCount}
        onRead={markRead} onReadAll={markAllRead}
      />

      <style>{`
        @keyframes badgePop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
