import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sortVariantsBySize } from '../common/product-sizes';
import {
  isAuxiliaryMenuCategory,
  onlyCustomerMenuCategories,
} from '../common/menu-category-order';
import {
  ensureAllRestaurantMenuCategories,
  ensureStandardMenuCategories,
} from '../common/ensure-menu-categories';
import {
  collectTasteSlugs,
  tasteKeywordsForSlugs,
  tasteLabel,
} from './food-taste';
import {
  formatDeliveryFeeLabel,
  formatDistanceKm,
  formatMoneyLabel,
  haversineKm,
} from '../common/delivery.utils';
import { ADDON_CARRIER_PRODUCT_NAME } from '../common/addon-categories';

export type PublicRestaurant = {
  id: string;
  slug: string;
  name: string;
  categories: string;
  rating: number;
  reviews: number;
  time: string;
  deliveryFeeLabel: string;
  image: string;
  logo: string;
  city: string;
  isOpen: boolean;
  distanceKm?: number;
  distanceLabel?: string;
};

const DEMO_IMAGES = [
  '/rest/1.jpg',
  '/rest/3.jpg',
  '/rest/4.jpg',
  '/rest/5.jpg',
  '/rest/2.jpg',
];

export const DEMO_RESTAURANTS: PublicRestaurant[] = [
  {
    id: 'demo-pizza-room',
    slug: 'pizza-room',
    name: 'Pizza Room',
    categories: 'პიცა, იტალიური',
    rating: 4.8,
    reviews: 326,
    time: '30-40 წთ',
    deliveryFeeLabel: '₾6.00',
    image: '/rest/1.jpg',
    logo: '/rest/1.jpg',
    city: 'თბილისი',
    isOpen: true,
  },
  {
    id: 'demo-burger-hub',
    slug: 'burger-hub',
    name: 'Burger Hub',
    categories: 'ბურგერი, ამერიკული',
    rating: 4.7,
    reviews: 412,
    time: '25-35 წთ',
    deliveryFeeLabel: '₾5.50',
    image: '/rest/3.jpg',
    logo: '/rest/3.jpg',
    city: 'თბილისი',
    isOpen: true,
  },
  {
    id: 'demo-sushi-spot',
    slug: 'sushi-spot',
    name: 'Sushi Spot',
    categories: 'სუში, აზიური',
    rating: 4.9,
    reviews: 198,
    time: '35-45 წთ',
    deliveryFeeLabel: '₾7.00',
    image: '/rest/4.jpg',
    logo: '/rest/4.jpg',
    city: 'თბილისი',
    isOpen: true,
  },
  {
    id: 'demo-georgian-house',
    slug: 'georgian-house',
    name: 'Georgian House',
    categories: 'ქართული, ტრადიციული',
    rating: 4.6,
    reviews: 541,
    time: '40-50 წთ',
    deliveryFeeLabel: '₾4.50',
    image: '/rest/5.jpg',
    logo: '/rest/5.jpg',
    city: 'თბილისი',
    isOpen: true,
  },
];

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  private mapRestaurantRow(
    restaurant: {
      id: string;
      slug: string;
      name: string;
      city: string;
      isOpen: boolean;
      deliveryFee: number | null;
      deliveryFeePerKm?: number | null;
      coverImage: string | null;
      logo: string | null;
      categories: { category: { name: string } }[];
      reviews: { rating: number }[];
    },
    index: number,
  ): PublicRestaurant {
    const reviewCount = restaurant.reviews.length;
    const rating =
      reviewCount > 0
        ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;
    const categoryNames = restaurant.categories
      .map((c) => c.category.name)
      .join(', ');
    const fallbackImage = DEMO_IMAGES[index % DEMO_IMAGES.length];

    return {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      categories: categoryNames || restaurant.city,
      rating: Number(rating.toFixed(1)),
      reviews: reviewCount,
      time: restaurant.isOpen ? '25-45 წთ' : 'დახურულია',
      deliveryFeeLabel: formatDeliveryFeeLabel(
        restaurant.deliveryFee,
        restaurant.deliveryFeePerKm,
      ),
      image: restaurant.coverImage || restaurant.logo || fallbackImage,
      logo: restaurant.logo || restaurant.coverImage || fallbackImage,
      city: restaurant.city,
      isOpen: restaurant.isOpen,
    };
  }

  private menuKeywordFilters(keywords: string[]) {
    return keywords.flatMap((keyword) => [
      { name: { contains: keyword, mode: 'insensitive' as const } },
      { description: { contains: keyword, mode: 'insensitive' as const } },
      { foodType: { contains: keyword, mode: 'insensitive' as const } },
      {
        category: {
          name: { contains: keyword, mode: 'insensitive' as const },
        },
      },
    ]);
  }

  async getPublicRestaurantsByMenuKeywords(keywords: string[]) {
    const normalized = [
      ...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)),
    ];

    if (normalized.length === 0) {
      return { restaurants: [], fromDatabase: true, pendingCount: 0 };
    }

    const [db, totalInDb, pendingCount] = await Promise.all([
      this.prisma.restaurant.findMany({
        where: {
          isApproved: true,
          products: {
            some: {
              isHidden: false,
              isAvailable: true,
              deletedAt: null,
              OR: this.menuKeywordFilters(normalized),
            },
          },
        },
        include: {
          categories: {
            include: { category: { select: { name: true } } },
          },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isApproved: false } }),
    ]);

    if (db.length > 0) {
      return {
        restaurants: db.map((restaurant, index) =>
          this.mapRestaurantRow(restaurant, index),
        ),
        fromDatabase: true,
        pendingCount,
      };
    }

    if (totalInDb > 0) {
      return { restaurants: [], fromDatabase: true, pendingCount };
    }

    const filtered = DEMO_RESTAURANTS.filter((restaurant) => {
      const haystack = restaurant.categories.toLowerCase();
      return normalized.some((keyword) =>
        haystack.includes(keyword.toLowerCase()),
      );
    });

    return { restaurants: filtered, fromDatabase: false, pendingCount: 0 };
  }

  async getPublicRestaurants(query?: string) {
    await ensureAllRestaurantMenuCategories(this.prisma);
    const q = query?.trim();

    const [db, totalInDb, pendingCount] = await Promise.all([
      this.prisma.restaurant.findMany({
        where: {
          isApproved: true,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: 'insensitive' as const } },
                  { city: { contains: q, mode: 'insensitive' as const } },
                  { address: { contains: q, mode: 'insensitive' as const } },
                ],
              }
            : {}),
        },
        include: {
          categories: {
            include: { category: { select: { name: true } } },
          },
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isApproved: false } }),
    ]);

    if (db.length > 0) {
      return {
        restaurants: db.map((restaurant, index) =>
          this.mapRestaurantRow(restaurant, index),
        ),
        fromDatabase: true,
        pendingCount,
      };
    }

    if (totalInDb > 0) {
      return { restaurants: [], fromDatabase: true, pendingCount };
    }

    const filtered = q
      ? DEMO_RESTAURANTS.filter(
          (r) =>
            r.name.toLowerCase().includes(q.toLowerCase()) ||
            r.categories.toLowerCase().includes(q.toLowerCase()) ||
            r.city.toLowerCase().includes(q.toLowerCase()),
        )
      : DEMO_RESTAURANTS;

    return { restaurants: filtered, fromDatabase: false, pendingCount: 0 };
  }

  async getNearbyRestaurants(userId: string) {
    const address = await this.prisma.address.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: { latitude: true, longitude: true },
    });

    const lat = address?.latitude;
    const lng = address?.longitude;
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return { restaurants: [], fromDatabase: true, hasLocation: false };
    }

    const db = await this.prisma.restaurant.findMany({
      where: {
        isApproved: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        categories: {
          include: { category: { select: { name: true } } },
        },
        reviews: { select: { rating: true } },
      },
    });

    const defaultMaxKm = 15;
    const nearby = db
      .map((restaurant, index) => {
        if (restaurant.latitude == null || restaurant.longitude == null) {
          return null;
        }
        const distanceKm = haversineKm(
          lat,
          lng,
          restaurant.latitude,
          restaurant.longitude,
        );
        const maxKm = restaurant.deliveryRadius ?? defaultMaxKm;
        if (distanceKm > maxKm) return null;
        return {
          ...this.mapRestaurantRow(restaurant, index),
          distanceKm: Number(distanceKm.toFixed(2)),
          distanceLabel: formatDistanceKm(distanceKm),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);

    return { restaurants: nearby, fromDatabase: true, hasLocation: true };
  }

  async getRestaurantMenu(slug: string, options?: { includeUnapproved?: boolean }) {
    const existing = await this.prisma.restaurant.findFirst({
      where: {
        slug,
        ...(options?.includeUnapproved ? {} : { isApproved: true }),
      },
      select: { id: true },
    });
    if (existing) {
      await ensureStandardMenuCategories(this.prisma, existing.id);
    }

    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        slug,
        ...(options?.includeUnapproved ? {} : { isApproved: true }),
      },
      include: {
        categories: {
          include: { category: { select: { name: true } } },
        },
        reviews: { select: { rating: true } },
        productCategories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: { isHidden: false, deletedAt: null },
              orderBy: { name: 'asc' },
              include: {
                variants: { orderBy: { name: 'asc' } },
                customizationGroups: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    options: {
                      where: { isAvailable: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
        addOns: { orderBy: [{ category: 'asc' }, { name: 'asc' }] },
      },
    });

    if (!restaurant) {
      const demo = DEMO_RESTAURANTS.find((r) => r.slug === slug);
      if (!demo) {
        throw new NotFoundException('რესტორანი ვერ მოიძებნა');
      }
      return {
        restaurant: demo,
        menu: [],
        fromDatabase: false,
      };
    }

    const reviewCount = restaurant.reviews.length;
    const rating =
      reviewCount > 0
        ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;
    const categoryNames = restaurant.categories
      .map((c) => c.category.name)
      .join(', ');
    const fallbackImage = DEMO_IMAGES[0];

    const publicRestaurant = {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      description: restaurant.description,
      categories: categoryNames || restaurant.city,
      rating: Number(rating.toFixed(1)),
      reviews: reviewCount,
      time: restaurant.isOpen ? '25-45 წთ' : 'დახურულია',
      deliveryFeeLabel: formatDeliveryFeeLabel(
        restaurant.deliveryFee,
        restaurant.deliveryFeePerKm,
      ),
      minimumOrderLabel: formatMoneyLabel(restaurant.minimumOrder),
      image: restaurant.coverImage || restaurant.logo || fallbackImage,
      logo: restaurant.logo || restaurant.coverImage || fallbackImage,
      city: restaurant.city,
      isOpen: restaurant.isOpen,
    };

    const menu = onlyCustomerMenuCategories(restaurant.productCategories)
      .map((category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        products: category.products
          .filter((product) => product.isAvailable)
          .map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            image: product.image,
            price: product.price,
            discountPrice: product.discountPrice,
            outOfStock: product.outOfStock,
            variants: sortVariantsBySize(
              product.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                price: variant.price,
              })),
            ),
            customizationGroups: product.customizationGroups
              .filter((group) => group.options.length > 0)
              .map((group) => ({
                id: group.id,
                name: group.name,
                description: group.description,
                kind: group.kind === 'exclusion' ? 'exclusion' : 'option',
                required: group.required,
                minSelections: group.minSelections,
                maxSelections: group.maxSelections,
                sortOrder: group.sortOrder,
                options: group.options.map((option) => ({
                  id: option.id,
                  name: option.name,
                  price: option.price,
                })),
              })),
          })),
      }))
      .filter((category) => category.products.length > 0);

    return {
      restaurant: publicRestaurant,
      menu,
      addOns: restaurant.addOns.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        category: addon.category,
      })),
      fromDatabase: true,
    };
  }

  async getPublicOffers() {
    const products = await this.prisma.product.findMany({
      where: {
        isHidden: false,
        isAvailable: true,
        outOfStock: false,
        deletedAt: null,
        discountPrice: { not: null, gt: 0 },
        restaurant: { isApproved: true },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            isOpen: true,
            deliveryFee: true,
            deliveryFeePerKm: true,
            coverImage: true,
            logo: true,
            categories: {
              include: { category: { select: { name: true } } },
            },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const discounted = products.filter(
      (product) =>
        product.discountPrice != null &&
        product.discountPrice > 0 &&
        product.discountPrice < product.price,
    );

    const offers = discounted.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice as number,
      outOfStock: product.outOfStock,
      restaurant: {
        slug: product.restaurant.slug,
        name: product.restaurant.name,
        logo:
          product.restaurant.logo ||
          product.restaurant.coverImage ||
          DEMO_IMAGES[0],
      },
    }));

    const byRestaurant = new Map<
      string,
      {
        restaurant: (typeof discounted)[number]['restaurant'];
        offersCount: number;
        maxDiscountPercent: number;
      }
    >();

    for (const product of discounted) {
      const percent = Math.round(
        ((product.price - (product.discountPrice as number)) / product.price) *
          100,
      );
      const existing = byRestaurant.get(product.restaurant.id);
      if (!existing) {
        byRestaurant.set(product.restaurant.id, {
          restaurant: product.restaurant,
          offersCount: 1,
          maxDiscountPercent: percent,
        });
      } else {
        existing.offersCount += 1;
        existing.maxDiscountPercent = Math.max(
          existing.maxDiscountPercent,
          percent,
        );
      }
    }

    const restaurants = [...byRestaurant.values()]
      .sort((a, b) => b.maxDiscountPercent - a.maxDiscountPercent)
      .map((row, index) => ({
        ...this.mapRestaurantRow(row.restaurant, index),
        offersCount: row.offersCount,
        maxDiscountPercent: row.maxDiscountPercent,
      }));

    return { offers, restaurants, fromDatabase: true };
  }

  async getFavoriteFoods() {
    const rows = await this.prisma.homeFavoriteFood.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        product: {
          include: {
            category: { select: { name: true } },
            variants: { orderBy: { name: 'asc' } },
            customizationGroups: {
              orderBy: { sortOrder: 'asc' },
              include: {
                options: {
                  where: { isAvailable: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
            restaurant: {
              select: {
                id: true,
                slug: true,
                name: true,
                logo: true,
                coverImage: true,
                isOpen: true,
                isApproved: true,
                deliveryFee: true,
                deliveryFeePerKm: true,
                reviews: { select: { rating: true } },
              },
            },
          },
        },
      },
    });

    const products = rows
      .map((row) => row.product)
      .filter(
        (product) =>
          product != null &&
          product.deletedAt == null &&
          !product.isHidden &&
          product.isAvailable &&
          !product.outOfStock &&
          product.name !== ADDON_CARRIER_PRODUCT_NAME &&
          product.restaurant.isApproved &&
          !isAuxiliaryMenuCategory(product.category.name),
      )
      .map((product) => this.mapPublicShopProduct(product));

    return { products };
  }

  private mapPublicShopProduct(
    product: {
      id: string;
      name: string;
      description: string | null;
      image: string | null;
      price: number;
      discountPrice: number | null;
      outOfStock: boolean;
      variants: { id: string; name: string; price: number }[];
      customizationGroups: {
        id: string;
        name: string;
        description: string | null;
        required: boolean;
        minSelections: number;
        maxSelections: number;
        sortOrder: number;
        options: { id: string; name: string; price: number }[];
      }[];
      restaurant: {
        slug: string;
        name: string;
        logo: string | null;
        coverImage: string | null;
        isOpen: boolean;
        deliveryFee: number | null;
        deliveryFeePerKm?: number | null;
        reviews: { rating: number }[];
      };
    },
  ) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      outOfStock: product.outOfStock,
      variants: sortVariantsBySize(
        product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          price: variant.price,
        })),
      ),
      customizationGroups: product.customizationGroups
        .filter((group) => group.options.length > 0)
        .map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          kind: group.kind === 'exclusion' ? 'exclusion' : 'option',
          required: group.required,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          sortOrder: group.sortOrder,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            price: option.price,
          })),
        })),
      restaurant: (() => {
        const reviewCount = product.restaurant.reviews.length;
        const rating =
          reviewCount > 0
            ? product.restaurant.reviews.reduce(
                (sum, review) => sum + review.rating,
                0,
              ) / reviewCount
            : 0;

        return {
          slug: product.restaurant.slug,
          name: product.restaurant.name,
          logo:
            product.restaurant.logo ||
            product.restaurant.coverImage ||
            DEMO_IMAGES[0],
          isOpen: product.restaurant.isOpen,
          rating: Number(rating.toFixed(1)),
          reviews: reviewCount,
          time: product.restaurant.isOpen ? '25-45 წთ' : 'დახურულია',
          deliveryFeeLabel: formatDeliveryFeeLabel(
            product.restaurant.deliveryFee,
            product.restaurant.deliveryFeePerKm,
          ),
        };
      })(),
    };
  }

  async getRecommendations(userId: string) {
    const [orders, favoriteRestaurants, favoriteProducts] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId, status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          restaurantId: true,
          restaurant: {
            select: {
              categories: { include: { category: { select: { name: true } } } },
            },
          },
          items: {
            select: {
              quantity: true,
              productId: true,
              product: {
                select: {
                  name: true,
                  foodType: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.favoriteRestaurant.findMany({
        where: { userId },
        select: { restaurantId: true },
      }),
      this.prisma.favoriteProduct.findMany({
        where: { userId },
        select: { productId: true },
      }),
    ]);

    const categoryCounts = new Map<string, number>();
    const restaurantOrderCounts = new Map<string, number>();
    const productOrderCounts = new Map<string, number>();

    for (const order of orders) {
      const restaurantCategoryNames = order.restaurant.categories
        .map((row) => row.category.name)
        .join(' ');

      for (const item of order.items) {
        const qty = Math.max(1, item.quantity);
        restaurantOrderCounts.set(
          order.restaurantId,
          (restaurantOrderCounts.get(order.restaurantId) ?? 0) + qty,
        );
        productOrderCounts.set(
          item.productId,
          (productOrderCounts.get(item.productId) ?? 0) + qty,
        );

        const slugs = collectTasteSlugs([
          item.product.foodType,
          item.product.name,
          item.product.category.name,
          restaurantCategoryNames,
        ]);
        for (const slug of slugs) {
          categoryCounts.set(slug, (categoryCounts.get(slug) ?? 0) + qty);
        }
      }
    }

    const topCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, count]) => ({
        slug,
        label: tasteLabel(slug),
        count,
      }));

    const favoriteRestaurantIds = new Set(
      favoriteRestaurants.map((row) => row.restaurantId),
    );
    const favoriteProductIds = new Set(
      favoriteProducts.map((row) => row.productId),
    );

    if (
      topCategories.length === 0 &&
      restaurantOrderCounts.size === 0 &&
      favoriteRestaurantIds.size === 0 &&
      favoriteProductIds.size === 0
    ) {
      return { restaurants: [], products: [], topCategories: [] };
    }

    const topSlugs = topCategories.map((row) => row.slug);
    const keywords = tasteKeywordsForSlugs(topSlugs);
    const keywordFilters =
      keywords.length > 0 ? this.menuKeywordFilters(keywords) : [];

    const orderedRestaurantIds = [...restaurantOrderCounts.keys()];
    const orderedProductIds = [...productOrderCounts.keys()];

    const [restaurants, products] = await Promise.all([
      this.prisma.restaurant.findMany({
        where: {
          isApproved: true,
          OR: [
            ...(orderedRestaurantIds.length
              ? [{ id: { in: orderedRestaurantIds } }]
              : []),
            ...(favoriteRestaurantIds.size
              ? [{ id: { in: [...favoriteRestaurantIds] } }]
              : []),
            ...(topSlugs.length
              ? [
                  {
                    categories: {
                      some: {
                        category: {
                          name: {
                            in: topCategories.map((row) => row.label),
                          },
                        },
                      },
                    },
                  },
                ]
              : []),
            ...(keywordFilters.length
              ? [
                  {
                    products: {
                      some: {
                        isHidden: false,
                        isAvailable: true,
                        deletedAt: null,
                        OR: keywordFilters,
                      },
                    },
                  },
                ]
              : []),
          ],
        },
        include: {
          categories: {
            include: { category: { select: { name: true } } },
          },
          reviews: { select: { rating: true } },
        },
      }),
      this.prisma.product.findMany({
        where: {
          isHidden: false,
          isAvailable: true,
          outOfStock: false,
          deletedAt: null,
          restaurant: { isApproved: true },
          OR: [
            ...(orderedProductIds.length
              ? [{ id: { in: orderedProductIds } }]
              : []),
            ...(favoriteProductIds.size
              ? [{ id: { in: [...favoriteProductIds] } }]
              : []),
            ...(topSlugs.length ? [{ foodType: { in: topSlugs } }] : []),
            ...(keywordFilters.length ? keywordFilters : []),
          ],
        },
        include: {
          category: { select: { name: true } },
          variants: { orderBy: { name: 'asc' } },
          customizationGroups: {
            orderBy: { sortOrder: 'asc' },
            include: {
              options: {
                where: { isAvailable: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          restaurant: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
              coverImage: true,
              isOpen: true,
              categories: {
                include: { category: { select: { name: true } } },
              },
            },
          },
        },
        take: 60,
      }),
    ]);

    const scoredRestaurants = restaurants
      .map((restaurant, index) => {
        const orderQty = restaurantOrderCounts.get(restaurant.id) ?? 0;
        const restaurantSlugs = collectTasteSlugs(
          restaurant.categories.map((row) => row.category.name),
        );
        const categoryScore = restaurantSlugs.reduce(
          (sum, slug) => sum + (categoryCounts.get(slug) ?? 0),
          0,
        );
        const favoriteBonus = favoriteRestaurantIds.has(restaurant.id) ? 2 : 0;
        const score = orderQty * 8 + categoryScore * 3 + favoriteBonus;
        return {
          score,
          restaurant: this.mapRestaurantRow(restaurant, index),
        };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((row) => row.restaurant);

    const scoredProducts = products
      .map((product) => {
        const orderQty = productOrderCounts.get(product.id) ?? 0;
        const productSlugs = collectTasteSlugs([
          product.foodType,
          product.name,
          product.category.name,
          ...product.restaurant.categories.map((row) => row.category.name),
        ]);
        const categoryScore = productSlugs.reduce(
          (sum, slug) => sum + (categoryCounts.get(slug) ?? 0),
          0,
        );
        const favoriteBonus = favoriteProductIds.has(product.id) ? 2 : 0;
        const score = orderQty * 10 + categoryScore * 4 + favoriteBonus;
        return { score, product };
      })
      .filter(
        (row) =>
          row.score > 0 && !isAuxiliaryMenuCategory(row.product.category.name),
      )
      .sort((a, b) => b.score - a.score);

    const perRestaurant = new Map<string, number>();
    const recommendedProducts = [];
    for (const row of scoredProducts) {
      const restaurantId = row.product.restaurant.id;
      const taken = perRestaurant.get(restaurantId) ?? 0;
      if (taken >= 3) continue;
      perRestaurant.set(restaurantId, taken + 1);
      recommendedProducts.push({
        id: row.product.id,
        name: row.product.name,
        description: row.product.description,
        image: row.product.image,
        price: row.product.price,
        discountPrice: row.product.discountPrice,
        outOfStock: row.product.outOfStock,
        variants: sortVariantsBySize(
          row.product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
          })),
        ),
        customizationGroups: row.product.customizationGroups
          .filter((group) => group.options.length > 0)
          .map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            kind: group.kind === 'exclusion' ? 'exclusion' : 'option',
            required: group.required,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            sortOrder: group.sortOrder,
            options: group.options.map((option) => ({
              id: option.id,
              name: option.name,
              price: option.price,
            })),
          })),
        restaurant: {
          slug: row.product.restaurant.slug,
          name: row.product.restaurant.name,
          logo:
            row.product.restaurant.logo ||
            row.product.restaurant.coverImage ||
            DEMO_IMAGES[0],
          isOpen: row.product.restaurant.isOpen,
        },
      });
      if (recommendedProducts.length >= 8) break;
    }

    return {
      restaurants: scoredRestaurants,
      products: recommendedProducts,
      topCategories,
    };
  }
}
