import React from 'react';
// Corrected import: Use ToolInvocation instead of ToolInvocationPart
import type { ToolInvocation } from 'ai';
import WebSearchSection from '../web-search-section';
import ReadPageSection from '../read-page-section'; // Import the new component
import { E2BSandboxSection } from '../e2b-sandbox-section'; // Import E2B Sandbox UI
import CalculatorSection from '../calculator-section'; // Import Calculator UI
import CreateLogoSection from '../create-logo-section'; // Import the new logo section
import CreateChartSection from '../create-chart-section';
import ColorPaletteSection from '../design-system/color-palette-section'; // Import Color Palette UI
import DesignSystemSection from '../design-system/design-system-section'; // Import Design System UI
import PexelsSearchSection from '../pexels-search-section'; // Import Pexels Search UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper component to render the actual tool UI
const ToolDisplay = ({ toolInvocation }: { toolInvocation: ToolInvocation }) => {
  const { toolName, state } = toolInvocation;

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
      case 'color_palette': // Add case for color_palette tool (Result State)
        return <ColorPaletteSection toolInvocation={toolInvocation} />;
      case 'design_system': // Add case for design_system tool (Result State)
        return <DesignSystemSection toolInvocation={toolInvocation} />;
      case 'pexels_image_search': // Add case for Pexels search tool (Result State)
        return <PexelsSearchSection toolInvocation={toolInvocation} />;
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
      case 'color_palette': // Add case for color_palette tool (Call State)
        return <ColorPaletteSection toolInvocation={toolInvocation} />;
      case 'design_system': // Add case for design_system tool (Call State)
        return <DesignSystemSection toolInvocation={toolInvocation} />;
      case 'pexels_image_search': // Add case for Pexels search tool (Call State)
        return <PexelsSearchSection toolInvocation={toolInvocation} />;
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
            <p className="text-muted-foreground">Using tool: <span className="font-semibold text-primary">{toolInvocation.toolName || ""}...</span></p>
          </div>
  </>
};

interface ToolMessageProps {
  // Corrected prop type
  toolInvocation: ToolInvocation;
}

export function ToolMessage({ toolInvocation }: ToolMessageProps) {

  if (process.env.NODE_ENV === 'development') {
    return (
      <Tabs defaultValue="view" className="w-full my-2">
        <TabsList className="grid w-full grid-cols-2 mb-1">
          <TabsTrigger value="view">View</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="view">
          <ToolDisplay toolInvocation={toolInvocation} />
        </TabsContent>
        <TabsContent value="json">
          <div className="mt-1 rounded-md border bg-muted p-2">
            <pre className="text-xs max-w-full overflow-auto whitespace-pre-wrap break-all">
              {JSON.stringify(toolInvocation, null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  // Production mode or if NODE_ENV is not 'development'
  return <ToolDisplay toolInvocation={toolInvocation} />;
}