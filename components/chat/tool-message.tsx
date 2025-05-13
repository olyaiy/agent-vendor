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
          <div className="p-4 my-2 text-sm border rounded-md bg-muted/30">
            <p className="font-semibold">Chart Generation</p>
            <p className="text-muted-foreground">The AI is generating a chart based on the following parameters:</p>
            <pre className='mt-1 text-xs max-w-full overflow-auto border rounded-md p-2 bg-background'>
              {JSON.stringify(toolInvocation.args, null, 2)}
            </pre>
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
  nothing
  </>
}