import React from 'react';
// Corrected import: Use ToolInvocation instead of ToolInvocationPart
import type { ToolInvocation } from 'ai';
import WebSearchSection from '../web-search-section';

interface ToolMessageProps {
  // Corrected prop type
  toolInvocation: ToolInvocation;
}

export function ToolMessage({ toolInvocation }: ToolMessageProps) {

  const { toolName, state } = toolInvocation;
  
  // const {
  //   state,
  //   step,
  //   toolCallId,
  //   toolName,
  //   args,
  // } = toolInvocation;


 

  // If RESULT is available
  if (state == 'result') {
    switch (toolName) {
      case 'webSearch':
        return <WebSearchSection 
              toolInvocation={toolInvocation}
            />

      default:
        return <div>
          <h1>Unknown Tool</h1>
          <pre>{JSON.stringify(toolInvocation, null, 2)}</pre>
        </div>;
    }
  }


  // If result is not available
  if (state == 'call' || state == 'partial-call') {

    switch (toolName) {
      case 'webSearch':
        return <WebSearchSection toolInvocation={toolInvocation} />
      default:
        return <div>
          <pre className='text-xs max-w-full overflow-hidden border rounded-md p-2'>
            {JSON.stringify(toolInvocation, null, 2)}
          </pre>
        </div>;
    }
  }

  return<>
  nothing
  </>
}