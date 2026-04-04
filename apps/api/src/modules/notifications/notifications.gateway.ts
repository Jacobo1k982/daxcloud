import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, OnGatewayConnection,
  OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3005', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // tenantId → Set de socket IDs
  private tenantSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token
        ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return client.disconnect();

      const payload = this.jwtService.verify(token);
      client.data.tenantId = payload.tenantId;
      client.data.userId   = payload.sub;

      // Registra el socket en el tenant
      if (!this.tenantSockets.has(payload.tenantId)) {
        this.tenantSockets.set(payload.tenantId, new Set());
      }
      this.tenantSockets.get(payload.tenantId)!.add(client.id);

      // Envía las no leídas al conectarse
      const unread = await this.notificationsService.getUnread(payload.tenantId);
      client.emit('notifications:init', unread);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const tenantId = client.data?.tenantId;
    if (tenantId) {
      this.tenantSockets.get(tenantId)?.delete(client.id);
    }
  }

  @SubscribeMessage('notifications:read')
  async handleRead(@ConnectedSocket() client: Socket, @MessageBody() id: string) {
    await this.notificationsService.markRead(id, client.data.tenantId);
    this.emitToTenant(client.data.tenantId, 'notifications:read', { id });
  }

  @SubscribeMessage('notifications:read_all')
  async handleReadAll(@ConnectedSocket() client: Socket) {
    await this.notificationsService.markAllRead(client.data.tenantId);
    this.emitToTenant(client.data.tenantId, 'notifications:read_all', {});
  }

  // Emite a todos los sockets del tenant
  emitToTenant(tenantId: string, event: string, data: any) {
    const sockets = this.tenantSockets.get(tenantId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Crea y emite una notificación
  async pushToTenant(tenantId: string, dto: {
    type: string; title: string; message: string;
    icon?: string; color?: string; link?: string; meta?: any;
  }) {
    const notif = await this.notificationsService.create(tenantId, dto);
    this.emitToTenant(tenantId, 'notifications:new', notif);
    return notif;
  }
}