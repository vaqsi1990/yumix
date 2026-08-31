export function formatGel(amount: number) {
  return `\u20BE${amount.toFixed(2)}`;
}

export function formatDateTime(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ka-GE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
