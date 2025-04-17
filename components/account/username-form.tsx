'use client';

import { useTransition } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUsername } from '@/app/account/actions'; // Import server action
import { Loader2 } from 'lucide-react';
// Removed unused Card imports
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Define Zod schema for username validation (matching server action)
const UsernameFormSchema = z.object({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores.' })
    .toLowerCase(), // Ensure consistency with server action storage
});

type UsernameFormValues = z.infer<typeof UsernameFormSchema>;

interface UsernameFormProps {
    currentUsername: string | null | undefined;
}

export default function UsernameForm({ currentUsername }: UsernameFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<UsernameFormValues>({
        resolver: zodResolver(UsernameFormSchema),
        defaultValues: {
            username: currentUsername ?? '',
        },
    });

    const onSubmit = (values: UsernameFormValues) => {
        // Prevent submission if username hasn't changed
        if (values.username === (currentUsername ?? '')) {
            toast.info("Username hasn't changed.");
            return;
        }

        startTransition(async () => {
            const result = await updateUsername(values.username); // Pass username string directly

            if (result.success) {
                toast.success(result.message || "Username updated successfully!");
                // Update default value to reflect the change
                form.reset({ username: values.username });
                // Note: The parent page (`page.tsx`) will re-render due to revalidatePath
                // in the action, showing the updated username outside the form.
            } else {
                 // Handle validation errors specifically
                 if (result.errors?.username) {
                    form.setError("username", {
                        type: "server",
                        message: result.errors.username.join(", "),
                    });
                    toast.error(result.message || "Validation failed. Please check the form.");
                 } else if (result.message?.includes("already taken")) {
                     form.setError("username", {
                        type: "server",
                        message: result.message,
                    });
                     toast.error(result.message);
                 }
                 else {
                    toast.error(result.message || "Failed to update username.");
                }
            }
        });
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    {...form.register("username")}
                    disabled={isPending}
                    placeholder="e.g., cool_user_123"
                />
                {form.formState.errors.username && (
                    <p className="text-sm text-red-600">{form.formState.errors.username.message}</p>
                )}
                 <p className="text-xs text-muted-foreground">
                    Must be 3-20 characters long. Letters, numbers, and underscores only.
                </p>
            </div>
             <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    "Save Username"
                )}
            </Button>
        </form>
    );
}