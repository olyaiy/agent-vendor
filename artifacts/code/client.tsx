import { Artifact } from '@/components/artifact/create-artifact';
import { CodeEditor } from '@/components/editor/code-editor';
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/util/icons';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import { Console, ConsoleOutput, ConsoleOutputContent } from '@/components/util/console';

// Define Output Handlers
const OUTPUT_HANDLERS = {
  matplotlib: `
    // Matplotlib output handler for generating and displaying plots
    import io
    import base64
    from matplotlib import pyplot as plt

    // Clear any existing plots
    plt.clf()
    plt.close('all')

    // Switch to agg backend for non-interactive plotting
    plt.switch_backend('agg')

    // Custom show function to handle plot output
    def setup_matplotlib_output():
        def custom_show():
            // Check and warn if plot size is too large
            if plt.gcf().get_size_inches().prod() * plt.gcf().dpi ** 2 > 25_000_000:
                print("Warning: Plot size too large, reducing quality")
                plt.gcf().set_dpi(100)

            // Convert plot to base64 encoded PNG
            png_buf = io.BytesIO()
            plt.savefig(png_buf, format='png')
            png_buf.seek(0)
            png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
            print(f'data:image/png;base64,{png_base64}')
            png_buf.close()

            // Clean up plot resources
            plt.clf()
            plt.close('all')

        // Override default plt.show with custom implementation
        plt.show = custom_show
  `,
  basic: `
    // Basic output capture setup
  `,
};


// Function to detect required handlers
function detectRequiredHandlers(code: string): string[] {
  const handlers: string[] = ['basic'];

  if (code.includes('matplotlib') || code.includes('plt.')) {
    handlers.push('matplotlib');
  }

  return handlers;
}

// Define Metadata type
interface Metadata {
  // Metadata has an array of ConsoleOutput objects
  outputs: Array<ConsoleOutput>;
}


// Define the Code Artifact, it is an artifact object that extends the Artifact class with kind 'code'
export const codeArtifact = new Artifact<'code', Metadata>({
  // The kind of artifact is 'code'
  kind: 'code',
  // The description of the artifact
  description:
    'Useful for code generation; Code execution is only available for python code.',
  // The initialize function is called when the artifact is created
  initialize: async ({ setMetadata }) => {
    // Set the metadata to an empty array of ConsoleOutput objects
    setMetadata({
      outputs: [],
    });
  },
  // When a part of the artifact is streamed...
  onStreamPart: ({ streamPart, setArtifact }) => {
    // If the stream part is a code delta...
    if (streamPart.type === 'code-delta') {
      // Update the artifact with the new content
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        // If the artifact is streaming and the content is longer than 300 
        // characters and less than 310 characters, make the artifact visible
        isVisible:
          draftArtifact.status === 'streaming' &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        // Set the status to streaming
        status: 'streaming',
      }));
    }
  },

  // The content function is called when the artifact is rendered
  content: ({ metadata, setMetadata, ...props }) => {
    // Return the code editor component
    return (
      <>
        <div className="px-1">
          <CodeEditor {...props} />
        </div>

        {/* If there are outputs, render the console */}
        {metadata?.outputs && (
          <Console
            consoleOutputs={metadata.outputs}
            setConsoleOutputs={() => {
              setMetadata({
                ...metadata,
                outputs: [],
              });
            }}
          />
        )}
      </>
    );
  },
  // Artifact actions ( Execute code, view previous version, view next version, copy code to clipboard )
  actions: [
    {
      icon: <PlayIcon size={18} />,
      label: 'Run',
      description: 'Execute code',
      onClick: async ({ content, setMetadata }) => {
        const runId = generateUUID();
        const outputContent: Array<ConsoleOutputContent> = [];

        setMetadata((metadata) => ({
          ...metadata,
          outputs: [
            ...metadata.outputs,
            {
              id: runId,
              contents: [],
              status: 'in_progress',
            },
          ],
        }));

        try {
          // Load Pyodide for Python execution in the browser
          // @ts-expect-error - loadPyodide is not defined
          const currentPyodideInstance = await globalThis.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
          });

          // Configure stdout handling
          currentPyodideInstance.setStdout({
            batched: (output: string) => {
              outputContent.push({
                type: output.startsWith('data:image/png;base64')
                  ? 'image'
                  : 'text',
                value: output,
              });
            },
          });

          // Load required Python packages
          await currentPyodideInstance.loadPackagesFromImports(content, {
            messageCallback: (message: string) => {
              setMetadata((metadata) => ({
                ...metadata,
                outputs: [
                  ...metadata.outputs.filter((output) => output.id !== runId),
                  {
                    id: runId,
                    contents: [{ type: 'text', value: message }],
                    status: 'loading_packages',
                  },
                ],
              }));
            },
          });

          // Setup required output handlers
          const requiredHandlers = detectRequiredHandlers(content);
          for (const handler of requiredHandlers) {
            if (OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS]) {
              await currentPyodideInstance.runPythonAsync(
                OUTPUT_HANDLERS[handler as keyof typeof OUTPUT_HANDLERS],
              );

              if (handler === 'matplotlib') {
                await currentPyodideInstance.runPythonAsync(
                  'setup_matplotlib_output()',
                );
              }
            }
          }

          // Execute the Python code
          await currentPyodideInstance.runPythonAsync(content);

          // Update metadata with execution results
          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              ...metadata.outputs.filter((output) => output.id !== runId),
              {
                id: runId,
                contents: outputContent,
                status: 'completed',
              },
            ],
          }));
        } catch (error: any) {
          // Handle execution errors
          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              ...metadata.outputs.filter((output) => output.id !== runId),
              {
                id: runId,
                contents: [{ type: 'text', value: error.message }],
                status: 'failed',
              },
            ],
          }));
        }
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy code to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  // Artifact toolbar ( Add comments, add logs )
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Add comments',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add comments to the code snippet for understanding',
        });
      },
    },
    {
      icon: <LogsIcon />,
      description: 'Add logs',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add logs to the code snippet for debugging',
        });
      },
    },
  ],
});
