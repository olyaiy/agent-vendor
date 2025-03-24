"use client";

import React from "react";
import { OverviewEditor } from "../customization-editor";

interface WelcomeScreenSectionProps {
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

export function WelcomeScreenSection({ overview, onChange }: WelcomeScreenSectionProps) {
  return (
    <OverviewEditor 
      overview={overview} 
      onChange={onChange} 
    />
  );
} 