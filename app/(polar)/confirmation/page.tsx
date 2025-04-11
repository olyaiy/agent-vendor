// src/app/(polar)/confirmation/page.tsx

interface PageProps {
  params: Promise<Record<string, never>>;
  searchParams: Promise<{ checkoutId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  // Access searchParams when needed
  await searchParams;

  return <div>Thank you! Your checkout is now being processed.</div>
}