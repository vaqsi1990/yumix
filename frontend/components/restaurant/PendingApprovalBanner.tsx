import { KA } from "@/lib/restaurant/labels";

export default function PendingApprovalBanner() {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">{KA.onboarding.pendingApprovalTitle}</p>
      <p className="mt-1 text-amber-900/90">{KA.onboarding.pendingApproval}</p>
    </div>
  );
}
