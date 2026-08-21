import type { PrismaService } from '../prisma/prisma.service';
import {
  STANDARD_MENU_CATEGORIES,
  isReservedMenuCategory,
  isStandardMenuCategory,
  matchStandardMenuCategory,
} from './menu-category-order';

export async function ensureStandardMenuCategories(
  prisma: PrismaService,
  restaurantId: string,
) {
  const existing = await prisma.productCategory.findMany({
    where: { restaurantId },
  });

  const leftoverCustom = existing.filter(
    (category) =>
      !isStandardMenuCategory(category.name) &&
      !isReservedMenuCategory(category.name),
  );
  const missingStandard = STANDARD_MENU_CATEGORIES.some(
    (standard) => !existing.some((category) => category.name === standard.name),
  );
  const orderWrong = STANDARD_MENU_CATEGORIES.some((standard, index) => {
    const found = existing.find((category) => category.name === standard.name);
    return found != null && found.sortOrder !== index;
  });

  if (!missingStandard && leftoverCustom.length === 0 && !orderWrong) {
    return;
  }

  const claimed = new Set<string>();
  const keeperByName = new Map<string, string>();

  for (const standard of STANDARD_MENU_CATEGORIES) {
    const exact = existing.find(
      (category) =>
        !claimed.has(category.id) &&
        !isReservedMenuCategory(category.name) &&
        category.name === standard.name,
    );
    if (!exact) continue;
    keeperByName.set(standard.name, exact.id);
    claimed.add(exact.id);
  }

  for (const standard of STANDARD_MENU_CATEGORIES) {
    if (keeperByName.has(standard.name)) continue;
    const aliased = existing.find((category) => {
      if (claimed.has(category.id) || isReservedMenuCategory(category.name)) {
        return false;
      }
      return matchStandardMenuCategory(category.name)?.name === standard.name;
    });
    if (!aliased) continue;
    keeperByName.set(standard.name, aliased.id);
    claimed.add(aliased.id);
    if (aliased.name !== standard.name) {
      await prisma.productCategory.update({
        where: { id: aliased.id },
        data: { name: standard.name },
      });
    }
  }

  for (const [index, standard] of STANDARD_MENU_CATEGORIES.entries()) {
    const keeperId = keeperByName.get(standard.name);
    if (keeperId) {
      await prisma.productCategory.update({
        where: { id: keeperId },
        data: { sortOrder: index },
      });
      continue;
    }
    const created = await prisma.productCategory.create({
      data: {
        restaurantId,
        name: standard.name,
        sortOrder: index,
      },
    });
    keeperByName.set(standard.name, created.id);
    claimed.add(created.id);
  }

  const defaultKeeperId = keeperByName.get(STANDARD_MENU_CATEGORIES[0].name);
  const leftover = await prisma.productCategory.findMany({
    where: { restaurantId },
  });

  for (const category of leftover) {
    if (claimed.has(category.id) || isReservedMenuCategory(category.name)) {
      continue;
    }

    const matched = matchStandardMenuCategory(category.name);
    const targetId =
      (matched ? keeperByName.get(matched.name) : null) ?? defaultKeeperId;
    if (!targetId || targetId === category.id) continue;

    await prisma.product.updateMany({
      where: { categoryId: category.id },
      data: { categoryId: targetId },
    });
    await prisma.productCategory.delete({ where: { id: category.id } });
  }

  const reserved = await prisma.productCategory.findMany({
    where: {
      restaurantId,
      id: { notIn: [...keeperByName.values()] },
    },
  });

  await Promise.all(
    reserved.map((category, index) =>
      prisma.productCategory.update({
        where: { id: category.id },
        data: { sortOrder: 900 + index },
      }),
    ),
  );
}

export async function ensureAllRestaurantMenuCategories(prisma: PrismaService) {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true },
  });
  for (const restaurant of restaurants) {
    await ensureStandardMenuCategories(prisma, restaurant.id);
  }
}
