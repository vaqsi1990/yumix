import PanelShell from "@/components/panels/PanelShell";
import { serverApiFetch } from "@/lib/session";

type RestaurantProduct = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category: { name: string };
};

export default async function RestaurantProductsPage() {
  let products: RestaurantProduct[] = [];

  try {
    const data = await serverApiFetch<{ products: RestaurantProduct[] }>(
      "/restaurant/products",
    );
    products = data.products;
  } catch {
    products = [];
  }

  return (
    <PanelShell title="პროდუქტები" backHref="/restaurant">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <p className="rounded-2xl bg-[#F3F4F6] px-4 py-8 text-center text-neutral-500 sm:col-span-2 lg:col-span-3">
            პროდუქტები ჯერ არ არის
          </p>
        ) : (
          products.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl bg-[#F3F4F6] px-4 py-5"
            >
              <h3 className="font-bold text-neutral-900">{product.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {product.category.name}
              </p>
              <p className="mt-2 font-semibold text-[#FF0050]">
                ₾{product.price.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {product.isAvailable ? "ხელმისაწვდომია" : "გათიშულია"}
              </p>
            </article>
          ))
        )}
      </div>
    </PanelShell>
  );
}
