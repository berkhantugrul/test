return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800">
        <span className="uppercase text-indigo-400 font-semibold">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all active:scale-95"
        >
          {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// 💬 Ana Chat Mesaj Bileşeni
export default function ChatMessage({ message }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`p-5 rounded-2xl my-3 transition-all ${
        isAssistant
          ? 'bg-slate-800/70 border border-slate-700/60 text-slate-200 shadow-md'
          : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 ml-auto max-w-3xl'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 📊 Tablolar ve Statü Rozetleri
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-slate-700/80 bg-slate-900/50 shadow-lg">
              <table className="w-full text-sm text-left text-slate-200 border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700" {...props} />
          ),
          th: ({ node, ...props }) => <th className="px-4 py-3 font-semibold" {...props} />,
          td: ({ node, children, ...props }) => (
            <td className="px-4 py-2.5 border-b border-slate-800/80 transition-colors hover:bg-slate-800/50" {...props}>
              {formatStatusBadge(children)}
            </td>
          ),

          // 💻 Kopyalanabilir Kod Blokları
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline) {
              return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
            }

            return (
              <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-800" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
}
