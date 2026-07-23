import React, { useState, useRef, useEffect } from 'react';
import { Paper, Button, CircularProgress } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useSSE } from '../hooks/useSSE';

export default function ChatWindow({ mode }) {
  const isDark = mode === 'dark';
  const [input, setInput] = useState('');
  
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: "Selam amiral! Ben F5 NetOps AI Asistanı. BIG-IP konfigürasyonları, iRules yazımı, LTM/GTM metrik analizleri veya WAF politikaları hakkında bana dilediğiniz her şeyi sorabilirsiniz." 
    }
  ]);

  const { streamChat, isStreaming } = useSSE();
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userPrompt = input;
    setInput('');

    setMessages((prev) => [...prev, { sender: 'user', text: userPrompt }]);
    setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);

    await streamChat(
      userPrompt,
      (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            text: (updated[lastIndex].text || '') + token 
          };
          return updated;
        });
      },
      () => {},
      (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            text: "⚠️ [HATA] Network hattında bir kesinti oluştu." 
          };
          return updated;
        });
      }
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ flexGrow: 1, height: '100%', p: 4, display: 'flex', flexDirection: 'column' }}
      className="relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-zinc-500/20 before:to-transparent"
    >
      {/* Üst Başlık Alanı */}
      <div className={`flex items-center justify-between border-b pb-4 mb-5 ${isDark ? "border-zinc-800/60" : "border-zinc-200"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isDark ? "bg-zinc-800/40 border-zinc-700/30" : "bg-zinc-100 border-zinc-200"}`}>
            <ChatIcon className={isDark ? "text-zinc-400 text-base" : "text-zinc-500 text-base"} />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-wide ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>AI NetOps Intelligence</h2>
            <p className={`text-[12px] font-mono ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Model Endpoint: Local Dummy Stream</p>
          </div>
        </div>
      </div>

      {/* 💬 MESAJLAŞMA AKIŞ ALANI (Görünüm Özelleştirmesi Tamamen Buraya Alındı) */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pr-2 mb-5 space-y-5 scrollbar-thin"
      >
        {messages.map((msg, index) => {
          const isAI = msg.sender === 'ai' || msg.role === 'assistant';
          const textContent = msg.text !== undefined ? msg.text : (msg.content !== undefined ? msg.content : '');

          return (
            <div
              key={index}
              className={`flex gap-3.5 max-w-[85%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              {/* İkon Kutusu */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${
                  isAI
                    ? (isDark ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-100")
                    : "border-gray-300 bg-gray-100"
                }`}
              >
                {isAI ? (
                  <SmartToyIcon sx={{ color: isDark ? "#fff" : "#000", fontSize: 20 }} />
                ) : (
                  <PersonIcon sx={{ color: isDark ? "#fff" : "#000", fontSize: 20 }} />
                )}
              </div>

              {/* Mesaj İçerik ve Metin Alanı */}
              <div 
                className={`flex flex-col gap-1.5 min-w-0 ${isAI ? "ml-1" : "mr-1"} ${
                  isAI
                    ? (isDark ? "text-gray-300" : "text-gray-800")
                    : "text-gray-800"
                }`}
              >
                {/* AI Yanıtı: Markdown + Nizami Tablo + Kod Bloğu | Kullanıcı Yanıtı: Düz Metin */}
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

                      // 📊 Nizami Tablo Yapısı
                      table: ({ node, ...props }) => (
                        <div className={`overflow-x-auto my-3 rounded-xl border shadow-md ${isDark ? "border-zinc-800 bg-zinc-950/70" : "border-zinc-200 bg-white"}`}>
                          <table className="w-full text-sm text-left border-collapse" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className={`text-xs uppercase tracking-wider font-semibold border-b ${isDark ? "bg-zinc-900/90 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-200"}`} {...props} />
                      ),
                      th: ({ node, ...props }) => <th className="px-4 py-3 font-semibold" {...props} />,
                      td: ({ node, ...props }) => (
                        <td className={`px-4 py-2.5 border-b transition-colors ${isDark ? "border-zinc-800/60 hover:bg-zinc-800/30 text-zinc-200" : "border-zinc-100 hover:bg-zinc-50 text-zinc-800"}`} {...props} />
                      ),

                      // 💻 Kod Blokları
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && (match || codeString.includes('\n'))) {
                          return (
                            <div className={`my-3 rounded-xl overflow-hidden border shadow-lg ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-zinc-900"}`}>
                              <div className={`flex items-center justify-between px-4 py-2 text-xs font-mono border-b ${isDark ? "bg-zinc-900/90 border-zinc-800 text-zinc-400" : "bg-zinc-800 border-zinc-700 text-zinc-300"}`}>
                                <span className="uppercase font-semibold tracking-wider text-red-500">{match ? match[1] : 'code'}</span>
                              </div>
                              <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                                <code>{codeString}</code>
                              </pre>
                            </div>
                          );
                        }

                        return (
                          <code className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${isDark ? "bg-zinc-800/80 text-red-400 border border-zinc-700/50" : "bg-zinc-200/80 text-red-600 border border-zinc-300"}`} {...props}>
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

                {/* Stream Akış İndikatörü */}
                {isAI && textContent === '' && isStreaming && (
                  <div className="flex items-center gap-2 mt-1 text-xs font-mono text-zinc-400">
                    <CircularProgress size={16} color="inherit" /> WORKING...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ⌨️ KULLANICI GİRDİ FORMU */}
      <form 
        onSubmit={handleSendMessage} 
        className={`flex gap-3 p-2 rounded-xl border backdrop-blur-md transition-all ${
          isDark ? "bg-zinc-950/40 border-zinc-800/60 focus-within:border-zinc-700" : "bg-white/80 border-zinc-200 focus-within:border-zinc-300"
        }`}
      >
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isStreaming ? "Asistan komut analizlerini döküyor, lütfen bekleyin..." : "F5 BIG-IP konfigürasyonları hakkında bir soru sorun..."} 
          disabled={isStreaming}
          className={`flex-1 bg-transparent px-4 py-3 text-sm outline-none font-normal tracking-wide transition-all ${
            isStreaming 
              ? "text-zinc-600 cursor-not-allowed" 
              : (isDark ? "text-zinc-200 placeholder-zinc-600" : "text-zinc-800 placeholder-zinc-400")
          }`}
        />
        <Button 
          type="submit"
          variant="contained" 
          disabled={isStreaming || !input.trim()}
          endIcon={isStreaming ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
          sx={{ 
            px: 4, 
            borderRadius: '8px',
            boxShadow: isStreaming ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.15)',
            '&.Mui-disabled': { 
              backgroundColor: isDark ? 'rgba(63, 63, 70, 0.2)' : 'rgba(226, 232, 240, 0.6)', 
              color: isDark ? '#52525b' : '#94a3b8' 
            } 
          }}
        >
          {isStreaming ? "Akan Veri" : "Gönder"}
        </Button>
      </form>
    </Paper>
  );
}
