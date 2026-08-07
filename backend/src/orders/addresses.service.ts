import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAddressDto } from './dto/order.schemas';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return { addresses };
  }

  async create(userId: string, input: CreateAddressDto) {
    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        title: input.title.trim(),
        city: input.city.trim(),
        street: input.street.trim(),
        building: input.building?.trim() || null,
        entrance: input.entrance?.trim() || null,
        floor: input.floor?.trim() || null,
        apartment: input.apartment?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        deliveryNote: input.deliveryNote?.trim() || null,
        isDefault: input.isDefault ?? false,
      },
    });

    const count = await this.prisma.address.count({ where: { userId } });
    if (count === 1) {
      await this.prisma.address.update({
        where: { id: address.id },
        data: { isDefault: true },
      });
      address.isDefault = true;
    }

    return { address };
  }

  async getOwned(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('მისამართი ვერ მოიძებნა');
    return address;
  }
}
