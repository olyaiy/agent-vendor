import React from 'react';
// Corrected import: Use ToolInvocation instead of ToolInvocationPart
import type { ToolInvocation } from 'ai';
import WebSearchSection from '../web-search-section';
import ReadPageSection from '../read-page-section'; // Import the new component
import { E2BSandboxSection } from '../e2b-sandbox-section'; // Import E2B Sandbox UI
import CalculatorSection from '../calculator-section'; // Import Calculator UI
import CreateLogoSection from '../create-logo-section'; // Import the new logo section
import CreateChartSection from '../create-chart-section';

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
      case 'web_search':
        return <WebSearchSection 
              toolInvocation={toolInvocation}
            />
      case 'read_page': // Add case for readPage tool (Result State)
        return <ReadPageSection
              toolInvocation={toolInvocation}
            />
      case 'e2b_sandbox':
        return <E2BSandboxSection toolInvocation={toolInvocation} />;
      case 'calculator':
        return <CalculatorSection toolInvocation={toolInvocation} />;
      case 'create_logo': // Add case for create_logo tool (Result State)
        return <CreateLogoSection toolInvocation={toolInvocation} />;
      case 'create_chart':
        return <CreateChartSection toolInvocation={toolInvocation} />;
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
    // console.log('toolInvocation', toolInvocation); // Keep console log for debugging if needed

    switch (toolName) {
      case 'web_search':
        return <WebSearchSection toolInvocation={toolInvocation} />
      case 'read_page': // Add case for readPage tool (Call State)
        return <ReadPageSection toolInvocation={toolInvocation} />
      case 'e2b_sandbox':
        return <E2BSandboxSection toolInvocation={toolInvocation} />;
      case 'calculator':
        return <CalculatorSection toolInvocation={toolInvocation} />;
      case 'create_logo': // Add case for create_logo tool (Call State)
        return <CreateLogoSection toolInvocation={toolInvocation} />;
      case 'create_chart':
        return (
          <div className="flex items-center p-4 my-2 space-x-2 text-sm border rounded-md bg-muted/30">
            <svg className="w-5 h-5 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-muted-foreground">Using tool: <span className="font-semibold text-primary">Create Chart...</span></p>
          </div>
        );
      default:
        return <div>
          <pre className='text-xs max-w-full overflow-none border rounded-md p-2'>
            {JSON.stringify(toolInvocation, null, 2)}
          </pre>
        </div>;
    }
  }

  return<>
  <div className="flex items-center p-4 my-2 space-x-2 text-sm border rounded-md bg-muted/30">
            <svg className="w-5 h-5 text-primary animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-muted-foreground">Using tool: <span className="font-semibold text-primary">{toolName || ""}...</span></p>
          </div>
  </>
}