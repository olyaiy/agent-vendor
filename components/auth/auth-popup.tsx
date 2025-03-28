'use client';

import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubmitButton } from '@/components/util/submit-button';
import { login, type LoginActionState } from '@/app/(auth)/actions';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthPopup({ isOpen, onOpenChange, onSuccess }: AuthPopupProps) {

  const [activeTab, setActiveTab] = useState<string>('login');
  const [email, setEmail] = useState('');

  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Handle login form submission
  const handleLoginSubmit = async (formData: FormData) => {
    try {
      setEmail(formData.get('email') as string);
      
      // Create initial state object
      const initialState: LoginActionState = { status: 'idle' };
      const result = await login(initialState, formData);
      
      if (result.status === 'success') {
        setIsLoginSuccessful(true);
        toast.success('Login successful');
        if (onSuccess) onSuccess();
      } else if (result.status === 'invalid_data') {
        toast.error('Failed validating your submission!');
      } else {
        toast.error('Invalid credentials!');
      }
    } catch (error) {
      toast.error('Failed to login');
    } 
  };

  // Handle register form submission - now using rate-limited API
  const handleRegisterSubmit = async (formData: FormData) => {
    try {
      setRegisterError(null);
      setIsRegisterLoading(true);
      
      const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        userName: formData.get('userName') || undefined
      };
      
      setEmail(data.email);
      
      // Submit registration to our rate-limited API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      // Handle rate limiting
      if (response.status === 429) {
        setRateLimited(true);
        setRegisterError("Too many registration attempts. Please try again later.");
        toast.error("Rate limit exceeded. Please try again later.");
        return;
      }
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Account created successfully');
        setActiveTab('login');
      } else if (response.status === 409) {
        toast.error('Account already exists');
        setActiveTab('login');
      } else {
        setRegisterError(result.error || 'Registration failed');
        toast.error(result.error || 'Failed to create account');
      }
    } catch (error) {
      toast.error('Failed to register');
      setRegisterError("An unexpected error occurred. Please try again.");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  // Custom form submission to prevent page reload
  const handleFormSubmission = (e: FormEvent, tab: 'login' | 'register') => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    if (tab === 'login') {
      handleLoginSubmit(formData);
    } else {
      handleRegisterSubmit(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Authentication Required</DialogTitle>
          <DialogDescription className="text-center">
            Please sign in or create an account to continue
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-0">
            <form className="flex flex-col gap-4 px-4 sm:px-16" onSubmit={(e) => handleFormSubmission(e, 'login')}>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-zinc-600 font-normal dark:text-zinc-400">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  className="bg-muted text-md md:text-sm p-2 rounded-md border border-input"
                  type="email"
                  placeholder="user@acme.com"
                  autoComplete="email"
                  required
                  autoFocus
                  defaultValue={email}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-zinc-600 font-normal dark:text-zinc-400">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  className="bg-muted text-md md:text-sm p-2 rounded-md border border-input"
                  type="password"
                  required
                />
              </div>
              <SubmitButton isSuccessful={isLoginSuccessful}>Sign in</SubmitButton>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="mt-0">
            {registerError && (
              <Alert variant="destructive" className="mb-4 mx-4 sm:mx-16">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{registerError}</AlertDescription>
              </Alert>
            )}
            
            <form className="flex flex-col gap-4 px-4 sm:px-16" onSubmit={(e) => handleFormSubmission(e, 'register')}>
              <div className="flex flex-col gap-2">
                <label htmlFor="reg-email" className="text-zinc-600 font-normal dark:text-zinc-400">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  name="email"
                  className="bg-muted text-md md:text-sm p-2 rounded-md border border-input"
                  type="email"
                  placeholder="user@acme.com"
                  autoComplete="email"
                  required
                  autoFocus
                  defaultValue={email}
                  disabled={isRegisterLoading || rateLimited}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="reg-password" className="text-zinc-600 font-normal dark:text-zinc-400">
                  Password
                </label>
                <input
                  id="reg-password"
                  name="password"
                  className="bg-muted text-md md:text-sm p-2 rounded-md border border-input"
                  type="password"
                  required
                  minLength={8}
                  disabled={isRegisterLoading || rateLimited}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="userName" className="text-zinc-600 font-normal dark:text-zinc-400">
                  Username (Optional)
                </label>
                <input
                  id="userName"
                  name="userName"
                  className="bg-muted text-md md:text-sm p-2 rounded-md border border-input"
                  type="text"
                  placeholder="johndoe"
                  disabled={isRegisterLoading || rateLimited}
                />
              </div>
              <SubmitButton isSuccessful={false} disabled={isRegisterLoading || rateLimited}>
                {isRegisterLoading ? "Creating account..." : "Sign up"}
              </SubmitButton>
              
              {rateLimited && (
                <p className="text-sm text-destructive text-center">
                  Too many signup attempts. Please try again later.
                </p>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}