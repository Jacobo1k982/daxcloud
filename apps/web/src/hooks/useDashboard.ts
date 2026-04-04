'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDashboard() {
  const stats = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      const { data } = await api.get('/tenants/me/stats');
      return data;
    },
    refetchInterval: 60000,
  });

  const summary = useQuery({
    queryKey: ['sales-summary'],
    queryFn: async () => {
      const { data } = await api.get('/sales/summary');
      return data;
    },
    refetchInterval: 30000,
  });

  const analytics = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard');
      return data;
    },
    refetchInterval: 60000,
  });

  const recentSales = useQuery({
    queryKey: ['recent-sales'],
    queryFn: async () => {
      const { data } = await api.get('/sales?limit=8&page=1');
      return data;
    },
    refetchInterval: 30000,
  });

  const lowStock = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/low-stock');
      return data;
    },
    refetchInterval: 120000,
  });

  return {
    stats:       stats.data,
    summary:     summary.data,
    analytics:   analytics.data,
    recentSales: recentSales.data,
    lowStock:    lowStock.data ?? [],
    isLoading:   stats.isLoading || summary.isLoading,
  };
}