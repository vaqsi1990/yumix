import Link from "next/link";
import { KA } from "@/lib/restaurant/labels";
import { Button } from "@/components/ui/button";

export default function MissingIbanBanner() {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">{KA.settings.missingIbanTitle}</p>
      <p className="mt-1 text-amber-900/90">{KA.settings.missingIbanDesc}</p>
      <Button asChild size="sm" className="mt-3">
        <Link href="/restaurant/settings">{KA.settings.missingIbanAction}</Link>
      </Button>
    </div>
  );
}
