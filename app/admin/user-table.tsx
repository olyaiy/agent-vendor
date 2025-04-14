'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchUsers, type ListUsersResponse } from './admin-actions';
import { type User } from 'better-auth'; // Assuming User type is exported
import { Skeleton } from '@/components/ui/skeleton'; // For loading state


// Helper to get initials from name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

// Helper to format dates
const formatDate = (dateInput: Date | string | number | null | undefined): string => {
    if (!dateInput) return '-';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-'; // Check for invalid date
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch {
        return '-';
    }
};

// Define a type for the user data structure used in the table, including potential admin fields
// Adjust based on the actual User type from better-auth and your schema
type DisplayUser = User & {
    role?: string | null;
    banned?: boolean | null;
    // Add other relevant fields from your user schema if needed
};

interface UserTableProps {
  initialData: ListUsersResponse;
}

export default function UserTable({ initialData }: UserTableProps) {
  const [users, setUsers] = React.useState<DisplayUser[]>(initialData.users as DisplayUser[]);
  const [totalUsers, setTotalUsers] = React.useState<number>(initialData.total);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = initialData.limit || 25; // Use initial limit as fixed page size for now
  // Removed setPageSize state as it's not currently used

  // TODO: Implement functions for sorting, filtering

  const loadUsers = React.useCallback(async (page: number, limit: number) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;
      const data = await fetchUsers({ limit, offset }); // Add sorting/filtering params later
      setUsers(data.users as DisplayUser[]);
      setTotalUsers(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      // toast.error("Failed to load users. Please try again."); // Temporarily commented out
      // Optionally revert state or show persistent error
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]); // Add pageSize to dependency array

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalUsers / pageSize);
    if (currentPage < totalPages) {
      loadUsers(currentPage + 1, pageSize);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadUsers(currentPage - 1, pageSize);
    }
  };

  // TODO: Implement action handlers (ban, set role, impersonate) using server actions
  const handleBanUser = async (userId: string) => {
    // Example: Call a server action like banUserAction(userId)
    console.log(`Ban action for user ${userId} (not implemented)`);
    // toast.info(`Ban action for user ${userId} (not implemented)`); // Temporarily commented out
  };

  const handleSetRole = async (userId: string, role: string) => {
     console.log(`Set role to ${role} for user ${userId} (not implemented)`);
     // toast.info(`Set role to ${role} for user ${userId} (not implemented)`); // Temporarily commented out
  };

  const handleImpersonate = async (userId: string) => {
     console.log(`Impersonate user ${userId} (not implemented)`);
     // toast.info(`Impersonate user ${userId} (not implemented)`); // Temporarily commented out
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className="space-y-4">
       {/* TODO: Add Search/Filter inputs here */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Show skeleton loaders while loading
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <DotsHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">User Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleImpersonate(user.id)}>
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRole(user.id, user.role === 'admin' ? 'user' : 'admin')}>
                          {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={user.banned ? '' : 'text-destructive focus:text-destructive focus:bg-destructive/10'}
                          onClick={() => handleBanUser(user.id)} // TODO: Add unban logic
                        >
                          {user.banned ? 'Unban User' : 'Ban User'}
                        </DropdownMenuItem>
                        {/* Add Delete User later */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Basic Pagination Controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
         <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalUsers} users total)
         </div>
         <div className="space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1 || isLoading}
            >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || isLoading}
            >
                Next
            </Button>
         </div>
      </div>
    </div>
  );
}
