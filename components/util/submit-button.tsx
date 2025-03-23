'use client';

import { useFormStatus } from 'react-dom';

import { LoaderIcon } from '@/components/util/icons';

import { Button } from '@/components/ui/button';

interface SubmitButtonProps extends React.ComponentProps<'button'> {
  isSuccessful: boolean;
}

export function SubmitButton({
  children,
  isSuccessful,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending || isSuccessful}
      disabled={pending || isSuccessful}
      className="relative"
      {...props}
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
