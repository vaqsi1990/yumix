import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async getPublicRestaurants(query?: string) {
    const q = query?.trim();

    const db = await this.prisma.restaurant.findMany({
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
    });

    if (db.length > 0) {
      const restaurants = db.map((restaurant, index) => {
        const reviewCount = restaurant.reviews.length;
        const rating =
          reviewCount > 0
            ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviewCount
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
        } satisfies PublicRestaurant;
      });

      return { restaurants, fromDatabase: true };
    }

    const filtered = q
      ? DEMO_RESTAURANTS.filter(
          (r) =>
            r.name.toLowerCase().includes(q.toLowerCase()) ||
            r.categories.toLowerCase().includes(q.toLowerCase()) ||
            r.city.toLowerCase().includes(q.toLowerCase()),
        )
      : DEMO_RESTAURANTS;

    return { restaurants: filtered, fromDatabase: false };
  }
}
