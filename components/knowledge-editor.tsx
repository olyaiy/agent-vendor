"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Trash2,
  // Edit, // Removed unused icon
  PlusCircle,
  Loader2,
  File,
  Check,
  Upload,
  FileUp
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Adjusted import path
import { Input } from "@/components/ui/input"; // Adjusted import path
import { Textarea } from "@/components/ui/textarea"; // Adjusted import path
import { Label } from "@/components/ui/label"; // Adjusted import path
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Ensuring correct path
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
} from "@/components/ui/alert-dialog"; // Adjusted import path
import { Badge } from "@/components/ui/badge"; // Adjusted import path
import pdfToText from "react-pdftotext";
import { Knowledge } from "@/db/schema/agent"; // Import the actual schema type

// Interface for props, using the Knowledge schema type
interface KnowledgeEditorProps {
  knowledgeItems: Knowledge[];
  agentId?: string; // Keep agentId if needed
  // Align function signatures with KnowledgeSectionProps
  onAddItem: (item: { title: string; content: string; sourceUrl?: string }) => Promise<Knowledge>;
  onUpdateItem: (item: { id: string; title?: string; content?: string; sourceUrl?: string }) => Promise<Knowledge>;
  onDeleteItem: (id: string) => Promise<{ success: boolean }>;
}

