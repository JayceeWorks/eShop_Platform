import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_UPLOAD_BYTES } from '@simple-concepts/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { detectImageType } from './image-type';
import { LocalImageStorage } from './local-image-storage';

/** The part of the multer file this controller uses (memory storage). */
type UploadedImage = { buffer: Buffer };

@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUploadsController {
  constructor(private readonly storage: LocalImageStorage) {}

  @Post('products')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  async uploadProductImage(
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Choose a photo to upload');
    const extension = detectImageType(file.buffer);
    if (!extension)
      throw new BadRequestException('Use a JPG, PNG or WebP photo');
    return { url: await this.storage.saveProductImage(file.buffer, extension) };
  }
}
