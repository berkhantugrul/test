return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold text-center text-blue-400">F5 NetOps AI Giriş</h2>
        
        {error && <div className="p-2 text-xs bg-red-950/50 border border-red-800 text-red-200 rounded">{error}</div>}
        
        <div>
          <label className="block text-xs text-slate-400 mb-1">Kullanıcı Adı (admin)</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500" required />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Şifre (admin123)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500" required />
        </div>

        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold transition-colors">Sisteme Giriş Yap</button>
      </form>
    </div>
  );
