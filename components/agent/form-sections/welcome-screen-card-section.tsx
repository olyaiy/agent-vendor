"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { WelcomeScreenSection } from "./welcome-screen-section";

interface WelcomeScreenCardSectionProps {
  overview: {
    title: string;
    content: string;
    showPoints: boolean;
    points: string[];
  };
  onChange: (overview: {
    title: string;
    content: string;
    showPoints: boolean;
    points: string[];
  }) => void;
}

export function WelcomeScreenCardSection({ 
  overview, 
  onChange 
}: WelcomeScreenCardSectionProps) {
  return (
    <Card className="shadow-sm border-2">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg font-semibold">Customize Welcome Screen</CardTitle>
        <CardDescription>
          Personalize what users see when they first interact with your agent
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <WelcomeScreenSection 
          overview={overview} 
          onChange={onChange} 
        />
      </CardContent>
    </Card>
  );
} 