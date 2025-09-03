import { useState, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import type { Agent } from '@/db/schema/agent';
import type { Tool } from '@/db/schema/tool';
import { generateUUID } from '@/lib/utils';
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater';
import { modelDetails, type ModelSettings } from '@/lib/models';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export interface AgentSpecificModel {
  agentId: string;
  modelId: string;
  role: 'primary' | 'secondary';
  model: string;
  description?: string | null;
  id: string;
}

interface UseChatManagerProps {
  chatId: string;
  agent: Agent;
  agentModels: AgentSpecificModel[];
  assignedTools: Tool[];
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  agentSlug?: string;
}

// Helper function to get initial settings based on model ID
const getInitialChatSettings = (modelId: string, agentModels: AgentSpecificModel[]): Record<string, number> => {
  const selectedModelInfo = agentModels.find(m => m.modelId === modelId);
  if (selectedModelInfo) {
    const details = modelDetails[selectedModelInfo.model];
    const defaultSettings = details?.defaultSettings;
    if (defaultSettings) {
      const initialSettings: Record<string, number> = {};
      for (const key in defaultSettings) {
        const settingKey = key as keyof ModelSettings;
        const settingConfig = defaultSettings[settingKey];
        if (settingConfig) {
          initialSettings[settingKey] = settingConfig.default;
        }
      }
      return initialSettings;
    }
  }
  return {};
};

export function useChatManager({
  chatId,
  agent,
  agentModels,
  assignedTools,
  initialMessages,
  initialTitle,
  agentSlug
}: UseChatManagerProps) {
  const assignedToolNames = assignedTools.map(tool => tool.name);
  const isWebSearchEnabled = assignedToolNames.includes('web_search');

  const primaryModel = agentModels.find(m => m.role === 'primary');
  const initialModelId = primaryModel ? primaryModel.modelId : (agentModels.length > 0 ? agentModels[0].modelId : '');

  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  const [chatSettings, setChatSettings] = useState<Record<string, number>>(() =>
    getInitialChatSettings(initialModelId, agentModels)
  );
  
  // Credit dialog state
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);

  const { displayTitle, handleChatFinish } = useChatTitleUpdater(chatId, initialTitle);

  // Update settings when model changes
  useEffect(() => {
    setChatSettings(getInitialChatSettings(selectedModelId, agentModels));
  }, [selectedModelId, agentModels]);

  // Store last visited agent
  useEffect(() => {
    if (agentSlug) {
      localStorage.setItem('lastVisitedAgentSlug', agentSlug);
    }
  }, [agentSlug]);

  const handleSettingChange = useCallback((settingName: string, value: number) => {
    setChatSettings(prev => ({ ...prev, [settingName]: value }));
  }, []);

  // Prepare API settings
  const apiSettings = { ...chatSettings };
  if (apiSettings.maxOutputTokens !== undefined) {
    apiSettings.maxOutputTokens = apiSettings.maxOutputTokens;
    delete apiSettings.maxOutputTokens;
  }

  const chatHook = useChat({
    id: chatId,

    body: {
      chatId: chatId,
      agentId: agent.id,
      systemPrompt: agent.systemPrompt,
      model: agentModels.find(m => m.modelId === selectedModelId)?.model || '',
      ...apiSettings,
      assignedToolNames: assignedToolNames
    },

    initialMessages,
    generateId: generateUUID,
    onFinish: handleChatFinish,

    onError: (error) => {
      console.log('Error from useChat:', error);
      
      // Handle 402 Payment Required (insufficient credits)
      // The exact shape of the Error object can vary between adapters:
      // 1. Some include `status` / `response.status`.
      // 2. Some only embed the server JSON inside `error.message`.
      // We therefore try multiple strategies instead of relying solely on
      // `error.message.includes('402')` (which fails in your current build).

      // Avoid explicit `any` to satisfy eslint rules
      // Cast through `unknown` to avoid structural type error
      const errorRecord = error as unknown as Record<string, unknown>;
      const responseRecord = errorRecord.response as Record<string, unknown> | undefined;
      const status = (errorRecord.status as number | undefined) ?? (responseRecord?.status as number | undefined);
      const messageString = (errorRecord.message as string | undefined) ?? '';

      const maybeHandleInsufficientCredits = (raw: unknown) => {
        if (!raw || typeof raw !== 'object') return false;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const data = raw as { error?: string; creditBalance?: number };
        if (data.error === 'insufficient_credits') {
          setCreditBalance(data.creditBalance ?? 0);
          setShowCreditDialog(true);
          return true;
        }
        return false;
      };

      // Case 1: explicit status
      if (status === 402) {
        try {
          // Some libraries expose a `response` object with `.json()`
          const json = responseRecord?.data ?? errorRecord.responseBody;
          if (json && maybeHandleInsufficientCredits(json)) return;
        } catch {/* ignore parse errors */}
      }

      // Case 2: JSON embedded in message string
      if (messageString.includes('insufficient_credits')) {
        try {
          const parsed = JSON.parse(messageString);
          if (maybeHandleInsufficientCredits(parsed)) return;
        } catch {
          // If message contains more than just JSON, try to extract
          const match = messageString.match(/\{.*\}/);
          if (match) {
            try {
              const extracted = JSON.parse(match[0]);
              if (maybeHandleInsufficientCredits(extracted)) return;
            } catch {/* noop */}
          }
        }
      }
       
      // Handle 401 Unauthorized
      if (error && error.message && (error.message.includes('Unauthorized') || error.message.includes('401'))) {
        chatHook.setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: generateUUID(),
            role: 'assistant',
            content: '',
            ui: (
              <div className="p-4 bg-red-100 border border-red-300 rounded-md text-red-800">
                <p className="mb-2">Please sign in to chat!</p>
                <GoogleSignInButton className="w-full" />
              </div>
            )
          }
        ] as UIMessage[]);
      }
    }
  });

  return {
    // Chat state
    ...chatHook,
    
    // Model and settings state
    selectedModelId,
    setSelectedModelId,
    chatSettings,
    handleSettingChange,
    
    // Computed values
    displayTitle,
    assignedToolNames,
    isWebSearchEnabled,
    
    // Helper functions
    handleChatFinish,
    
    // Credit dialog state
    showCreditDialog,
    setShowCreditDialog,
    creditBalance,
  };
} 