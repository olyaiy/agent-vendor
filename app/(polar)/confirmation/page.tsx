// src/app/(polar)/confirmation/page.tsx
import { api as polarApi } from '../polar'; // Import shared instance
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Client Components for Animations
const AnimatedSuccessContent = dynamic(() => import('@/components/confirmation/animated-success-content'), {
  ssr: true,
  loading: () => <SuccessContentSkeleton />
});

const AnimatedErrorContent = dynamic(() => import('../../../components/confirmation/animated-error-content'), {
  ssr: true,
  loading: () => <ErrorContentSkeleton />
});

interface PageProps {
  params: Promise<Record<string, string | string[] | undefined>>; // params are async in Next.js 15+
  searchParams: Promise<{ checkoutId?: string }>; // searchParams are async in Next.js 15+
}

// Fallback skeletons
function SuccessContentSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 animate-pulse">
      <div className="text-center mb-6">
        <div className="h-10 w-64 bg-muted rounded-lg mx-auto mb-2"></div>
        <div className="h-6 w-80 bg-muted rounded-lg mx-auto"></div>
      </div>
      <div className="bg-card rounded-lg p-8 border border-border/50 relative">
        <div className="h-6 w-52 bg-muted rounded-lg mb-6"></div>
        <div className="space-y-6">
          <div className="rounded-lg bg-muted/30 p-6 border border-border/50 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 w-32 bg-muted rounded-lg"></div>
                <div className="h-4 w-24 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg">
            <div className="h-6 w-full bg-muted rounded-lg"></div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full mt-8">
          <div className="h-14 w-full bg-muted rounded-lg"></div>
          <div className="h-14 w-full bg-muted rounded-lg"></div>
        </div>
      </div>
      <div className="text-center">
        <div className="h-4 w-48 bg-muted rounded-lg mx-auto"></div>
      </div>
    </div>
  );
}

function ErrorContentSkeleton() {
  return (
    <div className="max-w-xl w-full animate-pulse">
      <div className="h-10 w-64 bg-muted rounded-lg mx-auto mb-2"></div>
      <div className="h-6 w-80 bg-muted rounded-lg mx-auto mb-6"></div>
      <div className="w-full bg-card rounded-lg p-8 mb-8 border border-border/50">
        <div className="h-24 w-full bg-muted rounded-lg mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 w-full bg-muted rounded-lg"></div>
          <div className="h-12 w-full bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  // Await searchParams before accessing properties in Next.js 15+ RSC
  const resolvedSearchParams = await searchParams; 
  const { checkoutId } = resolvedSearchParams;

  if (!checkoutId) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="w-full bg-destructive/10 py-12 flex flex-col items-center">
          <div className="rounded-full bg-white/80 dark:bg-background/80 p-5 shadow-sm mb-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-destructive mb-2">Missing Information</h1>
          <p className="text-destructive/80 text-center max-w-md">
            We couldn&apos;t locate your checkout details
          </p>
        </div>
        
        <AnimatedErrorContent
          errorMessage="The checkout ID required to display your confirmation is missing. Please try again or contact our support team for assistance."
          checkoutId={null}
        />
      </div>
    );
  }

  try {
    const checkoutSession = await polarApi.checkouts.get({ id: checkoutId }); // Use shared instance

    const totalAmountPaid = checkoutSession.totalAmount;
    const currency = checkoutSession.currency.toUpperCase();
    const customerEmail = checkoutSession.customerEmail || 'your email address';

    // Calculate credits added (total amount minus 40 cents fee)
    const feeCents = 40;
    const creditsAddedCents = Math.max(0, (totalAmountPaid ?? 0) - feeCents);

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 via-background to-muted/20 dark:from-green-950/30 dark:via-background dark:to-muted/20">
        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">Payment Successful!</h1>
            <p className="text-green-700 dark:text-green-400">
              Your transaction has been processed successfully
            </p>
          </div>
          
          <AnimatedSuccessContent
            checkoutId={checkoutId}
            totalAmountPaid={totalAmountPaid}
            feeCents={feeCents}
            creditsAddedCents={creditsAddedCents}
            currency={currency}
            customerEmail={customerEmail}
          />
        </div>
      </div>
    );

  } catch (error) {
    console.error(`Failed to fetch checkout session ${checkoutId}:`, error);
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="w-full bg-destructive/10 py-12 flex flex-col items-center">
          <div className="rounded-full bg-white/80 dark:bg-background/80 p-5 shadow-sm mb-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-destructive mb-2">Error Loading Confirmation</h1>
          <p className="text-destructive/80 text-center max-w-md">
            Unable to retrieve checkout details
          </p>
        </div>
        
        <AnimatedErrorContent
          errorMessage={`There was an issue fetching the details for checkout ID: ${checkoutId}. Please check the ID or contact support if the problem persists.`}
          checkoutId={checkoutId}
        />
      </div>
    );
  }
}
