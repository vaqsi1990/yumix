import { BadRequestException } from '@nestjs/common';

export function normalizeIban(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .toUpperCase();
}

export function assertValidIban(value: unknown): string {
  const iban = normalizeIban(value);
  if (!iban) {
    throw new BadRequestException('IBAN სავალდებულოა');
  }
  if (!isValidIban(iban)) {
    throw new BadRequestException('IBAN არასწორი ფორმატია');
  }
  return iban;
}

export function isValidIban(value: unknown): boolean {
  const iban = normalizeIban(value);
  return /^GE\d{2}[A-Z0-9]{18}$/.test(iban);
}

export function assertRestaurantHasIban(iban: unknown): void {
  if (!isValidIban(iban)) {
    throw new BadRequestException(
      'მენიუსა და პროდუქტების დასამატებლად ჯერ დაამატეთ IBAN პარამეტრებში',
    );
  }
}
