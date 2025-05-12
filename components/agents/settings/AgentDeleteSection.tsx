'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteAgentAction } from '@/db/actions/agent.actions';
import { LoaderIcon } from '@/components/utils/icons'; // Changed import

interface AgentDeleteSectionProps {
  agentId: string;
  agentName: string;
}

export default function AgentDeleteSection({ agentId, agentName }: AgentDeleteSectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    toast.loading(`Deleting agent ${agentName}...`, { id: 'delete-agent' });

    try {
      const result = await deleteAgentAction(agentId);
      if (result.success) {
        toast.success(`Agent ${agentName} deleted successfully.`, { id: 'delete-agent' });
        router.push('/'); // Redirect to homepage
        router.refresh(); // Refresh current route to reflect changes if user navigates back
      } else {
        toast.error(result.error || `Failed to delete agent ${agentName}.`, { id: 'delete-agent' });
        setIsLoading(false);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error deleting agent:", error); // Added error logging
      toast.error(`An unexpected error occurred while deleting ${agentName}.`, { id: 'delete-agent' });
      setIsLoading(false);
      setIsDialogOpen(false);
    }
    // Do not set isLoading to false here if successful, as page will redirect
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Proceed with caution. Deleting your agent is a permanent action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div>
            <h4 className="font-semibold">Delete this Agent</h4>
            <p className="text-sm text-muted-foreground">
              Once you delete this agent, there is no going back. All associated data,
              including linked tools, knowledge, and models, will be permanently removed.
            </p>
          </div>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> {/* Changed to LoaderIcon */}
                    Deleting...
                  </>
                ) : (
                  `Delete ${agentName}`
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete agent <strong>{agentName}</strong>?
                  This will permanently remove the agent and all its associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> {/* Changed to LoaderIcon */}
                      Deleting...
                    </>
                  ) : (
                    'Yes, delete agent'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}