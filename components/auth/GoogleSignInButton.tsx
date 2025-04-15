'use client';

import { useState } from 'react'; // Import useState
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react'; // Import a loading icon

// SVG component for the Google Icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48" className="mr-3">
    <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20 s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

export default function GoogleSignInButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleSignIn = async () => {
    setIsLoading(true); // Set loading true
    try {
      // The signIn function from better-auth handles the redirect
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      // Optionally, display an error message to the user
    } finally {
      setIsLoading(false); // Set loading false regardless of success/error
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleSignIn}
        variant="outline"
        size="lg"
        className="relative w-full h-12 font-medium bg-white hover:bg-white/90 text-gray-800 border-0 shadow-sm hover:shadow transition-all duration-200 overflow-hidden group"
        disabled={isLoading} // Disable button when loading
      >
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-white flex items-center justify-center border-r border-gray-100 group-hover:bg-white/90">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" /> // Show spinner when loading
          ) : (
            <GoogleIcon /> // Show Google icon when not loading
          )}
        </div>
        <span className="ml-6 group-hover:text-gray-800">
          {isLoading ? 'Signing in...' : 'Sign in with Google'} {/* Change text when loading */}
        </span>
      </Button>
    </div>
  );
}