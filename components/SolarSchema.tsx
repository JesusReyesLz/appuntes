import React, { useState, useEffect, useRef } from 'react';
import { Sun, ZoomIn, ZoomOut, Maximize, RotateCcw, X, LayoutTemplate, Play, Pause, Trash2, Edit3, ChevronRight, CornerDownRight, Focus, ArrowLeft, ArrowRight, GitBranch, Plus } from 'lucide-react';

interface SolarSchemaProps {
  content: string;
  topic: string;
  notesContext: string;
  onUpdate: (content: string) => void;
}

// Recursive Structure
interface SolarNode {
    id: string;
    type: 'sun' | 'planet' | 'moon' | 'asteroid';
    label: string;
    description?: string;
    children?: SolarNode[];
}

// Visual Config
const PLANET_THEMES = [
    { bg: 'from-blue-500 to-indigo-600', glow: 'shadow-[0_0_35px_rgba(59,130,246,0.6)]', border: 'border-blue-400' },
    { bg: 'from-purple-500 to-fuchsia-600', glow: 'shadow-[0_0_35px_rgba(168,85,247,0.6)]', border: 'border-purple-400' },
    { bg: 'from-emerald-500 to-teal-600', glow: 'shadow-[0_0_35px_rgba(16,185,129,0.6)]', border: 'border-emerald-400' },
    { bg: 'from-rose-500 to-red-600', glow: 'shadow-[0_0_35px_rgba(244,63,94,0.6)]', border: 'border-rose-400' },
    { bg: 'from-amber-500 to-orange-600', glow: 'shadow-[0_0_35px_rgba(245,158,11,0.6)]', border: 'border-amber-400' },
    { bg: 'from-cyan-500 to-sky-600', glow: 'shadow-[0_0_35px_rgba(6,182,212,0.6)]', border: 'border-cyan-400' },
];

