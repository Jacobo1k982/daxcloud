'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth }      from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { api }          from '@/lib/api';
import { Save, Loader2, Check, Globe, Clock, Calendar, Info } from 'lucide-react';

// ── Datos ──────────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'CRC', symbol: '₡',   name: 'Colón costarricense',      region: 'América Central' },
  { code: 'GTQ', symbol: 'Q',   name: 'Quetzal guatemalteco',      region: 'América Central' },
  { code: 'HNL', symbol: 'L',   name: 'Lempira hondureño',         region: 'América Central' },
  { code: 'NIO', symbol: 'C$',  name: 'Córdoba nicaragüense',      region: 'América Central' },
  { code: 'PAB', symbol: 'B/',  name: 'Balboa panameño',           region: 'América Central' },
  { code: 'DOP', symbol: 'RD$', name: 'Peso dominicano',           region: 'El Caribe'       },
  { code: 'MXN', symbol: '$',   name: 'Peso mexicano',             region: 'América del Norte' },
  { code: 'USD', symbol: '$',   name: 'Dólar estadounidense',      region: 'América del Norte' },
  { code: 'CAD', symbol: '$',   name: 'Dólar canadiense',          region: 'América del Norte' },
  { code: 'COP', symbol: '$',   name: 'Peso colombiano',           region: 'América del Sur' },
  { code: 'VES', symbol: 'Bs',  name: 'Bolívar venezolano',        region: 'América del Sur' },
  { code: 'PEN', symbol: 'S/',  name: 'Sol peruano',               region: 'América del Sur' },
  { code: 'CLP', symbol: '$',   name: 'Peso chileno',              region: 'América del Sur' },
  { code: 'ARS', symbol: '$',   name: 'Peso argentino',            region: 'América del Sur' },
  { code: 'BOB', symbol: 'Bs',  name: 'Boliviano',                 region: 'América del Sur' },
  { code: 'PYG', symbol: '₲',   name: 'Guaraní paraguayo',         region: 'América del Sur' },
  { code: 'UYU', symbol: '$',   name: 'Peso uruguayo',             region: 'América del Sur' },
  { code: 'BRL', symbol: 'R$',  name: 'Real brasileño',            region: 'América del Sur' },
  { code: 'EUR', symbol: '€',   name: 'Euro',                      region: 'Europa'          },
  { code: 'GBP', symbol: '£',   name: 'Libra esterlina',           region: 'Europa'          },
  { code: 'CHF', symbol: 'Fr',  name: 'Franco suizo',              region: 'Europa'          },
  { code: 'SEK', symbol: 'kr',  name: 'Corona sueca',              region: 'Europa'          },
  { code: 'NOK', symbol: 'kr',  name: 'Corona noruega',            region: 'Europa'          },
  { code: 'DKK', symbol: 'kr',  name: 'Corona danesa',             region: 'Europa'          },
];

const TIMEZONES = [
  { value: 'America/Costa_Rica',             label: 'Costa Rica (GMT-6)',        region: 'América Central'   },
  { value: 'America/Guatemala',              label: 'Guatemala (GMT-6)',         region: 'América Central'   },
  { value: 'America/Tegucigalpa',            label: 'Honduras (GMT-6)',          region: 'América Central'   },
  { value: 'America/Managua',               label: 'Nicaragua (GMT-6)',         region: 'América Central'   },
  { value: 'America/Panama',                label: 'Panamá (GMT-5)',            region: 'América Central'   },
  { value: 'America/El_Salvador',           label: 'El Salvador (GMT-6)',       region: 'América Central'   },
  { value: 'America/Santo_Domingo',         label: 'Rep. Dominicana (GMT-4)',   region: 'El Caribe'         },
  { value: 'America/Mexico_City',           label: 'Ciudad de México (GMT-6)',  region: 'América del Norte' },
  { value: 'America/New_York',              label: 'Nueva York (GMT-5)',        region: 'América del Norte' },
  { value: 'America/Chicago',              label: 'Chicago (GMT-6)',           region: 'América del Norte' },
  { value: 'America/Los_Angeles',           label: 'Los Ángeles (GMT-8)',       region: 'América del Norte' },
  { value: 'America/Toronto',              label: 'Toronto (GMT-5)',           region: 'América del Norte' },
  { value: 'America/Bogota',               label: 'Colombia (GMT-5)',          region: 'América del Sur'   },
  { value: 'America/Caracas',              label: 'Venezuela (GMT-4)',         region: 'América del Sur'   },
  { value: 'America/Lima',                 label: 'Perú (GMT-5)',              region: 'América del Sur'   },
  { value: 'America/Santiago',             label: 'Chile (GMT-4)',             region: 'América del Sur'   },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (GMT-3)',       region: 'América del Sur'   },
  { value: 'America/La_Paz',               label: 'Bolivia (GMT-4)',           region: 'América del Sur'   },
  { value: 'America/Asuncion',             label: 'Paraguay (GMT-4)',          region: 'América del Sur'   },
  { value: 'America/Montevideo',           label: 'Uruguay (GMT-3)',           region: 'América del Sur'   },
  { value: 'America/Sao_Paulo',            label: 'Brasil (GMT-3)',            region: 'América del Sur'   },
  { value: 'Europe/Madrid',               label: 'España (GMT+1)',             region: 'Europa'            },
  { value: 'Europe/London',               label: 'Reino Unido (GMT+0)',        region: 'Europa'            },
  { value: 'Europe/Paris',                label: 'Francia (GMT+1)',            region: 'Europa'            },
  { value: 'Europe/Berlin',               label: 'Alemania (GMT+1)',           region: 'Europa'            },
  { value: 'Europe/Rome',                 label: 'Italia (GMT+1)',             region: 'Europa'            },
  { value: 'Europe/Zurich',               label: 'Suiza (GMT+1)',              region: 'Europa'            },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', example: '11/04/2026' },
  { value: 'MM/DD/YYYY', example: '04/11/2026' },
  { value: 'YYYY-MM-DD', example: '2026-04-11' },
  { value: 'DD-MM-YYYY', example: '11-04-2026' },
];

