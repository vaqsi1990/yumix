import { DAY_LABELS } from "@/lib/restaurant/labels";

export type PublicWorkingHour = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

const WEEK_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

function dayIndexFromDate(date = new Date()) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function dayLabel(day: string) {
  return DAY_LABELS[day] ?? day;
}

function formatDayHours(entry: PublicWorkingHour) {
  if (entry.closed) return `${dayLabel(entry.day)}: დახურულია`;
  return `${dayLabel(entry.day)}: ${entry.open}–${entry.close}`;
}

function findNextOpenDay(
  hours: PublicWorkingHour[],
  fromIndex: number,
): PublicWorkingHour | null {
  for (let offset = 1; offset <= 7; offset += 1) {
    const index = (fromIndex + offset) % 7;
    const day = WEEK_DAYS[index];
    const entry = hours.find((row) => row.day === day);
    if (entry && !entry.closed) return entry;
  }
  return null;
}

export function formatWorkingHoursSummary(hours: PublicWorkingHour[]): string {
  const openDays = hours.filter((entry) => !entry.closed);
  if (openDays.length === 0) {
    return "სამუშაო საათები არ არის მითითებული";
  }

  const sameHours = openDays.every(
    (entry) =>
      entry.open === openDays[0].open && entry.close === openDays[0].close,
  );
  if (sameHours && openDays.length === 7) {
    return `ორშაბათი–კვირა ${openDays[0].open}–${openDays[0].close}`;
  }

  return openDays.map(formatDayHours).join(", ");
}

export function formatRestaurantClosedBanner(
  hours?: PublicWorkingHour[],
): { title: string; subtitle: string } {
  if (!hours?.length) {
    return {
      title: "რესტორანი დახურულია.",
      subtitle: "შეკვეთა ამ დროს ვერ მიიღება.",
    };
  }

  const todayIndex = dayIndexFromDate();
  const todayDay = WEEK_DAYS[todayIndex];
  const today = hours.find((entry) => entry.day === todayDay);

  if (today && !today.closed) {
    return {
      title: "რესტორანი დახურულია.",
      subtitle: `დღეს სამუშაო საათები ${today.open}–${today.close}. შეკვეთა ამ დროს ვერ მიიღება.`,
    };
  }

  if (today?.closed) {
    const next = findNextOpenDay(hours, todayIndex);
    if (next) {
      return {
        title: "რესტორანი დახურულია.",
        subtitle: `დღეს არ მუშაობს. იხსნება ${dayLabel(next.day)} ${next.open}-ზე.`,
      };
    }
  }

  return {
    title: "რესტორანი დახურულია.",
    subtitle: `სამუშაო საათები: ${formatWorkingHoursSummary(hours)}. შეკვეთა ამ დროს ვერ მიიღება.`,
  };
}
