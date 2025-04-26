import React from 'react';
// Corrected import: Use ToolInvocation instead of ToolInvocationPart
import type { ToolInvocation } from 'ai';
import WebSearchSection from '../web-search-section';
import ReadPageSection from '../read-page-section'; // Import the new component
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
      case 'readPage': // Add case for readPage tool (Result State)
        return <ReadPageSection
              toolInvocation={toolInvocation}
            />
      default:
        return <div>
          <pre className='text-xs max-w-full overflow-hidden border rounded-md p-2'>
            {JSON.stringify(toolInvocation, null, 2)}
          </pre>
        </div>;
    }
  }


  // If result is not available
  if (state == 'call' ) {
    console.log('toolInvocation', toolInvocation);

    switch (toolName) {
      case 'webSearch':
        return <WebSearchSection toolInvocation={toolInvocation} />
      case 'readPage': // Add case for readPage tool (Call State)
        return <ReadPageSection toolInvocation={toolInvocation} />
      default:
        return <div>
          <pre className='text-xs max-w-full overflow-none border rounded-md p-2'>
            {JSON.stringify(toolInvocation, null, 2)}
          </pre>
        </div>;
    }
  }

  return<>
  nothing
  </>
}