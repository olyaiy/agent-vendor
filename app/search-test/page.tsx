'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ReadPageResponse {
  url: string;
  content: string;
  error?: string;
}

export default function SearchTestPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReadPageResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-read-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();
      setResult(data);

      if (data.error) {
        toast.error('Failed to read page');
      } else {
        toast.success('Page read successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        url: url.trim(),
        content: '',
        error: `Request failed: ${error instanceof Error ? error.message : String(error)}`
      });
      toast.error('Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      toast.success('JSON copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Read Page Tool Test</h1>
        <p className="text-muted-foreground">
          Test the JINA Reader API integration by entering a URL below. The tool will extract the main content in markdown format.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Input</CardTitle>
            <CardDescription>
              Enter a URL to test the read page functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reading Page...
                  </>
                ) : (
                  'Read Page'
                )}
              </Button>
            </form>

            {/* Sample URLs */}
            <div className="mt-6 space-y-2">
              <Label className="text-sm font-medium">Sample URLs to try:</Label>
              <div className="space-y-1 text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setUrl('https://example.com')}
                  className="block hover:text-foreground transition-colors"
                >
                  https://example.com
                </button>
                <button
                  type="button"
                  onClick={() => setUrl('https://news.ycombinator.com')}
                  className="block hover:text-foreground transition-colors"
                >
                  https://news.ycombinator.com
                </button>
                <button
                  type="button"
                  onClick={() => setUrl('https://github.com/vercel/next.js')}
                  className="block hover:text-foreground transition-colors"
                >
                  https://github.com/vercel/next.js
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>JSON Output</CardTitle>
                <CardDescription>
                  The response from the read page tool
                </CardDescription>
              </div>
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy JSON
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <Textarea
                value={JSON.stringify(result, null, 2)}
                readOnly
                className="min-h-[400px] font-mono text-sm"
                placeholder="JSON output will appear here..."
              />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                Enter a URL and click &quot;Read Page&quot; to see the JSON output
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Details */}
      {result && !result.error && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Response Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div>
              <Label className="text-sm font-medium">Final URL</Label>
              <p className="text-sm text-muted-foreground mt-1 break-all">
                {result.url}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Content Preview</Label>
              <Textarea
                value={result.content.substring(0, 500) + (result.content.length > 500 ? '...' : '')}
                readOnly
                className="mt-1 min-h-[100px] text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 