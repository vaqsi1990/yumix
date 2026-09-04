const DAY_NAMES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const WEEKDAY_MAP: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export const DEFAULT_TIMEZONE = 'Asia/Tbilisi';

export type PublicWorkingHour = {
  day: (typeof DAY_NAMES)[number];
  open: string;
  close: string;
  closed: boolean;
};

export type WorkingHourRow = {
  day: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export function normalizeClock(value: string | undefined, fallback: string) {
  const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function mapRestaurantWorkingHours(
  rows: WorkingHourRow[],
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

function clockToMinutes(value: string): number {
  const normalized = normalizeClock(value, '00:00');
  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getZonedTimeParts(
  date: Date,
  timeZone = DEFAULT_TIMEZONE,
): { dayIndex: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? '0',
  );

  return {
    dayIndex: WEEKDAY_MAP[weekday] ?? 0,
    minutes: hour * 60 + minute,
  };
}

export function isWithinWorkingHours(
  hours: PublicWorkingHour[],
  now = new Date(),
  timeZone = DEFAULT_TIMEZONE,
): boolean {
  if (hours.length === 0) return true;

  const { dayIndex, minutes } = getZonedTimeParts(now, timeZone);
  const today = hours.find((entry) => DAY_NAMES[dayIndex] === entry.day);

  if (!today || today.closed) return false;

  const openMinutes = clockToMinutes(today.open);
  const closeMinutes = clockToMinutes(today.close);

  if (openMinutes === closeMinutes) return false;

  if (closeMinutes > openMinutes) {
    return minutes >= openMinutes && minutes < closeMinutes;
  }

  return minutes >= openMinutes || minutes < closeMinutes;
}

export function isRestaurantAcceptingOrdersNow(input: {
  isOpen: boolean;
  workingHours?: PublicWorkingHour[] | WorkingHourRow[];
  now?: Date;
  timeZone?: string;
}): boolean {
  if (!input.isOpen) return false;

  const rows = input.workingHours ?? [];
  if (rows.length === 0) return true;

  const hours =
    'open' in (rows[0] ?? {})
      ? (rows as PublicWorkingHour[])
      : mapRestaurantWorkingHours(rows as WorkingHourRow[]);

  return isWithinWorkingHours(hours, input.now, input.timeZone);
}

export function resolvePublicRestaurantIsOpen(restaurant: {
  isOpen: boolean;
  workingHours?: WorkingHourRow[];
}): boolean {
  return isRestaurantAcceptingOrdersNow({
    isOpen: restaurant.isOpen,
    workingHours: restaurant.workingHours ?? [],
  });
}
