'use client';

import { useTransition, useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { unlinkProvider } from '@/app/account/actions'; // Import placeholder server action
import { Loader2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"; // Use Card for structure
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For warnings
import { capitalize } from '@/lib/utils'; // Assuming a utility function exists

// Type for individual linked account prop
type Account = {
    id: string; // This is the account link ID, not the provider's account ID
    providerId: string; // e.g., "google"
    createdAt: Date;
};

interface LinkedAccountsProps {
    accounts: Account[];
}

export default function LinkedAccounts({ accounts }: LinkedAccountsProps) {
    const [isPending, startTransition] = useTransition();
    const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);

    const handleUnlink = (accountId: string, providerId: string) => {
        // **IMPORTANT SECURITY WARNING:**
        // Before enabling unlinking, ensure the user has another way to log in
        // (e.g., a verified email + password set up, or another OAuth provider).
        // Unlinking the only login method will lock the user out.
        // The current `unlinkProvider` action is just a placeholder.
        setPendingAccountId(accountId);
        startTransition(async () => {
            const result = await unlinkProvider(providerId);
            if (result.success) {
                toast.success(result.message || `${capitalize(providerId)} account unlinked.`);
                // Parent page revalidates and refetches
            } else {
                toast.error(result.message || `Failed to unlink ${capitalize(providerId)} account.`);
            }
            setPendingAccountId(null);
        });
    };

    if (!accounts || accounts.length === 0) {
        return <p className="text-sm text-muted-foreground">No external accounts linked.</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Linked Accounts</CardTitle>
                <CardDescription>Manage connections to third-party services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert variant="default">
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                        Ensure you have another login method (like a verified email and password, if password login is enabled) before unlinking your only sign-in provider.
                    </AlertDescription>
                </Alert>
                {accounts.map((account) => {
                    const isUnlinkingCurrent = isPending && pendingAccountId === account.id;
                    return (
                        <div key={account.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                                <p className="font-medium">{capitalize(account.providerId)}</p>
                                <p className="text-xs text-muted-foreground">
                                    Linked on: {new Date(account.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnlink(account.id, account.providerId)}
                                disabled={isPending} // Disable all while one is pending
                                // disabled={isPending || accounts.length <= 1} // Example: Prevent unlinking the last account
                            >
                                {isUnlinkingCurrent ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Unlinking...
                                    </>
                                ) : (
                                    "Unlink"
                                )}
                            </Button>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}