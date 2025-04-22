import React from 'react';
// Corrected import: Use ToolInvocation instead of ToolInvocationPart
import type { ToolInvocation } from 'ai';

interface ToolMessageProps {
  // Corrected prop type
  toolInvocation: ToolInvocation;
}

export function ToolMessage({ toolInvocation }: ToolMessageProps) {

  const { toolName, state, args } = toolInvocation;
  
  // const {
  //   state,
  //   step,
  //   toolCallId,
  //   toolName,
  //   args,
  // } = toolInvocation;


  // If RESULT is available
  if (state == 'result') {
    const { result } = toolInvocation;

    switch (toolName) {
      case 'web-search':
        return <div>
          Web Search
          <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>;
      default:
        return <div>
          <pre>{JSON.stringify(toolInvocation, null, 2)}</pre>
        </div>;
    }
  }


  // If result is not available
  if (state == 'call' || state == 'partial-call') {

    switch (toolName) {
      case 'web-search':
        return <div>
          Searching ...
          <pre>{JSON.stringify(toolInvocation, null, 2)}</pre>
        </div>;
      default:
        return <div>
          <pre>{JSON.stringify(toolInvocation, null, 2)}</pre>
        </div>;
    }
  }
}