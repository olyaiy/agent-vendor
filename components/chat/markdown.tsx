"use client"

import Link from 'next/link';
import React, { memo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../ui/code-block';
import rehypeRaw from 'rehype-raw';
import { toHtml } from 'hast-util-to-html';
import { CopyButton } from '../ui/copy-button';
import { DownloadIcon } from '../utils/icons';
import { Button } from '../ui/button';

interface MarkdownCodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
}

// Image component with download functionality
const MarkdownImage: React.FC<MarkdownImageProps> = ({ src, alt, ...props }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!src || isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      // Fetch the image
      const response = await fetch(src);
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Extract filename from path or use alt text
      const filename = alt || src.split('/').pop() || 'image';
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <span className="relative group inline-block">
      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button 
          onClick={handleDownload} 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
          aria-label="Download image"
          disabled={isDownloading}
        >
          {isDownloading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
          ) : (
            <DownloadIcon size={16} />
          )}
        </Button>
      </span>
      <img 
        src={src} 
        alt={alt || ''} 
        className="rounded-lg object-contain max-h-[300px] h-full" 
        {...props}
      />
    </span>
  );
};

// Component to handle image grid layout
const ImageGrid = ({ children }: { children: React.ReactNode }) => {
  const childrenArray = React.Children.toArray(children);
  
  // Only apply grid if there are multiple images (up to 4)
  if (childrenArray.length > 1 && childrenArray.length <= 4) {
    let gridClassName = "inline-grid gap-2 my-4 ";
    
    // Set grid columns based on image count
    switch (childrenArray.length) {
      case 2:
        gridClassName += "grid-cols-2";
        break;
      case 3:
        gridClassName += "grid-cols-3";
        break;
      case 4:
        gridClassName += "grid-cols-2 md:grid-cols-4";
        break;
      default:
        gridClassName += "grid-cols-1";
    }
    
    // Use span to avoid block element nesting issues
    return <span className={gridClassName}>{children}</span>;
  }
  
  // If only one image or more than 4, render normally as fragments
  return <>{children}</>;
};

