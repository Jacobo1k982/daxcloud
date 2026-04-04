export * from './currencies';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  locale: string;
  settings: Record<string, unknown>;
  createdAt: Date;
}

export interface FeatureFlags {
  pos: boolean;
  inventory_basic: boolean;
  inventory_advanced: boolean;
  inventory_lots: boolean;
  multi_branch: boolean;
  analytics_basic: boolean;
  analytics_advanced: boolean;
  restaurant_module: boolean;
  pharmacy_module: boolean;
  loyalty: boolean;
  api_access: boolean;
  white_label: boolean;
  export_reports: boolean;
}

export type PlanName = 'starter' | 'growth' | 'scale';
export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}