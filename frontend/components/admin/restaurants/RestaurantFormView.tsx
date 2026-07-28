"use client";

import { useEffect, useRef } from "react";
import {
  Building2,
  Clock,
  CreditCard,
  Globe,
  MapPinned,
  Settings2,
  Store,
  Truck,
  User,
} from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES } from "./types";
import {
  createDefaultRestaurantForm,
  restaurantFormSchema,
  slugifyName,
  type RestaurantFormValues,
} from "./form-schema";
import CategoryMultiSelect from "./form/CategoryMultiSelect";
import DeliveryZonesEditor from "./form/DeliveryZonesEditor";
import FormField from "./form/FormField";
import FormSectionCard from "./form/FormSectionCard";
import ImageUploadField from "./form/ImageUploadField";
import MapPickerPlaceholder from "./form/MapPickerPlaceholder";
import WorkingHoursEditor from "./form/WorkingHoursEditor";

type RestaurantFormViewProps = {
  saving?: boolean;
  onSubmit: (data: RestaurantFormValues, mode: "save" | "save-and-add") => void;
  onCancel: () => void;
};

const FEATURE_SWITCHES: {
  key: keyof Pick<
    RestaurantFormValues,
    | "acceptingOrders"
    | "approved"
    | "featured"
    | "visible"
    | "supportsPickup"
    | "supportsDelivery"
  >;
  label: string;
}[] = [
  { key: "acceptingOrders", label: "შეკვეთების მიღება" },
  { key: "approved", label: "დამტკიცებული" },
  { key: "featured", label: "Featured რესტორანი" },
  { key: "visible", label: "ხილვადობა საიტზე" },
  { key: "supportsPickup", label: "Pickup" },
  { key: "supportsDelivery", label: "Delivery" },
];

const PAYMENT_CHECKS: {
  key: keyof Pick<
    RestaurantFormValues,
    "paymentCash" | "paymentCard" | "paymentApplePay" | "paymentGooglePay"
  >;
  label: string;
}[] = [
  { key: "paymentCash", label: "Cash" },
  { key: "paymentCard", label: "Card" },
  { key: "paymentApplePay", label: "Apple Pay" },
  { key: "paymentGooglePay", label: "Google Pay" },
];

