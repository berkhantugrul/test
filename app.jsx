import React, { useState, useEffect, useMemo } from 'react';
import { ReactFlow, Handle, Position, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 🎯 MERKEZ DÜĞÜM (VIP / Virtual Server)
const VipNode = ({ data }) => {
  const isDark = data.isDark;
  return (
    <div className={`px-6 py-4 rounded-xl border-2 text-center min-w-[150px] shadow-2xl transition-colors ${
      isDark 
        ? 'bg-blue-950/90 border-blue-500 text-white shadow-blue-950/50' 
        : 'bg-blue-50 border-blue-600 text-slate-900 shadow-blue-100'
    }`}>
      <Handle type="source" position={Position.Top} id="top" className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-blue-500 !w-3 !h-3" />
      
      <div className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
        VIRTUAL SERVER
      </div>
      <div className="text-base font-bold mt-0.5">{data.label}</div>
      {data.sub && (
        <div className={`text-xs font-mono mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          {data.sub}
        </div>
      )}
    </div>
  );
};

// 📦 UYDU DÜĞÜMLERİ (Profile, iRule, Policy, Pool, Monitor, Member)
const BadgeNode = ({ data }) => {
  const isDark = data.isDark;

  const getBadgeStyle = () => {
    switch (data.category) {
      case 'pool':
        return isDark 
          ? 'bg-purple-950/80 border-purple-500 text-purple-200' 
          : 'bg-purple-50 border-purple-400 text-purple-900';
      case 'member':
        return isDark 
          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' 
          : 'bg-emerald-50 border-emerald-500 text-emerald-900';
      case 'monitor':
        return isDark 
          ? 'bg-amber-950/80 border-amber-500 text-amber-200' 
          : 'bg-amber-50 border-amber-500 text-amber-900';
      case 'iRule':
        return isDark 
          ? 'bg-sky-950/80 border-sky-500 text-sky-200' 
          : 'bg-sky-50 border-sky-400 text-sky-900';
      default:
        return isDark 
          ? 'bg-zinc-900 border-zinc-700 text-zinc-200' 
          : 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  return (
    <div className={`px-3 py-2 rounded-lg border text-xs font-mono shadow-md text-center min-w-[110px] transition-colors ${getBadgeStyle()}`}>
      <Handle type="target" position={data.targetPos || Position.Top} className="!bg-zinc-400" />
      {data.hasSource && <Handle type="source" position={data.sourcePos || Position.Bottom} className="!bg-zinc-400" />}
      
      <div className="text-[9px] opacity-70 uppercase font-sans mb-0.5 font-bold">
        {data.category}
      </div>
      <div>{data.label}</div>
    </div>
  );
};

// 🧮 OTOMATİK DÜZEN VE KOORDİNAT HESAPLAYICI
function generateAutoLayout(rawData, isDark) {
  if (!rawData) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];

  // 1. VIP (Merkez)
  const VIP_X = 0;
  const VIP_Y = 0;
  nodes.push({
    id: 'vip',
    type: 'vipNode',
    position: { x: VIP_X, y: VIP_Y },
    data: { label: rawData.vip_name, sub: rawData.destination, isDark }
  });

  // 2. VIP Etrafındaki Bileşenler (iRule, Policy, Profile)
  const satellites = [
    ...(rawData.rules || []).map(r => ({ label: r, category: 'iRule' })),
    ...(rawData.policies || []).map(p => ({ label: p, category: 'policy' })),
    ...(rawData.profiles || []).map(pr => ({ label: pr, category: 'profile' }))
  ];

  const totalSatellites = satellites.length;
  const RADIUS = 230;

  satellites.forEach((sat, index) => {
    const angle = totalSatellites === 1 
      ? -Math.PI / 2 
      : -Math.PI + (index * (Math.PI / (totalSatellites - 1)));

    const x = VIP_X + RADIUS * Math.cos(angle);
    const y = VIP_Y + RADIUS * Math.sin(angle);

    const nodeId = `sat_${index}`;
    nodes.push({
      id: nodeId,
      type: 'badgeNode',
      position: { x, y },
      data: { label: sat.label, category: sat.category, targetPos: Position.Bottom, isDark }
    });

    edges.push({
      id: `e-vip-${nodeId}`,
      source: 'vip',
      sourceHandle: y < -100 ? 'top' : (x < 0 ? 'left' : 'right'),
      target: nodeId,
      type: 'straight',
      style: { stroke: isDark ? '#71717a' : '#94a3b8', strokeDasharray: '4,4' }
    });
  });

  // 3. POOL (VIP Altı)
  if (rawData.pool) {
    const POOL_X = 0;
    const POOL_Y = 200;

    nodes.push({
      id: 'pool',
      type: 'badgeNode',
      position: { x: POOL_X, y: POOL_Y },
      data: { 
        label: rawData.pool, 
        category: 'pool', 
        targetPos: Position.Top, 
        hasSource: true, 
        sourcePos: Position.Bottom,
        isDark 
      }
    });

    edges.push({
      id: 'e-vip-pool',
      source: 'vip',
      sourceHandle: 'bottom',
      target: 'pool',
      type: 'straight',
      style: { stroke: '#a855f7', strokeWidth: 2.5 }
    });

    // 4. MONITORS (Pool Sağında)
    (rawData.monitors || []).forEach((m, idx) => {
      const monId = `mon_${idx}`;
      nodes.push({
        id: monId,
        type: 'badgeNode',
        position: { x: POOL_X + 220, y: POOL_Y + (idx * 55) },
        data: { label: m, category: 'monitor', targetPos: Position.Left, isDark }
      });
      edges.push({
        id: `e-pool-${monId}`,
        source: 'pool',
        target: monId,
        type: 'straight',
        style: { stroke: '#f59e0b', strokeWidth: 1.5 }
      });
    });

    // 5. POOL MEMBERS (Pool Altı)
    const members = rawData.pool_members || [];
    const MEMBER_Y = 380;
    const SPACING = 170;
    const startX = -((members.length - 1) * SPACING) / 2;

    members.forEach((m, idx) => {
      const memId = `mem_${idx}`;
      nodes.push({
        id: memId,
        type: 'badgeNode',
        position: { x: startX + (idx * SPACING), y: MEMBER_Y },
        data: { label: m, category: 'member', targetPos: Position.Top, isDark }
      });
      edges.push({
        id: `e-pool-${memId}`,
        source: 'pool',
        target: memId,
        type: 'straight',
        style: { stroke: '#10b981', strokeWidth: 2 }
      });
    });
  }

  return { nodes, edges };
}

export default function ServiceMap({ mode }) {
  const isDark = mode === 'dark';

  const [selectedVip, setSelectedVip] = useState('');
  const [vipList, setVipList] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);

  const nodeTypes = useMemo(() => ({ vipNode: VipNode, badgeNode: BadgeNode }), []);

  // 1. VIP Listesini Getir
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/f5/vips')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : ["VS_PAYMENT_API", "VS_WEB_PORTAL", "VS_MOBILE_BACKEND"];
        setVipList(list);
        if (list.length > 0) setSelectedVip(list[0]);
      })
      .catch(() => {
        const mockList = ["VS_PAYMENT_API", "VS_WEB_PORTAL", "VS_MOBILE_BACKEND"];
        setVipList(mockList);
        setSelectedVip(mockList[0]);
      });
  }, []);

  // 2. VIP Seçilince Topolojiyi Çek
  useEffect(() => {
    if (!selectedVip) return;

    setLoading(true);
    fetch(`http://localhost:8000/api/v1/f5/vip-topology/${selectedVip}`)
      .then(res => res.json())
      .then(data => {
        setRawData(data);
        setGraphData(generateAutoLayout(data, isDark));
        setLoading(false);
      })
      .catch(err => {
        console.error("Topoloji çekme hatası:", err);
        setLoading(false);
      });
  }, [selectedVip]);

  // 3. Tema (`isDark`) Değişince Grafiği Yeniden Çiz
  useEffect(() => {
    if (rawData) {
      setGraphData(generateAutoLayout(rawData, isDark));
    }
  }, [isDark, rawData]);

  return (
    <div className={`flex flex-col h-screen p-4 space-y-4 transition-colors ${
      isDark ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* ÜST BAR: VIP SEÇİM ALANI */}
      <div className={`flex items-center justify-between p-4 rounded-xl border shadow-md transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            <span>🕸️</span> F5 Service Map
          </h1>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Topolojisini incelemek istediğiniz Virtual Server'ı seçin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className={`text-xs font-mono font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            VIP Seç:
          </label>
          <select
            value={selectedVip}
            onChange={(e) => setSelectedVip(e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm font-mono outline-none border transition-colors cursor-pointer ${
              isDark 
                ? 'bg-zinc-900 border-zinc-700 text-blue-400 focus:border-blue-500' 
                : 'bg-slate-50 border-slate-300 text-blue-600 focus:border-blue-500'
            }`}
          >
            {vipList.map(vip => (
              <option key={vip} value={vip}>{vip}</option>
            ))}
          </select>
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
          nodes={graphData.nodes} 
          edges={graphData.edges} 
          nodeTypes={nodeTypes} 
          fitView
        >
          <Background 
            color={isDark ? "#27272a" : "#cbd5e1"} 
            gap={20} 
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
