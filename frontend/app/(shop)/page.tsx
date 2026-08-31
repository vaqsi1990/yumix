import Category from "@/components/Category";
import FavoriteFood from "@/components/FavoriteFood";
import NearbyRestaurants from "@/components/NearbyRestaurants";
import Offers from "@/components/Offers";
import RecommendedForYou from "@/components/RecommendedForYou";
import Rest from "@/components/Rest";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Category />
      <Rest />
      <Offers />
      <RecommendedForYou />
      <NearbyRestaurants />
      <FavoriteFood />
    </>
  );
}
