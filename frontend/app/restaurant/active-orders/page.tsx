import { redirect } from "next/navigation";

export default function ActiveOrdersRedirectPage() {
  redirect("/restaurant/orders?status=PENDING");
}
