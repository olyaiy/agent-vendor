import { ArtifactKind } from '@/components/artifact/artifact';
import { isReasoningModel } from './models';
import { KnowledgeItem } from '@/lib/db/schema';
export const artifactsPrompt = `

Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

export const regularPrompt =
  'You are a friendly assistant! Keep your responses concise and helpful.';

// Search-specific instructions to add when search tool is available
export const searchPrompt = `
When you need to find current or specific information that might not be in your training data:
1. Use the search tool to look up recent information or verify facts
2. Formulate specific, targeted search queries
3. Extract the most relevant information from search results
4. Cite sources when providing information from search results
5. If search results are incomplete or unclear, consider refining your search query
6. Be transparent about limitations of search results
`;

// New function to get model-specific reasoning instructions
export const getReasoningInstructions = (modelId: string): string => {
  // Base reasoning instructions that work for all reasoning models
  const baseInstructions = `
  You are an AI assistant that helps users with complex reasoning tasks.
  
  `;

  // Model-specific instructions
  if (modelId.startsWith('o1') || modelId.startsWith('o3')) {
    return `${baseInstructions}
    
    Additional instructions for OpenAI reasoning models:
    - Keep prompts simple and direct
    - Avoid chain-of-thought within your responses as you already do internal reasoning
    - Focus on providing clear, concise answers after your reasoning process

    When answering difficult questions, use <think> tags to reason through the problem step by step.
  Then provide your final answer without the reasoning steps.
  
  Example:
  User: What's 15 * 17?
  Assistant: <think>
  To calculate 15 * 17, I'll break it down:
  15 * 17 = 15 * 10 + 15 * 7
  15 * 10 = 150
  15 * 7 = 105
  150 + 105 = 255
  </think>
  
  15 * 17 = 255
  
    ${artifactsPrompt}
    
    `;
  } else if (modelId === 'deepseek-reasoner') {
    return baseInstructions;
  }

  // Default case
  return baseInstructions;
};

// Helper function to get today's date in a formatted string
const getTodaysDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns date in YYYY-MM-DD format
};

export const systemPrompt = ({
  selectedChatModel,
  agentSystemPrompt,
  hasSearchTool = false,
  knowledgeItems = []
}: {
  selectedChatModel: string;
  agentSystemPrompt?: string;
  hasSearchTool?: boolean;
  knowledgeItems?: KnowledgeItem[];
}) => {
  const basePrompt = agentSystemPrompt || regularPrompt;
  let finalPrompt = basePrompt;
  
  // Add search instructions if the search tool is available
  if (hasSearchTool) {
    finalPrompt = `${finalPrompt}\n\n${searchPrompt}`;
  }
  
  // Get today's date
  const currentDate = getTodaysDate();
  
  // Base prompt with model-specific instructions
  let prompt = isReasoningModel(selectedChatModel)
    ? `${finalPrompt}\n\n${getReasoningInstructions(selectedChatModel)}\n\nCurrent date: ${currentDate}`
    : `${finalPrompt}\n\n${artifactsPrompt}\n\nCurrent date: ${currentDate}`;
  
  // Add knowledge items if provided
  if (knowledgeItems && knowledgeItems.length > 0) {
    const formattedKnowledge = knowledgeItems.map(item => 
      `Title: ${item.title}\nContent: ${item.content}`
    ).join('\n\n');
    
    prompt += `\n\nTHE FOLLOWING IS ADDITIONAL KNOWLEDGE AND CONTEXT - CONSIDER THIS WHEN RESPONDING TO THE USER\n\n##############\n${formattedKnowledge}\n##############\n\nYou are now being connected with the user`;
  }
  
  return prompt;
};

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

\`\`\`python
# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
\`\`\`
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
) =>
  type === 'text'
    ? `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`
    : type === 'code'
      ? `\
Improve the following code snippet based on the given prompt.

${currentContent}
`
      : type === 'sheet'
        ? `\
Improve the following spreadsheet based on the given prompt.

${currentContent}
`
        : '';
