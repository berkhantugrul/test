// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import ChatWindow from './components/ChatWindow';
import F5MetricsDashboard from './components/F5MetricsDashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('username');
    if (token) {
      setIsAuthenticated(true);
      setUser(storedUser || 'Admin');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => {
      setIsAuthenticated(true);
      setUser(localStorage.getItem('username') || 'Admin');
    }} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-slate-100 select-none">
      
      {/* 1. Sol Sabit Sidebar */}
      <div className="w-64 h-full bg-slate-800 border-r border-slate-700 shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-slate-700 flex items-center gap-3 bg-slate-850">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-bold text-blue-400 tracking-wide text-md">F5 AI Assistant</span>
          </div>
          <div className="p-4 space-y-2">
            <div className="px-3 py-2 bg-slate-700/50 text-blue-300 font-medium rounded-lg text-sm">💬 Canlı Sohbet Konsolu</div>
          </div>
        </div>

        {/* Kullanıcı Paneli ve Çıkış Butonu */}
        <div className="p-4 border-t border-slate-700 bg-slate-850 space-y-2">
          <div className="text-xs text-slate-400 px-1">Aktif Kullanıcı: <span className="text-slate-200 font-bold">{user}</span></div>
          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-bold rounded-lg border border-rose-800/50 transition-colors"
          >
            Güvenli Çıkış Yap
          </button>
        </div>
      </div>

      {/* 2. Sağ Taraf: Ana İçerik Alanı */}
      <div className="flex-1 min-w-0 h-full flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 flex gap-4 bg-slate-900">
          <div className="flex-1 min-w-0">
            <ChatWindow />
          </div>
          <div className="w-96 shrink-0">
            <F5MetricsDashboard />
          </div>
        </div>
      </div>

    </div>
  );
}