export const SolarSchema: React.FC<SolarSchemaProps> = ({ content, topic, onUpdate }) => {
  const [rootData, setRootData] = useState<SolarNode | null>(null);
  
  // UX State
  const [selectedNode, setSelectedNode] = useState<SolarNode | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Camera
  const [zoom, setZoom] = useState(0.65); 
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Init
  useEffect(() => {
    try {
        if (content && content.trim().startsWith('{')) {
            const parsed = JSON.parse(content);
            if (parsed.type === 'sun' || parsed.sun) {
                setRootData(parsed);
            }
        }
    } catch (e) { /* Silent */ }
  }, [content]);

  // --- HIERARCHY HELPERS ---

  const generateID = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const getPathToNode = (root: SolarNode, targetId: string): SolarNode[] => {
      if (root.id === targetId) return [root];
      if (root.children) {
          for (const child of root.children) {
              const path = getPathToNode(child, targetId);
              if (path.length > 0) return [root, ...path];
          }
      }
      return [];
  };

  // --- CRUD OPERATIONS ---

  const modifyTree = (
      node: SolarNode, 
      targetId: string, 
      action: 'add_child' | 'add_sibling' | 'update' | 'delete' | 'move', 
      payload?: any
  ): SolarNode | null => {
      
      // REORDER / MOVE LOGIC (Donde yo quiera)
      if (action === 'move') {
          if (node.children) {
              const index = node.children.findIndex(c => c.id === targetId);
              if (index !== -1) {
                  const newChildren = [...node.children];
                  const item = newChildren[index];
                  // Swap logic
                  if (payload.direction === 'prev' && index > 0) {
                      newChildren[index] = newChildren[index - 1];
                      newChildren[index - 1] = item;
                  } else if (payload.direction === 'next' && index < newChildren.length - 1) {
                      newChildren[index] = newChildren[index + 1];
                      newChildren[index + 1] = item;
                  }
                  return { ...node, children: newChildren };
              }
              // Recurse
              return { 
                  ...node, 
                  children: node.children.map(child => modifyTree(child, targetId, action, payload)) as SolarNode[] 
              };
          }
          return node;
      }

      // DELETE LOGIC
      if (action === 'delete') {
          if (node.id === targetId) return null; // Remove this node
          if (node.children) {
              return { 
                  ...node, 
                  children: node.children
                      .map(child => modifyTree(child, targetId, action, payload))
                      .filter(child => child !== null) as SolarNode[] 
              };
          }
          return node;
      }

      // UPDATE LOGIC
      if (action === 'update') {
          if (node.id === targetId) return { ...node, ...payload };
          if (node.children) {
              return {
                  ...node,
                  children: node.children.map(child => modifyTree(child, targetId, action, payload)) as SolarNode[]
              };
          }
          return node;
      }

      // ADD CHILD LOGIC
      if (action === 'add_child') {
          if (node.id === targetId) {
              const nextTypeMap: Record<string, string> = { 'sun': 'planet', 'planet': 'moon', 'moon': 'asteroid', 'asteroid': 'asteroid' };
              const newChild: SolarNode = {
                  id: generateID(),
                  type: nextTypeMap[node.type] as any,
                  label: payload.label || 'Nuevo Elemento',
                  description: '',
                  children: []
              };
              setTimeout(() => setSelectedNode(newChild), 100);
              return { ...node, children: [...(node.children || []), newChild] };
          }
          if (node.children) {
              return {
                  ...node,
                  children: node.children.map(child => modifyTree(child, targetId, action, payload)) as SolarNode[]
              };
          }
          return node;
      }

      // ADD SIBLING LOGIC
      if (action === 'add_sibling') {
          if (node.children) {
              const siblingIndex = node.children.findIndex(c => c.id === targetId);
              if (siblingIndex !== -1) {
                  const siblingType = node.children[siblingIndex].type;
                  const newSibling: SolarNode = {
                      id: generateID(),
                      type: siblingType,
                      label: payload.label || 'Nuevo Vecino',
                      description: '',
                      children: []
                  };
                  setTimeout(() => setSelectedNode(newSibling), 100);
                  
                  const newChildren = [...node.children];
                  newChildren.splice(siblingIndex + 1, 0, newSibling);
                  
                  return { ...node, children: newChildren };
              }
              return {
                  ...node,
                  children: node.children.map(child => modifyTree(child, targetId, action, payload)) as SolarNode[]
              };
          }
      }

      return node;
  };

  const handleUpdateNode = (id: string, updates: Partial<SolarNode>) => {
      if (!rootData) return;
      const newRoot = modifyTree(rootData, id, 'update', updates);
      if (newRoot) {
          setRootData(newRoot);
          onUpdate(JSON.stringify(newRoot, null, 2));
          if (selectedNode?.id === id) setSelectedNode({ ...selectedNode, ...updates });
      }
  };

  const handleAdd = (targetId: string, mode: 'child' | 'sibling') => {
      if (!rootData) return;
      const newRoot = modifyTree(rootData, targetId, mode === 'child' ? 'add_child' : 'add_sibling', { label: 'Nuevo Concepto' });
      if (newRoot) {
          setRootData(newRoot);
          onUpdate(JSON.stringify(newRoot, null, 2));
      }
  };

  const handleMove = (targetId: string, direction: 'prev' | 'next') => {
      if (!rootData) return;
      const newRoot = modifyTree(rootData, targetId, 'move', { direction });
      if (newRoot) {
          setRootData(newRoot);
          onUpdate(JSON.stringify(newRoot, null, 2));
      }
  }

  const handleDeleteNode = (id: string) => {
      if (!rootData) return;
      if (!confirm("¿Eliminar este elemento y sus orbitales?")) return;
      const newRoot = modifyTree(rootData, id, 'delete');
      if (newRoot) {
          setRootData(newRoot);
          onUpdate(JSON.stringify(newRoot, null, 2));
          setSelectedNode(null);
      }
  };

  // --- MANUAL HANDLERS ---
  const handleManualInitialize = () => {
    const newRoot: SolarNode = {
        id: generateID(),
        type: 'sun',
        label: topic || 'Tema Central',
        description: 'Núcleo del sistema',
        children: []
    };
    setRootData(newRoot);
    onUpdate(JSON.stringify(newRoot, null, 2));
    setZoom(0.65);
    setPan({x:0, y:0});
  };

  // --- RENDERERS ---

  const renderAsteroids = (asteroids: SolarNode[]) => {
      const count = asteroids.length;
      return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
               {asteroids.map((ast, idx) => {
                   const angle = (360 / count) * idx;
                   const radius = 45;
                   return (
                       <div key={ast.id} className="absolute" style={{ transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)` }}>
                           <div 
                                className="w-4 h-4 bg-gray-300 rounded-full cursor-pointer pointer-events-auto hover:scale-150 hover:bg-white transition-all shadow-[0_0_8px_white] ring-2 ring-black border border-gray-400"
                                onClick={(e) => {e.stopPropagation(); setSelectedNode(ast)}}
                                title={ast.label}
                           />
                       </div>
                   );
               })}
          </div>
      );
  };

  const renderMoons = (moons: SolarNode[], planetIndex: number) => {
      const count = moons.length;
      const orbitRadius = 90 + (count * 5); 
      const duration = 25 + (planetIndex * 3);

      return (
        <>
            <div className="absolute rounded-full border border-white/10 pointer-events-none opacity-40 z-0"
                style={{ width: orbitRadius * 2, height: orbitRadius * 2, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            
            <div className={`absolute inset-0 ${isPaused || selectedNode ? 'paused' : ''} z-10`} style={{ animation: `spin ${duration}s linear infinite` }}>
                {moons.map((moon, idx) => {
                    const angle = (360 / count) * idx;
                    return (
                        <div key={moon.id} className="absolute top-1/2 left-1/2 w-0 h-0"
                            style={{ transform: `rotate(${angle}deg) translate(${orbitRadius}px) rotate(-${angle}deg)` }}>
                            
                            <div className={`${isPaused || selectedNode ? 'paused' : ''}`} style={{ animation: `spin-reverse ${duration}s linear infinite` }}>
                                <div 
                                    className={`relative flex flex-col items-center group cursor-pointer pointer-events-auto transition-transform duration-300 ${selectedNode?.id === moon.id ? 'scale-125 z-50' : 'hover:scale-110 z-20'}`}
                                    onClick={(e) => {e.stopPropagation(); setSelectedNode(moon)}}
                                >
                                    <div className={`w-8 h-8 rounded-full bg-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.4)] ${selectedNode?.id === moon.id ? 'ring-2 ring-white shadow-[0_0_20px_white]' : ''}`}>
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-500 opacity-90" />
                                    </div>
                                    <span className="mt-1 text-[9px] font-bold text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-md max-w-[100px] truncate text-center opacity-80 group-hover:opacity-100 border border-white/10 pointer-events-none">
                                        {moon.label}
                                    </span>
                                    {moon.children && renderAsteroids(moon.children)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
      );
  };

  const renderPlanets = (planets: SolarNode[]) => {
      return planets.map((planet, idx) => {
          const orbitRadius = 280 + (idx * 120); 
          const speed = 70 + (idx * 20); 
          const theme = PLANET_THEMES[idx % PLANET_THEMES.length];
          const isSelected = selectedNode?.id === planet.id;

          return (
            <React.Fragment key={planet.id}>
                {/* Track */}
                <div className={`absolute rounded-full border border-dashed pointer-events-none transition-all duration-500 z-0 ${isSelected ? 'border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.05)]' : 'border-gray-800'}`}
                    style={{ width: orbitRadius * 2, height: orbitRadius * 2, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

                {/* Orbit Container */}
                <div className={`absolute inset-0 ${isPaused || selectedNode ? 'paused' : ''} z-10`} style={{ animation: `spin ${speed}s linear infinite` }}>
                    <div className="absolute top-1/2 left-1/2 w-0 h-0" style={{ transform: `translate(${orbitRadius}px)` }}>
                        {/* Counter Rotation */}
                        <div className={`${isPaused || selectedNode ? 'paused' : ''}`} style={{ animation: `spin-reverse ${speed}s linear infinite` }}>
                            {/* Visual Node */}
                            <div className="relative flex flex-col items-center justify-center pointer-events-auto"
                                onClick={(e) => {e.stopPropagation(); setSelectedNode(planet)}}>
                                <div className={`
                                    w-24 h-24 rounded-full transition-all duration-500 cursor-pointer
                                    bg-gradient-to-br ${theme.bg} ${theme.glow} border-2 ${theme.border}
                                    flex items-center justify-center relative overflow-hidden group
                                    ${isSelected ? 'scale-125 ring-4 ring-white/30 z-50' : 'hover:scale-110 z-20'}
                                `}>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent)]" />
                                    <div className="absolute bottom-0 w-full h-1/2 bg-black/10 blur-md"></div>
                                    <span className="text-[10px] font-black text-white text-center px-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10 uppercase tracking-widest leading-none pointer-events-none">
                                        {planet.label.substring(0, 3)}
                                    </span>
                                </div>
                                <span className={`absolute top-full mt-3 text-[11px] text-cyan-100 font-bold bg-gray-900/90 px-3 py-1.5 rounded-full backdrop-blur-xl whitespace-nowrap border border-cyan-500/30 transition-all shadow-lg pointer-events-none ${isSelected ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100'}`}>
                                    {planet.label}
                                </span>
                                {planet.children && renderMoons(planet.children, idx)}
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
          );
      });
  };

  // --- CAMERA ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 0) { setIsDragging(true); setLastMousePos({ x: e.clientX, y: e.clientY }); }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan(prev => ({ x: prev.x + (e.clientX - lastMousePos.x), y: prev.y + (e.clientY - lastMousePos.y) }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  // --- UI COMPONENTS ---

  const Breadcrumbs = () => {
      if (!selectedNode || !rootData) return null;
      const path = getPathToNode(rootData, selectedNode.id);
      return (
          <div className="flex items-center gap-1.5 flex-wrap mb-3 px-1">
              {path.map((node, idx) => (
                  <React.Fragment key={node.id}>
                      <button 
                        onClick={() => setSelectedNode(node)}
                        className={`text-[10px] uppercase tracking-wider font-bold hover:text-white transition-colors
                            ${idx === path.length - 1 ? 'text-cyan-400' : 'text-gray-500'}
                        `}
                      >
                          {node.type}
                      </button>
                      {idx < path.length - 1 && <ChevronRight size={10} className="text-gray-600"/>}
                  </React.Fragment>
              ))}
          </div>
      );
  }

  return (
    <div className="max-w-[1920px] mx-auto h-[850px] flex flex-col relative bg-black rounded-xl overflow-hidden border border-gray-900 shadow-2xl select-none group/canvas font-sans">
        
        {/* === HEADER === */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent z-30 pointer-events-none"></div>
        <div className="absolute top-4 left-6 z-40 flex items-center gap-3 pointer-events-auto">
             <div className="bg-gray-900/50 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-lg">
                <LayoutTemplate className="text-orange-500" size={20}/>
             </div>
             <div>
                 <span className="text-white font-bold text-sm tracking-[0.2em] uppercase block">NEXUS Solar</span>
                 <span className="text-gray-500 text-[10px] uppercase tracking-widest">Cartografía Manual</span>
             </div>
        </div>

        {/* === FLOATING HUD (Top Right) === */}
        {selectedNode && (
            <div className="absolute top-20 right-6 w-96 max-w-[calc(100vw-48px)] bg-[#0a0a0b]/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] z-[100] flex flex-col animate-in slide-in-from-right-10 fade-in duration-300 max-h-[calc(100%-120px)] overflow-hidden ring-1 ring-white/5">
                
                {/* Header Strip */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${
                    selectedNode.type === 'sun' ? 'from-orange-500 to-red-600' :
                    selectedNode.type === 'planet' ? 'from-blue-500 to-indigo-600' :
                    selectedNode.type === 'moon' ? 'from-purple-500 to-fuchsia-600' :
                    'from-gray-500 to-white'
                }`}/>

                {/* Content */}
                <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                    <Breadcrumbs />

                    <div className="relative group">
                         <input 
                            className="bg-transparent border-none text-2xl font-black text-white p-0 focus:ring-0 w-full placeholder-white/20 leading-tight"
                            value={selectedNode.label}
                            onChange={(e) => handleUpdateNode(selectedNode.id, { label: e.target.value })}
                            placeholder="Nombre del concepto..."
                        />
                        <Edit3 size={14} className="absolute right-0 top-1.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>

                    <div className="relative group flex-1">
                        <textarea 
                            className="w-full h-full min-h-[120px] bg-black/20 border border-white/5 rounded-xl p-4 text-sm text-gray-300 resize-none focus:border-white/20 focus:bg-black/40 focus:ring-0 outline-none transition-all placeholder-gray-600 leading-relaxed font-light"
                            value={selectedNode.description || ''}
                            onChange={(e) => handleUpdateNode(selectedNode.id, { description: e.target.value })}
                            placeholder="Añade detalles, definiciones o notas clave aquí..."
                        />
                    </div>

                    {/* ACTIONS */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Estructura</label>
                            {/* REORDER BUTTONS */}
                            {selectedNode.type !== 'sun' && (
                                <div className="flex gap-1">
                                    <button onClick={() => handleMove(selectedNode.id, 'prev')} className="p-1 hover:text-white text-gray-500 transition-colors" title="Mover antes">
                                        <ArrowLeft size={14}/>
                                    </button>
                                    <button onClick={() => handleMove(selectedNode.id, 'next')} className="p-1 hover:text-white text-gray-500 transition-colors" title="Mover después">
                                        <ArrowRight size={14}/>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                             {/* ADD CHILD */}
                             {selectedNode.type !== 'asteroid' && (
                                 <button 
                                    onClick={() => handleAdd(selectedNode.id, 'child')}
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-white/20 group"
                                 >
                                    <div className="bg-indigo-500/20 p-1.5 rounded-full group-hover:bg-indigo-500 group-hover:text-white text-indigo-400 transition-colors">
                                        <CornerDownRight size={16}/> 
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider">
                                        Crear Hijo
                                    </span>
                                 </button>
                             )}

                             {/* ADD SIBLING */}
                             {selectedNode.type !== 'sun' && (
                                 <button 
                                    onClick={() => handleAdd(selectedNode.id, 'sibling')}
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-white/20 group"
                                 >
                                    <div className="bg-emerald-500/20 p-1.5 rounded-full group-hover:bg-emerald-500 group-hover:text-white text-emerald-400 transition-colors">
                                        <GitBranch size={16}/> 
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider">
                                        Crear Vecino
                                    </span>
                                 </button>
                             )}
                        </div>

                        {selectedNode.type !== 'sun' && (
                             <button 
                                onClick={() => handleDeleteNode(selectedNode.id)}
                                className="w-full py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-900/20 rounded-lg text-xs font-bold text-red-500 hover:text-red-300 flex items-center justify-center gap-2 transition-all mt-2"
                             >
                                <Trash2 size={12}/> Eliminar
                             </button>
                         )}
                    </div>
                </div>
                
                <button 
                    onClick={() => setSelectedNode(null)} 
                    className="absolute top-4 right-4 p-1 text-white/20 hover:text-white transition-colors"
                >
                    <X size={20}/>
                </button>
            </div>
        )}

        {/* === CANVAS === */}
        <div 
            ref={containerRef}
            className={`flex-1 relative overflow-hidden bg-black ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a103d] via-[#050505] to-black" />
                <div className="absolute w-full h-full opacity-70" style={{ 
                    backgroundImage: 'radial-gradient(white 1px, transparent 1px)', 
                    backgroundSize: '80px 80px', 
                    transform: `translate(${pan.x * 0.02}px, ${pan.y * 0.02}px)` 
                }}></div>
            </div>

            <div 
                className="absolute w-0 h-0 top-1/2 left-1/2 transition-transform duration-500 ease-out will-change-transform"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
                {rootData ? (
                    <>
                        {/* Sun */}
                        <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
                            onClick={(e) => {e.stopPropagation(); setSelectedNode(rootData)}}>
                            <div className="relative w-72 h-72">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-red-600 shadow-[0_0_150px_rgba(255,100,0,0.8)] animate-pulse-slow"></div>
                                <div className="absolute -inset-20 rounded-full bg-orange-600 blur-[80px] opacity-30 animate-pulse"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                     <span className="text-white font-black text-4xl text-center uppercase drop-shadow-2xl tracking-[0.2em] px-4 leading-none mix-blend-overlay">
                                        {rootData.label}
                                     </span>
                                </div>
                            </div>
                        </div>

                        {rootData.children && renderPlanets(rootData.children)}
                    </>
                ) : (
                    <div className="absolute flex flex-col items-center justify-center w-96 -ml-48 pointer-events-none text-center">
                        <Sun className="text-orange-600 animate-spin-slow mb-6" size={80}/>
                        <button onClick={handleManualInitialize} className="pointer-events-auto px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                             <Plus size={18}/>
                             INICIAR MAPA MENTAL
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* === BOTTOM CONTROLS === */}
        
        {/* 1. PLAY/PAUSE (Bottom Left) */}
        <div className="absolute bottom-8 left-8 z-40">
             <button onClick={() => setIsPaused(!isPaused)} className="p-4 bg-gray-900/80 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 text-cyan-400 transition-colors shadow-lg" title={isPaused ? "Reanudar Órbitas" : "Pausar Órbitas"}>
                {isPaused ? <Play size={24} fill="currentColor"/> : <Pause size={24} fill="currentColor"/>}
             </button>
        </div>

        {/* 2. ZOOM CONTROLS (Bottom Right - Vertical Stack) */}
        <div className="absolute bottom-8 right-8 z-40 flex flex-col gap-2">
             <div className="flex flex-col bg-gray-900/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-3 hover:bg-white/20 text-white transition-colors border-b border-white/10"><ZoomIn size={20}/></button>
                <div className="py-1 bg-black/50 text-center text-[10px] font-mono text-gray-500 cursor-default">{Math.round(zoom * 100)}%</div>
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-3 hover:bg-white/20 text-white transition-colors"><ZoomOut size={20}/></button>
             </div>
             <button onClick={() => { setZoom(0.65); setPan({x:0,y:0}); setSelectedNode(null); }} className="p-3 bg-gray-900/80 backdrop-blur border border-white/10 rounded-xl hover:bg-white/20 text-orange-400 transition-colors shadow-lg">
                <Focus size={20}/>
             </button>
        </div>

        <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes spin-reverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
            .paused { animation-play-state: paused !important; }
            .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            .animate-spin-slow { animation: spin 20s linear infinite; }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        `}</style>
    </div>
  );
};