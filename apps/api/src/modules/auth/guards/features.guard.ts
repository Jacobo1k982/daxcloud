import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.get<string>('feature', context.getHandler());
    if (!requiredFeature) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user.features?.[requiredFeature]) {
      throw new ForbiddenException(`El módulo "${requiredFeature}" no está activo en tu plan`);
    }

    return true;
  }
}