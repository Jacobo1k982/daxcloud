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
  // Negocio
  businessName:  string;
  branchName?:   string;
  taxId?:        string;
  phone?:        string;
  address?:      string;
  // Venta
  saleId:        string;
  cashierName:   string;
  createdAt:     string;
  items:         ReceiptItem[];
  subtotal:      number;
  discount:      number;
  tax:           number;
  total:         number;
  paymentMethod: string;
  mixedPayments?: MixedPaymentsReceipt | null;
  notes?:        string;
  // Config impresión
  header?:       string;
  footer?:       string;
  copies?:       number;
}

export interface PrintConfig {
  autoPrint:     boolean;
  header:        string;
  footer:        string;
  copies:        number;
  showLogo:      boolean;
  showTaxId:     boolean;
  showPhone:     boolean;
  showAddress:   boolean;
  paperWidth:    '58mm' | '80mm';
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
  transfer: 'SINPE/Transferencia',
  mixed:    'Pago mixto',
};

const PAYMENT_ICONS: Record<string, string> = {
  cash:     '💵',
  card:     '💳',
  transfer: '📱',
  mixed:    '🔀',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CR', {
    style:                'currency',
    currency:             'CRC',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function buildReceiptHTML(data: ReceiptData, config: PrintConfig): string {
  const W = config.paperWidth === '80mm' ? '80mm' : '58mm';

  const line    = `<div class="divider"></div>`;
  const dblLine = `<div class="divider-dbl"></div>`;

  // Items
  const itemsHTML = data.items.map(item => `
    <div class="item">
      <div class="item-name">${item.name}</div>
      <div class="item-row">
        <span class="item-qty">${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
        <span class="item-price">${formatCurrency(item.subtotal)}</span>
      </div>
      ${(item.discount ?? 0) > 0 ? `<div class="item-discount">Descuento: -${formatCurrency(item.discount!)}</div>` : ''}
    </div>
  `).join('');

  // Método de pago
  let paymentHTML = '';
  if (data.paymentMethod === 'mixed' && data.mixedPayments) {
    paymentHTML = `
      <div class="totals-row">
        <span>Método</span>
        <span>${PAYMENT_ICONS['mixed']} Mixto</span>
      </div>
      ${data.mixedPayments.cash     ? `<div class="totals-row sub"><span>  ${PAYMENT_ICONS['cash']} Efectivo</span><span>${formatCurrency(data.mixedPayments.cash)}</span></div>` : ''}
      ${data.mixedPayments.card     ? `<div class="totals-row sub"><span>  ${PAYMENT_ICONS['card']} Tarjeta</span><span>${formatCurrency(data.mixedPayments.card)}</span></div>` : ''}
      ${data.mixedPayments.transfer ? `<div class="totals-row sub"><span>  ${PAYMENT_ICONS['transfer']} SINPE</span><span>${formatCurrency(data.mixedPayments.transfer)}</span></div>` : ''}
    `;
  } else {
    paymentHTML = `
      <div class="totals-row">
        <span>Método de pago</span>
        <span>${PAYMENT_ICONS[data.paymentMethod] ?? ''} ${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}</span>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo ${data.saleId.slice(-8).toUpperCase()}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    width: ${W};
    margin: 0;
  }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    width: ${W};
    max-width: ${W};
    margin: 0 auto;
    padding: 4mm 3mm;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .center   { text-align: center; }
  .right    { text-align: right; }
  .bold     { font-weight: bold; }
  .large    { font-size: 14px; }
  .xlarge   { font-size: 18px; font-weight: bold; }
  .small    { font-size: 9px; }
  .muted    { color: #555; }

  .divider {
    border-top: 1px dashed #999;
    margin: 3mm 0;
  }
  .divider-dbl {
    border-top: 2px solid #000;
    margin: 3mm 0;
  }

  .business-name {
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2mm;
    letter-spacing: 0.5px;
  }
  .business-sub {
    font-size: 10px;
    text-align: center;
    color: #444;
    margin-bottom: 1mm;
  }

  .header-custom {
    font-size: 10px;
    text-align: center;
    color: #333;
    margin-bottom: 2mm;
    font-style: italic;
  }

  .receipt-title {
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    letter-spacing: 2px;
    margin: 2mm 0;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #333;
    margin-bottom: 1mm;
  }

  .item {
    margin-bottom: 2mm;
  }
  .item-name {
    font-weight: bold;
    font-size: 11px;
    word-break: break-word;
  }
  .item-row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #333;
  }
  .item-qty   { color: #555; }
  .item-price { font-weight: bold; color: #000; }
  .item-discount { font-size: 9px; color: #888; }

  .totals-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-bottom: 1.5mm;
  }
  .totals-row.sub {
    font-size: 10px;
    color: #555;
    padding-left: 4mm;
  }
  .totals-row.total-final {
    font-size: 16px;
    font-weight: bold;
    margin-top: 2mm;
  }
  .totals-row.discount { color: #228b22; }

  .sale-id {
    font-size: 10px;
    text-align: center;
    color: #666;
    letter-spacing: 1px;
  }

  .footer-text {
    font-size: 11px;
    text-align: center;
    font-style: italic;
    margin-top: 2mm;
  }
  .footer-powered {
    font-size: 8px;
    text-align: center;
    color: #aaa;
    margin-top: 2mm;
  }

  .notes {
    font-size: 10px;
    color: #444;
    font-style: italic;
    text-align: center;
    margin-top: 1mm;
  }

  @media print {
    html, body { width: ${W}; }
    .no-print  { display: none !important; }
  }
</style>
</head>
<body>

  <!-- Nombre del negocio -->
  <div class="business-name">${data.businessName}</div>
  ${data.branchName ? `<div class="business-sub">${data.branchName}</div>` : ''}
  ${config.showTaxId  && data.taxId   ? `<div class="business-sub">Cédula: ${data.taxId}</div>` : ''}
  ${config.showPhone  && data.phone   ? `<div class="business-sub">Tel: ${data.phone}</div>` : ''}
  ${config.showAddress && data.address ? `<div class="business-sub">${data.address}</div>` : ''}
  ${data.header ? `<div class="header-custom">${data.header}</div>` : ''}

  ${dblLine}

  <div class="receipt-title">RECIBO DE VENTA</div>

  ${line}

  <!-- Metadata -->
  <div class="meta-row">
    <span>Fecha</span>
    <span>${formatDate(data.createdAt)}</span>
  </div>
  <div class="meta-row">
    <span>Cajero</span>
    <span>${data.cashierName}</span>
  </div>
  <div class="meta-row">
    <span>N° Recibo</span>
    <span class="bold">#${data.saleId.slice(-8).toUpperCase()}</span>
  </div>

  ${dblLine}

  <!-- Items -->
  ${itemsHTML}

  ${line}

  <!-- Totales -->
  <div class="totals-row">
    <span>Subtotal</span>
    <span>${formatCurrency(data.subtotal)}</span>
  </div>
  ${data.discount > 0 ? `
  <div class="totals-row discount">
    <span>Descuento</span>
    <span>-${formatCurrency(data.discount)}</span>
  </div>` : ''}
  ${data.tax > 0 ? `
  <div class="totals-row">
    <span>Impuesto</span>
    <span>${formatCurrency(data.tax)}</span>
  </div>` : ''}

  ${dblLine}

  <div class="totals-row total-final">
    <span>TOTAL</span>
    <span>${formatCurrency(data.total)}</span>
  </div>

  ${line}

  <!-- Método de pago -->
  ${paymentHTML}

  ${data.notes ? `${line}<div class="notes">Nota: ${data.notes}</div>` : ''}

  ${dblLine}

  <!-- Footer -->
  ${data.footer ? `<div class="footer-text">${data.footer}</div>` : ''}
  <div class="footer-powered">Powered by DaxCloud</div>

  <!-- Espacio al final para corte -->
  <div style="margin-top: 8mm;"></div>

</body>
</html>`;
}

export function useReceiptPrinter() {

  const print = useCallback((data: ReceiptData, config: PrintConfig = DEFAULT_PRINT_CONFIG) => {
    const copies   = config.copies ?? 1;
    const baseHtml = buildReceiptHTML(data, config);

    // Para múltiples copias, inserta el contenido del body repetido antes de abrir la ventana
    let html = baseHtml;
    if (copies > 1) {
      const bodyStart   = baseHtml.indexOf('<body>') + 6;
      const bodyEnd     = baseHtml.lastIndexOf('</body>');
      const bodyContent = baseHtml.slice(bodyStart, bodyEnd);
      const repeated    = Array.from({ length: copies }, (_, i) =>
        i === 0 ? bodyContent : `<div style="page-break-before: always;"></div>${bodyContent}`
      ).join('\n');
      html = baseHtml.slice(0, bodyStart) + repeated + baseHtml.slice(bodyEnd);
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);

    const printWindow = window.open(url, '_blank', 'width=400,height=600,toolbar=0,menubar=0,scrollbars=1');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      alert('Activa las ventanas emergentes para imprimir recibos.');
      return;
    }

    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        URL.revokeObjectURL(url);
      }, 300);
    });
  }, []);

  // Preview sin imprimir (abre en nueva pestaña)
  const preview = useCallback((data: ReceiptData, config: PrintConfig = DEFAULT_PRINT_CONFIG) => {
    const html = buildReceiptHTML(data, config);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, []);

  return { print, preview };
}
