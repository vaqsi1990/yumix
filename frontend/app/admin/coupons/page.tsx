import AdminCouponsManager, {
  type AdminCouponRow,
  type AssignableUser,
} from "@/components/admin/AdminCouponsManager";
import PanelShell from "@/components/panels/PanelShell";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  let coupons: AdminCouponRow[] = [];
  let users: AssignableUser[] = [];

  try {
    const data = await serverApiFetch<{
      coupons: AdminCouponRow[];
      users: AssignableUser[];
    }>("/admin/coupons");
    coupons = data.coupons;
    users = data.users;
  } catch {
    coupons = [];
    users = [];
  }

  return (
    <PanelShell
      title="კუპონები"
      subtitle={`სულ: ${coupons.length}`}
      backHref="/admin"
    >
      <AdminCouponsManager coupons={coupons} users={users} />
    </PanelShell>
  );
}
