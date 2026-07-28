import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UTApi, UTFile } from 'uploadthing/server';
import type { UploadedImageFile } from './upload.types';
import {
  UPLOADTHING_INGEST_URL,
  resolveUploadThingToken,
} from './upload.config';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Injectable()
export class UploadService {
  private readonly utapi: UTApi;

  constructor(config: ConfigService) {
    const token = resolveUploadThingToken(config);
    if (!token) {
      throw new Error(
        'UPLOADTHING_TOKEN (or UPLOADTHING_SECRET + UPLOADTHING_APP_ID) is missing in backend/.env',
      );
    }

    const ingestUrl =
      config.get<string>('UPLOADTHING_INGEST_URL')?.trim() ||
      UPLOADTHING_INGEST_URL;

    this.utapi = new UTApi({ token, ingestUrl });
  }

  async uploadImage(file: UploadedImageFile): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('ფაილი არ არის მითითებული.');
    }

    if (!ALLOWED_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'მხოლოდ JPG, PNG, WebP ან GIF ფაილებია დაშვებული.',
      );
    }

    if (file.size > MAX_BYTES) {
      throw new BadRequestException('ფაილი ძალიან დიდია (max 4MB).');
    }

    const name =
      file.originalname ||
      `upload-${Date.now()}.${file.mimetype.split('/')[1] ?? 'jpg'}`;

    try {
      const utFile = new UTFile([new Uint8Array(file.buffer)], name, {
        type: file.mimetype,
      });
      const result = await this.utapi.uploadFiles(utFile);

      if (result.error) {
        throw new BadGatewayException(this.formatUploadThingError(result.error));
      }

      const url = result.data?.ufsUrl ?? result.data?.url;
      if (!url) {
        throw new BadGatewayException(
          'ატვირთვა დასრულდა, მაგრამ URL ვერ მოიძებნა.',
        );
      }

      return { url };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof BadGatewayException) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : 'ატვირთვა ვერ მოხერხდა';
      throw new BadGatewayException(message);
    }
  }

  private formatUploadThingError(error: {
    message?: string;
    data?: unknown;
  }): string {
    const parts = [error.message, JSON.stringify(error.data ?? '')].join(' ');

    if (/region is forbidden|forbidden for this app/i.test(parts)) {
      return (
        'UploadThing რეგიონი არ ემთხვევა. Dashboard → Regions & ACL → აირჩიე ' +
        '"EU Central - Frankfurt (fra1)", შემდეგ გადატვირთე backend.'
      );
    }

    return error.message || 'UploadThing-მა უარყო ატვირთვა.';
  }
}
