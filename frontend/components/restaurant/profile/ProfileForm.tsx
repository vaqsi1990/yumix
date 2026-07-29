"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import type { OwnerProfile } from "@/lib/restaurant/types";

export default function ProfileForm() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
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
      const res = await restaurantApi.account();
      setProfile(res.user);
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

    try {
      const res = await restaurantApi.updateAccount({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar,
        ...(password
          ? { currentPassword, newPassword: password }
          : {}),
      });
      setProfile(res.user);
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

  const fullName = `${profile.firstName} ${profile.lastName}`;

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
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar
              src={profile.avatar}
              alt={fullName}
              fallback={fullName}
              size="lg"
              className="size-24 text-2xl"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">{KA.profile.avatarUrl}</Label>
              <Input
                id="avatar"
                value={profile.avatar ?? ""}
                onChange={(e) =>
                  setProfile((p) =>
                    p ? { ...p, avatar: e.target.value || null } : p,
                  )
                }
              />
            </div>
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
            <CardTitle className="text-base">
              {KA.profile.changePassword}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {KA.profile.currentPassword}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{KA.profile.newPassword}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={KA.leavePasswordBlank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {KA.profile.confirmPassword}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
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
