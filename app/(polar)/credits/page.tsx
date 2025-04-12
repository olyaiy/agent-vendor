import { ProductCard } from '@/components/ProductCard'
import { Product } from "@polar-sh/sdk/models/components/product.js";
import { api } from '../polar';
import { UserCredits } from '@/components/UserCredits';
import { Sparkles } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserCredits } from '@/db/repository/transaction-repository';
import { redirect } from 'next/navigation';

export default async function Page() {
  // Get user session
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Fetch user credits from database
  const userCreditsData = await getUserCredits(session.user.id);
  
  // Convert string amounts to numbers for the component
  const availableBalance = userCreditsData ? parseFloat(userCreditsData.creditBalance) : 0;
  const lifetimeCredits = userCreditsData ? parseFloat(userCreditsData.lifetimeCredits) : 0;
  const totalSpent = Math.max(0, lifetimeCredits - availableBalance);

  const { result } = await api.products.list({
    isArchived: false, // Only fetch products which are published
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-12">
        {/* User Credits Section */}
        <section>
          <UserCredits 
            availableBalance={availableBalance}
            totalSpent={totalSpent}
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