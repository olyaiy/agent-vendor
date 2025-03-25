import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Camera, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { InfoIcon } from "@/components/icons/info-icon";
import { deleteAgentImage } from "@/app/(agents)/actions";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { cn } from "@/lib/utils";

interface AgentImageUploaderProps {
  imageUrl: string | null;
  setImageUrl: (url: string) => void;
  agentId?: string; // Only needed for edit mode
  label?: string;
  description?: string;
  recommendedSize?: string;
  aspectRatio?: string;
  className?: string;
  imageClassName?: string;
  imageType?: 'thumbnail' | 'avatar';
}

export function AgentImageUploader({
  imageUrl,
  setImageUrl,
  agentId,
  label = "Agent Thumbnail",
  recommendedSize = "800×600px (4:3)",
  aspectRatio = "aspect-[4/3]",
  className = "",
  imageClassName = "",
  imageType = "thumbnail"
}: AgentImageUploaderProps) {
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  
  // Move the image upload logic to this component
  const {
    isUploading,
    handleUpload: uploadImage,
    resetImage
  } = useImageUpload({
    endpoint: '/api/files/upload'
  });

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const newImageUrl = await uploadImage(acceptedFiles[0]);
        if (newImageUrl) {
          setImageUrl(newImageUrl);
        }
      }
    },
    noClick: false,
    noKeyboard: false,
  });

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent's onClick handler
    
    if (!agentId || !imageUrl) return;
    
    if (confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      setIsDeletingImage(true);
      try {
        // Delete from database
        await deleteAgentImage(agentId, imageUrl, imageType);
        
        // Extract pathname from imageUrl
        // The pathname is the filename in the URL path
        const pathname = imageUrl.split('/').pop();
        
        if (pathname) {
          // Also delete from R2 storage
          const response = await fetch(`/api/files/upload?pathname=${encodeURIComponent(pathname)}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            console.error('Failed to delete image from storage:', await response.text());
            // Continue even if R2 deletion fails, as we've already deleted from DB
          }
        }
        
        resetImage();
        setImageUrl(""); // Clear the parent's imageUrl state
        toast.success("Image deleted successfully");
      } catch (error) {
        console.error('Delete image error:', error);
        toast.error('Failed to delete image. Please try again.');
      } finally {
        setIsDeletingImage(false);
      }
    }
  };

  const isAvatar = imageType === 'avatar';
  
  // Avatar size settings
  const avatarSize = isAvatar ? "max-w-[100px] max-h-[100px] w-[100px] h-[100px]" : "";
  
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            {label}
            
          </Label>
          {imageUrl && (
            <Badge variant="outline" className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
              Image Added
            </Badge>
          )}
        </div>
      )}
      
      <div 
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          isDragActive ? 'ring-2 ring-primary ring-offset-2' : 'border border-gray-200 dark:border-gray-800 hover:border-primary/50',
          "rounded-lg w-full shadow-sm",
          !isAvatar && aspectRatio,
          isAvatar && "rounded-full",
          isAvatar && !imageUrl && "p-2 bg-secondary/50",
          avatarSize
        )}
      >
        {isUploading ? (
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm",
            isAvatar && "rounded-full"
          )}>
            <Loader2 className={cn(isAvatar ? "size-5" : "size-6", "text-primary animate-spin")} />
            <span className={cn("mt-1 text-gray-600 dark:text-gray-300", isAvatar ? "text-[10px]" : "text-xs")}>Uploading...</span>
          </div>
        ) : imageUrl ? (
          <div className={cn("group absolute inset-0 size-full", isAvatar && "rounded-full overflow-hidden")}>
            <Image 
              src={imageUrl} 
              alt={isAvatar ? "Agent avatar" : "Agent thumbnail"} 
              fill
              className={cn("object-cover", imageClassName, isAvatar && "rounded-full")}
              sizes={isAvatar ? "100px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
              priority
              quality={90}
            />
            <div className={cn(
              "absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100",
              isAvatar && "rounded-full"
            )}>
              <div className="flex flex-col gap-2">
                <Button 
                  type="button" 
                  variant="secondary"
                  size={isAvatar ? "icon" : "sm"}
                  className={cn("shadow-lg", isAvatar && "size-7")}
                  onClick={open}
                >
                  <Camera className={cn(isAvatar ? "size-3" : "size-4 mr-2")} />
                  {!isAvatar && "Change"}
                </Button>
                
                <Button
                  type="button"
                  size={isAvatar ? "icon" : "sm"}
                  variant="destructive"
                  className={cn("shadow-lg", isAvatar && "size-7")}
                  onClick={handleDeleteImage}
                  disabled={isDeletingImage}
                >
                  {isDeletingImage ? (
                    <Loader2 className={cn(isAvatar ? "size-3" : "size-4 mr-2", "animate-spin")} />
                  ) : (
                    <Trash2 className={cn(isAvatar ? "size-3" : "size-4 mr-2")} />
                  )}
                  {!isAvatar && "Remove"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            {...getRootProps()} 
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors duration-200 hover:border-primary/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/30",
              isAvatar ? "rounded-full p-1" : "p-4"
            )}
          >
            <input {...getInputProps()} id={`agent-image-${imageType}`} />
            <div className={cn(
              "rounded-full bg-gray-100 dark:bg-gray-800",
              isAvatar ? "p-1.5 mb-1" : "p-3 mb-3"
            )}>
              <ImageIcon className={cn(isAvatar ? "size-4" : "size-8", "text-gray-400 dark:text-gray-500")} />
            </div>
            {isDragActive ? (
              <p className={cn("font-medium text-center text-primary", isAvatar ? "text-xs" : "text-sm")}>
                Drop
              </p>
            ) : (
              <>
                <p className={cn(
                  "font-medium text-center text-gray-700 dark:text-gray-300",
                  isAvatar ? "text-[10px] leading-tight" : "text-sm mb-1"
                )}>
                  {isAvatar ? "Upload" : "Drag & drop or click to upload"}
                </p>
                {!isAvatar && (
                  <div className="flex items-center justify-center gap-1 mt-1 mb-2">
                    <Badge variant="secondary" className="text-xs font-normal">PNG</Badge>
                    <Badge variant="secondary" className="text-xs font-normal">JPG</Badge>
                    <Badge variant="secondary" className="text-xs font-normal">5MB max</Badge>
                  </div>
                )}
                {recommendedSize && !isAvatar && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                    Recommended: {recommendedSize}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 