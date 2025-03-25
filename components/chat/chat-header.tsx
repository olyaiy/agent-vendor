'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/util/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { memo, useState, type Dispatch, type SetStateAction, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VisibilityType, VisibilitySelector } from '@/components/util/visibility-selector';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModelSettings } from './chat';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  RotateCcw, 
  Info,
  MessageSquare,
  Thermometer,
  Activity,
  LayoutGrid,
  Repeat,
  Sparkles
} from 'lucide-react';

// Export the props interface so that it can be imported in chat.tsx
export interface ChatHeaderProps {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  agentId: string;
  agent_display_name?: string;
  thumbnail_url?: string | null;
  modelSettings: ModelSettings;
  setModelSettings: Dispatch<SetStateAction<ModelSettings>>;
}

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  agentId,
  agent_display_name,
  thumbnail_url,
  modelSettings,
  setModelSettings,
}: ChatHeaderProps) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;

  // State for input values to handle changes before final submission
  const [tempMaxTokens, setTempMaxTokens] = useState<string>(modelSettings.maxTokens?.toString() || '');
  const [tempTopK, setTempTopK] = useState<string>(modelSettings.topK?.toString() || '');
  
  // Track active settings count for badge
  const [activeSettingsCount, setActiveSettingsCount] = useState<number>(0);
  
  // Update active settings count when modelSettings changes
  useEffect(() => {
    if (modelSettings._changed) {
      const count = Object.values(modelSettings._changed).filter(Boolean).length;
      setActiveSettingsCount(count);
    } else {
      setActiveSettingsCount(0);
    }
  }, [modelSettings]);
  
  // Function to update model settings
  const updateModelSetting = <K extends keyof Omit<ModelSettings, '_changed'>>(key: K, value: ModelSettings[K]) => {
    setModelSettings(prev => {
      // Create a copy of the _changed object, initializing it if it doesn't exist
      const changedSettings = { ...(prev._changed || {}) };
      // Mark this setting as changed
      changedSettings[key as keyof typeof changedSettings] = true;
      
      return {
        ...prev,
        [key]: value,
        _changed: changedSettings
      };
    });
  };

  // Function to reset model settings
  const resetModelSettings = () => {
    setModelSettings({ _changed: {} });
    setTempMaxTokens('');
    setTempTopK('');
  };

  const SettingsIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EllipsisIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );

  const getSettingInfo = (settingKey: keyof Omit<ModelSettings, '_changed'>) => {
    const info = {
      maxTokens: {
        icon: <MessageSquare className="size-4" />,
        description: "Maximum number of tokens (words) to generate in the response",
        defaultValue: "Model default",
      },
      temperature: {
        icon: <Thermometer className="size-4" />,
        description: "Controls randomness: lower values are more focused, higher values more creative",
        defaultValue: "Model default (usually ~0.7)",
      },
      topP: {
        icon: <Sparkles className="size-4" />,
        description: "Controls diversity via nucleus sampling: 1.0 considers all tokens, lower values restrict to more probable tokens",
        defaultValue: "Model default (usually ~0.9)",
      },
      topK: {
        icon: <LayoutGrid className="size-4" />,
        description: "Only sample from the top K options for each token",
        defaultValue: "Model default",
      },
      presencePenalty: {
        icon: <Activity className="size-4" />,
        description: "Reduces repetition by penalizing tokens that already appear in the text",
        defaultValue: "Model default (usually 0)",
      },
      frequencyPenalty: {
        icon: <Repeat className="size-4" />,
        description: "Reduces repetition by penalizing tokens based on their frequency in the text",
        defaultValue: "Model default (usually 0)",
      },
    };
    
    return info[settingKey];
  };

  const SliderSetting = ({ 
    label, 
    settingKey, 
    value, 
    min, 
    max, 
    step 
  }: { 
    label: string, 
    settingKey: keyof Omit<ModelSettings, '_changed'>, 
    value: number | undefined, 
    min: number, 
    max: number, 
    step: number 
  }) => {
    const settingInfo = getSettingInfo(settingKey);
    const isChanged = modelSettings._changed?.[settingKey];
    
    return (
      <div className="px-2 py-3 border-b border-muted">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {settingInfo.icon}
            <Label htmlFor={settingKey} className="font-medium">
              {label}
            </Label>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6 rounded-full p-0 text-muted-foreground">
                <Info className="size-3.5" />
                <span className="sr-only">Info</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              <p className="text-xs">{settingInfo.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Default: {settingInfo.defaultValue}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-3">
          <Slider 
            id={settingKey}
            min={min}
            max={max}
            step={step}
            value={[value !== undefined ? value : min]}
            onValueChange={([val]) => updateModelSetting(settingKey, val)}
            className={isChanged ? "data-[active]:bg-primary" : ""}
          />
          
          <div className="flex items-center gap-1 w-20">
            <div className={`px-2 py-1 text-xs font-medium rounded-md ${isChanged 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground"}`}
            >
              {value !== undefined ? value : 'Default'}
            </div>
            
            {isChanged && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-6 rounded-full p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setModelSettings(prev => {
                        const { [settingKey]: _, ...rest } = prev;
                        const newChanged = { ...(prev._changed || {}) };
                        delete newChanged[settingKey as keyof typeof newChanged];
                        
                        return {
                          ...rest,
                          _changed: newChanged
                        };
                      });
                    }}
                  >
                    <XCircle className="size-3.5" />
                    <span className="sr-only">Reset</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Reset to default</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  };

  const NumberSetting = ({ 
    label, 
    settingKey, 
    value, 
    placeholder = "Default",
    onChange,
    onBlur,
  }: { 
    label: string, 
    settingKey: keyof Omit<ModelSettings, '_changed'>, 
    value: string, 
    placeholder?: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onBlur: () => void,
  }) => {
    const settingInfo = getSettingInfo(settingKey);
    const isChanged = modelSettings._changed?.[settingKey];
    
    return (
      <div className="px-2 py-3 border-b border-muted">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {settingInfo.icon}
            <Label htmlFor={settingKey} className="font-medium">
              {label}
            </Label>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6 rounded-full p-0 text-muted-foreground">
                <Info className="size-3.5" />
                <span className="sr-only">Info</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[220px]">
              <p className="text-xs">{settingInfo.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Default: {settingInfo.defaultValue}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              id={`${settingKey}`}
              type="number"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              className={`pr-7 ${isChanged ? "border-primary" : ""}`}
            />
            {isChanged && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 size-6 rounded-full p-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setModelSettings(prev => {
                    const { [settingKey]: _, ...rest } = prev;
                    const newChanged = { ...(prev._changed || {}) };
                    delete newChanged[settingKey as keyof typeof newChanged];
                    
                    if (settingKey === 'maxTokens') {
                      setTempMaxTokens('');
                    } else if (settingKey === 'topK') {
                      setTempTopK('');
                    }
                    
                    return {
                      ...rest,
                      _changed: newChanged
                    };
                  });
                }}
              >
                <XCircle className="size-3.5" />
                <span className="sr-only">Reset</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ModelSettingsContent = () => (
    <>
      <DropdownMenuLabel className="flex items-center justify-between">
        <span>Model Settings</span>
        {activeSettingsCount > 0 && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {activeSettingsCount} active
          </Badge>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <div className="max-h-[70vh] overflow-y-auto">
        <NumberSetting 
          label="Max Tokens" 
          settingKey="maxTokens"
          value={tempMaxTokens}
          onChange={(e) => setTempMaxTokens(e.target.value)}
          onBlur={() => {
            const value = parseInt(tempMaxTokens);
            if (!isNaN(value) && value > 0) {
              updateModelSetting('maxTokens', value);
            } else if (tempMaxTokens === '') {
              updateModelSetting('maxTokens', undefined);
              setTempMaxTokens('');
            }
          }}
        />
        
        <SliderSetting 
          label="Temperature" 
          settingKey="temperature" 
          value={modelSettings.temperature} 
          min={0} 
          max={1.99} 
          step={0.01} 
        />

        <SliderSetting 
          label="Top P" 
          settingKey="topP" 
          value={modelSettings.topP} 
          min={0} 
          max={1} 
          step={0.05} 
        />

        <NumberSetting 
          label="Top K" 
          settingKey="topK"
          value={tempTopK}
          onChange={(e) => setTempTopK(e.target.value)}
          onBlur={() => {
            const value = parseInt(tempTopK);
            if (!isNaN(value) && value >= 0) {
              updateModelSetting('topK', value);
            } else if (tempTopK === '') {
              updateModelSetting('topK', undefined);
              setTempTopK('');
            }
          }}
        />
        
        <SliderSetting 
          label="Presence Penalty" 
          settingKey="presencePenalty" 
          value={modelSettings.presencePenalty} 
          min={0} 
          max={2} 
          step={0.1} 
        />

        <SliderSetting 
          label="Frequency Penalty" 
          settingKey="frequencyPenalty" 
          value={modelSettings.frequencyPenalty} 
          min={0} 
          max={2} 
          step={0.1} 
        />
      </div>
      
      {activeSettingsCount > 0 && (
        <div className="mt-2 px-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-1.5"
            onClick={resetModelSettings}
          >
            <RotateCcw className="size-3.5" />
            Reset all to defaults
          </Button>
        </div>
      )}
    </>
  );

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-4 gap-2 z-50">
      {/* Left side: Sidebar toggle and Logo (when collapsed) */}
      <div className="flex items-center">
        {(!open || windowWidth < 768) && <SidebarToggle />}
        {!open && <Logo className="ml-2" spanClassName={isMobile ? "text-sm" : "text-base"} />}
      </div>
      
      {/* Right side: All other elements aligned to the right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 md:h-8 shrink-0"
                  onClick={() => {
                    router.push(`/${agentId}`);
                    router.refresh();
                  }}
                >
                  <PlusIcon size={8} /> New Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">New Chat</TooltipContent>
            </Tooltip>

            {!isReadonly && (
              <VisibilitySelector
                chatId={chatId}
                selectedVisibilityType={selectedVisibilityType}
                className="shrink-0"
              />
            )}

            {/* Model Settings Dropdown */}
            {!isReadonly && (
              <div className="shrink-0">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 relative"
                        >
                          <Sliders className="size-4" />
                          {activeSettingsCount > 0 && (
                            <Badge 
                              variant="secondary" 
                              className="absolute -top-1.5 -right-1.5 size-4 p-0 flex items-center justify-center text-[10px] font-semibold"
                            >
                              {activeSettingsCount}
                            </Badge>
                          )}
                          <span className="sr-only">Model Settings</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Model Settings</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-80">
                    <ModelSettingsContent />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {!isReadonly && (
              <div className="shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 md:h-9 min-w-10 md:px-3 flex items-center justify-center gap-2"
                      asChild
                    >
                      <Link href={`/agents/${agentId}/edit`} className="flex items-center gap-2">
                        <Avatar className="size-6 border border-border relative">
                          {thumbnail_url ? (
                            <div className="w-8 h-8 relative overflow-hidden rounded-full">
                              <Image
                                src={thumbnail_url}
                                alt={agent_display_name || "Agent"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <AvatarFallback className="text-xs">{agent_display_name?.charAt(0) || "A"}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="font-medium text-sm hidden md:inline-block">
                          {agent_display_name || "Agent"}
                        </span>
                        <SettingsIcon />
                        <span className="sr-only">Agent Settings</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Agent Settings</TooltipContent>
                </Tooltip>
              </div>
            )}
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <>
            {!isReadonly && (
              <Button 
                onClick={() => {
                  router.push(`/${agentId}`);
                  router.refresh();
                }}
                variant="outline"
                className="h-8"
              >
                <div className="flex items-center">
                  <PlusIcon size={8} /> 
                  <span className="ml-2">New Chat</span>
                </div>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <EllipsisIcon />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                
                
                {!isReadonly && (
                  <DropdownMenuItem asChild>
                    <Link href={`/agents/${agentId}/edit`} className="flex items-center">
                      <Avatar className="size-4 border border-border relative mr-2">
                        {thumbnail_url ? (
                          <div className="w-8 h-8 relative overflow-hidden rounded-full mr-2 flex-shrink-0">
                            <Image
                              src={thumbnail_url}
                              alt={agent_display_name || "Agent"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <AvatarFallback className="text-xs">{agent_display_name?.charAt(0) || "A"}</AvatarFallback>
                        )}
                      </Avatar>
                      <span>Agent Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {!isReadonly && (
                  <DropdownMenuItem className="p-0">
                    <div className="w-full">
                      <VisibilitySelector
                        chatId={chatId}
                        selectedVisibilityType={selectedVisibilityType}
                        className="w-full"
                      />
                    </div>
                  </DropdownMenuItem>
                )}

                {/* Model Settings for Mobile */}
                {!isReadonly && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sliders className="size-4" />
                          <span>Model Settings</span>
                        </div>
                        {activeSettingsCount > 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {activeSettingsCount} active
                          </Badge>
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-72">
                          <ModelSettingsContent />
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.selectedModelId === nextProps.selectedModelId && 
         prevProps.agent_display_name === nextProps.agent_display_name &&
         prevProps.thumbnail_url === nextProps.thumbnail_url &&
         JSON.stringify(prevProps.modelSettings) === JSON.stringify(nextProps.modelSettings);
});
