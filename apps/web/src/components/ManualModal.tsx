'use client';
import { useState, useEffect, useRef } from 'react';
import {
  X, BookOpen, ShoppingCart, Package, BarChart2, Users, Settings,
  Building2, ChefHat, Pill, Scissors, Shirt, Leaf, ShoppingBag,
  CreditCard, Smartphone, Globe, Bell, Shield, Zap, ArrowRight,
  ChevronRight, Search, Hash, TrendingUp, Clock, Star, HelpCircle,
  Monitor, Layers, RefreshCw, Download, Printer, UserCheck,
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Section {
  id: string;
  icon: any;
  label: string;
  color: string;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  content: React.ReactNode;
}

// ── Componentes internos ──────────────────────────────────────────────────────
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={{ display:'flex', gap:'14px', alignItems:'flex-start', padding:'14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px' }}>
      <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'12px', fontWeight:800, color:'#fff' }}>{n}</div>
      <div>
        <p style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:'4px' }}>{title}</p>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', gap:'10px', padding:'12px 14px', background:'rgba(255,92,53,0.06)', border:'1px solid rgba(255,92,53,0.18)', borderRadius:'10px', marginTop:'12px' }}>
      <Star size={14} color="#FF5C35" style={{ flexShrink:0, marginTop:'1px' }} />
      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', lineHeight:1.65 }}>{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', gap:'10px', padding:'12px 14px', background:'rgba(90,170,240,0.06)', border:'1px solid rgba(90,170,240,0.15)', borderRadius:'10px', marginTop:'12px' }}>
      <HelpCircle size={14} color="#5AAAF0" style={{ flexShrink:0, marginTop:'1px' }} />
      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.65 }}>{children}</p>
    </div>
  );
}

