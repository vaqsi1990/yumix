"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantFormView from "./RestaurantFormView";
import type { RestaurantFormValues } from "./form-schema";

export default function AdminCreateRestaurantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    data: RestaurantFormValues,
    mode: "save" | "save-and-add",
  ) {
    setSaving(true);
    setSuccessMessage("");

    await new Promise((resolve) => setTimeout(resolve, 600));

    console.info("[mock] create restaurant", data);
    setSaving(false);

    if (mode === "save") {
      router.push("/admin/restaurants");
      router.refresh();
      return;
    }

    setSuccessMessage(`"${data.name}" შენახულია (mock). დაამატეთ შემდეგი რესტორანი.`);
    setFormKey((k) => k + 1);
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
      <RestaurantFormView
        key={formKey}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
