import { smoothStream, streamText } from 'ai';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/models';

// Define types for message content items
interface TextItem {
  type: 'text';
  text: string;
}

interface ToolCallItem {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
}

type ContentItem = TextItem | ToolCallItem;

// Helper function to filter messages to essential content
function filterMessages(messages: any[]) {
  return messages.map(message => {
    // For user messages, just keep the text content
    if (message.role === 'user') {
      return {
        role: 'user',
        content: typeof message.content === 'string' 
          ? message.content 
          : 'User query'
      };
    }
    
    // For assistant messages, extract only text content (no tool calls)
    if (message.role === 'assistant') {
      if (typeof message.content === 'string') {
        return {
          role: 'assistant',
          content: message.content
        };
      }
      
      // If content is an array, only keep text items
      if (Array.isArray(message.content)) {
        const textItems = message.content
          .filter((item: ContentItem) => item.type === 'text')
          .map((item: TextItem) => item.text || '');
          
        return {
          role: 'assistant',
          content: textItems.join(' ')
        };
      }
      
      return {
        role: 'assistant',
        content: 'Assistant response'
      };
    }
    
    // For tool messages, create a brief summary instead of full content
    if (message.role === 'tool') {
      // Check if it's a search tool result
      if (Array.isArray(message.content) && message.content.length > 0) {
        const toolContent = message.content[0];
        
        // Handle search results specifically
        if (toolContent.type === 'tool-result') {
          // Handle search tools
          if (toolContent.toolName === 'searchTool' || toolContent.toolName === 'newsSearch') {
            // Extract just the search query and number of results
            const result = toolContent.result;
            const query = result?.query || 'unknown query';
            const resultCount = result?.results?.length || 0;
            
            // Format a brief summary of each result
            let resultSummaries = '';
            if (result?.results && Array.isArray(result.results)) {
              // Limit to max 5 results to prevent overload while keeping context
              const limitedResults = result.results.slice(0, 5);
              resultSummaries = limitedResults.map((item: any, index: number) => {
                // Extract all available useful information
                const title = item.title || 'No title';
                const url = item.url || item.link || '';
                const snippet = item.snippet || item.description || item.content || '';
                // Include more content (up to 200 chars) for better context
                const truncatedSnippet = snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet;
                
                // If there are any additional fields that might be useful, extract those too
                const extraFields = [];
                if (item.authors) {
                  extraFields.push(`Authors: ${Array.isArray(item.authors) ? item.authors.join(', ') : item.authors}`);
                }
                if (item.date || item.publishedDate) {
                  extraFields.push(`Date: ${item.date || item.publishedDate}`);
                }
                if (item.source) {
                  extraFields.push(`Source: ${item.source}`);
                }
                
                const extraInfo = extraFields.length > 0 ? extraFields.join(' | ') : '';
                
                // Create a more comprehensive result entry
                return `Result ${index + 1}: ${title}
URL: ${url}
${extraInfo ? extraInfo + '\n' : ''}
Summary: ${truncatedSnippet}`;
              }).join('\n\n');
            }
            
            // Add a note about filtering to indicate there might be more results
            const noteAboutFiltering = result?.results && result.results.length > 5 
              ? `\n\nNote: Only showing 5 of ${result.results.length} results` 
              : '';
            
            return {
              role: 'tool',
              content: `Search results for "${query}" (${resultCount} results found):${noteAboutFiltering}\n\n${resultSummaries}`
            };
          }
          
          // Handle other tool types (image generation, code, etc.)
          return {
            role: 'tool',
            content: formatToolResult(toolContent)
          };
        }
      }
      
      return {
        role: 'tool',
        content: 'Tool results summary'
      };
    }
    
    // Default fallback
    return {
      role: message.role,
      content: 'Message content'
    };
  });
}

// Helper function to format various tool results appropriately
function formatToolResult(toolContent: any): string {
  // Default summary if we can't extract useful info
  let resultSummary = `${toolContent.toolName || 'Unknown tool'} result: Tool completed successfully`;
  
  // Handle code-related tools 
  if (toolContent.toolName?.includes('code') || 
      toolContent.toolName?.includes('file') || 
      toolContent.toolName?.includes('git')) {
    
    if (toolContent.result?.code || toolContent.result?.content) {
      const codeContent = toolContent.result.code || toolContent.result.content;
      // For code, include a truncated version with language if available
      const language = toolContent.result.language || '';
      const truncatedCode = codeContent.length > 300 
        ? codeContent.substring(0, 300) + '...' 
        : codeContent;
      
      resultSummary = `${toolContent.toolName} result (${language}): \n\`\`\`\n${truncatedCode}\n\`\`\``;
    } else if (toolContent.result?.message) {
      resultSummary = `${toolContent.toolName} result: ${toolContent.result.message}`;
    }
  }
  
  // Handle image generation or vision tools
  else if (toolContent.toolName?.includes('image') || toolContent.toolName?.includes('vision')) {
    if (toolContent.result?.description) {
      resultSummary = `${toolContent.toolName} result: ${toolContent.result.description}`;
    } else if (toolContent.result?.caption) {
      resultSummary = `${toolContent.toolName} result: Image described as "${toolContent.result.caption}"`;
    }
  }
  
  // Handle general API calls or data tools
  else if (toolContent.result) {
    // Try to stringify the result if it's an object
    if (typeof toolContent.result === 'object') {
      try {
        // Get a shorter version of the JSON for context
        const resultStr = JSON.stringify(toolContent.result);
        const truncatedResult = resultStr.length > 200 
          ? resultStr.substring(0, 200) + '...' 
          : resultStr;
        
        resultSummary = `${toolContent.toolName} result: ${truncatedResult}`;
      } catch (e) {
        // If JSON stringify fails, use a generic message
        resultSummary = `${toolContent.toolName} result: Tool returned structured data`;
      }
    } else if (typeof toolContent.result === 'string') {
      // For string results, truncate if too long
      const truncatedResult = toolContent.result.length > 300 
        ? toolContent.result.substring(0, 300) + '...' 
        : toolContent.result;
      
      resultSummary = `${toolContent.toolName} result: ${truncatedResult}`;
    }
  }
  
  return resultSummary;
}

