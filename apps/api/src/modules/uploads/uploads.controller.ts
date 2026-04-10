import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';
import { diskStorage }     from 'multer';
import { extname }         from 'path';
import { v4 as uuidv4 }   from 'uuid';

const imageFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext     = extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new BadRequestException('Solo se permiten imágenes jpg, png o webp'), false);
};

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {

  // ── Imagen de producto ────────────────────────────────────────────────────
  @Post('product-image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/products',
      filename:    (req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
    }),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return {
      url:          `/uploads/products/${file.filename}`,
      filename:     file.filename,
      originalName: file.originalname,
      size:         file.size,
    };
  }

  // ── Avatar de usuario ─────────────────────────────────────────────────────
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename:    (req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
    }),
    fileFilter: imageFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB para avatares
  }))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return {
      url:          `/uploads/avatars/${file.filename}`,
      filename:     file.filename,
      originalName: file.originalname,
      size:         file.size,
    };
  }

  // ── Validar URL externa ───────────────────────────────────────────────────
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
