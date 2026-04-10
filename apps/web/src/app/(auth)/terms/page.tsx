import Link from 'next/link';

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
      { sub: '1.1 Servicio', text: 'DaxCloud es una plataforma SaaS de punto de venta (POS) multi-tenant accesible mediante navegador web y aplicaciones móviles, desarrollada y mantenida por jacana-dev.com.' },
      { sub: '1.2 Tenant', text: 'Cada empresa u organización que crea una cuenta en DaxCloud constituye un "tenant" con su propio espacio aislado de datos, configuración, sucursales y usuarios.' },
      { sub: '1.3 Usuario', text: 'Cualquier persona que accede al sistema bajo las credenciales de un tenant, ya sea como administrador, gerente o cajero.' },
      { sub: '1.4 Datos', text: 'Toda información ingresada al sistema incluyendo productos, ventas, inventario, imágenes, usuarios, configuraciones y solicitudes de pago propias del tenant.' },
    ]
  },
  {
    num: '02', title: 'Uso del servicio',
    items: [
      { sub: '2.1 Elegibilidad', text: 'Para usar DaxCloud debes tener al menos 18 años de edad y capacidad legal para celebrar contratos en tu jurisdicción.' },
      { sub: '2.2 Registro', text: 'Al registrarte eres responsable de proporcionar información veraz, completa y actualizada. Un ID de negocio no puede transferirse una vez creado.' },
      { sub: '2.3 Uso aceptable', text: 'Te comprometes a usar el servicio únicamente para fines comerciales legítimos. Está prohibido usarlo para actividades ilegales, fraude, o que violen derechos de terceros.' },
      { sub: '2.4 Seguridad de cuenta', text: 'Eres responsable de mantener la confidencialidad de tus credenciales y PIN de acceso al POS. Debes notificarnos inmediatamente ante cualquier uso no autorizado.' },
    ]
  },
  {
    num: '03', title: 'Planes y pagos',
    items: [
      { sub: '3.1 Planes disponibles', text: 'DaxCloud ofrece tres planes: Starter ($19/mes), Growth ($40/mes) y Scale ($60/mes). También están disponibles planes anuales con descuento equivalente a 2 meses gratis. Precios en dólares estadounidenses (USD).' },
      { sub: '3.2 Período de prueba', text: 'Todos los nuevos tenants reciben 15 días de prueba gratuita sin requerir tarjeta de crédito ni método de pago. Al finalizar el período de prueba, deberás activar un plan para continuar usando el servicio.' },
      { sub: '3.3 Método de pago — SINPE Móvil', text: 'DaxCloud acepta pagos mediante SINPE Móvil al número 87905876 (Jacobo Gutiérrez Rodríguez). Al realizar una solicitud de pago, se te asignará una referencia única que deberás incluir en el mensaje de la transferencia.' },
      { sub: '3.4 Proceso de activación', text: 'Una vez realizada la transferencia, debes subir el comprobante de pago desde Settings → Plan o desde la landing de precios. El equipo de DaxCloud verificará el pago y activará tu plan en un plazo máximo de 2 horas hábiles. Recibirás una notificación por correo electrónico al momento de la activación.' },
      { sub: '3.5 Facturación', text: 'Los planes mensuales se renuevan cada 30 días desde la fecha de activación. Los planes anuales tienen una vigencia de 12 meses. Se emite una factura digital por cada pago procesado.' },
      { sub: '3.6 Cancelación', text: 'Puedes cancelar en cualquier momento desde Configuración → Plan. La cancelación es efectiva al final del período actual y no se realizan reembolsos por períodos parciales.' },
      { sub: '3.7 Reembolsos', text: 'No ofrecemos reembolsos por períodos parciales. En caso de error en el pago o cobro duplicado, contáctanos a ventas@daxcloud.shop dentro de los 5 días hábiles siguientes.' },
      { sub: '3.8 Pagos rechazados', text: 'Si un comprobante de pago es rechazado por ser ilegible, incorrecto o fraudulento, se notificará al correo registrado indicando el motivo. El tenant podrá presentar un nuevo comprobante o contactar al soporte.' },
    ]
  },
  {
    num: '04', title: 'Imágenes y archivos',
    items: [
      { sub: '4.1 Subida de archivos', text: 'DaxCloud permite subir imágenes para productos, avatares de usuario y logos de negocio. Los archivos se almacenan en servidores seguros y se sirven a través del dominio daxcloud.shop.' },
      { sub: '4.2 Contenido permitido', text: 'Solo se permiten imágenes en formato JPG, PNG o WebP con un tamaño máximo de 5MB por archivo. El tenant es responsable de tener los derechos sobre las imágenes que sube.' },
      { sub: '4.3 Contenido prohibido', text: 'Está prohibido subir imágenes con contenido ilegal, ofensivo, que viole derechos de autor o que contenga malware. DaxCloud se reserva el derecho de eliminar contenido inapropiado sin previo aviso.' },
    ]
  },
  {
    num: '05', title: 'Propiedad de datos',
    items: [
      { sub: '5.1 Tus datos son tuyos', text: 'Todos los datos que ingresas son de tu exclusiva propiedad. DaxCloud no vende, cede ni comparte tus datos con terceros sin tu consentimiento explícito.' },
      { sub: '5.2 Exportación', text: 'Tienes derecho a exportar tus datos en cualquier momento desde Configuración → Datos. Los planes Growth y Scale incluyen exportación ilimitada en formato Excel.' },
      { sub: '5.3 Eliminación', text: 'Al cancelar tu cuenta, tus datos e imágenes se eliminan de nuestros servidores dentro de los 30 días siguientes a la solicitud formal.' },
    ]
  },
  {
    num: '06', title: 'Funcionalidades del sistema',
    items: [
      { sub: '6.1 POS y caja', text: 'El sistema incluye apertura y cierre de turno de caja. El cajero es responsable de los montos registrados durante su turno. DaxCloud registra automáticamente el desglose por método de pago (efectivo, tarjeta, SINPE y mixto).' },
      { sub: '6.2 Impresión de recibos', text: 'DaxCloud permite configurar la impresión automática de recibos en impresoras térmicas de 58mm y 80mm. La configuración se almacena localmente en el dispositivo del usuario.' },
      { sub: '6.3 Notificaciones', text: 'El sistema envía notificaciones automáticas sobre stock bajo, metas de ventas y alertas del sistema. El tenant puede configurar qué notificaciones desea recibir desde Configuración → Notificaciones.' },
      { sub: '6.4 Multi-industria', text: 'DaxCloud adapta su interfaz y módulos según el tipo de industria configurada (restaurante, farmacia, panadería, ropa, etc.). El cambio de industria puede implicar un costo adicional según el plan.' },
    ]
  },
  {
    num: '07', title: 'Disponibilidad del servicio',
    items: [
      { sub: '7.1 Uptime objetivo', text: 'Nos comprometemos a mantener una disponibilidad del 99.5% mensual. El plan Scale incluye SLA con garantía del 99.9%.' },
      { sub: '7.2 Mantenimiento', text: 'Realizamos mantenimientos en horarios de menor tráfico. Te notificaremos con al menos 24 horas de anticipación salvo en casos de emergencia.' },
      { sub: '7.3 Limitaciones', text: 'No nos hacemos responsables de interrupciones causadas por factores externos como fallas de internet, cortes eléctricos o ataques de terceros.' },
    ]
  },
  {
    num: '08', title: 'Limitación de responsabilidad',
    items: [
      { sub: '8.1 Uso comercial', text: 'DaxCloud es una herramienta de gestión. No somos responsables de decisiones comerciales, fiscales o contables tomadas en base a los datos del sistema.' },
      { sub: '8.2 Pérdida de datos', text: 'Implementamos copias de seguridad automáticas, pero recomendamos realizar exportaciones periódicas como respaldo adicional.' },
      { sub: '8.3 Monto máximo', text: 'Nuestra responsabilidad total no excederá el monto pagado por el servicio en los últimos 3 meses.' },
    ]
  },
  {
    num: '09', title: 'Modificaciones',
    items: [
      { sub: '9.1 Cambios en el servicio', text: 'Podemos modificar, suspender o descontinuar cualquier aspecto del servicio con previo aviso de 30 días, excepto en casos de fuerza mayor o seguridad.' },
      { sub: '9.2 Cambios en los términos', text: 'Podemos actualizar estos términos en cualquier momento. El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.' },
      { sub: '9.3 Cambios en precios', text: 'Cualquier cambio en los precios de los planes se notificará con al menos 30 días de anticipación. Los planes activos se mantendrán al precio vigente hasta su renovación.' },
    ]
  },
  {
    num: '10', title: 'Legislación aplicable',
    items: [
      { sub: '10.1 Jurisdicción', text: 'Estos términos se rigen por las leyes de la República de Costa Rica. Disputas serán resueltas en los tribunales competentes de San José, Costa Rica.' },
      { sub: '10.2 Contacto legal', text: 'Para consultas legales contáctanos en ventas@daxcloud.shop o a través del portal en jacana-dev.com.' },
      { sub: '10.3 Idioma', text: 'En caso de discrepancia entre versiones en distintos idiomas, prevalece la versión en español.' },
    ]
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080F1A', fontFamily: 'Outfit, system-ui, sans-serif', color: '#B8D0E8' }}>

      {/* Navbar */}
      <div style={{ borderBottom: '1px solid rgba(30,58,95,0.6)', padding: '16px clamp(24px, 6vw, 80px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,15,26,0.85)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <CloudLogo />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '-.02em' }}>Dax</span>
            <span style={{ fontSize: '17px', fontWeight: 300, color: '#FF5C35', letterSpacing: '-.02em' }}>cloud</span>
          </div>
        </Link>
        <Link href="/" style={{ fontSize: '12px', color: '#4A7FAF', textDecoration: 'none', fontWeight: 600 }}>
          ← Volver al inicio
        </Link>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) clamp(24px, 6vw, 40px)' }}>

        {/* Hero */}
        <div style={{ marginBottom: '52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <div style={{ width: '20px', height: '2px', background: '#FF5C35', borderRadius: '1px' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF5C35' }}>Legal</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: '#F0F4FF', lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-.02em' }}>
            Términos y condiciones
          </h1>
          <p style={{ fontSize: '13px', color: '#2A5280' }}>
            Última actualización: 10 de abril de 2026 · Versión 2.0
          </p>
        </div>

        {/* Intro card */}
        <div style={{ background: 'rgba(22,34,53,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(30,58,95,0.6)', borderLeft: '3px solid #FF5C35', borderRadius: '14px', padding: '20px 24px', marginBottom: '48px' }}>
          <p style={{ fontSize: '14px', color: '#7BBEE8', lineHeight: 1.75 }}>
            Al crear una cuenta en DaxCloud y utilizar nuestros servicios, aceptas estos términos en su totalidad. Si no estás de acuerdo con alguna parte, no debes usar nuestros servicios. DaxCloud es desarrollado y mantenido por{' '}
            <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>jacana-dev.com</a>.
            Para soporte o consultas escríbenos a{' '}
            <a href="mailto:ventas@daxcloud.shop" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>ventas@daxcloud.shop</a>.
          </p>
        </div>

        {/* Secciones */}
        {SECTIONS.map((section) => (
          <div key={section.num} style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(30,58,95,0.4)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF5C35', fontFamily: 'monospace', background: 'rgba(255,92,53,.1)', border: '1px solid rgba(255,92,53,.2)', padding: '3px 8px', borderRadius: '6px', letterSpacing: '.06em' }}>
                {section.num}
              </span>
              <h2 style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', fontWeight: 700, color: '#F0F4FF', letterSpacing: '-.01em', margin: 0 }}>
                {section.title}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {section.items.map((item, i) => (
                <div key={i} style={{ padding: '16px 20px', background: 'rgba(15,25,36,0.5)', border: '1px solid rgba(30,58,95,0.35)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#FF5C35', marginBottom: '6px', letterSpacing: '.04em' }}>{item.sub}</p>
                  <p style={{ fontSize: '13px', color: '#4A7FAF', lineHeight: 1.75, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(30,58,95,0.4)', paddingTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
          <p style={{ fontSize: '11px', color: '#1E3A5F' }}>
            © {new Date().getFullYear()} DaxCloud · by{' '}
            <a href="https://jacana-dev.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>jacana-dev.com</a>
          </p>
          <Link href="/privacy" style={{ fontSize: '12px', color: '#FF5C35', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Política de privacidad →
          </Link>
        </div>
      </div>
    </div>
  );
}
