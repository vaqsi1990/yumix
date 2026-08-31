import type { ApiUser } from "@/lib/api";

export function getPanelHref(role: string): string | null {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "RESTAURANT_OWNER":
      return "/restaurant";
    case "COURIER":
      return "/courier";
    default:
      return null;
  }
}

export function getProfileHref(user: ApiUser | null): string {
  if (!user) return "/login";
  return getPanelHref(user.role) ?? "/account";
}

export function isProfileNavActive(
  pathname: string,
  user: ApiUser | null,
): boolean {
  if (!user) {
    return pathname === "/login" || pathname === "/reg";
  }

  const href = getProfileHref(user);
  if (href === "/account") {
    return pathname === "/account" || pathname.startsWith("/account/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
