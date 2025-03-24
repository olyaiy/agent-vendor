"use client";

import React from "react";
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
    <WelcomeScreenSection
      overview={overview}
      onChange={onChange}
    />
  );
} 