"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import RestaurantsStats from "./RestaurantsStats";
import RestaurantsTable from "./RestaurantsTable";
import RestaurantsToolbar from "./RestaurantsToolbar";
import { MOCK_RESTAURANTS } from "./mock-data";
import type { AdminRestaurant, RestaurantFilters } from "./types";
import {
  computeRestaurantStats,
  filterAndSortRestaurants,
  paginateRestaurants,
  patchRestaurantApproval,
  patchRestaurantSuspended,
} from "./utils";

const DEFAULT_FILTERS: RestaurantFilters = {
  searchName: "",
  searchOwner: "",
  searchPhone: "",
  city: "",
  category: "",
  approvalStatus: "",
  openStatus: "",
  sort: "newest",
  page: 1,
  pageSize: 10,
};

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] =
    useState<AdminRestaurant[]>(MOCK_RESTAURANTS);
  const [filters, setFilters] = useState<RestaurantFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const stats = useMemo(
    () => computeRestaurantStats(restaurants),
    [restaurants],
  );

  const filtered = useMemo(
    () => filterAndSortRestaurants(restaurants, filters),
    [restaurants, filters],
  );

  const { items: pageItems, totalPages, total } = useMemo(
    () => paginateRestaurants(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );

  const updateFilters = useCallback((patch: Partial<RestaurantFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  function updateRestaurant(
    id: string,
    updater: (r: AdminRestaurant) => AdminRestaurant,
  ) {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? updater(r) : r)),
    );
  }

  function handleApprove(r: AdminRestaurant) {
    updateRestaurant(r.id, (x) => patchRestaurantApproval(x, "approved"));
  }

  function handleReject(r: AdminRestaurant) {
    updateRestaurant(r.id, (x) => patchRestaurantApproval(x, "rejected"));
  }

  function handleSuspend(r: AdminRestaurant) {
    updateRestaurant(r.id, (x) => patchRestaurantSuspended(x, true));
  }

  function handleDelete(r: AdminRestaurant) {
    if (!window.confirm(`"${r.name}" წავშალოთ?`)) return;
    setRestaurants((prev) => prev.filter((x) => x.id !== r.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(r.id);
      return next;
    });
  }

  function bulkUpdate(
    ids: string[],
    updater: (r: AdminRestaurant) => AdminRestaurant,
  ) {
    const idSet = new Set(ids);
    setRestaurants((prev) =>
      prev.map((r) => (idSet.has(r.id) ? updater(r) : r)),
    );
    setSelectedIds(new Set());
  }

  function handleBulkApprove() {
    bulkUpdate([...selectedIds], (r) => patchRestaurantApproval(r, "approved"));
  }

  function handleBulkReject() {
    bulkUpdate([...selectedIds], (r) => patchRestaurantApproval(r, "rejected"));
  }

  function handleBulkSuspend() {
    bulkUpdate([...selectedIds], (r) => patchRestaurantSuspended(r, true));
  }

  function handleBulkDelete() {
    if (!window.confirm(`${selectedIds.size} რესტორნის წაშლა?`)) return;
    const idSet = selectedIds;
    setRestaurants((prev) => prev.filter((r) => !idSet.has(r.id)));
    setSelectedIds(new Set());
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(restaurants, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yumix-restaurants-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <RestaurantsStats stats={stats} />

      <RestaurantsToolbar
        filters={filters}
        totalCount={total}
        selectedCount={selectedIds.size}
        onFiltersChange={updateFilters}
        onAdd={() => router.push("/admin/restaurants/new")}
        onExport={handleExport}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onBulkSuspend={handleBulkSuspend}
        onBulkDelete={handleBulkDelete}
      />

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <RestaurantsTable
            restaurants={pageItems}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onApprove={handleApprove}
            onReject={handleReject}
            onSuspend={handleSuspend}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Pagination
        page={filters.page}
        totalPages={totalPages}
        onPageChange={(page) => updateFilters({ page })}
      />
    </div>
  );
}
