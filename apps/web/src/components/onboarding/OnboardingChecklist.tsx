'use client';

import { useState } from 'react';
import { useOnboarding, ONBOARDING_STEPS } from '@/hooks/useOnboarding';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

export function OnboardingChecklist() {
  const { completedSteps, completed, completedCount, progress } = useOnboarding();
  const [open,    setOpen]    = useState(true);
  const [hidden,  setHidden]  = useState(false);

  if (completed || hidden) return null;

  const total = ONBOARDING_STEPS.length;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      width: '300px', zIndex: 500,
      animation: 'slideInRight .3s cubic-bezier(.22,1,.36,1)',
    }}>
      <div style={{
        background: 'rgba(22,34,53,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(30,58,95,0.7)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div
          onClick={() => setOpen(p => !p)}
          style={{
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
            cursor: 'pointer',
            borderBottom: open ? '1px solid rgba(30,58,95,.4)' : 'none',
          }}
        >
          {/* Ring de progreso */}
          <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
            <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(30,58,95,.5)" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#FF5C35" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset .4s ease' }}
              />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--dax-coral)' }}>
              {completedCount}/{total}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dax-text-primary)', marginBottom: '1px' }}>
              Completa tu configuración
            </p>
            <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)' }}>
              {progress}% completado
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {open ? <ChevronDown size={14} color="var(--dax-text-muted)" /> : <ChevronUp size={14} color="var(--dax-text-muted)" />}
            <button
              onClick={e => { e.stopPropagation(); setHidden(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', padding: '2px' }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Steps */}
        {open && (
          <div style={{ padding: '8px' }}>
            {ONBOARDING_STEPS.map((step, i) => {
              const done = !!completedSteps[step.id];
              return (
                <a
                  key={step.id}
                  href={step.link ?? '#'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px',
                    textDecoration: 'none',
                    background: done ? 'rgba(61,191,127,.05)' : 'transparent',
                    transition: 'background .15s',
                    cursor: done ? 'default' : 'pointer',
                  }}
                  onMouseEnter={e => { if (!done) (e.currentTarget as HTMLElement).style.background = 'rgba(30,58,95,.3)'; }}
                  onMouseLeave={e => { if (!done) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* Check circle */}
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    background: done ? 'rgba(61,191,127,.15)' : 'rgba(30,58,95,.4)',
                    border: `1.5px solid ${done ? '#3DBF7F' : 'rgba(30,58,95,.8)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .2s',
                  }}>
                    {done
                      ? <Check size={11} color="#3DBF7F" strokeWidth={3} />
                      : <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--dax-text-muted)' }}>{i + 1}</span>
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: done ? 500 : 600, color: done ? 'var(--dax-text-muted)' : '#B8D0E8', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.3 }}>
                      {step.icon} {step.title}
                    </p>
                    {!done && (
                      <p style={{ fontSize: '10px', color: 'var(--dax-text-muted)', lineHeight: 1.3, marginTop: '1px' }}>
                        {step.desc}
                      </p>
                    )}
                  </div>

                  {!step.required && !done && (
                    <span style={{ fontSize: '9px', color: 'var(--dax-text-muted)', fontWeight: 600, flexShrink: 0 }}>
                      Opcional
                    </span>
                  )}
                </a>
              );
            })}

            {/* Barra de progreso */}
            <div style={{ padding: '8px 10px 4px' }}>
              <div style={{ height: '3px', background: 'rgba(30,58,95,.4)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #FF5C35, #3DBF7F)', borderRadius: '2px', transition: 'width .4s ease' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}