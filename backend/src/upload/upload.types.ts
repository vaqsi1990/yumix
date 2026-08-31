/** Shape of a file from NestJS `FileInterceptor` (memory storage). */
export type UploadedImageFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};
