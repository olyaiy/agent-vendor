"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Trash2, 
  Edit, 
  PlusCircle, 
  Loader2,
  File,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface KnowledgeItem {
  id: string;
  title: string;
  content: any;
  type: string;
  description: string | null;
  agentId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface KnowledgeEditorProps {
  knowledgeItems: KnowledgeItem[];
  agentId?: string;
  onAddItem: (item: { title: string; content: any; description?: string }) => Promise<KnowledgeItem>;
  onUpdateItem: (item: { id: string; title?: string; content?: any; description?: string }) => Promise<KnowledgeItem>;
  onDeleteItem: (id: string) => Promise<{ success: boolean }>;
}

export function KnowledgeEditor({ 
  knowledgeItems = [], 
  agentId, 
  onAddItem, 
  onUpdateItem, 
  onDeleteItem 
}: KnowledgeEditorProps) {
  const [items, setItems] = useState<KnowledgeItem[]>(knowledgeItems);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Form state for new or edited items
  const [formValues, setFormValues] = useState({
    title: "",
    content: "",
    description: ""
  });

  const resetForm = () => {
    setFormValues({
      title: "",
      content: "",
      description: ""
    });
  };

  // Function to calculate content stats
  const getContentStats = (content: any) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    return { words, chars };
  };

  const handleEditClick = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormValues({
      title: item.title,
      content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
      description: item.description || ""
    });
  };

  const handleFormChange = (field: keyof typeof formValues, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingItem) {
        // Update existing item
        const updated = await onUpdateItem({
          id: editingItem.id,
          title: formValues.title,
          content: formValues.content,
          description: formValues.description
        });
        
        setItems(items.map(item => 
          item.id === updated.id ? updated : item
        ));
        
        toast.success("Knowledge item updated successfully");
        setEditingItem(null);
      } else {
        // Create new item
        const newItem = await onAddItem({
          title: formValues.title,
          content: formValues.content,
          description: formValues.description
        });
        
        setItems([...items, newItem]);
        setIsAddDialogOpen(false);
        toast.success("Knowledge item added successfully");
      }
      
      resetForm();
    } catch (error) {
      toast.error("Failed to save knowledge item");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    
    try {
      await onDeleteItem(id);
      setItems(items.filter(item => item.id !== id));
      toast.success("Knowledge item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete knowledge item");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setDeleteItemId(null);
    }
  };

  // Truncate content for preview
  const truncateContent = (content: any, maxLength = 180) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Knowledge Base</h3>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
            >
              <PlusCircle className="size-4" />
              Add Knowledge Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add Knowledge Item</DialogTitle>
              <DialogDescription>
                Add information that your agent can reference during conversations.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={formValues.title} 
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="Enter a descriptive title" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  value={formValues.description} 
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Brief description of this knowledge item" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content" 
                  value={formValues.content} 
                  onChange={(e) => handleFormChange("content", e.target.value)}
                  placeholder="Enter the knowledge content" 
                  className="min-h-[150px]"
                  required
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/40 rounded-lg border">
          <p className="text-muted-foreground text-sm">
            No knowledge items have been added yet. 
            Add items to enhance your agent&apos;s capabilities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card 
              key={item.id} 
              className="group relative border overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/50"
            >
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-left w-full overflow-hidden" onClick={() => handleEditClick(item)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2 truncate">
                        <File className="size-4 flex-shrink-0 text-primary/70" />
                        {item.title}
                      </CardTitle>
                      {item.description && (
                        <CardDescription className="text-xs truncate mt-1">
                          {item.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="text-xs text-muted-foreground h-[80px] overflow-hidden">
                        <p className="whitespace-pre-wrap line-clamp-4">
                          {truncateContent(item.content)}
                        </p>
                      </div>
                    </CardContent>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Edit Knowledge Item</DialogTitle>
                    <DialogDescription>
                      Update your agent&apos;s knowledge base.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input 
                        id="edit-title" 
                        value={formValues.title} 
                        onChange={(e) => handleFormChange("title", e.target.value)}
                        placeholder="Enter a descriptive title" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description (Optional)</Label>
                      <Input 
                        id="edit-description" 
                        value={formValues.description} 
                        onChange={(e) => handleFormChange("description", e.target.value)}
                        placeholder="Brief description of this knowledge item" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-content">Content</Label>
                      <Textarea 
                        id="edit-content" 
                        value={formValues.content} 
                        onChange={(e) => handleFormChange("content", e.target.value)}
                        placeholder="Enter the knowledge content" 
                        className="min-h-[150px]"
                        required
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          resetForm();
                          setEditingItem(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Updating...
                          </>
                        ) : "Update Item"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              <CardFooter className="flex justify-between pt-0 pb-3">
                <div className="flex gap-2">
                  {(() => {
                    const stats = getContentStats(item.content);
                    return (
                      <Badge variant="outline" className="text-xs font-normal">
                        {stats.words} words
                      </Badge>
                    );
                  })()}
                  {item.updatedAt && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {formatDate(item.updatedAt)}
                    </Badge>
                  )}
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItemId(item.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this knowledge item.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        {isSubmitting && deleteItemId === item.id ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : null}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 