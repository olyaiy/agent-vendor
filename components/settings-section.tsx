'use client';

import { useState, memo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Settings, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ModelSelect } from '@/components/model-select';

interface SettingsSectionProps {
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
}

function SettingsSectionComponent({ selectedModelId, setSelectedModelId }: SettingsSectionProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Default closed

  return (
    <Collapsible
      open={isSettingsOpen}
      onOpenChange={setIsSettingsOpen}
      className="group"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Agent Settings</span>
        </div>
        <div className="flex items-center gap-1">
          <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3 space-y-5">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">AI Model</label>
          <ModelSelect
            defaultValue={selectedModelId} // Use prop for default value
            onValueChange={setSelectedModelId} // Use prop for change handler
          />
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">Temperature</label>
            <span className="text-xs text-muted-foreground">0.7</span> {/* Static display value */}
          </div>
          <Slider
            defaultValue={[0.7]}
            max={1}
            step={0.1}
            className="w-full"
            // Consider adding onValueChange prop if needed later
          />
          <p className="text-xs text-muted-foreground mt-1">Creativity vs precision</p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">Max Tokens</label>
            <span className="text-xs text-muted-foreground">4000</span> {/* Static display value */}
          </div>
          <Slider
            defaultValue={[4000]}
            max={8000}
            step={100}
            className="w-full"
            // Consider adding onValueChange prop if needed later
          />
          <p className="text-xs text-muted-foreground mt-1">Maximum output length</p>
        </div>

        {/* Context Length */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">Context Length</label>
            <span className="text-xs text-muted-foreground">16K</span> {/* Static display value */}
          </div>
          <Select defaultValue="16k"> {/* Consider adding onValueChange prop if needed later */}
            <SelectTrigger className="w-full bg-muted/30 border-0 focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="Select context length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8k">8K tokens</SelectItem>
              <SelectItem value="16k">16K tokens</SelectItem>
              <SelectItem value="32k">32K tokens</SelectItem>
              <SelectItem value="64k">64K tokens</SelectItem>
              <SelectItem value="128k">128K tokens</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Memory capacity for conversation</p>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-medium">Advanced Options</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="streaming" className="text-sm">Response Streaming</Label>
              <p className="text-xs text-muted-foreground">Display responses as they&#39;re generated</p>
            </div>
            <Switch id="streaming" defaultChecked /> {/* Consider adding onCheckedChange prop if needed later */}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tool-use" className="text-sm">Tool Use</Label>
              <p className="text-xs text-muted-foreground">Allow agent to use external tools</p>
            </div>
            <Switch id="tool-use" defaultChecked /> {/* Consider adding onCheckedChange prop if needed later */}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="web-access" className="text-sm">Web Access</Label>
              <p className="text-xs text-muted-foreground">Enable browsing capabilities</p>
            </div>
            <Switch id="web-access" defaultChecked /> {/* Consider adding onCheckedChange prop if needed later */}
          </div>
        </div>

        {/* API Settings */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs text-muted-foreground">API Key</label>
            <Badge variant="outline" className="text-xs font-normal">Connected</Badge> {/* Static display */}
          </div>
          <Select defaultValue="default"> {/* Consider adding onValueChange prop if needed later */}
            <SelectTrigger className="w-full bg-muted/30 border-0 focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="Select API source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Use default key</SelectItem>
              <SelectItem value="custom">Use custom key</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const SettingsSection = memo(SettingsSectionComponent);
