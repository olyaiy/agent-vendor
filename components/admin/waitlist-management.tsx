'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { LoaderIcon, TrashIcon } from '@/components/utils/icons';
import type { WaitlistEntry } from '@/db/actions/waitlist.actions';
import { deleteWaitlistEntryAction } from '@/db/actions/waitlist.actions';

interface WaitlistManagementProps {
  initialEntries: WaitlistEntry[];
}

export default function WaitlistManagement({ initialEntries }: WaitlistManagementProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>(initialEntries);
  const [searchTerm, setSearchTerm] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<WaitlistEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered entries by search term (email or name)
  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) =>
      e.email.toLowerCase().includes(term) ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  const confirmDelete = (entry: WaitlistEntry) => setEntryToDelete(entry);
  const closeDialog = () => setEntryToDelete(null);

  const handleDelete = () => {
    if (!entryToDelete) return;

    startTransition(async () => {
      const result = await deleteWaitlistEntryAction(entryToDelete.id);
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
        toast.success(`Removed ${entryToDelete.email} from wait list.`);
      } else {
        toast.error(result.error || 'Failed to delete entry.');
      }
      closeDialog();
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="max-w-xs">
        <Input
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Entries Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Referral</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[70px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm ? 'No entries match your search.' : 'No wait-list entries.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell>{`${entry.firstName} ${entry.lastName}`}</TableCell>
                  <TableCell>{entry.referralSource ?? '-'}</TableCell>
                  <TableCell>{entry.city || entry.country ? `${entry.city ?? ''}${entry.city && entry.country ? ', ' : ''}${entry.country ?? ''}` : '-'}</TableCell>
                  <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      aria-label="Delete entry"
                      onClick={() => confirmDelete(entry)}
                      disabled={isPending}
                    >
                      {isPending && entryToDelete?.id === entry.id ? (
                        <LoaderIcon size={16} className="animate-spin" />
                      ) : (
                        <TrashIcon size={16} />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Wait List?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently remove <strong>{entryToDelete?.email}</strong> from the wait list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? (<span className="mr-2 h-4 w-4 inline-block animate-spin"><LoaderIcon size={16} /></span>) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 