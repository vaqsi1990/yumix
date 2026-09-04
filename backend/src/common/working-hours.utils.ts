const DAY_NAMES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type PublicWorkingHour = {
  day: (typeof DAY_NAMES)[number];
  open: string;
  close: string;
  closed: boolean;
};

export function normalizeClock(value: string | undefined, fallback: string) {
  const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function mapRestaurantWorkingHours(
  rows: { day: number; openTime: string; closeTime: string; isClosed: boolean }[],
): PublicWorkingHour[] {
  return DAY_NAMES.map((name, idx) => {
    const row = rows.find((entry) => entry.day === idx);
    return {
      day: name,
      open: normalizeClock(row?.openTime, '10:00'),
      close: normalizeClock(row?.closeTime, '22:00'),
      closed: row?.isClosed ?? false,
    };
  });
}
