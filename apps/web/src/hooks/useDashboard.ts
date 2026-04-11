'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useDashboard(period = 'today') {
  const summary = useQuery({
    queryKey: ['dashboard-summary', period],
    queryFn:  async () => { const { data } = await api.get(`/analytics/summary?period=${period}`); return data; },
    refetchInterval: 30000,
  });

  const salesByPeriod = useQuery({
    queryKey: ['sales-by-period', period],
    queryFn:  async () => { const { data } = await api.get(`/analytics/sales-by-period?period=${period}`); return data; },
    refetchInterval: 60000,
  });

  const topProducts = useQuery({
    queryKey: ['top-products', period],
    queryFn:  async () => { const { data } = await api.get(`/analytics/top-products?period=${period}&limit=8`); return data; },
    refetchInterval: 60000,
  });

  const paymentMethods = useQuery({
    queryKey: ['payment-methods', period],
    queryFn:  async () => { const { data } = await api.get(`/analytics/payment-methods?period=${period}`); return data; },
    refetchInterval: 60000,
  });

  const peakHours = useQuery({
    queryKey: ['peak-hours', period],
    queryFn:  async () => { const { data } = await api.get(`/analytics/peak-hours?period=${period}`); return data; },
    refetchInterval: 120000,
  });

  const topCashiers = useQuery({
    queryKey: ['top-cashiers', period],
    queryFn:  async () => { const { data } = await api.get(`/analytics/top-cashiers?period=${period}`); return data; },
    refetchInterval: 120000,
  });

  const criticalStock = useQuery({
    queryKey: ['critical-stock'],
    queryFn:  async () => { const { data } = await api.get('/analytics/critical-stock'); return data; },
    refetchInterval: 120000,
  });

  const recentSales = useQuery({
    queryKey: ['recent-sales'],
    queryFn:  async () => { const { data } = await api.get('/sales?limit=8&page=1'); return data; },
    refetchInterval: 20000,
  });

  const tenantStats = useQuery({
    queryKey: ['tenant-stats'],
    queryFn:  async () => { const { data } = await api.get('/tenants/me/stats'); return data; },
    refetchInterval: 120000,
  });

  return {
    summary:       summary.data,
    salesByPeriod: salesByPeriod.data ?? [],
    topProducts:   topProducts.data ?? [],
    paymentMethods: paymentMethods.data ?? [],
    peakHours:     peakHours.data ?? [],
    topCashiers:   topCashiers.data ?? [],
    criticalStock: criticalStock.data ?? [],
    recentSales:   recentSales.data,
    tenantStats:   tenantStats.data,
    isLoading:     summary.isLoading,
    refetch: () => {
      summary.refetch();
      salesByPeriod.refetch();
      topProducts.refetch();
      paymentMethods.refetch();
      peakHours.refetch();
      topCashiers.refetch();
      criticalStock.refetch();
      recentSales.refetch();
    },
  };
}
