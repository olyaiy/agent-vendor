"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists and works as expected
import { Search } from "lucide-react"; // Using lucide-react for the icon

export function AgentSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce with 300ms delay

  useEffect(() => {
    const current = new URLSearchParams(Array.from(searchParams.entries())); // Create mutable copy

    if (debouncedSearchQuery) {
      current.set("search", debouncedSearchQuery);
    } else {
      current.delete("search");
    }

    // Only push router if the debounced query is different from the initial URL query
    // or if the query is cleared and it was present initially.
    // This prevents unnecessary pushes on initial load or if the debounced value hasn't changed.
    if (debouncedSearchQuery !== initialSearchQuery) {
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`, { scroll: false }); // Use scroll: false to prevent jumping to top
    }

  }, [debouncedSearchQuery, initialSearchQuery, pathname, router, searchParams]);

  // Update local state immediately on input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="relative mb-6"> {/* Added margin-bottom */}
      <Search className="absolute left-10 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search agents by name, description, or tag..."
        value={searchQuery}
        onChange={handleInputChange}
        className="w-full h-[75px] rounded-full overflow-hidden bg-background pl-18 pr-4 py-2 text-sm" // Adjusted padding for icon
      />
    </div>
  );
}