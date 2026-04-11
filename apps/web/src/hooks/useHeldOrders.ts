'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HeldOrder {
  id:            string;
  label:         string;
  cart:          any[];
  discount:      number;
  note:          string;
  paymentMethod: string;
  mixedPayments: { cash: string; card: string; transfer: string };
  selectedTable: string;
  selectedEmployee: string;
  createdAt:     string;
}

const STORAGE_KEY = 'daxcloud_held_orders';

export function useHeldOrders() {
  const [orders, setOrders] = useState<HeldOrder[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOrders(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: HeldOrder[]) => {
    setOrders(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const holdOrder = useCallback((order: Omit<HeldOrder, 'id' | 'createdAt'>) => {
    const newOrder: HeldOrder = {
      ...order,
      id:        crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persist([...orders, newOrder]);
    return newOrder;
  }, [orders]);

  const removeOrder = useCallback((id: string) => {
    persist(orders.filter(o => o.id !== id));
  }, [orders]);

  const clearAll = useCallback(() => {
    persist([]);
  }, []);

  return { orders, holdOrder, removeOrder, clearAll };
}
