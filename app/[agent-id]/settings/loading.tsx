// app/[agent-id]/settings/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Loading() {
  return (
    <div className="container py-8 px-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-1/3 mb-2" /> {/* Title */}
        {/* No subtitle needed for settings page */}
      </div>

      {/* Form Skeleton */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-12 pb-10 pt-8">
          {/* Agent Profile Section Skeleton */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column (Image/Avatar) */}
            <div className="md:col-span-4 space-y-4">
              <div className="pb-2 border-b">
                <Skeleton className="h-6 w-1/2 mb-1" /> {/* Section Title */}
                <Skeleton className="h-4 w-3/4" /> {/* Section Description */}
              </div>
              <div className="space-y-3">
                 {/* Tabs Skeleton */}
                 <Skeleton className="h-9 w-full rounded-md" />
                 {/* Image/Avatar Placeholder Skeleton */}
                 <Skeleton className="aspect-square w-full rounded-lg" />
                 {/* Buttons Skeleton */}
                 <Skeleton className="h-7 w-full rounded-md" />
              </div>
            </div>
            {/* Right Column (Name, Tags, Desc, Visibility) */}
            <div className="md:col-span-8 space-y-6">
              {/* Name Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" /> {/* Label */}
                <Skeleton className="h-11 w-full rounded-md" /> {/* Input */}
              </div>
              {/* Tags Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/5" /> {/* Label */}
                <Skeleton className="h-10 w-full rounded-md" /> {/* MultiSelect */}
              </div>
              {/* Description Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" /> {/* Label */}
                <Skeleton className="h-24 w-full rounded-md" /> {/* Textarea */}
              </div>
              {/* Visibility Skeleton */}
              <div className="space-y-2">
                 <Skeleton className="h-4 w-1/5 mb-2" /> {/* Label */}
                 <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-16 w-full rounded-md" />
                    <Skeleton className="h-16 w-full rounded-md" />
                    <Skeleton className="h-16 w-full rounded-md" />
                 </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Intelligence Section Skeleton */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
             <div className="md:col-span-4">
                <Skeleton className="h-6 w-3/4 mb-1" /> {/* Section Title */}
                <Skeleton className="h-4 w-full" /> {/* Section Description */}
             </div>
             <div className="md:col-span-8 space-y-6">
                <div className="space-y-2">
                   <Skeleton className="h-4 w-1/4 mb-1.5" /> {/* Label */}
                   <Skeleton className="h-10 w-full rounded-md" /> {/* ModelSelect */}
                   <Skeleton className="h-4 w-3/4 mt-1" /> {/* Help text */}
                </div>
             </div>
          </section>

          <Separator />

          {/* Behavior Section Skeleton */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
             <div className="md:col-span-4">
                <Skeleton className="h-6 w-1/2 mb-1" /> {/* Section Title */}
                <Skeleton className="h-4 w-full" /> {/* Section Description */}
             </div>
             <div className="md:col-span-8 space-y-6">
                <div className="space-y-2">
                   <Skeleton className="h-4 w-1/4 mb-1.5" /> {/* Label */}
                   <Skeleton className="h-48 w-full rounded-lg" /> {/* System Prompt Textarea */}
                   <Skeleton className="h-24 w-full rounded-lg mt-4" /> {/* Tips Box */}
                </div>
             </div>
          </section>

          <Separator />

           {/* Knowledge Section Skeleton */}
           <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
             <div className="md:col-span-4">
                <Skeleton className="h-6 w-3/5 mb-1" /> {/* Section Title */}
                <Skeleton className="h-4 w-full" /> {/* Section Description */}
             </div>
             <div className="md:col-span-8 space-y-4">
                 <Skeleton className="h-10 w-full rounded-md" /> {/* Add button */}
                 <Skeleton className="h-16 w-full rounded-md" /> {/* Item 1 */}
                 <Skeleton className="h-16 w-full rounded-md" /> {/* Item 2 */}
             </div>
          </section>

        </div>

        {/* Footer Actions Skeleton */}
        <div className="flex justify-between py-5 border-t mt-8">
          <div className="flex gap-2"> {/* Group for Cancel/Chat buttons */}
             <Skeleton className="h-10 w-28 rounded-md" /> {/* Cancel Button */}
             <Skeleton className="h-10 w-40 rounded-md" /> {/* Chat Button */}
          </div>
          <Skeleton className="h-10 w-36 rounded-md" /> {/* Submit Button */}
        </div>
      </div>
    </div>
  );
}