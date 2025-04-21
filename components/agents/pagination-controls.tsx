'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Assuming a Button component exists

interface PaginationControlsProps {
  totalCount: number;
  pageSize: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  totalCount,
  pageSize,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page') || '1');
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex justify-center space-x-2 mt-8">
      <Button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        variant="outline"
      >
        Previous
      </Button>
      {/* Basic page number display - can be enhanced */}
      <span className="flex items-center px-4">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!canGoNext}
        variant="outline"
      >
        Next
      </Button>
    </div>
  );
};