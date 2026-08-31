"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Headphones, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountPageHeader from "@/components/account/AccountPageHeader";

const FAQ = [
  {
    section: "შეკვეთები",
    items: [
      {
        q: "როგორ გავაუქმო შეკვეთა?",
        a: "შეკვეთის გაუქმება შესაძლებელია მომენტალურად შეკვეთის შემდეგ. დაუკავშირდი დახმარებას.",
      },
      {
        q: "სად ვნახო შეკვეთის სტატუსი?",
        a: "ანგარიშის განყოფილებაში „შეკვეთები“ ან აქტიური შეკვეთის ბარათიდან.",
      },
    ],
  },
  {
    section: "გადახდა",
    items: [
      {
        q: "რა გადახდის მეთოდებია?",
        a: "ნაღდი ან ბარათი. გადახდა ხდება შეკვეთისას ან მიწოდებისას.",
      },
    ],
  },
  {
    section: "მიწოდება",
    items: [
      {
        q: "რა დროში მოვა შეკვეთა?",
        a: "სავარაუდო დრო ჩანს შეკვეთის დეტალებში და აქტიურ შეკვეთაში.",
      },
    ],
  },
  {
    section: "ანგარიში",
    items: [
      {
        q: "როგორ შევცვალო პაროლი?",
        a: "პროფილის გვერდზე „პაროლის შეცვლა“ სექციაში.",
      },
    ],
  },
  {
    section: "რესტორნები",
    items: [
      {
        q: "რესტორანი დახურულია — რატომ?",
        a: "რესტორნის სამუშაო საათებზეა დამოკიდებული. სცადე სხვა რესტორანი ან მოგვიანებით.",
      },
    ],
  },
];

export default function AccountHelpClient() {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get("order");

  return (
    <div>
      <AccountPageHeader
        title="დახმარება და მხარდაჭერა"
        description="ხშირად დასმული კითხვები და კონტაქტი"
      />

      {orderRef && (
        <div className="mb-6 rounded-xl border border-[#FF0050]/20 bg-[#FF0050]/5 px-4 py-3 text-sm">
          შეკვეთა: <strong>#{orderRef}</strong> — მიუთითე ეს ნომერი მხარდაჭერასთან საუბრისას.
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <a
          href="mailto:support@yumix.ge"
          className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-5 text-center transition hover:border-[#FF0050]/30"
        >
          <Mail className="size-8 text-[#FF0050]" />
          <p className="mt-3 font-semibold">ელფოსტა</p>
          <p className="mt-1 text-sm text-neutral-500">support@yumix.ge</p>
        </a>
        <a
          href="tel:+995555000000"
          className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-5 text-center transition hover:border-[#FF0050]/30"
        >
          <Headphones className="size-8 text-[#FF0050]" />
          <p className="mt-3 font-semibold">დაგვიკავშირდი</p>
          <p className="mt-1 text-sm text-neutral-500">+995 555 00 00 00</p>
        </a>
        <Button asChild variant="outline" className="h-auto flex-col py-5">
          <Link href={`/account/help${orderRef ? `?order=${orderRef}` : ""}#report`}>
            <MessageCircle className="size-8 text-[#FF0050]" />
            <span className="mt-3 font-semibold">პრობლემის შეტყობინება</span>
          </Link>
        </Button>
      </div>

      <section id="report" className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold">FAQ</h2>
        <div className="divide-y divide-neutral-100">
          {FAQ.flatMap((group) =>
            group.items.map((item) => (
              <details key={item.q} className="group py-3">
                <summary className="cursor-pointer list-none font-medium marker:content-none">
                  <span className="mr-2 text-xs text-neutral-400">{group.section}</span>
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-neutral-600">{item.a}</p>
              </details>
            )),
          )}
        </div>
      </section>
    </div>
  );
}
