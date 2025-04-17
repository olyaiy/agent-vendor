import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
    <main className="space-y-32 bg-[#0A0A0B] text-zinc-100">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#111113] opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#291e16]/30 via-[#171719]/40 to-[#0A0A0B] mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-soft-light"></div>
        <div className="absolute -inset-1 bg-[radial-gradient(circle_at_bottom_left,_rgba(217,119,66,0.15),_transparent_40%)]"></div>
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 text-zinc-50">The Agent Vendor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97742] to-[#F0A875]">Story</span></h1>
          <p className="text-2xl sm:text-3xl max-w-2xl mx-auto mb-12 text-zinc-300/90 font-light">Connecting AI creators with users who need solutions, without writing a single line of code.</p>
          <div className="flex justify-center gap-6">
            <Button size="lg" className="bg-[#171719] hover:bg-[#1E1E21] text-zinc-200 border border-[#2E2E32] shadow-[0_0_15px_rgba(217,119,66,0.1)] hover:shadow-[0_0_25px_rgba(217,119,66,0.2)] backdrop-blur-sm hover:translate-y-[-2px] transition-all" asChild>
              <Link href="/">Start Creating</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-zinc-700 text-zinc-300 hover:bg-[#171719]/30 hover:border-[#D97742]/40 backdrop-blur-sm hover:translate-y-[-2px] transition-all" asChild>
              <Link href="/">Explore Agents</Link>
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A0B] to-transparent"></div>
      </section>
      
      {/* Our Mission */}
      <section className="container mx-auto px-6 space-y-10">
        <h2 className="text-3xl font-bold text-center text-zinc-200">Our <span className="text-[#F0A875]">Mission</span></h2>
        <p className="text-center max-w-3xl mx-auto text-lg text-zinc-400">We strive to democratize AI by connecting domain experts with those who need intelligent, specialized solutions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Card className="text-center border-0 bg-gradient-to-b from-[#171719]/90 to-[#0E0E10]/80 backdrop-blur-md shadow-xl shadow-black/30 border-t border-zinc-800/30 hover:shadow-[#D97742]/5 transition-all hover:translate-y-[-5px] rounded-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#D97742]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader>
              <CardTitle className="text-zinc-200">Empower Experts</CardTitle>
              <CardDescription className="text-zinc-400">Monetize your expertise by creating valuable AI agents.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center border-0 bg-gradient-to-b from-[#171719]/90 to-[#0E0E10]/80 backdrop-blur-md shadow-xl shadow-black/30 border-t border-zinc-800/30 hover:shadow-[#D97742]/5 transition-all hover:translate-y-[-5px] rounded-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#D97742]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader>
              <CardTitle className="text-zinc-200">Connect Users</CardTitle>
              <CardDescription className="text-zinc-400">Discover and deploy AI solutions tailored to your challenges.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center border-0 bg-gradient-to-b from-[#171719]/90 to-[#0E0E10]/80 backdrop-blur-md shadow-xl shadow-black/30 border-t border-zinc-800/30 hover:shadow-[#D97742]/5 transition-all hover:translate-y-[-5px] rounded-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#D97742]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader>
              <CardTitle className="text-zinc-200">Reward Quality</CardTitle>
              <CardDescription className="text-zinc-400">Support a sustainable ecosystem that values high-quality agents.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
      
      {/* Vision */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E0E10] to-[#0A0A0B]"></div>
        <div className="absolute -inset-1 bg-[radial-gradient(circle_at_top_right,_rgba(217,119,66,0.08),_transparent_40%)]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-center text-zinc-200 mb-4">The Future of <span className="text-[#F0A875]">AI</span></h2>
          <p className="text-center max-w-3xl mx-auto text-lg mb-16 text-zinc-400">We envision a world where specialized AI agents handle specific tasks with expertise, freeing humans to focus on what matters most.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            <div className="space-y-4 text-center group">
              <div className="w-16 h-16 rounded-full bg-[#171719] border border-zinc-800 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.2)] group-hover:border-[#D97742]/30 group-hover:shadow-[0_0_30px_rgba(217,119,66,0.15)] transition-all duration-500">
                <span className="text-[#F0A875] opacity-80 group-hover:opacity-100 transition-opacity">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-200">Specialized Knowledge</h3>
              <p className="text-zinc-400">AI agents tailored to specific domains for expert-level performance.</p>
            </div>
            <div className="space-y-4 text-center group">
              <div className="w-16 h-16 rounded-full bg-[#171719] border border-zinc-800 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.2)] group-hover:border-[#D97742]/30 group-hover:shadow-[0_0_30px_rgba(217,119,66,0.15)] transition-all duration-500">
                <span className="text-[#F0A875] opacity-80 group-hover:opacity-100 transition-opacity">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-200">Democratized Value</h3>
              <p className="text-zinc-400">Fair compensation ensures creators are rewarded for their work.</p>
            </div>
            <div className="space-y-4 text-center group">
              <div className="w-16 h-16 rounded-full bg-[#171719] border border-zinc-800 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.2)] group-hover:border-[#D97742]/30 group-hover:shadow-[0_0_30px_rgba(217,119,66,0.15)] transition-all duration-500">
                <span className="text-[#F0A875] opacity-80 group-hover:opacity-100 transition-opacity">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-zinc-200">Responsible AI</h3>
              <p className="text-zinc-400">Privacy and security at the core of every solution.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* For Creators */}
      <section className="container mx-auto px-6 space-y-10">
        <h2 className="text-3xl font-bold text-center text-zinc-200">For <span className="text-[#F0A875]">Creators</span></h2>
        <p className="text-center max-w-3xl mx-auto text-lg text-zinc-400">Turn your AI expertise into a passive income stream by building specialized agents.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 border border-zinc-800/40 rounded-xl bg-[#111113]/70 backdrop-blur-sm hover:shadow-lg hover:shadow-black/30 hover:border-zinc-700/60 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D97742]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-200">Design Your AI Agent</h3>
            <p className="text-zinc-400">Create powerful AI agents by defining intelligence, personality, and capabilities—no coding required.</p>
          </div>
          <div className="p-6 border border-zinc-800/40 rounded-xl bg-[#111113]/70 backdrop-blur-sm hover:shadow-lg hover:shadow-black/30 hover:border-zinc-700/60 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D97742]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-200">Join the Marketplace</h3>
            <p className="text-zinc-400">List your agent among top AI solutions and reach thousands of users.</p>
          </div>
          <div className="p-6 border border-zinc-800/40 rounded-xl bg-[#111113]/70 backdrop-blur-sm hover:shadow-lg hover:shadow-black/30 hover:border-zinc-700/60 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D97742]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-200">Generate Income</h3>
            <p className="text-zinc-400">Earn 10% of token usage whenever someone interacts with your agent.</p>
          </div>
          <div className="p-6 border border-zinc-800/40 rounded-xl bg-[#111113]/70 backdrop-blur-sm hover:shadow-lg hover:shadow-black/30 hover:border-zinc-700/60 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D97742]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <h3 className="text-2xl font-semibold mb-4 text-zinc-200">Scale Your Business</h3>
            <p className="text-zinc-400">Iterate with user feedback and grow your portfolio to generate revenue 24/7.</p>
          </div>
        </div>
        <div className="text-center mt-12">
          <Button size="lg" className="bg-[#171719] hover:bg-[#1E1E21] text-zinc-200 border border-[#2E2E32] shadow-[0_0_15px_rgba(217,119,66,0.1)] hover:shadow-[0_0_25px_rgba(217,119,66,0.2)] backdrop-blur-sm px-8 py-6 text-lg hover:translate-y-[-2px] transition-all" asChild>
            <Link href="/creators/start">Start Creating Today</Link>
          </Button>
        </div>
      </section>
      
      {/* For Users */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0F] to-[#0A0A0B]"></div>
        <div className="absolute -inset-1 bg-[radial-gradient(circle_at_bottom_left,_rgba(217,119,66,0.08),_transparent_40%)]"></div>
        <div className="container mx-auto px-6 space-y-10 relative z-10">
          <h2 className="text-3xl font-bold text-center text-zinc-200">For <span className="text-[#F0A875]">Users</span></h2>
          <p className="text-center max-w-3xl mx-auto text-lg text-zinc-400">Discover specialized AI agents built by domain experts to solve your unique challenges.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="p-8 border border-zinc-800/40 rounded-2xl bg-[#0F0F11]/80 backdrop-blur-sm shadow-lg shadow-black/30">
              <h3 className="text-2xl font-semibold mb-6 text-zinc-200">Access Specialized Expertise</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[#F0A875] mt-1 opacity-80">•</span>
                  <span className="text-zinc-400">Domain-specific AI built with nuance.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F0A875] mt-1 opacity-80">•</span>
                  <span className="text-zinc-400">Curated marketplace of high-quality agents.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F0A875] mt-1 opacity-80">•</span>
                  <span className="text-zinc-400">Ratings and reviews from real users.</span>
                </li>
              </ul>
            </div>
            <div className="p-8 border border-zinc-800/40 rounded-2xl bg-[#0F0F11]/80 backdrop-blur-sm shadow-lg shadow-black/30">
              <h3 className="text-2xl font-semibold mb-6 text-zinc-200">Transparent & Fair Pricing</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[#F0A875] mt-1 opacity-80">•</span>
                  <span className="text-zinc-400">No subscriptions or hidden fees.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F0A875] mt-1 opacity-80">•</span>
                  <span className="text-zinc-400">Free tokens for new users.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F0A875] mt-1 opacity-80">•</span>
                  <span className="text-zinc-400">Only pay for successful interactions.</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-zinc-700 text-zinc-300 hover:bg-[#171719]/30 hover:border-[#D97742]/40 backdrop-blur-sm px-8 py-6 text-lg hover:translate-y-[-2px] transition-all" asChild>
              <Link href="/agents">Find Your AI Agent</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="container mx-auto px-6 space-y-12">
        <h2 className="text-3xl font-bold text-center text-zinc-200">How Our <span className="text-[#F0A875]">Ecosystem</span> Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="p-6 border border-zinc-800/40 rounded-xl bg-[#111113]/70 backdrop-blur-sm hover:shadow-lg hover:shadow-black/30 transition-all relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#D97742]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#171719] border border-zinc-800 flex items-center justify-center mb-4 shadow-md shadow-black/20 group-hover:border-[#D97742]/30 transition-all">
                <span className="text-zinc-400 font-medium group-hover:text-[#F0A875]/80 transition-colors">01</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-zinc-200">Users Access AI</h3>
              <p className="text-zinc-400">Purchase tokens and engage with agents, paying only for what you use.</p>
            </div>
          </div>
          <div className="p-6 border border-zinc-800/40 rounded-xl bg-[#111113]/70 backdrop-blur-sm hover:shadow-lg hover:shadow-black/30 transition-all relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#D97742]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#171719] border border-zinc-800 flex items-center justify-center mb-4 shadow-md shadow-black/20 group-hover:border-[#D97742]/30 transition-all">
                <span className="text-zinc-400 font-medium group-hover:text-[#F0A875]/80 transition-colors">02</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-zinc-200">Token Economics</h3>
              <p className="text-zinc-400">Costs include AI provider fee, 18% premium, and $0.30 transaction fee.</p>
            </div>
          </div>
          <div className="p-6 border border-zinc-800/40 rounded-xl bg-[#111113]/70 backdrop-blur-sm hover:shadow-lg hover:shadow-black/30 transition-all relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#D97742]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#171719] border border-zinc-800 flex items-center justify-center mb-4 shadow-md shadow-black/20 group-hover:border-[#D97742]/30 transition-all">
                <span className="text-zinc-400 font-medium group-hover:text-[#F0A875]/80 transition-colors">03</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-zinc-200">Creator Rewards</h3>
              <p className="text-zinc-400">Creators earn 10% of token usage, paid monthly with transparent analytics.</p>
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto">
          <Card className="border-0 bg-gradient-to-b from-[#16161A]/90 to-[#0D0D0F]/90 backdrop-blur-md shadow-xl shadow-black/30 border-t border-zinc-800/40 overflow-hidden group">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D97742]/20 to-transparent transform translate-y-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader>
              <CardTitle className="text-zinc-200 text-center">Example Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-zinc-800/30 pb-2">
                  <span className="text-zinc-400">User Pays</span>
                  <span className="font-medium text-zinc-300">$10.00</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/30 pb-2">
                  <span className="text-zinc-400">Creator Receives</span>
                  <span className="font-medium text-zinc-300">$0.85</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-zinc-400">Platform Fee</span>
                  <span className="font-medium text-zinc-300">$0.68</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-500 text-center">Note: Transactions include a $0.30 processing fee.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0A0B]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,119,66,0.10),_transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-soft-light"></div>
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent"></div>
        <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
          <h2 className="text-4xl font-bold text-zinc-100">Ready to Join the <span className="text-[#F0A875]">AI Agent</span> Economy?</h2>
          <p className="max-w-2xl mx-auto text-lg text-zinc-400">Whether you&apos;re creating AI agents or using them to solve problems, Agent Vendor connects experts with those who need their knowledge.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8">
            <Button size="lg" className="bg-[#171719] hover:bg-[#1E1E21] text-zinc-200 border border-[#2E2E32] shadow-[0_0_15px_rgba(217,119,66,0.1)] hover:shadow-[0_0_25px_rgba(217,119,66,0.2)] backdrop-blur-sm px-8 py-6 text-lg hover:translate-y-[-2px] transition-all" asChild>
              <Link href="/creators/start">Get Started Today</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-zinc-700 text-zinc-300 hover:bg-[#171719]/30 hover:border-[#D97742]/40 backdrop-blur-sm px-8 py-6 text-lg hover:translate-y-[-2px] transition-all" asChild>
              <Link href="/faq">Explore FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
