'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const CURRENCIES = [
  { code: 'CRC', symbol: '₡',   country: 'CR', name: 'Colón costarricense',     region: 'América Central' },
  { code: 'GTQ', symbol: 'Q',   country: 'GT', name: 'Quetzal guatemalteco',     region: 'América Central' },
  { code: 'HNL', symbol: 'L',   country: 'HN', name: 'Lempira hondureño',        region: 'América Central' },
  { code: 'NIO', symbol: 'C$',  country: 'NI', name: 'Córdoba nicaragüense',     region: 'América Central' },
  { code: 'PAB', symbol: 'B/',  country: 'PA', name: 'Balboa panameño',          region: 'América Central' },
  { code: 'DOP', symbol: 'RD$', country: 'DO', name: 'Peso dominicano',          region: 'El Caribe' },
  { code: 'MXN', symbol: '$',   country: 'MX', name: 'Peso mexicano',            region: 'América del Norte' },
  { code: 'USD', symbol: '$',   country: 'US', name: 'Dólar estadounidense',     region: 'América del Norte' },
  { code: 'CAD', symbol: '$',   country: 'CA', name: 'Dólar canadiense',         region: 'América del Norte' },
  { code: 'COP', symbol: '$',   country: 'CO', name: 'Peso colombiano',          region: 'América del Sur' },
  { code: 'VES', symbol: 'Bs',  country: 'VE', name: 'Bolívar venezolano',       region: 'América del Sur' },
  { code: 'PEN', symbol: 'S/',  country: 'PE', name: 'Sol peruano',              region: 'América del Sur' },
  { code: 'CLP', symbol: '$',   country: 'CL', name: 'Peso chileno',             region: 'América del Sur' },
  { code: 'ARS', symbol: '$',   country: 'AR', name: 'Peso argentino',           region: 'América del Sur' },
  { code: 'BOB', symbol: 'Bs',  country: 'BO', name: 'Boliviano',                region: 'América del Sur' },
  { code: 'PYG', symbol: '₲',   country: 'PY', name: 'Guaraní paraguayo',        region: 'América del Sur' },
  { code: 'UYU', symbol: '$',   country: 'UY', name: 'Peso uruguayo',            region: 'América del Sur' },
  { code: 'BRL', symbol: 'R$',  country: 'BR', name: 'Real brasileño',           region: 'América del Sur' },
  { code: 'EUR', symbol: '€',   country: 'ES', name: 'Euro',                     region: 'Europa' },
  { code: 'GBP', symbol: '£',   country: 'GB', name: 'Libra esterlina',          region: 'Europa' },
  { code: 'CHF', symbol: 'Fr',  country: 'CH', name: 'Franco suizo',             region: 'Europa' },
  { code: 'SEK', symbol: 'kr',  country: 'SE', name: 'Corona sueca',             region: 'Europa' },
  { code: 'NOK', symbol: 'kr',  country: 'NO', name: 'Corona noruega',           region: 'Europa' },
  { code: 'DKK', symbol: 'kr',  country: 'DK', name: 'Corona danesa',            region: 'Europa' },
];

const TIMEZONES = [
  { value: 'America/Costa_Rica',    label: 'Costa Rica (GMT-6)',       region: 'América Central' },
  { value: 'America/Guatemala',     label: 'Guatemala (GMT-6)',        region: 'América Central' },
  { value: 'America/Tegucigalpa',   label: 'Honduras (GMT-6)',         region: 'América Central' },
  { value: 'America/Managua',       label: 'Nicaragua (GMT-6)',        region: 'América Central' },
  { value: 'America/Panama',        label: 'Panamá (GMT-5)',           region: 'América Central' },
  { value: 'America/El_Salvador',   label: 'El Salvador (GMT-6)',      region: 'América Central' },
  { value: 'America/Santo_Domingo', label: 'Rep. Dominicana (GMT-4)',  region: 'El Caribe' },
  { value: 'America/Mexico_City',   label: 'Ciudad de México (GMT-6)', region: 'América del Norte' },
  { value: 'America/New_York',      label: 'Nueva York (GMT-5)',       region: 'América del Norte' },
  { value: 'America/Chicago',       label: 'Chicago (GMT-6)',          region: 'América del Norte' },
  { value: 'America/Denver',        label: 'Denver (GMT-7)',           region: 'América del Norte' },
  { value: 'America/Los_Angeles',   label: 'Los Ángeles (GMT-8)',      region: 'América del Norte' },
  { value: 'America/Toronto',       label: 'Toronto (GMT-5)',          region: 'América del Norte' },
  { value: 'America/Bogota',        label: 'Colombia (GMT-5)',         region: 'América del Sur' },
  { value: 'America/Caracas',       label: 'Venezuela (GMT-4)',        region: 'América del Sur' },
  { value: 'America/Lima',          label: 'Perú (GMT-5)',             region: 'América del Sur' },
  { value: 'America/Santiago',      label: 'Chile (GMT-4)',            region: 'América del Sur' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (GMT-3)', region: 'América del Sur' },
  { value: 'America/La_Paz',        label: 'Bolivia (GMT-4)',          region: 'América del Sur' },
  { value: 'America/Asuncion',      label: 'Paraguay (GMT-4)',         region: 'América del Sur' },
  { value: 'America/Montevideo',    label: 'Uruguay (GMT-3)',          region: 'América del Sur' },
  { value: 'America/Sao_Paulo',     label: 'Brasil (GMT-3)',           region: 'América del Sur' },
  { value: 'Europe/Madrid',         label: 'España (GMT+1)',           region: 'Europa' },
  { value: 'Europe/London',         label: 'Reino Unido (GMT+0)',      region: 'Europa' },
  { value: 'Europe/Paris',          label: 'Francia (GMT+1)',          region: 'Europa' },
  { value: 'Europe/Berlin',         label: 'Alemania (GMT+1)',         region: 'Europa' },
  { value: 'Europe/Rome',           label: 'Italia (GMT+1)',           region: 'Europa' },
  { value: 'Europe/Zurich',         label: 'Suiza (GMT+1)',            region: 'Europa' },
  { value: 'Europe/Stockholm',      label: 'Suecia (GMT+1)',           region: 'Europa' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/03/2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '03/31/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-03-31' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '31-03-2026' },
];

const LANGUAGES = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '8px', marginBottom: '16px' }}>
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dax-coral)' }}>
      {children}
    </p>
  </div>
);

