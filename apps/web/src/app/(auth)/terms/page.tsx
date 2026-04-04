import Link from 'next/link';

// ── Logo SVG ──────────────────────────────────────────
function CloudLogo() {
  return (
    <svg width="32" height="24" viewBox="0 0 64 48" fill="none">
      <defs>
        <linearGradient id="termsLogo" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FF8C00"/>
          <stop offset="45%"  stopColor="#FF5C35"/>
          <stop offset="100%" stopColor="#00C8D4"/>
        </linearGradient>
      </defs>
      <path d="M 10 38 Q 2 38 2 29 Q 2 20 10 19 Q 11 11 20 10 Q 25 3 33 4 Q 43 2 46 12 Q 53 12 56 20 Q 62 21 61 30 Q 61 39 53 39 L 10 39 Z" fill="none" stroke="url(#termsLogo)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

const SECTIONS = [
  {
    num: '01', title: 'Definiciones',
    items: [
      { sub: '1.1 Servicio', text: 'DaxCloud es una plataforma SaaS de punto de venta (POS) multi-tenant accesible mediante navegador web y aplicaciones móviles.' },
      { sub: '1.2 Tenant', text: 'Cada empresa u organización que crea una cuenta en DaxCloud constituye un "tenant" con su propio espacio aislado de datos, configuración y usuarios.' },
      { sub: '1.3 Usuario', text: 'Cualquier persona que accede al sistema bajo las credenciales de un tenant, ya sea como administrador, gerente o cajero.' },
      { sub: '1.4 Datos', text: 'Toda información ingresada al sistema incluyendo productos, ventas, inventario, usuarios y configuraciones propias del tenant.' },
    ]
  },
  {
    num: '02', title: 'Uso del servicio',
    items: [
      { sub: '2.1 Elegibilidad', text: 'Para usar DaxCloud debes tener al menos 18 años de edad y capacidad legal para celebrar contratos en tu jurisdicción.' },
      { sub: '2.2 Registro', text: 'Al registrarte eres responsable de proporcionar información veraz, completa y actualizada. Un ID de negocio no puede transferirse una vez creado.' },
      { sub: '2.3 Uso aceptable', text: 'Te comprometes a usar el servicio únicamente para fines comerciales legítimos. Está prohibido usarlo para actividades ilegales o que violen derechos de terceros.' },
      { sub: '2.4 Seguridad de cuenta', text: 'Eres responsable de mantener la confidencialidad de tus credenciales. Debes notificarnos inmediatamente ante cualquier uso no autorizado.' },
    ]
  },
  {
    num: '03', title: 'Planes y pagos',
    items: [
      { sub: '3.1 Planes disponibles', text: 'DaxCloud ofrece tres planes: Starter ($29/mes), Growth ($69/mes) y Scale ($149/mes). Precios en dólares estadounidenses (USD).' },
      { sub: '3.2 Período de prueba', text: 'Todos los planes incluyen 14 días de prueba gratuita sin requerir tarjeta de crédito. Al finalizar, deberás suscribirte para continuar.' },
      { sub: '3.3 Facturación', text: 'Los planes se facturan mensualmente de forma anticipada, el mismo día de cada mes desde el inicio de tu suscripción.' },
      { sub: '3.4 Cancelación', text: 'Puedes cancelar en cualquier momento desde Configuración → Plan. La cancelación es efectiva al final del período actual.' },
      { sub: '3.5 Reembolsos', text: 'No ofrecemos reembolsos por períodos parciales. El servicio permanece activo hasta la fecha de renovación tras cancelar.' },
    ]
  },
  {
    num: '04', title: 'Propiedad de datos',
    items: [
      { sub: '4.1 Tus datos son tuyos', text: 'Todos los datos que ingresas son de tu exclusiva propiedad. DaxCloud no vende, cede ni comparte tus datos con terceros sin tu consentimiento.' },
      { sub: '4.2 Exportación', text: 'Tienes derecho a exportar tus datos en cualquier momento. Los planes Growth y Scale incluyen exportación ilimitada en formato Excel.' },
      { sub: '4.3 Eliminación', text: 'Al cancelar tu cuenta, tus datos se eliminan de nuestros servidores dentro de los 30 días siguientes a la solicitud.' },
    ]
  },
  {
    num: '05', title: 'Disponibilidad del servicio',
    items: [
      { sub: '5.1 Uptime objetivo', text: 'Nos comprometemos a mantener una disponibilidad del 99.5% mensual. El plan Scale incluye SLA con garantía del 99.9%.' },
      { sub: '5.2 Mantenimiento', text: 'Realizamos mantenimientos en horarios de menor tráfico. Te notificaremos con al menos 24 horas de anticipación.' },
      { sub: '5.3 Limitaciones', text: 'No nos hacemos responsables de interrupciones causadas por factores externos como fallas de internet o ataques de terceros.' },
    ]
  },
  {
    num: '06', title: 'Limitación de responsabilidad',
    items: [
      { sub: '6.1 Uso comercial', text: 'DaxCloud es una herramienta de gestión. No somos responsables de decisiones comerciales tomadas en base a los datos del sistema.' },
      { sub: '6.2 Pérdida de datos', text: 'Implementamos copias de seguridad automáticas, pero recomendamos exportaciones periódicas como respaldo adicional.' },
      { sub: '6.3 Monto máximo', text: 'Nuestra responsabilidad total no excederá el monto pagado por el servicio en los últimos 3 meses.' },
    ]
  },
  {
    num: '07', title: 'Modificaciones',
    items: [
      { sub: '7.1 Cambios en el servicio', text: 'Podemos modificar, suspender o descontinuar cualquier aspecto del servicio con previo aviso de 30 días.' },
      { sub: '7.2 Cambios en los términos', text: 'Podemos actualizar estos términos en cualquier momento. El uso continuado del servicio implica la aceptación.' },
    ]
  },
  {
    num: '08', title: 'Legislación aplicable',
    items: [
      { sub: '8.1 Jurisdicción', text: 'Estos términos se rigen por las leyes de la República de Costa Rica. Disputas serán resueltas en los tribunales de San José.' },
      { sub: '8.2 Contacto', text: 'Para consultas legales contáctanos en legal@jacana-dev.com o a través del portal de soporte en jacana-dev.com.' },
    ]
  },
];

export default function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080F1A',
      fontFamily: 'Outfit, system-ui, sans-serif',
      color: '#B8D0E8',
    }}>

      {/* ── Navbar ── */}
      <div style={{
        borderBottom: '1px solid rgba(30,58,95,0.6)',
        padding: '16px clamp(24px, 6vw, 80px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0,
        background: 'rgba(8,15,26,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
      }}>
        <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <CloudLogo />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>Dax</span>
            <span style={{ fontSize: '17px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.02em' }}>cloud</span>
          </div>
        </Link>
        <Link href="/register" style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', color: '#4A7FAF',
          textDecoration: 'none', fontWeight: 600,
          transition: 'color .15s',
        }}>
          ← Volver al registro
        </Link>
      </div>

      {/* ── Contenido ── */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) clamp(24px, 6vw, 40px)' }}>

        {/* Hero */}
        <div style={{ marginBottom: '52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <div style={{ width: '20px', height: '2px', background: '#FF5C35', borderRadius: '1px' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35' }}>
              Legal
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700, color: '#F0F4FF',
            lineHeight: 1.15, marginBottom: '14px',
            letterSpacing: '-.02em',
          }}>
            Términos y condiciones
          </h1>
          <p style={{ fontSize: '13px', color: '#2A5280' }}>
            Última actualización: 31 de marzo de 2026 · Versión 1.0
          </p>
        </div>

        {/* Intro card */}
        <div style={{
          background: 'rgba(22,34,53,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(30,58,95,0.6)',
          borderLeft: '3px solid #FF5C35',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '48px',
        }}>
          <p style={{ fontSize: '14px', color: '#7BBEE8', lineHeight: 1.75 }}>
            Al crear una cuenta en DaxCloud y utilizar nuestros servicios, aceptas estos términos en su totalidad. Si no estás de acuerdo con alguna parte, no debes usar nuestros servicios. DaxCloud es desarrollado y mantenido por{' '}
            <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>
              jacana-dev.com
            </a>.
          </p>
        </div>

        {/* Secciones */}
        {SECTIONS.map((section, si) => (
          <div key={section.num} style={{ marginBottom: '44px' }}>

            {/* Título de sección */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(30,58,95,0.4)',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: '#FF5C35', fontFamily: 'monospace',
                background: 'rgba(255,92,53,.1)',
                border: '1px solid rgba(255,92,53,.2)',
                padding: '3px 8px', borderRadius: '6px',
                letterSpacing: '.06em',
              }}>
                {section.num}
              </span>
              <h2 style={{
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                fontWeight: 700, color: '#F0F4FF',
                letterSpacing: '-.01em', margin: 0,
              }}>
                {section.title}
              </h2>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {section.items.map((item, i) => (
                <div key={i} style={{
                  padding: '16px 20px',
                  background: 'rgba(15,25,36,0.5)',
                  border: '1px solid rgba(30,58,95,0.35)',
                  borderRadius: '12px',
                  transition: 'border-color .15s',
                }}>
                  <p style={{
                    fontSize: '11px', fontWeight: 700,
                    color: '#FF5C35', marginBottom: '6px',
                    letterSpacing: '.04em',
                  }}>
                    {item.sub}
                  </p>
                  <p style={{ fontSize: '13px', color: '#4A7FAF', lineHeight: 1.75, margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(30,58,95,0.4)',
          paddingTop: '28px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '16px',
          marginTop: '8px',
        }}>
          <p style={{ fontSize: '11px', color: '#1E3A5F' }}>
            © 2026 DaxCloud · by{' '}
            <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>
              jacana-dev.com
            </a>
          </p>
          <Link href="/privacy" style={{
            fontSize: '12px', color: '#FF5C35',
            textDecoration: 'none', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'opacity .15s', opacity: .85,
          }}>
            Política de privacidad →
          </Link>
        </div>
      </div>
    </div>
  );
}