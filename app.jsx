import React, { useState } from 'react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { CircularProgress } from '@mui/material';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 📋 Kopyalanabilir Özel Kod Bloğu (CLI / iRule / Config)
function CodeBlock({ language, code, isDark }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={"my-3 rounded-xl overflow-hidden border shadow-lg " + (isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-zinc-900")}>
      <div className={"flex items-center justify-between px-4 py-2 text-xs font-mono border-b " + (isDark ? "bg-zinc-900/90 border-zinc-800 text-zinc-400" : "bg-zinc-800 border-zinc-700 text-zinc-300")}>
        <span className="uppercase font-semibold tracking-wider text-red-500">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs transition-all active:scale-95 border border-zinc-700/60"
        >
          {copied ? <CheckIcon sx={{ fontSize: 14 }} className="text-emerald-400" /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
          <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ChatMessage({ msg, isDark, isStreaming }) {
  const isAI = msg?.sender === 'ai';
  // 🛡️ Hem msg.text hem de msg.content alanını destekleyen zırhlı okuma
  const textContent = msg?.text ?? msg?.content ?? '';

  return (
    <div className={"flex gap-3.5 max-w-[85%] " + (isAI ? "mr-auto" : "ml-auto flex-row-reverse")}>
      {/* 🎯 İkon Kutusu */}
      <div className={"w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 " + 
        (isAI 
          ? (isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100")
          : (isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100")
        )}
      >
        {isAI ? (
          <SmartToyIcon sx={{ color: isDark ? "#fff" : "#000", fontSize: 20 }} />
        ) : (
          <PersonIcon sx={{ color: isDark ? "#fff" : "#000", fontSize: 20 }} />
        )}
      </div>

      {/* 💬 Mesaj Metin Alanı */}
      <div className={"flex flex-col gap-1.5 " + (isDark ? "text-gray-300" : "text-gray-800")}>
        {isAI ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, children, ...props }) => (
                <p className="my-1.5 leading-relaxed text-sm font-normal" {...props}>
                  {children}
                </p>
              ),
              ul: ({ node, children, ...props }) => (
                <ul className="list-disc pl-5 my-2 space-y-1.5 leading-relaxed" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ node, children, ...props }) => (
                <ol className="list-decimal pl-5 my-2 space-y-1.5 leading-relaxed" {...props}>
                  {children}
                </ol>
              ),
              li: ({ node, children, ...props }) => (
                <li className="pl-1 marker:text-red-500" {...props}>
                  {children}
                </li>
              ),
              table: ({ node, ...props }) => (
                <div className={"overflow-x-auto my-3 rounded-xl border shadow-md " + (isDark ? "border-zinc-800 bg-zinc-950/70" : "border-zinc-200 bg-white")}>
                  <table className="w-full text-sm text-left border-collapse" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className={"text-xs uppercase tracking-wider font-semibold border-b " + (isDark ? "bg-zinc-900/90 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-200")} {...props} />
              ),
              th: ({ node, ...props }) => <th className="px-4 py-3 font-semibold" {...props} />,
              td: ({ node, ...props }) => (
                <td className={"px-4 py-2.5 border-b transition-colors " + (isDark ? "border-zinc-800/60 hover:bg-zinc-800/30 text-zinc-200" : "border-zinc-100 hover:bg-zinc-50 text-zinc-800")} {...props} />
              ),
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (!inline && (match || codeString.includes('\n'))) {
                  return <CodeBlock language={match ? match[1] : ''} code={codeString} isDark={isDark} />;
                }

                return (
                  <code className={"px-1.5 py-0.5 rounded text-xs font-mono font-medium " + (isDark ? "bg-zinc-800/80 text-red-400 border border-zinc-700/50" : "bg-zinc-200/80 text-red-600 border border-zinc-300")} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {textContent}
          </ReactMarkdown>
        ) : (
          <span className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{textContent}</span>
        )}

        {/* ⏳ Bekleme / Çalışıyor İndikatörü */}
        {isAI && textContent === '' && isStreaming && (
          <div className="flex items-center gap-2 mt-1 text-xs font-mono text-zinc-400">
            <CircularProgress size={16} color="inherit" /> WORKING...
          </div>
        )}
      </div>
    </div>
  );
}
