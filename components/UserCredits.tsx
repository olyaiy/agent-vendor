import { CreditCard } from "lucide-react"

interface UserCreditsProps {
  availableBalance: number // In dollars
  totalSpent: number // In dollars
}

export function UserCredits({ 
  availableBalance = 500, 
  totalSpent = 1200
}: UserCreditsProps) {
  // Format as USD currency with variable decimal places for small amounts
  const formatCurrency = (amount: number) => {
    // For very small numbers or available balance, show more decimal places
    if (amount > 0 && amount < 0.01) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 7,
        maximumFractionDigits: 9
      }).format(amount);
    }
    
    // Standard formatting for normal amounts
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format specifically for available balance with higher precision
  const formatAvailableBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount < 1 ? 7 : 2,
      maximumFractionDigits: amount < 1 ? 9 : 2
    }).format(amount);
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-black p-6">
      <div className="grid gap-6">
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
              <span className="text-3xl font-semibold tracking-tight text-white">{formatAvailableBalance(availableBalance)}</span>
              <span className="text-sm text-neutral-400">available</span>
            </div>
            <div className="h-4 w-px bg-neutral-800"></div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium text-neutral-300">{formatCurrency(totalSpent)}</span>
              <span className="text-sm text-neutral-500">spent to date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 