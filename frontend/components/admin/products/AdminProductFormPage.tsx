"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductFormView from "./ProductFormView";
import type {
  AdminCategory,
  AdminProduct,
  AdminRestaurant,
  ProductFormData,
} from "./types";

type AdminProductFormPageProps = {
  productId?: string;
};

export default function AdminProductFormPage({
  productId,
}: AdminProductFormPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<AdminProduct | null | undefined>(
    undefined,
  );
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function load() {
      setLoadError("");
      try {
        const metaRes = await fetch("/api/backend/admin/products");
        if (!metaRes.ok) throw new Error("meta");
        const meta = (await metaRes.json()) as {
          restaurants: AdminRestaurant[];
          categories: AdminCategory[];
        };
        setRestaurants(meta.restaurants);
        setCategories(meta.categories);

        if (productId) {
          const res = await fetch(`/api/backend/admin/products/${productId}`);
          if (!res.ok) {
            setProduct(null);
            return;
          }
          const data = (await res.json()) as { product: AdminProduct };
          setProduct(data.product);
        } else {
          setProduct(null);
        }
      } catch {
        setLoadError("მონაცემების ჩატვირთვა ვერ მოხერხდა");
        setProduct(null);
      }
    }

    void load();
  }, [productId]);

  useEffect(() => {
    if (product === null && productId) {
      router.replace("/admin/products");
    }
  }, [product, productId, router]);

  async function handleSave(data: ProductFormData) {
    setSaving(true);
    try {
      const res = await fetch(
        productId
          ? `/api/backend/admin/products/${productId}`
          : "/api/backend/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        return payload.error ?? "შენახვა ვერ მოხერხდა";
      }
      router.push("/admin/products");
      router.refresh();
      return null;
    } catch {
      return "შენახვა ვერ მოხერხდა";
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/products");
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  if (product === undefined) {
    return (
      <p className="text-sm text-muted-foreground">იტვირთება...</p>
    );
  }

  if (productId && product === null) {
    return null;
  }

  return (
    <ProductFormView
      product={product}
      restaurants={restaurants}
      categories={categories}
      saving={saving}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
