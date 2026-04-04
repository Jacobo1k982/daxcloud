import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  industry?: string;
  country: string;
  currency: string;
  locale: string;
}

interface Features {
  inventory: boolean;
  restaurant_module: boolean;
  pharmacy_module: boolean;
  analytics: boolean;
  multi_branch: boolean;
  loyalty: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  features: Features | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, tenant: Tenant, features: Features) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      features: null,
      isAuthenticated: false,

      setAuth: (token, user, tenant, features) => {
        localStorage.setItem('nexora_token', token);
        set({ token, user, tenant, features, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('nexora_token');
        set({ token: null, user: null, tenant: null, features: null, isAuthenticated: false });
      },
    }),
    {
      name: 'nexora_auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenant: state.tenant,
        features: state.features,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);