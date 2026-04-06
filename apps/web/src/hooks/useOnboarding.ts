'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export const ONBOARDING_STEPS = [
  {
    id:       'business',
    title:    'Confirma tu negocio',
    desc:     'Verifica el nombre e industria de tu negocio',
    icon:     '🏪',
    required: true,
    link:     null,
  },
  {
    id:       'product',
    title:    'Agrega tu primer producto',
    desc:     'Crea al menos un producto con precio',
    icon:     '📦',
    required: true,
    link:     '/products',
  },
  {
    id:       'team',
    title:    'Invita a tu equipo',
    desc:     'Agrega un cajero o gerente (opcional)',
    icon:     '👥',
    required: false,
    link:     '/settings?tab=users',
  },
  {
    id:       'pos',
    title:    'Abre el POS',
    desc:     'Realiza tu primera venta de prueba',
    icon:     '⚡',
    required: true,
    link:     '/pos',
  },
  {
    id:       'explore',
    title:    'Explora el dashboard',
    desc:     'Conoce tus KPIs y reportes',
    icon:     '📊',
    required: false,
    link:     '/dashboard',
  },
] as const;

export type StepId = typeof ONBOARDING_STEPS[number]['id'];

export function useOnboarding() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      const { data } = await api.get('/tenants/me/onboarding');
      return data as { completed: boolean; steps: Record<string, boolean> };
    },
    enabled: !!token,
    staleTime: 30000,
  });

  const mutation = useMutation({
    mutationFn: async (step: StepId) =>
      api.put('/tenants/me/onboarding', { step }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const completeStep = useCallback((step: StepId) => {
    if (!data?.steps[step]) {
      mutation.mutate(step);
    }
  }, [data, mutation]);

  const completedCount = ONBOARDING_STEPS.filter(
    s => data?.steps[s.id]
  ).length;

  const progress = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

  const showWizard = !isLoading && !data?.completed &&
    completedCount === 0;

  return {
    steps:          ONBOARDING_STEPS,
    completedSteps: data?.steps ?? {},
    completed:      data?.completed ?? false,
    completedCount,
    progress,
    showWizard,
    isLoading,
    completeStep,
  };
}