import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', fontFamily: 'Outfit, sans-serif', color: '#D0D0D0' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #1E1E1E', padding: '20px clamp(24px, 6vw, 80px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0F0F0F', zIndex: 10 }}>
        <Link href="/register">
          <svg width="120" height="30" viewBox="0 0 280 72" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="36" width="62" height="24" rx="10" fill="#FF5C35"/>
            <circle cx="17" cy="36" r="12" fill="#FF5C35"/>
            <circle cx="44" cy="36" r="18" fill="#FF5C35"/>
            <circle cx="30" cy="36" r="20" fill="#FF5C35"/>
            <text x="76" y="56" fontFamily="Outfit,sans-serif" fontWeight="700" fontSize="34" fill="#FFFFFF" letterSpacing="-0.5">Dax</text>
            <text x="157" y="56" fontFamily="Outfit,sans-serif" fontWeight="300" fontSize="34" fill="#FF5C35" letterSpacing="-0.5">cloud</text>
          </svg>
        </Link>
        <Link href="/register" style={{ fontSize: '13px', color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>
          ← Volver al registro
        </Link>
      </div>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) clamp(24px, 6vw, 40px)' }}>

        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF5C35', marginBottom: '12px' }}>Legal</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '16px' }}>
            Política de privacidad
          </h1>
          <p style={{ fontSize: '14px', color: '#555' }}>Última actualización: 31 de marzo de 2026 · Versión 1.0</p>
        </div>

        <div style={{ background: '#161616', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px', marginBottom: '40px', borderLeft: '3px solid #3DBF7F' }}>
          <p style={{ fontSize: '14px', color: '#999', lineHeight: 1.7 }}>
            En DaxCloud nos comprometemos a proteger tu privacidad y la de tu negocio. Esta política explica qué información recopilamos, cómo la usamos y los derechos que tienes sobre ella. DaxCloud es desarrollado por <strong style={{ color: '#FF5C35' }}>jacana-dev.com</strong>, con sede en Costa Rica.
          </p>
        </div>

        {/* Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '40px' }}>
          {[
            { icon: '🔒', title: 'Datos encriptados', desc: 'Toda la información se transmite con TLS y se almacena encriptada.' },
            { icon: '🚫', title: 'Sin venta de datos', desc: 'Nunca vendemos ni compartimos tus datos comerciales con terceros.' },
            { icon: '📤', title: 'Exportación libre', desc: 'Puedes exportar o eliminar tus datos en cualquier momento.' },
            { icon: '🌎', title: 'GDPR compatible', desc: 'Cumplimos con estándares internacionales de protección de datos.' },
          ].map(h => (
            <div key={h.title} style={{ background: '#161616', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '20px', display: 'block', marginBottom: '8px' }}>{h.icon}</span>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{h.title}</p>
              <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{h.desc}</p>
            </div>
          ))}
        </div>

        {[
          {
            num: '01', title: 'Información que recopilamos',
            content: [
              { subtitle: 'Datos de registro', text: 'Al crear tu cuenta recopilamos: nombre completo, correo electrónico, nombre del negocio, país, industria y contraseña (almacenada con hash bcrypt, nunca en texto plano).' },
              { subtitle: 'Datos operativos', text: 'Los datos que ingresas al usar DaxCloud: productos, precios, inventario, ventas, clientes, sucursales y usuarios. Estos datos son de tu propiedad exclusiva.' },
              { subtitle: 'Datos de uso', text: 'Información técnica sobre cómo usas el sistema: páginas visitadas, funciones utilizadas, errores encontrados. Usamos esta información para mejorar el producto.' },
              { subtitle: 'Datos de pago', text: 'Los pagos se procesan a través de Stripe. No almacenamos números de tarjeta completos — únicamente los últimos 4 dígitos y la marca de la tarjeta para referencia.' },
            ]
          },
          {
            num: '02', title: 'Cómo usamos tu información',
            content: [
              { subtitle: 'Prestación del servicio', text: 'Usamos tus datos para operar DaxCloud: autenticar usuarios, procesar transacciones, generar reportes y mantener el funcionamiento del sistema.' },
              { subtitle: 'Comunicaciones', text: 'Te enviamos correos relacionados con tu cuenta: confirmaciones, alertas de seguridad, facturas y notificaciones que hayas activado. No enviamos publicidad sin tu consentimiento.' },
              { subtitle: 'Mejora del producto', text: 'Analizamos patrones de uso de forma agregada y anónima para identificar áreas de mejora. Nunca analizamos el contenido específico de tus datos comerciales.' },
              { subtitle: 'Cumplimiento legal', text: 'Podemos compartir información si así lo requiere una orden judicial o normativa aplicable, en cuyo caso te notificaremos previamente salvo prohibición legal expresa.' },
            ]
          },
          {
            num: '03', title: 'Almacenamiento y seguridad',
            content: [
              { subtitle: 'Ubicación de datos', text: 'Tus datos se almacenan en servidores ubicados en la región de América (AWS us-east-1 o equivalente). Para clientes europeos podemos ofrecer almacenamiento en la UE bajo solicitud.' },
              { subtitle: 'Medidas de seguridad', text: 'Implementamos: encriptación TLS en tránsito, encriptación en reposo, backups automáticos diarios, control de acceso basado en roles, y monitoreo continuo de seguridad.' },
              { subtitle: 'Acceso interno', text: 'El acceso a datos de producción está estrictamente limitado al personal técnico autorizado y únicamente para fines de soporte o mantenimiento, siempre con registro de auditoría.' },
              { subtitle: 'Retención', text: 'Conservamos tus datos mientras tu cuenta esté activa. Tras la cancelación, los datos se eliminan definitivamente dentro de los 30 días siguientes a tu solicitud.' },
            ]
          },
          {
            num: '04', title: 'Tus derechos',
            content: [
              { subtitle: 'Derecho de acceso', text: 'Puedes solicitar en cualquier momento un informe completo de los datos que tenemos sobre tu cuenta y negocio.' },
              { subtitle: 'Derecho de rectificación', text: 'Puedes corregir o actualizar tus datos directamente desde Configuración → Perfil y Configuración → Negocio.' },
              { subtitle: 'Derecho de exportación', text: 'Puedes exportar todos tus datos en formato Excel desde Configuración → Datos y backups en cualquier momento.' },
              { subtitle: 'Derecho de eliminación', text: 'Puedes solicitar la eliminación completa de tu cuenta y todos sus datos enviando un correo a privacidad@jacana-dev.com desde el correo registrado.' },
              { subtitle: 'Derecho de oposición', text: 'Puedes desactivar comunicaciones de marketing en cualquier momento desde tu perfil o usando el enlace de baja en cualquier correo que te enviemos.' },
            ]
          },
          {
            num: '05', title: 'Cookies y tecnologías similares',
            content: [
              { subtitle: 'Cookies esenciales', text: 'Usamos cookies estrictamente necesarias para el funcionamiento del sistema: sesión autenticada, preferencias de idioma y configuración de interfaz.' },
              { subtitle: 'Cookies analíticas', text: 'Con tu consentimiento, usamos herramientas de análisis anónimo para entender cómo se usa el sistema. Puedes desactivar esto en la configuración de tu navegador.' },
              { subtitle: 'Sin cookies de publicidad', text: 'No usamos cookies de seguimiento publicitario ni compartimos información con redes de anuncios. DaxCloud es libre de publicidad.' },
            ]
          },
          {
            num: '06', title: 'Servicios de terceros',
            content: [
              { subtitle: 'Stripe', text: 'Procesador de pagos. Está sujeto a su propia política de privacidad en stripe.com/privacy. Es certificado PCI-DSS nivel 1.' },
              { subtitle: 'AWS', text: 'Infraestructura de servidores en la nube. Los datos se procesan bajo acuerdos de confidencialidad y cumplimiento GDPR.' },
              { subtitle: 'Sin integraciones publicitarias', text: 'No integramos Facebook Pixel, Google Ads, ni ninguna herramienta de rastreo publicitario. Tus datos comerciales nunca alimentan sistemas de publicidad.' },
            ]
          },
          {
            num: '07', title: 'Contacto y reclamaciones',
            content: [
              { subtitle: 'Responsable de datos', text: 'jacana-dev.com, San José, Costa Rica. Correo: privacidad@jacana-dev.com' },
              { subtitle: 'Tiempo de respuesta', text: 'Respondemos solicitudes relacionadas con privacidad dentro de los 5 días hábiles siguientes a la recepción.' },
              { subtitle: 'Actualizaciones de esta política', text: 'Te notificaremos por correo electrónico con al menos 30 días de anticipación ante cambios sustanciales en esta política de privacidad.' },
            ]
          },
        ].map(section => (
          <div key={section.num} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#3DBF7F', fontFamily: 'monospace' }}>{section.num}</span>
              <h2 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 700, color: '#fff' }}>{section.title}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {section.content.map((item, i) => (
                <div key={i} style={{ padding: '18px 20px', background: '#161616', borderRadius: '10px', border: '1px solid #1E1E1E' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#3DBF7F', marginBottom: '6px', letterSpacing: '.04em' }}>{item.subtitle}</p>
                  <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.7 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #1E1E1E', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ fontSize: '12px', color: '#444' }}>© 2026 DaxCloud · by jacana-dev.com</p>
          <Link href="/terms" style={{ fontSize: '13px', color: '#FF5C35', textDecoration: 'none', fontWeight: 600 }}>
            Términos y condiciones →
          </Link>
        </div>
      </div>
    </div>
  );
}