import Link from 'next/link';
import React, { memo, Children, isValidElement } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  // This ensures code blocks aren't wrapped in <p> tags
  pre: ({ children }) => <>{children}</>,
  // Check if paragraph contains a pre element and unwrap it if needed
  p: ({ node, children }) => {
    const childrenArray = Children.toArray(children);
    const hasBlockElement = childrenArray.some(child => 
      isValidElement(child) && 
      (
        // Check for CodeBlock component or pre/code blocks
        child.type === CodeBlock ||
        child.type === 'pre' || 
        (child.props && 
          (typeof child.props === 'object' && 
          'node' in (child.props as object) && 
          (child.props as any).node?.tagName === 'code' && 
          !(child.props as any).inline)) ||
        // Check for any block-level elements
        (typeof child.type === 'string' && ['div', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(child.type))
      )
    );
    
    return hasBlockElement ? <>{children}</> : <p>{children}</p>;
  },
  img: ({ node, children, ...props }) => {
    return (
      <div className="overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...props}
          className="max-w-full h-auto"
          alt={props.alt || ''}
        />
      </div>
    );
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-disc list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      <a
        className="text-white text-sm bg-black/80 rounded-xl px-2 5 mx-0.5 pt-0.5  hover:underline hover:bg-black/80 break-words overflow-wrap inline-flex items-center gap-1.5 max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        <span className="shrink-1 text-xs">🔗</span>
        <span className="truncate">{children}</span>
      </a>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);