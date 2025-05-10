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
import { Tool } from '@/db/schema/tool'; // Assuming this is the correct path for your Tool type
// import { createToolAction, deleteToolAction } from '@/db/actions/tool.actions'; // Placeholder for actions
// import { useToast } from '@/components/ui/use-toast'; // If you use toasts for notifications

interface ToolManagementProps {
  initialTools: Tool[];
}

export default function ToolManagement({ initialTools }: ToolManagementProps) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  // const { toast } = useToast(); // For displaying success/error messages

  // Placeholder for handling tool creation
  const handleCreateTool = async () => {
    // TODO: Implement tool creation logic
    // Example: Open a dialog/modal for tool details, then call createToolAction
    console.log('Create new tool clicked');
    // const result = await createToolAction({ name: 'New Tool', type: 'basetool', ... });
    // if (result.success && result.data) {
    //   setTools([...tools, result.data]);
    //   toast({ title: "Tool Created", description: "The new tool has been added." });
    // } else {
    //   toast({ title: "Error", description: result.error || "Failed to create tool.", variant: "destructive" });
    // }
  };

  // Placeholder for handling tool deletion
  const handleDeleteTool = async (toolId: string) => {
    // TODO: Implement tool deletion logic
    console.log(`Delete tool clicked: ${toolId}`);
    // const result = await deleteToolAction(toolId);
    // if (result.success) {
    //   setTools(tools.filter(tool => tool.id !== toolId));
    //   toast({ title: "Tool Deleted", description: "The tool has been removed." });
    // } else {
    //   toast({ title: "Error", description: result.error || "Failed to delete tool.", variant: "destructive" });
    // }
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
          <Button onClick={handleCreateTool}>Create New Tool</Button>
        </div>
      </CardHeader>
      <CardContent>
        {tools.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>{tool.name}</TableCell>
                  <TableCell>{tool.displayName || '-'}</TableCell>
                  <TableCell>{tool.description || '-'}</TableCell>
                  <TableCell>{tool.type}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTool(tool.id)}
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
          <p>No tools found.</p>
        )}
      </CardContent>
    </Card>
  );
}