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
import { Tool, toolTypeEnum } from '@/db/schema/tool'; // Removed NewTool import
import { createToolAction, deleteToolAction } from '@/db/actions/tool.actions';
// import { useToast } from '@/components/ui/toast'; // Commented out: Add toast component via `npx shadcn-ui@latest add toast`

interface ToolManagementProps {
  initialTools: Tool[];
}

const toolTypes = toolTypeEnum.enumValues;

export default function ToolManagement({ initialTools }: ToolManagementProps) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  // const { toast } = useToast(); // Commented out

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDisplayName, setNewToolDisplayName] = useState('');
  const [newToolDescription, setNewToolDescription] = useState('');
  const [newToolType, setNewToolType] = useState<Tool['type']>(toolTypes[0]);

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
      // toast({ title: "Validation Error", description: "Tool Name is required.", variant: "destructive" }); // Commented out
      console.error("Validation Error: Tool Name is required.");
      alert("Tool Name is required."); // Basic fallback
      return;
    }

    // Define the type for the payload to be sent to the action.
    // This matches the expected structure of the `data` parameter in `createToolAction`,
    // which is then validated by `CreateToolSchema`.
    // Omit<typeof tools.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>
    // could also be used if NewTool was imported and used as the base for Omit.
    const toolPayload: {
      name: string;
      type: Tool['type'];
      displayName?: string;
      description?: string;
      // definition and inputSchema are omitted here, so they will be undefined
      // if not set, which is correctly handled by Zod's .optional()
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

    // The `createToolAction` expects an object that matches `Omit<NewTool, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>`.
    // Our `toolPayload` is compatible with this.
    const result = await createToolAction(toolPayload);
    if (result.success) {
      setTools([...tools, result.data]);
      // toast({ title: "Tool Created", description: `Tool "${result.data.name}" has been added.` }); // Commented out
      console.log(`Tool Created: Tool "${result.data.name}" has been added.`);
      alert(`Tool "${result.data.name}" has been added.`); // Basic fallback
      resetCreateForm();
    } else {
      // toast({ title: "Error Creating Tool", description: result.error, variant: "destructive" }); // Commented out
      console.error("Error Creating Tool:", result.error);
      alert(`Error Creating Tool: ${result.error}`); // Basic fallback
    }
  };

  const handleDeleteTool = async (toolId: string, toolName: string) => {
    if (window.confirm(`Are you sure you want to delete the tool "${toolName}"? This action cannot be undone.`)) {
      const result = await deleteToolAction(toolId);
      if (result.success) {
        setTools(tools.filter(tool => tool.id !== toolId));
        // toast({ title: "Tool Deleted", description: `Tool "${toolName}" has been removed.` }); // Commented out
        console.log(`Tool Deleted: Tool "${toolName}" has been removed.`);
        alert(`Tool "${toolName}" has been removed.`); // Basic fallback
      } else {
        // toast({ title: "Error Deleting Tool", description: result.error, variant: "destructive" }); // Commented out
        console.error("Error Deleting Tool:", result.error);
        alert(`Error Deleting Tool: ${result.error}`); // Basic fallback
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Tool Management</CardTitle>
            <CardDescription>
              View, create, and manage available tools in the system.
            </CardDescription>
          </div>
          <Button onClick={handleCreateToolToggle}>
            {showCreateForm ? 'Cancel Creation' : 'Create New Tool'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <Card className="mb-6">
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
                      onClick={() => handleDeleteTool(tool.id, tool.name)}
                    >
                      Delete
                    </Button>
                    {/* Placeholder for Edit button */}
                    {/* <Button variant="outline" size="sm" className="ml-2">Edit</Button> */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            {showCreateForm ? 'No tools yet. Fill out the form above to add one!' : 'No tools found. Click "Create New Tool" to add one.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}