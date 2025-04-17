import { auth } from '@/lib/auth'; // Correct: Import the initialized auth object
import { redirect } from 'next/navigation';
import { headers } from 'next/headers'; // Import headers function
import { db } from '@/db';
import { session as sessionSchema, account as accountSchema } from '@/db/schema/auth-schema';
import { userCredits as userCreditsSchema } from '@/db/schema/transactions';
import { eq } from 'drizzle-orm';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';

// Import placeholder client components (to be created later)
// import ProfileForm from '@/components/account/profile-form';
// import UsernameForm from '@/components/account/username-form';
// import SessionManager from '@/components/account/session-manager';
// import LinkedAccounts from '@/components/account/linked-accounts';
// import EmailVerification from '@/components/account/email-verification';
// import DeleteAccountButton from '@/components/account/delete-account-button';

// Define types based on schema, explicitly allowing undefined for optional fields
// and correcting banExpires type
type User = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null | undefined;
    username?: string | null | undefined;
    displayUsername?: string | null | undefined;
    isAnonymous?: boolean | null | undefined;
    role?: string | null | undefined;
    banned?: boolean | null | undefined;
    banReason?: string | null | undefined;
    banExpires?: Date | null | undefined; // Corrected: Expect Date from library
};
type DBSession = {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    impersonatedBy?: string | null | undefined;
};

// Type based on the actual return structure { session: {...}, user: {...} } | null
type AuthResult = {
    session: DBSession;
    user: User;
} | null;


