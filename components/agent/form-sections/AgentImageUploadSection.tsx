"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { InfoIcon } from "@/components/icons/info-icon";

interface AgentImageUploadSectionProps {
  imageUrl: string | null;
  isUploading: boolean;
  isDeletingImage: boolean;
  handleUpload: (file: File) => Promise<void>;
  handleDeleteImage: () => Promise<void>;
}

export default function AgentImageUploadSection({
  imageUrl,
  isUploading,
  isDeletingImage,
  handleUpload,
  handleDeleteImage,
}: AgentImageUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setErrorMessage(null);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (!file.type.startsWith("image/")) {
          setErrorMessage("Please upload an image file");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage("Image size should be less than 5MB");
          return;
        }
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorMessage(null);
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage("Image size should be less than 5MB");
          return;
        }
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleAreaClick = useCallback(() => {
    if (!isUploading && !imageUrl && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading, imageUrl]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          Agent Thumbnail
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="size-3.5 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p>A visual representation of your agent. Good images help users recognize and connect with your agent.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        {imageUrl && (
          <Badge variant="outline" className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            Image Added
          </Badge>
        )}
      </div>
      
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 px-4 py-6 transition-all duration-300 border-2 border-dashed rounded-lg outline-none focus:outline-none group",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          isUploading && "opacity-70 cursor-not-allowed border-primary/50",
          !imageUrl && !isUploading && "cursor-pointer hover:bg-muted/50",
          errorMessage && "border-red-500/70 bg-red-500/10"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleAreaClick}
      >
        {imageUrl ? (
          <div className="relative size-full overflow-hidden rounded-md bg-muted/20 group">
            <Image
              src={imageUrl}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              alt="Agent image"
              className="object-cover transition-opacity"
              priority
            />
            
            {/* Delete overlay that appears on hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-2.5 p-3">
              <Button 
                variant="destructive" 
                size="sm"
                className="flex items-center justify-center gap-1.5 w-20 h-9 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage();
                }}
                disabled={isDeletingImage || isUploading}
              >
                {isDeletingImage ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Deleting</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm"
                className="flex items-center justify-center gap-1.5 w-20 h-9 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                disabled={isUploading || isDeletingImage}
              >
                <Camera className="size-3.5" />
                <span>Update</span>
              </Button>
            </div>
            
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="size-8 animate-spin text-white" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {isUploading ? (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Uploading image...</p>
                  <p className="text-xs text-muted-foreground/70">This may take a moment</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-muted p-5 group-hover:bg-primary/10 transition-colors">
                  <ImageIcon className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drag & drop image or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG or WebP, max 5MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                  disabled={isUploading}
                />
              </>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <span className="i-lucide-alert-circle size-3" />
          {errorMessage}
        </p>
      )}

      {imageUrl && !isUploading && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Drag & drop a new image to replace the current one
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <InfoIcon className="size-3.5" />
        Images help users recognize and connect with your agent
      </p>
    </div>
  );
} 