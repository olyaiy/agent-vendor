// src/components/ui/loading-spinner.tsx (Example)
export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 p-4">
        {/* You can use an actual SVG spinner here */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }
  

  