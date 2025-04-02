import { redirect } from 'next/navigation';
import Link from 'next/link';

import { auth } from '@/app/(auth)/auth';
import { getAllUsersAction } from './actions';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function formatCreditsToDollars(credits: string | null | undefined): string {
  const numericCredits = Number(credits);
  if (isNaN(numericCredits)) {
    return '$0.00';
  }
  return `$${numericCredits.toFixed(2)}`;
}

export default async function AdminPage() {
  const session = await auth();
  const adminUserId = process.env.ADMIN_USER_ID;

  if (!session?.user?.id || session.user.id !== adminUserId) {
    redirect('/');
  }

  // Fetch users using the server action
  const { success, data: users, error } = await getAllUsersAction();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription>Manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          {!success || !users ? (
            <div className="text-center py-10">
              <p className="text-destructive font-medium">
                Error fetching users: {error || 'Unknown error'}
              </p>
            </div>
          ) : (
            <Table>
              <TableCaption>A list of all registered users.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Credit Balance</TableHead>
                  <TableHead className="text-right">Lifetime Credits</TableHead>
                  <TableHead className="text-right">Message Count</TableHead>
                  <TableHead className="text-right">User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                    
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                        <Link
                        href={`/admin/${user.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {user.user_name || 'N/A'}
                      </Link>
                        </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/${user.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {user.email}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatCreditsToDollars(user.credit_balance)}</TableCell>
                    <TableCell className="text-right">{formatCreditsToDollars(user.lifetime_credits)}</TableCell>
                    <TableCell className="text-right">{user.messageCount ?? 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{user.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
