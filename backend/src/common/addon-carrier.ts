import type { PrismaService } from '../prisma/prisma.service';
import { ADDON_CARRIER_PRODUCT_NAME } from './addon-categories';

type PrismaClient = Pick<PrismaService, 'product' | 'productCategory'>;

export async function ensureAddonCarrierProduct(
  prisma: PrismaClient,
  restaurantId: string,
) {
  const existing = await prisma.product.findFirst({
    where: {
      restaurantId,
      name: ADDON_CARRIER_PRODUCT_NAME,
      isHidden: true,
    },
  });
  if (existing) return existing;

  let category = await prisma.productCategory.findFirst({
    where: { restaurantId },
    orderBy: { sortOrder: 'asc' },
  });
  if (!category) {
    category = await prisma.productCategory.create({
      data: {
        restaurantId,
        name: 'Extras',
        sortOrder: 999,
      },
    });
  }

  return prisma.product.create({
    data: {
      restaurantId,
      categoryId: category.id,
      name: ADDON_CARRIER_PRODUCT_NAME,
      price: 0,
      isAvailable: true,
      isHidden: true,
      outOfStock: false,
    },
  });
}
