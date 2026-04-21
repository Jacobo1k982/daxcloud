'use client';
import { useCallback } from 'react';

export interface ReceiptItem {
  name:      string;
  quantity:  number;
  unitPrice: number;
  subtotal:  number;
  discount?: number;
}

export interface MixedPaymentsReceipt {
  cash?:     number;
  card?:     number;
  transfer?: number;
}

export interface ReceiptData {
  businessName:   string;
  branchName?:    string;
  taxId?:         string;
  phone?:         string;
  address?:       string;
  saleId:         string;
  cashierName:    string;
  createdAt:      string;
  items:          ReceiptItem[];
  subtotal:       number;
  discount:       number;
  tax:            number;
  total:          number;
  paymentMethod:  string;
  mixedPayments?: MixedPaymentsReceipt | null;
  notes?:         string;
  header?:        string;
  footer?:        string;
  copies?:        number;
}

export interface PrintConfig {
  autoPrint:   boolean;
  header:      string;
  footer:      string;
  copies:      number;
  showLogo:    boolean;
  showTaxId:   boolean;
  showPhone:   boolean;
  showAddress: boolean;
  paperWidth:  '58mm' | '80mm';
}

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  autoPrint:   false,
  header:      '',
  footer:      'Gracias por su compra',
  copies:      1,
  showLogo:    false,
  showTaxId:   true,
  showPhone:   true,
  showAddress: true,
  paperWidth:  '80mm',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  sinpe:    'SINPE',
  transfer: 'SINPE / Transferencia',
  mixed:    'Pago mixto',
  credit:   'Credito interno',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency', currency: 'CRC', maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function buildReceiptHTML(data: ReceiptData, config: PrintConfig): string {
  const W = config.paperWidth === '58mm' ? '58mm' : '80mm';
  const maxWidth = config.paperWidth === '58mm' ? '58mm' : '80mm';

  const itemsHTML = data.items.map(item => `
    <tr>
      <td class="item-name" colspan="3">${item.name}</td>
    </tr>
    <tr>
      <td class="item-qty">${item.quantity} x ${formatCurrency(item.unitPrice)}</td>
      <td></td>
      <td class="item-price">${formatCurrency(item.subtotal)}</td>
    </tr>
    ${(item.discount ?? 0) > 0 ? `<tr><td colspan="3" class="item-discount">  Descuento: -${formatCurrency(item.discount!)}</td></tr>` : ''}
  `).join('');

  let paymentHTML = '';
  if (data.paymentMethod === 'mixed' && data.mixedPayments) {
    paymentHTML = `
      <tr><td>Metodo de pago</td><td></td><td>Mixto</td></tr>
      ${data.mixedPayments.cash     ? `<tr class="sub"><td>  Efectivo</td><td></td><td>${formatCurrency(data.mixedPayments.cash)}</td></tr>` : ''}
      ${data.mixedPayments.card     ? `<tr class="sub"><td>  Tarjeta</td><td></td><td>${formatCurrency(data.mixedPayments.card)}</td></tr>` : ''}
      ${data.mixedPayments.transfer ? `<tr class="sub"><td>  SINPE</td><td></td><td>${formatCurrency(data.mixedPayments.transfer)}</td></tr>` : ''}
    `;
  } else {
    paymentHTML = `<tr><td>Metodo de pago</td><td></td><td>${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}</td></tr>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recibo ${data.saleId.slice(-8).toUpperCase()}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    width: ${W};
    margin: 4mm 3mm;
  }

  html, body {
    width: ${maxWidth};
    max-width: ${maxWidth};
    margin: 0 auto;
    padding: 4mm 3mm 8mm;
    background: #fff;
    color: #000;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Header negocio */
  .biz-name {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    letter-spacing: 0.5px;
    margin-bottom: 2mm;
  }
  .biz-sub {
    font-size: 10px;
    text-align: center;
    color: #444;
    margin-bottom: 1mm;
  }
  .header-custom {
    font-size: 10px;
    text-align: center;
    color: #333;
    font-style: italic;
    margin-bottom: 2mm;
  }

  /* Separadores */
  .line     { border-top: 1px dashed #999; margin: 2.5mm 0; }
  .line-dbl { border-top: 2px solid #000;  margin: 2.5mm 0; }

  /* Titulo recibo */
  .receipt-title {
    font-size: 13px;
    font-weight: bold;
    text-align: center;
    letter-spacing: 3px;
    margin: 2mm 0;
  }

  /* Tabla general */
  table {
    width: 100%;
    border-collapse: collapse;
  }

  /* Metas (fecha, cajero, numero) */
  .meta td {
    font-size: 10px;
    color: #333;
    padding: 0.5mm 0;
  }
  .meta td:last-child { text-align: right; font-weight: bold; }

  /* Items */
  .item-name  { font-weight: bold; font-size: 11px; word-break: break-word; padding-top: 1.5mm; }
  .item-qty   { font-size: 10px; color: #555; padding-left: 2mm; }
  .item-price { font-size: 11px; font-weight: bold; text-align: right; }
  .item-discount { font-size: 9px; color: #888; padding-left: 4mm; }

  /* Totales */
  .totals td { font-size: 11px; padding: 1mm 0; }
  .totals td:last-child { text-align: right; }
  .totals .sub td { font-size: 10px; color: #555; }
  .totals .sub td:first-child { padding-left: 4mm; }
  .totals .discount td { color: #228b22; }
  .totals .total-final td { font-size: 17px; font-weight: bold; padding-top: 2mm; }

  /* Footer */
  .footer-text    { font-size: 11px; text-align: center; font-style: italic; margin-top: 2mm; }
  .footer-powered { font-size: 8px; text-align: center; color: #aaa; margin-top: 2mm; }
  .notes { font-size: 10px; color: #444; font-style: italic; text-align: center; margin-top: 1mm; }

  /* Espaciado final */
  .end-space { height: 8mm; }

  @media print {
    html, body { width: ${maxWidth}; padding: 0 3mm 8mm; }
  }
</style>
</head>
<body>

  <!-- Header negocio -->
  <div class="biz-name">${data.businessName}</div>
  ${data.branchName                              ? `<div class="biz-sub">${data.branchName}</div>` : ''}
  ${config.showTaxId && data.taxId              ? `<div class="biz-sub">Cedula: ${data.taxId}</div>` : ''}
  ${config.showPhone && data.phone              ? `<div class="biz-sub">Tel: ${data.phone}</div>` : ''}
  ${config.showAddress && data.address          ? `<div class="biz-sub">${data.address}</div>` : ''}
  ${data.header                                  ? `<div class="header-custom">${data.header}</div>` : ''}

  <div class="line-dbl"></div>
  <div class="receipt-title">RECIBO DE VENTA</div>
  <div class="line"></div>

  <!-- Meta info -->
  <table class="meta">
    <tr><td>Fecha</td><td>${formatDate(data.createdAt)}</td></tr>
    <tr><td>Cajero</td><td>${data.cashierName}</td></tr>
    <tr><td>No. Recibo</td><td>#${data.saleId.slice(-8).toUpperCase()}</td></tr>
  </table>

  <div class="line-dbl"></div>

  <!-- Items -->
  <table>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="line"></div>

  <!-- Totales -->
  <table class="totals">
    <tbody>
      <tr><td>Subtotal</td><td></td><td>${formatCurrency(data.subtotal)}</td></tr>
      ${data.discount > 0 ? `<tr class="discount"><td>Descuento</td><td></td><td>-${formatCurrency(data.discount)}</td></tr>` : ''}
      ${data.tax > 0      ? `<tr><td>Impuesto</td><td></td><td>${formatCurrency(data.tax)}</td></tr>` : ''}
    </tbody>
  </table>

  <div class="line-dbl"></div>

  <table class="totals">
    <tbody>
      <tr class="total-final"><td>TOTAL</td><td></td><td>${formatCurrency(data.total)}</td></tr>
    </tbody>
  </table>

  <div class="line"></div>

  <!-- Pago -->
  <table class="totals">
    <tbody>
      ${paymentHTML}
    </tbody>
  </table>

  ${data.notes ? `<div class="line"></div><div class="notes">Nota: ${data.notes}</div>` : ''}

  <div class="line-dbl"></div>

  ${data.footer ? `<div class="footer-text">${data.footer}</div>` : `<div class="footer-text">Gracias por su compra</div>`}
  <div class="footer-powered">Powered by DaxCloud</div>
  <div class="end-space"></div>

</body>
</html>`;
}

