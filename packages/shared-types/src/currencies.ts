export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  country: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  // América Central y del Sur
  CRC: { code: 'CRC', symbol: '₡', locale: 'es-CR', country: 'CR', name: 'Colón costarricense' },
  GTQ: { code: 'GTQ', symbol: 'Q',  locale: 'es-GT', country: 'GT', name: 'Quetzal guatemalteco' },
  HNL: { code: 'HNL', symbol: 'L',  locale: 'es-HN', country: 'HN', name: 'Lempira hondureño' },
  NIO: { code: 'NIO', symbol: 'C$', locale: 'es-NI', country: 'NI', name: 'Córdoba nicaragüense' },
  PAB: { code: 'PAB', symbol: 'B/', locale: 'es-PA', country: 'PA', name: 'Balboa panameño' },
  SVC: { code: 'SVC', symbol: '₡',  locale: 'es-SV', country: 'SV', name: 'Colón salvadoreño' },
  MXN: { code: 'MXN', symbol: '$',  locale: 'es-MX', country: 'MX', name: 'Peso mexicano' },
  COP: { code: 'COP', symbol: '$',  locale: 'es-CO', country: 'CO', name: 'Peso colombiano' },
  PEN: { code: 'PEN', symbol: 'S/', locale: 'es-PE', country: 'PE', name: 'Sol peruano' },
  CLP: { code: 'CLP', symbol: '$',  locale: 'es-CL', country: 'CL', name: 'Peso chileno' },
  ARS: { code: 'ARS', symbol: '$',  locale: 'es-AR', country: 'AR', name: 'Peso argentino' },
  BOB: { code: 'BOB', symbol: 'Bs', locale: 'es-BO', country: 'BO', name: 'Boliviano' },
  PYG: { code: 'PYG', symbol: '₲',  locale: 'es-PY', country: 'PY', name: 'Guaraní paraguayo' },
  UYU: { code: 'UYU', symbol: '$',  locale: 'es-UY', country: 'UY', name: 'Peso uruguayo' },
  VES: { code: 'VES', symbol: 'Bs', locale: 'es-VE', country: 'VE', name: 'Bolívar venezolano' },
  DOP: { code: 'DOP', symbol: 'RD$',locale: 'es-DO', country: 'DO', name: 'Peso dominicano' },
  // América del Norte
  USD: { code: 'USD', symbol: '$',  locale: 'en-US', country: 'US', name: 'Dólar estadounidense' },
  CAD: { code: 'CAD', symbol: '$',  locale: 'en-CA', country: 'CA', name: 'Dólar canadiense' },
  // Europa
  EUR: { code: 'EUR', symbol: '€',  locale: 'es-ES', country: 'ES', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£',  locale: 'en-GB', country: 'GB', name: 'Libra esterlina' },
};

export function formatCurrency(amount: number, currencyCode: string): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] ?? SUPPORTED_CURRENCIES['USD'];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  }).format(amount);
}

export function getCurrencyByCountry(countryCode: string): CurrencyConfig {
  const found = Object.values(SUPPORTED_CURRENCIES).find(c => c.country === countryCode);
  return found ?? SUPPORTED_CURRENCIES['USD'];
}