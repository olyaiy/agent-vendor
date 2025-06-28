import React from 'react';
import { Paperclip, Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PendingAttachment } from '@/hooks/use-attachment-manager';

interface AttachmentPreviewProps {
  attachments: PendingAttachment[];
  onRemoveAttachment: (attachmentId: string) => Promise<void>;
}

export function AttachmentPreview({ attachments, onRemoveAttachment }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="p-2 border-t border-black/10 dark:border-white/10">
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => (
          <div key={att.id} className="relative group w-20 h-20 border rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
            {att.previewUrl.startsWith('blob:') && att.file.type.startsWith('image/') ? (
              <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-1">
                <Paperclip className="w-6 h-6 text-gray-500 dark:text-gray-400 mb-1 flex-shrink-0" />
                <span className="text-xs text-center text-gray-700 dark:text-gray-300 truncate w-full px-1" title={att.file.name}>
                  {att.file.name}
                </span>
              </div>
            )}
            
            {/* Status overlay */}
            <div className={cn(
              "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
              att.status === 'uploading' ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              {att.status === 'uploading' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
              {att.status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-400" />}
              {att.status === 'error' && <XCircle className="w-6 h-6 text-red-400" />}
            </div>
            
            {/* Remove button */}
            {att.status !== 'uploading' && (
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10 cursor-pointer border border-white/20"
                aria-label="Remove attachment"
              >
                <X className="size-4" />
              </button>
            )}
            
            {/* Error message */}
            {att.status === 'error' && att.errorMessage && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-[10px] p-0.5 text-center truncate"
                title={att.errorMessage}
              >
                {att.errorMessage.length > 20 ? att.errorMessage.substring(0, 18) + '...' : att.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 