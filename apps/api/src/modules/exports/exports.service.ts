import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  private styleHeader(worksheet: ExcelJS.Worksheet, headers: string[]) {
    const headerRow = worksheet.getRow(1);
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF5C35' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      };
    });
    headerRow.height = 28;
  }

  async exportProducts(tenantId: string): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DaxCloud';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Productos');

    worksheet.columns = [
      { key: 'name',     width: 35 },
      { key: 'sku',      width: 16 },
      { key: 'barcode',  width: 20 },
      { key: 'category', width: 20 },
      { key: 'price',    width: 16 },
      { key: 'cost',     width: 16 },
      { key: 'createdAt',width: 22 },
    ];

    this.styleHeader(worksheet, ['Nombre', 'SKU', 'Código barras', 'Categoría', 'Precio', 'Costo', 'Fecha creación']);

    products.forEach((p, i) => {
      const row = worksheet.addRow({
        name:      p.name,
        sku:       p.sku ?? '-',
        barcode:   p.barcode ?? '-',
        category:  p.category ?? '-',
        price:     Number(p.price),
        cost:      p.cost ? Number(p.cost) : '-',
        createdAt: p.createdAt.toLocaleDateString('es-CR'),
      });
      row.getCell('price').numFmt = '#,##0.00';
      row.getCell('cost').numFmt = '#,##0.00';
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      }
    });

    worksheet.addRow([]);
    const totalRow = worksheet.addRow({ name: `Total: ${products.length} productos` });
    totalRow.font = { bold: true, italic: true, color: { argb: 'FFFF5C35' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportSales(tenantId: string, startDate?: string, endDate?: string): Promise<Buffer> {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        } : {}),
      },
      include: {
        branch: true,
        user: { select: { firstName: true, lastName: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DaxCloud';

    const worksheet = workbook.addWorksheet('Ventas');
    worksheet.columns = [
      { key: 'date',     width: 20 },
      { key: 'branch',   width: 22 },
      { key: 'user',     width: 22 },
      { key: 'payment',  width: 16 },
      { key: 'status',   width: 14 },
      { key: 'items',    width: 10 },
      { key: 'subtotal', width: 16 },
      { key: 'discount', width: 14 },
      { key: 'total',    width: 16 },
    ];

    this.styleHeader(worksheet, ['Fecha', 'Sucursal', 'Cajero', 'Método pago', 'Estado', 'Items', 'Subtotal', 'Descuento', 'Total']);

    const paymentLabels: Record<string, string> = {
      cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', mixed: 'Mixto',
    };

    sales.forEach((s, i) => {
      const row = worksheet.addRow({
        date:     s.createdAt.toLocaleString('es-CR'),
        branch:   s.branch?.name ?? '-',
        user:     `${s.user?.firstName} ${s.user?.lastName}`,
        payment:  paymentLabels[s.paymentMethod] ?? s.paymentMethod,
        status:   s.status,
        items:    s.items.length,
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total:    Number(s.total),
      });
      row.getCell('subtotal').numFmt = '#,##0.00';
      row.getCell('discount').numFmt = '#,##0.00';
      row.getCell('total').numFmt = '#,##0.00';
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      }
    });

    worksheet.addRow([]);
    const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const totalRow = worksheet.addRow({ date: `Total: ${sales.length} ventas`, total: totalRevenue });
    totalRow.font = { bold: true, color: { argb: 'FFFF5C35' } };
    totalRow.getCell('total').numFmt = '#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportInventory(tenantId: string): Promise<Buffer> {
    const branches = await this.prisma.branch.findMany({
      where: { tenantId, active: true },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DaxCloud';

    for (const branch of branches) {
      const inventory = await this.prisma.inventory.findMany({
        where: { branchId: branch.id },
        include: { product: true },
        orderBy: { product: { name: 'asc' } },
      });

      const worksheet = workbook.addWorksheet(branch.name.slice(0, 31));
      worksheet.columns = [
        { key: 'name',     width: 35 },
        { key: 'sku',      width: 16 },
        { key: 'category', width: 20 },
        { key: 'quantity', width: 14 },
        { key: 'minStock', width: 14 },
        { key: 'maxStock', width: 14 },
        { key: 'location', width: 20 },
        { key: 'status',   width: 14 },
      ];

      this.styleHeader(worksheet, ['Producto', 'SKU', 'Categoría', 'Stock actual', 'Stock mínimo', 'Stock máximo', 'Ubicación', 'Estado']);

      inventory.forEach((item, i) => {
        const isEmpty = item.quantity === 0;
        const isLow = item.quantity <= item.minStock;
        const status = isEmpty ? 'Agotado' : isLow ? 'Stock bajo' : 'OK';

        const row = worksheet.addRow({
          name:     item.product.name,
          sku:      item.product.sku ?? '-',
          category: item.product.category ?? '-',
          quantity: item.quantity,
          minStock: item.minStock,
          maxStock: item.maxStock ?? '-',
          location: item.location ?? '-',
          status,
        });

        const statusCell = row.getCell('status');
        if (isEmpty) {
          statusCell.font = { color: { argb: 'FFE05050' }, bold: true };
        } else if (isLow) {
          statusCell.font = { color: { argb: 'FFF0A030' }, bold: true };
        } else {
          statusCell.font = { color: { argb: 'FF3DBF7F' }, bold: true };
        }

        if (i % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        }
      });

      worksheet.addRow([]);
      const totalRow = worksheet.addRow({ name: `Total: ${inventory.length} productos` });
      totalRow.font = { bold: true, italic: true, color: { argb: 'FFFF5C35' } };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportBackup(tenantId: string): Promise<Buffer> {
    const [products, sales, inventory, branches, users] = await Promise.all([
      this.prisma.product.findMany({ where: { tenantId } }),
      this.prisma.sale.findMany({ where: { tenantId }, include: { items: true, branch: true, user: { select: { firstName: true, lastName: true, email: true } } } }),
      this.prisma.inventory.findMany({ where: { branch: { tenantId } }, include: { product: true, branch: true } }),
      this.prisma.branch.findMany({ where: { tenantId } }),
      this.prisma.user.findMany({ where: { tenantId }, select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true, createdAt: true } }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DaxCloud Backup';
    workbook.created = new Date();

    // Hoja productos
    const wsProducts = workbook.addWorksheet('Productos');
    wsProducts.columns = [{ key: 'name', width: 35 }, { key: 'sku', width: 16 }, { key: 'price', width: 14 }, { key: 'cost', width: 14 }, { key: 'category', width: 20 }];
    this.styleHeader(wsProducts, ['Nombre', 'SKU', 'Precio', 'Costo', 'Categoría']);
    products.forEach(p => wsProducts.addRow({ name: p.name, sku: p.sku ?? '-', price: Number(p.price), cost: p.cost ? Number(p.cost) : '-', category: p.category ?? '-' }));

    // Hoja ventas
    const wsSales = workbook.addWorksheet('Ventas');
    wsSales.columns = [{ key: 'date', width: 22 }, { key: 'branch', width: 22 }, { key: 'user', width: 22 }, { key: 'total', width: 16 }, { key: 'status', width: 14 }];
    this.styleHeader(wsSales, ['Fecha', 'Sucursal', 'Cajero', 'Total', 'Estado']);
    sales.forEach(s => wsSales.addRow({ date: s.createdAt.toLocaleString('es-CR'), branch: s.branch?.name ?? '-', user: `${s.user?.firstName} ${s.user?.lastName}`, total: Number(s.total), status: s.status }));

    // Hoja sucursales
    const wsBranches = workbook.addWorksheet('Sucursales');
    wsBranches.columns = [{ key: 'name', width: 30 }, { key: 'address', width: 40 }, { key: 'phone', width: 20 }, { key: 'active', width: 12 }];
    this.styleHeader(wsBranches, ['Nombre', 'Dirección', 'Teléfono', 'Activa']);
    branches.forEach(b => wsBranches.addRow({ name: b.name, address: b.address ?? '-', phone: b.phone ?? '-', active: b.active ? 'Sí' : 'No' }));

    // Hoja usuarios
    const wsUsers = workbook.addWorksheet('Usuarios');
    wsUsers.columns = [{ key: 'name', width: 30 }, { key: 'email', width: 30 }, { key: 'role', width: 16 }, { key: 'active', width: 12 }];
    this.styleHeader(wsUsers, ['Nombre', 'Correo', 'Rol', 'Activo']);
    users.forEach(u => wsUsers.addRow({ name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role, active: u.active ? 'Sí' : 'No' }));

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}