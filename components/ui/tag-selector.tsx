"use client"

import React, { useState, useEffect } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TagSelectorProps<T> {
  availableTags: T[]
  selectedTags: T[]
  onChange: (tags: T[]) => void
  getValue: (tag: T) => string
  getLabel: (tag: T) => string
  createTag?: (inputValue: string) => T
  className?: string
}

export function TagSelector<T>({
  availableTags,
  selectedTags,
  onChange,
  getValue,
  getLabel,
  createTag,
  className,
}: TagSelectorProps<T>) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  // Filter tags based on search query and exclude already selected tags
  const filteredTags = availableTags.filter(tag => {
    // Always exclude already selected tags
    if (selectedTags.some(selected => getValue(selected) === getValue(tag))) {
      return false
    }
    
    // If there's any input, filter by it
    if (inputValue.trim()) {
      return getLabel(tag).toLowerCase().includes(inputValue.toLowerCase())
    }
    
    // If no input, show all unselected tags
    return true
  })

  const handleSelect = (value: string) => {
    const existingTag = availableTags.find((tag) => getValue(tag) === value)
    if (existingTag) {
      onChange([...selectedTags, existingTag])
      setOpen(false)
    } else if (createTag) {
      // Handle new tag creation
      const newTag = createTag(value)
      onChange([...selectedTags, newTag])
    }
    setInputValue("")
  }

  const handleRemove = (value: string) => {
    onChange(selectedTags.filter((tag) => getValue(tag) !== value))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex flex-wrap gap-[2px] mt-1 py-[2px] pl-[2px] pr-3 h-auto w-full text-left items-center justify-start min-h-9",
            className,
            selectedTags.length > 0 && "hover:bg-background"
          )}
        >
          {selectedTags.length > 0 ? (
            selectedTags.map((tag) => (
              <span
                key={getValue(tag)}
                className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-sm break-words"
              >
                {getLabel(tag)}
                <button
                  type="button"
                  className="cursor-pointer hover:bg-red-400/40 p-0.5 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(getValue(tag))
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">Select tags...</span>
          )}
          <span className="flex-grow" />
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search tags..."
            value={inputValue}
            onValueChange={setInputValue}
            className="border-none focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() !== "" ? (
                createTag ? (
                  <CommandItem
                    value={inputValue}
                    onSelect={() => handleSelect(inputValue)}
                    className="cursor-pointer"
                  >
                    Create "{inputValue}"
                  </CommandItem>
                ) : (
                  <p className="py-3 px-4 text-sm text-muted-foreground">
                    No matching tags found.
                  </p>
                )
              ) : (
                <p className="py-3 px-4 text-sm text-muted-foreground">
                  No tags available.
                </p>
              )}
            </CommandEmpty>
            {filteredTags.length > 0 && (
              <CommandGroup heading="Tags">
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={getValue(tag)}
                    value={getValue(tag)}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.some(
                          (selected) => getValue(selected) === getValue(tag),
                        )
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {getLabel(tag)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
