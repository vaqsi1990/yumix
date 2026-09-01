"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Save } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ImageUploadField from "@/components/admin/restaurants/form/ImageUploadField";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import type { OwnerProfile } from "@/lib/restaurant/types";
import {
  createAddress,
  fetchAddresses,
  updateAddress,
} from "@/lib/account-api";

const LocationMapPicker = dynamic(
  () => import("@/components/maps/LocationMapPicker"),
  { ssr: false },
);

const EMPTY_ADDRESS = {
  id: null as string | null,
  title: "მთავარი",
  city: "თბილისი",
  street: "",
  building: "",
  apartment: "",
  latitude: "",
  longitude: "",
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountRes, addressRes] = await Promise.all([
        restaurantApi.account(),
        fetchAddresses(),
      ]);
      setProfile(accountRes.user);
      const current =
        addressRes.addresses.find((row) => row.isDefault) ??
        addressRes.addresses[0];
      if (current) {
        setAddress({
          id: current.id,
          title: current.title || "მთავარი",
          city: current.city || "თბილისი",
          street: current.street,
          building: current.building ?? "",
          apartment: current.apartment ?? "",
          latitude: current.latitude != null ? String(current.latitude) : "",
          longitude: current.longitude != null ? String(current.longitude) : "",
        });
      } else {
        setAddress(EMPTY_ADDRESS);
      }
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (password && password !== confirmPassword) {
      alert(KA.passwordsMismatch);
      return;
    }
    if (password && !currentPassword) {
      alert(KA.enterCurrentPassword);
      return;
    }
    const latitude = Number(address.latitude);
    const longitude = Number(address.longitude);
    if (
      !address.street.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      alert("აირჩიე მისამართი რუკაზე");
      return;
    }

    try {
      const addressPayload = {
        title: address.title || "მთავარი",
        city: address.city.trim() || "თბილისი",
        street: address.street.trim(),
        building: address.building || null,
        apartment: address.apartment || null,
        latitude,
        longitude,
        isDefault: true,
      };
      const [{ user }, addressResult] = await Promise.all([
        restaurantApi.updateAccount({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          avatar: profile.avatar,
          ...(password
            ? { currentPassword, newPassword: password }
            : {}),
        }),
        address.id
          ? updateAddress(address.id, addressPayload)
          : createAddress(addressPayload),
      ]);
      setProfile(user);
      setAddress((prev) => ({
        ...prev,
        id: addressResult.address.id,
        city: addressResult.address.city,
        street: addressResult.address.street,
      }));
      setPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(
        translateApiError(err instanceof Error ? err.message : KA.failedSave),
      );
    }
  }

  if (loading) {
    return (
      <PageHeader title={KA.profile.title} description={KA.loading} />
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? KA.failedLoad}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={KA.profile.title}
        description={KA.profile.subtitle}
      />

      <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{KA.profile.avatar}</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploadField
              label={KA.profile.avatarPhoto}
              aspect="square"
              value={profile.avatar}
              onChange={(url) =>
                setProfile((p) => (p ? { ...p, avatar: url } : p))
              }
              className="max-w-[200px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {KA.profile.personalInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{KA.profile.firstName}</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile((p) =>
                      p ? { ...p, firstName: e.target.value } : p,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{KA.profile.lastName}</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile((p) =>
                      p ? { ...p, lastName: e.target.value } : p,
                    )
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">{KA.settings.email}</Label>
              <Input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile((p) =>
                    p ? { ...p, email: e.target.value } : p,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">{KA.settings.phone}</Label>
              <Input
                id="profile-phone"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((p) =>
                    p ? { ...p, phone: e.target.value } : p,
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{KA.profile.address}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owner-city">{KA.settings.city}</Label>
                <Input
                  id="owner-city"
                  value={address.city}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-street">{KA.profile.street}</Label>
                <Input
                  id="owner-street"
                  value={address.street}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, street: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-building">{KA.profile.building}</Label>
                <Input
                  id="owner-building"
                  value={address.building}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, building: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-apt">{KA.profile.apartment}</Label>
                <Input
                  id="owner-apt"
                  value={address.apartment}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, apartment: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{KA.profile.pickOnMap}</Label>
              <p className="text-sm text-muted-foreground">
                {KA.settings.mapLocationDesc}
              </p>
              <LocationMapPicker
                city={address.city}
                latitude={address.latitude}
                longitude={address.longitude}
                addressQuery={[address.street, address.city]
                  .filter(Boolean)
                  .join(", ")}
                onChange={(lat, lng) =>
                  setAddress((a) => ({ ...a, latitude: lat, longitude: lng }))
                }
                onAddressResolved={(resolved) =>
                  setAddress((a) => ({
                    ...a,
                    street: resolved.street || a.street,
                    city: resolved.city || a.city,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {KA.profile.changePassword}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {KA.profile.currentPassword}
              </Label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{KA.profile.newPassword}</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={KA.leavePasswordBlank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {KA.profile.confirmPassword}
              </Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="size-4" />
            {saved ? KA.saved : KA.saveChanges}
          </Button>
        </div>
      </form>
    </div>
  );
}
