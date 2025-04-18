import React from 'react';
// Corrected import: Use ToolInvocation instead of ToolInvocationPart
import type { ToolInvocation } from 'ai';

interface ToolMessageProps {
  // Corrected prop type
  toolInvocation: ToolInvocation;
}

export const ToolMessage: React.FC<ToolMessageProps> = ({ toolInvocation }) => {
  return (
    <div className="border border-white p-2 rounded">
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(toolInvocation, null, 2)}
      </pre>
    </div>
  );
};