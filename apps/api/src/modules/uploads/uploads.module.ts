import { Module }           from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { existsSync, mkdirSync } from 'fs';

// Crea las carpetas si no existen al arrancar
['./uploads/products', './uploads/avatars', './uploads/temp'].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
