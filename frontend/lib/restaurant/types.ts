import type { ApiUser } from "@/lib/api";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod = "CARD" | "CASH" | "APPLE_PAY" | "GOOGLE_PAY";

export type ProductAvailability =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "HIDDEN"
  | "OUT_OF_STOCK";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  isApproved?: boolean;
  isOpen?: boolean;
  hasIban?: boolean;
  _count?: { products: number; orders: number; reviews: number };
};

export type DashboardStats = {
  todayOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
};

export type RestaurantOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  itemsCount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  notes?: string | null;
  createdAt: string;
  items: RestaurantOrderItem[];
};

export type RestaurantOrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variantName?: string | null;
  addons?: string[];
  customizations?: string[];
};

export type MenuCategory = {
  id: string;
  name: string;
  description?: string | null;
  image: string | null;
  productsCount: number;
  sortOrder: number;
  visible: boolean;
  products: RestaurantProduct[];
};

export type ProductCategory = {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  _count: { products: number };
};

export type RestaurantProduct = {
  id: string;
  restaurantId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  image: string | null;
  gallery: string[];
  price: number;
  discountPrice: number | null;
  preparationTime: number | null;
  foodType?: string | null;
  availability: ProductAvailability;
  isAvailable: boolean;
  isHidden: boolean;
  outOfStock: boolean;
  variants: { id: string; name: string; price: number }[];
  customizationGroups?: {
    id: string;
    name: string;
    description?: string | null;
    kind?: "option" | "exclusion";
    required: boolean;
    minSelections: number;
    maxSelections: number;
    sortOrder: number;
    options: {
      id: string;
      name: string;
      price: number;
      sortOrder: number;
      isAvailable: boolean;
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
};

export type RestaurantReview = {
  id: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  comment: string;
  orderNumber: string;
  createdAt: string;
};

export type WorkingHour = {
  day: DayOfWeek;
  open: string;
  close: string;
  closed: boolean;
};

export type RestaurantSettings = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  coverImage: string | null;
  phone: string;
  email: string;
  iban: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  minimumOrder: number;
  deliveryFee: number;
  deliveryFeePerKm: number;
  deliveryRadius: number | null;
  isOpen: boolean;
  workingHours: WorkingHour[];
};

export type OwnerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string | null;
};

export type PopularProduct = {
  id: string;
  name: string;
  image: string | null;
  categoryName: string;
  price: number;
  discountPrice: number | null;
  orderCount: number;
};

export type AnalyticsData = {
  monthlyRevenue: number;
  weekOrders: number;
  avgOrderValue: number;
  ordersByDay: { day: string; orders: number }[];
  bestSellers: { name: string; orders: number; revenue: number }[];
  popularCategories: { name: string; percentage: number }[];
};

export type ShellContext = {
  restaurant: RestaurantSummary;
  owner: ApiUser;
  pendingOrders: number;
};

export type ShellData =
  | {
      hasRestaurant: true;
      restaurant: RestaurantSummary;
      owner: ApiUser;
      pendingOrders: number;
    }
  | {
      hasRestaurant: false;
      owner: ApiUser;
      pendingOrders: number;
    };

export type ProductWritePayload = {
  categoryId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  gallery?: string[];
  price: number;
  discountPrice?: number | null;
  preparationTime?: number | null;
  foodType?: string | null;
  availability: ProductAvailability;
  variants?: { id?: string; name: string; price: number }[];
  customizationGroups?: {
    id?: string;
    name: string;
    description?: string | null;
    kind?: "option" | "exclusion";
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
    options: {
      id?: string;
      name: string;
      price: number;
      sortOrder?: number;
      isAvailable?: boolean;
    }[];
  }[];
};
