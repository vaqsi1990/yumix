"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import StarRating from "@/components/restaurant/StarRating";
import { formatRelativeTime } from "@/lib/restaurant/format";
import { KA } from "@/lib/restaurant/labels";
import type { RestaurantReview } from "@/lib/restaurant/types";
import { ArrowRight } from "lucide-react";

type LatestReviewsProps = {
  reviews: RestaurantReview[];
};

export default function LatestReviews({ reviews }: LatestReviewsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {KA.dashboard.latestReviews}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/restaurant/reviews">
            {KA.viewAll}
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.slice(0, 4).map((review) => (
          <div
            key={review.id}
            className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
          >
            <Avatar
              src={review.customerAvatar}
              alt={review.customerName}
              fallback={review.customerName}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {review.customerName}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(review.createdAt)}
                </span>
              </div>
              <div className="mt-1">
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {review.comment}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