const groupBy = <T,>(arr: T[], key: keyof T): Record<string, T[]> =>
  arr.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);

export function LocaleSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { tenant } = useAuth();

  const [form, setForm] = useState({
    dateFormat: 'DD/MM/YYYY',
    timezone: tenant?.locale === 'es-CR' ? 'America/Costa_Rica' : 'America/New_York',
    language: 'es',
  });

  const groupedCurrencies = groupBy(CURRENCIES, 'region');
  const groupedTimezones = groupBy(TIMEZONES, 'region');

  const currentCurrency = CURRENCIES.find(c => c.code === tenant?.currency);
  const preview = currentCurrency
    ? new Intl.NumberFormat(tenant?.locale ?? 'es-CR', { style: 'currency', currency: currentCurrency.code }).format(12500)
    : '₡12,500.00';

  const f = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Moneda actual */}
      <div style={{ background: 'var(--dax-surface-2)', borderRadius: 'var(--dax-radius-lg)', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dax-text-muted)', marginBottom: '6px' }}>
            Moneda activa
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--dax-coral)' }}>{currentCurrency?.symbol}</span>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
                {currentCurrency?.code} — {currentCurrency?.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
                Ejemplo: {preview}
              </p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '4px' }}>País: <strong>{tenant?.country}</strong></p>
          <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>Locale: <strong>{tenant?.locale}</strong></p>
        </div>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)', marginBottom: '20px', padding: '12px 16px', background: 'var(--dax-info-bg)', borderRadius: 'var(--dax-radius-md)', borderLeft: '3px solid var(--dax-info)' }}>
        Para cambiar la moneda o el país contacta a soporte en{' '}
        <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dax-coral)', textDecoration: 'none', fontWeight: 600 }}>
          jacana-dev.com
        </a>
        {' '}— Este cambio afecta toda la facturación del sistema.
      </p>

      {/* Referencia de monedas */}
      <SectionTitle>Monedas soportadas</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
        {Object.entries(groupedCurrencies).map(([region, currencies]) => (
          <div key={region}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>{region}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
              {currencies.map(currency => {
                const isCurrent = currency.code === tenant?.currency;
                return (
                  <div
                    key={currency.code}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: 'var(--dax-radius-md)',
                      background: isCurrent ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                      border: `1px solid ${isCurrent ? 'var(--dax-coral-border)' : 'transparent'}`,
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 700, color: isCurrent ? 'var(--dax-coral)' : 'var(--dax-text-tertiary)', minWidth: '24px', textAlign: 'center' }}>
                      {currency.symbol}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: isCurrent ? 'var(--dax-coral)' : 'var(--dax-text-primary)', marginBottom: '1px' }}>
                        {currency.code}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currency.name}
                      </p>
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--dax-coral)', background: 'var(--dax-coral-soft)', padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>
                        ACTIVA
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Formato de fecha */}
      <SectionTitle>Formato y zona horaria</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
        <div>
          <Label>Idioma de la interfaz</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
            {LANGUAGES.map(lang => {
              const selected = form.language === lang.value;
              return (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => f('language', lang.value)}
                  style={{
                    padding: '10px', borderRadius: 'var(--dax-radius-md)',
                    border: `1px solid ${selected ? 'var(--dax-coral)' : 'var(--dax-border)'}`,
                    background: selected ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                  <span style={{ fontSize: '12px', fontWeight: selected ? 700 : 400, color: selected ? 'var(--dax-coral)' : 'var(--dax-text-secondary)' }}>
                    {lang.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Formato de fecha</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
            {DATE_FORMATS.map(fmt => {
              const selected = form.dateFormat === fmt.value;
              return (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => f('dateFormat', fmt.value)}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--dax-radius-md)',
                    border: `1px solid ${selected ? 'var(--dax-coral)' : 'var(--dax-border)'}`,
                    background: selected ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                  }}
                >
                  <p style={{ fontSize: '12px', fontWeight: 700, color: selected ? 'var(--dax-coral)' : 'var(--dax-text-primary)', marginBottom: '2px' }}>{fmt.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{fmt.example}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Zona horaria</Label>
          <select
            className="dax-input"
            value={form.timezone}
            onChange={e => f('timezone', e.target.value)}
          >
            {Object.entries(groupedTimezones).map(([region, tzs]) => (
              <optgroup key={region} label={region}>
                {tzs.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={() => showToast('Preferencias de región guardadas')} className="dax-btn-primary">
            Guardar preferencias
          </button>
        </div>
      </div>
    </div>
  );
}