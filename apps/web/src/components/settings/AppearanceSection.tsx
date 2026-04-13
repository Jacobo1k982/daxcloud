'use client';

import { useState, useEffect } from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import { useTheme, type Density, type Accent, ACCENT_COLORS } from '@/hooks/useTheme';

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--dax-text-muted)', marginBottom: '10px' }}>
    {children}
  </p>
);

const ACCENT_OPTS: { value: Accent; label: string }[] = [
  { value: 'coral',  label: 'Coral'   },
  { value: 'blue',   label: 'Azul'    },
  { value: 'green',  label: 'Verde'   },
  { value: 'purple', label: 'Morado'  },
  { value: 'orange', label: 'Naranja' },
];

const DENSITY_OPTS: { value: Density; label: string; desc: string }[] = [
  { value: 'compact',     label: 'Compacta',  desc: 'Más información en pantalla'  },
  { value: 'comfortable', label: 'Cómoda',    desc: 'Balance ideal (recomendada)'  },
  { value: 'spacious',    label: 'Espaciosa', desc: 'Mayor separación visual'      },
];

function ThemePreview({ mode }: { mode: 'dark' | 'light' }) {
  const isDark = mode === 'dark';
  const bg     = isDark ? '#0F1924' : '#F0F4F8';
  const surf   = isDark ? '#1A2840' : '#FFFFFF';
  const surf2  = isDark ? '#1E3050' : '#F4F6FA';
  const border = isDark ? '#1E3A5F' : '#D1D9E6';
  const text   = isDark ? '#F0F4FF' : '#0F1924';
  const muted  = isDark ? '#4A7FAF' : '#6A8AAA';

  return (
    <div style={{ width: '100%', height: '76px', borderRadius: '8px', background: bg, border: `1px solid ${border}`, overflow: 'hidden', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5C35' }} />
        <div style={{ height: '3px', width: '28px', background: muted, borderRadius: '2px', opacity: .5 }} />
        <div style={{ height: '3px', width: '18px', background: muted, borderRadius: '2px', opacity: .3, marginLeft: 'auto' }} />
      </div>
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        <div style={{ width: '20px', background: surf2, borderRadius: '3px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ background: surf, borderRadius: '3px', padding: '3px 4px', border: `1px solid ${border}` }}>
            <div style={{ height: '3px', width: '45%', background: text, borderRadius: '1px', opacity: .7 }} />
          </div>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[40, 30, 50].map((w, i) => (
              <div key={i} style={{ flex: w, background: surf, borderRadius: '3px', height: '13px', border: `1px solid ${border}` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppearanceSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { theme, setTheme, prefs, mounted, setAccent, setDensity } = useTheme();

  const [localTheme,   setLocalTheme]   = useState<'dark' | 'light'>('dark');
  const [localAccent,  setLocalAccent]  = useState<Accent>('coral');
  const [localDensity, setLocalDensity] = useState<Density>('comfortable');

  useEffect(() => {
    if (mounted) {
      setLocalTheme((theme as 'dark' | 'light') ?? 'dark');
      setLocalAccent(prefs.accent);
      setLocalDensity(prefs.density);
    }
  }, [mounted, theme, prefs]);

  if (!mounted) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dax-text-muted)', fontSize: '13px', padding: '20px 0' }}>
      Cargando preferencias...
    </div>
  );

  const handleSave = () => {
    setTheme(localTheme);
    setAccent(localAccent);
    setDensity(localDensity);
    showToast('Apariencia guardada');
  };

  const handleReset = () => {
    setLocalTheme('dark');
    setLocalAccent('coral');
    setLocalDensity('comfortable');
    setTheme('dark');
    setAccent('coral');
    setDensity('comfortable');
    showToast('Apariencia restablecida');
  };

  return (
    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Tema ── */}
      <div>
        <Label>Tema</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {([
            { value: 'dark',  label: 'Oscuro', icon: Moon },
            { value: 'light', label: 'Claro',  icon: Sun  },
          ] as { value: 'dark' | 'light'; label: string; icon: any }[]).map(t => {
            const Icon   = t.icon;
            const active = localTheme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => { setLocalTheme(t.value); setTheme(t.value); }}
                style={{ padding: '12px', borderRadius: '12px', border: `2px solid ${active ? 'var(--dax-coral)' : 'var(--dax-border)'}`, background: active ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)', cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <ThemePreview mode={t.value} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={13} color={active ? 'var(--dax-coral)' : 'var(--dax-text-muted)'} />
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'var(--dax-coral)' : 'var(--dax-text-secondary)' }}>{t.label}</span>
                  {active && <Check size={12} color="var(--dax-coral)" style={{ marginLeft: 'auto' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Color de acento ── */}
      <div>
        <Label>Color de acento</Label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {ACCENT_OPTS.map(a => {
            const active = localAccent === a.value;
            const color  = ACCENT_COLORS[a.value].primary;
            return (
              <button
                key={a.value}
                onClick={() => { setLocalAccent(a.value); setAccent(a.value); }}
                title={a.label}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', border: `2px solid ${active ? color : 'var(--dax-border)'}`, background: active ? `${color}12` : 'var(--dax-surface-2)', cursor: 'pointer', transition: 'all .15s', minWidth: '70px' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, boxShadow: active ? `0 0 0 3px ${color}30` : 'none', transition: 'box-shadow .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {active && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400, color: active ? color : 'var(--dax-text-muted)' }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Densidad ── */}
      <div>
        <Label>Densidad de interfaz</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DENSITY_OPTS.map(d => {
            const active = localDensity === d.value;
            return (
              <button
                key={d.value}
                onClick={() => { setLocalDensity(d.value); setDensity(d.value); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `2px solid ${active ? 'var(--dax-coral)' : 'var(--dax-border)'}`, background: active ? 'var(--dax-coral-soft)' : 'var(--dax-surface-2)', cursor: 'pointer', transition: 'all .15s', textAlign: 'left' as const }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: d.value === 'compact' ? '2px' : d.value === 'comfortable' ? '4px' : '7px', flexShrink: 0 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '3px', width: '28px', background: active ? 'var(--dax-coral)' : 'var(--dax-text-muted)', borderRadius: '2px', opacity: i === 2 ? .6 : i === 3 ? .3 : 1 }} />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'var(--dax-coral)' : 'var(--dax-text-primary)', marginBottom: '2px' }}>{d.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--dax-text-muted)' }}>{d.desc}</p>
                </div>
                {active && <Check size={14} color="var(--dax-coral)" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--dax-surface-2)', borderRadius: '10px', border: '1px solid var(--dax-border)' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3DBF7F', animation: 'pulse 2s infinite', flexShrink: 0 }} />
        <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>
          Los cambios de tema y acento se aplican <strong style={{ color: 'var(--dax-text-secondary)' }}>instantáneamente</strong>. Haz clic en guardar para persistirlos.
        </p>
      </div>

      {/* ── Acciones ── */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={handleReset} className="dax-btn-secondary">Restablecer</button>
        <button onClick={handleSave} className="dax-btn-primary">Guardar apariencia</button>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }`}</style>
    </div>
  );
}
