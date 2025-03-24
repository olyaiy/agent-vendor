"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormFooterProps {
  mode: "create" | "edit";
  isPending: boolean;
  primaryModelId: string;
  onCancel?: () => void;
}

export function FormFooter({
  mode,
  isPending,
  primaryModelId,
  onCancel
}: FormFooterProps) {
  const router = useRouter();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex justify-between bg-slate-50 dark:bg-slate-900/40 p-5 rounded-lg border">
      <Button 
        type="button" 
        variant="outline"
        onClick={handleCancel}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isPending || !primaryModelId}
        className="min-w-[120px]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {mode === 'create' ? 'Creating...' : 'Updating...'}
          </>
        ) : (
          <>{mode === 'create' ? 'Create' : 'Update'} Agent</>
        )}
      </Button>
    </div>
  );
} 