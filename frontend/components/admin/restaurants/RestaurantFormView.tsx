"use client";

import { useEffect, useRef, useState } from "react";
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
import LocationMapPicker from "@/components/maps/LocationMapPicker";
import OwnerUserPicker, {
  type RestaurantOwnerCandidate,
} from "./form/OwnerUserPicker";
import WorkingHoursEditor from "./form/WorkingHoursEditor";

type RestaurantFormViewProps = {
  users: RestaurantOwnerCandidate[];
  initialValues?: RestaurantFormValues;
  mode?: "create" | "edit";
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
  users,
  initialValues,
  mode = "create",
  saving = false,
  onSubmit,
  onCancel,
}: RestaurantFormViewProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [formScrollHeight, setFormScrollHeight] = useState<number>();

  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: initialValues ?? createDefaultRestaurantForm(),
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    reset(initialValues ?? createDefaultRestaurantForm());
  }, [initialValues, reset]);

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const city = watch("city");
  const street = watch("street");
  const country = watch("country");
  const ownerId = watch("ownerId");

  const addressQuery = [street, city, country].filter(Boolean).join(", ");

  useEffect(() => {
    if (!ownerId) return;
    const owner = users.find((user) => user.id === ownerId);
    if (owner?.personalId) {
      setValue("ownerPersonalId", owner.personalId, { shouldValidate: true });
    }
  }, [ownerId, users, setValue]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    function syncHeight() {
      const el = sidebarRef.current;
      if (!el) return;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      setFormScrollHeight(isDesktop ? el.offsetHeight : undefined);
    }

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(sidebar);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  function handleLocationChange(lat: string, lng: string) {
    setValue("latitude", lat, { shouldDirty: true });
    setValue("longitude", lng, { shouldDirty: true });
  }

  function handleAddressResolved(address: {
    displayName: string;
    city: string;
    street: string;
    country: string;
    postalCode: string;
  }) {
    if (address.street) {
      setValue("street", address.street, { shouldValidate: true, shouldDirty: true });
    }
    if (address.city) {
      const matched = CITIES.find(
        (item) =>
          item === address.city ||
          address.city.includes(item) ||
          item.includes(address.city),
      );
      if (matched) {
        setValue("city", matched, { shouldValidate: true, shouldDirty: true });
      }
    }
    if (address.country) {
      setValue("country", address.country, { shouldDirty: true });
    }
    if (address.postalCode) {
      setValue("postalCode", address.postalCode, { shouldDirty: true });
    }
  }

  function submit(saveMode: "save" | "save-and-add") {
    return handleSubmit((data) =>
      onSubmit(
        {
          ...data,
          slug:
            mode === "edit"
              ? data.slug?.trim() || initialValues?.slug || slugifyName(data.name)
              : slugifyName(data.name),
        },
        saveMode,
      ),
    )();
  }

  const actionButtons = (
    <>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving
          ? "ინახება..."
          : mode === "edit"
            ? "ცვლილებების შენახვა"
            : "რესტორნის შენახვა"}
      </Button>
      {mode === "create" && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={saving}
          onClick={() => void submit("save-and-add")}
        >
          შენახვა და ახალი
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full bg-white"
        disabled={saving}
        onClick={onCancel}
      >
        გაუქმება
      </Button>
    </>
  );

  const settingsPanels = (
    <>
      <FormSectionCard
        title="ფუნქციები"
        description="სტატუსი და ხილვადობა"
        icon={<Settings2 className="size-4" />}
      >
        <div className="space-y-3">
          {FEATURE_SWITCHES.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2.5"
            >
              <span className="text-[16px] md:text-[18px] font-medium">{label}</span>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
              <span className="text-[16px] md:text-[18px] font-medium">{label}</span>
            </label>
          ))}
        </div>
      </FormSectionCard>

      {errors.root?.message && (
        <p className="text-[16px] md:text-[18px] text-destructive">{errors.root.message}</p>
      )}
    </>
  );

  const ownerSection = (
    <FormSectionCard
      title="მფლობელის ინფორმაცია"
      description="აირჩიეთ არსებული მომხმარებელი რესტორნის მფლობელად"
      icon={<User className="size-4" />}
    >
      <FormField
        label="მფლობელი"
        htmlFor="ownerId"
        required
        error={errors.ownerId?.message}
        hint="მოძებნეთ სახელით, email-ით ან ტელეფონით"
      >
        <OwnerUserPicker
          users={users}
          value={watch("ownerId")}
          onChange={(userId) =>
            setValue("ownerId", userId, { shouldValidate: true })
          }
          error={errors.ownerId?.message}
        />
      </FormField>

      <FormField
        label="პირადობის ნომერი"
        htmlFor="ownerPersonalId"
        required
        error={errors.ownerPersonalId?.message}
        hint="მფლობელის 11-ციფრიანი პირადობის ნომერი"
      >
        <Input
          id="ownerPersonalId"
          inputMode="numeric"
          maxLength={11}
          placeholder="01234567890"
          {...register("ownerPersonalId")}
        />
      </FormField>
    </FormSectionCard>
  );

  const basicSections = (
    <>
      <FormSectionCard
        title="ძირითადი ინფორმაცია"
        description="რესტორნის სახელი, აღწერა და კატეგორიები"
        icon={<Store className="size-4" />}
      >
        <div className="grid gap-6 md:grid-cols-[minmax(0,200px)_1fr] md:items-stretch">
          <ImageUploadField
            label="ლოგო"
            aspect="square"
            value={watch("logo")}
            onChange={(url) => setValue("logo", url)}
            onError={(msg) => setError("root", { message: msg })}
            className="mx-auto w-full md:mx-0"
          />
          <ImageUploadField
            label="Cover ფოტო"
            aspect="wide"
            className="min-h-[180px] w-full sm:min-h-[200px]"
            value={watch("coverImage")}
            onChange={(url) => setValue("coverImage", url)}
            onError={(msg) => setError("root", { message: msg })}
          />
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="რესტორნის სახელი"
            htmlFor="name"
            required
            error={errors.name?.message}
          >
            <Input id="name" {...register("name")} placeholder="Burger House" />
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
            className="md:col-span-2"
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
      {ownerSection}
    </>
  );

  const detailSections = (
    <>
      <FormSectionCard
        title="მისამართი"
        description="შეიყვანეთ მისამართი და აირჩიეთ მდებარეობა რუკაზე"
        icon={<MapPinned className="size-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="ქვეყანა" htmlFor="country">
            <Input id="country" {...register("country")} />
          </FormField>
          <FormField label="ქალაქი" required error={errors.city?.message}>
            <Select
              value={watch("city") || undefined}
              onValueChange={(v) => setValue("city", v, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
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
        </div>

        <input type="hidden" {...register("latitude")} />
        <input type="hidden" {...register("longitude")} />

        <Separator className="my-6" />

        <LocationMapPicker
          latitude={latitude}
          longitude={longitude}
          city={city}
          addressQuery={addressQuery}
          onChange={handleLocationChange}
          onAddressResolved={handleAddressResolved}
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
    </>
  );

  return (
    <FormProvider {...form}>
      <form
        className="space-y-6 pb-24 lg:pb-0"
        onSubmit={(e) => {
          e.preventDefault();
          void submit("save");
        }}
      >
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 space-y-6 lg:hidden">
            {basicSections}
            {settingsPanels}
            {detailSections}
          </div>

          <ScrollArea
            className="hidden min-w-0 lg:block"
            style={formScrollHeight ? { height: formScrollHeight } : undefined}
          >
            <div className="space-y-6 pr-4">
              {basicSections}
              {detailSections}
            </div>
          </ScrollArea>

          <div
            ref={sidebarRef}
            className="hidden min-w-0 space-y-6 lg:sticky lg:top-6 lg:block lg:self-start"
          >
            {settingsPanels}
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              {actionButtons}
            </div>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:p-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {actionButtons}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