export default async function AccountPage() {
    let authResult: AuthResult = null;
    try {
        // Diagnostic Attempt: Await headers() based on persistent TS error
        const readonlyHeaders = await headers(); // Get ReadonlyHeaders (awaiting based on TS error)
        const mutableHeaders = new Headers(readonlyHeaders); // Convert to standard Headers

        authResult = await auth.api.getSession({ headers: mutableHeaders });
        if (!authResult?.user) {
            throw new Error('Not authenticated');
        }
    } catch (error) {
        console.error("Authentication required or error fetching session:", error);
        redirect('/auth'); // Redirect for errors
    }

    // We've confirmed authResult and authResult.user are not null here
    const user = authResult.user;
    // const currentSession = authResult.session; // Available if needed

    // Fetch additional data
    const [activeSessions, userCredits, linkedAccounts] = await Promise.all([
        db.select({
            id: sessionSchema.id,
            ipAddress: sessionSchema.ipAddress,
            userAgent: sessionSchema.userAgent,
            createdAt: sessionSchema.createdAt,
            expiresAt: sessionSchema.expiresAt,
        }).from(sessionSchema).where(eq(sessionSchema.userId, user.id)),
        db.select({
            creditBalance: userCreditsSchema.creditBalance,
            lifetimeCredits: userCreditsSchema.lifetimeCredits,
        }).from(userCreditsSchema).where(eq(userCreditsSchema.userId, user.id)).limit(1).then(res => res[0]),
        db.select({
            id: accountSchema.id,
            providerId: accountSchema.providerId,
            createdAt: accountSchema.createdAt,
        }).from(accountSchema).where(eq(accountSchema.userId, user.id)),
    ]);

    const formatCredit = (amount: string | null | undefined) => {
        if (!amount) return '$0.00';
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) return '$0.00';
        return `$${numericAmount.toFixed(2)}`;
    };

    // Function to safely get ban expiration date string
    const getBanExpiresString = (expires: Date | null | undefined): string | null => {
        // Check if expires is a valid Date object
        if (expires instanceof Date && !isNaN(expires.getTime())) {
            try {
                return expires.toLocaleString(); // Use Date object directly
            } catch (e) {
                console.error("Error formatting ban expiration date:", e);
                return "Invalid Date";
            }
        }
        return null;
    };
    const banExpiresString = getBanExpiresString(user?.banExpires);


    return (
        <div className="container mx-auto py-10 px-4 md:px-0">
            <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Manage your public profile and personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <UserAvatar user={{ name: user.name, image: user.image ?? null }} className="h-16 w-16" />
                                <div>
                                    <p className="font-medium">{user.name ?? 'No Name Set'}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    {user.emailVerified && <Badge variant="outline" className="mt-1 text-green-600 border-green-600">Verified</Badge>}
                                    {!user.emailVerified && <Badge variant="destructive" className="mt-1">Not Verified</Badge>}
                                </div>
                                {/* Placeholder for Image Upload Button */}
                                {/* <Button variant="outline" size="sm" className="ml-auto">Change Photo</Button> */}
                            </div>
                            <Separator />
                            {/* Placeholder for ProfileForm Client Component */}
                            <div className="p-4 border rounded-md bg-muted/40">
                                <p className="text-sm text-muted-foreground mb-2">Profile Form (Client Component Placeholder)</p>
                                <p>Name: {user.name}</p>
                                <p>Display Username: {user.displayUsername ?? 'Not Set'}</p>
                            </div>
                             {/* <ProfileForm user={user} /> */}
                            <Separator />
                             {/* Placeholder for UsernameForm Client Component */}
                             <div className="p-4 border rounded-md bg-muted/40">
                                <p className="text-sm text-muted-foreground mb-2">Username Form (Client Component Placeholder)</p>
                                <p>Username: {user.username ?? 'Not Set'}</p>
                            </div>
                            {/* <UsernameForm currentUsername={user.username} /> */}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage your account security features.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Email Verification</h3>
                                {user.emailVerified ? (
                                    <p className="text-sm text-muted-foreground">Your email address is verified.</p>
                                ) : (
                                    <div className="p-4 border rounded-md bg-muted/40">
                                        <p className="text-sm text-muted-foreground mb-2">Email Verification (Client Component Placeholder)</p>
                                        <p>Your email is not verified.</p>
                                    </div>
                                    // <EmailVerification /> Placeholder
                                )}
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-medium mb-2">Linked Accounts</h3>
                                <div className="p-4 border rounded-md bg-muted/40">
                                    <p className="text-sm text-muted-foreground mb-2">Linked Accounts (Client Component Placeholder)</p>
                                    {linkedAccounts.length > 0 ? linkedAccounts.map(acc => <p key={acc.id}>Provider: {acc.providerId}</p>) : <p>No linked accounts.</p>}
                                </div>
                                {/* <LinkedAccounts accounts={linkedAccounts} /> Placeholder */}
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-medium mb-2">Active Sessions</h3>
                                 <div className="p-4 border rounded-md bg-muted/40">
                                    <p className="text-sm text-muted-foreground mb-2">Session Manager (Client Component Placeholder)</p>
                                    {activeSessions.length > 0 ? activeSessions.map(s => <p key={s.id}>Session ID: {s.id}, IP: {s.ipAddress}</p>) : <p>No active sessions found.</p>}
                                </div>
                                {/* <SessionManager sessions={activeSessions} currentSessionId={authResult?.session.id} /> Placeholder */}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing & Credits</CardTitle>
                            <CardDescription>Manage your subscription and view credits.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <h3 className="text-lg font-medium mb-2">Credits</h3>
                                <p className="text-sm">Current Balance: <span className="font-semibold">{formatCredit(userCredits?.creditBalance)}</span></p>
                                <p className="text-sm text-muted-foreground">Lifetime Credits Earned: {formatCredit(userCredits?.lifetimeCredits)}</p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-medium mb-2">Subscription</h3>
                                <p className="text-sm text-muted-foreground mb-3">Manage your subscription, view invoices, and update payment methods via the customer portal.</p>
                                <Button asChild variant="outline">
                                    <Link href="/portal" target="_blank">Open Customer Portal</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                 {/* Danger Zone Tab */}
                <TabsContent value="danger">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Manage potentially destructive account actions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <h3 className="text-lg font-medium mb-1">Delete Account</h3>
                                <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                                <div className="p-4 border rounded-md bg-muted/40">
                                    <p className="text-sm text-muted-foreground mb-2">Delete Account Button (Client Component Placeholder)</p>
                                </div>
                                {/* <DeleteAccountButton /> Placeholder */}
                            </div>
                             {/* Display Ban Status if applicable */}
                            {user.banned && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-medium mb-1 text-destructive">Account Status</h3>
                                        <Badge variant="destructive">Banned</Badge>
                                        {user.banReason && <p className="text-sm mt-1">Reason: {user.banReason}</p>}
                                        {banExpiresString && <p className="text-sm mt-1">Expires: {banExpiresString}</p>}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}