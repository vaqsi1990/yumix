"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantFormView from "./RestaurantFormView";
import type { RestaurantOwnerCandidate } from "./form/OwnerUserPicker";
import type { RestaurantFormValues } from "./form-schema";
import { parseApiError } from "./utils";

type AdminCreateRestaurantPageProps = {
  users: RestaurantOwnerCandidate[];
};

export default function AdminCreateRestaurantPage({
  users,
}: AdminCreateRestaurantPageProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    data: RestaurantFormValues,
    mode: "save" | "save-and-add",
  ) {
    setSaving(true);
    setSuccessMessage("");
    setError("");

    try {
      const res = await fetch("/api/backend/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setError(await parseApiError(res, "რესტორნის შენახვა ვერ მოხერხდა"));
        return;
      }

      if (mode === "save") {
        router.push("/admin/restaurants");
        router.refresh();
        return;
      }

      setSuccessMessage(`"${data.name}" შენახულია. დაამატეთ შემდეგი რესტორანი.`);
      setFormKey((k) => k + 1);
    } catch {
      setError("რესტორნის შენახვა ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/restaurants");
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <RestaurantFormView
        key={formKey}
        users={users}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
