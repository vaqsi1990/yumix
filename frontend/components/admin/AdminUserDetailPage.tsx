"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminUserDetailView, { type AdminUserDetail } from "./AdminUserDetailView";

type AdminUserDetailPageProps = {
  userId: string;
  currentUserId: string;
  initialEdit?: boolean;
  embedded?: boolean;
};

export default function AdminUserDetailPage({
  userId,
  currentUserId,
  initialEdit = false,
  embedded = false,
}: AdminUserDetailPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetail | null | undefined>(
    undefined,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const res = await fetch(`/api/backend/admin/users/${userId}`);
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string;
            error?: string;
          };
          setError(
            data.message ||
              data.error ||
              (res.status === 404
                ? "მომხმარებელი არ მოიძებნა"
                : "მომხმარებლის ჩატვირთვა ვერ მოხერხდა"),
          );
          setUser(null);
          return;
        }
        const data = (await res.json()) as { user: AdminUserDetail };
        setUser(data.user);
      } catch {
        setError("მომხმარებლის ჩატვირთვა ვერ მოხერხდა");
        setUser(null);
      }
    }
    void load();
  }, [userId]);

  useEffect(() => {
    if (embedded) return;
    if (user === null && !error) {
      router.replace("/admin/users");
    }
  }, [user, error, router, embedded]);

  if (user === undefined) {
    return (
      <p className="text-[16px] text-neutral-500 md:text-[18px]">იტვირთება...</p>
    );
  }

  if (error) {
    return <p className="text-[16px] text-[#FF0050] md:text-[18px]">{error}</p>;
  }

  if (user === null) return null;

  return (
    <AdminUserDetailView
      user={user}
      currentUserId={currentUserId}
      initialEdit={initialEdit}
      onUserUpdated={setUser}
    />
  );
}
