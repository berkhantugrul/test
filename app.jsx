import React, { useState } from 'react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { CircularProgress } from '@mui/material';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 📋 Kopyalanabilir Özel Kod Bloğu (Sadece Gerçek iRule / CLI / Script Yanıtları İçin)
function CodeBlock({ language, code, isDark }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={"my-3 rounded-xl overflow-hidden border shadow-md " + (isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-zinc-900")}>
      <div className={"flex items-center justify-between px-4 py-2 text-xs font-mono border-b " + (isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-800 border-zinc-700 text-zinc-300")}>
        <span className="uppercase font-semibold text-red-400">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-all active:scale-95 border border-zinc-700"
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
  const textContent = msg?.content || '';

  return (
    <div className={"flex gap-3.5 max-w-[85%] " + (isAI ? "mr-auto" : "ml-auto flex-row-reverse")}>
      {/* İkon Kutusu */}
      <div className={"w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 " + 
        (isAI 
          ? (isDark ? "bg-zinc-900 border-zinc-800 text-red-400" : "bg-zinc-100 border-zinc-200 text-red-500") 
          : "bg-red-500 border-red-600 text-white")}
      >
        {isAI ? <SmartToyIcon sx={{ fontSize: 18 }} /> : <PersonIcon sx={{ fontSize: 18 }} />}
      </div>

      {/* Mesaj İçerik Balonu */}
      <div className={"rounded-xl px-4.5 py-3.5 text-sm leading-relaxed border tracking-wide overflow-hidden " + 
        (isAI 
          ? (isDark ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800") 
          : "bg-gradient-to-br from-red-500 to-red-600 border-red-500 text-white shadow-md shadow-red-500/5")}
      >
        {isAI ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 📊 Standart, Temiz Tablo Yapısı
              table: ({ node, ...props }) => (
                <div className={"overflow-x-auto my-3 rounded-lg border shadow-sm " + (isDark ? "border-zinc-800 bg-zinc-950/60" : "border-zinc-200 bg-white")}>
                  <table className="w-full text-sm text-left border-collapse" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className={"text-xs uppercase tracking-wider font-semibold border-b " + (isDark ? "bg-zinc-900/80 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-200")} {...props} />
              ),
              th: ({ node, ...props }) => <th className="px-4 py-2.5 font-semibold" {...props} />,
              td: ({ node, ...props }) => (
                <td className={"px-4 py-2.5 border-b transition-colors " + (isDark ? "border-zinc-800/60 hover:bg-zinc-800/30 text-zinc-200" : "border-zinc-100 hover:bg-zinc-50 text-zinc-800")} {...props} />
              ),

              // 💻 Kod Blokları Kontrolü
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                // Sadece çok satırlı veya dili açıkça belirtilmiş gerçek kod bloklarında (iRule, CLI vs.) CodeBlock aç
                if (!inline && (match || codeString.includes('\n'))) {
                  return <CodeBlock language={match ? match[1] : ''} code={codeString} isDark={isDark} />;
                }

                // Tablo içi değerler veya tek tırnaklı satır içi metinler için sade görünüm
                return (
                  <code className={"px-1.5 py-0.5 rounded text-xs font-mono font-medium " + (isDark ? "bg-zinc-800/80 text-zinc-200" : "bg-zinc-200/80 text-zinc-800")} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {textContent}
          </ReactMarkdown>
        ) : (
          <span className="whitespace-pre-wrap font-sans font-normal">{textContent}</span>
        )}

        {/* Bekleme İndikatörü */}
        {isAI && textContent === '' && isStreaming && (
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-[12px] py-1">
            <CircularProgress size={12} color="inherit" /> Düşünce havuzu derleniyor...
          </div>
        )}
      </div>
    </div>
  );
}
