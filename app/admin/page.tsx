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

  if (!success || !users) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-red-500">Error fetching users: {error || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard - User Management</h1>
      <Table>
        <TableCaption>A list of all registered users.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>User Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Credit Balance</TableHead>
            <TableHead className="text-right">Lifetime Credits</TableHead>
            <TableHead>User ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.user_name || 'N/A'}</TableCell>
              <TableCell>
                <Link href={`/admin/${user.id}`} className="text-blue-600 hover:underline">
                  {user.email}
                </Link>
              </TableCell>
              <TableCell className="text-right">{formatCreditsToDollars(user.credit_balance)}</TableCell>
              <TableCell className="text-right">{formatCreditsToDollars(user.lifetime_credits)}</TableCell>
              <TableCell>{user.id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
