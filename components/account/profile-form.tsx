'use client';

import { useTransition } from 'react'; // Removed unused useState
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from '@/app/account/actions'; // Import server action
import { Loader2 } from 'lucide-react';

// Define the user type expected as a prop (matching the server component)
type User = {
    id: string;
    name: string;
    email: string; // Keep email for context if needed, but not editable here
    displayUsername?: string | null | undefined;
    // Add other fields if necessary for display, but keep form focused
};

// Define Zod schema for form validation
const ProfileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }),
  displayUsername: z.string().optional(), // Optional field
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

interface ProfileFormProps {
    user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileFormSchema),
        defaultValues: {
            name: user.name ?? '',
            displayUsername: user.displayUsername ?? '',
        },
    });

    const onSubmit = (values: ProfileFormValues) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('name', values.name);
            if (values.displayUsername) {
                formData.append('displayUsername', values.displayUsername);
            } else {
                 // Explicitly handle empty string if needed by backend, or omit
                 // formData.append('displayUsername', ''); // Or don't append if empty is treated as null/undefined
            }


            const result = await updateProfile(formData);

            if (result.success) {
                toast.success(result.message || "Profile updated successfully!");
                // Optionally reset form or update default values if needed after success
                // form.reset({ name: values.name, displayUsername: values.displayUsername });
            } else {
                // Handle validation errors specifically
                if (result.errors) {
                     Object.entries(result.errors).forEach(([field, errors]) => {
                        if (errors) {
                            form.setError(field as keyof ProfileFormValues, {
                                type: "server",
                                message: errors.join(", "),
                            });
                        }
                    });
                     toast.error(result.message || "Validation failed. Please check the form.");
                } else {
                    toast.error(result.message || "Failed to update profile.");
                }
            }
        });
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    {...form.register("name")}
                    disabled={isPending}
                />
                {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="displayUsername">Display Name (Optional)</Label>
                <Input
                    id="displayUsername"
                    {...form.register("displayUsername")}
                    placeholder="How you appear to others"
                    disabled={isPending}
                />
                 {form.formState.errors.displayUsername && (
                    <p className="text-sm text-red-600">{form.formState.errors.displayUsername.message}</p>
                )}
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    "Save Changes"
                )}
            </Button>
        </form>
    );
}