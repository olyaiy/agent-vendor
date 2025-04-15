import { Squares } from "@/components/ui/squares-background";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";

export default function Page() {
    return (
        <>
            <div className="absolute inset-0">
                <Squares 
                    direction="diagonal"
                    speed={0.1}
                    squareSize={40}
                    borderColor="#333" 
                    hoverFillColor="#222"
                />
            </div>
            <div className="max-w-5xl mx-auto px-6 py-12 relative z-10 mt-12 sm:mt-20">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">Frequently Asked Questions</h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">Find answers to common questions about our service and how to get the most out of your bot.</p>
                </div>
                
                <div className="relative mb-12">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input 
                        className="pl-10 py-6 bg-black/40 border-gray-700 focus:border-gray-500 w-full"
                        placeholder="Search for questions or keywords..."
                    />
                </div>

                <section className="mb-16">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-200">Browse by Category</h2>
                    
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                            <CardHeader>
                                <CardTitle className="text-gray-200">Getting Started</CardTitle>
                                <CardDescription>7 questions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="#getting-started">View questions</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                            <CardHeader>
                                <CardTitle className="text-gray-200">Account Management</CardTitle>
                                <CardDescription>6 questions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="#account-management">View questions</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                            <CardHeader>
                                <CardTitle className="text-gray-200">Billing & Payments</CardTitle>
                                <CardDescription>6 questions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="#billing-payments">View questions</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                            <CardHeader>
                                <CardTitle className="text-gray-200">Security</CardTitle>
                                <CardDescription>5 questions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="#security">View questions</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                            <CardHeader>
                                <CardTitle className="text-gray-200">Technical Support</CardTitle>
                                <CardDescription>4 questions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="#technical-support">View questions</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                            <CardHeader>
                                <CardTitle className="text-gray-200">Troubleshooting</CardTitle>
                                <CardDescription>7 questions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="#troubleshooting">View questions</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section id="getting-started" className="mb-16">
                    <Card className="bg-black/60 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-gray-200">Getting Started</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How do I create an account?</h3>
                                <p className="text-gray-400">You can create an account by clicking the &apos;Sign Up&apos; button on our homepage and following the registration process. You&apos;ll need to provide your email address and create a secure password.</p>
                                <div className="bg-gray-800/50 p-4 rounded-md">
                                    <p className="text-sm text-gray-300"><span className="font-semibold">Pro Tip:</span> Use a strong password with at least 8 characters including numbers and special characters.</p>
                                </div>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How do I earn money from my chatbot on your platform?</h3>
                                <p className="text-gray-400">When users interact with your chatbot, they pay for the tokens (or other API usage such as image generation). We add an 18% premium to the base cost, with 10% going directly to you as the creator and 8% going to our platform. In addition, every transaction incurs a flat fee of 30 cents to cover processing fees from Stripe. For example, if a user spends $10 worth of tokens with your bot, we charge them $11.80 plus a 30 cent transaction fee, making the total charge $12.10. Out of the 18% premium, $1 (10%) goes to you and $0.80 (8%) goes to the platform, with the extra 30 cents covering the Stripe fee.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How often will I get paid?</h3>
                                <p className="text-gray-400">Creator payments are processed monthly for all earnings above $20. Payments are made by the 15th of each month for the previous month&apos;s activity.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Can I see how much my chatbot is earning in real-time?</h3>
                                <p className="text-gray-400">Yes! Your models page shows real-time token usage, user interactions, and estimated earnings. You can track performance daily, weekly, or monthly.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Is there a minimum payout threshold?</h3>
                                <p className="text-gray-400">Yes, we process payments for balances of $5 or more. Smaller amounts roll over to the next payment period until they reach the threshold.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Do I earn revenue when I use my own chatbot?</h3>
                                <p className="text-gray-400">No. To prevent conflicts of interest and ensure fairness, creators do not earn revenue from their own usage of their bots. When you use your own bot, you still pay for the token usage plus the applicable fees, but the creator earnings portion (10%) is waived from your charge. You&apos;ll only pay for the actual AI provider costs plus the platform fee (8% and the 30 cent transaction fee).</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Why don&apos;t I earn from my own bot usage?</h3>
                                <p className="text-gray-400">This policy prevents potential abuse where creators could artificially inflate their earnings by extensively using their own bots. It ensures that all creator earnings represent genuine value provided to other users.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="account-management" className="mb-16">
                    <Card className="bg-black/60 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-gray-200">Account Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">What am I paying for when I use a chatbot on your platform?</h3>
                                <p className="text-gray-400">We&apos;d love to make chatbot usage free, but unfortunately, AI costs money. Your payment covers three things: (1) The actual AI token or API usage costs from our providers, (2) A fair payment to the bot creator who built and trained the bot (10% of your payment), and (3) Platform fees to support our infrastructure and services, which now include an 8% fee plus a flat 30 cent transaction fee per transaction to cover processing fees from Stripe.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How much do tokens cost?</h3>
                                <p className="text-gray-400">Token prices are based on the current rates from our AI providers, plus our 18% fee that supports creators and our platform. Our pricing page always shows current rates, and you&apos;ll always see the estimated cost before starting a conversation.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Why is there an 18% fee on token costs?</h3>
                                <p className="text-gray-400">The fee ensures creators are fairly compensated for their expertise and work in creating specialized bots (10%), while the remaining 8% plus the 30 cent per transaction fee support our platform infrastructure, tools, and services.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Do all bots cost the same to use?</h3>
                                <p className="text-gray-400">Token costs vary depending on which AI model powers the bot. More powerful models cost more per token. Creators select which model works best for their specific use case.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Can I try a bot before paying?</h3>
                                <p className="text-gray-400">Yes! New users receive a starter allocation of free tokens to try various bots. Some creators also offer free preview messages for their bots.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">What happens if I run out of tokens mid-conversation?</h3>
                                <p className="text-gray-400">You&apos;ll receive a notification when your tokens are running low. You can purchase more tokens instantly without leaving the conversation. If you have auto-refill set up in settings, we&apos;ll ensure you won&apos;t be interrupted and you will automatically purchase the set amount of tokens whenever your balance falls below a certain threshold.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="billing-payments" className="mb-16">
                    <Card className="bg-black/60 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-gray-200">Billing & Payments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How do I earn money from my chatbot on your platform?</h3>
                                <p className="text-gray-400">When users interact with your chatbot, they pay for the tokens (or other API usage such as image generation). We add an 18% premium to the base cost, with 10% going directly to you as the creator and 8% going to our platform. In addition, every transaction incurs a flat fee of 30 cents to cover processing fees from Stripe. For example, if a user spends $10 worth of tokens with your bot, we charge them $11.80 plus a 30 cent transaction fee, making the total charge $12.10. Out of the 18% premium, $1 (10%) goes to you and $0.80 (8%) goes to the platform, with the extra 30 cents covering the Stripe fee.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How often will I get paid?</h3>
                                <p className="text-gray-400">Creator payments are processed monthly for all earnings above $20. Payments are made by the 15th of each month for the previous month&apos;s activity.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Can I see how much my chatbot is earning in real-time?</h3>
                                <p className="text-gray-400">Yes! Your models page shows real-time token usage, user interactions, and estimated earnings. You can track performance daily, weekly, or monthly.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Is there a minimum payout threshold?</h3>
                                <p className="text-gray-400">Yes, we process payments for balances of $5 or more. Smaller amounts roll over to the next payment period until they reach the threshold.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Do I earn revenue when I use my own chatbot?</h3>
                                <p className="text-gray-400">No. To prevent conflicts of interest and ensure fairness, creators do not earn revenue from their own usage of their bots. When you use your own bot, you still pay for the token usage plus the applicable fees, but the creator earnings portion (10%) is waived from your charge. You&apos;ll only pay for the actual AI provider costs plus the platform fee (8% and the 30 cent transaction fee).</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Why don&apos;t I earn from my own bot usage?</h3>
                                <p className="text-gray-400">This policy prevents potential abuse where creators could artificially inflate their earnings by extensively using their own bots. It ensures that all creator earnings represent genuine value provided to other users.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="security" className="mb-16">
                    <Card className="bg-black/60 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-gray-200">Security</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Can creators see the conversations I have with their chatbots?</h3>
                                <p className="text-gray-400">No. By default, creators cannot see any messages exchanged between you and their chatbots. Your conversations remain private and are not shared with the bot creators unless you explicitly opt to share them.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Are my conversations with bots stored, and for how long?</h3>
                                <p className="text-gray-400">Conversations are stored to provide continuity in your interactions. You can delete your conversation history at any time through your user settings. By default, we store your conversations indefinitely.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How does the platform handle sensitive information shared with bots?</h3>
                                <p className="text-gray-400">We recommend not sharing sensitive personal information like financial details, passwords, or highly personal data with any AI system, including our bots. Our system automatically detects and redacts certain types of sensitive information in logs and analytics.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Are my conversations shared with third-party AI providers like OpenAI?</h3>
                                <p className="text-gray-400">When you use a bot powered by a third-party AI provider (like OpenAI, Anthropic, or others), your messages must be processed by that provider&apos;s API to generate responses. This is a technical necessity for the service to function. These providers have their own privacy policies governing how they handle data sent to their APIs. We select providers with strong privacy commitments, and many offer data processing terms that prevent them from using your conversations to train their models. You can see which AI provider powers each bot in the bot description, and we provide links to their respective privacy policies so you can make informed decisions about which bots to use.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Can I choose which underlying AI model processes my conversations?</h3>
                                <p className="text-gray-400">Yes. We clearly label which AI model powers each bot. If you have specific privacy concerns about a particular provider, you can filter bots by the underlying model they use and choose ones that align with your privacy preferences.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="technical-support" className="mb-16">
                    <Card className="bg-black/60 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-gray-200">Technical Support</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">What types of chatbots can I create on your platform?</h3>
                                <p className="text-gray-400">You can create a wide range of specialized chatbots including knowledge assistants, customer service bots, educational tutors, creative writing partners, coding assistants, and more. If it can be described through instructions and knowledge, you can likely build it on our platform.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Do I need coding experience to create a bot?</h3>
                                <p className="text-gray-400">No coding required! Our platform is designed with an intuitive interface for bot creation. You can create sophisticated bots through our guided setup process by defining the bot&apos;s personality, knowledge areas, and capabilities.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How do users find and access my bot?</h3>
                                <p className="text-gray-400">Your bot gets its own dedicated page on our marketplace and can be discovered through categories, search, and featured sections. You can also share a direct link to your bot anywhere online.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Can I embed my bot on my own website?</h3>
                                <p className="text-gray-400">We&apos;re working on it! We&apos;re hoping to offer an embed widget that allows you to place your bot directly on your website while still tracking usage and earning revenue through our platform.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section id="troubleshooting" className="mb-16">
                    <Card className="bg-black/60 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-gray-200">Troubleshooting</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How do I create an account?</h3>
                                <p className="text-gray-400">You can create an account by clicking the &apos;Sign Up&apos; button on our homepage and following the registration process. You&apos;ll need to provide your email address and create a secure password.</p>
                                <div className="bg-gray-800/50 p-4 rounded-md">
                                    <p className="text-sm text-gray-300"><span className="font-semibold">Pro Tip:</span> Use a strong password with at least 8 characters including numbers and special characters.</p>
                                </div>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">What am I paying for when I use a chatbot on your platform?</h3>
                                <p className="text-gray-400">We&apos;d love to make chatbot usage free, but unfortunately, AI costs money. Your payment covers three things: (1) The actual AI token or API usage costs from our providers, (2) A fair payment to the bot creator who built and trained the bot (10% of your payment), and (3) Platform fees to support our infrastructure and services, which now include an 8% fee plus a flat 30 cent transaction fee per transaction to cover processing fees from Stripe.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">How much do tokens cost?</h3>
                                <p className="text-gray-400">Token prices are based on the current rates from our AI providers, plus our 18% fee that supports creators and our platform. Our pricing page always shows current rates, and you&apos;ll always see the estimated cost before starting a conversation.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Why is there an 18% fee on token costs?</h3>
                                <p className="text-gray-400">The fee ensures creators are fairly compensated for their expertise and work in creating specialized bots (10%), while the remaining 8% plus the 30 cent per transaction fee support our platform infrastructure, tools, and services.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Do all bots cost the same to use?</h3>
                                <p className="text-gray-400">Token costs vary depending on which AI model powers the bot. More powerful models cost more per token. Creators select which model works best for their specific use case.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">Can I try a bot before paying?</h3>
                                <p className="text-gray-400">Yes! New users receive a starter allocation of free tokens to try various bots. Some creators also offer free preview messages for their bots.</p>
                            </div>

                            <Separator className="bg-gray-800" />

                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-gray-300">What happens if I run out of tokens mid-conversation?</h3>
                                <p className="text-gray-400">You&apos;ll receive a notification when your tokens are running low. You can purchase more tokens instantly without leaving the conversation. If you have auto-refill set up in settings, we&apos;ll ensure you won&apos;t be interrupted and you will automatically purchase the set amount of tokens whenever your balance falls below a certain threshold.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card className="bg-black/60 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-2xl text-gray-200">Still Have Questions?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <p className="text-gray-400 mb-6">Our support team is here to help you with any other questions you might have about our products and services.</p>
                            <Button 
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2"
                                asChild
                            >
                                <Link href="/support">Contact Support</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}