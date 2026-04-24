'use client';
import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  BarChart2, FileText, TrendingUp, Download, Calendar,
  DollarSign, ChevronDown, RefreshCw, BookOpen, Receipt,
  ArrowUpRight, ArrowDownRight, Percent, Scale, PieChart,
  Printer, Search, Filter, Eye, Building2, Clock, Check,
  AlertCircle, ChevronRight, Layers, Activity, CreditCard,
  Banknote, Smartphone, ArrowLeftRight, UserCheck, X,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number, currency = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style:'currency', currency, maximumFractionDigits:0 }).format(n);
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day:'2-digit', month:'long', year:'numeric' });
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('es-CR').format(Math.round(n));
}

const PAY_LABELS: Record<string,string> = {
  cash:'Efectivo', card:'Tarjeta', sinpe:'SINPE Móvil',
  transfer:'Transferencia', mixed:'Pago mixto', credit:'Crédito interno',
};
const PAY_COLORS: Record<string,string> = {
  cash:'#3DBF7F', card:'#A78BFA', sinpe:'#5AAAF0',
  transfer:'#5AAAF0', mixed:'#F0A030', credit:'#FF5C35',
};
const PAY_ICONS: Record<string,any> = {
  cash: Banknote, card: CreditCard, sinpe: Smartphone,
  transfer: ArrowLeftRight, mixed: Layers, credit: UserCheck,
};

function getPeriodDates(period: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2,'0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  switch(period) {
    case 'today':      return { from: fmt(now), to: fmt(now) };
    case 'week':       { const d=new Date(now); d.setDate(d.getDate()-d.getDay()); return { from:fmt(d), to:fmt(now) }; }
    case 'month':      return { from:`${now.getFullYear()}-${pad(now.getMonth()+1)}-01`, to:fmt(now) };
    case 'last_month': { const d=new Date(now.getFullYear(),now.getMonth()-1,1); const e=new Date(now.getFullYear(),now.getMonth(),0); return { from:fmt(d), to:fmt(e) }; }
    case 'quarter':    { const q=Math.floor(now.getMonth()/3); return { from:fmt(new Date(now.getFullYear(),q*3,1)), to:fmt(now) }; }
    case 'year':       return { from:`${now.getFullYear()}-01-01`, to:fmt(now) };
    default:           return { from:fmt(now), to:fmt(now) };
  }
}

