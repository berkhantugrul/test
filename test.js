import React, { useState, useRef, useEffect } from 'react';
import { Paper, Button, CircularProgress } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { useSSE } from '../hooks/useSSE';

// 🚀 YENİ EKLENEN KISIM: Dinamik Form Bileşeni Import Edildi
import FormWidget from './FormWidget';

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

  // 🚀 YENİ EKLENEN KISIM: Form doldurulup "Gönder" tıklandığında MCP'yi tetikleyen fonksiyon
  const handleFormSubmit = async (formId, formData) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: formId, data: formData }),
      });

      const result = await response.json();

      // MCP sonucunu doğrudan sohbet balonuna ekle
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          type: 'TEXT',
          text: result.content || result.message || "İşlem başarıyla tamamlandı."
        }
      ]);
    } catch (err) {
      console.error("Form gönderim hatası:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          type: 'TEXT',
          text: "⚠️ [HATA] Form verileri işlenirken sunucu hatası oluştu."
        }
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userPrompt = input;
    setInput('');

    // 1. Kullanıcı mesajını ekle
    setMessages((prev) => [...prev, { sender: 'user', text: userPrompt }]);

    // 🚀 YENİ EKLENEN KISIM: StreamChat öncesi bağımsız Form Kontrolü
    try {
      const checkRes = await fetch('http://localhost:8000/api/v1/chat/check-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userPrompt }),
      });
      
      const formResult = await checkRes.json();

      // EĞER FORM GEREKİYORSA: streamChat BASS-PASS Edilir!
      if (formResult && formResult.has_form) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            type: 'FORM_WIDGET',
            text: formResult.content,
            form_schema: formResult.form_schema
          }
        ]);
        return; // 🛑 streamChat tetiklenmeden fonksiyon burada biter!
      }
    } catch (err) {
      console.error("Form kontrol hatası:", err);
    }

    // -----------------------------------------------------------------------
    // MEVCUT STREAM CHAT AKIŞI (Form gerekmiyorsa birebir aynı şekilde çalışır)
    // -----------------------------------------------------------------------
    setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);

    await streamChat(
      userPrompt,
      (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { 
            ...updated[lastIndex], 
            text: updated[lastIndex].text + token 
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
        {messages.map((msg, index) => {
          const isAI = msg.sender === 'ai';
          return (
            <div 
              key={index} 
              className={"flex gap-3.5 max-w-[85%] " + (isAI ? "mr-auto" : "ml-auto flex-row-reverse")}
            >
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 " + 
                (isAI 
                  ? (isDark ? "bg-zinc-900 border-zinc-800 text-red-400" : "bg-zinc-100 border-zinc-200 text-red-500") 
                  : "bg-red-500 border-red-600 text-white")}
              >
                {isAI ? <SmartToyIcon sx={{ fontSize: 18 }} /> : <PersonIcon sx={{ fontSize: 18 }} />}
              </div>

              <div className={"rounded-xl px-4.5 py-3.5 text-sm leading-relaxed border tracking-wide " + 
                (isAI 
                  ? (isDark ? "bg-zinc-900/40 border-zinc-800/80 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800") 
                  : "bg-gradient-to-br from-red-500 to-red-600 border-red-500 text-white shadow-md shadow-red-500/5")}
              >
                {/* 🚀 YENİ EKLENEN KISIM: Eğer mesaj Tipi FORM_WIDGET ise FormWidget Bileşenini Çizer */}
                {msg.type === 'FORM_WIDGET' && msg.form_schema ? (
                  <div className="w-full">
                    <p className="whitespace-pre-wrap font-sans font-medium mb-3">{msg.text}</p>
                    <FormWidget
                      schema={msg.form_schema}
                      onSubmit={(formData) => handleFormSubmit(msg.form_schema.form_id || 'new_vip_rest_form', formData)}
                      isDark={isDark}
                    />
                  </div>
                ) : (
                  /* Standart Metin Mesajı */
                  <span className="whitespace-pre-wrap font-sans font-normal">{msg.text}</span>
                )}
                
                {isAI && msg.text === '' && isStreaming && (
                  <div className="flex items-center gap-2 text-zinc-500 font-mono text-[12px] py-1">
                    <CircularProgress size={12} color="inherit" /> Düşünce havuzu derleniyor...
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
