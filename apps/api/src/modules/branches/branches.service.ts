import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface BranchData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  taxId?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  openingHours?: string;
  notes?: string;
}

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) { }

  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async create(tenantId: string, data: BranchData) {
    return this.prisma.branch.create({
      data: { tenantId, ...data },
    });
  }

  async update(tenantId: string, branchId: string, data: Partial<BranchData>) {
    await this.findOne(tenantId, branchId);
    return this.prisma.branch.update({
      where: { id: branchId },
      data,
    });
  }

  async remove(tenantId: string, branchId: string) {
    await this.findOne(tenantId, branchId);
    return this.prisma.branch.update({
      where: { id: branchId },
      data: { active: false },
    });
  }
}