export function KnowledgeEditor({
  knowledgeItems = [],
  agentId,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: KnowledgeEditorProps) {
  const [items, setItems] = useState<Knowledge[]>(knowledgeItems);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Knowledge | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCreateMode = !agentId; // Determine if in agent creation context

  // Form state for new or edited items (simplified: no description)
  const [formValues, setFormValues] = useState({
    title: "",
    content: "",
    sourceUrl: "" // Keep track of sourceUrl for potential edits
  });

  // Update items state when knowledgeItems props change
  useEffect(() => {
    setItems(knowledgeItems);
  }, [knowledgeItems]);

  const resetForm = () => {
    setFormValues({
      title: "",
      content: "",
      sourceUrl: ""
    });
  };

  // Function to calculate content stats
  const getContentStats = (content: string | null) => {
    if (!content) return { words: 0, chars: 0 };
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0; // Handle empty strings
    const chars = text.length;
    return { words, chars };
  };

  const handleEditClick = (item: Knowledge) => {
    setEditingItem(item);
    setFormValues({
      title: item.title,
      content: item.content || "", // Handle null content
      sourceUrl: item.sourceUrl || "" // Handle null sourceUrl
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
    if (!formValues.title || !formValues.content) {
      toast.error("Title and Content are required.");
      return;
    }
    setIsSubmitting(true);

    try {
      if (editingItem) {
        // Update existing item
        const updated = await onUpdateItem({
          id: editingItem.id,
          title: formValues.title,
          content: formValues.content,
          sourceUrl: formValues.sourceUrl // Include sourceUrl if edited
        });

        setItems(items.map(item =>
          item.id === updated.id ? updated : item
        ));

        toast.success("Knowledge item updated successfully");
        setEditingItem(null); // Close edit dialog
      } else {
        // Create new item (manual entry)
        const newItem = await onAddItem({
          title: formValues.title,
          content: formValues.content,
          // sourceUrl is not set for manual entries unless specifically added
        });

        setItems([...items, newItem]);
        setIsAddDialogOpen(false); // Close add dialog
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
    setIsSubmitting(true); // Use general submitting state

    try {
      await onDeleteItem(id);
      setItems(items.filter(item => item.id !== id));
      toast.success("Knowledge item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete knowledge item");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setDeleteItemId(null); // Close confirmation dialog
    }
  };

  // Truncate content for preview
  const truncateContent = (content: string | null, maxLength = 180) => {
    if (!content) return "";
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Format date for display
  // const formatDate = (date: Date | null) => {
  //   if (!date) return '';
  //   return new Date(date).toLocaleDateString('en-US', {
  //     month: 'short',
  //     day: 'numeric',
  //     year: 'numeric'
  //   });
  // };

  // --- File Handling ---

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = async (files: File[]) => {
    const supportedFiles = files.filter(file =>
      file.type === 'text/plain' ||
      file.name.endsWith('.txt') ||
      file.type === 'application/pdf' ||
      file.name.endsWith('.pdf')
    );

    if (supportedFiles.length === 0) {
      toast.error("Please select text (.txt) or PDF (.pdf) files only");
      return;
    }

    setIsSubmitting(true); // Use general submitting state

    try {
      for (const file of supportedFiles) {
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        let content;

        try {
          if (isPdf) {
            content = await readPdfContent(file);
            toast.info(`Processing PDF: ${file.name}`);
          } else {
            content = await readFileContent(file);
          }
        } catch (readError) {
          toast.error(`Failed to read content from ${file.name}`);
          console.error(`Error reading ${file.name}:`, readError);
          continue; // Skip to the next file
        }


        const title = file.name.replace(/\.(txt|pdf)$/, '');
        const sourceUrl = file.name; // Store filename in sourceUrl

        const newItem = await onAddItem({
          title,
          content,
          sourceUrl // Pass sourceUrl
        });

        setItems(prev => [...prev, newItem]);
        toast.success(`Added "${title}" to knowledge base`);
      }
    } catch (error) {
      // Catch errors from onAddItem
      toast.error("Failed to add knowledge item from file");
      console.error("Error during file processing/adding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await processFiles(files);
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(reader.error || new Error("FileReader error"));
      reader.readAsText(file);
    });
  };

  const readPdfContent = async (file: File): Promise<string> => {
    try {
      // Use the react-pdftotext library to extract text from PDF
      const pdfText = await pdfToText(file);
      if (typeof pdfText !== 'string') {
        throw new Error("PDF text extraction did not return a string.");
      }
      return pdfText;
    } catch (error) {
      console.error("Error reading PDF:", error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Add this helper function near the top of the file
  const getStackDepth = (wordCount: number): number => {
    if (wordCount > 3000) return 3;
    if (wordCount > 1000) return 2;
    if (wordCount > 500) return 1;
    return 0;
  };

  // --- Render ---
  return (
    <div className="space-y-4">
      {/* Add Item Dialog Trigger */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={(open: boolean) => { // Added boolean type
          if (!open) resetForm(); // Reset form on close
          setIsAddDialogOpen(open);
        }}>
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
                {isCreateMode
                  ? "Add information that will be saved with your agent once it's created."
                  : "Manually add text-based information for your agent."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formValues.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>

              {/* Removed Description Field */}

              <div className="space-y-2">
                <Label htmlFor="content">Content <span className="text-red-500">*</span></Label>
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
                  {isSubmitting && !editingItem ? ( // Show loading only for add
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

      {/* Info Banner in Create Mode */}
      {isCreateMode && items.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 rounded-md p-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Knowledge items will be saved when your agent is created</p>
              <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                These items are temporarily stored and will be attached to your agent once you complete the form.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Word Count Summary */}
      {items.length > 0 && (
        <div className="bg-background rounded-xl p-4 text-sm border border-border/30 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-3.5 text-primary">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
              </svg>
            </div>
            <div className="font-medium">
              {items.reduce((total, item) => total + getContentStats(item.content).words, 0).toLocaleString()} total words in knowledge base
            </div>
          </div>
          <div className="text-xs text-muted-foreground/80 mt-2 pl-7">
            (Approximately {Math.round(items.reduce((total, item) => total + getContentStats(item.content).words, 0) * 1.4).toLocaleString()} tokens)
          </div>
        </div>
      )}

      {/* Dropzone and Item Grid */}
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl p-5 transition-all duration-300 relative ${
          isDragging
            ? "border-primary bg-primary/5 shadow-[0_0_25px_rgba(0,0,0,0.05)] dark:shadow-[0_0_25px_rgba(255,255,255,0.01)]"
            : "border-border/70 hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".txt,.pdf"
          multiple
          className="hidden"
        />

        {/* Empty State */}
        {items.length === 0 && !isSubmitting && (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-5">
            <div className="bg-primary/10 rounded-full p-4 relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-75"></div>
              <FileUp className="size-7 text-primary" />
            </div>
            <div className="max-w-xs">
              <p className="text-base font-medium">Upload knowledge files</p>
              <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">
                Drop files here or click to browse your device
              </p>
              <Button
                onClick={handleDropzoneClick}
                variant="outline"
                size="sm"
                className="mt-6 rounded-full px-6 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary transition-all duration-300"
                type="button"
              >
                <Upload className="size-3.5 mr-2" />
                Select files
              </Button>
              <div className="flex items-center justify-center mt-5 gap-2">
                <Badge variant="outline" className="text-xs py-1 px-3 rounded-full border-muted-foreground/20">
                  <File className="size-3 mr-1.5" />
                  .txt
                </Badge>
                <Badge variant="outline" className="text-xs py-1 px-3 rounded-full border-muted-foreground/20">
                  <File className="size-3 mr-1.5" />
                  .pdf
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Simplified Items Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const stats = getContentStats(item.content);
              const stackDepth = getStackDepth(stats.words);
              const pageCount = Math.max(1, Math.ceil(stats.words / 250)); // Rough estimate: ~250 words per page
              
              return (
                <div key={item.id} className="group relative cursor-pointer">
                  {/* Delete Button */}
                  <AlertDialog open={deleteItemId === item.id} onOpenChange={(open: boolean) => !open && setDeleteItemId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 size-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/80 backdrop-blur-sm z-10 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteItemId(item.id);
                        }}
                        aria-label="Delete knowledge item"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the knowledge item titled &quot;{item.title}&quot;.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteItemId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-500 hover:bg-red-600"
                          disabled={isSubmitting}
                        >
                          {isSubmitting && deleteItemId === item.id ? (
                            <Loader2 className="size-3 animate-spin mr-1" />
                          ) : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Edit Dialog */}
                  <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => {
                    if (!open) {
                      resetForm();
                      setEditingItem(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <div onClick={() => handleEditClick(item)}>
                        {/* Document Stack Effect */}
                        {stackDepth > 0 && (
                          <>
                            {/* Third paper (deepest) */}
                            {stackDepth >= 3 && (
                              <div className="absolute -bottom-1.5 -right-1.5 w-[96%] h-[96%] bg-slate-100 dark:bg-slate-100 rounded-md border border-slate-300 dark:border-slate-300 transform rotate-1"></div>
                            )}
                            {/* Second paper */}
                            {stackDepth >= 2 && (
                              <div className="absolute -bottom-1 -right-1 w-[98%] h-[97%] bg-slate-50 dark:bg-slate-50 rounded-md border border-slate-200 dark:border-slate-200 transform rotate-0.5"></div>
                            )}
                            {/* First paper (just behind main) */}
                            {stackDepth >= 1 && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-[99%] h-[98%] bg-white dark:bg-white rounded-md border border-slate-200 dark:border-slate-200"></div>
                            )}
                          </>
                        )}
                        
                        {/* Main Document */}
                        <div className="relative bg-white dark:bg-white border border-slate-300 dark:border-slate-300 p-4 rounded-md shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
                          {/* Paper-like header with lines */}
                          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"></div>
                          
                          {/* Page numbering in top right */}
                          <div className="absolute top-1.5 right-2.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                              {pageCount} page{pageCount > 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="pt-2.5">
                            {/* Document Title and Icon */}
                            <div className="flex items-center gap-2.5 mb-3">
                              <div className="bg-primary/10 rounded-full p-1.5">
                                <File className="size-3.5 text-primary" />
                              </div>
                              <h3 className="font-medium text-sm truncate flex-1 text-black dark:text-black">{item.title}</h3>
                            </div>

                            {item.sourceUrl && (
                              <p className="text-xs text-slate-600 dark:text-slate-600 truncate mb-3 flex items-center gap-1.5">
                                <Badge variant="secondary" className="text-[10px] capitalize py-0 px-1.5 rounded-full bg-slate-100 dark:bg-slate-100 text-slate-600 dark:text-slate-600 font-normal">
                                  {item.sourceUrl.split('.').pop() || 'File'}
                                </Badge>
                                <span className="truncate">{item.sourceUrl}</span>
                              </p>
                            )}
                            
                            <div className="text-xs text-slate-700 dark:text-slate-700 mt-auto line-clamp-3 leading-relaxed font-light">
                              {truncateContent(item.content)}
                            </div>
                            
                            {/* Word count and edit indicator */}
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-200 flex items-center justify-between">
                              <Badge 
                                variant="outline" 
                                className="text-[10px] font-normal py-0 px-1.5 bg-transparent border-slate-300 dark:border-slate-300 text-slate-600 dark:text-slate-600"
                              >
                                {stats.words.toLocaleString()} words
                              </Badge>
                              
                            
                            </div>
                          </div>
                          
                          {/* Line preview decoration */}
                          {/* <div className="absolute left-4 right-4 h-[1px] bg-slate-200 dark:bg-slate-200 bottom-12"></div>
                          <div className="absolute left-6 right-10 h-[1px] bg-slate-100 dark:bg-slate-100 bottom-10"></div>
                          <div className="absolute left-5 right-8 h-[1px] bg-slate-100 dark:bg-slate-100 bottom-8"></div> */}
                        </div>
                      </div>
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
                          <Label htmlFor="edit-title">Title <span className="text-red-500">*</span></Label>
                          <Input
                            id="edit-title"
                            value={formValues.title}
                            onChange={(e) => handleFormChange("title", e.target.value)}
                            placeholder="Enter a descriptive title"
                            required
                          />
                        </div>

                        {formValues.sourceUrl && (
                           <div className="space-y-2">
                             <Label htmlFor="edit-sourceUrl">Source File</Label>
                             <Input
                               id="edit-sourceUrl"
                               value={formValues.sourceUrl}
                               readOnly
                               className="bg-muted/50"
                             />
                           </div>
                         )}

                        <div className="space-y-2">
                          <Label htmlFor="edit-content">Content <span className="text-red-500">*</span></Label>
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
                            onClick={() => {
                              resetForm();
                              setEditingItem(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && editingItem?.id === item.id ? (
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
                </div>
              );
            })}

            {/* Add More Files */}
            <div 
              className="border border-dashed rounded-md flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.01)] p-8 relative overflow-hidden"
              onClick={handleDropzoneClick}
            >
              {/* Paper corner fold effect */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-white dark:bg-white rounded-bl-lg transform rotate-0 origin-top-right border-l border-b border-slate-200 dark:border-slate-200"></div>
              <div className="absolute top-0 right-0 w-10 h-10 bg-slate-50 dark:bg-slate-50 rounded-bl-sm transform rotate-0 origin-top-right"></div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-2.5 mx-auto mb-3 transition-transform group-hover:scale-110">
                  <FileUp className="size-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Add more files</p>
                <p className="text-xs text-muted-foreground mt-1.5">Click or drop files here</p>
              </div>
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-white/90 dark:bg-white/90 backdrop-blur-sm border-2 border-primary border-dashed rounded-md flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <div className="bg-primary/20 rounded-full p-3.5 mx-auto mb-3 animate-pulse">
                <Check className="size-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-primary">Release to upload</p>
            </div>
          </div>
        )}

        {/* Global Loading Indicator (for file processing) */}
        {isSubmitting && !editingItem && !deleteItemId && ( // Show only during file processing/add
          <div className="text-center py-4 mt-4">
            <Loader2 className="size-5 animate-spin mx-auto text-primary" />
            <p className="text-xs text-muted-foreground mt-2">Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
