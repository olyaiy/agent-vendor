// src/app/(polar)/confirmation/page.tsx
export default function Page({
    // We receive searchParams but don't need checkoutId for now
  }: {
    searchParams: {
      checkoutId: string
    }
  }) {
    return <div>Thank you! Your checkout is now being processed.</div>
  }