export function formatCurrency(amount: number, _currency = "GEL"): string {
  return `₾${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ka-GE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ka-GE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "ახლახან";
  if (diffMin < 60) return `${diffMin} წთ წინ`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} სთ წინ`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} დღის წინ`;
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatMinutes(minutes: number): string {
  return `${minutes} წთ`;
}