const LANGUAGES = [
  { value: 'es', label: 'Español',   flag: '🇪🇸' },
  { value: 'en', label: 'English',   flag: '🇺🇸' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '8px' }}>
    {children}
  </label>
);

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--dax-border)', paddingTop: '20px', marginTop: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Icon size={13} color="var(--dax-coral)" />
    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--dax-coral)' }}>
      {children}
    </p>
  </div>
);

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const g = String(item[key]);
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── Componente principal ──────────────────────────────────────────────────────
export function LocaleSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { tenant }  = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-me'],
    queryFn:  async () => { const { data } = await api.get('/users/me'); return data; },
  });

  const [form, setForm] = useState({
    language:   'es',
    timezone:   'America/Costa_Rica',
    dateFormat: 'DD/MM/YYYY',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        language:   profile.language   ?? 'es',
        timezone:   profile.timezone   ?? 'America/Costa_Rica',
        dateFormat: 'DD/MM/YYYY', // guardado en localStorage
      });
    }
    // Leer formato de fecha de localStorage
    try {
      const saved = localStorage.getItem('daxcloud_date_format');
      if (saved) setForm(p => ({ ...p, dateFormat: saved }));
    } catch {}
  }, [profile]);

  const f = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  // ── Guardar preferencias del usuario ─────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Guarda idioma y zona horaria en el perfil
      await api.put('/users/me', {
        language: form.language,
        timezone: form.timezone,
      });
      // Guarda formato de fecha en localStorage
      try { localStorage.setItem('daxcloud_date_format', form.dateFormat); } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      showToast('Preferencias de región guardadas');
    },
    onError: (err: any) => showToast(err.response?.data?.message ?? 'Error al guardar', 'error'),
  });

  const groupedCurrencies = groupBy(CURRENCIES, 'region');
  const groupedTimezones  = groupBy(TIMEZONES,  'region');

  const currentCurrency = CURRENCIES.find(c => c.code === tenant?.currency);

  // Preview del formato de moneda
  const preview = (() => {
    try {
      return new Intl.NumberFormat(tenant?.locale ?? 'es-CR', {
        style:    'currency',
        currency: tenant?.currency ?? 'CRC',
        maximumFractionDigits: 0,
      }).format(12500);
    } catch {
      return `${currentCurrency?.symbol}12,500`;
    }
  })();

  // Preview del formato de fecha
  const today       = new Date();
  const dd          = String(today.getDate()).padStart(2, '0');
  const mm          = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy        = today.getFullYear();
  const datePreview = form.dateFormat
    .replace('DD', dd).replace('MM', mm).replace('YYYY', String(yyyy));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px' }}>

      {/* ── Moneda activa ── */}
      <div style={{ background: 'var(--dax-surface-2)', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', border: '1px solid var(--dax-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--dax-coral-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dax-coral)' }}>{currentCurrency?.symbol}</span>
          </div>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '2px' }}>
              {currentCurrency?.code} — {currentCurrency?.name}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
              Ejemplo: <strong style={{ color: 'var(--dax-coral)' }}>{preview}</strong>
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginBottom: '3px' }}>País: <strong style={{ color: 'var(--dax-text-secondary)' }}>{tenant?.country}</strong></p>
          <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>Locale: <strong style={{ color: 'var(--dax-text-secondary)' }}>{tenant?.locale}</strong></p>
        </div>
      </div>

      {/* Nota de moneda */}
      <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', background: 'rgba(90,170,240,.08)', borderRadius: '10px', border: '1px solid rgba(90,170,240,.2)', marginBottom: '8px' }}>
        <Info size={14} color="#5AAAF0" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '12px', color: 'var(--dax-text-secondary)', lineHeight: 1.5 }}>
          Para cambiar la moneda o el país escríbenos a{' '}
          <a href="mailto:ventas@daxcloud.shop" style={{ color: 'var(--dax-coral)', textDecoration: 'none', fontWeight: 600 }}>ventas@daxcloud.shop</a>
          {' '}— Este cambio afecta toda la facturación del sistema.
        </p>
      </div>

      {/* ── Preferencias personales ── */}
      <SectionTitle icon={Globe}>Preferencias personales</SectionTitle>

      {/* Idioma */}
      <div style={{ marginBottom: '18px' }}>
        <Label>Idioma de la interfaz</Label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {LANGUAGES.map(lang => {
            const sel = form.language === lang.value;
            return (
              <button
                key={lang.value}
                type="button"
                onClick={() => f('language', lang.value)}
                style={{
                  padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
                  border:     `1.5px solid ${sel ? 'var(--dax-coral)' : 'var(--dax-border)'}`,
                  background: sel ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                <span style={{ fontSize: '13px', fontWeight: sel ? 700 : 400, color: sel ? 'var(--dax-coral)' : 'var(--dax-text-secondary)' }}>
                  {lang.label}
                </span>
                {sel && <Check size={13} color="var(--dax-coral)" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zona horaria */}
      <div style={{ marginBottom: '18px' }}>
        <Label>Zona horaria</Label>
        <select
          className="dax-input"
          value={form.timezone}
          onChange={e => f('timezone', e.target.value)}
          style={{ margin: 0 }}
        >
          {Object.entries(groupedTimezones).map(([region, tzs]) => (
            <optgroup key={region} label={region}>
              {tzs.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '5px' }}>
          Afecta cómo se muestran las fechas y horas en tu sesión
        </p>
      </div>

      {/* Formato de fecha */}
      <div style={{ marginBottom: '20px' }}>
        <Label>Formato de fecha</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
          {DATE_FORMATS.map(fmt => {
            const sel = form.dateFormat === fmt.value;
            return (
              <button
                key={fmt.value}
                type="button"
                onClick={() => f('dateFormat', fmt.value)}
                style={{
                  padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                  border:     `1.5px solid ${sel ? 'var(--dax-coral)' : 'var(--dax-border)'}`,
                  background: sel ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                  transition: 'all .15s',
                }}
              >
                <p style={{ fontSize: '12px', fontWeight: 700, color: sel ? 'var(--dax-coral)' : 'var(--dax-text-primary)', marginBottom: '2px' }}>{fmt.value}</p>
                <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{fmt.example}</p>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', marginTop: '6px' }}>
          Hoy: <strong style={{ color: 'var(--dax-text-secondary)' }}>{datePreview}</strong>
        </p>
      </div>

      {/* Botón guardar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="dax-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {saveMutation.isPending
            ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Guardando...</>
            : <><Save size={13} /> Guardar preferencias</>
          }
        </button>
      </div>

      {/* ── Referencia de monedas ── */}
      <SectionTitle icon={Globe}>Monedas soportadas</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Object.entries(groupedCurrencies).map(([region, currencies]) => (
          <div key={region}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dax-text-muted)', letterSpacing: '.06em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>{region}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '6px' }}>
              {currencies.map(currency => {
                const isCurrent = currency.code === tenant?.currency;
                return (
                  <div
                    key={currency.code}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '10px',
                      background: isCurrent ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)',
                      border:     `1px solid ${isCurrent ? 'var(--dax-coral-border)' : 'transparent'}`,
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 700, color: isCurrent ? 'var(--dax-coral)' : 'var(--dax-text-muted)', minWidth: '24px', textAlign: 'center' }}>
                      {currency.symbol}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: isCurrent ? 'var(--dax-coral)' : 'var(--dax-text-primary)', marginBottom: '1px' }}>
                        {currency.code}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currency.name}
                      </p>
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--dax-coral)', background: 'var(--dax-coral-soft)', padding: '1px 6px', borderRadius: '6px', flexShrink: 0 }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
