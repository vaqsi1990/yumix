import { Suspense } from "react";
import AccountHelpClient from "@/components/account/AccountHelpClient";

export const dynamic = "force-dynamic";

export default function AccountHelpPage() {
  return (
    <Suspense fallback={<p className="text-neutral-500">იტვირთება...</p>}>
      <AccountHelpClient />
    </Suspense>
  );
}
