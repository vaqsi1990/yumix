"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import ConfirmDialog from "@/components/restaurant/ConfirmDialog";
import EmptyState from "@/components/restaurant/EmptyState";
import StarRating from "@/components/restaurant/StarRating";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatRelativeTime } from "@/lib/restaurant/format";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import type { RestaurantReview } from "@/lib/restaurant/types";

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantReview | null>(
    null,
  );

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.reviews();
      setReviews(res.reviews);
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await restaurantApi.deleteReview(deleteTarget.id);
      await loadReviews();
      setDeleteTarget(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedDelete),
      );
    }
  }

  if (loading) {
    return (
      <PageHeader title={KA.reviews.title} description={KA.loading} />
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={KA.reviews.title}
        description={KA.reviews.subtitle}
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title={KA.reviews.empty}
          description={KA.reviews.emptyDesc}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <Avatar
                      src={review.customerAvatar}
                      alt={review.customerName}
                      fallback={review.customerName}
                      size="lg"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{review.customerName}</p>
                        <span className="text-xs text-muted-foreground">
                          {review.orderNumber}
                        </span>
                      </div>
                      <div className="mt-1">
                        <StarRating rating={review.rating} size="md" />
                      </div>
                      <p className="mt-2 text-sm">{review.comment}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(review.createdAt)} ·{" "}
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(review)}
                  >
                    <Trash2 className="size-4" />
                    {KA.delete}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={KA.reviews.deleteTitle}
        description={KA.reviews.deleteDesc}
        confirmLabel={KA.delete}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
