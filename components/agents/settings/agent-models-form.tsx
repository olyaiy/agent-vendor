import { FormSection } from '@/components/form-section';
import { AgentModel } from '@/db/schema/agent';
import React from 'react'

interface AgentModelsFormProps {
    agentModels: AgentModel[];
    agentId: string;
    allModels: AgentModel[];
}

const AgentModelsForm = ({ agentModels, agentId, allModels }: AgentModelsFormProps) => {
  return (
    <FormSection title="Intelligence" description="Choose the AI model behind your agent.">
      <div>
        <pre>{JSON.stringify(agentModels, null, 2)}</pre>
        <pre>{JSON.stringify(agentId, null, 2)}</pre>
        <pre>{JSON.stringify(allModels, null, 2)}</pre>
      </div>
    </FormSection>
  )
}

export default AgentModelsForm
