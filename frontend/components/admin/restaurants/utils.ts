import type {
  AdminRestaurant,
  ApprovalStatus,
  RestaurantFilters,
  RestaurantSortOption,
} from "./types";

export type RestaurantStats = {
  total: number;
  approved: number;
  pending: number;
  closed: number;
};

export function computeRestaurantStats(
  restaurants: AdminRestaurant[],
): RestaurantStats {
  return {
    total: restaurants.length,
    approved: restaurants.filter((r) => r.approvalStatus === "approved").length,
    pending: restaurants.filter((r) => r.approvalStatus === "pending").length,
    closed: restaurants.filter((r) => !r.isOpen).length,
  };
}

export function filterAndSortRestaurants(
  restaurants: AdminRestaurant[],
  filters: Pick<
    RestaurantFilters,
    | "searchName"
    | "searchOwner"
    | "searchPhone"
    | "city"
    | "category"
    | "approvalStatus"
    | "openStatus"
    | "sort"
  >,
): AdminRestaurant[] {
  let result = [...restaurants];

  if (filters.searchName.trim()) {
    const q = filters.searchName.trim().toLowerCase();
    result = result.filter((r) => r.name.toLowerCase().includes(q));
  }

  if (filters.searchOwner.trim()) {
    const q = filters.searchOwner.trim().toLowerCase();
    result = result.filter((r) => {
      const full = `${r.owner.firstName} ${r.owner.lastName}`.toLowerCase();
      return full.includes(q);
    });
  }

  if (filters.searchPhone.trim()) {
    const q = filters.searchPhone.replace(/\s/g, "");
    result = result.filter(
      (r) =>
        r.phone.replace(/\s/g, "").includes(q) ||
        r.owner.phone.replace(/\s/g, "").includes(q),
    );
  }

  if (filters.city) {
    result = result.filter((r) => r.city === filters.city);
  }

  if (filters.category) {
    result = result.filter((r) => r.categories.includes(filters.category));
  }

  if (filters.approvalStatus) {
    result = result.filter(
      (r) => r.approvalStatus === filters.approvalStatus,
    );
  }

  if (filters.openStatus === "open") {
    result = result.filter((r) => r.isOpen && !r.isSuspended);
  } else if (filters.openStatus === "closed") {
    result = result.filter((r) => !r.isOpen || r.isSuspended);
  }

  result.sort((a, b) => compareRestaurants(a, b, filters.sort));
  return result;
}

function compareRestaurants(
  a: AdminRestaurant,
  b: AdminRestaurant,
  sort: RestaurantSortOption,
): number {
  switch (sort) {
    case "newest":
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case "oldest":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "name":
      return a.name.localeCompare(b.name, "ka");
    case "rating":
      return b.rating - a.rating;
    default:
      return 0;
  }
}

export function paginateRestaurants<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; totalPages: number; total: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    total,
  };
}

export function patchRestaurantApproval(
  restaurant: AdminRestaurant,
  status: ApprovalStatus,
): AdminRestaurant {
  const now = new Date().toISOString();
  return {
    ...restaurant,
    approvalStatus: status,
    settings: {
      ...restaurant.settings,
      approved: status === "approved",
      visible: status === "approved",
    },
    updatedAt: now,
  };
}

export function patchRestaurantSuspended(
  restaurant: AdminRestaurant,
  suspended: boolean,
): AdminRestaurant {
  return {
    ...restaurant,
    isSuspended: suspended,
    settings: {
      ...restaurant.settings,
      acceptingOrders: suspended ? false : restaurant.settings.acceptingOrders,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function ownerFullName(restaurant: AdminRestaurant) {
  return `${restaurant.owner.firstName} ${restaurant.owner.lastName}`;
}

export function categoriesLabel(categories: string[]) {
  return categories.join(", ") || "—";
}

export function openStatusLabel(restaurant: AdminRestaurant) {
  if (restaurant.isSuspended) return "შეჩერებული";
  return restaurant.isOpen ? "ღია" : "დაკეტილი";
}

export function openStatusVariant(
  restaurant: AdminRestaurant,
): "success" | "destructive" | "warning" {
  if (restaurant.isSuspended) return "warning";
  return restaurant.isOpen ? "success" : "destructive";
}
