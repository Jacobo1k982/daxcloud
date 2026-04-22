'use client';
import { useState, useEffect, useRef } from 'react';
import {
  X, BookOpen, ShoppingCart, Package, BarChart2, Users, Settings,
  Building2, ChefHat, Pill, Scissors, Shirt, Leaf, ShoppingBag,
  CreditCard, Smartphone, Globe, Bell, Shield, Zap, ArrowRight,
  ChevronRight, Search, Hash, TrendingUp, Clock, Star, HelpCircle,
  Monitor, Layers, RefreshCw, Download, Printer, UserCheck,
  Receipt, Scale, PieChart, Activity, BookMarked, Palette,
  QrCode, MessageCircle, FileText, AlertTriangle, CheckCircle,
  Lock, Eye, Wifi, WifiOff, LayoutDashboard, Store,
} from 'lucide-react';

interface Section { id:string; icon:any; label:string; color:string; chapters:Chapter[]; }
interface Chapter { id:string; title:string; content:React.ReactNode; }

// ── Helpers de contenido ──────────────────────────────────────────────────────
function Step({ n, title, desc }: { n:number; title:string; desc:string }) {
  return (
    <div style={{ display:'flex', gap:'14px', alignItems:'flex-start', padding:'13px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'11px' }}>
      <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'linear-gradient(135deg,#FF5C35,#FF3D1F)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'12px', fontWeight:800, color:'#fff' }}>{n}</div>
      <div>
        <p style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:'3px' }}>{title}</p>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

function Tip({ children }: { children:React.ReactNode }) {
  return (
    <div style={{ display:'flex', gap:'10px', padding:'11px 13px', background:'rgba(255,92,53,0.06)', border:'1px solid rgba(255,92,53,0.18)', borderRadius:'9px', marginTop:'10px' }}>
      <Star size={13} color="#FF5C35" style={{ flexShrink:0, marginTop:'1px' }}/>
      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', lineHeight:1.65 }}>{children}</p>
    </div>
  );
}

function Note({ children, color='#5AAAF0' }: { children:React.ReactNode; color?:string }) {
  return (
    <div style={{ display:'flex', gap:'10px', padding:'11px 13px', background:`rgba(90,170,240,0.06)`, border:`1px solid rgba(90,170,240,0.15)`, borderRadius:'9px', marginTop:'10px' }}>
      <HelpCircle size={13} color={color} style={{ flexShrink:0, marginTop:'1px' }}/>
      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.65 }}>{children}</p>
    </div>
  );
}

function Warning({ children }: { children:React.ReactNode }) {
  return (
    <div style={{ display:'flex', gap:'10px', padding:'11px 13px', background:'rgba(240,160,48,0.06)', border:'1px solid rgba(240,160,48,0.2)', borderRadius:'9px', marginTop:'10px' }}>
      <AlertTriangle size={13} color="#F0A030" style={{ flexShrink:0, marginTop:'1px' }}/>
      <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.65 }}>{children}</p>
    </div>
  );
}

function KeyVal({ k, v }: { k:string; v:string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'16px', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', flexShrink:0 }}>{k}</span>
      <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.75)', textAlign:'right' as const }}>{v}</span>
    </div>
  );
}

