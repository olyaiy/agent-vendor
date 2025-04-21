import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About Agent Vendor | AI Solutions Marketplace',
  description: 'Learn how Agent Vendor connects AI creators with users, democratizing AI and creating a sustainable ecosystem.',
  keywords: ['AI', 'Marketplace', 'Creators', 'Solutions', 'Agent Vendor', 'About'],
  openGraph: {
    title: 'About Agent Vendor',
    description: 'Learn how Agent Vendor connects AI creators with users, democratizing AI and creating a sustainable ecosystem.',
    url: 'https://www.agentvendor.com/about',
    images: [
      {
        url: 'https://www.agentvendor.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Agent Vendor About',
      },
    ],
    siteName: 'Agent Vendor',
    locale: 'en_US',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <main className="bg-black text-white">
      {/* Unified Container with Consistent Padding and Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0A0B]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(217,119,66,0.08),_transparent_70%)] opacity-60"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent"></div>

        <div className="container mx-auto px-6 relative z-10 space-y-24 py-32">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-medium mb-6 tracking-tight">
              The Agent Vendor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97742] to-[#F0A875]">Mission</span>
            </h1>
            <p className="text-xl sm:text-2xl max-w-2xl mb-12 text-zinc-400 font-light">
              Connecting AI creators with users who need solutions, without writing a single line of code.
            </p>
            <div className="flex gap-5">
              <Button size="lg" className="bg-black text-white border border-zinc-800 hover:border-[#D97742]/50 hover:shadow-[0_0_25px_rgba(217,119,66,0.15)] transition-all duration-300" asChild>
                <Link href="/">Start Creating</Link>
              </Button>
              <Button variant="outline" size="lg" className="border-zinc-800 text-zinc-400 hover:bg-black/30 hover:border-zinc-700 transition-all duration-300" asChild>
                <Link href="/">Explore Agents</Link>
              </Button>
            </div>
          </div>

          {/* Mission Content - Simplified without cards */}
          <div className="max-w-5xl mx-auto border-t border-zinc-800/40 pt-16">
            <h2 className="text-3xl font-medium mb-12 text-white">Our <span className="text-[#D97742]">Mission</span></h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              {[
                { title: 'Empower Experts', desc: 'Monetize expertise by creating valuable AI agents.' },
                { title: 'Connect Users', desc: 'Discover and deploy solutions tailored to your challenges.' },
                { title: 'Reward Quality', desc: 'Support a sustainable ecosystem valuing high-quality agents.' }
              ].map((item, index) => (
                <div key={index} className="group">
                  <h3 className="text-lg font-normal mb-3 text-white">{item.title}</h3>
                  <p className="text-zinc-400 font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vision Content - With circular icons */}
          <div className="max-w-5xl mx-auto border-t border-zinc-800/40 pt-16">
            <h2 className="text-3xl font-medium mb-12 text-white">The Future of <span className="text-[#D97742]">AI</span></h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              {[
                { icon: '✨', title: 'Specialized Knowledge', desc: 'Domain-specific AI agents with expert-level performance.' },
                { icon: '💰', title: 'Democratized Value', desc: 'Fair compensation ensuring creators are rewarded for their work.' },
                { icon: '🛡️', title: 'Responsible AI', desc: 'Privacy and security at the core of every solution.' }
              ].map((item, index) => (
                <div key={index} className="group">
                  <div className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center mb-5 group-hover:border-[#D97742]/30 transition-all duration-500">
                    <span className="text-lg text-[#D97742] opacity-80">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-medium mb-3 text-white">{item.title}</h3>
                  <p className="text-zinc-400 font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* For Creators - Two column layout with subtle highlights */}
          <div className="max-w-5xl mx-auto border-t border-zinc-800/40 pt-16">
            <div className="flex flex-col md:flex-row md:items-start gap-16">
              <div className="md:w-1/3">
                <h2 className="text-3xl font-medium mb-4 text-white">For <span className="text-[#D97742]">Creators</span></h2>
                <p className="text-zinc-400 font-light mb-6">Turn your AI expertise into a passive income stream by building specialized agents.</p>
                <Button size="lg" className="bg-black text-white border border-zinc-800 hover:border-[#D97742]/50 hover:shadow-[0_0_25px_rgba(217,119,66,0.15)] transition-all duration-300" asChild>
                  <Link href="/creators/start">Start Creating</Link>
                </Button>
              </div>
              
              <div className="md:w-2/3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    { title: 'Design Your AI Agent', desc: 'Create powerful AI agents by defining intelligence, personality, and capabilities—no coding required.' },
                    { title: 'Join the Marketplace', desc: 'List your agent among top AI solutions and reach thousands of users.' },
                    { title: 'Generate Income', desc: 'Earn 10% of token usage whenever someone interacts with your agent.' },
                    { title: 'Scale Your Business', desc: 'Iterate with user feedback and grow your portfolio to generate revenue 24/7.' }
                  ].map((item, index) => (
                    <div key={index} className="group relative pb-6">
                      <div className="absolute top-0 left-0 w-8 h-[1px] bg-[#D97742]/30"></div>
                      <h3 className="text-base font-medium mb-2 mt-3 text-white">{item.title}</h3>
                      <p className="text-zinc-400 text-sm font-light">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* For Users - Simplified with inline lists */}
          <div className="max-w-5xl mx-auto border-t border-zinc-800/40 pt-16">
            <div className="flex flex-col md:flex-row md:items-start gap-16">
              <div className="md:w-1/3">
                <h2 className="text-3xl font-medium mb-4 text-white">For <span className="text-[#D97742]">Users</span></h2>
                <p className="text-zinc-400 font-light mb-6">Discover specialized AI agents built by domain experts to solve your unique challenges.</p>
                <Button variant="outline" size="lg" className="border-zinc-800 text-zinc-400 hover:bg-black/30 hover:border-zinc-700 transition-all duration-300" asChild>
                  <Link href="/agents">Find Your Agent</Link>
                </Button>
              </div>
              
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-base font-medium mb-4 text-white border-b border-zinc-800/50 pb-2">Access Specialized Expertise</h3>
                  <ul className="space-y-3">
                    {['Domain-specific AI built with nuance', 'Curated marketplace of high-quality agents', 'Ratings and reviews from real users'].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-[#D97742] mt-1 leading-none opacity-80">—</span>
                        <span className="text-zinc-400 font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-medium mb-4 text-white border-b border-zinc-800/50 pb-2">Transparent & Fair Pricing</h3>
                  <ul className="space-y-3">
                    {['No subscriptions or hidden fees', 'Free tokens for new users', 'Only pay for successful interactions'].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-[#D97742] mt-1 leading-none opacity-80">—</span>
                        <span className="text-zinc-400 font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works - With example transaction integrated */}
          <div className="max-w-5xl mx-auto border-t border-zinc-800/40 pt-16">
            <h2 className="text-3xl font-medium mb-12 text-white">How Our <span className="text-[#D97742]">Ecosystem</span> Works</h2>
            
            <div className="flex flex-col-reverse md:flex-row gap-12">
              <div className="md:w-2/3">
                <div className="grid grid-cols-1 gap-8">
                  {[
                    { step: '01', title: 'Users Access AI', desc: 'Purchase tokens and engage with agents, paying only for what you use.' },
                    { step: '02', title: 'Token Economics', desc: 'Costs include AI provider fee, 18% premium, and $0.30 transaction fee.' },
                    { step: '03', title: 'Creator Rewards', desc: 'Creators earn 10% of token usage, paid monthly with transparent analytics.' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 group">
                      <div className="text-sm text-zinc-500 font-light pt-1 w-6">{item.step}</div>
                      <div>
                        <h3 className="text-base font-medium mb-1 text-white">{item.title}</h3>
                        <p className="text-zinc-400 text-sm font-light">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:w-1/3">
                <div className="p-6 border border-zinc-800/40 rounded-sm bg-zinc-900/30 backdrop-blur-md">
                  <h3 className="text-base font-normal mb-5 text-white border-b border-zinc-800/60 pb-2">Example Transaction</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 text-sm font-light">User Pays</span>
                      <span className="font-normal text-white">$10.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 text-sm font-light">Creator Receives</span>
                      <span className="font-normal text-[#D97742]">$0.85</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 text-sm font-light">Platform Fee</span>
                      <span className="font-normal text-white">$0.68</span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-zinc-500 font-light">Transactions include a $0.30 processing fee.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA - Refined minimalist approach */}
          <div className="max-w-3xl mx-auto border-t border-zinc-800/40 pt-16">
            <h2 className="text-3xl sm:text-4xl font-medium mb-6 text-white">Ready to Join the <span className="text-[#D97742]">AI Agent</span> Economy?</h2>
            <p className="mb-12 text-zinc-400 font-light">Whether you&apos;re creating AI agents or using them to solve problems, Agent Vendor connects experts with those who need their knowledge.</p>
            <div className="flex gap-5">
              <Button size="lg" className="bg-black text-white border border-zinc-800 hover:border-[#D97742]/50 hover:shadow-[0_0_25px_rgba(217,119,66,0.15)] transition-all duration-300" asChild>
                <Link href="/creators/start">Get Started Today</Link>
              </Button>
              <Button variant="outline" size="lg" className="border-zinc-800 text-zinc-400 hover:bg-black/30 hover:border-zinc-700 transition-all duration-300" asChild>
                <Link href="/faq">Explore FAQ</Link>
              </Button>
            </div>
          </div>
        </div> 
      </div> 
    </main>
  );
}
