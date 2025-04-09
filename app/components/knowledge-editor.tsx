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
  Card,
  CardContent,
  CardDescription, // Keep if needed for sourceUrl display
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"; // Adjusted import path
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
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
      {items.length > 0 && ( // Show only if there are items
        <div className="bg-muted/50 rounded-md p-3 text-sm">
          <div className="font-medium">
            {items.reduce((total, item) => total + getContentStats(item.content).words, 0).toLocaleString()} total words in knowledge base
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            (Approx. {Math.round(items.reduce((total, item) => total + getContentStats(item.content).words, 0) * 1.4).toLocaleString()} tokens)
          </div>
        </div>
      )}

      {/* Dropzone and Item Grid */}
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 transition-colors relative ${ // Added relative positioning
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-primary/5"
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
          <div className="text-center py-12 flex flex-col items-center justify-center gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <FileUp className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload knowledge files</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drop .txt or .pdf files here
              </p>
              <Button
                onClick={handleDropzoneClick}
                variant="outline"
                size="sm"
                className="mt-4"
                type="button" // Prevent form submission if nested
              >
                <Upload className="size-4 mr-2" />
                Select files
              </Button>
              <div className="flex items-center justify-center mt-3 gap-1.5">
                <Badge variant="outline" className="text-xs py-1 px-2">
                  <File className="size-3 mr-1" />
                  .txt
                </Badge>
                <Badge variant="outline" className="text-xs py-1 px-2">
                  <File className="size-3 mr-1" />
                  .pdf
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Items Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="group relative border overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/50"
              >
                {/* Delete Button & Dialog */}
                <AlertDialog open={deleteItemId === item.id} onOpenChange={(open: boolean) => !open && setDeleteItemId(null)}> {/* Added boolean type */}
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 z-10"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        setDeleteItemId(item.id);
                      }}
                      aria-label="Delete knowledge item"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the knowledge item titled "{item.title}".
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteItemId(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-500 hover:bg-red-600"
                        disabled={isSubmitting} // Disable while any submission is happening
                      >
                        {isSubmitting && deleteItemId === item.id ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : null}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Edit Dialog Trigger & Content */}
                <Dialog open={editingItem?.id === item.id} onOpenChange={(open: boolean) => { // Added boolean type
                  if (!open) {
                    resetForm();
                    setEditingItem(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    {/* Make the main card content clickable */}
                    <button
                      className="text-left w-full overflow-hidden cursor-pointer block"
                      onClick={() => handleEditClick(item)}
                      aria-label={`Edit knowledge item ${item.title}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2 truncate">
                          <File className="size-4 flex-shrink-0 text-primary/70" />
                          {item.title}
                        </CardTitle>
                        {/* Display sourceUrl if available */}
                        {item.sourceUrl && (
                          <CardDescription className="text-xs truncate mt-1">
                            Source: {item.sourceUrl}
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
                        Update your agent's knowledge base.
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

                      {/* Optional: Display/Edit sourceUrl if needed */}
                      {formValues.sourceUrl && (
                         <div className="space-y-2">
                           <Label htmlFor="edit-sourceUrl">Source File</Label>
                           <Input
                             id="edit-sourceUrl"
                             value={formValues.sourceUrl}
                             readOnly // Typically read-only after upload
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
                          variant="outline"
                          onClick={() => {
                            resetForm();
                            setEditingItem(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && editingItem?.id === item.id ? ( // Show loading only for this item's update
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

                {/* Card Footer with Stats */}
                <CardFooter className="flex flex-col items-start pt-0 pb-3 gap-1">
                  {(() => {
                    const stats = getContentStats(item.content);
                    return (
                      <Badge variant="outline" className="text-xs font-normal">
                        {stats.words.toLocaleString()} word{stats.words !== 1 ? 's' : ''}
                      </Badge>
                    );
                  })()}

                  {item.updatedAt && (
                    <Badge variant="outline" className="text-xs font-normal">
                      Updated: {formatDate(item.updatedAt)}
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))}

            {/* Add More Files Card */}
            <Card className="flex flex-col items-center justify-center p-6 cursor-pointer border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors" onClick={handleDropzoneClick}>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 mx-auto mb-2">
                  <FileUp className="size-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Add more files</p>
                <p className="text-xs text-muted-foreground mt-1">Click or drop</p>
                {/* Button removed as the whole card is clickable */}
              </div>
            </Card>
          </div>
        )}

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="bg-primary/20 rounded-full p-3 mx-auto mb-2">
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
