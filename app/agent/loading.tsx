// app/[agent-id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Loading() {
  return (
    <div className="grid grid-cols-12 min-w-0 h-full">
      {/* Main Chat Column Skeleton */}
      <div className="flex flex-col min-w-0 h-full col-span-12 md:col-span-9 overflow-y-scroll">
        {/* Skeleton Chat Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-6 w-1/4" /> {/* Title placeholder */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" /> {/* Button placeholder */}
            <Skeleton className="h-8 w-8 rounded-full" /> {/* Button placeholder */}
          </div>
        </div>

        {/* Skeleton Messages Area */}
        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
          {/* Skeleton User Message */}
          <div className="flex justify-end">
            <Skeleton className="h-16 w-3/5 rounded-lg" />
          </div>
          {/* Skeleton Assistant Message */}
          <div className="flex justify-start">
             <Skeleton className="h-24 w-3/5 rounded-lg" />
          </div>
           {/* Skeleton User Message */}
           <div className="flex justify-end">
            <Skeleton className="h-12 w-2/5 rounded-lg" />
          </div>
           {/* Skeleton Assistant Message */}
           <div className="flex justify-start">
             <Skeleton className="h-20 w-4/5 rounded-lg" />
          </div>
        </div>

        {/* Skeleton Chat Input */}
        <div className="w-full px-4 pb-4 md:pb-6 md:px-8 relative mt-auto"> {/* Added mt-auto */}
          <div className="max-w-3xl mx-auto relative bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="flex flex-col">
              <Skeleton className="h-12 w-full px-4 py-3" /> {/* Textarea placeholder */}
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                   <Skeleton className="h-8 w-8 rounded-full" /> {/* File button placeholder */}
                   <Skeleton className="h-8 w-20 rounded-full" /> {/* Search button placeholder */}
                </div>
                 <Skeleton className="h-8 w-8 rounded-full" /> {/* Send button placeholder */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Agent Details Column Skeleton (Hidden on Mobile) */}
      <div className="hidden md:block col-span-3 h-full max-h-full overflow-y-scroll sticky top-0 right-0 p-4 space-y-6 border-l">
        {/* Skeleton Agent Header */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" /> {/* Image placeholder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-3/4" /> {/* Name placeholder */}
              <Skeleton className="h-5 w-5" /> {/* Edit icon placeholder */}
            </div>
            <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
            <Skeleton className="h-4 w-5/6" /> {/* Description line 2 */}
            <Skeleton className="h-10 w-full rounded-md mt-2" /> {/* Model select placeholder */}
          </div>
          <div className="flex flex-wrap gap-1.5">
             <Skeleton className="h-5 w-16 rounded-full" /> {/* Tag placeholder */}
             <Skeleton className="h-5 w-20 rounded-full" /> {/* Tag placeholder */}
             <Skeleton className="h-5 w-12 rounded-full" /> {/* Tag placeholder */}
          </div>
          <Separator className="my-4" /> {/* Added my-4 like in original */}
        </div>

        {/* Skeleton Sections */}
        <div className="space-y-1">
           {/* Behaviour Section Placeholder */}
           <div className="flex items-center justify-between py-3 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                 <Skeleton className="h-4 w-4" />
                 <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-4" />
           </div>
           {/* Knowledge Section Placeholder */}
           <div className="flex items-center justify-between py-3 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                 <Skeleton className="h-4 w-4" />
                 <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-4" />
           </div>
           {/* Tools Section Placeholder */}
           <div className="flex items-center justify-between py-3 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                 <Skeleton className="h-4 w-4" />
                 <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-4" />
           </div>
           {/* Settings Section Placeholder */}
           <div className="flex items-center justify-between py-3 px-3 rounded-lg">
              <div className="flex items-center gap-3">
                 <Skeleton className="h-4 w-4" />
                 <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-4" />
           </div>
        </div>
      </div>
    </div>
  );
}