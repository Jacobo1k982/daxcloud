import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    // ✅ URL relativa — el frontend la combina con NEXT_PUBLIC_API_URL
    // Ejemplo: /api/uploads/products/uuid.jpg
    return {
      url:          `/uploads/products/${file.filename}`,
      filename:     file.filename,
      originalName: file.originalname,
      size:         file.size,
    };
  }

  @Post('product-image-url')
  validateImageUrl(@Body() body: { url: string }) {
    if (!body.url) throw new BadRequestException('URL requerida');
    try {
      new URL(body.url);
      return { url: body.url, valid: true };
    } catch {
      throw new BadRequestException('URL inválida');
    }
  }
}
