

import { ProductCard } from '@/components/ProductCard'
import { Product } from "@polar-sh/sdk/models/components/product.js";
import { api } from '../polar';

export default async function Page() {
  const { result } = await api.products.list({
    isArchived: false, // Only fetch products which are published
  })

  return (
    <div className="flex flex-col gap-y-32">
      <h1 className="text-5xl">Products</h1>
      <div className="grid grid-cols-4 gap-12">
        {result.items.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}