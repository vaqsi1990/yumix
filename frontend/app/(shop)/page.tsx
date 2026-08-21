import Category from "@/components/Category";
import FavoriteFood from "@/components/FavoriteFood";
import Offers from "@/components/Offers";
import RecommendedForYou from "@/components/RecommendedForYou";
import Rest from "@/components/Rest";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Category />
      <Rest />
      <FavoriteFood />
      <Offers />
      <RecommendedForYou />
    </>
  );
}
