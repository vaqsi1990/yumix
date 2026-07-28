import {
  BadRequestException,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? 'ვალიდაცია ვერ გაიარა';
      throw new BadRequestException(message);
    }
    return parsed.data;
  }
}
