import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Activity, TrendingUp, Target, X, ZoomIn, ZoomOut, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { usePanZoom } from '../hooks/usePanZoom';
import { useStore } from '../store';
import type { DailyNote } from '../store';

// SVG Coordinate Space
const G_WIDTH = 1000;
const G_HEIGHT = 800;

type GraphNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  note: DailyNote;
};

export const InsightsTab: React.FC = () => {
  const notes = useStore(state => state.daily_notes);
  const connections = useStore(state => state.note_connections);
  const gymSessions = useStore(state => state.gym_sessions);
  const financeMonths = useStore(state => state.finance_months);

  // --- 1. FORCE DIRECTED GRAPH SIMULATION ---
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panZoom = usePanZoom();

  useEffect(() => {
    if (notes.length === 0) return;

    // Initialize Nodes
    const newNodes: GraphNode[] = notes.slice(0, 50).map(n => ({
      id: n.id,
      x: Math.random() * G_WIDTH,
      y: Math.random() * G_HEIGHT,
      vx: 0,
      vy: 0,
      note: n
    }));

    const nodesMap = new Map<string, GraphNode>();
    newNodes.forEach(n => nodesMap.set(n.id, n));

    const edges = connections.filter(c => nodesMap.has(c.source_note_id) && nodesMap.has(c.target_note_id));

    // Simulation Loop (100 iterations synchronous)
    for (let i = 0; i < 150; i++) {
      // Repulsion
      for (let j = 0; j < newNodes.length; j++) {
        for (let k = j + 1; k < newNodes.length; k++) {
          let dx = newNodes[j].x - newNodes[k].x;
          let dy = newNodes[j].y - newNodes[k].y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 150) {
            let force = 2000 / (dist * dist);
            let fx = (dx / dist) * force;
            let fy = (dy / dist) * force;
            newNodes[j].vx += fx; newNodes[j].vy += fy;
            newNodes[k].vx -= fx; newNodes[k].vy -= fy;
          }
        }
      }
      
      // Attraction (Edges)
      edges.forEach(e => {
        let source = nodesMap.get(e.source_note_id)!;
        let target = nodesMap.get(e.target_note_id)!;
        let dx = target.x - source.x;
        let dy = target.y - source.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = (dist - 100) * 0.02 * (e.strength || 3);
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        source.vx += fx; source.vy += fy;
        target.vx -= fx; target.vy -= fy;
      });

      // Gravity to center
      newNodes.forEach(n => {
        let dx = (G_WIDTH / 2) - n.x;
        let dy = (G_HEIGHT / 2) - n.y;
        n.vx += dx * 0.005;
        n.vy += dy * 0.005;
      });

      // Update positions
      newNodes.forEach(n => {
        n.vx *= 0.85; // friction
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        // Bounds
        n.x = Math.max(40, Math.min(G_WIDTH - 40, n.x));
        n.y = Math.max(40, Math.min(G_HEIGHT - 40, n.y));
      });
    }

    setNodes(newNodes);
  }, [notes, connections]);

  // --- 2. ANALYTICS DERIVATION ---
  const currentMonthId = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const activeMonthFinance = financeMonths.find(m => m.id === currentMonthId);
  const activeMonthSavings = activeMonthFinance ? activeMonthFinance.distributedSavings?.reduce((s, d) => s + d.amount, 0) || 0 : 0;
  
  const currentMonthGymCount = gymSessions.filter(s => s.date.startsWith(currentMonthId)).length;
  
  const avgMoodWithGym = notes.filter(n => n.mood_score && gymSessions.some(g => g.date === new Date(n.date).toISOString().split('T')[0])).reduce((s, n) => s + (n.mood_score||0), 0) / (notes.filter(n => n.mood_score && gymSessions.some(g => g.date === new Date(n.date).toISOString().split('T')[0])).length || 1);
  const avgMoodWithoutGym = notes.filter(n => n.mood_score && !gymSessions.some(g => g.date === new Date(n.date).toISOString().split('T')[0])).reduce((s, n) => s + (n.mood_score||0), 0) / (notes.filter(n => n.mood_score && !gymSessions.some(g => g.date === new Date(n.date).toISOString().split('T')[0])).length || 1);

  // Fallbacks if data is too sparse
  const hasEnoughData = gymSessions.length >= 3 && financeMonths.length >= 1 && notes.length >= 5;

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const activeEdges = selectedNode ? connections.filter(c => c.source_note_id === selectedNode.id || c.target_note_id === selectedNode.id) : [];
  const isNodeActive = (id: string) => !selectedNode || id === selectedNode.id || activeEdges.some(e => e.source_note_id === id || e.target_note_id === id);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121212] overflow-hidden animate-fade-in-up">
      <div className="px-6 pt-8 pb-4 border-b border-gray-100 dark:border-[#2D3748] bg-white dark:bg-[#121212] z-20">
        <span className="text-xs font-semibold tracking-wider text-[#6B7280] uppercase">Intelligence</span>
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3F4F6] mt-1">Cross-Data Insights</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* SVG Network Cloud */}
        <div className={`relative w-full border-b border-gray-100 dark:border-[#2D3748] bg-[#F9F9FB] dark:bg-[#1A1A1A]/30 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[100] h-[100dvh]' : 'h-[400px]'}`} ref={containerRef}>
          
          {/* Floating Graph Controls */}
          <div className="absolute top-4 right-4 z-40 flex flex-col space-y-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2D3748] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-white shadow-sm active:scale-95 transition-all">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <div className="flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-[#2D3748] shadow-sm">
              <button onClick={panZoom.actions.zoomIn} className="w-10 h-10 bg-white dark:bg-[#1A1A1A] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-white border-b border-gray-200 dark:border-[#2D3748] active:bg-gray-100 dark:active:bg-[#2D3748] transition-colors">
                <ZoomIn size={18} />
              </button>
              <button onClick={panZoom.actions.zoomOut} className="w-10 h-10 bg-white dark:bg-[#1A1A1A] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-white border-b border-gray-200 dark:border-[#2D3748] active:bg-gray-100 dark:active:bg-[#2D3748] transition-colors">
                <ZoomOut size={18} />
              </button>
              <button onClick={panZoom.actions.resetView} className="w-10 h-10 bg-white dark:bg-[#1A1A1A] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-white active:bg-gray-100 dark:active:bg-[#2D3748] transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[#6B7280] font-medium p-8 text-center">
              Noch nicht genug Notizen für das Netzwerk vorhanden. Lade API-Key hoch und erstelle Notizen.
            </div>
          ) : (
            <svg 
              className="w-full h-full cursor-grab active:cursor-grabbing touch-none" 
              viewBox={`0 0 ${G_WIDTH} ${G_HEIGHT}`} 
              preserveAspectRatio="xMidYMid meet"
              {...panZoom.handlers}
            >
              <g style={{ transform: `translate(${panZoom.transform.x}px, ${panZoom.transform.y}px) scale(${panZoom.transform.scale})`, transformOrigin: '0 0' }}>
                {/* Edges */}
                {connections.filter(c => nodes.some(n=>n.id===c.source_note_id) && nodes.some(n=>n.id===c.target_note_id)).map(c => {
                  const s = nodes.find(n => n.id === c.source_note_id)!;
                  const t = nodes.find(n => n.id === c.target_note_id)!;
                  const isActive = selectedNodeId === null || c.source_note_id === selectedNodeId || c.target_note_id === selectedNodeId;
                  
                  return (
                    <path 
                      key={c.id} 
                      d={`M ${s.x} ${s.y} Q ${(s.x + t.x) / 2} ${(s.y + t.y) / 2 + 50} ${t.x} ${t.y}`} 
                      fill="none" 
                      stroke={isActive ? (selectedNodeId ? '#1A1A1A' : '#D1D5DB') : 'transparent'} 
                      strokeWidth={isActive ? (selectedNodeId ? 3 : 1) : 0} 
                      className="transition-all duration-500 ease-out dark:stroke-[#4A5568]"
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map(n => {
                  const active = isNodeActive(n.id);
                  const isSelected = selectedNodeId === n.id;
                  return (
                    <g key={n.id} 
                       className="transition-all duration-500 ease-out cursor-pointer"
                       style={{ opacity: active ? 1 : 0.2 }}
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedNodeId(isSelected ? null : n.id);
                       }}>
                      <circle 
                        cx={n.x} cy={n.y} r={isSelected ? 16 : 10} 
                        fill={n.note.ai_summary ? '#1A1A1A' : '#ffffff'} 
                        stroke={isSelected ? '#D4BA6A' : '#1A1A1A'} 
                        strokeWidth={isSelected ? 4 : 2} 
                        className="dark:stroke-gray-300 dark:fill-[#2D3748]"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Invisible Overlay to deselect */}
          {selectedNodeId && (
            <div className="absolute inset-0 z-0" onClick={() => setSelectedNodeId(null)} />
          )}

          {/* Quick Card Popover */}
          {selectedNode && (
            <div className="absolute top-6 left-6 right-20 p-5 bg-white dark:bg-[#121212] rounded-2xl shadow-lg border border-gray-100 dark:border-[#2D3748] z-30 animate-fade-in-up pointer-events-auto">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-[#D4BA6A]" />
                  <span className="font-bold text-sm text-[#1A1A1A] dark:text-[#F3F4F6]">
                    {new Date(selectedNode.note.date).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <button onClick={() => setSelectedNodeId(null)} className="text-gray-400 p-1 active:scale-95"><X size={16} /></button>
              </div>
              <p className="text-sm font-medium text-[#6B7280] leading-relaxed mb-3">
                {selectedNode.note.ai_summary || "Noch nicht von der KI analysiert."}
              </p>
              {selectedNode.note.mood_score && (
                <div className="inline-flex px-3 py-1 bg-[#F9F9FB] dark:bg-[#1A1A1A] rounded-lg text-xs font-bold text-[#1A1A1A] dark:text-gray-300">
                  Mood: {selectedNode.note.mood_score}/10
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Report */}
        <div className="p-6 space-y-8">
          <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">Dein Verhaltens-Report</h2>

          {/* Pattern 1: Mood vs Gym */}
          <div className="flex items-start space-x-4 bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#2D3748] p-5 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-bl-[100px] -z-0" />
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] flex items-center justify-center shrink-0 z-10 shadow-sm mt-1">
              <Activity size={18} />
            </div>
            <div className="flex-1 z-10">
              <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-1">Mood vs. Training</h3>
              {hasEnoughData ? (
                <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                  Dein durchschnittlicher Mood-Score ist an Tagen mit Training <strong className="text-[#1A1A1A] dark:text-white">{(avgMoodWithGym - avgMoodWithoutGym > 0 ? '+' : '')}{(avgMoodWithGym - avgMoodWithoutGym).toFixed(1)} Punkte</strong> {avgMoodWithGym >= avgMoodWithoutGym ? 'höher' : 'niedriger'}. 
                  Das Gym ist ein starker mentaler Katalysator für dich.
                </p>
              ) : (
                <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                  Sammle mehr Notizen mit Mood-Scores und Gym-Sessions, um deinen mentalen Katalysator zu finden. <em className="text-xs block mt-1 opacity-60">(KI-Analyse benötigt mehr Daten)</em>
                </p>
              )}
            </div>
          </div>

          {/* Pattern 2: Consistency vs Savings */}
          <div className="flex items-start space-x-4 bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#2D3748] p-5 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-[100px] -z-0" />
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#121212] flex items-center justify-center shrink-0 z-10 shadow-sm mt-1">
              <TrendingUp size={18} />
            </div>
            <div className="flex-1 z-10">
              <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-1">Trainings-Disziplin & Sparrate</h3>
              {hasEnoughData ? (
                <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                  Diesen Monat hast du <strong className="text-[#1A1A1A] dark:text-white">{currentMonthGymCount}x</strong> trainiert und <strong className="text-[#1A1A1A] dark:text-white">{activeMonthSavings}€</strong> gespart. Deine Disziplin im Gym spiegelt sich scheinbar auch im Budget wider.
                </p>
              ) : (
                <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                  Protokolliere Gym-Sessions und erstelle Umschlag-Budgets, um zu sehen, wie physische Disziplin dein Portemonnaie beeinflusst. <em className="text-xs block mt-1 opacity-60">(KI-Analyse benötigt mehr Daten)</em>
                </p>
              )}
            </div>
          </div>

          {/* Goal Alignment */}
          <div className="flex items-start space-x-4 bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#2D3748] p-5 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 dark:bg-amber-900/10 rounded-bl-[100px] -z-0" />
            <div className="w-10 h-10 rounded-full bg-[#E5D08F] text-[#1A1A1A] flex items-center justify-center shrink-0 z-10 shadow-[0_0_15px_rgba(229,208,143,0.4)] mt-1">
              <Target size={18} />
            </div>
            <div className="flex-1 z-10">
              <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6] mb-1">Synthesized Insight</h3>
              <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                Deine "Second Brain" Notizen deuten darauf hin, dass du bei klarem Fokus (hoher Mood-Score + Gym) am effizientesten auf deine großen Ziele hinarbeitest. Bleib dran!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
