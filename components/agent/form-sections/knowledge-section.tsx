"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { KnowledgeEditor } from "../knowledge-editor";

interface KnowledgeItem {
  id: string;
  title: string;
  content: any;
  type: string;
  description: string | null;
  agentId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface KnowledgeSectionProps {
  knowledgeItems: KnowledgeItem[];
  agentId?: string;
  onAddItem: (item: { title: string; content: any; description?: string; type?: string }) => Promise<any>;
  onUpdateItem: (item: { id: string; title?: string; content?: any; description?: string }) => Promise<any>;
  onDeleteItem: (id: string) => Promise<any>;
}

export function KnowledgeSection({
  knowledgeItems,
  agentId,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: KnowledgeSectionProps) {
  return (
    <Card className="shadow-sm border-2">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg font-semibold">Knowledge Base</CardTitle>
        <CardDescription>
          Add knowledge items that your agent can reference during conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <KnowledgeEditor
          knowledgeItems={knowledgeItems}
          agentId={agentId}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
        />
      </CardContent>
    </Card>
  );
} 