function Table({ headers, rows }: { headers:string[]; rows:string[][] }) {
  return (
    <div style={{ borderRadius:'11px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', marginTop:'10px' }}>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${headers.length},1fr)`, background:'rgba(255,255,255,0.04)', padding:'9px 13px' }}>
        {headers.map(h => <span key={h} style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.7)' }}>{h}</span>)}
      </div>
      {rows.map((row,i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:`repeat(${headers.length},1fr)`, padding:'9px 13px', background: i%2===0?'transparent':'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          {row.map((cell,j) => <span key={j} style={{ fontSize:'12px', color: j===0?'rgba(255,255,255,0.75)':'rgba(255,255,255,0.4)', fontWeight: j===0?600:400 }}>{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function Badge({ label, color }: { label:string; color:string }) {
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:`${color}15`, border:`1px solid ${color}30`, color, marginRight:'4px', marginBottom:'4px' }}>{label}</span>;
}

function Grid2({ children }: { children:React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'10px' }}>{children}</div>;
}

function MiniCard({ icon: Icon, title, desc, color='#FF5C35' }: { icon:any; title:string; desc:string; color?:string }) {
  return (
    <div style={{ padding:'13px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'11px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
        <Icon size={13} color={color}/>
        <span style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{title}</span>
      </div>
      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p>
    </div>
  );
}

// ── SECCIONES DEL MANUAL ──────────────────────────────────────────────────────
const SECTIONS: Section[] = [

  // ── 1. INTRODUCCIÓN ────────────────────────────────────────────────────────
  {
    id:'inicio', icon:BookOpen, label:'Introducción', color:'#FF5C35',
    chapters:[
      {
        id:'que-es', title:'¿Qué es DaxCloud?',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.6)', lineHeight:1.85 }}>
              DaxCloud es un sistema POS (Point of Sale) basado en la nube para negocios de América Latina. Gestiona ventas, inventario, clientes, contabilidad y pedidos online desde cualquier dispositivo.
            </p>
            <Grid2>
              <MiniCard icon={Monitor} title="100% en la nube" desc="Sin instalaciones, accede desde cualquier navegador"/>
              <MiniCard icon={Globe} title="Multi-sucursal" desc="Todas tus sedes en un solo panel centralizado" color="#5AAAF0"/>
              <MiniCard icon={Zap} title="Tiempo real" desc="Ventas, stock y pedidos al instante" color="#3DBF7F"/>
              <MiniCard icon={Shield} title="Seguro" desc="HTTPS, datos encriptados y respaldo automático" color="#A78BFA"/>
              <MiniCard icon={Smartphone} title="PWA instalable" desc="Instala DaxCloud como app en tu celular o tablet" color="#F0A030"/>
              <MiniCard icon={Store} title="Catálogo online" desc="Tus clientes hacen pedidos desde su celular" color="#E05050"/>
            </Grid2>
            <Tip>DaxCloud funciona en Chrome, Edge, Firefox y Safari. Para la mejor experiencia móvil, instálalo como app PWA desde tu navegador.</Tip>
          </div>
        ),
      },
      {
        id:'primeros-pasos', title:'Primeros pasos',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:'4px' }}>Configura tu negocio en menos de 5 minutos:</p>
            <Step n={1} title="Crea tu cuenta" desc="Regístrate en daxcloud.shop con el nombre de tu negocio, correo y contraseña. Elige tu industria."/>
            <Step n={2} title="Completa tu perfil público" desc="Ve a Configuración → Perfil público y agrega logo, descripción, horarios y redes sociales."/>
            <Step n={3} title="Configura tu sucursal" desc="En Configuración → Sucursales, agrega el nombre y dirección de tu sede principal."/>
            <Step n={4} title="Agrega productos" desc="En Productos → Nuevo producto, ingresa nombre, precio, IVA, costo y categoría."/>
            <Step n={5} title="Configura el inventario" desc="Establece el stock inicial y mínimos para alertas automáticas."/>
            <Step n={6} title="Comparte tu catálogo" desc="Copia el link desde Ventas → Pedidos online y compártelo con tus clientes."/>
            <Step n={7} title="¡Empieza a vender!" desc="Abre el POS, procesa tu primera venta y mira cómo llegan los pedidos online."/>
            <Note>Los 14 días de prueba incluyen todas las funciones del plan Growth. No se requiere tarjeta de crédito.</Note>
          </div>
        ),
      },
      {
        id:'pwa', title:'Instalar como app (PWA)',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>DaxCloud se puede instalar como aplicación nativa en cualquier dispositivo sin pasar por el App Store ni Google Play.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {[
                { plat:'Android (Chrome)', steps:'Abre daxcloud.shop → Menú de 3 puntos → "Agregar a pantalla de inicio" → Instalar' },
                { plat:'iPhone / iPad (Safari)', steps:'Abre daxcloud.shop → Botón compartir → "Agregar a pantalla de inicio" → Agregar' },
                { plat:'Windows (Chrome/Edge)', steps:'Abre daxcloud.shop → Ícono de instalación en la barra de direcciones → Instalar' },
                { plat:'Mac (Chrome)', steps:'Abre daxcloud.shop → Menú Chrome → "Guardar e instalar" → Instalar' },
              ].map(({ plat, steps }) => (
                <div key={plat} style={{ padding:'11px 13px', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'4px' }}>{plat}</p>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>{steps}</p>
                </div>
              ))}
            </div>
            <Tip>Una vez instalada, DaxCloud funciona offline con caché inteligente. Las ventas y cambios se sincronizan automáticamente cuando vuelves a tener internet.</Tip>
          </div>
        ),
      },
      {
        id:'planes', title:'Planes y precios',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <Table
              headers={['Plan','Precio/mes','Sucursales','Usuarios','Módulos']}
              rows={[
                ['Starter','$19','1','3','Básico'],
                ['Growth','$40','3','15','Todos'],
                ['Scale','$60','Ilimitadas','Ilimitados','Todos + soporte'],
              ]}
            />
            <Grid2>
              <div style={{ padding:'13px', background:'rgba(61,191,127,0.05)', border:'1px solid rgba(61,191,127,0.15)', borderRadius:'11px' }}>
                <p style={{ fontSize:'11px', color:'rgba(61,191,127,0.7)', fontWeight:600, marginBottom:'5px' }}>Facturación anual</p>
                <p style={{ fontSize:'18px', fontWeight:800, color:'#3DBF7F' }}>2 meses gratis</p>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'3px' }}>Ahorra hasta $120/año</p>
              </div>
              <div style={{ padding:'13px', background:'rgba(255,92,53,0.05)', border:'1px solid rgba(255,92,53,0.15)', borderRadius:'11px' }}>
                <p style={{ fontSize:'11px', color:'rgba(255,92,53,0.7)', fontWeight:600, marginBottom:'5px' }}>Módulos especiales</p>
                <p style={{ fontSize:'18px', fontWeight:800, color:'#FF5C35' }}>+$22/mes</p>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'3px' }}>Por industria especializada</p>
              </div>
            </Grid2>
            <Tip>El plan Growth cubre la mayoría de negocios. Incluye módulos de industria, catálogo online, analytics avanzado y contabilidad PRO.</Tip>
          </div>
        ),
      },
    ],
  },

  // ── 2. POS ─────────────────────────────────────────────────────────────────
  {
    id:'pos', icon:ShoppingCart, label:'Punto de Venta', color:'#FF5C35',
    chapters:[
      {
        id:'pos-apertura', title:'Apertura de caja',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Antes de vender debes abrir la caja con el monto inicial de efectivo disponible.</p>
            <Step n={1} title="Accede al POS" desc="Desde el menú lateral, haz clic en POS. Aparecerá la pantalla de apertura."/>
            <Step n={2} title="Ingresa el monto inicial" desc="Cuenta el efectivo en caja y escribe el monto. Puedes usar los accesos rápidos de montos comunes."/>
            <Step n={3} title="Agrega una nota (opcional)" desc="Escribe el nombre del turno o cualquier observación del día."/>
            <Step n={4} title="Haz clic en Abrir caja" desc="El sistema registra la apertura con fecha, hora y cajero. Ya puedes procesar ventas."/>
            <Warning>Si no abres la caja, no podrás procesar ventas. Cada turno debe tener su apertura y cierre registrado.</Warning>
          </div>
        ),
      },
      {
        id:'pos-interface', title:'Interfaz del POS',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El POS tiene 3 áreas principales:</p>
            {[
              { area:'Panel de productos', desc:'Búsqueda por nombre o código de barras, filtros por categoría, grid de productos con imágenes y precios', color:'#FF5C35' },
              { area:'Carrito / Orden', desc:'Productos agregados, cantidades, descuentos por ítem, descuento global y total', color:'#5AAAF0' },
              { area:'Barra de caja', desc:'Estadísticas del turno, botones de apertura/cierre de caja, refrescar inventario', color:'#3DBF7F' },
            ].map(({ area, desc, color }) => (
              <div key={area} style={{ display:'flex', gap:'12px', padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                <div style={{ width:'4px', borderRadius:'2px', background:color, flexShrink:0 }}/>
                <div><p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{area}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p></div>
              </div>
            ))}
            <Note>El POS detecta automáticamente tu industria y muestra las opciones correspondientes (mesas para restaurante, presentaciones para panadería, etc.).</Note>
          </div>
        ),
      },
      {
        id:'pos-venta', title:'Procesar una venta',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Step n={1} title="Busca y agrega productos" desc="Escribe el nombre, SKU o escanea el código de barras. Toca el producto para agregarlo al carrito."/>
            <Step n={2} title="Ajusta cantidades y descuentos" desc="En el carrito usa + y − para cantidades. Ingresa descuento por ítem o descuento global en %."/>
            <Step n={3} title="Asocia un cliente (opcional)" desc="Busca el cliente por teléfono para aplicar crédito interno o acumular puntos de fidelización."/>
            <Step n={4} title="Selecciona método de pago" desc="Elige Efectivo, SINPE, Tarjeta, Mixto o Crédito interno. Para efectivo ingresa el monto recibido."/>
            <Step n={5} title="Confirma el cobro" desc="El sistema procesa la venta, actualiza el inventario, acumula puntos y genera el recibo."/>
            <Tip>Para ventas con pago mixto, ingresa los montos de cada método y el sistema verifica que sumen el total antes de procesar.</Tip>
          </div>
        ),
      },
      {
        id:'pos-metodos', title:'Métodos de pago',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Table
              headers={['Método','Descripción','Cambio']}
              rows={[
                ['Efectivo','Calcula cambio automáticamente','Sí'],
                ['SINPE Móvil','Solo Costa Rica. Confirmación manual','No'],
                ['Tarjeta','Visa/Mastercard. Registro manual','No'],
                ['Mixto','Combina dos métodos en una venta','Parcial'],
                ['Crédito','Descuenta del saldo interno del cliente','No'],
              ]}
            />
            <Note>El método Mixto permite dividir el pago entre Efectivo + Tarjeta o Efectivo + SINPE en cualquier combinación.</Note>
          </div>
        ),
      },
      {
        id:'pos-recibos', title:'Recibos e impresión',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Después de cada venta puedes generar el comprobante:</p>
            {[
              { icon:Printer, title:'Impresora térmica', desc:'Compatible con impresoras de 58mm y 80mm por USB, Bluetooth o red local.' },
              { icon:Download, title:'Descargar PDF', desc:'Genera un recibo en PDF para enviar por correo o WhatsApp.' },
              { icon:Monitor, title:'Recibo en pantalla', desc:'El cliente puede fotografiar el comprobante en pantalla.' },
            ].map(({ icon:Icon, title, desc }) => (
              <div key={title} style={{ display:'flex', gap:'12px', padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                <Icon size={15} color="#FF5C35" style={{ flexShrink:0, marginTop:'1px' }}/>
                <div><p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{title}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p></div>
              </div>
            ))}
            <Tip>Configura el encabezado, pie de página y número de copias del recibo en Configuración → Impresión.</Tip>
          </div>
        ),
      },
      {
        id:'pos-cierre', title:'Cierre de caja',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Step n={1} title="Haz clic en Cerrar caja" desc="En la barra superior del POS, usa el botón Cerrar caja."/>
            <Step n={2} title="Cuenta el efectivo físico" desc="Cuenta los billetes y monedas en tu caja y escribe el total contado."/>
            <Step n={3} title="Revisa la diferencia" desc="El sistema muestra el efectivo esperado vs el contado. Una diferencia indica un descuadre."/>
            <Step n={4} title="Agrega notas y cierra" desc="Escribe cualquier observación del turno y confirma el cierre."/>
            <Note>El reporte del turno queda disponible en el módulo de Contabilidad → Flujo de caja para revisión del contador.</Note>
          </div>
        ),
      },
    ],
  },

  // ── 3. PRODUCTOS ───────────────────────────────────────────────────────────
  {
    id:'productos', icon:Package, label:'Productos', color:'#5AAAF0',
    chapters:[
      {
        id:'prod-crear', title:'Crear un producto',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El formulario de productos tiene 4 pestañas:</p>
            {[
              { tab:'General', desc:'Nombre, descripción, categoría, unidad de medida, imagen, SKU y código de barras' },
              { tab:'Precio e IVA', desc:'Precio de venta, costo, margen automático, tasa de IVA y desglose base/impuesto' },
              { tab:'Inventario', desc:'Stock mínimo para alertas y unidad de medida para el control' },
              { tab:'Más info', desc:'Marca, proveedor y notas internas del equipo' },
            ].map(({ tab, desc }) => (
              <div key={tab} style={{ display:'flex', gap:'12px', padding:'10px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,92,53,0.15)', borderRadius:'10px' }}>
                <Badge label={tab} color="#FF5C35"/>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', lineHeight:1.5, flex:1 }}>{desc}</p>
              </div>
            ))}
            <Tip>El SKU se puede generar automáticamente. El margen de ganancia se calcula en tiempo real mientras ingresas precio y costo.</Tip>
          </div>
        ),
      },
      {
        id:'prod-iva', title:'Configuración de IVA',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>DaxCloud soporta múltiples tasas de IVA por producto:</p>
            <Table
              headers={['Tasa','Aplica a']}
              rows={[
                ['0% - Exento','Medicamentos controlados, servicios exentos'],
                ['1% - Canasta básica','Arroz, frijoles, aceite, sal, azúcar, harina'],
                ['2% - Medicamentos','Medicamentos y productos médicos'],
                ['4% - Reducido','Servicios de salud privados, veterinaria'],
                ['13% - Estándar','Mayoría de productos y servicios'],
                ['Personalizado','Tasa especial definida por el negocio'],
              ]}
            />
            <div style={{ padding:'12px 14px', background:'rgba(90,170,240,0.05)', border:'1px solid rgba(90,170,240,0.15)', borderRadius:'10px' }}>
              <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(90,170,240,0.8)', marginBottom:'6px' }}>Toggle "Precio incluye IVA"</p>
              <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}><strong style={{ color:'rgba(255,255,255,0.65)' }}>Activado:</strong> El precio ingresado ya tiene IVA incluido. Se desglosará automáticamente para reportes.<br/><strong style={{ color:'rgba(255,255,255,0.65)' }}>Desactivado:</strong> El IVA se suma al precio de venta al momento del cobro.</p>
            </div>
            <Tip>El desglose de IVA aparece en tiempo real mientras configuras el producto, mostrando base imponible, monto de impuesto y precio total al cliente.</Tip>
          </div>
        ),
      },
      {
        id:'prod-importar', title:'Importar productos masivamente',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Step n={1} title="Descarga la plantilla" desc="En Productos → Importar → Descargar plantilla Excel. La plantilla tiene todos los campos requeridos."/>
            <Step n={2} title="Completa la planilla" desc="Llena nombre, precio, costo, SKU, categoría, IVA y stock inicial para cada producto."/>
            <Step n={3} title="Sube el archivo" desc="En Productos → Importar, selecciona tu archivo Excel completado."/>
            <Step n={4} title="Revisa y confirma" desc="El sistema muestra una vista previa de los productos a importar. Confirma para procesarlos."/>
            <Warning>El archivo debe ser .xlsx y los precios deben ser números sin símbolos de moneda ni puntos de miles.</Warning>
          </div>
        ),
      },
    ],
  },

  // ── 4. INVENTARIO ──────────────────────────────────────────────────────────
  {
    id:'inventario', icon:Package, label:'Inventario', color:'#5AAAF0',
    chapters:[
      {
        id:'inv-productos', title:'Gestión de stock',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El inventario se actualiza automáticamente con cada venta. Para ajustes manuales:</p>
            {[
              { badge:'Entrada',  color:'#3DBF7F', desc:'Registra compras a proveedores o reposición de stock.' },
              { badge:'Salida',   color:'#E05050', desc:'Ajuste por pérdida, merma o daño de productos.' },
              { badge:'Ajuste',   color:'#F0A030', desc:'Corrección después de conteo físico.' },
              { badge:'Traslado', color:'#5AAAF0', desc:'Mover stock entre sucursales (plan Growth+).' },
            ].map(({ badge, color, desc }) => (
              <div key={badge} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'9px 13px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'9px' }}>
                <Badge label={badge} color={color}/>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>{desc}</p>
              </div>
            ))}
          </div>
        ),
      },
      {
        id:'inv-stock', title:'Estados de stock',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Table
              headers={['Estado','Descripción','Color']}
              rows={[
                ['OK','Stock por encima del mínimo','Verde'],
                ['Bajo','Llegó al stock mínimo configurado','Ámbar'],
                ['Agotado','Stock en 0 unidades','Rojo'],
                ['Sobrestock','Excede el máximo configurado','Azul'],
              ]}
            />
            <Note>El stock mínimo se configura por producto en Productos → Editar → pestaña Inventario. Por defecto es 5 unidades.</Note>
          </div>
        ),
      },
      {
        id:'inv-alertas', title:'Alertas automáticas',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { icon:Bell, title:'Stock bajo', color:'#F0A030', desc:'Cuando un producto llega a su mínimo configurado. Aparece en el POS y en notificaciones.' },
              { icon:Bell, title:'Producto agotado', color:'#E05050', desc:'Notificación inmediata cuando el stock llega a cero. El producto se marca como AGOTADO en el POS.' },
              { icon:Bell, title:'Lote por vencer', color:'#A78BFA', desc:'Para farmacia y verdulería, alerta de productos próximos a vencer (configurable por días).' },
            ].map(({ icon:Icon, title, color, desc }) => (
              <div key={title} style={{ display:'flex', gap:'12px', padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                <Icon size={14} color={color} style={{ flexShrink:0, marginTop:'1px' }}/>
                <div><p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{title}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p></div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ── 5. ANALYTICS ───────────────────────────────────────────────────────────
  {
    id:'analytics', icon:BarChart2, label:'Analytics', color:'#3DBF7F',
    chapters:[
      {
        id:'analytics-dashboard', title:'Dashboard de ventas',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <Grid2>
              {[
                { label:'Ventas del día',   value:'Ingresos de hoy en tiempo real' },
                { label:'Transacciones',    value:'Cantidad de ventas del período' },
                { label:'Ticket promedio',  value:'Venta promedio por cliente' },
                { label:'Horas pico',       value:'Mapa de calor por hora del día' },
                { label:'Top productos',    value:'Los más vendidos del período' },
                { label:'Métodos de pago',  value:'Distribución por tipo de pago' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding:'11px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                  <p style={{ fontSize:'11px', fontWeight:700, color:'#3DBF7F', marginBottom:'3px' }}>{label}</p>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{value}</p>
                </div>
              ))}
            </Grid2>
            <Note>Filtra el dashboard por sucursal, período (hoy/semana/mes/año) y compara con períodos anteriores.</Note>
          </div>
        ),
      },
      {
        id:'analytics-reportes', title:'Exportar reportes',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { title:'Reporte de ventas', desc:'Todas las transacciones con método de pago, cajero y productos.' },
              { title:'Reporte de inventario', desc:'Estado actual del stock, movimientos y valorización.' },
              { title:'Reporte de clientes', desc:'Historial de compras, puntos acumulados y saldo de crédito.' },
              { title:'Reporte de caja', desc:'Aperturas, cierres, entradas y salidas de efectivo por turno.' },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                <Download size={13} color="#3DBF7F" style={{ flexShrink:0 }}/>
                <div><p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.75)', marginBottom:'2px' }}>{title}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{desc}</p></div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ── 6. CONTABILIDAD ────────────────────────────────────────────────────────
  {
    id:'contabilidad', icon:Scale, label:'Contabilidad PRO', color:'#A78BFA',
    chapters:[
      {
        id:'cont-overview', title:'¿Qué incluye el módulo contable?',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El módulo contable de DaxCloud está diseñado para contadores profesionales. Incluye 6 vistas especializadas:</p>
            {[
              { icon:LayoutDashboard, label:'Dashboard', color:'#FF5C35', desc:'KPIs financieros, métodos de pago con barras, P&L rápido y gráfico de ingresos por día.' },
              { icon:BookOpen,        label:'Libro de ventas', color:'#5AAAF0', desc:'Tabla completa de transacciones con búsqueda, exportar a Excel y PDF profesional para Hacienda.' },
              { icon:TrendingUp,      label:'Estado de resultados', color:'#3DBF7F', desc:'Desglose contable: ingresos, costos, utilidad, IVA e indicadores financieros.' },
              { icon:Receipt,        label:'Declaración IVA', color:'#A78BFA', desc:'Base imponible, IVA cobrado y tasa efectiva por día. Listo para declarar ante Hacienda.' },
              { icon:Activity,       label:'Flujo de caja', color:'#F0A030', desc:'Ingresos, costos, utilidad neta y saldo acumulado día a día.' },
              { icon:PieChart,       label:'Análisis de productos', color:'#E05050', desc:'Ranking de productos por ingresos, margen, unidades vendidas y % del total.' },
            ].map(({ icon:Icon, label, color, desc }) => (
              <div key={label} style={{ display:'flex', gap:'12px', padding:'11px 13px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={15} color={color}/>
                </div>
                <div><p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{label}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p></div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id:'cont-exportar', title:'Exportar para el contador',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Cada reporte contable se puede exportar en dos formatos:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ padding:'13px', background:'rgba(61,191,127,0.05)', border:'1px solid rgba(61,191,127,0.15)', borderRadius:'11px' }}>
                <p style={{ fontSize:'12px', fontWeight:700, color:'#3DBF7F', marginBottom:'5px' }}>Excel / CSV</p>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>Archivo con todos los datos numéricos para importar en Excel, Google Sheets o el software contable del contador. Incluye encabezados en español y formato de moneda costarricense.</p>
              </div>
              <div style={{ padding:'13px', background:'rgba(255,92,53,0.05)', border:'1px solid rgba(255,92,53,0.15)', borderRadius:'11px' }}>
                <p style={{ fontSize:'12px', fontWeight:700, color:'#FF5C35', marginBottom:'5px' }}>PDF imprimible</p>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>Reporte con encabezado profesional, nombre del negocio, período y fecha de generación. Listo para imprimir o enviar al contador por correo.</p>
              </div>
            </div>
            <Tip>Para declaración de IVA en Costa Rica, usa el reporte "Declaración IVA" filtrado por mes y exporta a PDF para adjuntar a la declaración D-104.</Tip>
          </div>
        ),
      },
      {
        id:'cont-iva', title:'Declaración de IVA',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Pasos para preparar la declaración mensual de IVA:</p>
            <Step n={1} title="Ve a Contabilidad → Declaración IVA" desc="Selecciona el período del mes que vas a declarar usando el filtro."/>
            <Step n={2} title="Verifica los totales" desc="Revisa la base imponible total, IVA cobrado y tasa efectiva del período."/>
            <Step n={3} title="Exporta el reporte" desc="Descarga en PDF para adjuntar a tu declaración D-104 o enviar al contador."/>
            <Step n={4} title="Exporta también en Excel" desc="El archivo CSV permite al contador verificar cada transacción individualmente."/>
            <Note>Las ventas exentas (IVA 0%) aparecen separadas en el reporte para facilitar la declaración de ingresos no gravados.</Note>
          </div>
        ),
      },
    ],
  },

  // ── 7. CLIENTES ────────────────────────────────────────────────────────────
  {
    id:'clientes', icon:Users, label:'Clientes', color:'#A78BFA',
    chapters:[
      {
        id:'clientes-perfil', title:'Perfil del cliente',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <KeyVal k="Nombre y contacto" v="Teléfono, correo y dirección"/>
              <KeyVal k="Historial de compras" v="Todas las transacciones registradas"/>
              <KeyVal k="Crédito interno" v="Saldo disponible y límite asignado"/>
              <KeyVal k="Puntos de fidelización" v="Acumulados y canjeados"/>
              <KeyVal k="Código de cliente" v="Para búsqueda rápida en el POS"/>
            </div>
            <Tip>Busca clientes en el POS por nombre o teléfono para aplicar crédito o acumular puntos automáticamente en cada venta.</Tip>
          </div>
        ),
      },
      {
        id:'clientes-fidelizacion', title:'Fidelización y crédito',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { icon:Star, title:'Puntos de fidelización', color:'#F0A030', desc:'Configura cuántos puntos se otorgan por cada ₡1,000 vendidos. Los puntos se canjean en futuras compras como descuento.' },
              { icon:CreditCard, title:'Crédito interno', color:'#5AAAF0', desc:'Asigna un límite de crédito al cliente. Puede comprar a cuenta y pagar después desde Clientes → Pagar crédito.' },
              { icon:TrendingUp, title:'Historial y análisis', color:'#3DBF7F', desc:'Ve el valor total comprado, frecuencia de visitas, productos favoritos y comportamiento de compra.' },
            ].map(({ icon:Icon, title, color, desc }) => (
              <div key={title} style={{ display:'flex', gap:'12px', padding:'12px 13px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}20`, borderRadius:'10px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={15} color={color}/>
                </div>
                <div><p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'4px' }}>{title}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.55 }}>{desc}</p></div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ── 8. INDUSTRIAS ──────────────────────────────────────────────────────────
  {
    id:'industrias', icon:Building2, label:'Módulos de industria', color:'#F0A030',
    chapters:[
      {
        id:'ind-restaurante', title:'Restaurante',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(240,160,48,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={17} color="#F0A030"/></div>
              <div><p style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>Módulo Restaurante</p><p style={{ fontSize:'11px', color:'rgba(240,160,48,0.7)' }}>Comedor completo con comandas</p></div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap' as const }}>
              {['Mesas y zonas','Comandas de cocina','Reservaciones','Happy Hour','Delivery','Combos y modificadores','División de cuenta','Estaciones de cocina'].map(f => <Badge key={f} label={f} color="#F0A030"/>)}
            </div>
            <Note>Configura las mesas en Configuración → Mesas antes de usar el módulo en el POS.</Note>
          </div>
        ),
      },
      {
        id:'ind-panaderia', title:'Panadería / Pastelería',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(255,92,53,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChefHat size={17} color="#FF5C35"/></div>
              <div><p style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>Módulo Panadería</p><p style={{ fontSize:'11px', color:'rgba(255,92,53,0.7)' }}>Producción y encargos</p></div>
            </div>
            <Table
              headers={['Tab','Función']}
              rows={[
                ['Dashboard','Resumen de producción del día y mermas'],
                ['Producción','Registro de hornadas con turno y estado'],
                ['Mermas','Control de productos quemados o dañados'],
                ['Recetas','Ingredientes, costos y rendimiento'],
                ['Encargos','Pedidos a futuro con fecha y adelanto'],
                ['Proveedores','Registro de proveedores de insumos'],
              ]}
            />
          </div>
        ),
      },
      {
        id:'ind-farmacia', title:'Farmacia',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(61,191,127,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Pill size={17} color="#3DBF7F"/></div>
              <div><p style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>Módulo Farmacia</p><p style={{ fontSize:'11px', color:'rgba(61,191,127,0.7)' }}>Medicamentos y control de lotes</p></div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap' as const }}>
              {['Lotes y vencimientos','Recetas médicas','Control CCSS','Genérico vs marca','Alertas caducidad','Historial paciente','IVA 2% medicamentos'].map(f => <Badge key={f} label={f} color="#3DBF7F"/>)}
            </div>
          </div>
        ),
      },
      {
        id:'ind-otros', title:'Otros módulos',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { icon:Scissors, title:'Peluquería / Salón', color:'#A78BFA', features:['Agenda de citas','Servicios por empleado','Comisiones','Historial del cliente'] },
              { icon:Shirt,    title:'Ropa / Moda',        color:'#5AAAF0', features:['Tallas y colores','Colecciones','Temporadas','Devoluciones'] },
              { icon:Leaf,     title:'Verdulería',         color:'#3DBF7F', features:['Venta por peso','Control de frescura','Lotes','Precios de temporada'] },
              { icon:ShoppingBag, title:'Supermercado',   color:'#F0A030', features:['Código de barras','Precios por volumen','Cajas múltiples','Proveedores'] },
            ].map(({ icon:Icon, title, color, features }) => (
              <div key={title} style={{ padding:'13px', background:'rgba(255,255,255,0.02)', border:`1px solid ${color}18`, borderRadius:'11px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={13} color={color}/></div>
                  <p style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{title}</p>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap' as const }}>{features.map(f => <Badge key={f} label={f} color={color}/>)}</div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ── 9. PEDIDOS ONLINE ──────────────────────────────────────────────────────
  {
    id:'pedidos', icon:Globe, label:'Pedidos online', color:'#FF5C35',
    chapters:[
      {
        id:'pedidos-intro', title:'¿Qué es el catálogo online?',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.6)', lineHeight:1.85 }}>El catálogo online es una página pública donde tus clientes ven tus productos y hacen pedidos directamente desde su celular, sin descargar ninguna app.</p>
            <Grid2>
              <MiniCard icon={Globe} title="Link público" desc="Cada negocio tiene su propia URL para compartir"/>
              <MiniCard icon={Smartphone} title="100% móvil" desc="Optimizado para celular, tablet y desktop" color="#5AAAF0"/>
              <MiniCard icon={Bell} title="Tiempo real" desc="Recibes notificación instantánea al llegar un pedido" color="#3DBF7F"/>
              <MiniCard icon={Palette} title="Color personalizado" desc="La UI usa el color de tu marca configurado en el perfil" color="#A78BFA"/>
            </Grid2>
            <Tip>El link de tu catálogo es: <strong style={{ color:'#FF5C35' }}>daxcloud.shop/order/tu-slug</strong>. Puedes compartirlo por WhatsApp, Instagram o como código QR.</Tip>
          </div>
        ),
      },
      {
        id:'pedidos-perfil', title:'Personalizar el catálogo',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El catálogo usa la información de tu perfil público:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <KeyVal k="Logo del negocio" v="Se muestra en el header del catálogo"/>
              <KeyVal k="Color primario" v="Tiñe toda la interfaz con tu color de marca"/>
              <KeyVal k="Descripción pública" v="Texto introductorio bajo el nombre"/>
              <KeyVal k="Horario" v="Estado abierto/cerrado con punto animado"/>
              <KeyVal k="Redes sociales" v="Botones de WhatsApp, Instagram y Facebook"/>
              <KeyVal k="Acepta pedidos" v="Toggle para abrir/cerrar el catálogo"/>
            </div>
            <Note>Configura todo en Configuración → Perfil público. Los cambios se reflejan inmediatamente en el catálogo sin necesidad de deploy.</Note>
          </div>
        ),
      },
      {
        id:'pedidos-flujo-cliente', title:'Flujo del cliente',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Step n={1} title="Abre el link" desc="El cliente abre el link desde su celular. No necesita registrarse ni descargar nada."/>
            <Step n={2} title="Explora el catálogo" desc="Ve productos agrupados por categoría con imagen, descripción y precio. Busca y filtra fácilmente."/>
            <Step n={3} title="Agrega al carrito" desc="Toca + para agregar. El FAB flotante muestra el total en tiempo real."/>
            <Step n={4} title="Elige tipo de entrega" desc="Selecciona Pickup (recoger en local) o Delivery (a domicilio)."/>
            <Step n={5} title="Ingresa sus datos" desc="Nombre, teléfono, dirección (si es delivery) y notas adicionales."/>
            <Step n={6} title="Confirma el pedido" desc="Revisa el resumen y confirma. Recibe un número de orden como comprobante."/>
            <Note>El pago siempre es contra entrega. El cliente paga cuando recoge o recibe su pedido.</Note>
          </div>
        ),
      },
      {
        id:'pedidos-gestion', title:'Gestionar pedidos entrantes',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <Table
              headers={['Estado','Color','Acción']}
              rows={[
                ['Nuevo','🟠 Coral pulsante','Confirmar y preparar'],
                ['Preparando','🟡 Ámbar','Avisar que está listo'],
                ['Listo','🔵 Azul','Entregar al cliente'],
                ['Entregado','🟢 Verde','Completado'],
                ['Cancelado','🔴 Rojo','Cancelado'],
              ]}
            />
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>Los pedidos nuevos pulsan en coral para que no los pierdas. El dashboard se actualiza cada 15 segundos automáticamente.</p>
            <Tip>Usa el botón "Llamar" en cada pedido para contactar directamente al cliente con un toque.</Tip>
          </div>
        ),
      },
      {
        id:'pedidos-productos', title:'Productos en el catálogo',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>El catálogo muestra automáticamente todos los productos activos con:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <KeyVal k="Imagen" v="Foto del producto o ícono placeholder"/>
              <KeyVal k="Nombre y descripción" v="Los configurados en el producto"/>
              <KeyVal k="Precio" v="El precio de venta configurado"/>
              <KeyVal k="Categoría" v="Se usa como filtro en el catálogo"/>
              <KeyVal k="Badge IVA" v="Si el producto tiene IVA configurado"/>
              <KeyVal k="Badge Popular" v="Los 3 productos de mayor precio destacan con 🔥"/>
            </div>
            <Warning>Solo aparecen productos con estado Activo. Si un producto no aparece, verifica que esté activo en Productos → Editar.</Warning>
          </div>
        ),
      },
    ],
  },

  // ── 10. PERFIL PÚBLICO ─────────────────────────────────────────────────────
  {
    id:'perfil', icon:Palette, label:'Perfil del negocio', color:'#F0A030',
    chapters:[
      {
        id:'perfil-config', title:'Configurar el perfil público',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Ve a <strong style={{ color:'#fff' }}>Configuración → Perfil público</strong> para editar toda la información visible para tus clientes.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <KeyVal k="Logo" v="JPG/PNG hasta 2MB, recomendado 500×500px"/>
              <KeyVal k="Nombre comercial" v="Aparece en catálogo, recibos e interfaz"/>
              <KeyVal k="Descripción pública" v="Hasta 200 caracteres visibles en el catálogo"/>
              <KeyVal k="Horario de apertura/cierre" v="Formato 24h, se muestra en el catálogo"/>
              <KeyVal k="Acepta pedidos" v="Toggle para abrir o cerrar el catálogo online"/>
              <KeyVal k="Redes sociales" v="Instagram, Facebook, WhatsApp"/>
              <KeyVal k="Color primario" v="Colorea toda la UI del catálogo con tu marca"/>
            </div>
          </div>
        ),
      },
      {
        id:'perfil-fiscal', title:'Configuración fiscal',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <KeyVal k="Moneda" v="CRC, USD, MXN, GTQ, HNL, NIO, COP, PEN"/>
              <KeyVal k="IVA / Impuesto general" v="Porcentaje aplicable al negocio"/>
              <KeyVal k="Cédula jurídica" v="Para encabezado de recibos y reportes"/>
              <KeyVal k="Razón social" v="Nombre legal de la empresa"/>
              <KeyVal k="IBAN / Cuenta SINPE" v="Para pagos de suscripción y cobros"/>
            </div>
            <Note>La configuración fiscal afecta los cálculos en el módulo contable y los encabezados de recibos. Actualízala antes de declarar IVA.</Note>
          </div>
        ),
      },
    ],
  },

  // ── 11. CONFIGURACIÓN ──────────────────────────────────────────────────────
  {
    id:'configuracion', icon:Settings, label:'Configuración', color:'#5AAAF0',
    chapters:[
      {
        id:'config-empresa', title:'Datos de empresa',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>En Configuración encuentras todas las secciones del sistema:</p>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'6px' }}>
              {['Perfil personal','Negocio','Plan y suscripción','Usuarios','Roles','Moneda e idioma','Notificaciones','Seguridad','Apariencia','Datos','Impresión','Perfil público'].map(s => <Badge key={s} label={s} color="#5AAAF0"/>)}
            </div>
          </div>
        ),
      },
      {
        id:'config-usuarios', title:'Usuarios y roles',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <Table
              headers={['Rol','POS','Inventario','Analytics','Configuración']}
              rows={[
                ['Admin','✓ Completo','✓ Completo','✓ Completo','✓ Completo'],
                ['Gerente','✓ Completo','✓ Completo','✓ Completo','✗ Limitado'],
                ['Cajero','✓ Ventas','✗ Solo ver','✗ Básico','✗ No accede'],
                ['Inventario','✗ No accede','✓ Completo','✓ Básico','✗ No accede'],
                ['Contador','✗ No accede','✗ No accede','✓ Completo','✗ No accede'],
              ]}
            />
            <Note>Cada usuario puede tener acceso a sucursales específicas. El rol Contador tiene acceso de solo lectura al módulo contable.</Note>
          </div>
        ),
      },
      {
        id:'config-sucursales', title:'Sucursales',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>Cada sucursal tiene su propio:</p>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:'6px' }}>
              {['Inventario independiente','Caja y cierres','Usuarios asignados','Reportes separados','Impresora configurada','Número de mesas'].map(f => <Badge key={f} label={f} color="#5AAAF0"/>)}
            </div>
            <Table
              headers={['Plan','Sucursales']}
              rows={[
                ['Starter','1 sucursal'],
                ['Growth','Hasta 3 sucursales'],
                ['Scale','Ilimitadas'],
              ]}
            />
          </div>
        ),
      },
      {
        id:'config-seguridad', title:'Seguridad',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>DaxCloud implementa múltiples capas de seguridad:</p>
            {[
              { icon:Lock, title:'HTTPS/TLS', desc:'Todo el tráfico encriptado con certificado SSL de Let\'s Encrypt.' },
              { icon:Shield, title:'Headers de seguridad', desc:'CSP, HSTS, X-Frame-Options, Permissions-Policy y más activos en producción.' },
              { icon:Eye, title:'JWT + roles', desc:'Autenticación con tokens de corta duración y control de acceso por rol.' },
              { icon:RefreshCw, title:'Rate limiting', desc:'Límite de requests por IP para prevenir ataques de fuerza bruta.' },
            ].map(({ icon:Icon, title, desc }) => (
              <div key={title} style={{ display:'flex', gap:'12px', padding:'10px 13px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                <Icon size={14} color="#5AAAF0" style={{ flexShrink:0, marginTop:'1px' }}/>
                <div><p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>{title}</p><p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</p></div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ── 12. PAGOS DE SUSCRIPCIÓN ───────────────────────────────────────────────
  {
    id:'pagos', icon:CreditCard, label:'Suscripción y pagos', color:'#3DBF7F',
    chapters:[
      {
        id:'pagos-sinpe', title:'Pago por SINPE Móvil',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Step n={1} title="Elige tu plan" desc="En la página principal selecciona el plan y haz clic en SINPE Móvil."/>
            <Step n={2} title="Realiza la transferencia" desc="Transfiere el monto exacto al número SINPE indicado. Agrega el nombre de tu negocio como concepto."/>
            <Step n={3} title="Envía el comprobante" desc="Sube la foto del comprobante en el formulario que aparece."/>
            <Step n={4} title="Activación manual" desc="El equipo verifica el pago y activa tu plan en menos de 2 horas hábiles."/>
            <Note>SINPE se procesa lunes a viernes 8am–6pm. Fuera de ese horario, la activación es el siguiente día hábil.</Note>
          </div>
        ),
      },
      {
        id:'pagos-tarjeta', title:'Pago con tarjeta (Pagadito)',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Step n={1} title="Elige tu plan" desc="En la página principal selecciona el plan y haz clic en Tarjeta."/>
            <Step n={2} title="Registro previo" desc="Si no tienes cuenta, completa el registro. Serás redirigido al pago automáticamente."/>
            <Step n={3} title="Pago seguro con Pagadito" desc="Ingresa los datos de tu tarjeta Visa o Mastercard en la plataforma segura de Pagadito."/>
            <Step n={4} title="Activación automática" desc="El plan se activa de forma inmediata sin intervención manual."/>
            <Tip>Pagadito está disponible en Costa Rica, Guatemala, El Salvador, Honduras, Nicaragua, Panamá, México y más países de América Latina.</Tip>
          </div>
        ),
      },
      {
        id:'pagos-cambiar', title:'Cambiar o cancelar plan',
        content:(
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <KeyVal k="Cambiar de plan" v="Configuración → Plan y suscripción → Cambiar plan"/>
              <KeyVal k="Ver fecha de vencimiento" v="Configuración → Plan y suscripción"/>
              <KeyVal k="Cancelar suscripción" v="Configuración → Plan y suscripción → Cancelar"/>
              <KeyVal k="Conservación de datos" v="30 días después del vencimiento en modo lectura"/>
            </div>
            <Warning>Al cancelar, tu cuenta pasa a modo lectura. Los datos se conservan 30 días antes de eliminarse permanentemente.</Warning>
          </div>
        ),
      },
    ],
  },

];

// ── Modal ─────────────────────────────────────────────────────────────────────
export function ManualModal({ onClose }: { onClose:() => void }) {
  const [activeSection, setActiveSection] = useState('inicio');
  const [activeChapter, setActiveChapter] = useState('que-es');
  const [search, setSearch]               = useState('');
  const [mobileNav, setMobileNav]         = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top:0, behavior:'smooth' });
  }, [activeChapter]);

  const currentSection = SECTIONS.find(s => s.id===activeSection)!;
  const currentChapter = currentSection?.chapters.find(c => c.id===activeChapter);

  const searchResults = search.length > 2
    ? SECTIONS.flatMap(s => s.chapters.filter(c => c.title.toLowerCase().includes(search.toLowerCase())).map(c => ({ section:s, chapter:c })))
    : [];

  const selectChapter = (sectionId:string, chapterId:string) => {
    setActiveSection(sectionId); setActiveChapter(chapterId); setSearch(''); setMobileNav(false);
  };

  const allChapters = SECTIONS.flatMap(s => s.chapters.map(c => ({ sectionId:s.id, chapterId:c.id, title:c.title })));
  const currentIdx  = allChapters.findIndex(c => c.chapterId===activeChapter);
  const prevChapter = allChapters[currentIdx-1];
  const nextChapter = allChapters[currentIdx+1];

  const totalChapters = SECTIONS.reduce((a,s) => a+s.chapters.length, 0);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)' }}/>

      <div style={{ position:'relative', width:'100%', maxWidth:'1120px', height:'min(92vh,780px)', background:'#080C14', border:'1px solid rgba(255,92,53,0.18)', borderRadius:'20px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 100px rgba(0,0,0,0.8)', animation:'manualOpen .35s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,92,53,0.4),transparent)', zIndex:1 }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, background:'rgba(8,12,20,0.95)', backdropFilter:'blur(20px)', position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(255,92,53,0.1)', border:'1px solid rgba(255,92,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <BookOpen size={15} color="#FF5C35"/>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                <h2 style={{ fontSize:'15px', fontWeight:800, color:'#fff', letterSpacing:'-.02em', margin:0 }}>Manual de DaxCloud</h2>
                <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:'rgba(255,92,53,0.1)', border:'1px solid rgba(255,92,53,0.2)', color:'#FF5C35' }}>v3.0</span>
              </div>
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', margin:0 }}>{SECTIONS.length} secciones · {totalChapters} capítulos</p>
            </div>
          </div>

          <div style={{ position:'relative', flex:1, maxWidth:'280px' }}>
            <Search size={12} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en el manual..."
              style={{ width:'100%', padding:'8px 13px 8px 32px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'9px', color:'#F0F4FF', fontSize:'12px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const, transition:'all .2s' }}
              onFocus={e => { e.target.style.borderColor='rgba(255,92,53,0.4)'; e.target.style.background='rgba(255,92,53,0.04)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.04)'; }}
            />
            {search.length > 2 && (
              <div style={{ position:'absolute', top:'calc(100% + 5px)', left:0, right:0, background:'rgba(8,14,26,0.99)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'11px', overflow:'hidden', zIndex:100, boxShadow:'0 16px 40px rgba(0,0,0,0.6)', maxHeight:'240px', overflowY:'auto' }}>
                {searchResults.length === 0
                  ? <p style={{ padding:'13px 15px', fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>Sin resultados</p>
                  : searchResults.map(({ section, chapter }) => (
                    <div key={chapter.id} onClick={() => selectChapter(section.id, chapter.id)}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 13px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                      <Hash size={10} color={section.color}/>
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

          <button onClick={() => setMobileNav(p => !p)} className="manual-toggle" style={{ display:'none', alignItems:'center', gap:'5px', padding:'7px 11px', background:'rgba(255,92,53,0.07)', border:'1px solid rgba(255,92,53,0.2)', borderRadius:'8px', color:'#FF5C35', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <Layers size={12}/> Secciones
          </button>

          <button onClick={onClose} style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; }}>
            <X size={14} color="rgba(255,255,255,0.5)"/>
          </button>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Sidebar */}
          <div className={`manual-sidebar ${mobileNav?'mobile-open':''}`} style={{ width:'220px', borderRight:'1px solid rgba(255,255,255,0.06)', overflowY:'auto', padding:'14px 8px', flexShrink:0, background:'rgba(6,10,18,0.98)' }}>
            {SECTIONS.map(section => {
              const Icon = section.icon;
              const isActive = section.id===activeSection;
              return (
                <div key={section.id} style={{ marginBottom:'3px' }}>
                  <div onClick={() => { setActiveSection(section.id); setActiveChapter(section.chapters[0].id); setMobileNav(false); }}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'9px', cursor:'pointer', background: isActive?`${section.color}10`:'transparent', border: isActive?`1px solid ${section.color}25`:'1px solid transparent', transition:'all .15s', marginBottom: isActive?'3px':0 }}
                    onMouseEnter={e => { if(!isActive) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if(!isActive) (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                    <Icon size={13} color={isActive?section.color:'rgba(255,255,255,0.3)'}/>
                    <span style={{ fontSize:'11px', fontWeight: isActive?700:500, color: isActive?section.color:'rgba(255,255,255,0.45)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{section.label}</span>
                    {isActive && <ChevronRight size={10} color={section.color}/>}
                  </div>
                  {isActive && (
                    <div style={{ paddingLeft:'12px', display:'flex', flexDirection:'column', gap:'1px' }}>
                      {section.chapters.map(chapter => (
                        <div key={chapter.id} onClick={() => { setActiveChapter(chapter.id); setMobileNav(false); }}
                          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'6px 9px', borderRadius:'7px', cursor:'pointer', background: activeChapter===chapter.id?'rgba(255,255,255,0.06)':'transparent', transition:'background .12s' }}
                          onMouseEnter={e => { if(activeChapter!==chapter.id) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
                          onMouseLeave={e => { if(activeChapter!==chapter.id) (e.currentTarget as HTMLElement).style.background='transparent'; }}>
                          <div style={{ width:'4px', height:'4px', borderRadius:'50%', background: activeChapter===chapter.id?section.color:'rgba(255,255,255,0.2)', flexShrink:0, transition:'background .15s' }}/>
                          <span style={{ fontSize:'11px', color: activeChapter===chapter.id?'#fff':'rgba(255,255,255,0.4)', fontWeight: activeChapter===chapter.id?600:400, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{chapter.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div ref={contentRef} style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'18px' }}>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>{currentSection.label}</span>
              <ChevronRight size={9} color="rgba(255,255,255,0.2)"/>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{currentChapter?.title}</span>
              <span style={{ marginLeft:'auto', fontSize:'10px', color:'rgba(255,255,255,0.2)' }}>{currentIdx+1} / {totalChapters}</span>
            </div>

            {/* Chapter title */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px', paddingBottom:'18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'11px', background:`${currentSection.color}12`, border:`1px solid ${currentSection.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {(() => { const Icon = currentSection.icon; return <Icon size={18} color={currentSection.color}/>; })()}
              </div>
              <h2 style={{ fontSize:'21px', fontWeight:800, color:'#fff', letterSpacing:'-.02em', margin:0, lineHeight:1.1 }}>{currentChapter?.title}</h2>
            </div>

            <div style={{ animation:'fadeUp .25s ease' }}>{currentChapter?.content}</div>

            {/* Nav prev/next */}
            <div style={{ display:'flex', justifyContent:'space-between', gap:'10px', marginTop:'36px', paddingTop:'18px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              {prevChapter
                ? <button onClick={() => selectChapter(prevChapter.sectionId, prevChapter.chapterId)}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit', transition:'all .2s', flex:1, maxWidth:'200px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,92,53,0.25)'; (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}>
                    <ChevronRight size={12} color="rgba(255,255,255,0.3)" style={{ transform:'rotate(180deg)', flexShrink:0 }}/>
                    <div style={{ textAlign:'left' as const, overflow:'hidden' }}>
                      <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' as const }}>Anterior</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{prevChapter.title}</p>
                    </div>
                  </button>
                : <div/>
              }
              {nextChapter
                ? <button onClick={() => selectChapter(nextChapter.sectionId, nextChapter.chapterId)}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 14px', background:'rgba(255,92,53,0.06)', border:'1px solid rgba(255,92,53,0.2)', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit', transition:'all .2s', flex:1, maxWidth:'200px', justifyContent:'flex-end' as const }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,92,53,0.06)'; }}>
                    <div style={{ textAlign:'right' as const, overflow:'hidden' }}>
                      <p style={{ fontSize:'9px', color:'rgba(255,92,53,0.55)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' as const }}>Siguiente</p>
                      <p style={{ fontSize:'11px', color:'rgba(255,92,53,0.85)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{nextChapter.title}</p>
                    </div>
                    <ChevronRight size={12} color="rgba(255,92,53,0.7)" style={{ flexShrink:0 }}/>
                  </button>
                : <div/>
              }
            </div>

            <p style={{ textAlign:'center' as const, marginTop:'20px', fontSize:'10px', color:'rgba(255,255,255,0.1)' }}>
              DaxCloud · Manual v3.0 · {SECTIONS.length} secciones · {totalChapters} capítulos · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes manualOpen { from{opacity:0;transform:scale(.97) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .manual-sidebar::-webkit-scrollbar { width:3px }
        .manual-sidebar::-webkit-scrollbar-track { background:transparent }
        .manual-sidebar::-webkit-scrollbar-thumb { background:rgba(255,92,53,0.2);border-radius:3px }
        @media(max-width:767px){
          .manual-toggle { display:flex!important }
          .manual-sidebar { position:absolute;left:0;top:0;bottom:0;z-index:50;transform:translateX(-100%);transition:transform .3s cubic-bezier(.22,1,.36,1) }
          .manual-sidebar.mobile-open { transform:translateX(0) }
        }
      `}</style>
    </div>
  );
}
