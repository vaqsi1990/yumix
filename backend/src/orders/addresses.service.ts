import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAddressDto, UpdateAddressDto } from './dto/order.schemas';

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

  async update(userId: string, addressId: string, input: UpdateAddressDto) {
    await this.getOwned(userId, addressId);

    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.city !== undefined ? { city: input.city.trim() } : {}),
        ...(input.street !== undefined ? { street: input.street.trim() } : {}),
        ...(input.building !== undefined
          ? { building: input.building?.trim() || null }
          : {}),
        ...(input.entrance !== undefined
          ? { entrance: input.entrance?.trim() || null }
          : {}),
        ...(input.floor !== undefined
          ? { floor: input.floor?.trim() || null }
          : {}),
        ...(input.apartment !== undefined
          ? { apartment: input.apartment?.trim() || null }
          : {}),
        ...(input.postalCode !== undefined
          ? { postalCode: input.postalCode?.trim() || null }
          : {}),
        ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
        ...(input.longitude !== undefined
          ? { longitude: input.longitude }
          : {}),
        ...(input.deliveryNote !== undefined
          ? { deliveryNote: input.deliveryNote?.trim() || null }
          : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      },
    });

    return { address };
  }

  async setDefault(userId: string, addressId: string) {
    await this.getOwned(userId, addressId);
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
    return { address };
  }

  async remove(userId: string, addressId: string) {
    const address = await this.getOwned(userId, addressId);
    const count = await this.prisma.address.count({ where: { userId } });
    if (count <= 1) {
      throw new BadRequestException('მინიმუმ ერთი მისამართი სავალდებულოა');
    }
    const orderCount = await this.prisma.order.count({
      where: { addressId },
    });
    if (orderCount > 0) {
      throw new BadRequestException(
        'ამ მისამართზე შეკვეთებია — წაშლა შეუძლებელია',
      );
    }

    await this.prisma.address.delete({ where: { id: addressId } });

    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { deleted: true };
  }
}
