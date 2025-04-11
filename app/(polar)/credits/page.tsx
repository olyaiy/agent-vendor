import { ProductCard } from '@/components/ProductCard'
import { Product } from "@polar-sh/sdk/models/components/product.js";
import { api } from '../polar';
import { UserCredits } from '@/components/UserCredits';
import { Sparkles } from 'lucide-react';

export default async function Page() {
  const { result } = await api.products.list({
    isArchived: false, // Only fetch products which are published
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-12">
        {/* User Credits Section */}
        <section>
          <UserCredits 
            availableBalance={500} 
            totalSpent={1200} 
            nextRefill={new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)} // 15 days from now
          />
        </section>

        {/* Products Section */}
        <section>
          <div className="mb-10 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-medium tracking-tight text-white">Marketplace</h2>
              <p className="text-neutral-400">Premium products available with your balance</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Featured Products
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}