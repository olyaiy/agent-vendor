'use client'; // Required for client-side interactions like onClick

import { signIn } from '@/lib/auth-client'; // Import the signIn function
import { Button } from '@/components/ui/button'; // Assuming a Button component exists

export default function AuthPage() {
  const handleSignIn = async () => {
    try {
      // The signIn function from better-auth handles the redirect
      await signIn(); 
    } catch (error) {
      console.error('Sign in failed:', error);
      // Optionally, display an error message to the user
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Button onClick={handleSignIn}>
        Sign in with Google
      </Button>
    </div>
  );
}