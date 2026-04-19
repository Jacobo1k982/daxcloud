'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  color: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!token) return;

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api')
      .replace('/api', '');

    const wsUrl = baseUrl.replace(/\/+$/, '');
    const socket = io(`${wsUrl}/notifications`, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Recibe las no leídas al conectarse
    socket.on('notifications:init', (data: Notification[]) => {
      setNotifications(data);
    });

    // Nueva notificación en tiempo real
    socket.on('notifications:new', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
    });

    // Marcar leída
    socket.on('notifications:read', ({ id }: { id: string }) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    });

    // Marcar todas leídas
    socket.on('notifications:read_all', () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    });

    return () => { socket.disconnect(); };
  }, [token]);

  const markRead = useCallback((id: string) => {
    socketRef.current?.emit('notifications:read', id);
  }, []);

  const markAllRead = useCallback(() => {
    socketRef.current?.emit('notifications:read_all');
  }, []);

  return { notifications, unreadCount, connected, markRead, markAllRead };
}


