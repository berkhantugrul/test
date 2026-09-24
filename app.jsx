export default function ServiceMap({ mode }) {
  const isDark = mode === 'dark';

  const [selectedVip, setSelectedVip] = useState('');
  const [vipList, setVipList] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔍 VIP Arama & Dropdown State'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 🎯 Sürükleme takibi için React Flow State Hook'ları
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 1. VIP Listesini Çek (Name + Destination Nesneleri)
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/f5/vips')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) && data.length > 0 ? data : [
          { name: "VS_PAYMENT_API", destination: "10.20.30.100:443" },
          { name: "VS_WEB_PORTAL", destination: "10.20.30.101:80" },
          { name: "VS_MOBILE_BACKEND", destination: "10.20.30.102:8443" }
        ];
        setVipList(list);
        if (list.length > 0) setSelectedVip(list[0].name);
      })
      .catch(() => {
        const mockList = [
          { name: "VS_PAYMENT_API", destination: "10.20.30.100:443" },
          { name: "VS_WEB_PORTAL", destination: "10.20.30.101:80" },
          { name: "VS_MOBILE_BACKEND", destination: "10.20.30.102:8443" }
        ];
        setVipList(mockList);
        setSelectedVip(mockList[0].name);
      });
  }, []);

  // 🔍 Filtreleme Mantığı (VIP Adı veya IP:Port Arayabilme)
  const filteredVips = vipList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Seçili VIP nesnesini bul
  const currentVipObj = vipList.find(v => v.name === selectedVip);

  // 2. VIP Seçilince Topolojiyi Çek
  useEffect(() => {
    if (!selectedVip) return;

    setLoading(true);
    fetch(`http://localhost:8000/api/v1/f5/vip-topology/${selectedVip}`)
      .then(res => res.json())
      .then(data => {
        setRawData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Topoloji çekme hatası:", err);
        setLoading(false);
      });
  }, [selectedVip]);

  // 3. Veri veya Tema Değiştiğinde Düğümleri Güncelle
  useEffect(() => {
    if (rawData) {
      const layout = generateAutoLayout(rawData, isDark);
      setNodes(layout.nodes);
      setEdges(layout.edges);
    }
  }, [rawData, isDark, setNodes, setEdges]);

  return (
    <div className={`flex flex-col h-screen p-4 space-y-4 transition-colors ${
      isDark ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* ÜST BAR: ARAMALI VIP SEÇİM ALANI */}
      <div className={`flex items-center justify-between p-4 rounded-xl border shadow-md transition-colors relative z-30 ${
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            <span>🕸️</span> F5 Service Map
          </h1>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Topolojisini incelemek istediğiniz Virtual Server'ı seçin veya arayın
          </p>
        </div>

        {/* 🔍 ARAMALI DROPDOWN BİLEŞENİ */}
        <div className="relative w-80">
          <label className={`block text-[10px] font-mono font-bold uppercase mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            VIP Ara / Seç (İsim veya IP):
          </label>
          
          {/* Seçim Butonu */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-3 py-2 rounded-lg text-xs font-mono border cursor-pointer flex items-center justify-between transition-colors ${
              isDark 
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-blue-500' 
                : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-500'
            }`}
          >
            {currentVipObj ? (
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-bold text-blue-400">{currentVipObj.name}</span>
                <span className="text-[10px] opacity-60 font-sans bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                  {currentVipObj.destination}
                </span>
              </div>
            ) : (
              <span className="opacity-50">VIP Seçiniz...</span>
            )}
            <span className="text-[10px]">▼</span>
          </div>

          {/* Açılır Menü Panel */}
          {isOpen && (
            <div className={`absolute left-0 right-0 mt-1 rounded-xl border shadow-2xl p-2 z-50 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              {/* Arama Input Kutusunda */}
              <input
                type="text"
                autoFocus
                placeholder="VIP Adı veya IP:Port yazın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-1.5 mb-2 text-xs rounded-lg outline-none border font-mono ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-500' 
                    : 'bg-slate-100 border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />

              {/* Sonuç Listesi */}
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredVips.length > 0 ? (
                  filteredVips.map((vip) => (
                    <div
                      key={vip.name}
                      onClick={() => {
                        setSelectedVip(vip.name);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-mono cursor-pointer flex items-center justify-between transition-colors ${
                        selectedVip === vip.name
                          ? (isDark ? 'bg-blue-900/40 text-blue-300 font-bold' : 'bg-blue-50 text-blue-600 font-bold')
                          : (isDark ? 'hover:bg-zinc-900 text-zinc-300' : 'hover:bg-slate-100 text-slate-700')
                      }`}
                    >
                      <span>{vip.name}</span>
                      <span className="text-[10px] opacity-60 font-sans">{vip.destination}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-center py-3 opacity-50 font-mono">
                    Eşleşen VIP bulunamadı.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REACT FLOW CANVAS */}
      <div className={`flex-1 rounded-2xl border overflow-hidden relative shadow-xl transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        {loading && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 font-mono text-sm ${
            isDark ? 'bg-zinc-950/80 text-blue-400' : 'bg-white/80 text-blue-600'
          }`}>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>F5 Topolojisi Yükleniyor...</span>
          </div>
        )}

        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} 
          nodesDraggable={true}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background 
            color={isDark ? "#27272a" : "#cbd5e1"} 
            gap={24} 
            size={1} 
          />
          <Controls className={isDark ? "!bg-zinc-900 !border-zinc-700 !text-white" : ""} />
          <MiniMap 
            nodeColor={(n) => n.type === 'vipNode' ? '#3b82f6' : (isDark ? '#3f3f46' : '#e2e8f0')} 
            maskColor={isDark ? "rgba(24, 24, 27, 0.7)" : "rgba(241, 245, 249, 0.7)"}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