const components: Partial<Components> = {
  pre: ({ children }) => <>{children}</>,
  code: ({ inline, className, children, ...props }: MarkdownCodeProps) => {
    // Handle inline code blocks differently
    if (inline) {
      return <code className="bg-muted px-1 rounded font-mono text-sm" {...props}>{children}</code>;
    }

    // Extract the code string, remove trailing newline added by markdown
    const codeString = String(children).replace(/\\n$/, '');
    
    // Match the language from the className (e.g., "language-js")
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : ''; // Default to empty string if no language found

    // Check if the code is a single line (no newlines)
    const isSingleLine = !codeString.includes('\n');
    
    if (isSingleLine) {
      // For single-line code, render a simplified inline-block code element
      return (
        <span className="my-2 mx-1 inline-block relative group">
          <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton content={codeString} />
          </span>
          <code className="bg-muted px-3 py-1.5 rounded font-mono text-sm" {...props}>
            {language && (
              <span className="text-xs text-muted-foreground mr-2">{language}</span>
            )}
            {codeString}
          </code>
        </span>
      );
    }

    // For multi-line code, render the full CodeBlock component
    return (
      <CodeBlock
        language={language}
        code={codeString}
        filename=""
        {...props} // Pass down other props if necessary
      />
    );
  },
  img: ({ src, alt, ...props }) => {
    if (!src) return null;
    return <MarkdownImage key={src} src={src} alt={alt} {...props} />;
  },
  p: ({ children, ...props }) => {
    // Check if paragraph contains only images
    const childrenArray = React.Children.toArray(children);
    
    // Handle case where paragraph contains only images
    const onlyImages = childrenArray.every(
      child => React.isValidElement(child) && 
        ((typeof child.type === 'string' && child.type === 'img') || 
         (typeof child.type !== 'string' && child.type?.name === 'MarkdownImage'))
    );
    
    // If paragraph contains only images, wrap in ImageGrid
    if (onlyImages && childrenArray.length > 0) {
      return (
        <span className="inline-block">
          <ImageGrid>
            {children}
          </ImageGrid>
        </span>
      );
    }
    
    // More thorough check for any block elements or components that might render block elements
    const hasBlockElement = React.Children.toArray(children).some(
      (child) => {
        if (React.isValidElement(child)) {
          // Check for explicit block elements
          if (typeof child.type === 'string') {
            return ['div', 'pre', 'ul', 'ol', 'table', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type);
          }
          
          // Check for custom components that might render block elements
          if (typeof child.type !== 'string') {
            const componentName = child.type?.name || '';
            return ['CodeBlock', 'MarkdownImage', 'ImageGrid'].includes(componentName);
          }
        }
        
        // Check for HTML strings that contain block elements
        if (typeof child === 'string') {
          return /(<div|<pre|<ul|<ol|<table|<blockquote|<h[1-6])/i.test(child);
        }
        
        return false;
      }
    );
    
    // Always use a div if we detect any potential block elements to be safe
    if (hasBlockElement) {
      return (
        <div className="text-base" {...props}>
          {children}
        </div>
      );
    }
    
    // Only use paragraph when we're sure it's safe
    return (
      <p className="text-base" {...props}>
        {children}
      </p>
    );
  },
  ol: ({ children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    // Check if the li contains an image
    const childrenArray = React.Children.toArray(children);
    
    // Extract image nodes from HTML content if present
    const hasImage = childrenArray.some(
      child => React.isValidElement(child) && 
        ((typeof child.type === 'string' && child.type === 'img') || 
         (typeof child.type !== 'string' && child.type?.name === 'MarkdownImage')) ||
      (typeof child === 'string' && child.includes('<img'))
    );
    
    // If there are images in the HTML content, we need to process them differently
    if (hasImage) {
      return (
        <li className="py-0.5 ml-4" {...props}>
          {childrenArray.map((child, index) => {
            // If it's an img tag in HTML, wrap it with our MarkdownImage component
            if (typeof child === 'string' && child.includes('<img')) {
              // Extract src and alt from img tag using regex
              const srcMatch = child.match(/src="([^"]+)"/);
              const altMatch = child.match(/alt="([^"]+)"/);
              const src = srcMatch ? srcMatch[1] : '';
              const alt = altMatch ? altMatch[1] : '';
              
              // Return our MarkdownImage component for each image
              if (src) {
                return (
                  <React.Fragment key={index}>
                    {child.split('<img')[0]}
                    <MarkdownImage src={src} alt={alt} />
                    {child.split('/>')[1] || ''}
                  </React.Fragment>
                );
              }
            }
            return child;
          })}
        </li>
      );
    }
    
    // For non-image content, use the original approach
    const html = node?.children ? toHtml(node.children) : '';
    return <li className="py-0.5 ml-4" dangerouslySetInnerHTML={{ __html: html }} {...props} />;
  },
  ul: ({ children, ...props }) => {
    return (
      <ul className="list-disc list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ children, ...props }) => {
    return (
      // @ts-expect-error Type mismatch between Link and ReactMarkdown's expected type
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
  table: ({ children, ...props }) => (
    <div className="my-6  max-w-full overflow-auto">
      <table className="max-w-full border-collapse border" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="[&_tr]:border-b" {...props}>{children}</thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="[&_tr:last-child]:border-0" {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b transition-colors hover:bg-muted/50" {...props}>
      {children}
    </tr>
  ),
  th: ({ node, ...props }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...rest } = props;
    return (
      <th
        className="h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0"
        dangerouslySetInnerHTML={{ __html: node?.children ? toHtml(node.children) : '' }}
        {...rest}
      />
    );
  },
  td: ({ node, ...props }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...rest } = props;
    return (
      <td
        className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
        dangerouslySetInnerHTML={{ __html: node?.children ? toHtml(node.children) : '' }}
        {...rest}
      />
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={[rehypeRaw]}
      components={components}
      // Ensure tags are allowed to pass through
      allowedElements={['img', 'p', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'strong', 'em', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td']}
    >
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);