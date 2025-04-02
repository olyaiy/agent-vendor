import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Banknote, Calendar, CreditCard, Eye, Gift, Info, User } from 'lucide-react';

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
  CardFooter,
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
import { Separator } from '@/components/ui/separator';

interface UserDetailPageProps {
  params: Promise<{
    'user-id': string;
  }>;
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
  const userId = (await params)['user-id'];

  // Admin Check
  if (!session?.user?.id || session.user.id !== adminUserId) {
    redirect('/');
  }

  // Fetch User Data
  const { success, data, error } = await getUserDetailsAction(userId);

  if (!success || !data) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto bg-destructive/10 rounded-lg p-6 border border-destructive/20 text-center">
          <h1 className="text-2xl font-bold mb-4">User Details</h1>
          <p className="text-destructive mb-6">
            Error fetching user details: {error || 'User not found.'}
          </p>
          <Button asChild variant="default">
            <Link href="/admin">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Back to Admin
              </span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { user, chats, transactions, transactionCount } = data;

  return (
    <div className="container px-4 py-10 mx-auto max-w-7xl">
      <div className="mb-8 space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              Back to Admin List
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">Detailed information and activity for this user account</p>
      </div>

      <div className="grid gap-8">
        {/* User Profile Card with improved visual hierarchy */}
        <Card className="border-2 border-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/5 ring-offset-2">
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-lg">
                  {user.user_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.user_name || 'Unnamed User'}</CardTitle>
                <CardDescription className="flex items-center text-sm text-muted-foreground gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {user.email}
                </CardDescription>
                <Badge variant="outline" className="bg-primary/5 text-xs mt-1">
                  Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl bg-secondary/50 flex flex-col space-y-2">
                <div className="flex items-center text-muted-foreground text-sm mb-1 gap-1.5">
                  <Info size={14} />
                  <span>User ID</span>
                </div>
                <p className="font-mono text-xs bg-background/80 p-2 rounded overflow-auto whitespace-nowrap">{user.id}</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50 flex flex-col space-y-2">
                <div className="flex items-center text-muted-foreground text-sm mb-1 gap-1.5">
                  <Calendar size={14} />
                  <span>Joined</span>
                </div>
                <p className="font-medium">{format(new Date(user.createdAt), 'PPP')}</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50 flex flex-col space-y-2">
                <div className="flex items-center text-muted-foreground text-sm mb-1 gap-1.5">
                  <CreditCard size={14} />
                  <span>Credit Balance</span>
                </div>
                <p className="font-bold text-lg text-primary">{formatCreditsToDollars(user.credit_balance)}</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50 flex flex-col space-y-2">
                <div className="flex items-center text-muted-foreground text-sm mb-1 gap-1.5">
                  <Gift size={14} />
                  <span>Lifetime Credits</span>
                </div>
                <p className="font-medium">{formatCreditsToDollars(user.lifetime_credits)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs with improved visual styling */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 p-1 h-12">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Banknote size={16} />
              Transactions ({transactionCount})
            </TabsTrigger>
            <TabsTrigger value="chats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chats ({chats.length})
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab Content */}
          <TabsContent value="transactions" className="mt-0">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Banknote size={18} className="text-primary" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  Showing the latest {transactions.length} transactions.
                  {/* TODO: Add pagination */}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-36">Date</TableHead>
                        <TableHead className="w-28">Type</TableHead>
                        <TableHead className="text-right w-28">Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length > 0 ? (
                        transactions.map((tx) => (
                          <TableRow key={tx.id} className="hover:bg-muted/30">
                            <TableCell className="text-sm">
                              {format(new Date(tx.created_at), 'PPp')}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={tx.type === 'purchase' ? 'outline' : 'secondary'} 
                                className={tx.type === 'purchase' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400' : ''}
                              >
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              Number(tx.amount) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatCreditsToDollars(tx.amount)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm">
                              {tx.description || '-'}
                            </TableCell>
                            <TableCell>
                              {tx.messageId && 'chatInfo' in tx && tx.chatInfo && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  asChild 
                                  className="h-8 hover:bg-primary/5 flex items-center gap-1"
                                >
                                  <Link 
                                    href={`/${tx.chatInfo.agentId}/${tx.chatInfo.chatId}`}
                                  >
                                    <Eye size={14} />
                                    <span>View</span>
                                  </Link>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <CreditCard size={24} className="opacity-20" />
                              <p>No transactions found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chats Tab Content */}
          <TabsContent value="chats" className="mt-0">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Chat History
                </CardTitle>
                <CardDescription>
                  All chats initiated by this user.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[30%]">Chat Title</TableHead>
                        <TableHead className="w-[25%]">Agent</TableHead>
                        <TableHead className="w-[15%]">Visibility</TableHead>
                        <TableHead className="w-[15%]">Created</TableHead>
                        <TableHead className="w-[15%]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chats.length > 0 ? (
                        chats.map((chat) => (
                          <TableRow key={chat.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary/60" />
                                <span className="line-clamp-1">{chat.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-xs">
                                  {chat.agentDisplayName?.[0] || 'A'}
                                </div>
                                <span className="text-sm line-clamp-1">{chat.agentDisplayName || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={chat.visibility === 'public' ? 'default' : 'secondary'} className="capitalize">
                                {chat.visibility}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(chat.createdAt), 'PP')}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-primary/5 flex items-center gap-1">
                                <Link href={chat.agentId ? `/${chat.agentId}/${chat.id}` : `/chat/${chat.id}`}>
                                  <Eye size={14} />
                                  <span>View</span>
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              <p>No chats found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
