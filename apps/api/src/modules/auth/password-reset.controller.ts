import { Controller, Post, Body } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  @Post('request')
  requestReset(@Body() body: { email: string; tenantSlug: string }) {
    return this.passwordResetService.requestReset(body.email, body.tenantSlug);
  }

  @Post('verify')
  verifyCode(@Body() body: { email: string; tenantSlug: string; code: string }) {
    return this.passwordResetService.verifyCode(body.email, body.tenantSlug, body.code);
  }

  @Post('confirm')
  resetPassword(@Body() body: { email: string; tenantSlug: string; code: string; newPassword: string }) {
    return this.passwordResetService.resetPassword(body.email, body.tenantSlug, body.code, body.newPassword);
  }
}