import Category from "@/components/Category";
import FavoriteFood from "@/components/FavoriteFood";
import Rest from "@/components/Rest";
console.log("Home");
export default function Home() {
  return (
    <>
      <Category />
      <Rest />
      <FavoriteFood />
    </>
  );
}
