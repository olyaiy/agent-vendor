"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileText, Link as LinkIcon, Code, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { createKnowledgeItem, deleteKnowledgeItem } from "@/lib/db/queries";

export interface KnowledgeItem {
  id: string;
  title: string;
  content: any;
  type: string;
  description?: string;
  createdAt: Date;
}

interface KnowledgeEditorProps {
  agentId?: string;
  initialItems?: KnowledgeItem[];
  onChange?: (items: KnowledgeItem[]) => void;
}

export function KnowledgeEditor({ agentId, initialItems = [], onChange }: KnowledgeEditorProps) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("text");
  const [description, setDescription] = useState("");

  const handleAddItem = async () => {
    if (!title.trim() || !content.trim() || !agentId) return;
    
    setIsLoading(true);
    try {
      const contentJson = type === 'text' ? { text: content } : 
                           type === 'url' ? { url: content } : 
                           type === 'markdown' ? { markdown: content } : 
                           { content };
      
      const newItem = await createKnowledgeItem({
        title: title.trim(),
        content: contentJson,
        type,
        description: description.trim() || undefined,
        agentId
      });
      
      const updatedItems = [...items, newItem];
      setItems(updatedItems as KnowledgeItem[]);
      onChange?.(updatedItems as KnowledgeItem[]);
      
      // Reset form
      setTitle("");
      setContent("");
      setDescription("");
      setShowForm(false);
      
      toast.success("Knowledge item added successfully");
    } catch (error) {
      toast.error("Failed to add knowledge item");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteKnowledgeItem(id);
      
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems as KnowledgeItem[]);
      onChange?.(updatedItems as KnowledgeItem[]);
      
      toast.success("Knowledge item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete knowledge item");
      console.error(error);
    } finally {
      setIsLoading(false);
      setItemToDelete(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="size-4" />;
      case 'url':
        return <LinkIcon className="size-4" />;
      case 'markdown':
        return <Code className="size-4" />;
      default:
        return <File className="size-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1.5 px-2">
                    {getTypeIcon(item.type)}
                    {item.type === 'text' ? 'Text' : 
                     item.type === 'url' ? 'URL' : 
                     item.type === 'markdown' ? 'Markdown' : 
                     item.type}
                  </Badge>
                  <h4 className="font-medium truncate">{item.title}</h4>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {item.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setItemToDelete(item.id)}
                disabled={isLoading}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No knowledge items added yet</p>
        </div>
      )}

      {showForm ? (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <h3 className="font-medium">Add Knowledge Item</h3>
          
          <div className="grid gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {type === 'text' ? 'Content' : type === 'url' ? 'URL' : 'Markdown Content'}
              </label>
              <Textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={type === 'text' ? 'Enter content' : type === 'url' ? 'Enter URL' : 'Enter markdown content'}
                rows={4}
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddItem}
              disabled={isLoading || !title.trim() || !content.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add Item</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
          disabled={isLoading || !agentId}
        >
          <Plus className="mr-2 size-4" />
          Add Knowledge Item
        </Button>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this knowledge item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 