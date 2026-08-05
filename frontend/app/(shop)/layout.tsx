import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-[calc(var(--mobile-nav-height)+var(--safe-area-bottom))] md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
