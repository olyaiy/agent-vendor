// components/agent-info.tsx
'use client'

export function AgentInfo() {
  return (
    <div className="h-full p-4 space-y-4">
      {/* Full-width Image */}
      <div className="w-full aspect-square bg-gray-200 rounded-lg" />

      {/* Left-aligned Content */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Your AI-powered assistant for code generation, debugging, and documentation.
        </p>
      </div>
    </div>
  )
}