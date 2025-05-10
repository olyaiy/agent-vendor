"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tool, toolTypeEnum } from '@/db/schema/tool';
import { createToolAction, deleteToolAction } from '@/db/actions/tool.actions';
import { toast } from 'sonner';
import { toolRegistry } from '@/tools/registry'; // Import toolRegistry

interface ToolManagementProps {
  initialTools: Tool[];
  codebaseToolNames: string[];
}

const toolTypes = toolTypeEnum.enumValues;

export default function ToolManagement({ initialTools, codebaseToolNames }: ToolManagementProps) {
  const [tools, setTools] = useState<Tool[]>(initialTools);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDisplayName, setNewToolDisplayName] = useState('');
  const [newToolDescription, setNewToolDescription] = useState('');
  const [newToolType, setNewToolType] = useState<Tool['type']>(toolTypes[0]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<{ id: string; name: string } | null>(null);

  const resetCreateForm = () => {
    setNewToolName('');
    setNewToolDisplayName('');
    setNewToolDescription('');
    setNewToolType(toolTypes[0]);
    setShowCreateForm(false);
  };

  const handleCreateToolToggle = () => {
    if (showCreateForm) {
      resetCreateForm();
    } else {
      setShowCreateForm(true);
    }
  };

  const handleSaveNewTool = async () => {
    if (!newToolName.trim()) {
      toast.error("Validation Error", { description: "Tool Name is required." });
      return;
    }

    const toolPayload: {
      name: string;
      type: Tool['type'];
      displayName?: string;
      description?: string;
    } = {
      name: newToolName.trim(),
      type: newToolType,
    };

    const displayNameTrimmed = newToolDisplayName.trim();
    if (displayNameTrimmed) {
      toolPayload.displayName = displayNameTrimmed;
    }

    const descriptionTrimmed = newToolDescription.trim();
    if (descriptionTrimmed) {
      toolPayload.description = descriptionTrimmed;
    }

    const result = await createToolAction(toolPayload);
    if (result.success) {
      setTools([...tools, result.data]);
      toast.success("Tool Created", { description: `Tool "${result.data.name}" has been added.` });
      resetCreateForm();
    } else {
      toast.error("Error Creating Tool", { description: result.error });
    }
  };

  const openDeleteDialog = (tool: { id: string; name: string }) => {
    setToolToDelete(tool);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTool = async () => {
    if (!toolToDelete) return;

    const result = await deleteToolAction(toolToDelete.id);
    if (result.success) {
      setTools(tools.filter(tool => tool.id !== toolToDelete.id));
      toast.success("Tool Deleted", { description: `Tool "${toolToDelete.name}" has been removed.` });
    } else {
      toast.error("Error Deleting Tool", { description: result.error });
    }
    setIsDeleteDialogOpen(false);
    setToolToDelete(null);
  };

  const registeredToolNames = new Set(tools.map(tool => tool.name));
  const unregisteredCodebaseTools = codebaseToolNames.filter(
    name => !registeredToolNames.has(name)
  );

  const handlePrefillAndShowCreateForm = (toolName: string) => {
    setNewToolName(toolName);
    const toolDefinition = toolRegistry[toolName as keyof typeof toolRegistry];
    if (toolDefinition) {
      if (typeof toolDefinition.description === 'string') {
        setNewToolDescription(toolDefinition.description);
      }
    }
    setShowCreateForm(true);
    setTimeout(() => document.getElementById('newToolName')?.focus(), 0);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Registered Tools</CardTitle>
              <CardDescription>
                View, create, and manage tools registered in the database.
              </CardDescription>
            </div>
            <Button onClick={handleCreateToolToggle}>
              {showCreateForm ? 'Cancel Creation' : 'Create New Tool'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <Card className="mb-6" id="create-tool-form-card">
              <CardHeader>
                <CardTitle>Create New Tool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="newToolName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tool Name (machine-readable, unique)*</label>
                  <Input
                    id="newToolName"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    placeholder="e.g., my_calculator_tool"
                  />
                </div>
                <div>
                  <label htmlFor="newToolDisplayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name (human-readable)</label>
                  <Input
                    id="newToolDisplayName"
                    value={newToolDisplayName}
                    onChange={(e) => setNewToolDisplayName(e.target.value)}
                    placeholder="e.g., My Calculator"
                  />
                </div>
                <div>
                  <label htmlFor="newToolDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <Textarea
                    id="newToolDescription"
                    value={newToolDescription}
                    onChange={(e) => setNewToolDescription(e.target.value)}
                    placeholder="Describe what this tool does"
                  />
                </div>
                <div>
                  <label htmlFor="newToolType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tool Type*</label>
                  <Select value={newToolType} onValueChange={(value: Tool['type']) => setNewToolType(value)}>
                    <SelectTrigger id="newToolType">
                      <SelectValue placeholder="Select tool type" />
                    </SelectTrigger>
                    <SelectContent>
                      {toolTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetCreateForm}>Cancel</Button>
                  <Button onClick={handleSaveNewTool}>Save Tool</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell>{tool.displayName || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{tool.description || '-'}</TableCell>
                    <TableCell>{tool.type}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog({ id: tool.id, name: tool.name })}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {showCreateForm ? 'No tools registered in the database yet. Fill out the form above to add one!' : 'No tools registered in the database. Click "Create New Tool" to add one.'}
            </p>
          )}
        </CardContent>
      </Card>

      {unregisteredCodebaseTools.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Codebase Tools (Not Registered)</CardTitle>
            <CardDescription>
              {`These tools are defined in the codebase but not yet registered in the database.
              Click "Register This Tool" to add them.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {unregisteredCodebaseTools.map(name => (
                <li key={name} className="flex justify-between items-center p-3 border rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div>
                    <span className="text-sm font-medium">{name}</span>
                    {toolRegistry[name as keyof typeof toolRegistry]?.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {toolRegistry[name as keyof typeof toolRegistry].description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrefillAndShowCreateForm(name)}
                  >
                    Register This Tool
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {toolToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {`This action cannot be undone. This will permanently delete the tool "${toolToDelete.name}" and remove it from any agents using it.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setToolToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteTool}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
