'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GalleryVerticalEnd } from "lucide-react";

import { login, type LoginActionState } from '../actions';
import { SubmitButton } from '@/components/util/submit-button';
import { AuthForm } from '@/components/auth/auth-form';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast.error('Invalid credentials!');
    } else if (state.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
              <p className="text-sm text-muted-foreground">
                Use your email and password to access your account
              </p>
            </div>
            
            <AuthForm action={handleSubmit} defaultEmail={email} className="space-y-6">
              <SubmitButton 
                isSuccessful={isSuccessful}
                className="w-full font-medium"
              >
                Sign in
              </SubmitButton>
              
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">
                  Don&apos;t have an account?
                </span>
              </div>
              
              <p className="text-center text-sm">
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            </AuthForm>
          </div>
        </div>
      </div>
      <div className="hidden lg:block bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
    </div>
  );
}
