import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const SYSTEM_PERMISSIONS = [
  { key: 'pos.access',        label: 'Acceso al POS',            group: 'POS'           },
  { key: 'pos.discount',      label: 'Aplicar descuentos',       group: 'POS'           },
  { key: 'pos.refund',        label: 'Procesar reembolsos',      group: 'POS'           },
  { key: 'products.view',     label: 'Ver productos',            group: 'Productos'     },
  { key: 'products.create',   label: 'Crear productos',          group: 'Productos'     },
  { key: 'products.edit',     label: 'Editar productos',         group: 'Productos'     },
  { key: 'products.delete',   label: 'Eliminar productos',       group: 'Productos'     },
  { key: 'inventory.view',    label: 'Ver inventario',           group: 'Inventario'    },
  { key: 'inventory.manage',  label: 'Gestionar inventario',     group: 'Inventario'    },
  { key: 'sales.view',        label: 'Ver ventas',               group: 'Ventas'        },
  { key: 'sales.export',      label: 'Exportar ventas',          group: 'Ventas'        },
  { key: 'branches.view',     label: 'Ver sucursales',           group: 'Sucursales'    },
  { key: 'branches.manage',   label: 'Gestionar sucursales',     group: 'Sucursales'    },
  { key: 'users.view',        label: 'Ver usuarios',             group: 'Usuarios'      },
  { key: 'users.manage',      label: 'Gestionar usuarios',       group: 'Usuarios'      },
  { key: 'reports.view',      label: 'Ver reportes',             group: 'Reportes'      },
  { key: 'reports.export',    label: 'Exportar reportes',        group: 'Reportes'      },
  { key: 'settings.view',     label: 'Ver configuración',        group: 'Configuración' },
  { key: 'settings.manage',   label: 'Gestionar configuración',  group: 'Configuración' },
  { key: 'billing.manage',    label: 'Gestionar facturación',    group: 'Facturación'   },
];

// Agrupa los permisos por categoría
export function groupPermissions() {
  const groups: Record<string, typeof SYSTEM_PERMISSIONS> = {};
  for (const p of SYSTEM_PERMISSIONS) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }
  return groups;
}

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  getSystemPermissions() {
    return SYSTEM_PERMISSIONS;
  }

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where:   { tenantId },
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where:   { id: roleId, tenantId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async create(tenantId: string, data: {
    name:        string;
    displayName: string;
    color:       string;
    permissions: string[];
  }) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    const existing = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: slug } },
    });
    if (existing) throw new BadRequestException('Ya existe un rol con ese nombre');

    return this.prisma.role.create({
      data: {
        tenantId,
        name:        slug,
        displayName: data.displayName,
        color:       data.color,
        permissions: data.permissions,
        isDefault:   false,
      },
    });
  }

  async update(tenantId: string, roleId: string, data: {
    displayName?: string;
    color?:       string;
    permissions?: string[];
  }) {
    await this.findOne(tenantId, roleId);
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.color       !== undefined && { color:       data.color       }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
      },
    });
  }

  async remove(tenantId: string, roleId: string) {
    const role = await this.findOne(tenantId, roleId);
    if (role.isDefault) {
      throw new BadRequestException('No puedes eliminar un rol del sistema');
    }
    if ((role._count as any).users > 0) {
      throw new BadRequestException(
        `Este rol tiene ${(role._count as any).users} usuario(s) asignado(s). Reasígnalos antes de eliminar.`
      );
    }
    return this.prisma.role.delete({ where: { id: roleId } });
  }

  async assignToUser(tenantId: string, userId: string, roleId: string) {
    const role = await this.findOne(tenantId, roleId);
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where:  { id: userId },
      data:   { customRoleId: role.id },
      select: { id: true, firstName: true, lastName: true, customRoleId: true },
    });
  }

  async seedDefaultRoles(tenantId: string) {
    const defaults = [
      {
        name:        'admin',
        displayName: 'Administrador',
        color:       '#E05050',
        permissions: SYSTEM_PERMISSIONS.map(p => p.key),
        isDefault:   true,
      },
      {
        name:        'manager',
        displayName: 'Gerente',
        color:       '#F0A030',
        permissions: SYSTEM_PERMISSIONS
          .filter(p => !p.key.includes('settings') && !p.key.includes('billing') && !p.key.includes('users.manage'))
          .map(p => p.key),
        isDefault: true,
      },
      {
        name:        'cashier',
        displayName: 'Cajero',
        color:       '#3DBF7F',
        permissions: ['pos.access', 'pos.discount'],
        isDefault:   true,
      },
    ];

    for (const role of defaults) {
      await this.prisma.role.upsert({
        where:  { tenantId_name: { tenantId, name: role.name } },
        update: {},
        create: { tenantId, ...role },
      });
    }

    return { message: 'Roles predeterminados creados correctamente' };
  }
}