function KeyVal({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{k}</span>
      <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.75)' }}>{v}</span>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', marginTop:'12px' }}>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${headers.length},1fr)`, background:'rgba(255,255,255,0.04)', padding:'10px 14px' }}>
        {headers.map(h => <span key={h} style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.7)' }}>{h}</span>)}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:`repeat(${headers.length},1fr)`, padding:'10px 14px', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          {row.map((cell, j) => <span key={j} style={{ fontSize:'12px', color: j===0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)', fontWeight: j===0 ? 600 : 400 }}>{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:`${color}15`, border:`1px solid ${color}30`, color }}>{label}</span>;
}

// ── Contenido del manual ──────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: 'inicio',
    icon: BookOpen,
    label: 'Introducción',
    color: '#FF5C35',
    chapters: [
      {
        id: 'que-es',
        title: '¿Qué es DaxCloud?',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.6)', lineHeight:1.85 }}>
              DaxCloud es un sistema POS (Point of Sale) basado en la nube, diseñado específicamente para negocios de América Latina. Permite gestionar ventas, inventario, clientes y reportes desde cualquier dispositivo con conexión a internet.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
              {[
                { icon:Monitor, title:'100% en la nube', desc:'Accede desde cualquier dispositivo sin instalaciones' },
                { icon:Globe,   title:'Multi-sucursal',  desc:'Gestiona varias sedes desde un solo panel' },
                { icon:Zap,     title:'Tiempo real',     desc:'Ventas, stock y notificaciones al instante' },
                { icon:Shield,  title:'Seguro',          desc:'Datos encriptados y respaldo automático' },
              ].map(({ icon:Icon, title, desc }) => (
                <div key={title} style={{ padding:'14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                    <Icon size={14} color="#FF5C35"/>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{title}</span>
                  </div>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
            <Tip>DaxCloud funciona en cualquier navegador moderno. Recomendamos Chrome o Edge para la mejor experiencia.</Tip>
          </div>
        ),
      },
      {
        id: 'primeros-pasos',
        title: 'Primeros pasos',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:'4px' }}>Sigue estos pasos para configurar tu negocio en menos de 5 minutos:</p>
            <Step n={1} title="Crea tu cuenta" desc="Regístrate en daxcloud.shop con el nombre de tu negocio, correo y contraseña. Elige tu industria para activar el módulo correcto."/>
            <Step n={2} title="Configura tu sucursal" desc="Ve a Configuración → Sucursales y agrega el nombre y dirección de tu tienda principal."/>
            <Step n={3} title="Agrega tus productos" desc="En Productos → Nuevo producto, ingresa nombre, precio, costo y categoría. Puedes importar desde Excel."/>
            <Step n={4} title="Configura el inventario" desc="Establece el stock inicial de cada producto y configura los mínimos para alertas automáticas."/>
            <Step n={5} title="¡Empieza a vender!" desc="Ve al módulo POS, agrega productos al carrito, selecciona el método de pago y procesa tu primera venta."/>
            <Note>Los 14 días de prueba incluyen todas las funciones del plan Growth. No se requiere tarjeta de crédito.</Note>
          </div>
        ),
      },
      {
        id: 'planes',
        title: 'Planes y precios',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'16px' }}>
            <Table
              headers={['Plan','Precio','Sucursales','Usuarios']}
              rows={[
                ['Starter','$19/mes','1','3'],
                ['Growth','$40/mes','3','15'],
                ['Scale','$60/mes','Ilimitadas','Ilimitados'],
              ]}
            />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div style={{ padding:'14px', background:'rgba(61,191,127,0.05)', border:'1px solid rgba(61,191,127,0.15)', borderRadius:'12px' }}>
                <p style={{ fontSize:'11px', color:'rgba(61,191,127,0.7)', fontWeight:700, marginBottom:'6px' }}>Facturación anual</p>
                <p style={{ fontSize:'20px', fontWeight:800, color:'#3DBF7F' }}>2 meses gratis</p>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'4px' }}>Ahorra hasta $120/año</p>
              </div>
              <div style={{ padding:'14px', background:'rgba(255,92,53,0.05)', border:'1px solid rgba(255,92,53,0.15)', borderRadius:'12px' }}>
                <p style={{ fontSize:'11px', color:'rgba(255,92,53,0.7)', fontWeight:700, marginBottom:'6px' }}>Módulos especiales</p>
                <p style={{ fontSize:'20px', fontWeight:800, color:'#FF5C35' }}>+$22/mes</p>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'4px' }}>Por industria especializada</p>
              </div>
            </div>
            <Tip>El plan Growth es el más popular y cubre la mayoría de negocios en crecimiento. Incluye módulos de industria, analytics avanzado y multi-sucursal.</Tip>
          </div>
        ),
      },
    ],
  },
  {
    id: 'pos',
    icon: ShoppingCart,
    label: 'Punto de Venta',
    color: '#FF5C35',
    chapters: [
      {
        id: 'pos-interface',
        title: 'Interfaz del POS',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El POS está dividido en tres áreas principales:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { area:'Panel lateral izquierdo', desc:'Navegación entre módulos, resumen del día y datos de la sucursal activa', color:'#FF5C35' },
                { area:'Área de productos',        desc:'Búsqueda, filtros por categoría y cuadrícula de productos disponibles', color:'#5AAAF0' },
                { area:'Carrito / Orden',          desc:'Productos seleccionados, cantidades, descuentos, método de pago y botón de cobro', color:'#3DBF7F' },
              ].map(({ area, desc, color }) => (
                <div key={area} style={{ display:'flex', gap:'12px', padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                  <div style={{ width:'4px', borderRadius:'2px', background:color, flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{area}</p>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Note>En dispositivos móviles, el panel lateral se oculta automáticamente para maximizar el espacio de productos.</Note>
          </div>
        ),
      },
      {
        id: 'pos-venta',
        title: 'Procesar una venta',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
            <Step n={1} title="Selecciona productos" desc="Toca o haz clic en un producto para agregarlo al carrito. Toca varias veces para aumentar la cantidad."/>
            <Step n={2} title="Ajusta cantidades" desc="En el carrito, usa los botones + y − para modificar cantidades o toca el ítem para editarlo."/>
            <Step n={3} title="Aplica descuento (opcional)" desc="Toca el ícono de porcentaje en el carrito para aplicar descuento por ítem o descuento global."/>
            <Step n={4} title="Selecciona método de pago" desc="Elige entre Efectivo, SINPE, Tarjeta o Mixto. Para efectivo, ingresa el monto recibido para calcular el cambio."/>
            <Step n={5} title="Procesa el cobro" desc="Toca Cobrar. La venta se registra, el inventario se actualiza y puedes imprimir o enviar el recibo."/>
            <Tip>Las ventas en modo Mixto permiten dividir el pago entre efectivo y tarjeta en cualquier combinación.</Tip>
          </div>
        ),
      },
      {
        id: 'pos-metodos',
        title: 'Métodos de pago',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { icon:CreditCard,  label:'Efectivo',       desc:'Cálculo automático del cambio. Registro en caja.', badge:'Disponible siempre', bColor:'#3DBF7F' },
                { icon:Smartphone,  label:'SINPE Móvil',    desc:'Solo Costa Rica. Confirmación manual por el cajero.', badge:'Solo CR', bColor:'#5AAAF0' },
                { icon:CreditCard,  label:'Tarjeta',        desc:'Visa/Mastercard vía terminal físico. Registro manual.', badge:'Manual', bColor:'#F0A030' },
                { icon:Layers,      label:'Mixto',          desc:'Combina dos métodos en una misma venta.', badge:'Flexible', bColor:'#A78BFA' },
              ].map(({ icon:Icon, label, desc, badge, bColor }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${bColor}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${bColor}20` }}>
                    <Icon size={16} color={bColor}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'2px' }}>{label}</p>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{desc}</p>
                  </div>
                  <Badge label={badge} color={bColor}/>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'pos-recibos',
        title: 'Recibos e impresión',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Después de cada venta puedes generar el comprobante de tres formas:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { icon:Printer,  title:'Impresión térmica',    desc:'Compatible con impresoras POS de 58mm y 80mm por USB, Bluetooth o red.' },
                { icon:Download, title:'Descargar PDF',        desc:'Genera un recibo en PDF para enviar por correo o WhatsApp.' },
                { icon:Monitor,  title:'Recibo en pantalla',   desc:'Muestra el comprobante en pantalla para que el cliente lo fotografíe.' },
              ].map(({ icon:Icon, title, desc }) => (
                <div key={title} style={{ display:'flex', gap:'12px', padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                  <Icon size={16} color="#FF5C35" style={{ flexShrink:0, marginTop:'1px' }}/>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{title}</p>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Note>Configura el encabezado del recibo (logo, nombre, dirección, IBAN) en Configuración → Empresa.</Note>
          </div>
        ),
      },
    ],
  },
  {
    id: 'inventario',
    icon: Package,
    label: 'Inventario',
    color: '#5AAAF0',
    chapters: [
      {
        id: 'inv-productos',
        title: 'Gestión de productos',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Cada producto en DaxCloud tiene los siguientes campos:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'4px' }}>
              <KeyVal k="Nombre" v="Nombre visible en el POS"/>
              <KeyVal k="SKU" v="Código único de identificación"/>
              <KeyVal k="Precio de venta" v="Precio al cliente (con impuestos)"/>
              <KeyVal k="Costo" v="Precio de compra (para calcular margen)"/>
              <KeyVal k="Categoría" v="Para filtros en el POS"/>
              <KeyVal k="Stock mínimo" v="Umbral para alertas de stock bajo"/>
              <KeyVal k="Imagen" v="Foto del producto en el POS"/>
              <KeyVal k="Código de barras" v="Para escaneo con lector"/>
            </div>
            <Tip>Importa productos masivamente desde Excel con la plantilla disponible en Productos → Importar. El archivo debe incluir: nombre, precio, costo, SKU y categoría.</Tip>
          </div>
        ),
      },
      {
        id: 'inv-stock',
        title: 'Control de stock',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El inventario se actualiza automáticamente con cada venta. También puedes ajustarlo manualmente:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { badge:'Entrada',    color:'#3DBF7F', desc:'Registra compras a proveedores o reposición de stock.' },
                { badge:'Salida',     color:'#E05050', desc:'Ajuste manual por pérdida, merma o daño de productos.' },
                { badge:'Ajuste',     color:'#F0A030', desc:'Corrección de inventario después de conteo físico.' },
                { badge:'Traslado',   color:'#5AAAF0', desc:'Mover stock entre sucursales (plan Growth o superior).' },
              ].map(({ badge, color, desc }) => (
                <div key={badge} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                  <Badge label={badge} color={color}/>
                  <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
            <Note>Los estados de stock son: OK (stock normal), Bajo (llegó al mínimo), Agotado (0 unidades) y Sobrestock (exceso configurado).</Note>
          </div>
        ),
      },
      {
        id: 'inv-alertas',
        title: 'Alertas automáticas',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>DaxCloud genera notificaciones automáticas para mantener tu inventario bajo control:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { icon:Bell, title:'Stock bajo',      color:'#F0A030', desc:'Se activa cuando un producto llega a su stock mínimo configurado.' },
                { icon:Bell, title:'Producto agotado', color:'#E05050', desc:'Notificación inmediata cuando el stock llega a cero.' },
                { icon:Bell, title:'Lote por vencer',  color:'#A78BFA', desc:'Para farmacia y verdulería, alerta de productos próximos a vencer.' },
              ].map(({ icon:Icon, title, color, desc }) => (
                <div key={title} style={{ display:'flex', gap:'12px', padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                  <Icon size={15} color={color} style={{ flexShrink:0, marginTop:'1px' }}/>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{title}</p>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Tip>Configura el stock mínimo de cada producto en Productos → Editar → Stock mínimo. Por defecto es 5 unidades.</Tip>
          </div>
        ),
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart2,
    label: 'Analytics',
    color: '#3DBF7F',
    chapters: [
      {
        id: 'analytics-dashboard',
        title: 'Dashboard principal',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El dashboard muestra en tiempo real los indicadores más importantes de tu negocio:</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {[
                { label:'Ventas del día',    value:'Ingresos totales de hoy', color:'#FF5C35' },
                { label:'Transacciones',     value:'Cantidad de ventas', color:'#5AAAF0' },
                { label:'Ticket promedio',   value:'Venta promedio por cliente', color:'#3DBF7F' },
                { label:'Horas pico',        value:'Mapa de calor por hora', color:'#F0A030' },
                { label:'Top productos',     value:'Los más vendidos del período', color:'#A78BFA' },
                { label:'Métodos de pago',   value:'Distribución por tipo', color:'#FF5C35' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding:'12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                  <p style={{ fontSize:'11px', fontWeight:700, color, marginBottom:'3px' }}>{label}</p>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{value}</p>
                </div>
              ))}
            </div>
            <Note>Puedes filtrar el dashboard por sucursal, período (hoy, semana, mes, año) y comparar con períodos anteriores.</Note>
          </div>
        ),
      },
      {
        id: 'analytics-reportes',
        title: 'Reportes y exportación',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Exporta tus reportes en Excel para análisis externos o contabilidad:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { title:'Reporte de ventas',      desc:'Detalle de todas las transacciones con método de pago, cajero y productos.' },
                { title:'Reporte de inventario',  desc:'Estado actual del stock, movimientos y valorización del inventario.' },
                { title:'Reporte de clientes',    desc:'Historial de compras, puntos acumulados y saldo de crédito.' },
                { title:'Reporte de caja',        desc:'Apertura, cierres, entradas y salidas de efectivo.' },
              ].map(({ title, desc }) => (
                <div key={title} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                  <Download size={14} color="#3DBF7F" style={{ flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.75)', marginBottom:'2px' }}>{title}</p>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Tip>Los reportes se generan en segundo plano. Cuando estén listos recibirás una notificación y el archivo estará disponible para descarga.</Tip>
          </div>
        ),
      },
    ],
  },
  {
    id: 'clientes',
    icon: Users,
    label: 'Clientes',
    color: '#A78BFA',
    chapters: [
      {
        id: 'clientes-perfil',
        title: 'Perfil del cliente',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Cada cliente tiene un perfil completo con:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'4px' }}>
              <KeyVal k="Nombre y contacto" v="Teléfono, correo y dirección"/>
              <KeyVal k="Historial de compras" v="Todas las transacciones registradas"/>
              <KeyVal k="Crédito interno" v="Saldo disponible y límite de crédito"/>
              <KeyVal k="Puntos de fidelización" v="Puntos acumulados y canjeados"/>
              <KeyVal k="Código de cliente" v="Para búsqueda rápida en el POS"/>
            </div>
            <Tip>Busca clientes en el POS por nombre, teléfono o código para aplicar crédito o acumular puntos automáticamente en cada venta.</Tip>
          </div>
        ),
      },
      {
        id: 'clientes-fidelizacion',
        title: 'Fidelización y crédito',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { icon:Star,       title:'Puntos de fidelización', color:'#F0A030', desc:'Configura cuántos puntos se otorgan por cada ₡1,000 vendidos. Los puntos se canjean en futuras compras.' },
                { icon:CreditCard, title:'Crédito interno',        color:'#5AAAF0', desc:'Asigna un límite de crédito al cliente. Puede comprar a cuenta y pagar después.' },
                { icon:TrendingUp, title:'Historial de compras',   color:'#3DBF7F', desc:'Ve el valor total comprado, frecuencia de visitas y productos favoritos.' },
              ].map(({ icon:Icon, title, color, desc }) => (
                <div key={title} style={{ display:'flex', gap:'12px', padding:'13px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={16} color={color}/>
                  </div>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'4px' }}>{title}</p>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.55 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'industrias',
    icon: Building2,
    label: 'Módulos de industria',
    color: '#F0A030',
    chapters: [
      {
        id: 'ind-restaurante',
        title: 'Restaurante',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(240,160,48,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ChefHat size={18} color="#F0A030"/>
              </div>
              <div>
                <p style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>Módulo Restaurante</p>
                <p style={{ fontSize:'11px', color:'rgba(240,160,48,0.7)' }}>Gestión completa de comedor</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {['Mesas y zonas','Comandas de cocina','Reservaciones','Happy Hour','Delivery','Combos','Splits de cuenta','Caja de turnos'].map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#F0A030', flexShrink:0 }}/>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>{f}</span>
                </div>
              ))}
            </div>
            <Note>El módulo de restaurante requiere configurar las mesas desde Configuración → Mesas antes de usarlo en el POS.</Note>
          </div>
        ),
      },
      {
        id: 'ind-panaderia',
        title: 'Panadería / Pastelería',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,92,53,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ChefHat size={18} color="#FF5C35"/>
              </div>
              <div>
                <p style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>Módulo Panadería</p>
                <p style={{ fontSize:'11px', color:'rgba(255,92,53,0.7)' }}>Control de producción y encargos</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'8px' }}>
              {[
                { tab:'Dashboard',   desc:'Resumen de producción del día, ventas y mermas' },
                { tab:'Producción',  desc:'Registro de hornadas con turno, cantidad y estado' },
                { tab:'Mermas',      desc:'Control de productos quemados, caducados o dañados' },
                { tab:'Recetas',     desc:'Ingredientes, costos y rendimiento por producto' },
                { tab:'Encargos',    desc:'Pedidos a futuro con fecha de entrega y adelanto' },
                { tab:'Proveedores', desc:'Registro de proveedores de insumos' },
              ].map(({ tab, desc }) => (
                <div key={tab} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'9px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'9px' }}>
                  <Badge label={tab} color="#FF5C35"/>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'ind-farmacia',
        title: 'Farmacia',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(61,191,127,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Pill size={18} color="#3DBF7F"/>
              </div>
              <div>
                <p style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>Módulo Farmacia</p>
                <p style={{ fontSize:'11px', color:'rgba(61,191,127,0.7)' }}>Control de medicamentos y lotes</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {['Lotes y vencimientos','Recetas médicas','Control CCSS','Genéricos vs marca','Alertas de caducidad','Historial paciente'].map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#3DBF7F', flexShrink:0 }}/>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'ind-otros',
        title: 'Otros módulos',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px' }}>
            {[
              { icon:Scissors, title:'Peluquería / Salón', color:'#A78BFA', features:['Agenda de citas','Servicios por empleado','Comisiones','Historial del cliente'] },
              { icon:Shirt,    title:'Ropa / Moda',        color:'#5AAAF0', features:['Tallas y colores','Colecciones','Temporadas','Devoluciones'] },
              { icon:Leaf,     title:'Verdulería',         color:'#3DBF7F', features:['Venta por peso','Control de frescura','Lotes','Temporadas'] },
              { icon:ShoppingBag, title:'Supermercado',   color:'#F0A030', features:['Código de barras','Precios por volumen','Cajas múltiples','Proveedores'] },
            ].map(({ icon:Icon, title, color, features }) => (
              <div key={title} style={{ padding:'14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}18`, borderRadius:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={14} color={color}/>
                  </div>
                  <p style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{title}</p>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'5px' }}>
                  {features.map(f => <Badge key={f} label={f} color={color}/>)}
                </div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: 'configuracion',
    icon: Settings,
    label: 'Configuración',
    color: '#5AAAF0',
    chapters: [
      {
        id: 'config-empresa',
        title: 'Datos de empresa',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Configura la información que aparece en recibos y reportes:</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:'4px' }}>
              <KeyVal k="Nombre comercial" v="Nombre en recibos e interfaz"/>
              <KeyVal k="Logo" v="Imagen PNG o JPG (máx 500KB)"/>
              <KeyVal k="Dirección" v="Dirección física del negocio"/>
              <KeyVal k="Teléfono" v="Contacto del negocio"/>
              <KeyVal k="IBAN / Cuenta SINPE" v="Para pagos entrantes"/>
              <KeyVal k="Moneda" v="CRC, USD, GTQ, HNL, etc."/>
              <KeyVal k="Impuesto" v="Porcentaje de IVA aplicable"/>
            </div>
          </div>
        ),
      },
      {
        id: 'config-usuarios',
        title: 'Usuarios y roles',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <Table
              headers={['Rol','POS','Inventario','Analytics','Configuración']}
              rows={[
                ['Admin','✓ Completo','✓ Completo','✓ Completo','✓ Completo'],
                ['Gerente','✓ Completo','✓ Completo','✓ Completo','✗ Limitado'],
                ['Cajero','✓ Ventas','✗ Solo ver','✗ Básico','✗ No accede'],
                ['Inventario','✗ No accede','✓ Completo','✓ Básico','✗ No accede'],
              ]}
            />
            <Note>Cada usuario puede tener acceso a una o varias sucursales específicas, independientemente de su rol.</Note>
          </div>
        ),
      },
      {
        id: 'config-sucursales',
        title: 'Sucursales',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Cada sucursal tiene su propio:</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {['Inventario independiente','Caja y cierres propios','Usuarios asignados','Reportes separados','Configuración de impresora','Número de mesas (restaurante)'].map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 11px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'8px' }}>
                  <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#5AAAF0', flexShrink:0 }}/>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>{f}</span>
                </div>
              ))}
            </div>
            <Tip>Plan Growth soporta hasta 3 sucursales. Plan Scale no tiene límite. Agrega sucursales desde Configuración → Sucursales → Nueva.</Tip>
          </div>
        ),
      },
    ],
  },
  {
    id: 'pagos',
    icon: CreditCard,
    label: 'Suscripción y pagos',
    color: '#3DBF7F',
    chapters: [
      {
        id: 'pagos-sinpe',
        title: 'Pago por SINPE Móvil',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
            <Step n={1} title="Elige tu plan" desc="En la landing page, selecciona el plan deseado y haz clic en SINPE Móvil."/>
            <Step n={2} title="Realiza la transferencia" desc="Transfiere el monto exacto al número SINPE indicado. Agrega el nombre del negocio en el concepto."/>
            <Step n={3} title="Envía el comprobante" desc="Sube la foto o captura del comprobante en el formulario que aparece."/>
            <Step n={4} title="Activación manual" desc="El equipo de DaxCloud verifica el pago y activa tu plan en menos de 2 horas hábiles."/>
            <Note>Los pagos por SINPE se procesan de lunes a viernes de 8am a 6pm. Fuera de ese horario, la activación se realiza el siguiente día hábil.</Note>
          </div>
        ),
      },
      {
        id: 'pagos-tarjeta',
        title: 'Pago con tarjeta',
        content: (
          <div style={{ display:'flex', flexDirection:'column' as const, gap:'12px' }}>
            <Step n={1} title="Elige tu plan" desc="En la landing page, selecciona el plan y haz clic en Tarjeta."/>
            <Step n={2} title="Registro previo" desc="Si no tienes cuenta, completa el registro. Serás redirigido automáticamente al pago."/>
            <Step n={3} title="Pago seguro con Pagadito" desc="Ingresa los datos de tu tarjeta Visa o Mastercard en la plataforma segura de Pagadito."/>
            <Step n={4} title="Activación automática" desc="Una vez confirmado el pago, tu plan se activa de forma inmediata sin intervención manual."/>
            <Tip>Los pagos con tarjeta a través de Pagadito están disponibles en Costa Rica, Guatemala, El Salvador, Honduras, Nicaragua, Panamá, México y más.</Tip>
          </div>
        ),
      },
    ],
  },
];

