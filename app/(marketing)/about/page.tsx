import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Define reusable color classes based on Sleek Nocturne
const colors = {
  background: 'bg-black', // Deep matte black
  textBase: 'text-gray-200', // Lighter grey for readability on black
  textMuted: 'text-gray-400', // Smoked grey for less emphasis
  accentOrange: 'text-[#D97742]', // Burnt orange
  accentAmber: 'text-[#F0A875]', // Warm amber
  accentCopper: 'text-[#B87333]', // Molten copper (example)
  surfacePrimary: 'bg-gray-900', // Dark smoked grey surface
  surfaceSecondary: 'bg-gray-800/60', // Slightly lighter, semi-transparent surface
  borderSubtle: 'border-gray-700',
  borderAccent: 'border-[#D97742]/50',
  gradientAccent: 'bg-gradient-to-r from-[#D97742] to-[#F0A875]',
  glowAccent: 'shadow-[0_0_25px_rgba(217,119,66,0.2)]', // Amber/Orange glow
};

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
        url: 'https://www.agentvendor.com/og-image.jpg', // Keep existing OG image for now
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
    <main className={`space-y-32 ${colors.background} ${colors.textBase}`}>
      {/* Hero */}
      <section className="relative py-32 overflow-hidden border-b border-gray-900">
        {/* Removed multiple complex backgrounds, simplifying to a dark base with subtle gradient */}
        <div className={`absolute inset-0 ${colors.surfacePrimary} opacity-95`}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50"></div>
        {/* Refined radial gradient for a focused warm glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,119,66,0.1),_transparent_60%)] opacity-80"></div>
         {/* Subtle noise */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
        {/* Top border subtle highlight */}
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className={`text-5xl sm:text-7xl font-bold mb-6 ${colors.textBase} tracking-tight`}>
            The Agent Vendor <span className={`text-transparent bg-clip-text ${colors.gradientAccent}`}>Story</span>
          </h1>
          <p className={`text-2xl sm:text-3xl max-w-3xl mx-auto mb-12 ${colors.textMuted} font-light`}>
            Connecting AI creators with users who need solutions, without writing a single line of code.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            {/* Primary Button - Darker base, accent glow */}
            <Button size="lg" className={`bg-gray-900 hover:bg-gray-800 ${colors.textBase} border ${colors.borderSubtle} hover:${colors.borderAccent} ${colors.glowAccent} hover:shadow-[0_0_35px_rgba(217,119,66,0.3)] backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 ease-in-out px-8 py-3`} asChild>
              <Link href="/">Start Creating</Link>
            </Button>
            {/* Secondary Button - Outline, accent hover */}
            <Button variant="outline" size="lg" className={`border-gray-700 ${colors.textMuted} hover:bg-gray-900/50 hover:${colors.borderAccent} hover:${colors.textBase} backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 ease-in-out px-8 py-3`} asChild>
              <Link href="/">Explore Agents</Link>
            </Button>
          </div>
        </div>
         {/* Bottom fade */}
        <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent`}></div>
      </section>

      {/* Our Mission */}
      <section className="container mx-auto px-6 space-y-12">
        <h2 className={`text-4xl font-bold text-center ${colors.textBase}`}>Our <span className={colors.accentAmber}>Mission</span></h2>
        <p className={`text-center max-w-3xl mx-auto text-xl ${colors.textMuted}`}>We strive to democratize AI by connecting domain experts with those who need intelligent, specialized solutions.</p>
        {/* Updated Card Styling - More subtle, focus on border/glow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { title: 'Empower Experts', desc: 'Monetize your expertise by creating valuable AI agents.' },
            { title: 'Connect Users', desc: 'Discover and deploy AI solutions tailored to your challenges.' },
            { title: 'Reward Quality', desc: 'Support a sustainable ecosystem that values high-quality agents.' }
          ].map((item, index) => (
            <Card key={index} className={`text-center border ${colors.borderSubtle}/60 ${colors.surfacePrimary} bg-opacity-80 backdrop-blur-lg shadow-xl shadow-black/40 hover:shadow-black/60 hover:${colors.borderAccent} transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden group`}>
              {/* Subtle accent glow from bottom on hover */}
              <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#D97742]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <CardHeader className="pt-8 pb-6">
                <CardTitle className={`${colors.textBase} text-xl`}>{item.title}</CardTitle>
                <CardDescription className={`${colors.textMuted} mt-2`}>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="py-24 relative border-y border-gray-900">
        <div className={`absolute inset-0 ${colors.surfacePrimary}`}></div>
        {/* Different radial gradient for variation */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(217,119,66,0.06),_transparent_50%)] opacity-90"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className={`text-4xl font-bold text-center ${colors.textBase} mb-6`}>The Future of <span className={colors.accentAmber}>AI</span></h2>
          <p className={`text-center max-w-3xl mx-auto text-xl mb-20 ${colors.textMuted}`}>We envision a world where specialized AI agents handle specific tasks with expertise, freeing humans to focus on what matters most.</p>
          {/* Updated Vision Item Styling */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-16">
            {[
              { icon: '✨', title: 'Specialized Knowledge', desc: 'AI agents tailored to specific domains for expert-level performance.' },
              { icon: '💰', title: 'Democratized Value', desc: 'Fair compensation ensures creators are rewarded for their work.' },
              { icon: '🛡️', title: 'Responsible AI', desc: 'Privacy and security at the core of every solution.' }
            ].map((item, index) => (
              <div key={index} className="space-y-5 text-center group">
                {/* Icon container - brushed metal feel with accent border */}
                <div className={`w-16 h-16 rounded-full ${colors.surfaceSecondary} border ${colors.borderSubtle} mx-auto flex items-center justify-center shadow-lg shadow-black/30 group-hover:border-[#F0A875]/40 group-hover:shadow-[0_0_20px_rgba(240,168,117,0.15)] transition-all duration-300`}>
                  <span className={`text-2xl ${colors.accentAmber} opacity-80 group-hover:opacity-100 transition-opacity`}>{item.icon}</span>
                </div>
                <h3 className={`text-xl font-semibold ${colors.textBase}`}>{item.title}</h3>
                <p className={`${colors.textMuted}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="container mx-auto px-6 space-y-12">
        <h2 className={`text-4xl font-bold text-center ${colors.textBase}`}>For <span className={colors.accentAmber}>Creators</span></h2>
        <p className={`text-center max-w-3xl mx-auto text-xl ${colors.textMuted}`}>Turn your AI expertise into a passive income stream by building specialized agents.</p>
        {/* Updated Creator Card Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: 'Design Your AI Agent', desc: 'Create powerful AI agents by defining intelligence, personality, and capabilities—no coding required.' },
            { title: 'Join the Marketplace', desc: 'List your agent among top AI solutions and reach thousands of users.' },
            { title: 'Generate Income', desc: 'Earn 10% of token usage whenever someone interacts with your agent.' },
            { title: 'Scale Your Business', desc: 'Iterate with user feedback and grow your portfolio to generate revenue 24/7.' }
          ].map((item, index) => (
            <div key={index} className={`p-8 border ${colors.borderSubtle}/60 rounded-xl ${colors.surfacePrimary} bg-opacity-70 backdrop-blur-md hover:shadow-xl hover:shadow-black/50 hover:${colors.borderAccent}/70 transition-all group relative overflow-hidden hover:-translate-y-1 duration-300`}>
              {/* Subtle corner gradient accent */}
              <div className={`absolute top-0 left-0 w-1/4 h-1/4 bg-gradient-to-br from-[#D97742]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-xl pointer-events-none`}></div>
              <h3 className={`text-2xl font-semibold mb-4 ${colors.textBase}`}>{item.title}</h3>
              <p className={`${colors.textMuted}`}>{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center pt-6">
          {/* Reusing Hero Primary Button Style */}
          <Button size="lg" className={`bg-gray-900 hover:bg-gray-800 ${colors.textBase} border ${colors.borderSubtle} hover:${colors.borderAccent} ${colors.glowAccent} hover:shadow-[0_0_35px_rgba(217,119,66,0.3)] backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 ease-in-out px-10 py-4 text-lg`} asChild>
            <Link href="/creators/start">Start Creating Today</Link>
          </Button>
        </div>
      </section>

      {/* For Users */}
      <section className="py-24 relative border-y border-gray-900">
        <div className={`absolute inset-0 ${colors.surfacePrimary}`}></div>
        {/* Another subtle radial gradient variation */}
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(217,119,66,0.07),_transparent_50%)] opacity-90"></div>
        <div className="container mx-auto px-6 space-y-12 relative z-10">
          <h2 className={`text-4xl font-bold text-center ${colors.textBase}`}>For <span className={colors.accentAmber}>Users</span></h2>
          <p className={`text-center max-w-3xl mx-auto text-xl ${colors.textMuted}`}>Discover specialized AI agents built by domain experts to solve your unique challenges.</p>
           {/* Updated User Card Styling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {[
              { title: 'Access Specialized Expertise', items: ['Domain-specific AI built with nuance.', 'Curated marketplace of high-quality agents.', 'Ratings and reviews from real users.'] },
              { title: 'Transparent & Fair Pricing', items: ['No subscriptions or hidden fees.', 'Free tokens for new users.', 'Only pay for successful interactions.'] }
            ].map((section, index) => (
              <div key={index} className={`p-10 border ${colors.borderSubtle}/50 rounded-2xl ${colors.surfaceSecondary} backdrop-blur-lg shadow-lg shadow-black/40`}>
                <h3 className={`text-2xl font-semibold mb-8 ${colors.textBase}`}>{section.title}</h3>
                <ul className="space-y-4">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className={`${colors.accentAmber} mt-1 text-xl leading-none opacity-80`}>•</span>
                      <span className={`${colors.textMuted}`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center pt-6">
             {/* Reusing Hero Secondary Button Style */}
            <Button variant="outline" size="lg" className={`border-gray-700 ${colors.textMuted} hover:bg-gray-900/50 hover:${colors.borderAccent} hover:${colors.textBase} backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 ease-in-out px-10 py-4 text-lg`} asChild>
              <Link href="/agents">Find Your AI Agent</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 space-y-16">
        <h2 className={`text-4xl font-bold text-center ${colors.textBase}`}>How Our <span className={colors.accentAmber}>Ecosystem</span> Works</h2>
        {/* Updated How It Works Card Styling */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Users Access AI', desc: 'Purchase tokens and engage with agents, paying only for what you use.' },
            { step: '02', title: 'Token Economics', desc: 'Costs include AI provider fee, 18% premium, and $0.30 transaction fee.' },
            { step: '03', title: 'Creator Rewards', desc: 'Creators earn 10% of token usage, paid monthly with transparent analytics.' }
          ].map((item, index) => (
            <div key={index} className={`p-6 border ${colors.borderSubtle}/60 rounded-xl ${colors.surfacePrimary} bg-opacity-70 backdrop-blur-md hover:shadow-lg hover:shadow-black/40 transition-all relative group overflow-hidden hover:-translate-y-1 duration-300 hover:${colors.borderAccent}/70`}>
              {/* Subtle top gradient accent on hover */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#D97742]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                 {/* Styled Step Indicator */}
                <div className={`w-12 h-12 rounded-lg ${colors.surfaceSecondary} border ${colors.borderSubtle} flex items-center justify-center mb-5 shadow-md shadow-black/25 group-hover:border-[#F0A875]/40 transition-all`}>
                  <span className={`${colors.textMuted} font-medium group-hover:${colors.accentAmber}/80 transition-colors text-sm`}>{item.step}</span>
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${colors.textBase}`}>{item.title}</h3>
                <p className={`${colors.textMuted}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Example Transaction Card - Enhanced Styling */}
        <div className="max-w-md mx-auto pt-4">
          <Card className={`border ${colors.borderSubtle}/70 bg-gradient-to-b from-gray-900/80 to-gray-950/80 backdrop-blur-lg shadow-xl shadow-black/50 overflow-hidden group rounded-xl`}>
             {/* Accent border highlight */}
             <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D97742]/40 to-transparent`}></div>
            <CardHeader className="pb-4 pt-6">
              <CardTitle className={`${colors.textBase} text-center text-lg font-medium`}>Example Transaction</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3.5">
                <div className={`flex justify-between border-b ${colors.borderSubtle}/40 pb-3`}>
                  <span className={`${colors.textMuted}`}>User Pays</span>
                  <span className={`font-medium ${colors.textBase}`}>$10.00</span>
                </div>
                <div className={`flex justify-between border-b ${colors.borderSubtle}/40 pb-3`}>
                  <span className={`${colors.textMuted}`}>Creator Receives</span>
                  <span className={`font-medium ${colors.accentAmber}`}>$0.85</span> {/* Highlight creator share */}
                </div>
                <div className="flex justify-between pb-2 pt-1">
                  <span className={`${colors.textMuted}`}>Platform Fee</span>
                  <span className={`font-medium ${colors.textBase}`}>$0.68</span>
                </div>
              </div>
              <p className={`mt-5 text-xs ${colors.textMuted}/70 text-center`}>Note: Transactions include a $0.30 processing fee.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 overflow-hidden border-t border-gray-900">
        {/* Similar background to Hero */}
        <div className={`absolute inset-0 ${colors.surfacePrimary} opacity-95`}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,119,66,0.1),_transparent_60%)] opacity-80"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
        <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>

        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className={`text-4xl sm:text-5xl font-bold ${colors.textBase}`}>Ready to Join the <span className={colors.accentAmber}>AI Agent</span> Economy?</h2>
          <p className={`max-w-3xl mx-auto text-xl ${colors.textMuted}`}>Whether you&apos;re creating AI agents or using them to solve problems, Agent Vendor connects experts with those who need their knowledge.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-5 pt-4">
            {/* Reusing Hero Buttons */}
             <Button size="lg" className={`bg-gray-900 hover:bg-gray-800 ${colors.textBase} border ${colors.borderSubtle} hover:${colors.borderAccent} ${colors.glowAccent} hover:shadow-[0_0_35px_rgba(217,119,66,0.3)] backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 ease-in-out px-10 py-4 text-lg`} asChild>
              <Link href="/creators/start">Get Started Today</Link>
            </Button>
            <Button variant="outline" size="lg" className={`border-gray-700 ${colors.textMuted} hover:bg-gray-900/50 hover:${colors.borderAccent} hover:${colors.textBase} backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 ease-in-out px-10 py-4 text-lg`} asChild>
              <Link href="/faq">Explore FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