export default function RestaurantFormView({
  saving = false,
  onSubmit,
  onCancel,
}: RestaurantFormViewProps) {
  const slugEdited = useRef(false);
  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: createDefaultRestaurantForm(),
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  const name = watch("name");
  const latitude = watch("latitude");
  const longitude = watch("longitude");

  useEffect(() => {
    if (!slugEdited.current && name) {
      setValue("slug", slugifyName(name), { shouldValidate: true });
    }
  }, [name, setValue]);

  function handlePickOnMap() {
    setValue("latitude", "41.7151");
    setValue("longitude", "44.8271");
  }

  function submit(mode: "save" | "save-and-add") {
    return handleSubmit((data) => onSubmit(data, mode))();
  }

  return (
    <FormProvider {...form}>
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit("save");
        }}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <ScrollArea className="h-auto lg:max-h-[calc(100vh-11rem)]">
            <div className="space-y-6 pr-0 lg:pr-4">
              <FormSectionCard
                title="ძირითადი ინფორმაცია"
                description="რესტორნის სახელი, აღწერა და კატეგორიები"
                icon={<Store className="size-4" />}
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  <ImageUploadField
                    label="ლოგო"
                    aspect="square"
                    value={watch("logo")}
                    onChange={(url) => setValue("logo", url)}
                    onError={(msg) => setError("root", { message: msg })}
                  />
                  <ImageUploadField
                    label="Cover ფოტო"
                    aspect="wide"
                    value={watch("coverImage")}
                    onChange={(url) => setValue("coverImage", url)}
                    onError={(msg) => setError("root", { message: msg })}
                  />
                </div>

                <Separator className="my-6" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="რესტორნის სახელი"
                    htmlFor="name"
                    required
                    error={errors.name?.message}
                    className="sm:col-span-2"
                  >
                    <Input id="name" {...register("name")} placeholder="Burger House" />
                  </FormField>

                  <FormField
                    label="Slug"
                    htmlFor="slug"
                    required
                    error={errors.slug?.message}
                    hint="ავტომატურად ივსება სახელიდან"
                  >
                    <Input
                      id="slug"
                      {...register("slug", {
                        onChange: () => {
                          slugEdited.current = true;
                        },
                      })}
                      placeholder="burger-house"
                    />
                  </FormField>

                  <FormField
                    label="კატეგორია"
                    required
                    error={errors.categories?.message}
                  >
                    <CategoryMultiSelect
                      value={watch("categories")}
                      onChange={(cats) => {
                        setValue("categories", cats, { shouldValidate: true });
                        clearErrors("categories");
                      }}
                      error={errors.categories?.message}
                    />
                  </FormField>

                  <FormField
                    label="აღწერა"
                    htmlFor="description"
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="description"
                      {...register("description")}
                      rows={4}
                      placeholder="მოკლე აღწერა რესტორნის შესახებ..."
                    />
                  </FormField>
                </div>
              </FormSectionCard>

              <FormSectionCard
                title="მფლობელის ინფორმაცია"
                description="რესტორნის მფლობელი და ანგარიში"
                icon={<User className="size-4" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="მფლობელის სახელი"
                    htmlFor="ownerName"
                    required
                    error={errors.ownerName?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="ownerName"
                      {...register("ownerName")}
                      placeholder="გიორგი ბერიძე"
                    />
                  </FormField>
                  <FormField
                    label="Email"
                    htmlFor="ownerEmail"
                    required
                    error={errors.ownerEmail?.message}
                  >
                    <Input
                      id="ownerEmail"
                      type="email"
                      {...register("ownerEmail")}
                      placeholder="owner@restaurant.ge"
                    />
                  </FormField>
                  <FormField
                    label="ტელეფონი"
                    htmlFor="ownerPhone"
                    required
                    error={errors.ownerPhone?.message}
                  >
                    <Input
                      id="ownerPhone"
                      {...register("ownerPhone")}
                      placeholder="+995555123456"
                    />
                  </FormField>
                  <FormField
                    label="პაროლი"
                    htmlFor="ownerPassword"
                    hint="არასავალდებულო · მფლობელის ანგარიშის შექმნისას"
                    className="sm:col-span-2"
                  >
                    <Input
                      id="ownerPassword"
                      type="password"
                      autoComplete="new-password"
                      {...register("ownerPassword")}
                    />
                  </FormField>
                </div>
              </FormSectionCard>

              <FormSectionCard
                title="მისამართი"
                description="ფიზიკური მდებარეობა და კოორდინატები"
                icon={<MapPinned className="size-4" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="ქვეყანა" htmlFor="country">
                    <Input id="country" {...register("country")} />
                  </FormField>
                  <FormField
                    label="ქალაქი"
                    required
                    error={errors.city?.message}
                  >
                    <Select
                      value={watch("city") || undefined}
                      onValueChange={(v) =>
                        setValue("city", v, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="აირჩიეთ ქალაქი" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField
                    label="ქუჩა"
                    htmlFor="street"
                    required
                    error={errors.street?.message}
                    className="sm:col-span-2"
                  >
                    <Input id="street" {...register("street")} />
                  </FormField>
                  <FormField label="სახელი / Building" htmlFor="building">
                    <Input id="building" {...register("building")} />
                  </FormField>
                  <FormField label="სართული" htmlFor="floor">
                    <Input id="floor" {...register("floor")} />
                  </FormField>
                  <FormField label="ბინა" htmlFor="apartment">
                    <Input id="apartment" {...register("apartment")} />
                  </FormField>
                  <FormField label="საფოსტო კოდი" htmlFor="postalCode">
                    <Input id="postalCode" {...register("postalCode")} />
                  </FormField>
                  <FormField label="Latitude" htmlFor="latitude">
                    <Input id="latitude" {...register("latitude")} />
                  </FormField>
                  <FormField label="Longitude" htmlFor="longitude">
                    <Input id="longitude" {...register("longitude")} />
                  </FormField>
                </div>

                <Separator className="my-6" />

                <MapPickerPlaceholder
                  latitude={latitude}
                  longitude={longitude}
                  onPick={handlePickOnMap}
                />
              </FormSectionCard>

              <FormSectionCard
                title="ბიზნეს პარამეტრები"
                description="მიწოდება, ფასები და დრო"
                icon={<Truck className="size-4" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="მიწოდების ფასი (₾)" htmlFor="deliveryFee">
                    <Input
                      id="deliveryFee"
                      type="number"
                      min={0}
                      step="0.5"
                      {...register("deliveryFee", { valueAsNumber: true })}
                    />
                  </FormField>
                  <FormField label="მინ. შეკვეთა (₾)" htmlFor="minimumOrder">
                    <Input
                      id="minimumOrder"
                      type="number"
                      min={0}
                      step="1"
                      {...register("minimumOrder", { valueAsNumber: true })}
                    />
                  </FormField>
                  <FormField label="რადიუსი (კმ)" htmlFor="deliveryRadius">
                    <Input
                      id="deliveryRadius"
                      type="number"
                      min={0}
                      step="0.5"
                      {...register("deliveryRadius", { valueAsNumber: true })}
                    />
                  </FormField>
                  <FormField label="მიწოდების დრო (წთ)" htmlFor="estimatedDeliveryMinutes">
                    <Input
                      id="estimatedDeliveryMinutes"
                      type="number"
                      min={1}
                      step="1"
                      {...register("estimatedDeliveryMinutes", {
                        valueAsNumber: true,
                      })}
                    />
                  </FormField>
                </div>
              </FormSectionCard>

              <FormSectionCard
                title="კონტაქტი"
                description="რესტორნის საჯარო კონტაქტები"
                icon={<Globe className="size-4" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="ტელეფონი" htmlFor="phone">
                    <Input id="phone" {...register("phone")} />
                  </FormField>
                  <FormField label="Email" htmlFor="email">
                    <Input id="email" type="email" {...register("email")} />
                  </FormField>
                  <FormField label="ვებსაიტი" htmlFor="website" className="sm:col-span-2">
                    <Input id="website" {...register("website")} placeholder="https://" />
                  </FormField>
                  <FormField label="Facebook" htmlFor="facebook">
                    <Input id="facebook" {...register("facebook")} />
                  </FormField>
                  <FormField label="Instagram" htmlFor="instagram">
                    <Input id="instagram" {...register("instagram")} />
                  </FormField>
                </div>
              </FormSectionCard>

              <FormSectionCard
                title="სამუშაო საათები"
                description="ორშაბათი — კვირა"
                icon={<Clock className="size-4" />}
              >
                <WorkingHoursEditor />
              </FormSectionCard>

              <FormSectionCard
                title="მიწოდების ზონები"
                description="რამდენიმე ზონა სხვადასხვა ფასებით"
                icon={<Building2 className="size-4" />}
              >
                <DeliveryZonesEditor />
              </FormSectionCard>
            </div>
          </ScrollArea>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <FormSectionCard
              title="ფუნქციები"
              description="სტატუსი და ხილვადობა"
              icon={<Settings2 className="size-4" />}
            >
              <div className="space-y-3">
                {FEATURE_SWITCHES.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <Switch
                      checked={watch(key)}
                      onCheckedChange={(checked) => setValue(key, checked)}
                    />
                  </label>
                ))}
              </div>
            </FormSectionCard>

            <FormSectionCard
              title="გადახდის მეთოდები"
              icon={<CreditCard className="size-4" />}
            >
              <div className="space-y-3">
                {PAYMENT_CHECKS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2.5"
                  >
                    <Checkbox
                      checked={watch(key)}
                      onCheckedChange={(checked) =>
                        setValue(key, checked === true)
                      }
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </FormSectionCard>

            {errors.root?.message && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "ინახება..." : "რესტორნის შენახვა"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={saving}
                onClick={() => void submit("save-and-add")}
              >
                შენახვა და ახალი
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white"
                disabled={saving}
                onClick={onCancel}
              >
                გაუქმება
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
