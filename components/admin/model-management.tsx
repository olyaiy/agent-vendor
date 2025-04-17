'use client';

import React, { useState, useTransition, useRef, useEffect, useMemo } from 'react'; // Added useMemo
import {
  createModelAction,
  updateModelAction,
  deleteModelAction,
} from '@/db/actions/agent-actions';
// Import ActionResult type
import type { ActionResult } from '@/db/actions/agent-actions';
import type { Model } from '@/db/schema/agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Added for description
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Use Table components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription, // Added for clarity
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
// Removed SearchIcon import
import { LoaderIcon, PlusIcon, PencilEditIcon, TrashIcon } from '@/components/utils/icons';

interface ModelManagementProps {
  initialModels: Model[];
}

export default function ModelManagement({ initialModels }: ModelManagementProps) {
  const [models, setModels] = useState<Model[]>(initialModels);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  // State for Create/Edit Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null); // null for create, Model object for edit
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');

  // State for Delete Confirmation
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) {
      return models; // Return all models if search is empty
    }
    return models.filter(model =>
      model.model.toLowerCase().includes(lowerCaseSearchTerm) ||
      model.description?.toLowerCase().includes(lowerCaseSearchTerm) // Also search description
    );
  }, [models, searchTerm]);

  // Effect to reset form when dialog closes or editingModel changes
  useEffect(() => {
    if (isDialogOpen) {
      setModelName(editingModel?.model || '');
      setModelDescription(editingModel?.description || '');
      // Focus the name input when dialog opens for editing or creating
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      // Reset form when dialog closes
      setEditingModel(null);
      setModelName('');
      setModelDescription('');
    }
  }, [isDialogOpen, editingModel]);


  const openDialog = (model: Model | null = null) => {
    setEditingModel(model); // Set the model to edit, or null to create
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = () => {
    const trimmedName = modelName.trim();
    const trimmedDescription = modelDescription.trim() || null; // Store empty description as null

    if (!trimmedName) {
      toast.error('Model name cannot be empty.');
      return;
    }

    startTransition(async () => {
      try {
        if (editingModel) {
          // --- Update existing model ---
          const dataToUpdate: { model?: string; description?: string | null } = {};
          if (trimmedName !== editingModel.model) dataToUpdate.model = trimmedName;
          if (trimmedDescription !== editingModel.description) dataToUpdate.description = trimmedDescription;

          if (Object.keys(dataToUpdate).length === 0) {
             toast.info("No changes detected.");
             setIsDialogOpen(false);
             return;
          }

          const result = await updateModelAction(editingModel.id, dataToUpdate);
          if (result.success) { // Type guard: result is { success: true; data: Model }
            setModels((prevModels) =>
              prevModels.map((m) => (m.id === editingModel.id ? result.data : m)).sort((a, b) => a.model.localeCompare(b.model))
            );
            toast.success(`Model "${result.data.model}" updated.`);
            setIsDialogOpen(false);
          } else { // Type guard: result is { success: false; error: string; ... }
            toast.error(result.error || 'Failed to update model.');
          }
        } else {
          // --- Create new model ---
          const result = await createModelAction({ model: trimmedName, description: trimmedDescription });
          if (result.success) { // Type guard: result is { success: true; data: Model }
            setModels((prevModels) => [...prevModels, result.data].sort((a, b) => a.model.localeCompare(b.model)));
            toast.success(`Model "${result.data.model}" created.`);
            setIsDialogOpen(false);
          } else { // Type guard: result is { success: false; error: string; ... }
            toast.error(result.error || 'Failed to create model.');
          }
        }
      } catch (error) {
         console.error("Error submitting model:", error);
         toast.error(`An unexpected error occurred while ${editingModel ? 'updating' : 'creating'} the model.`);
      }
    });
  };

  const openDeleteConfirm = (model: Model) => {
    setModelToDelete(model);
  };

  const handleDeleteModel = () => {
    if (!modelToDelete) return;

    startTransition(async () => {
      const result: ActionResult<void> = await deleteModelAction(modelToDelete.id);
      if (result.success) {
        setModels((prevModels) => prevModels.filter((m) => m.id !== modelToDelete.id));
        setModelToDelete(null);
        toast.success(`Model "${modelToDelete.model}" deleted.`);
      } else {
        toast.error(result.error || 'Failed to delete model.');
        setModelToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Search and Create Button */}
      <div className="flex justify-between items-center space-x-4">
         {/* Search Input */}
         <div className="relative flex-grow max-w-xs">
             <Input
               type="search"
               placeholder="Search models..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-3"
             />
         </div>
         {/* Create Model Button */}
         <Button onClick={() => openDialog(null)} disabled={isPending}>
           <PlusIcon size={16} className="mr-2 h-4 w-4" />
           Create Model
         </Button>
      </div>


      {/* Models Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  {searchTerm ? 'No models match your search.' : 'No models found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.model}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-xs" title={model.description ?? ''}>
                    {model.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openDialog(model)}
                      disabled={isPending}
                      aria-label={`Edit model ${model.model}`}
                    >
                      <PencilEditIcon size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive"
                      onClick={() => openDeleteConfirm(model)}
                      disabled={isPending}
                      aria-label={`Delete model ${model.model}`}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Model Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? 'Edit Model' : 'Create New Model'}</DialogTitle>
            <DialogDescription>
                {editingModel ? `Update the details for the "${editingModel.model}" model.` : 'Enter the details for the new model.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                 <label htmlFor="model-name" className="text-right">Name</label>
                 <Input
                   id="model-name"
                   ref={nameInputRef}
                   value={modelName}
                   onChange={(e) => setModelName(e.target.value)}
                   placeholder="e.g., gpt-4o"
                   className="col-span-3"
                   disabled={isPending}
                 />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
                 <label htmlFor="model-description" className="text-right">Description</label>
                 <Textarea
                   id="model-description"
                   value={modelDescription}
                   onChange={(e) => setModelDescription(e.target.value)}
                   placeholder="(Optional) Describe the model"
                   className="col-span-3"
                   rows={3}
                   disabled={isPending}
                 />
             </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleDialogSubmit} disabled={isPending || !modelName.trim()}>
              {isPending ? <span className="mr-2 h-4 w-4 inline-block animate-spin"><LoaderIcon size={16} /></span> : null}
              {editingModel ? 'Save Changes' : 'Create Model'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!modelToDelete} onOpenChange={(open) => !open && setModelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the model
              {/* Corrected: Using template literal with escaped quotes */}
              {` "${modelToDelete?.model || ''}"`}. Ensure no agents are currently using this model before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModel} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? <span className="mr-2 h-4 w-4 inline-block animate-spin"><LoaderIcon size={16} /></span> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}