// ── Modal principal ───────────────────────────────────────────────────────────
export function ManualModal({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('inicio');
  const [activeChapter, setActiveChapter] = useState('que-es');
  const [search, setSearch]               = useState('');
  const [mobileNav, setMobileNav]         = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Scroll al cambiar capítulo
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeChapter]);

  const currentSection = SECTIONS.find(s => s.id === activeSection)!;
  const currentChapter = currentSection?.chapters.find(c => c.id === activeChapter);

  // Búsqueda
  const searchResults = search.length > 2
    ? SECTIONS.flatMap(s => s.chapters.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map(c => ({ section: s, chapter: c })))
    : [];

  const selectChapter = (sectionId: string, chapterId: string) => {
    setActiveSection(sectionId);
    setActiveChapter(chapterId);
    setSearch('');
    setMobileNav(false);
  };

  // Navegar siguiente/anterior
  const allChapters = SECTIONS.flatMap(s => s.chapters.map(c => ({ sectionId: s.id, chapterId: c.id, title: c.title })));
  const currentIdx  = allChapters.findIndex(c => c.chapterId === activeChapter);
  const prevChapter = allChapters[currentIdx - 1];
  const nextChapter = allChapters[currentIdx + 1];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* Overlay */}
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}/>

      {/* Modal */}
      <div style={{ position:'relative', width:'100%', maxWidth:'1100px', height:'min(90vh,760px)', background:'#080C14', border:'1px solid rgba(255,92,53,0.18)', borderRadius:'20px', display:'flex', flexDirection:'column' as const, overflow:'hidden', boxShadow:'0 32px 100px rgba(0,0,0,0.8)', animation:'manualOpen .35s cubic-bezier(.22,1,.36,1)' }}>

        {/* Top glow */}
        <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,92,53,0.4),transparent)', zIndex:1 }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, background:'rgba(8,12,20,0.9)', backdropFilter:'blur(20px)', position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(255,92,53,0.1)', border:'1px solid rgba(255,92,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <BookOpen size={16} color="#FF5C35"/>
            </div>
            <div>
              <h2 style={{ fontSize:'16px', fontWeight:800, color:'#fff', letterSpacing:'-.02em', margin:0 }}>Manual de DaxCloud</h2>
              <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:0 }}>Guía completa del sistema</p>
            </div>
          </div>

          {/* Búsqueda */}
          <div style={{ position:'relative', flex:1, maxWidth:'280px' }}>
            <Search size={13} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en el manual..."
              style={{ width:'100%', padding:'9px 14px 9px 34px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#F0F4FF', fontSize:'12px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
              onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.4)'; e.target.style.background='rgba(255,92,53,0.04)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.04)'; }}
            />
            {/* Resultados */}
            {search.length > 2 && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'rgba(8,14,26,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', overflow:'hidden', zIndex:100, boxShadow:'0 16px 40px rgba(0,0,0,0.6)' }}>
                {searchResults.length === 0
                  ? <p style={{ padding:'14px 16px', fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>Sin resultados</p>
                  : searchResults.map(({ section, chapter }) => (
                    <div key={chapter.id} onClick={() => selectChapter(section.id, chapter.id)}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 14px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                      <Hash size={11} color={section.color}/>
                      <div>
                        <p style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.8)', marginBottom:'1px' }}>{chapter.title}</p>
                        <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>{section.label}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Mobile nav toggle */}
          <button onClick={() => setMobileNav(p => !p)} className="manual-mobile-toggle" style={{ display:'none', alignItems:'center', gap:'6px', padding:'8px 12px', background:'rgba(255,92,53,0.07)', border:'1px solid rgba(255,92,53,0.2)', borderRadius:'9px', color:'#FF5C35', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <Layers size={13}/> Secciones
          </button>

          <button onClick={onClose} style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; }}>
            <X size={15} color="rgba(255,255,255,0.5)"/>
          </button>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Sidebar */}
          <div className={`manual-sidebar ${mobileNav ? 'mobile-open' : ''}`} style={{ width:'230px', borderRight:'1px solid rgba(255,255,255,0.06)', overflowY:'auto', padding:'16px 10px', flexShrink:0, background:'rgba(6,10,18,0.98)' }}>
            {SECTIONS.map(section => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              return (
                <div key={section.id} style={{ marginBottom:'4px' }}>
                  <div onClick={() => { setActiveSection(section.id); setActiveChapter(section.chapters[0].id); setMobileNav(false); }}
                    style={{ display:'flex', alignItems:'center', gap:'9px', padding:'9px 10px', borderRadius:'9px', cursor:'pointer', background: isActive ? `${section.color}10` : 'transparent', border: isActive ? `1px solid ${section.color}25` : '1px solid transparent', transition:'all .15s', marginBottom: isActive ? '4px' : 0 }}
                    onMouseEnter={e => { if(!isActive) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if(!isActive) (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                    <Icon size={14} color={isActive ? section.color : 'rgba(255,255,255,0.3)'}/>
                    <span style={{ fontSize:'12px', fontWeight: isActive ? 700 : 500, color: isActive ? section.color : 'rgba(255,255,255,0.45)', flex:1 }}>{section.label}</span>
                    {isActive && <ChevronRight size={11} color={section.color}/>}
                  </div>
                  {isActive && (
                    <div style={{ paddingLeft:'14px', display:'flex', flexDirection:'column' as const, gap:'1px' }}>
                      {section.chapters.map(chapter => (
                        <div key={chapter.id} onClick={() => { setActiveChapter(chapter.id); setMobileNav(false); }}
                          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'7px', cursor:'pointer', background: activeChapter === chapter.id ? 'rgba(255,255,255,0.06)' : 'transparent', transition:'background .12s' }}
                          onMouseEnter={e => { if(activeChapter!==chapter.id) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
                          onMouseLeave={e => { if(activeChapter!==chapter.id) (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                          <div style={{ width:'4px', height:'4px', borderRadius:'50%', background: activeChapter===chapter.id ? section.color : 'rgba(255,255,255,0.2)', flexShrink:0, transition:'background .15s' }}/>
                          <span style={{ fontSize:'11px', color: activeChapter===chapter.id ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: activeChapter===chapter.id ? 600 : 400, lineHeight:1.4 }}>{chapter.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div ref={contentRef} style={{ flex:1, overflowY:'auto', padding:'28px 32px', position:'relative' }}>
            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'20px' }}>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', fontWeight:500 }}>{currentSection.label}</span>
              <ChevronRight size={10} color="rgba(255,255,255,0.2)"/>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{currentChapter?.title}</span>
            </div>

            {/* Chapter title */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', paddingBottom:'20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'11px', background:`${currentSection.color}12`, border:`1px solid ${currentSection.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {(() => { const Icon = currentSection.icon; return <Icon size={18} color={currentSection.color}/>; })()}
              </div>
              <h2 style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'-.03em', margin:0, lineHeight:1.1 }}>{currentChapter?.title}</h2>
            </div>

            {/* Content */}
            <div style={{ animation:'fadeUp .3s ease' }}>
              {currentChapter?.content}
            </div>

            {/* Navigation prev/next */}
            <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', marginTop:'40px', paddingTop:'20px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              {prevChapter
                ? <button onClick={() => selectChapter(prevChapter.sectionId, prevChapter.chapterId)}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'11px', cursor:'pointer', fontFamily:'inherit', transition:'all .2s', flex:1, maxWidth:'200px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.25)'; (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}>
                    <ChevronRight size={13} color="rgba(255,255,255,0.3)" style={{ transform:'rotate(180deg)', flexShrink:0 }}/>
                    <div style={{ textAlign:'left' as const, overflow:'hidden' }}>
                      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' as const }}>Anterior</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{prevChapter.title}</p>
                    </div>
                  </button>
                : <div/>
              }
              {nextChapter
                ? <button onClick={() => selectChapter(nextChapter.sectionId, nextChapter.chapterId)}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 16px', background:'rgba(255,92,53,0.06)', border:'1px solid rgba(255,92,53,0.2)', borderRadius:'11px', cursor:'pointer', fontFamily:'inherit', transition:'all .2s', flex:1, maxWidth:'200px', justifyContent:'flex-end' as const }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.06)'; }}>
                    <div style={{ textAlign:'right' as const, overflow:'hidden' }}>
                      <p style={{ fontSize:'9px', color:'rgba(255,92,53,0.55)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' as const }}>Siguiente</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,92,53,0.85)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{nextChapter.title}</p>
                    </div>
                    <ChevronRight size={13} color="rgba(255,92,53,0.7)" style={{ flexShrink:0 }}/>
                  </button>
                : <div/>
              }
            </div>

            <p style={{ textAlign:'center' as const, marginTop:'24px', fontSize:'11px', color:'rgba(255,255,255,0.12)' }}>
              DaxCloud · Manual del sistema v2.0 · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes manualOpen { from{opacity:0;transform:scale(.97) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .manual-sidebar::-webkit-scrollbar { width:4px }
        .manual-sidebar::-webkit-scrollbar-track { background:transparent }
        .manual-sidebar::-webkit-scrollbar-thumb { background:rgba(255,92,53,0.2);border-radius:4px }
        @media(max-width:767px){
          .manual-mobile-toggle { display:flex!important }
          .manual-sidebar { position:absolute;left:0;top:0;bottom:0;z-index:50;transform:translateX(-100%);transition:transform .3s cubic-bezier(.22,1,.36,1) }
          .manual-sidebar.mobile-open { transform:translateX(0) }
        }
      `}</style>
    </div>
  );
}
