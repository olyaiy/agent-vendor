'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"

interface CreditErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditBalance: number
  agentSlug?: string
}

export function CreditErrorDialog({ 
  open, 
  onOpenChange, 
  creditBalance, 
  // agentSlug 
}: CreditErrorDialogProps) {
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount < 1 ? 7 : 2,
      maximumFractionDigits: amount < 1 ? 9 : 2
    }).format(Math.max(0, amount));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Insufficient Credits</DialogTitle>
          </div>
          <DialogDescription>
            You need to add more credits to continue using this service.
          </DialogDescription>
        </DialogHeader>
        
        <div className="rounded-lg bg-neutral-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Current Balance</span>
            <div className="flex items-center gap-1">
              <CreditCard className="h-4 w-4 text-neutral-500" />
              <span className="font-medium text-white">{formatBalance(creditBalance)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button asChild>
            <Link href="/credits">
              Top Up Credits
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}