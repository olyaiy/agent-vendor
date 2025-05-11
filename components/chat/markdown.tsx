import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../ui/code-block';
import rehypeRaw from 'rehype-raw';
import { toHtml } from 'hast-util-to-html';
import { CopyButton } from '../ui/copy-button';

interface MarkdownCodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

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
        <div className="my-2 mx-1 inline-block relative group">
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton content={codeString} />
          </div>
          <code className="bg-muted px-3 py-1.5 rounded font-mono text-sm" {...props}>
            {language && (
              <span className="text-xs text-muted-foreground mr-2">{language}</span>
            )}
            {codeString}
          </code>
        </div>
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
  p: ({ children, ...props }) => {
    const hasBlockElement = React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && 
        (typeof child.type === 'string' 
          ? ['div', 'pre', 'ul', 'ol', 'table'].includes(child.type)
          : ['CodeBlock'].includes(child.type?.name || '')
        )
    );
    
    const Element = hasBlockElement ? 'div' : 'p';
    
    return (
      <Element {...props} className="text-base">
        {children}
      </Element>
    );
  },
  ol: ({ children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, ...props }) => {
    const html = node?.children ? toHtml(node.children) : '';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, ...rest } = props;
    return <li className="py-0.5 ml-4" dangerouslySetInnerHTML={{ __html: html }} {...rest} />;
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
    >
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);