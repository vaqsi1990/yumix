import {
  BadRequestException,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

const FIELD_LABELS: Record<string, string> = {
  productId: 'საჭმელი',
  slug: 'კატეგორია',
  label: 'სახელი',
  image: 'სურათი',
};

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const fieldKey = issue?.path?.[0];
      const fieldLabel =
        typeof fieldKey === 'string'
          ? (FIELD_LABELS[fieldKey] ?? fieldKey)
          : null;

      if (
        issue?.code === 'invalid_type' &&
        (issue as { input?: unknown }).input === undefined
      ) {
        throw new BadRequestException(
          fieldLabel
            ? `ველი „${fieldLabel}“ სავალდებულოა`
            : 'შევსებული არ არის სავალდებულო ველი',
        );
      }

      const message = issue?.message ?? 'ვალიდაცია ვერ გაიარა';
      throw new BadRequestException(message);
    }
    return parsed.data;
  }
}
