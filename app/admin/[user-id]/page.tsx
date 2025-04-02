import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

import { auth } from '@/app/(auth)/auth';
import { getUserDetailsAction } from '@/app/admin/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserDetailPageProps {
  params: {
    'user-id': string;
  };
}

// Define the formatter locally or move it to a shared util file later
function formatCreditsToDollars(credits: string | null | undefined): string {
  const numericCredits = Number(credits);
  if (isNaN(numericCredits)) {
    return '$0.00';
  }
  return `$${numericCredits.toFixed(2)}`;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await auth();
  const adminUserId = process.env.ADMIN_USER_ID;
  const userId = params['user-id'];

  // Admin Check
  if (!session?.user?.id || session.user.id !== adminUserId) {
    redirect('/');
  }

  // Fetch User Data
  const { success, data, error } = await getUserDetailsAction(userId);

  if (!success || !data) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">User Details</h1>
        <p className="text-red-500">
          Error fetching user details: {error || 'User not found.'}
        </p>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>
    );
  }

  const { user, chats, transactions, transactionCount } = data;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Admin List</Link>
        </Button>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            {/* Placeholder for user avatar if available */}
            <AvatarFallback>{user.user_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.user_name || 'Unnamed User'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">User ID</p>
            <p className="font-mono">{user.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Joined</p>
            <p>{format(new Date(user.createdAt), 'PPP')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Credit Balance</p>
            <p className="font-semibold">{formatCreditsToDollars(user.credit_balance)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lifetime Credits</p>
            <p>{formatCreditsToDollars(user.lifetime_credits)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Chats and Transactions */}
      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions ({transactionCount})</TabsTrigger>
          <TabsTrigger value="chats">Chats ({chats.length})</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Showing the latest {transactions.length} transactions.
                {/* TODO: Add pagination */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {format(new Date(tx.created_at), 'PPp')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.type}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCreditsToDollars(tx.amount)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell>
                          {tx.messageId && 'chatInfo' in tx && tx.chatInfo && (
                            <Link 
                              href={`/${tx.chatInfo.agentId}/${tx.chatInfo.chatId}`} 
                              className="text-blue-600 hover:underline text-xs"
                            >
                              View Chat
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chats Tab */}
        <TabsContent value="chats">
          <Card>
            <CardHeader>
              <CardTitle>Chat History</CardTitle>
              <CardDescription>
                All chats initiated by this user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chat Title</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chats.length > 0 ? (
                    chats.map((chat) => (
                      <TableRow key={chat.id}>
                        <TableCell className="font-medium">{chat.title}</TableCell>
                        <TableCell>{chat.agentDisplayName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={chat.visibility === 'public' ? 'default' : 'secondary'}>
                            {chat.visibility}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(chat.createdAt), 'PP')}
                        </TableCell>
                        <TableCell>
                          <Button variant="link" size="sm" asChild>
                            <Link href={chat.agentId ? `/${chat.agentId}/${chat.id}` : `/chat/${chat.id}`}>
                              View Chat
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No chats found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
