import { Squares } from "@/components/ui/squares-background";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">We&apos;d love to hear from you</h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">Have a question or want to get in touch? We&apos;re here to help and answer any questions you might have.</p>
            </div>
            
            <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-6 text-gray-200">Connect With Me</h2>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                        <CardHeader>
                            <CardTitle className="text-gray-200">Alex on X</CardTitle>
                            <CardDescription>Connect with me on social media</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-400">@alexfromvan</p>
                            <Button variant="outline" className="w-full">
                                Message on X
                            </Button>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                        <CardHeader>
                            <CardTitle className="text-gray-200">Leave a Message</CardTitle>
                            <CardDescription>Fill out our contact form</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-400">We&apos;ll get back to you ASAP</p>
                            <Button variant="outline" className="w-full">
                                Go to Form
                            </Button>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-black/60 border-gray-800 hover:border-gray-700 transition-all">
                        <CardHeader>
                            <CardTitle className="text-gray-200">Send an Email</CardTitle>
                            <CardDescription>Direct email communication</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-gray-400">emailalexan@protonmail.com</p>
                            <Button variant="outline" className="w-full">
                                Send Email
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Card className="mb-16 bg-black/60 border-gray-800">
                <CardHeader>
                    <CardTitle className="text-2xl text-gray-200">Get in Touch</CardTitle>
                    <CardDescription>Fill out the form below and we&apos;ll get back to you as soon as possible.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-300">Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="name" 
                                    placeholder="Your name" 
                                    className="bg-black/40 border-gray-700 focus:border-gray-500"
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-300">Email <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="your.email@example.com" 
                                    className="bg-black/40 border-gray-700 focus:border-gray-500"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-gray-300">Subject</Label>
                            <Input 
                                id="subject" 
                                placeholder="How can we help you?" 
                                className="bg-black/40 border-gray-700 focus:border-gray-500"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-gray-300">Message <span className="text-red-500">*</span></Label>
                            <Textarea 
                                id="message" 
                                placeholder="Please describe your issue or question in detail..." 
                                className="min-h-32 bg-black/40 border-gray-700 focus:border-gray-500"
                                required
                            />
                        </div>
                        
                        <Button 
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 w-full md:w-auto"
                        >
                            Send Message
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="bg-black/60 border-gray-800">
                <CardHeader>
                    <CardTitle className="text-2xl text-gray-200">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <p className="text-gray-300">emailalexan@protonmail.com</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z" clipRule="evenodd" />
                            </svg>
                            <p className="text-gray-300">X / Twitter: @alexfromvan</p>
                        </div>
                        
                        <Separator className="my-6 bg-gray-800" />
                        
                        <div className="text-center">
                            <p className="text-gray-300">
                                Common questions? <Link href="/faq" className="text-blue-400 hover:text-blue-300 transition-colors">Visit our FAQ Page</Link>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        </>
    );
}