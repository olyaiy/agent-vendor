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
import { Badge } from "@/components/ui/badge"; // Use Badge for tag display
// Removed Table imports
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
        toast.error(!result.success && result.error ? result.error : 'Failed to create tag.');
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
        toast.error(!result.success && result.error ? result.error : 'Failed to update tag.');
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
        toast.error(!result.success && result.error ? result.error : 'Failed to delete tag.');
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

      {/* Tags Grid */}
      <div className="rounded-md border p-4 min-h-[100px]">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tags found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="flex items-center justify-between p-2 pl-3 text-sm"
              >
                <span className="truncate mr-2" title={tag.name}>{tag.name}</span>
                <div className="flex items-center shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => openEditDialog(tag)}
                    disabled={isPending}
                    aria-label={`Edit tag ${tag.name}`}
                  >
                    <PencilEditIcon size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive/70 hover:text-destructive"
                    onClick={() => openDeleteConfirm(tag)}
                    disabled={isPending}
                    aria-label={`Delete tag ${tag.name}`}
                  >
                    <TrashIcon size={14} />
                  </Button>
                </div>
              </Badge>
            ))}
          </div>
        )}
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