export function useReceiptPrinter() {

  const print = useCallback((data: ReceiptData, config: PrintConfig = DEFAULT_PRINT_CONFIG) => {
    const copies   = config.copies ?? 1;
    const baseHtml = buildReceiptHTML(data, config);

    let html = baseHtml;
    if (copies > 1) {
      const bodyStart   = baseHtml.indexOf('<body>') + 6;
      const bodyEnd     = baseHtml.lastIndexOf('</body>');
      const bodyContent = baseHtml.slice(bodyStart, bodyEnd);
      const repeated    = Array.from({ length: copies }, (_, i) =>
        i === 0 ? bodyContent : `<div style="page-break-before:always;"></div>${bodyContent}`
      ).join('\n');
      html = baseHtml.slice(0, bodyStart) + repeated + baseHtml.slice(bodyEnd);
    }

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);

    const winWidth  = config.paperWidth === '58mm' ? 320 : 420;
    const winHeight = 650;
    const left = Math.round((window.screen.width  - winWidth)  / 2);
    const top  = Math.round((window.screen.height - winHeight) / 2);

    const win = window.open(
      url,
      '_blank',
      `width=${winWidth},height=${winHeight},left=${left},top=${top},toolbar=0,menubar=0,scrollbars=1,resizable=1`
    );

    if (!win) {
      URL.revokeObjectURL(url);
      alert('Activa las ventanas emergentes para imprimir recibos.');
      return;
    }

    win.addEventListener('load', () => {
      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(() => {
          win.close();
          URL.revokeObjectURL(url);
        }, 500);
      }, 400);
    });
  }, []);

  const preview = useCallback((data: ReceiptData, config: PrintConfig = DEFAULT_PRINT_CONFIG) => {
    const html = buildReceiptHTML(data, config);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const winWidth  = config.paperWidth === '58mm' ? 320 : 420;
    const win = window.open(url, '_blank', `width=${winWidth},height=700,scrollbars=1,resizable=1`);
    if (!win) { window.open(url, '_blank'); }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, []);

  return { print, preview };
}
