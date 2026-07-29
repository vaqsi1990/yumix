"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DollarSign,
  MapPin,
  Package,
  ShoppingBag,
  Star,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import type { AdminRestaurant } from "./types";
import {
  APPROVAL_BADGE,
  APPROVAL_LABELS,
  DAY_LABELS,
} from "./types";
import {
  categoriesLabel,
  openStatusLabel,
  openStatusVariant,
  ownerFullName,
} from "./utils";

type RestaurantDetailViewProps = {
  restaurant: AdminRestaurant;
};

export default function RestaurantDetailView({
  restaurant,
}: RestaurantDetailViewProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "general";

  const mapUrl =
    restaurant.latitude != null && restaurant.longitude != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${restaurant.longitude - 0.02}%2C${restaurant.latitude - 0.02}%2C${restaurant.longitude + 0.02}%2C${restaurant.latitude + 0.02}&layer=mapnik&marker=${restaurant.latitude}%2C${restaurant.longitude}`
      : null;

  return (
    <div className="space-y-6">
      {restaurant.coverImage && (
        <div className="relative h-40 overflow-hidden rounded-2xl bg-muted sm:h-52">
          <Image
            src={restaurant.coverImage}
            alt=""
            fill
            sizes="900px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <Avatar
              src={restaurant.logo}
              alt={restaurant.name}
              fallback={restaurant.name}
              size="lg"
              className="ring-2 ring-white"
            />
            <div>
              <h2 className="text-xl font-bold text-white">{restaurant.name}</h2>
              <p className="text-sm text-white/80">
                {restaurant.city} · {categoriesLabel(restaurant.categories)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "პროდუქტები",
            value: restaurant.totalProducts.toString(),
            icon: Package,
          },
          {
            label: "შეკვეთები",
            value: restaurant.totalOrders.toString(),
            icon: ShoppingBag,
          },
          {
            label: "შემოსავალი",
            value: formatGel(restaurant.revenue),
            icon: DollarSign,
          },
          {
            label: "რეიტინგი",
            value:
              restaurant.rating > 0
                ? `${restaurant.rating.toFixed(1)} (${restaurant.reviewCount})`
                : "—",
            icon: Star,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-neutral-200 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-100">
                <Icon className="size-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={openStatusVariant(restaurant)}>
          {openStatusLabel(restaurant)}
        </Badge>
        <Badge variant={APPROVAL_BADGE[restaurant.approvalStatus]}>
          {APPROVAL_LABELS[restaurant.approvalStatus]}
        </Badge>
        {restaurant.settings.featured && (
          <Badge variant="default">Featured</Badge>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {[
            { id: "general", label: "ზოგადი" },
            { id: "products", label: "პროდუქტები" },
            { id: "categories", label: "კატეგორიები" },
            { id: "orders", label: "შეკვეთები" },
            { id: "reviews", label: "მიმოხილვები" },
            { id: "hours", label: "საათები" },
            { id: "settings", label: "პარამეტრები" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-lg border border-transparent data-[state=active]:border-neutral-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ზოგადი ინფორმაცია</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="სახელი" value={restaurant.name} />
                <Row label="Slug" value={restaurant.slug} />
                <Row
                  label="აღწერა"
                  value={restaurant.description ?? "—"}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">მფლობელი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="სახელი" value={ownerFullName(restaurant)} />
                <Row label="Email" value={restaurant.owner.email} />
                <Row label="ტელეფონი" value={restaurant.owner.phone} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ბიზნესი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row
                  label="კატეგორიები"
                  value={categoriesLabel(restaurant.categories)}
                />
                <Row
                  label="მიწოდების რადიუსი"
                  value={
                    restaurant.deliveryRadius != null
                      ? `${restaurant.deliveryRadius} კმ`
                      : "—"
                  }
                />
                <Row
                  label="მიწოდების ფასი"
                  value={formatGel(restaurant.deliveryFee)}
                />
                <Row
                  label="მინ. შეკვეთა"
                  value={formatGel(restaurant.minimumOrder)}
                />
                <Row
                  label="მიწოდების დრო"
                  value={`~${restaurant.estimatedDeliveryMinutes} წთ`}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">კონტაქტი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="ტელეფონი" value={restaurant.phone} />
                <Row label="Email" value={restaurant.email ?? "—"} />
                <Row label="ვებსაიტი" value={restaurant.website ?? "—"} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4" />
                მდებარეობა
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Row label="ქვეყანა" value={restaurant.country} />
                <Row label="ქალაქი" value={restaurant.city} />
                <Row label="მისამართი" value={restaurant.address} />
                <Row
                  label="კოორდინატები"
                  value={
                    restaurant.latitude != null
                      ? `${restaurant.latitude}, ${restaurant.longitude}`
                      : "—"
                  }
                />
              </div>
              {mapUrl && (
                <iframe
                  title="რუკა"
                  src={mapUrl}
                  className="h-64 w-full rounded-xl border border-neutral-200"
                  loading="lazy"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              {restaurant.approvalStatus !== "approved" && (
                <div className="w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
                  <p className="font-semibold">რესტორანი ჯერ არ არის დამტკიცებული</p>
                  <p className="mt-1 text-xs text-amber-800/90">
                    მენიუ შეგიძლია შექმნა, მაგრამ მომხმარებლებს მაღაზიაში არ
                    გამოჩნდება, სანამ დამტკიცებას არ მიიღებს.
                  </p>
                </div>
              )}
              <p className="text-muted-foreground">
                {restaurant.totalProducts} პროდუქტი
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={`/admin/products/new?restaurantId=${restaurant.id}`}
                  className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  პროდუქტის დამატება
                </Link>
                <Link
                  href="/admin/products"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  ყველა პროდუქტი →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-wrap gap-2">
                {restaurant.categories.map((cat) => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {restaurant.totalOrders} შეკვეთა · mock
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardContent className="p-0">
              {restaurant.reviews.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  მიმოხილვები არ არის
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ავტორი</TableHead>
                      <TableHead>რეიტინგი</TableHead>
                      <TableHead>კომენტარი</TableHead>
                      <TableHead>თარიღი</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurant.reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>{review.authorName}</TableCell>
                        <TableCell>{review.rating} ★</TableCell>
                        <TableCell>{review.comment}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(review.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>დღე</TableHead>
                    <TableHead>გახსნა</TableHead>
                    <TableHead>დაკეტვა</TableHead>
                    <TableHead>დაკეტილი</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurant.workingHours.map((wh) => (
                    <TableRow key={wh.day}>
                      <TableCell className="font-medium">
                        {DAY_LABELS[wh.day]}
                      </TableCell>
                      <TableCell>
                        {wh.isClosed ? "—" : wh.openTime}
                      </TableCell>
                      <TableCell>
                        {wh.isClosed ? "—" : wh.closeTime}
                      </TableCell>
                      <TableCell>
                        <Switch checked={wh.isClosed} disabled />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="space-y-4 py-6">
              {[
                {
                  label: "შეკვეთების მიღება",
                  checked: restaurant.settings.acceptingOrders,
                },
                {
                  label: "Featured რესტორანი",
                  checked: restaurant.settings.featured,
                },
                {
                  label: "ხილვადობა",
                  checked: restaurant.settings.visible,
                },
                {
                  label: "დამტკიცებული",
                  checked: restaurant.settings.approved,
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <Switch checked={item.checked} disabled />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-neutral-900 sm:text-right">{value}</span>
    </div>
  );
}
