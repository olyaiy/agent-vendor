"use client"; // This component needs client-side interactivity for the input

import React from 'react';
import { AgentSearchInput } from "@/components/agent-search-input";

/**
 * Component responsible for rendering the agent search input.
 * It's a client component to handle potential future state or effects related to search input.
 */
export function AgentSearch() {
  // Currently just renders the input, but can be expanded with client-side logic
  // (e.g., debouncing, suggestions) if needed later.
  return <AgentSearchInput />;
}
