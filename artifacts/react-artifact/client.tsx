import { Artifact } from "@/components/artifact/create-artifact";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";

import * as React from 'react';


interface Metadata {
  // Define metadata your custom artifact might need—the example below is minimal.
  info: string;
  content: string;
  componentName: string;
}

// Define the React Artifact, it is an artifact object that extends the Artifact class with kind 'react'
export const reactArtifact = new Artifact<"react", Metadata>({
  // The kind of artifact is 'react'
  kind: "react",
  // The description of the artifact
  description: "Useful for react code generation; Code execution is only available for react code.",
  
  
  // Initialization can fetch any extra data or perform side effects
  initialize: async ({ documentId, setMetadata }) => {
    // For example, initialize the artifact with default metadata.
    setMetadata({
      info: `Document ${documentId} initialized.`,
      content: '',
      componentName: '',
    });
  },

  // Handle streamed parts from the server (if your artifact supports streaming updates)
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {


    if (streamPart.type === "metadata-update" as any) {
      setMetadata((metadata) => ({
        ...metadata,
        info: streamPart.content as string,
        content: streamPart.content as string,
        componentName: streamPart.content as string
      }));
    }
    if (streamPart.type === "react-delta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + (streamPart.content as string),
        status: "streaming",
      }));
    }
    if (streamPart.type === "metadata-update" as any) {
      setMetadata(metadata => ({
        ...metadata,
        componentName: streamPart.content as string
      }));
    }
  },
  // Defines how the artifact content is rendered
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <div>Loading custom artifact...</div>;
    }

    if (mode === "diff") {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);
      return (
        <div>
          <h3>Diff View</h3>
          <pre>{oldContent}</pre>
          <pre>{newContent}</pre>
        </div>
      );
    }

    return (
      <div className="custom-artifact">
        <div className="flex flex-col gap-6 mx-2">
          <CodeBlock 
            language="jsx" 
            filename={`${metadata?.componentName ?? 'Component'}.tsx`} 
            code={content} 
          />
          
    
        </div>
      </div>
    );
  },
  // An optional set of actions exposed in the artifact toolbar.
  actions: [
    {
      icon: <span>⟳</span>,
      description: "Refresh artifact info",
      onClick: (context) => {
        // No appendMessage in ArtifactActionContext

      },
    },
  ],
  // Additional toolbar actions for more control
  toolbar: [
    {
      icon: <span>✎</span>,
      description: "Edit custom artifact",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Edit the custom artifact content.",
        });
      },
    },
  ],
});