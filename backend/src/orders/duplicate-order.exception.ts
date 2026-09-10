import { ConflictException } from '@nestjs/common';

export class DuplicateOrderException extends ConflictException {
  constructor(public readonly orderId: string) {
    super('შეკვეთა უკვე გაფორმდა');
  }
}
