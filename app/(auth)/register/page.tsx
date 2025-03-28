import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
