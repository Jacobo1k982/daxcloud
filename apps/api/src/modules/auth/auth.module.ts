import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetController } from './password-reset.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'daxcloud_secret',
      signOptions: { expiresIn: '7d' },
    }),
    EmailModule,
  ],
  providers: [AuthService, JwtStrategy, PasswordResetService],
  controllers: [AuthController, PasswordResetController],
  exports: [AuthService],
})
export class AuthModule {}