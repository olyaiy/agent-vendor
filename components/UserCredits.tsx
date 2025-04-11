import { AlertCircle, ArrowUpRight, CreditCard } from "lucide-react"
import Link from "next/link"

interface UserCreditsProps {
  availableBalance: number // In dollars
  totalSpent: number // In dollars
  nextRefill?: Date
}

export function UserCredits({ 
  availableBalance = 500, 
  totalSpent = 1200,
  nextRefill
}: UserCreditsProps) {
  // Format as USD currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-black p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-white">Account Balance</h2>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
            <p className="text-sm text-neutral-400">Your available balance for usage-based services</p>
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-white">{formatCurrency(availableBalance)}</span>
              <span className="text-sm text-neutral-400">available</span>
            </div>
            <div className="h-4 w-px bg-neutral-800"></div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium text-neutral-300">{formatCurrency(totalSpent)}</span>
              <span className="text-sm text-neutral-500">spent to date</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col justify-center rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          {nextRefill ? (
            <>
              <span className="text-sm text-neutral-400">Next automatic payment</span>
              <span className="text-lg font-medium text-white">
                {nextRefill.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-500">No upcoming payments</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col justify-center">
          <Link 
            href="/buy-credits" 
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-800 bg-emerald-900/20 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-900/30"
          >
            Add Funds
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
} 