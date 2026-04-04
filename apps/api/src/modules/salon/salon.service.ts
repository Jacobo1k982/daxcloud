import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalonService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════
  // EMPLEADOS / ESTILISTAS
  // ════════════════════════════════════════

  async findAllEmployees(tenantId: string, branchId?: string) {
    return this.prisma.employee.findMany({
      where: { tenantId, active: true, ...(branchId && { branchId }) },
      include: {
        branch: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async createEmployee(tenantId: string, data: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    role?: string;
    color?: string;
    branchId?: string;
  }) {
    return this.prisma.employee.create({
      data: { tenantId, ...data },
      include: { branch: { select: { name: true } } },
    });
  }

  async updateEmployee(tenantId: string, employeeId: string, data: any) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return this.prisma.employee.update({ where: { id: employeeId }, data });
  }

  async deleteEmployee(tenantId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return this.prisma.employee.update({ where: { id: employeeId }, data: { active: false } });
  }

  // ════════════════════════════════════════
  // SERVICIOS
  // ════════════════════════════════════════

  async findAllServices(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, active: true },
      include: { _count: { select: { appointments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createService(tenantId: string, data: {
    name: string;
    description?: string;
    duration: number;
    price: number;
    category?: string;
    color?: string;
  }) {
    return this.prisma.service.create({ data: { tenantId, ...data } });
  }

  async updateService(tenantId: string, serviceId: string, data: any) {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return this.prisma.service.update({ where: { id: serviceId }, data });
  }

  async deleteService(tenantId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, tenantId } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return this.prisma.service.update({ where: { id: serviceId }, data: { active: false } });
  }

  // ════════════════════════════════════════
  // CITAS / AGENDA
  // ════════════════════════════════════════

  async findAllAppointments(tenantId: string, date?: string, employeeId?: string, branchId?: string) {
    const filterDate = date ? new Date(date) : new Date();
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: filterDate, lt: nextDay },
        ...(employeeId && { employeeId }),
        ...(branchId && { branchId }),
      },
      include: {
        employee: { select: { firstName: true, lastName: true, color: true } },
        service: { select: { name: true, duration: true, price: true, color: true } },
        client: { select: { firstName: true, lastName: true, phone: true } },
        branch: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findAppointmentsByRange(tenantId: string, startDate: string, endDate: string, employeeId?: string) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: new Date(startDate) },
        endTime: { lte: new Date(endDate) },
        ...(employeeId && { employeeId }),
      },
      include: {
        employee: { select: { firstName: true, lastName: true, color: true } },
        service: { select: { name: true, duration: true, price: true, color: true } },
        client: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createAppointment(tenantId: string, data: {
    clientName: string;
    clientPhone?: string;
    clientId?: string;
    employeeId?: string;
    serviceId?: string;
    branchId?: string;
    startTime: string;
    notes?: string;
  }) {
    // Calcula endTime basado en la duración del servicio
    let endTime: Date;
    if (data.serviceId) {
      const service = await this.prisma.service.findFirst({ where: { id: data.serviceId, tenantId } });
      if (!service) throw new NotFoundException('Servicio no encontrado');
      endTime = new Date(new Date(data.startTime).getTime() + service.duration * 60 * 1000);
    } else {
      endTime = new Date(new Date(data.startTime).getTime() + 60 * 60 * 1000); // 1 hora por defecto
    }

    // Verifica conflictos de horario para el empleado
    if (data.employeeId) {
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          tenantId,
          employeeId: data.employeeId,
          status: { notIn: ['cancelled'] },
          OR: [
            { startTime: { gte: new Date(data.startTime), lt: endTime } },
            { endTime: { gt: new Date(data.startTime), lte: endTime } },
            { startTime: { lte: new Date(data.startTime) }, endTime: { gte: endTime } },
          ],
        },
      });
      if (conflict) throw new BadRequestException('El empleado ya tiene una cita en ese horario');
    }

    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientId: data.clientId,
        employeeId: data.employeeId,
        serviceId: data.serviceId,
        branchId: data.branchId,
        startTime: new Date(data.startTime),
        endTime,
        notes: data.notes,
        status: 'scheduled',
      },
      include: {
        employee: { select: { firstName: true, lastName: true, color: true } },
        service: { select: { name: true, duration: true, price: true } },
      },
    });
  }

  async updateAppointmentStatus(tenantId: string, appointmentId: string, status: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id: appointmentId, tenantId } });
    if (!appointment) throw new NotFoundException('Cita no encontrada');

    const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) throw new BadRequestException('Estado inválido');

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: status as any },
      include: {
        employee: { select: { firstName: true, lastName: true, color: true } },
        service: { select: { name: true, duration: true, price: true } },
      },
    });
  }

  async updateAppointment(tenantId: string, appointmentId: string, data: any) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id: appointmentId, tenantId } });
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    return this.prisma.appointment.update({ where: { id: appointmentId }, data });
  }

  // ════════════════════════════════════════
  // CLIENTES
  // ════════════════════════════════════════

  async findAllClients(tenantId: string, search?: string) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
        active: true,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }),
      },
      include: {
        _count: { select: { appointments: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async createClient(tenantId: string, data: {
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
    birthDate?: string;
    notes?: string;
  }) {
    return this.prisma.client.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        notes: data.notes,
      },
    });
  }

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayAppointments,
      pendingToday,
      completedToday,
      monthAppointments,
      totalClients,
      monthRevenue,
      topServices,
      topEmployees,
    ] = await Promise.all([
      this.prisma.appointment.count({ where: { tenantId, startTime: { gte: today, lt: tomorrow } } }),
      this.prisma.appointment.count({ where: { tenantId, startTime: { gte: today, lt: tomorrow }, status: { in: ['scheduled', 'confirmed'] } } }),
      this.prisma.appointment.count({ where: { tenantId, startTime: { gte: today, lt: tomorrow }, status: 'completed' } }),
      this.prisma.appointment.count({ where: { tenantId, startTime: { gte: monthStart } } }),
      this.prisma.client.count({ where: { tenantId, active: true } }),
      this.prisma.appointment.findMany({
        where: { tenantId, startTime: { gte: monthStart }, status: 'completed', serviceId: { not: null } },
        include: { service: { select: { price: true } } },
      }),
      this.prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { tenantId, serviceId: { not: null }, status: 'completed' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.appointment.groupBy({
        by: ['employeeId'],
        where: { tenantId, employeeId: { not: null }, startTime: { gte: monthStart } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const revenue = monthRevenue.reduce((acc, a) => acc + Number(a.service?.price ?? 0), 0);

    const topServicesWithNames = await Promise.all(
      topServices.map(async s => {
        const service = await this.prisma.service.findUnique({ where: { id: s.serviceId! }, select: { name: true, price: true } });
        return { serviceId: s.serviceId, name: service?.name ?? 'Eliminado', count: s._count.id, price: Number(service?.price ?? 0) };
      })
    );

    const topEmployeesWithNames = await Promise.all(
      topEmployees.map(async e => {
        const employee = await this.prisma.employee.findUnique({ where: { id: e.employeeId! }, select: { firstName: true, lastName: true, color: true } });
        return { employeeId: e.employeeId, name: employee ? `${employee.firstName} ${employee.lastName}` : 'Eliminado', color: employee?.color, count: e._count.id };
      })
    );

    return {
      todayAppointments,
      pendingToday,
      completedToday,
      monthAppointments,
      totalClients,
      monthRevenue: revenue,
      topServices: topServicesWithNames,
      topEmployees: topEmployeesWithNames,
    };
  }
}