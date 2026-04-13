'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  User, Building2, CreditCard, Users, Globe,
  Bell, Shield, Printer, Palette, Database,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import { ProfileSection }      from '@/components/settings/ProfileSection';
import { BusinessSection }     from '@/components/settings/BusinessSection';
import { PlanSection }         from '@/components/settings/PlanSection';
import { UsersSection }        from '@/components/settings/UsersSection';
import { LocaleSection }       from '@/components/settings/LocaleSection';
import { RolesSection }        from '@/components/settings/RolesSection';
import { NotificationsSection }from '@/components/settings/NotificationsSection';
import { SecuritySection }     from '@/components/settings/SecuritySection';
import { AppearanceSection }   from '@/components/settings/AppearanceSection';
import { DataSection }         from '@/components/settings/DataSection';
import { PrintingSection }     from '@/components/settings/PrintingSection';

// ── Secciones ─────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'profile',       label: 'Perfil',             icon: User,     desc: 'Tu información personal'           },
  { id: 'business',      label: 'Negocio',             icon: Building2,desc: 'Datos de tu empresa'               },
  { id: 'plan',          label: 'Plan y suscripción',  icon: CreditCard,desc:'Tu plan actual y módulos'          },
  { id: 'users',         label: 'Usuarios',            icon: Users,    desc: 'Gestiona tu equipo'                },
  { id: 'roles',         label: 'Roles',               icon: Shield,   desc: 'Roles y permisos personalizados'   },
  { id: 'locale',        label: 'Moneda e idioma',     icon: Globe,    desc: 'Región y formato'                  },
  { id: 'notifications', label: 'Notificaciones',      icon: Bell,     desc: 'Alertas y avisos'                  },
  { id: 'security',      label: 'Seguridad',           icon: Shield,   desc: 'Contraseña y acceso'               },
  { id: 'printing',      label: 'Impresión',           icon: Printer,  desc: 'Recibos y tickets'                 },
  { id: 'appearance',    label: 'Apariencia',          icon: Palette,  desc: 'Tema y visualización'              },
  { id: 'data',          label: 'Datos y backups',     icon: Database, desc: 'Exportar y respaldar'              },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) {
  return (
    <div style={{ padding: '10px 16px', marginBottom: '20px', borderRadius: '10px', background: type === 'success' ? 'rgba(61,191,127,.08)' : 'rgba(224,80,80,.08)', border: `1px solid ${type === 'success' ? 'rgba(61,191,127,.2)' : 'rgba(224,80,80,.2)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '14px' }}>{type === 'success' ? '✓' : '⚠'}</span>
      <p style={{ fontSize: '13px', fontWeight: 600, color: type === 'success' ? '#3DBF7F' : '#E05050' }}>{message}</p>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--dax-text-primary)' }}>{title}</h2>
      <p style={{ fontSize: '13px', color: 'var(--dax-text-muted)' }}>{desc}</p>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMobile,      setIsMobile]      = useState(false);
  const [toast,         setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !activeSection) setActiveSection('profile');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  // ── Contenido de la sección activa ────────────────────────────────────────
  const SectionContent = () => (
    <div className="dax-card" style={{ padding: 'clamp(20px,4vw,32px)', flex: 1 }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {activeSection === 'profile' && (
        <>
          <SectionHeader title="Perfil de usuario" desc="Tu información personal y profesional" />
          <ProfileSection showToast={showToast} />
        </>
      )}

      {activeSection === 'business' && (
        <>
          <SectionHeader title="Datos del negocio" desc="Información de tu empresa en DaxCloud" />
          <BusinessSection showToast={showToast} />
        </>
      )}

      {activeSection === 'plan' && (
        <>
          <SectionHeader title="Plan y suscripción" desc="Gestiona tu plan y facturación" />
          <PlanSection showToast={showToast} />
        </>
      )}

      {activeSection === 'users' && (
        <>
          <SectionHeader title="Usuarios" desc="Gestiona quién tiene acceso a DaxCloud" />
          <UsersSection showToast={showToast} />
        </>
      )}

      {activeSection === 'roles' && (
        <>
          <SectionHeader title="Roles y permisos" desc="Crea roles personalizados para tu equipo" />
          <RolesSection showToast={showToast} />
        </>
      )}

      {activeSection === 'locale' && (
        <>
          <SectionHeader title="Moneda e idioma" desc="Región, formato y preferencias de visualización" />
          <LocaleSection showToast={showToast} />
        </>
      )}

      {activeSection === 'notifications' && (
        <>
          <SectionHeader title="Notificaciones" desc="Configura qué alertas quieres recibir" />
          <NotificationsSection showToast={showToast} />
        </>
      )}

      {activeSection === 'security' && (
        <>
          <SectionHeader title="Seguridad" desc="Contraseña y acceso a tu cuenta" />
          <SecuritySection showToast={showToast} />
        </>
      )}

      {activeSection === 'printing' && (
        <>
          <SectionHeader title="Configuración de impresión" desc="Personaliza tus recibos y tickets" />
          <PrintingSection showToast={showToast} />
        </>
      )}

      {activeSection === 'appearance' && (
        <>
          <SectionHeader title="Apariencia" desc="Personaliza la visualización del sistema" />
          <AppearanceSection showToast={showToast} />
        </>
      )}

      {activeSection === 'data' && (
        <>
          <SectionHeader title="Datos y backups" desc="Exporta y respalda tu información" />
          <DataSection showToast={showToast} />
        </>
      )}
    </div>
  );

  return (
    <div style={{ padding: 'clamp(16px,4vw,40px)', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isMobile && activeSection && (
          <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dax-text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', marginBottom: '4px' }}>
            {isMobile && activeSection ? currentSection?.label : 'Configuración'}
          </h1>
          <p style={{ color: 'var(--dax-text-muted)', fontSize: '13px' }}>
            {isMobile && activeSection ? currentSection?.desc : 'Gestiona tu cuenta y preferencias'}
          </p>
        </div>
      </div>

      {/* ── DESKTOP: sidebar + contenido ── */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Sidebar */}
          <div className="dax-card" style={{ padding: '8px', position: 'sticky', top: '24px' }}>
            {SECTIONS.map(section => {
              const Icon   = section.icon;
              const active = activeSection === section.id;
              return (
                <button key={section.id} onClick={() => setActiveSection(section.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '9px', background: active ? 'rgba(255,92,53,.1)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', marginBottom: '1px' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--dax-surface-2)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <Icon size={14} color={active ? '#FF5C35' : 'var(--dax-text-muted)'} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 400, color: active ? '#FF5C35' : 'var(--dax-text-secondary)', flex: 1 }}>{section.label}</span>
                  {active && <ChevronRight size={13} color="#FF5C35" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Contenido */}
          <SectionContent />
        </div>
      )}

      {/* ── MÓVIL: lista de secciones ── */}
      {isMobile && !activeSection && (
        <div className="dax-card" style={{ padding: '6px' }}>
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <button key={section.id} onClick={() => setActiveSection(section.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i < SECTIONS.length - 1 ? '1px solid var(--dax-border-soft)' : 'none', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--dax-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(255,92,53,.08)', border: '1px solid rgba(255,92,53,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="#FF5C35" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dax-text-primary)', marginBottom: '2px', lineHeight: 1 }}>{section.label}</p>
                  <p style={{ fontSize: '12px', color: 'var(--dax-text-muted)' }}>{section.desc}</p>
                </div>
                <ChevronRight size={15} color="var(--dax-text-muted)" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}

      {/* ── MÓVIL: sección activa ── */}
      {isMobile && activeSection && <SectionContent />}
    </div>
  );
}
