'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PaymentBreakdownRow {
  method: string;
  label:  string;
  icon:   string;
  amount: number;
  count:  number;
}

export interface PaymentBreakdown {
  cash:          number;
  card:          number;
  transfer:      number;
  mixed:         number;
  total:         number;
  cashTotal:     number;   // efectivo puro + parte efectivo de mixtos
  cardTotal:     number;   // tarjeta pura + parte tarjeta de mixtos
  transferTotal: number;   // sinpe puro + parte sinpe de mixtos
  cashReal:      number;   // efectivo total esperado en caja física
  breakdown:     PaymentBreakdownRow[];
}

export interface CashShift {
  id:             string;
  branchId:       string;
  userId:         string;
  openingAmount:  number;
  closingAmount:  number | null;
  expectedAmount: number | null;
  difference:     number | null;
  totalSales:     number;
  totalOrders:    number;
  totalTips:      number;
  notes:          string | null;
  status:         'open' | 'closed';
  openedAt:       string;
  closedAt:       string | null;
  user:           { firstName: string; lastName: string; avatarUrl?: string };
  branch:         { name: string };
  paymentBreakdown?: PaymentBreakdown;
  totalExpenses?:   number;
}

export function useCashRegister(branchId: string | undefined) {
  const queryClient = useQueryClient();
  const key = ['cash-register-active', branchId];

  const { data: activeShift, isLoading } = useQuery<CashShift | null>({
    queryKey: key,
    queryFn: async () => {
      if (!branchId) return null;
      const { data } = await api.get(`/cash-register/active?branchId=${branchId}`);
      return data ?? null;
    },
    enabled:         !!branchId,
    refetchInterval: 30_000,
    staleTime:       10_000,
  });

  const openMutation = useMutation({
    mutationFn: async (payload: { openingAmount: number; notes?: string }) => {
      const { data } = await api.post('/cash-register/open', { branchId, ...payload });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const closeMutation = useMutation({
    mutationFn: async (payload: { closingAmount: number; notes?: string }) => {
      if (!activeShift) throw new Error('No hay turno activo');
      const { data } = await api.post(`/cash-register/${activeShift.id}/close`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    activeShift,
    isLoading,
    isOpen: !!activeShift,
    openMutation,
    closeMutation,
  };
}
