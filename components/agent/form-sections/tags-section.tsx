"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AlertCircle, Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Tag interface
interface TagInfo {
  id: string;
  name: string;
}

interface TagsSectionProps {
  tags: TagInfo[];
  selectedTags: TagInfo[];
  setSelectedTags: (tags: TagInfo[]) => void;
}

export function TagsSection({ tags, selectedTags, setSelectedTags }: TagsSectionProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  // Tag input change handler
  const handleTagInputChange = (value: string) => {
    setNewTagInput(value);
  };

  // Add a new tag (client-side only - will be created on server during form submission)
  const handleAddNewTag = () => {
    if (newTagInput.trim() === "") return;
    
    // Check if tag already exists in the list
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === newTagInput.trim().toLowerCase()
    );
    
    if (existingTag) {
      // If it exists but not selected, select it
      if (!selectedTags.some(tag => tag.id === existingTag.id)) {
        setSelectedTags([...selectedTags, existingTag]);
      }
    } else {
      // Create a temporary ID for new tag (will be replaced with actual ID on form submission)
      const tempId = `new-${Date.now()}`;
      setSelectedTags([...selectedTags, { id: tempId, name: newTagInput.trim() }]);
    }
    
    setNewTagInput("");
    setTagPopoverOpen(false);
  };

  // Remove a tag from selection
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  // Select an existing tag
  const handleSelectTag = (tag: TagInfo) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagPopoverOpen(false);
    setNewTagInput("");
  };

  return (
    <section className="space-y-12 pb-10 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Tags</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add tags to help users discover your agent
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Tag Selection
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Tags help users find your agent more easily.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag.id} 
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-1 rounded-full outline-none hover:text-red-500 focus:ring-2 focus:ring-primary"
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  type="button"
                  aria-expanded={tagPopoverOpen}
                  className="justify-between w-full bg-background"
                >
                  <span>Add tags...</span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search or create tags..." 
                    value={newTagInput}
                    onValueChange={handleTagInputChange}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {newTagInput.trim() !== "" && (
                        <CommandItem
                          value={`create-${newTagInput}`}
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={handleAddNewTag}
                        >
                          <PlusCircle className="size-4" />
                          <span>Create &quot;{newTagInput}&quot;</span>
                        </CommandItem>
                      )}
                      {newTagInput.trim() === "" && (
                        <p className="py-3 px-4 text-sm text-muted-foreground">
                          No tags found. Type to create a new tag.
                        </p>
                      )}
                    </CommandEmpty>
                    <CommandGroup heading="Available Tags">
                      {tags
                        .filter(tag => 
                          tag.name.toLowerCase().includes(newTagInput.toLowerCase()) &&
                          !selectedTags.some(selected => selected.id === tag.id)
                        )
                        .map(tag => (
                          <CommandItem
                            key={tag.id}
                            value={tag.name}
                            onSelect={() => handleSelectTag(tag)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <span>{tag.name}</span>
                            <Check
                              className={`size-4 ${
                                selectedTags.some(selected => selected.id === tag.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground mt-3">
              Tags help users find your agent. You can add existing tags or create new ones.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 