export type ApprovalStatus = "approved" | "pending" | "rejected";

export type RestaurantSortOption =
  | "newest"
  | "oldest"
  | "name"
  | "rating";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WorkingHourEntry = {
  day: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export type RestaurantOwner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalId: string | null;
};

export type RestaurantReview = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type RestaurantSettings = {
  acceptingOrders: boolean;
  featured: boolean;
  visible: boolean;
  approved: boolean;
};

/** Full admin restaurant row + detail payload (mock / Prisma-ready) */
export type AdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  owner: RestaurantOwner;
  country: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  categories: string[];
  deliveryRadius: number | null;
  deliveryFee: number;
  deliveryFeePerKm: number;
  minimumOrder: number;
  estimatedDeliveryMinutes: number;
  phone: string;
  email: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  isSuspended: boolean;
  approvalStatus: ApprovalStatus;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  workingHours: WorkingHourEntry[];
  settings: RestaurantSettings;
  reviews: RestaurantReview[];
  createdAt: string;
  updatedAt: string;
};

export type RestaurantFilters = {
  searchName: string;
  searchOwner: string;
  searchPhone: string;
  city: string;
  category: string;
  approvalStatus: string;
  openStatus: string;
  sort: RestaurantSortOption;
  page: number;
  pageSize: number;
};

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  approved: "დამტკიცებული",
  pending: "მოლოდინში",
  rejected: "უარყოფილი",
};

export const APPROVAL_BADGE: Record<
  ApprovalStatus,
  "success" | "warning" | "destructive"
> = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "ორშაბათი",
  tuesday: "სამშაბათი",
  wednesday: "ოთხშაბათი",
  thursday: "ხუთშაბათი",
  friday: "პარასკევი",
  saturday: "შაბათი",
  sunday: "კვირა",
};

export const SORT_OPTIONS: { value: RestaurantSortOption; label: string }[] = [
  { value: "newest", label: "ახალი ჯერ" },
  { value: "oldest", label: "ძველი ჯერ" },
  { value: "name", label: "სახელი" },
  { value: "rating", label: "რეიტინგი" },
];

export const CITIES = [
  "თბილისი",
  "ბათუმი",
  "ქუთაისი",
  "რუსთავი",
] as const;

export { RESTAURANT_CATEGORIES } from "@/lib/restaurant-categories";
