import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body leading-relaxed break-words space-y-4" style={{ color: 'var(--text-primary)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks and inline code
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeString = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code
                  className="px-2 py-0.5 rounded-md font-mono text-[15.5px] border font-medium"
                  style={{
                    backgroundColor: 'rgba(156, 175, 136, 0.12)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--c1)'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] : ''}
                value={codeString}
              />
            );
          },

          // Tables with dynamic borders and alternating rows
          table({ children }) {
            return (
              <div
                className="my-5 overflow-x-auto rounded-xl border shadow-sm"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--card-bg)'
                }}
              >
                <table className="min-w-full text-left text-[15px] sm:text-base border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead
                className="font-bold border-b text-[14px] sm:text-[15px] uppercase tracking-wider"
                style={{
                  backgroundColor: 'rgba(156, 175, 136, 0.1)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--c1)'
                }}
              >
                {children}
              </thead>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-3 font-bold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td
                className="px-4 py-3.5 border-b last:border-b-0 transition-colors text-[15.5px] sm:text-[16.5px]"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                {children}
              </td>
            );
          },

          // Scaled Headings
          h1({ children }) {
            return (
              <h1
                className="text-3xl sm:text-4xl font-extrabold font-sans mt-7 mb-3.5 pb-2 border-b tracking-tight"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2
                className="text-2xl sm:text-3xl font-bold font-sans mt-6 mb-3 tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3
                className="text-xl sm:text-2xl font-bold font-sans mt-5 mb-2.5 tracking-tight"
                style={{ color: 'var(--c1)' }}
              >
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4
                className="text-lg sm:text-xl font-bold font-sans mt-4 mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {children}
              </h4>
            );
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote
                className="my-4 pl-4 py-2 border-l-4 rounded-r-xl italic text-[17.5px] sm:text-[18px] leading-[1.85]"
                style={{
                  borderColor: 'var(--c1)',
                  backgroundColor: 'rgba(156, 175, 136, 0.08)',
                  color: 'var(--text-secondary)'
                }}
              >
                {children}
              </blockquote>
            );
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc pl-6 my-3 space-y-2 text-[17.5px] sm:text-[18px] leading-[1.85]" style={{ color: 'var(--text-secondary)' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 my-3 space-y-2 text-[17.5px] sm:text-[18px] leading-[1.85]" style={{ color: 'var(--text-secondary)' }}>{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1 leading-relaxed">{children}</li>;
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-opacity hover:opacity-80 font-semibold"
                style={{ color: 'var(--c1)' }}
              >
                {children}
              </a>
            );
          },

          // Paragraphs
          p({ children }) {
            return (
              <p
                className="mb-3.5 last:mb-0 text-[18px] sm:text-[18.5px] leading-[1.85]"
                style={{ color: 'var(--text-primary)' }}
              >
                {children}
              </p>
            );
          },

          // Horizontal rule
          hr() {
            return <hr className="my-6" style={{ borderColor: 'var(--border-color)' }} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