// ── Export helpers ────────────────────────────────────────────────────────────
function exportCSV(rows: any[], filename: string) {
  if(!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

function printReport(title: string, subtitle: string, tableId: string) {
  const el = document.getElementById(tableId);
  if(!el) return;
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Arial',sans-serif;font-size:11px;color:#111;padding:24px 28px;background:#fff;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #111;}
    .header h1{font-size:18px;font-weight:700;margin-bottom:4px;}
    .header p{font-size:10px;color:#666;}
    .meta{font-size:10px;color:#666;text-align:right;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    th{background:#f4f4f4;font-size:9px;text-transform:uppercase;letter-spacing:.06em;padding:8px 10px;border:1px solid #ddd;text-align:left;font-weight:700;}
    td{padding:7px 10px;border:1px solid #e8e8e8;font-size:10px;vertical-align:top;}
    tr:nth-child(even) td{background:#fafafa;}
    .total-row td{font-weight:700;background:#f0f0f0;border-top:2px solid #aaa;font-size:11px;}
    .number{text-align:right;font-family:'Courier New',monospace;}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;background:#eee;color:#333;}
    @media print{@page{margin:12mm;size:A4 portrait;}body{padding:0;}}
  </style></head><body>
  <div class="header">
    <div><h1>${title}</h1><p>${subtitle}</p></div>
    <div class="meta"><p>Generado: ${new Date().toLocaleString('es-CR')}</p><p>DaxCloud POS · Sistema contable</p></div>
  </div>
  ${el.outerHTML}
  </body></html>`;
  const win = window.open('','_blank','width=960,height=720,scrollbars=1');
  if(!win) return;
  win.document.write(html); win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// ── Componentes ───────────────────────────────────────────────────────────────
const S = {
  bg:     'var(--dax-bg)',
  surf:   'var(--dax-surface)',
  surf2:  'var(--dax-surface-2)',
  border: 'var(--dax-surface-2)',
  border2:'rgba(255,255,255,0.11)',
  muted:  'var(--dax-white-35)',
  dim:    'rgba(255,255,255,0.18)',
  th:     { fontSize:'10px', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.65)', padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'var(--dax-coral-soft)', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:     { fontSize:'12px', color: 'var(--dax-white-60)', padding:'9px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'top' as const },
  tdR:    { fontSize:'12px', color: 'var(--dax-white-60)', padding:'9px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', textAlign:'right' as const, fontFamily:'monospace' },
};

function KPICard({ label, value, sub, color='#FF5C35', icon: Icon, trend, trendVal }: any) {
  return (
    <div style={{ padding:'18px 20px', background:S.surf, border:`1px solid ${S.border}`, borderRadius:'14px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:'80px', height:'80px', background:`radial-gradient(circle at top right, ${color}12, transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px' }}>
        <p style={{ fontSize:'11px', fontWeight:600, color: 'var(--dax-white-35)', letterSpacing:'.08em', textTransform:'uppercase' as const }}>{label}</p>
        {Icon && <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:`${color}15`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={14} color={color}/>
        </div>}
      </div>
      <p style={{ fontSize:'24px', fontWeight:900, color, letterSpacing:'-.02em', lineHeight:1, marginBottom:'6px' }}>{value}</p>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        {trend && <span style={{ display:'flex', alignItems:'center', gap:'2px', fontSize:'11px', fontWeight:700, color: trend==='up'?'#3DBF7F':'#E05050' }}>
          {trend==='up' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
          {trendVal}
        </span>}
        {sub && <p style={{ fontSize:'11px', color:'var(--dax-text-muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, children }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
      <div>
        <h3 style={{ fontSize:'15px', fontWeight:800, color: 'var(--dax-text-primary)', letterSpacing:'-.02em', marginBottom:'2px' }}>{title}</h3>
        {subtitle && <p style={{ fontSize:'12px', color: 'var(--dax-white-35)' }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>{children}</div>}
    </div>
  );
}

function ExportBtn({ onCSV, onPDF, small }: any) {
  return (
    <>
      <button onClick={onCSV} style={{ display:'flex', alignItems:'center', gap:'5px', padding: small?'6px 11px':'8px 14px', background:'var(--dax-success-bg)', border:'1px solid rgba(61,191,127,0.2)', borderRadius:'9px', color: 'var(--dax-success)', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
        <Download size={11}/> Excel
      </button>
      <button onClick={onPDF} style={{ display:'flex', alignItems:'center', gap:'5px', padding: small?'6px 11px':'8px 14px', background:'var(--dax-coral-soft)', border:'1px solid rgba(255,92,53,0.2)', borderRadius:'9px', color: 'var(--dax-coral)', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
        <Printer size={11}/> PDF
      </button>
    </>
  );
}

function TableWrap({ children }: any) {
  return (
    <div style={{ overflowX:'auto', borderRadius:'12px', border:`1px solid ${S.border}` }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
        {children}
      </table>
    </div>
  );
}

const PERIODS = [
  { value:'today',      label:'Hoy' },
  { value:'week',       label:'Esta semana' },
  { value:'month',      label:'Este mes' },
  { value:'last_month', label:'Mes anterior' },
  { value:'quarter',    label:'Este trimestre' },
  { value:'year',       label:'Este año' },
  { value:'custom',     label:'Personalizado' },
];

const TABS = [
  { id:'dashboard', label:'Dashboard',       icon:BarChart2  },
  { id:'sales',     label:'Libro de ventas', icon:BookOpen   },
  { id:'income',    label:'Estado de resultados', icon:TrendingUp },
  { id:'tax',       label:'Declaración IVA', icon:Receipt    },
  { id:'cashflow',  label:'Flujo de caja',   icon:Activity   },
  { id:'products',  label:'Análisis de productos', icon:PieChart },
];

// ── Página principal ──────────────────────────────────────────────────────────
export default function AccountingPage() {
  const [tab,    setTab]    = useState('dashboard');
  const [period, setPeriod] = useState('month');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');
  const [search, setSearch] = useState('');

  const dates = period==='custom' ? { from, to } : getPeriodDates(period);

  const params = new URLSearchParams();
  if(dates.from) params.append('from', dates.from);
  if(dates.to)   params.append('to',   dates.to);

  const { data: rawSales = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['accounting', dates.from, dates.to],
    queryFn: () => api.get(`/sales?${params}&limit=2000`).then(r => r.data?.data ?? r.data ?? []),
    enabled: !!dates.from && !!dates.to,
  });

  const sales = Array.isArray(rawSales) ? rawSales : [];

  // ── Cálculos base ─────────────────────────────────────────────────────────
  const totalRevenue  = sales.reduce((a,s) => a+Number(s.total??0), 0);
  const totalSubtotal = sales.reduce((a,s) => a+Number(s.subtotal??0), 0);
  const totalDiscount = sales.reduce((a,s) => a+Number(s.discount??0), 0);
  const totalTax      = sales.reduce((a,s) => a+Number(s.tax??0), 0);
  const totalCost     = sales.reduce((a,s) =>
    a+(s.items??[]).reduce((b: number, i: any) => b+Number(i.quantity??0)*Number(i.product?.cost??0), 0), 0);
  const grossProfit   = totalRevenue - totalCost;
  const netProfit     = grossProfit - totalDiscount;
  const margin        = totalRevenue>0 ? (netProfit/totalRevenue)*100 : 0;
  const avgTicket     = sales.length>0 ? totalRevenue/sales.length : 0;
  const taxBase       = totalSubtotal - totalDiscount;
  const effectiveTax  = taxBase>0 ? (totalTax/taxBase)*100 : 0;

  // ── Por método de pago ────────────────────────────────────────────────────
  const byMethod: Record<string,{ amount:number; count:number }> = {};
  sales.forEach(s => {
    const m = s.paymentMethod ?? 'other';
    if(!byMethod[m]) byMethod[m] = { amount:0, count:0 };
    byMethod[m].amount += Number(s.total??0);
    byMethod[m].count++;
  });

  // ── Por día (para flujo de caja y gráfico) ────────────────────────────────
  const byDay: Record<string,{ revenue:number; cost:number; tax:number; count:number }> = {};
  sales.forEach(s => {
    const d = s.createdAt?.slice(0,10) ?? '';
    if(!byDay[d]) byDay[d] = { revenue:0, cost:0, tax:0, count:0 };
    byDay[d].revenue += Number(s.total??0);
    byDay[d].tax     += Number(s.tax??0);
    byDay[d].count++;
  });
  const dayRows = Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b));

  // ── Por producto ──────────────────────────────────────────────────────────
  const byProduct: Record<string,{ name:string; qty:number; revenue:number; cost:number }> = {};
  sales.forEach(s => {
    (s.items??[]).forEach((i: any) => {
      const pid = i.productId ?? i.product?.id ?? 'unknown';
      const name = i.product?.name ?? i.name ?? 'Producto';
      if(!byProduct[pid]) byProduct[pid] = { name, qty:0, revenue:0, cost:0 };
      byProduct[pid].qty     += Number(i.quantity??0);
      byProduct[pid].revenue += Number(i.subtotal??0);
      byProduct[pid].cost    += Number(i.quantity??0)*Number(i.product?.cost??0);
    });
  });
  const productRows = Object.entries(byProduct)
    .map(([,v]) => v)
    .sort((a,b) => b.revenue-a.revenue);

  // ── Filtro de búsqueda para libro ─────────────────────────────────────────
  const filteredSales = sales.filter(s => {
    if(!search) return true;
    const q = search.toLowerCase();
    return s.id?.includes(q) ||
      `${s.user?.firstName??''} ${s.user?.lastName??''}`.toLowerCase().includes(q) ||
      s.branch?.name?.toLowerCase().includes(q) ||
      (PAY_LABELS[s.paymentMethod]??'').toLowerCase().includes(q);
  });

  const periodLabel = PERIODS.find(p => p.value===period)?.label ?? period;
  const subtitle = `${fmtDateLong(dates.from+'T00:00')} — ${fmtDateLong(dates.to+'T00:00')}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'28px 24px', maxWidth:'1280px', fontFamily:"'Inter','Outfit',system-ui,sans-serif", minHeight:'100vh' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'16px' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background: 'var(--dax-coral-soft)', border:'1px solid rgba(255,92,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Scale size={17} color="#FF5C35"/>
            </div>
            <h1 style={{ fontSize:'22px', fontWeight:900, color: 'var(--dax-text-primary)', letterSpacing:'-.03em' }}>Módulo Contable</h1>
            <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'20px', background:'var(--dax-success-bg)', border:'1px solid rgba(61,191,127,0.2)', color: 'var(--dax-success)' }}>PRO</span>
          </div>
          <p style={{ fontSize:'13px', color:'var(--dax-white-35)' }}>{subtitle}</p>
        </div>

        {/* Controles de período */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <Calendar size={13} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              style={{ padding:'9px 30px 9px 32px', background:'var(--dax-surface-2)', border:`1px solid ${S.border2}`, borderRadius:'10px', color: 'var(--dax-text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none', appearance:'none', cursor:'pointer' }}>
              {PERIODS.map(p => <option key={p.value} value={p.value} style={{ background: 'var(--dax-bg)' }}>{p.label}</option>)}
            </select>
            <ChevronDown size={11} color="rgba(255,255,255,0.3)" style={{ position:'absolute', right:'9px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
          </div>
          {period==='custom' && <>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding:'9px 12px', background:'var(--dax-surface-2)', border:`1px solid ${S.border2}`, borderRadius:'10px', color: 'var(--dax-text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none' }}/>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding:'9px 12px', background:'var(--dax-surface-2)', border:`1px solid ${S.border2}`, borderRadius:'10px', color: 'var(--dax-text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none' }}/>
          </>}
          <button onClick={() => refetch()} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'9px 14px', background:'var(--dax-surface-2)', border:`1px solid ${S.border}`, borderRadius:'10px', color:'var(--dax-white-35)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
            <RefreshCw size={12}/> Actualizar
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display:'flex', gap:'2px', marginBottom:'24px', borderBottom:`1px solid ${S.border}`, overflowX:'auto', scrollbarWidth:'none' as const }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab===t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 16px', borderRadius:'10px 10px 0 0', border:'none', borderBottom: active ? '2px solid #FF5C35' : '2px solid transparent', background: active ? 'var(--dax-coral-soft)' : 'transparent', color: active ? '#FF5C35' : 'var(--dax-white-35)', fontSize:'12px', fontWeight: active ? 700 : 500, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', marginBottom:'-1px', flexShrink:0, whiteSpace:'nowrap' as const }}>
              <Icon size={13}/> {t.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div style={{ textAlign:'center', padding:'80px', color:'var(--dax-text-muted)' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2.5px solid rgba(255,92,53,0.15)', borderTopColor:'#FF5C35', animation:'spin .7s linear infinite', margin:'0 auto 16px' }}/>
          <p style={{ fontSize:'14px' }}>Cargando datos contables...</p>
        </div>
      )}

      {!isLoading && <>

        {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
        {tab==='dashboard' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

            {/* KPIs principales */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px' }}>
              <KPICard label="Ingresos totales"    value={fmt(totalRevenue)}  icon={DollarSign} color="#FF5C35" sub={`${sales.length} ventas`}/>
              <KPICard label="Utilidad bruta"      value={fmt(grossProfit)}   icon={TrendingUp} color="#3DBF7F" sub={`Margen ${fmtPct(margin)}`}/>
              <KPICard label="IVA recaudado"       value={fmt(totalTax)}      icon={Receipt}    color="#5AAAF0" sub={`Tasa efectiva ${fmtPct(effectiveTax)}`}/>
              <KPICard label="Ticket promedio"     value={fmt(avgTicket)}     icon={Activity}   color="#F0A030" sub={`${sales.length} transacciones`}/>
              <KPICard label="Total descuentos"    value={fmt(totalDiscount)} icon={Percent}    color="#A78BFA" sub="Descuentos aplicados"/>
              <KPICard label="Costo de ventas"     value={fmt(totalCost)}     icon={Scale}      color="#E05050" sub="Costo directo"/>
            </div>

            {/* Métodos de pago + Desglose */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

              {/* Métodos de pago */}
              <div style={{ padding:'20px 22px', background:S.surf, border:`1px solid ${S.border}`, borderRadius:'14px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:800, color: 'var(--dax-text-primary)', letterSpacing:'-.01em', marginBottom:'16px' }}>Métodos de pago</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {Object.entries(byMethod).sort(([,a],[,b]) => b.amount-a.amount).map(([method, data]) => {
                    const pct = totalRevenue>0 ? (data.amount/totalRevenue)*100 : 0;
                    const color = PAY_COLORS[method] ?? '#fff';
                    const Icon = PAY_ICONS[method] ?? CreditCard;
                    return (
                      <div key={method}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px' }}>
                          <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Icon size={13} color={color}/>
                          </div>
                          <span style={{ fontSize:'12px', color: 'var(--dax-white-60)', flex:1 }}>{PAY_LABELS[method]??method}</span>
                          <span style={{ fontSize:'11px', color: 'var(--dax-white-35)', marginRight:'4px' }}>{data.count} ventas</span>
                          <span style={{ fontSize:'12px', fontWeight:700, color }}>
                            {fmtPct(pct)}
                          </span>
                        </div>
                        <div style={{ height:'5px', borderRadius:'3px', background:'var(--dax-surface-2)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'3px', transition:'width .6s cubic-bezier(.22,1,.36,1)' }}/>
                        </div>
                        <p style={{ fontSize:'11px', color: 'var(--dax-white-35)', textAlign:'right' as const, marginTop:'3px' }}>{fmt(data.amount)}</p>
                      </div>
                    );
                  })}
                  {Object.keys(byMethod).length===0 && <p style={{ fontSize:'13px', color: 'var(--dax-white-25)', textAlign:'center', padding:'16px 0' }}>Sin datos para el período</p>}
                </div>
              </div>

              {/* Resumen P&L rápido */}
              <div style={{ padding:'20px 22px', background:S.surf, border:`1px solid ${S.border}`, borderRadius:'14px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:800, color: 'var(--dax-text-primary)', letterSpacing:'-.01em', marginBottom:'16px' }}>Rentabilidad del período</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                  {[
                    { label:'Ventas brutas',   value: totalRevenue,                       color: 'var(--dax-text-primary)',    bold:false },
                    { label:'− Descuentos',    value: -totalDiscount,                     color: 'var(--dax-amber)', bold:false },
                    { label:'Ingresos netos',  value: totalRevenue-totalDiscount,         color: 'var(--dax-text-primary)',    bold:true, sep:true },
                    { label:'− Costo ventas',  value: -totalCost,                         color: 'var(--dax-danger)', bold:false },
                    { label:'Utilidad bruta',  value: grossProfit,                        color: grossProfit>=0?'#3DBF7F':'#E05050', bold:true, sep:true },
                    { label:'IVA recaudado',   value: totalTax,                           color: 'var(--dax-blue)', bold:false },
                    { label:`Margen neto`,     value: null, pct: margin,                 color: margin>=0?'#3DBF7F':'#E05050', bold:true, sep:true },
                  ].map(({ label, value, color, bold, sep, pct }, i) => (
                    <div key={i}>
                      {sep && <div style={{ height:'1px', background:'var(--dax-surface-2)', margin:'8px 0' }}/>}
                      {!sep && <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0' }}>
                        <span style={{ fontSize: bold?'13px':'12px', fontWeight: bold?700:400, color: bold?'var(--dax-text-primary)':'var(--dax-white-60)' }}>{label}</span>
                        <span style={{ fontSize: bold?'15px':'12px', fontWeight: bold?900:600, color, fontFamily:'monospace' }}>
                          {pct!==undefined ? fmtPct(pct) : fmt(value??0)}
                        </span>
                      </div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ventas por día */}
            {dayRows.length > 0 && (
              <div style={{ padding:'20px 22px', background:S.surf, border:`1px solid ${S.border}`, borderRadius:'14px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:800, color: 'var(--dax-text-primary)', letterSpacing:'-.01em', marginBottom:'16px' }}>Ingresos por día</h3>
                <div style={{ display:'flex', gap:'4px', alignItems:'flex-end', height:'100px', overflowX:'auto', paddingBottom:'8px' }}>
                  {dayRows.map(([date, data]) => {
                    const maxRev = Math.max(...dayRows.map(([,d]) => d.revenue));
                    const h = maxRev>0 ? Math.max(8, (data.revenue/maxRev)*100) : 8;
                    return (
                      <div key={date} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', flex:1, minWidth:'28px' }}
                        title={`${fmtDate(date+'T00:00')}: ${fmt(data.revenue)} (${data.count} ventas)`}>
                        <div style={{ width:'100%', height:`${h}%`, background:'linear-gradient(180deg,#FF5C35,rgba(255,92,53,0.5))', borderRadius:'4px 4px 0 0', minHeight:'6px', transition:'height .4s' }}/>
                        <span style={{ fontSize:'9px', color: 'var(--dax-white-25)', transform:'rotate(-45deg)', transformOrigin:'center', whiteSpace:'nowrap' as const }}>
                          {new Date(date+'T12:00').toLocaleDateString('es-CR',{ day:'2-digit', month:'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══ LIBRO DE VENTAS ════════════════════════════════════════════════ */}
        {tab==='sales' && (
          <div>
            <SectionHeader title="Libro de ventas" subtitle={`${filteredSales.length} registros · ${subtitle}`}>
              <div style={{ position:'relative' }}>
                <Search size={12} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cajero, sucursal, método..."
                  style={{ padding:'8px 12px 8px 30px', background:'var(--dax-surface-2)', border:`1px solid ${S.border}`, borderRadius:'9px', color: 'var(--dax-text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none', width:'220px' }}/>
              </div>
              <ExportBtn
                onCSV={() => exportCSV(filteredSales.map(s => ({
                  Fecha:         fmtDate(s.createdAt),
                  'No. Venta':   s.id?.slice(-8).toUpperCase(),
                  Cajero:        `${s.user?.firstName??''} ${s.user?.lastName??''}`.trim(),
                  Sucursal:      s.branch?.name??'',
                  Subtotal:      Number(s.subtotal??0).toFixed(2),
                  Descuento:     Number(s.discount??0).toFixed(2),
                  IVA:           Number(s.tax??0).toFixed(2),
                  Total:         Number(s.total??0).toFixed(2),
                  'Método pago': PAY_LABELS[s.paymentMethod]??s.paymentMethod,
                })), `libro-ventas-${dates.from}-${dates.to}.csv`)}
                onPDF={() => printReport('Libro de Ventas', subtitle, 'tbl-sales')}
              />
            </SectionHeader>

            <TableWrap>
              <table id="tbl-sales" style={{ width:'100%', borderCollapse:'collapse', minWidth:'700px' }}>
                <thead>
                  <tr>
                    {['Fecha','No. Venta','Cajero','Sucursal','Subtotal','Descuento','IVA','Total','Método'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((s,i) => (
                    <tr key={s.id} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.012)' }}>
                      <td style={S.td}>{fmtDate(s.createdAt)}</td>
                      <td style={{ ...S.td, fontFamily:'monospace', fontWeight:700, color: 'var(--dax-coral)' }}>#{s.id?.slice(-8).toUpperCase()}</td>
                      <td style={S.td}>{`${s.user?.firstName??''} ${s.user?.lastName??''}`.trim()}</td>
                      <td style={S.td}>{s.branch?.name??'—'}</td>
                      <td style={S.tdR}>{fmt(Number(s.subtotal))}</td>
                      <td style={{ ...S.tdR, color: Number(s.discount)>0?'#F0A030':'var(--dax-text-muted)' }}>
                        {Number(s.discount)>0 ? `-${fmt(Number(s.discount))}` : '—'}
                      </td>
                      <td style={{ ...S.tdR, color: 'var(--dax-blue)' }}>{fmt(Number(s.tax))}</td>
                      <td style={{ ...S.tdR, fontWeight:700, color: 'var(--dax-text-primary)' }}>{fmt(Number(s.total))}</td>
                      <td style={S.td}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:700, background:`${PAY_COLORS[s.paymentMethod]??'#fff'}15`, color:PAY_COLORS[s.paymentMethod]??'#fff' }}>
                          {PAY_LABELS[s.paymentMethod]??s.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Fila de totales */}
                  <tr style={{ background:'var(--dax-coral-soft)' }}>
                    <td colSpan={4} style={{ ...S.td, fontWeight:800, color: 'var(--dax-text-primary)', fontSize:'13px' }}>
                      TOTALES — {filteredSales.length} ventas
                    </td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-text-primary)' }}>{fmt(filteredSales.reduce((a,s)=>a+Number(s.subtotal??0),0))}</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-amber)' }}>{fmt(filteredSales.reduce((a,s)=>a+Number(s.discount??0),0))}</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-blue)' }}>{fmt(filteredSales.reduce((a,s)=>a+Number(s.tax??0),0))}</td>
                    <td style={{ ...S.tdR, fontWeight:900, color: 'var(--dax-coral)', fontSize:'14px' }}>{fmt(filteredSales.reduce((a,s)=>a+Number(s.total??0),0))}</td>
                    <td style={S.td}/>
                  </tr>
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {/* ══ ESTADO DE RESULTADOS ═══════════════════════════════════════════ */}
        {tab==='income' && (
          <div style={{ maxWidth:'720px' }}>
            <SectionHeader title="Estado de Resultados" subtitle={subtitle}>
              <ExportBtn
                onCSV={() => exportCSV([
                  { Concepto:'INGRESOS',           Monto:'',                                          Tipo:'titulo' },
                  { Concepto:'Ventas brutas',       Monto:totalRevenue.toFixed(2),                    Tipo:'ingreso' },
                  { Concepto:'Descuentos',          Monto:`-${totalDiscount.toFixed(2)}`,             Tipo:'deduccion' },
                  { Concepto:'Ingresos netos',      Monto:(totalRevenue-totalDiscount).toFixed(2),    Tipo:'subtotal' },
                  { Concepto:'COSTOS',              Monto:'',                                          Tipo:'titulo' },
                  { Concepto:'Costo de ventas',     Monto:`-${totalCost.toFixed(2)}`,                 Tipo:'costo' },
                  { Concepto:'UTILIDAD',            Monto:'',                                          Tipo:'titulo' },
                  { Concepto:'Utilidad bruta',      Monto:grossProfit.toFixed(2),                     Tipo:'subtotal' },
                  { Concepto:'IVA recaudado',       Monto:totalTax.toFixed(2),                        Tipo:'impuesto' },
                  { Concepto:'Margen neto',         Monto:`${margin.toFixed(2)}%`,                    Tipo:'porcentaje' },
                  { Concepto:'Ticket promedio',     Monto:avgTicket.toFixed(2),                       Tipo:'indicador' },
                ], `estado-resultados-${dates.from}.csv`)}
                onPDF={() => printReport('Estado de Resultados', subtitle, 'tbl-income')}
              />
            </SectionHeader>

            <div style={{ padding:'24px', background:S.surf, border:`1px solid ${S.border}`, borderRadius:'16px' }}>
              <table id="tbl-income" style={{ width:'100%', borderCollapse:'collapse' }}>
                <tbody>
                  {/* Ingresos */}
                  <tr><td colSpan={2} style={{ padding:'6px 0 4px', fontSize:'10px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.6)' }}>INGRESOS</td></tr>
                  {[
                    { label:'Ventas brutas',         v:totalRevenue,                        indent:false },
                    { label:'(-) Descuentos',        v:-totalDiscount,                      indent:true,  color: 'var(--dax-amber)' },
                    { label:'Ingresos netos',        v:totalRevenue-totalDiscount,          indent:false, bold:true, sep:true },
                  ].map(({ label, v, indent, bold, sep, color: c }, i) => (
                    <tr key={i} style={{ borderBottom: sep ? '2px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'9px 0 9px '+(indent?'16px':'0'), fontSize: bold?'14px':'12px', fontWeight: bold?700:400, color: bold?'var(--dax-text-primary)':'var(--dax-white-60)' }}>{label}</td>
                      <td style={{ padding:'9px 0', textAlign:'right' as const, fontFamily:'monospace', fontSize: bold?'16px':'12px', fontWeight: bold?900:600, color: c??(v>=0?'var(--dax-white-60)':'#E05050') }}>{fmt(v)}</td>
                    </tr>
                  ))}

                  <tr><td colSpan={2} style={{ padding:'16px 0 4px', fontSize:'10px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.6)' }}>COSTOS</td></tr>
                  {[
                    { label:'(-) Costo de ventas',   v:-totalCost, color: 'var(--dax-danger)' },
                  ].map(({ label, v, color: c }, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'9px 0', fontSize:'12px', color:'var(--dax-white-60)' }}>{label}</td>
                      <td style={{ padding:'9px 0', textAlign:'right' as const, fontFamily:'monospace', fontSize:'12px', fontWeight:600, color:c }}>{fmt(v)}</td>
                    </tr>
                  ))}

                  <tr><td colSpan={2} style={{ padding:'16px 0 4px', fontSize:'10px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.6)' }}>UTILIDAD</td></tr>
                  {[
                    { label:'Utilidad bruta',        v:grossProfit, bold:true, sep:true },
                    { label:'IVA recaudado',          v:totalTax,   color: 'var(--dax-blue)' },
                  ].map(({ label, v, bold, sep, color: c }, i) => (
                    <tr key={i} style={{ borderBottom: sep?'2px solid rgba(255,255,255,0.08)':'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'9px 0', fontSize: bold?'14px':'12px', fontWeight: bold?700:400, color: bold?'var(--dax-text-primary)':'var(--dax-white-60)' }}>{label}</td>
                      <td style={{ padding:'9px 0', textAlign:'right' as const, fontFamily:'monospace', fontSize: bold?'16px':'12px', fontWeight: bold?900:600, color: c??(v>=0?'#3DBF7F':'#E05050') }}>{fmt(v)}</td>
                    </tr>
                  ))}

                  {/* KPIs finales */}
                  <tr><td colSpan={2} style={{ padding:'16px 0 4px', fontSize:'10px', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' as const, color:'rgba(255,92,53,0.6)' }}>INDICADORES</td></tr>
                  {[
                    { label:'Margen neto',           value: fmtPct(margin),                 color: margin>=0?'#3DBF7F':'#E05050' },
                    { label:'Ticket promedio',        value: fmt(avgTicket),                 color: 'var(--dax-amber)' },
                    { label:'Número de transacciones',value: String(sales.length),           color: 'var(--dax-blue)' },
                    { label:'Tasa efectiva de IVA',   value: fmtPct(effectiveTax),           color: 'var(--dax-purple)' },
                  ].map(({ label, value, color }, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'9px 0', fontSize:'12px', color:'var(--dax-white-60)' }}>{label}</td>
                      <td style={{ padding:'9px 0', textAlign:'right' as const, fontFamily:'monospace', fontSize:'13px', fontWeight:700, color }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ DECLARACIÓN IVA ════════════════════════════════════════════════ */}
        {tab==='tax' && (
          <div>
            {/* Resumen IVA */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'24px' }}>
              <KPICard label="Base imponible"     value={fmt(taxBase)}       icon={Scale}   color="#5AAAF0" sub="Ventas netas"/>
              <KPICard label="IVA recaudado"      value={fmt(totalTax)}      icon={Receipt} color="#FF5C35" sub="Para declarar"/>
              <KPICard label="Tasa efectiva"      value={fmtPct(effectiveTax)} icon={Percent} color="#A78BFA" sub="Promedio ponderado"/>
              <KPICard label="Ventas exentas"     value={fmt(sales.filter(s=>Number(s.tax??0)===0).reduce((a,s)=>a+Number(s.total??0),0))} icon={Check} color="#3DBF7F" sub="Sin IVA"/>
            </div>

            <SectionHeader title="Declaración de IVA por período" subtitle={subtitle}>
              <ExportBtn
                onCSV={() => {
                  const rows = dayRows.map(([date, data]) => ({
                    Fecha:            fmtDate(date+'T00:00'),
                    'Ventas brutas':  data.revenue.toFixed(2),
                    'Base imponible': (data.revenue - data.tax).toFixed(2),
                    'IVA cobrado':    data.tax.toFixed(2),
                    'No. Ventas':     String(data.count),
                  }));
                  exportCSV(rows, `declaracion-iva-${dates.from}.csv`);
                }}
                onPDF={() => printReport('Declaración de IVA', subtitle, 'tbl-tax')}
              />
            </SectionHeader>

            <TableWrap>
              <table id="tbl-tax" style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Fecha','No. Ventas','Ventas brutas','Base imponible','IVA cobrado','% del día'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayRows.map(([date, data], i) => {
                    const base = data.revenue - data.tax;
                    const pct  = base>0 ? (data.tax/base)*100 : 0;
                    return (
                      <tr key={date} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.012)' }}>
                        <td style={S.td}>{fmtDate(date+'T00:00')}</td>
                        <td style={S.tdR}>{data.count}</td>
                        <td style={S.tdR}>{fmt(data.revenue)}</td>
                        <td style={S.tdR}>{fmt(base)}</td>
                        <td style={{ ...S.tdR, color: 'var(--dax-blue)', fontWeight:700 }}>{fmt(data.tax)}</td>
                        <td style={{ ...S.tdR, color:'var(--dax-white-60)' }}>{fmtPct(pct)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background:'var(--dax-coral-soft)' }}>
                    <td style={{ ...S.td, fontWeight:800, color: 'var(--dax-text-primary)' }}>TOTAL</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-text-primary)' }}>{sales.length}</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-text-primary)' }}>{fmt(totalRevenue)}</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-text-primary)' }}>{fmt(taxBase)}</td>
                    <td style={{ ...S.tdR, fontWeight:900, color: 'var(--dax-blue)', fontSize:'14px' }}>{fmt(totalTax)}</td>
                    <td style={{ ...S.tdR, fontWeight:700, color: 'var(--dax-purple)' }}>{fmtPct(effectiveTax)}</td>
                  </tr>
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {/* ══ FLUJO DE CAJA ══════════════════════════════════════════════════ */}
        {tab==='cashflow' && (
          <div>
            <SectionHeader title="Flujo de caja diario" subtitle={subtitle}>
              <ExportBtn
                onCSV={() => exportCSV(dayRows.map(([date, data]) => ({
                  Fecha:     fmtDate(date+'T00:00'),
                  Ingresos:  data.revenue.toFixed(2),
                  Costo:     data.cost.toFixed(2),
                  'Utilidad neta': (data.revenue - data.cost).toFixed(2),
                  IVA:       data.tax.toFixed(2),
                  Ventas:    String(data.count),
                })), `flujo-caja-${dates.from}.csv`)}
                onPDF={() => printReport('Flujo de Caja', subtitle, 'tbl-cashflow')}
              />
            </SectionHeader>

            <TableWrap>
              <table id="tbl-cashflow" style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Fecha','Ventas','Ingresos','Costo estimado','Utilidad neta','IVA','Acumulado'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let acc = 0;
                    return dayRows.map(([date, data], i) => {
                      const net = data.revenue - data.cost;
                      acc += net;
                      return (
                        <tr key={date} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.012)' }}>
                          <td style={S.td}>{fmtDate(date+'T00:00')}</td>
                          <td style={S.tdR}>{data.count}</td>
                          <td style={{ ...S.tdR, color: 'var(--dax-success)', fontWeight:700 }}>{fmt(data.revenue)}</td>
                          <td style={{ ...S.tdR, color: 'var(--dax-danger)' }}>{fmt(data.cost)}</td>
                          <td style={{ ...S.tdR, color: net>=0?'#3DBF7F':'#E05050', fontWeight:700 }}>{fmt(net)}</td>
                          <td style={{ ...S.tdR, color: 'var(--dax-blue)' }}>{fmt(data.tax)}</td>
                          <td style={{ ...S.tdR, color: acc>=0?'rgba(61,191,127,0.8)':'rgba(224,80,80,0.8)', fontWeight:600 }}>{fmt(acc)}</td>
                        </tr>
                      );
                    });
                  })()}
                  <tr style={{ background:'var(--dax-coral-soft)' }}>
                    <td style={{ ...S.td, fontWeight:800, color: 'var(--dax-text-primary)' }}>TOTAL</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-text-primary)' }}>{sales.length}</td>
                    <td style={{ ...S.tdR, fontWeight:900, color: 'var(--dax-success)', fontSize:'14px' }}>{fmt(totalRevenue)}</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-danger)' }}>{fmt(totalCost)}</td>
                    <td style={{ ...S.tdR, fontWeight:900, color: netProfit>=0?'#3DBF7F':'#E05050', fontSize:'14px' }}>{fmt(netProfit)}</td>
                    <td style={{ ...S.tdR, fontWeight:800, color: 'var(--dax-blue)' }}>{fmt(totalTax)}</td>
                    <td style={S.tdR}/>
                  </tr>
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

        {/* ══ ANÁLISIS DE PRODUCTOS ══════════════════════════════════════════ */}
        {tab==='products' && (
          <div>
            <SectionHeader title="Análisis de productos" subtitle={`${productRows.length} productos vendidos · ${subtitle}`}>
              <ExportBtn
                onCSV={() => exportCSV(productRows.map(p => ({
                  Producto:          p.name,
                  'Unidades vendidas': String(p.qty),
                  'Ingresos':         p.revenue.toFixed(2),
                  'Costo total':      p.cost.toFixed(2),
                  'Utilidad':         (p.revenue-p.cost).toFixed(2),
                  'Margen %':         p.revenue>0 ? fmtPct((p.revenue-p.cost)/p.revenue*100) : '0%',
                  '% de ventas':      totalRevenue>0 ? fmtPct(p.revenue/totalRevenue*100) : '0%',
                })), `analisis-productos-${dates.from}.csv`)}
                onPDF={() => printReport('Análisis de Productos', subtitle, 'tbl-products')}
              />
            </SectionHeader>

            <TableWrap>
              <table id="tbl-products" style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['#','Producto','Unidades','Ingresos','Costo total','Utilidad','Margen','% del total'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((p, i) => {
                    const util   = p.revenue - p.cost;
                    const margin = p.revenue>0 ? (util/p.revenue)*100 : 0;
                    const share  = totalRevenue>0 ? (p.revenue/totalRevenue)*100 : 0;
                    return (
                      <tr key={p.name} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.012)' }}>
                        <td style={{ ...S.td, color: 'var(--dax-white-25)', width:'36px' }}>{i+1}</td>
                        <td style={{ ...S.td, fontWeight:600, color: 'var(--dax-text-primary)' }}>{p.name}</td>
                        <td style={S.tdR}>{fmtNum(p.qty)}</td>
                        <td style={{ ...S.tdR, color: 'var(--dax-success)', fontWeight:700 }}>{fmt(p.revenue)}</td>
                        <td style={{ ...S.tdR, color: 'var(--dax-danger)' }}>{fmt(p.cost)}</td>
                        <td style={{ ...S.tdR, color: util>=0?'#3DBF7F':'#E05050', fontWeight:700 }}>{fmt(util)}</td>
                        <td style={{ ...S.tdR, color: margin>=20?'#3DBF7F':margin>=10?'#F0A030':'#E05050', fontWeight:700 }}>
                          {fmtPct(margin)}
                        </td>
                        <td style={{ padding:'9px 14px', verticalAlign:'top' as const }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                            <div style={{ flex:1, height:'5px', borderRadius:'3px', background:'var(--dax-surface-2)', overflow:'hidden', minWidth:'60px' }}>
                              <div style={{ height:'100%', width:`${share}%`, background:'linear-gradient(90deg,#FF5C35,rgba(255,92,53,0.6))', borderRadius:'3px' }}/>
                            </div>
                            <span style={{ fontSize:'11px', color:'var(--dax-white-35)', minWidth:'32px', textAlign:'right' as const }}>{fmtPct(share)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {productRows.length===0 && (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign:'center', padding:'48px', color: 'var(--dax-white-25)' }}>Sin datos de productos para el período</td></tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </div>
        )}

      </>}

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
