import { MainFooter } from "@/components/layout/main-footer";
import { Suspense } from "react";
import { AgentListSkeleton } from "@/components/agent/agent-list-skeleton";
import { HeroBanner } from "@/components/home/hero-banner";
import { AgentContainer } from "@/components/agent/agent-container";
import { FeatureSteps } from "@/components/blocks/feature-section";

export default function Page() {

    return (
        <>
            <div className="container mx-auto p-4">
                {/* <HeroBanner /> */}
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
    step: 'For Creators', 
    title: 'For Creators',
    content: 'Build specialized AI agents and monetize your expertise.', 
    image: 'https://images.unsplash.com/photo-1723958929247-ef054b525153?q=80&w=2070&auto=format&fit=crop' 
  },
  { 
    step: 'For Users',
    title: 'For Users',
    content: 'Discover and access tailored AI solutions for your specific needs',
    image: 'https://images.unsplash.com/photo-1723931464622-b7df7c71e380?q=80&w=2070&auto=format&fit=crop'
  },
  { 
    step: 'For Everyone',
    title: 'For Everyone',
    content: 'Enjoy a world where everyone can prosper from AI.',
    image: 'https://images.unsplash.com/photo-1725961476494-efa87ae3106a?q=80&w=2070&auto=format&fit=crop'
  },
]

