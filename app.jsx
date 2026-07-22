import React, { useState, useRef, useEffect } from 'react';
import { Paper, Button, CircularProgress } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import { useSSE } from '../hooks/useSSE';
import ChatMessage from './ChatMessage';

export default function ChatWindow({ mode }) {
  const isDark = mode === 'dark';
  const [input, setInput] = useState('');
  
  // 🎯 Belirlenen Nesne Yapısı: { sender: 'ai' | 'user', content: '...' }
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      content: "Selam amiral! Ben F5 NetOps AI Asistanı. BIG-IP konfigürasyonları, iRules yazımı, LTM/GTM metrik analizleri veya WAF politikaları hakkında bana dilediğiniz her şeyi sorabilirsiniz." 
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

    // 1. Kullanıcı mesajı ekleniyor
    setMessages((prev) => [...prev, { sender: 'user', content: userPrompt }]);
    
    // 2. AI yanıt balonu boş olarak başlatılıyor
    setMessages((prev) => [...prev, { sender: 'ai', content: '' }]);

    await streamChat(
      userPrompt,
      (token) => {
        // SSE üzerinden gelen her token içerik alanına ekleniyor
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            content: updated[lastIndex].content + token 
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
            content: "⚠️ [HATA] Network hattında bir kesinti oluştu." 
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
      <div className={"flex items-center justify-between border-b pb-4 mb-5 " + (isDark ? "border-zinc-800/60" : "border-zinc-200")}>
        <div className="flex items-center gap-3">
          <div className={"w-9 h-9 rounded-lg flex items-center justify-center border " + (isDark ? "bg-zinc-800/40 border-zinc-700/30" : "bg-zinc-100 border-zinc-200")}>
            <ChatIcon className={isDark ? "text-zinc-400 text-base" : "text-zinc-500 text-base"} />
          </div>
          <div>
            <h2 className={"text-base font-bold tracking-wide " + (isDark ? "text-zinc-100" : "text-zinc-800")}>AI NetOps Intelligence</h2>
            <p className={"text-[12px] font-mono " + (isDark ? "text-zinc-400" : "text-zinc-500")}>Model Endpoint: Local Dummy Stream</p>
          </div>
        </div>
      </div>

      {/* 💬 MESAJLAŞMA AKIŞ ALANI */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pr-2 mb-5 space-y-5 scrollbar-thin"
      >
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            msg={msg} 
            isDark={isDark} 
            isStreaming={isStreaming && index === messages.length - 1} 
          />
        ))}
      </div>

      {/* ⌨️ KULLANICI GİRDİ FORMU */}
      <form 
        onSubmit={handleSendMessage} 
        className={"flex gap-3 p-2 rounded-xl border backdrop-blur-md transition-all " + 
          (isDark ? "bg-zinc-950/40 border-zinc-800/60 focus-within:border-zinc-700" : "bg-white/80 border-zinc-200 focus-within:border-zinc-300")}
      >
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isStreaming ? "Asistan komut analizlerini döküyor, lütfen bekleyin..." : "F5 BIG-IP konfigürasyonları hakkında bir soru sorun..."} 
          disabled={isStreaming}
          className={"flex-1 bg-transparent px-4 py-3 text-sm outline-none font-normal tracking-wide transition-all " + 
            (isStreaming 
              ? "text-zinc-600 cursor-not-allowed" 
              : (isDark ? "text-zinc-200 placeholder-zinc-600" : "text-zinc-800 placeholder-zinc-400"))}
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
