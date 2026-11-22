import React, { useState, useMemo } from 'react';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';

// Load Prism components
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-yaml';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'text').toLowerCase().trim();

  // Normalize language aliases
  const langKey = useMemo(() => {
    switch (cleanLang) {
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      case 'python':
      case 'py':
        return 'python';
      case 'javascript':
      case 'js':
        return 'javascript';
      case 'typescript':
      case 'ts':
        return 'typescript';
      case 'bash':
      case 'sh':
      case 'zsh':
      case 'shell':
        return 'bash';
      case 'json':
        return 'json';
      case 'sql':
        return 'sql';
      case 'rust':
      case 'rs':
        return 'rust';
      case 'go':
      case 'golang':
        return 'go';
      case 'java':
        return 'java';
      case 'css':
        return 'css';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'markdown':
      case 'md':
        return 'markdown';
      default:
        return 'clike';
    }
  }, [cleanLang]);

  // Highlight code with Prism
  const highlightedHtml = useMemo(() => {
    try {
      const grammar = Prism.languages[langKey] || Prism.languages.clike || Prism.languages.text;
      if (grammar) {
        return Prism.highlight(value, grammar, langKey);
      }
    } catch (e) {
      console.warn('Prism highlighting error:', e);
    }
    // Fallback: escape HTML
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }, [value, langKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-[#2B2F44] dark:border-[#2B2F44] bg-[#141622] shadow-xl text-left">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1D2C] border-b border-[#2B2F44] text-[13px]">
        <div className="flex items-center gap-2">
          {/* Mac window dots for high-end aesthetic */}
          <div className="flex items-center gap-1.5 mr-2 opacity-70">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8412C]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5B558]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#9CAF88]" />
          </div>
          <span
            className="font-mono font-bold uppercase tracking-wider text-[12px] px-2.5 py-0.5 rounded"
            style={{ color: 'var(--c1)', backgroundColor: 'rgba(156, 175, 136, 0.12)' }}
          >
            {cleanLang || 'code'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[13px] text-[#A0A2B8] hover:text-[#F7F5EF] hover:bg-[#25283C] transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" style={{ color: 'var(--c1)' }} />
              <span className="font-bold" style={{ color: 'var(--c1)' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Vivid Syntax Tokens */}
      <div className="p-4 sm:p-5 overflow-x-auto text-[15px] sm:text-[15.5px] leading-relaxed font-mono text-[#F7F5EF] selection:bg-[#9CAF88]/30">
        <pre className="!bg-transparent !p-0 !m-0">
          <code
            className={`language-${langKey} code-highlighted`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
};
