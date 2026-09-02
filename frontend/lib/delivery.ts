export type DeliveryEta = {
  prepMin: number;
  prepMax: number;
  travelMin: number;
  travelMax: number;
  totalMin: number;
  totalMax: number;
  prepLabel: string;
  travelLabel: string;
  totalLabel: string;
  label: string;
};

export function formatEtaTotal(eta?: DeliveryEta | null) {
  if (!eta) return null;
  return eta.label;
}

export function formatEtaBreakdown(eta?: DeliveryEta | null) {
  if (!eta) return null;
  return {
    prep: `მომზადება ${eta.prepLabel}`,
    travel: `გზაში ${eta.travelLabel}`,
    total: `სულ ${eta.totalLabel}`,
  };
}

export const ORDER_STATUS_TRACKING_LABELS: Record<string, string> = {
  PENDING: "შეკვეთა მიღებულია",
  ACCEPTED: "რესტორანმა მიიღო შეკვეთა",
  PREPARING: "რესტორანი ამზადებს შეკვეთას",
  READY: "შეკვეთა მზად არის",
  PICKED_UP: "კურიერმა აიღო შეკვეთა",
  ON_THE_WAY: "კურიერი გზაშია",
  DELIVERED: "შეკვეთა ჩაბარდა",
  CANCELLED: "შეკვეთა გაუქმდა",
};

export const ORDER_STATUS_ACTIVE_HINTS: Record<string, string> = {
  PENDING: "ველოდებით რესტორნის დადასტურებას",
  ACCEPTED: "რესტორანი მიიღო შეკვეთას",
  PREPARING: "მზადდება",
  READY: "კურიერს ელოდება",
  PICKED_UP: "კურიერმა აიღო შეკვეთა",
  ON_THE_WAY: "თქვენი შეკვეთა გზაშია",
  DELIVERED: "შეკვეთა ჩაბარდა",
};
