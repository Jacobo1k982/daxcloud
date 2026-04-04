import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string; tenantSlug: string }) {
    return this.authService.login(body.email, body.password, body.tenantSlug);
  }

  @Post('register')
  register(@Body() body: {
    tenantName: string;
    tenantSlug: string;
    country: string;
    currency: string;
    locale: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.authService.register(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.sub, user.tenantId);
  }
}