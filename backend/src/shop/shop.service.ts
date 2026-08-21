import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sortVariantsBySize } from '../common/product-sizes';

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

  private formatFee(fee: number | null | undefined) {
    if (fee == null) return '—';
    if (fee === 0) return 'უფასო';
    return `₾${fee.toFixed(2)}`;
  }

  private mapRestaurantRow(
    restaurant: {
      id: string;
      slug: string;
      name: string;
      city: string;
      isOpen: boolean;
      deliveryFee: number | null;
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
      deliveryFeeLabel: this.formatFee(restaurant.deliveryFee),
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

  async getRestaurantMenu(slug: string, options?: { includeUnapproved?: boolean }) {
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
              where: { isHidden: false },
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
      deliveryFeeLabel: this.formatFee(restaurant.deliveryFee),
      minimumOrderLabel: this.formatFee(restaurant.minimumOrder),
      image: restaurant.coverImage || restaurant.logo || fallbackImage,
      logo: restaurant.logo || restaurant.coverImage || fallbackImage,
      city: restaurant.city,
      isOpen: restaurant.isOpen,
    };

    const menu = restaurant.productCategories
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
}
