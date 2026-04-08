'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CashShift {
  id:            string;
  branchId:      string;
  userId:        string;
  openingAmount: number;
  totalSales:    number;
  totalOrders:   number;
  notes:         string | null;
  status:        'open' | 'closed';
  openedAt:      string;
  closedAt:      string | null;
  user:          { firstName: string; lastName: string; avatarUrl?: string };
  branch:        { name: string };
}

export function useCashRegister(branchId: string | undefined) {
  const queryClient = useQueryClient();
  const key = ['cash-register-active', branchId];

  // Estado del turno activo
  const { data: activeShift, isLoading } = useQuery<CashShift | null>({
    queryKey: key,
    queryFn: async () => {
      if (!branchId) return null;
      const { data } = await api.get(`/cash-register/active?branchId=${branchId}`);
      return data ?? null;
    },
    enabled:       !!branchId,
    refetchInterval: 30_000,   // refresca cada 30s — detecta si otro usuario cerró la caja
    staleTime:     10_000,
  });

  // Abrir turno
  const openMutation = useMutation({
    mutationFn: async (payload: { openingAmount: number; notes?: string }) => {
      const { data } = await api.post('/cash-register/open', {
        branchId,
        ...payload,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  // Cerrar turno
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
    isOpen:  !!activeShift,
    openMutation,
    closeMutation,
  };
}
