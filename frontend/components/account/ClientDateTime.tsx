"use client";

import { useEffect, useState } from "react";
import { formatAccountDateTime } from "@/lib/account/constants";

/**
 * Renders a stable placeholder on the server, then formats on the client
 * to avoid hydration mismatches from locale/timezone differences.
 */
export default function ClientDateTime({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(formatAccountDateTime(value));
  }, [value]);

  return <span className={className}>{text ?? "—"}</span>;
}
