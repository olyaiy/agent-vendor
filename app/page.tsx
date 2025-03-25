import { MainFooter } from "@/components/layout/main-footer";
import { Suspense } from "react";
import { AgentListSkeleton } from "@/components/agent/agent-list-skeleton";

import { AgentContainer } from "@/components/agent/agent-container";
import { FeatureSteps } from "@/components/blocks/feature-section";

export default function Page() {



    return (
        <>
            <div className="container mx-auto p-4">

                <FeatureSteps 
                    features={features}
                    title="What is Agent Vendor?"
                    autoPlayInterval={5000}
                    imageHeight="h-[500px]"
                />
                
                <div id="agent-list">
                    <Suspense fallback={<AgentListSkeleton />}>
                        <AgentContainer />
                    </Suspense>
                </div>
            </div>
            <MainFooter />
        </>
    );
}






const features = [
  { 
    step: 'BUILD CUSTOM AGENTS', 
    title: 'Build Custom Agents',
    content: 'Build specialized AI agents and monetize your expertise. No Coding Required.', 
    image: '/marketing/step-1.gif'
  },
  { 
    step: 'DISCOVER NEW AGENTS',
    title: 'Discover New Agents',
    content: 'Discover and access tailored AI chatbots for your specific needs',
    image: '/marketing/step-2.png'
  },
  { 
    step: 'Deeply Customizable',
    title: 'Deeply Customizable',
    content: 'Choose custom tools, models, prompts, and more.',
    image: '/marketing/step-3.png'
  },
]