// Add logging function for message filtering stats
function logFilteringStats(original: any[], filtered: any[]) {
  // More detailed logging for diagnostic purposes

  
  // Log size reduction percentage
  const originalSize = JSON.stringify(original).length;
  const filteredSize = JSON.stringify(filtered).length;
}

let articlePrompt = `
# News Article Writing Expert (Canadian Press Style)

As an expert news writer, your role is to transform provided facts into clear, concise, and compelling news stories that adhere to journalistic best practices and Canadian Press (CP) style. Your writing should captivate readers from the first sentence, using powerful openings that draw them into the story. The structure of your articles should follow the inverted pyramid format, ensuring that the most critical information is presented first, followed by supporting details.

Clarity, precision, and neutrality are your guiding principles. Your language should be active and vibrant, employing strong verbs to convey action and urgency. Sentence structures should vary to maintain a rhythm that keeps readers engaged, while transitions between ideas should be seamless, guiding the reader effortlessly through the narrative.

Redundancy and unnecessary words have no place in your writing. Every sentence should serve a purpose, contributing to the overall narrative without distraction. Quotes, facts, and claims must be attributed properly, lending credibility and transparency to your work.

While adhering to CP style, you will follow Canadian spelling conventions and formatting rules for dates, numbers, titles, and punctuation. For any specific style questions, the Canadian Press standards will be your reference point.

Your articles will begin with clear, compelling headlines that capture the essence of the story in under ten words. The lead paragraph should succinctly answer the essential questions of who, what, when, where, why, and how, setting the stage for the details that follow. As you weave quotes into the narrative, ensure they are seamlessly integrated and properly attributed, adding depth and perspective to the story.

Context is crucial, but it should never overwhelm the core narrative. Your articles should conclude with impact, often through a relevant quote or a forward-looking statement that leaves a lasting impression on the reader.

In your work, you will rely solely on the facts provided. If information appears incomplete, you will clearly indicate what details are missing rather than inventing or researching additional facts. This approach ensures that your writing remains grounded in reality, maintaining the trust and confidence of your audience.

To enhance readability and structure, use Markdown formatting in your articles. Begin with a level 1 heading for the title, followed by level 2 headings for major sections such as the introduction, body, and conclusion. Use level 3 headings for sub-sections if necessary. Employ bold text for emphasis and italics for quotes or key terms. Lists should be avoided in favor of well-structured paragraphs that guide the reader through the narrative.

IT IS CRUICAL YOU DO NOT USE BULLET POINTS OR LISTS.
`


export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream, messages }) => {
    // Filter messages to reduce size
    const filteredMessages = filterMessages(messages);
    
    // Further limit conversation length if still too large (max ~10k tokens)
    let processedMessages = filteredMessages;
    const messagesSizeBytes = JSON.stringify(filteredMessages).length;
    
    // If still very large (>100KB), only keep the most recent messages
    if (messagesSizeBytes > 100 * 1024) {
      // Get last 20 messages which typically provides enough context
      processedMessages = filteredMessages.slice(-20);
    }
    
    // Log detailed stats
    logFilteringStats(messages, processedMessages);
    
    // Format conversation as readable text with proper attribution
    const conversationText = processedMessages.map(msg => {
      // Format based on role for better context
      const rolePrefix = msg.role === 'user' 
        ? '👤 USER' 
        : msg.role === 'assistant' 
          ? '🤖 ASSISTANT' 
          : '🔧 TOOL';
          
      return `${rolePrefix}: ${msg.content}`;
    }).join('\n\n');
    
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system:
        `Write about the given topic. 
        Markdown is supported. 
        Use headings wherever appropriate.`,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: articlePrompt + `
      Based on the conversation history, write a document about the user's requests.
      
      The conversation history is provided below:
      
      ${conversationText}

      The title of the document is: ${title}
      `,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;

        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'text'),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
});
