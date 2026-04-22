'use client';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  BarChart2, FileText, TrendingUp, Download, Calendar,
  DollarSign, Package, ChevronDown, RefreshCw, Filter,
  Building2, BookOpen, Receipt, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number, currency = 'CRC') {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
}

const PAY_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', sinpe: 'SINPE', transfer: 'SINPE/Transf.', mixed: 'Mixto', credit: 'Crédito',
};

// ── Componentes UI ────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px 22px', ...style }}>
      {children}
    </div>
  );
}

function KPI({ label, value, sub, color = '#FF5C35', trend }: { label: string; value: string; sub?: string; color?: string; trend?: 'up' | 'down' }) {
  return (
    <Card>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '4px' }}>
        <p style={{ fontSize: '26px', fontWeight: 900, color, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</p>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            {trend === 'up' ? <ArrowUpRight size={14} color="#3DBF7F"/> : <ArrowDownRight size={14} color="#E05050"/>}
          </div>
        )}
      </div>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
    </Card>
  );
}

function Select({ value, onChange, options, icon: Icon }: any) {
  return (
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={13} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: `8px 30px 8px ${Icon ? '30px' : '12px'}`, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#F0F4FF', fontSize: '12px', fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', paddingRight: '28px' }}>
        {options.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#080C14' }}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────
function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(title: string, tableId: string) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    p.sub { font-size: 10px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; padding: 7px 10px; border: 1px solid #ddd; text-align: left; }
    td { padding: 6px 10px; border: 1px solid #eee; font-size: 11px; }
    tr:nth-child(even) td { background: #fafafa; }
    .total-row td { font-weight: bold; background: #f5f5f5; border-top: 2px solid #999; }
    @media print { @page { margin: 15mm; } }
  </style></head><body>
  <h1>${title}</h1>
  <p class="sub">Generado: ${new Date().toLocaleString('es-CR')} · DaxCloud POS</p>
  ${table.outerHTML}
  </body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary',  label: 'Resumen',           icon: BarChart2  },
  { id: 'sales',    label: 'Libro de ventas',    icon: BookOpen   },
  { id: 'results',  label: 'Estado de resultados', icon: TrendingUp },
  { id: 'tax',      label: 'Reporte de IVA',     icon: Receipt    },
];

const PERIODS = [
  { value: 'today',     label: 'Hoy' },
  { value: 'week',      label: 'Esta semana' },
  { value: 'month',     label: 'Este mes' },
  { value: 'last_month',label: 'Mes anterior' },
  { value: 'quarter',   label: 'Este trimestre' },
  { value: 'year',      label: 'Este año' },
  { value: 'custom',    label: 'Personalizado' },
];

function getPeriodDates(period: string): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  switch (period) {
    case 'today':
      return { from: fmt(now), to: fmt(now) };
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay());
      return { from: fmt(d), to: fmt(now) };
    }
    case 'month':
      return { from: `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`, to: fmt(now) };
    case 'last_month': {
      const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(d), to: fmt(e) };
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth()/3);
      return { from: fmt(new Date(now.getFullYear(), q*3, 1)), to: fmt(now) };
    }
    case 'year':
      return { from: `${now.getFullYear()}-01-01`, to: fmt(now) };
    default:
      return { from: fmt(now), to: fmt(now) };
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AccountingPage() {
  const [tab,    setTab]    = useState('summary');
  const [period, setPeriod] = useState('month');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');

  const dates = period === 'custom'
    ? { from, to }
    : getPeriodDates(period);

  const params = new URLSearchParams();
  if (dates.from) params.append('from', dates.from);
  if (dates.to)   params.append('to',   dates.to);

  const { data: salesData = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['accounting-sales', dates.from, dates.to],
    queryFn: () => api.get(`/sales?${params}&limit=1000&include=items`).then(r => r.data?.data ?? r.data ?? []),
    enabled: !!dates.from && !!dates.to,
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data),
  });

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const sales = Array.isArray(salesData) ? salesData : [];

  const totalRevenue  = sales.reduce((a, s) => a + Number(s.total ?? 0), 0);
  const totalSubtotal = sales.reduce((a, s) => a + Number(s.subtotal ?? 0), 0);
  const totalDiscount = sales.reduce((a, s) => a + Number(s.discount ?? 0), 0);
  const totalTax      = sales.reduce((a, s) => a + Number(s.tax ?? 0), 0);
  const totalCost     = sales.reduce((a, s) =>
    a + (s.items ?? []).reduce((b: number, i: any) => b + Number(i.quantity ?? 0) * Number(i.product?.cost ?? 0), 0), 0);
  const grossProfit   = totalRevenue - totalCost;
  const netProfit     = grossProfit - totalDiscount;
  const margin        = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const byMethod: Record<string, number> = {};
  sales.forEach(s => {
    const m = s.paymentMethod ?? 'other';
    byMethod[m] = (byMethod[m] ?? 0) + Number(s.total ?? 0);
  });

  // ── Libro de ventas ───────────────────────────────────────────────────────
  const salesBookData = sales.map(s => ({
    Fecha:         fmtDate(s.createdAt),
    'No. Venta':   s.id?.slice(-8).toUpperCase(),
    'Cajero':      `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.trim(),
    'Sucursal':    s.branch?.name ?? '',
    'Subtotal':    Number(s.subtotal ?? 0).toFixed(2),
    'Descuento':   Number(s.discount ?? 0).toFixed(2),
    'IVA':         Number(s.tax ?? 0).toFixed(2),
    'Total':       Number(s.total ?? 0).toFixed(2),
    'Método pago': PAY_LABELS[s.paymentMethod] ?? s.paymentMethod,
  }));

  // ── IVA ───────────────────────────────────────────────────────────────────
  const taxByDate: Record<string, { base: number; tax: number; total: number }> = {};
  sales.forEach(s => {
    const d = s.createdAt?.slice(0, 10) ?? '';
    if (!taxByDate[d]) taxByDate[d] = { base: 0, tax: 0, total: 0 };
    taxByDate[d].base  += Number(s.subtotal ?? 0) - Number(s.discount ?? 0);
    taxByDate[d].tax   += Number(s.tax ?? 0);
    taxByDate[d].total += Number(s.total ?? 0);
  });
  const taxRows = Object.entries(taxByDate).sort(([a], [b]) => a.localeCompare(b));

  const S = {
    bg: '#080C14', coral: '#FF5C35',
    border: 'rgba(255,255,255,0.07)',
    muted: 'rgba(255,255,255,0.35)',
    th: { fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: 'rgba(255,92,53,0.7)', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' as const, whiteSpace: 'nowrap' as const },
    td: { fontSize: '12px', color: 'rgba(255,255,255,0.65)', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', fontFamily: "'Inter','Outfit',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-.02em', marginBottom: '4px' }}>Módulo contable</h1>
          <p style={{ fontSize: '13px', color: S.muted }}>Reportes financieros y fiscales</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Select value={period} onChange={setPeriod} icon={Calendar} options={PERIODS}/>
          {period === 'custom' && <>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#F0F4FF', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}/>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#F0F4FF', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}/>
          </>}
          <button onClick={() => refetch()} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: S.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={12}/> Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '10px 10px 0 0', border: 'none', borderBottom: active ? '2px solid #FF5C35' : '2px solid transparent', background: active ? 'rgba(255,92,53,0.07)' : 'transparent', color: active ? '#FF5C35' : S.muted, fontSize: '13px', fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', marginBottom: '-1px' }}>
              <Icon size={14}/>{t.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px', color: S.muted }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2.5px solid rgba(255,92,53,0.2)', borderTopColor: '#FF5C35', animation: 'spin .7s linear infinite', margin: '0 auto 12px' }}/>
          <p style={{ fontSize: '13px' }}>Cargando datos...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── RESUMEN ── */}
          {tab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
                <KPI label="Ingresos totales"   value={fmt(totalRevenue)}  sub={`${sales.length} transacciones`} color="#FF5C35"/>
                <KPI label="Utilidad bruta"     value={fmt(grossProfit)}   sub={`Margen: ${margin.toFixed(1)}%`} color="#3DBF7F"/>
                <KPI label="Descuentos"         value={fmt(totalDiscount)} sub="Total aplicado"  color="#F0A030"/>
                <KPI label="IVA cobrado"        value={fmt(totalTax)}      sub="Total impuestos" color="#5AAAF0"/>
              </div>

              {/* Por método de pago */}
              <Card>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Distribución por método de pago</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(byMethod).map(([method, amount]) => {
                    const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                    const colors: Record<string, string> = { cash: '#3DBF7F', card: '#A78BFA', sinpe: '#5AAAF0', transfer: '#5AAAF0', mixed: '#F0A030', credit: '#FF5C35' };
                    const c = colors[method] ?? '#fff';
                    return (
                      <div key={method}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: S.muted }}>{PAY_LABELS[method] ?? method}</span>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{pct.toFixed(1)}%</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: c }}>{fmt(amount)}</span>
                          </div>
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: '2px', transition: 'width .5s' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ── LIBRO DE VENTAS ── */}
          {tab === 'sales' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <p style={{ fontSize: '13px', color: S.muted }}>{sales.length} registros · {dates.from} al {dates.to}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => exportCSV(salesBookData, `libro-ventas-${dates.from}-${dates.to}.csv`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(61,191,127,0.08)', border: '1px solid rgba(61,191,127,0.2)', borderRadius: '9px', color: '#3DBF7F', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Download size={12}/> Excel / CSV
                  </button>
                  <button onClick={() => exportPDF('Libro de Ventas', 'sales-table')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,92,53,0.08)', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '9px', color: '#FF5C35', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <FileText size={12}/> PDF
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <table id="sales-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      {['Fecha','No. Venta','Cajero','Sucursal','Subtotal','Descuento','IVA','Total','Método'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={S.td}>{fmtDate(s.createdAt)}</td>
                        <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 700, color: '#FF5C35' }}>#{s.id?.slice(-8).toUpperCase()}</td>
                        <td style={S.td}>{`${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.trim()}</td>
                        <td style={S.td}>{s.branch?.name ?? ''}</td>
                        <td style={{ ...S.td, textAlign: 'right' as const }}>{fmt(Number(s.subtotal))}</td>
                        <td style={{ ...S.td, textAlign: 'right' as const, color: '#F0A030' }}>{Number(s.discount) > 0 ? `-${fmt(Number(s.discount))}` : '—'}</td>
                        <td style={{ ...S.td, textAlign: 'right' as const }}>{fmt(Number(s.tax))}</td>
                        <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 700, color: '#fff' }}>{fmt(Number(s.total))}</td>
                        <td style={S.td}>{PAY_LABELS[s.paymentMethod] ?? s.paymentMethod}</td>
                      </tr>
                    ))}
                    {/* Totales */}
                    <tr style={{ background: 'rgba(255,92,53,0.05)' }}>
                      <td colSpan={4} style={{ ...S.td, fontWeight: 800, color: '#fff' }}>TOTAL ({sales.length} ventas)</td>
                      <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 800, color: '#fff' }}>{fmt(totalSubtotal)}</td>
                      <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 800, color: '#F0A030' }}>{fmt(totalDiscount)}</td>
                      <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 800, color: '#5AAAF0' }}>{fmt(totalTax)}</td>
                      <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 900, color: '#FF5C35', fontSize: '14px' }}>{fmt(totalRevenue)}</td>
                      <td style={S.td}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ESTADO DE RESULTADOS ── */}
          {tab === 'results' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => exportCSV([
                  { Concepto: 'Ingresos brutos', Monto: totalRevenue.toFixed(2) },
                  { Concepto: 'Descuentos', Monto: `-${totalDiscount.toFixed(2)}` },
                  { Concepto: 'Ingresos netos', Monto: (totalRevenue - totalDiscount).toFixed(2) },
                  { Concepto: 'Costo de ventas', Monto: `-${totalCost.toFixed(2)}` },
                  { Concepto: 'Utilidad bruta', Monto: grossProfit.toFixed(2) },
                  { Concepto: 'IVA', Monto: totalTax.toFixed(2) },
                  { Concepto: 'Margen', Monto: `${margin.toFixed(2)}%` },
                ], `estado-resultados-${dates.from}.csv`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(61,191,127,0.08)', border: '1px solid rgba(61,191,127,0.2)', borderRadius: '9px', color: '#3DBF7F', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Download size={12}/> Excel / CSV
                </button>
                <button onClick={() => exportPDF('Estado de Resultados', 'results-table')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,92,53,0.08)', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '9px', color: '#FF5C35', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <FileText size={12}/> PDF
                </button>
              </div>

              <Card>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em', marginBottom: '20px' }}>
                  Estado de Resultados
                  <span style={{ fontSize: '11px', fontWeight: 500, color: S.muted, marginLeft: '8px' }}>{dates.from} — {dates.to}</span>
                </h3>
                <table id="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      { label: 'Ingresos brutos',    value: totalRevenue,                     bold: false, color: '#fff'    },
                      { label: 'Descuentos',          value: -totalDiscount,                    bold: false, color: '#F0A030' },
                      { label: 'Ingresos netos',      value: totalRevenue - totalDiscount,      bold: true,  color: '#fff', separator: true },
                      { label: 'Costo de ventas',     value: -totalCost,                        bold: false, color: '#E05050' },
                      { label: 'Utilidad bruta',      value: grossProfit,                       bold: true,  color: grossProfit >= 0 ? '#3DBF7F' : '#E05050', separator: true },
                      { label: `IVA (${totalTax > 0 ? ((totalTax/totalRevenue)*100).toFixed(0) : 0}%)`, value: totalTax, bold: false, color: '#5AAAF0' },
                      { label: `Margen neto`,         value: null,                              bold: true,  color: margin >= 0 ? '#3DBF7F' : '#E05050', pct: margin },
                    ].map(({ label, value, bold, color, separator, pct }, i) => (
                      <tr key={i}>
                        {separator && <td colSpan={2} style={{ padding: '4px 0' }}><div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '2px 0' }}/></td>}
                        {!separator && <>
                          <td style={{ padding: '9px 0', fontSize: bold ? '14px' : '13px', fontWeight: bold ? 800 : 500, color: 'rgba(255,255,255,0.7)' }}>{label}</td>
                          <td style={{ padding: '9px 0', textAlign: 'right' as const, fontSize: bold ? '16px' : '13px', fontWeight: bold ? 900 : 600, color }}>
                            {pct !== undefined ? `${pct.toFixed(1)}%` : fmt(value ?? 0)}
                          </td>
                        </>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ── REPORTE IVA ── */}
          {tab === 'tax' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#fff', fontWeight: 700, marginBottom: '2px' }}>IVA total cobrado: <span style={{ color: '#5AAAF0' }}>{fmt(totalTax)}</span></p>
                  <p style={{ fontSize: '12px', color: S.muted }}>{dates.from} al {dates.to}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => exportCSV(taxRows.map(([date, v]) => ({
                    Fecha: fmtDate(date+'T00:00:00'),
                    'Base imponible': v.base.toFixed(2),
                    'IVA cobrado': v.tax.toFixed(2),
                    'Total con IVA': v.total.toFixed(2),
                  })), `reporte-iva-${dates.from}.csv`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(61,191,127,0.08)', border: '1px solid rgba(61,191,127,0.2)', borderRadius: '9px', color: '#3DBF7F', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Download size={12}/> Excel / CSV
                  </button>
                  <button onClick={() => exportPDF('Reporte de IVA', 'tax-table')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(255,92,53,0.08)', border: '1px solid rgba(255,92,53,0.2)', borderRadius: '9px', color: '#FF5C35', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <FileText size={12}/> PDF
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <table id="tax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Fecha','Base imponible','IVA cobrado','Total con IVA'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {taxRows.map(([date, v], i) => (
                      <tr key={date} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={S.td}>{fmtDate(date+'T00:00:00')}</td>
                        <td style={{ ...S.td, textAlign: 'right' as const }}>{fmt(v.base)}</td>
                        <td style={{ ...S.td, textAlign: 'right' as const, color: '#5AAAF0', fontWeight: 700 }}>{fmt(v.tax)}</td>
                        <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 700, color: '#fff' }}>{fmt(v.total)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(255,92,53,0.05)' }}>
                      <td style={{ ...S.td, fontWeight: 800, color: '#fff' }}>TOTAL</td>
                      <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 800, color: '#fff' }}>{fmt(taxRows.reduce((a,[,v]) => a+v.base, 0))}</td>
                      <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 800, color: '#5AAAF0' }}>{fmt(totalTax)}</td>
                      <td style={{ ...S.td, textAlign: 'right' as const, fontWeight: 900, color: '#FF5C35' }}>{fmt(totalRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
