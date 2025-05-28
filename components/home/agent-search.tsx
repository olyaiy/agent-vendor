"use client"; // This component needs client-side interactivity for the input

import React from 'react';
import { AgentSearchInput } from "@/components/agent-search-input";

/**
 * Component responsible for rendering the agent search section.
 * Includes a title and search input with consistent spacing and visual hierarchy.
 */
export function AgentSearch() {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-medium mb-3">Search Agents</h3>
      <AgentSearchInput />
    </section>
  );
}
