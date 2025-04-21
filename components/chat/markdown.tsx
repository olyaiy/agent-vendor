import Link from 'next/link';
import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../ui/code-block';
import rehypeRaw from 'rehype-raw';
import { toHtml } from 'hast-util-to-html';


const components: Partial<Components> = {
  // @ts-expect-error Type mismatch between CodeBlock and ReactMarkdown's expected type
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
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
    return <li className="py-1" dangerouslySetInnerHTML={{ __html: html }} {...rest} />;
  },
  ul: ({ children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
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
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full border-collapse border" {...props}>
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