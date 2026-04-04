'use client';

import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { setAuth, logout, user, tenant, features, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string, tenantSlug: string) => {
    const { data } = await api.post('/auth/login', { email, password, tenantSlug });
    setAuth(data.accessToken, data.user, data.tenant, data.features);
    router.push('/dashboard');
    return data;
  };

  const register = async (formData: {
    tenantName: string;
    tenantSlug: string;
    country: string;
    currency: string;
    locale: string;
    industry?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const { data } = await api.post('/auth/register', formData);
    return data;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const formatCurrency = (amount: number) => {
    if (!tenant) return `$${amount.toFixed(2)}`;
    try {
      return new Intl.NumberFormat(tenant.locale, {
        style: 'currency',
        currency: tenant.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${tenant.currency} ${amount.toFixed(2)}`;
    }
  };

  const hasFeature = (feature: string): boolean => {
    return (features as any)?.[feature] === true;
  };

  // Industria del tenant para POS adaptativo y módulos
  const industry = (tenant?.industry ?? 'general').toLowerCase();

  return {
    user,
    tenant,
    features,
    isAuthenticated,
    industry,
    login,
    register,
    logout: handleLogout,
    formatCurrency,
    hasFeature,
  };
}