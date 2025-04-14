'use client';

import React, { useState, useTransition, useRef } from 'react';
import {
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from '@/db/actions/agent-actions'; // Assuming actions are correctly exported
import type { Tag } from '@/db/schema/agent'; // Import Tag type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { LoaderIcon, PlusIcon, PencilEditIcon, TrashIcon } from '@/components/utils/icons'; // Import specific icons

interface TagManagementProps {
  initialTags: Tag[];
}

export default function TagManagement({ initialTags }: TagManagementProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [updatedTagName, setUpdatedTagName] = useState('');
  const [isPending, startTransition] = useTransition();
  const newTagInputRef = useRef<HTMLInputElement>(null);

  const handleCreateTag = () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      toast.error('Tag name cannot be empty.');
      return;
    }

    startTransition(async () => {
      const result = await createTagAction({ name: trimmedName });
      if (result.success && result.data) {
        setTags((prevTags) => [...prevTags, result.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewTagName('');
        toast.success(`Tag "${result.data.name}" created successfully.`);
        newTagInputRef.current?.focus(); // Keep focus for adding more
      } else {
        toast.error(result.error || 'Failed to create tag.');
      }
    });
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setUpdatedTagName(tag.name);
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;
    const trimmedName = updatedTagName.trim();
    if (!trimmedName) {
      toast.error('Tag name cannot be empty.');
      return;
    }
    if (trimmedName === editingTag.name) {
        setEditingTag(null); // Close dialog if name hasn't changed
        return;
    }

    startTransition(async () => {
      const result = await updateTagAction(editingTag.id, { name: trimmedName });
      if (result.success && result.data) {
        setTags((prevTags) =>
          prevTags.map((t) => (t.id === editingTag.id ? result.data : t)).sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditingTag(null);
        toast.success(`Tag updated to "${result.data.name}".`);
      } else {
        toast.error(result.error || 'Failed to update tag.');
      }
    });
  };

  const openDeleteConfirm = (tag: Tag) => {
    setTagToDelete(tag);
  };

  const handleDeleteTag = () => {
    if (!tagToDelete) return;

    startTransition(async () => {
      const result = await deleteTagAction(tagToDelete.id);
      if (result.success) {
        setTags((prevTags) => prevTags.filter((t) => t.id !== tagToDelete.id));
        setTagToDelete(null);
        toast.success(`Tag "${tagToDelete.name}" deleted.`);
      } else {
        toast.error(result.error || 'Failed to delete tag.');
        setTagToDelete(null); // Close confirm dialog even on error
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Create Tag Form */}
      <div className="flex space-x-2">
        <Input
          ref={newTagInputRef}
          placeholder="New tag name"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isPending && handleCreateTag()}
          disabled={isPending}
        />
        <Button onClick={handleCreateTag} disabled={isPending || !newTagName.trim()} className="whitespace-nowrap">
          {isPending ? <span className="mr-2 h-4 w-4 inline-block animate-spin"><LoaderIcon size={16} /></span> : <PlusIcon size={16} className="mr-2 h-4 w-4" />}
          Add Tag
        </Button>
      </div>

      {/* Tags Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag Name</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No tags found.
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(tag)}
                      disabled={isPending}
                      aria-label={`Edit tag ${tag.name}`}
                    >
                      <PencilEditIcon size={16} className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDeleteConfirm(tag)}
                      disabled={isPending}
                      aria-label={`Delete tag ${tag.name}`}
                    >
                      <TrashIcon size={16} className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Tag Dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={updatedTagName}
              onChange={(e) => setUpdatedTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isPending && handleUpdateTag()}
              placeholder="Enter new tag name"
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateTag} disabled={isPending || !updatedTagName.trim() || updatedTagName.trim() === editingTag?.name}>
              {isPending ? <span className="mr-2 h-4 w-4 inline-block animate-spin"><LoaderIcon size={16} /></span> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tag
              &quot;{tagToDelete?.name}&quot; and remove it from all associated agents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? <span className="mr-2 h-4 w-4 inline-block animate-spin"><LoaderIcon size={16} /></span> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}