import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Type, List, Highlighter, Heading1, Heading2, Eraser, AlignLeft, ChevronRight, Menu } from 'lucide-react';

interface ReadingSectionProps {
  content: string;
  topic: string;
  onUpdate: (content: string) => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

export const ReadingSection: React.FC<ReadingSectionProps> = ({ content, topic, onUpdate }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [isTocOpen, setIsTocOpen] = useState(true);
  const isInitialized = useRef(false);

  // Initialize content ONLY on first load to prevent cursor jumping
  useEffect(() => {
    if (!editorRef.current) return;
    
    if (!isInitialized.current) {
        if (content) {
            editorRef.current.innerHTML = content;
        } else {
            editorRef.current.innerHTML = '<p><br></p>';
        }
        updateToc();
        isInitialized.current = true;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onUpdate(editorRef.current.innerHTML);
      updateToc();
    }
  };

  // --- COMMANDS ---
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleHighlight = (color: string) => {
    execCmd('hiliteColor', color);
  };

  // --- TOC GENERATION ---
  const updateToc = () => {
    if (!editorRef.current) return;
    
    const headers = editorRef.current.querySelectorAll('h1, h2');
    const items: TocItem[] = [];
    
    headers.forEach((header, index) => {
      if (!header.id) header.id = `section-${index}`;
      
      items.push({
        id: header.id,
        text: header.textContent || 'Sin Título',
        level: header.tagName === 'H1' ? 1 : 2,
        element: header as HTMLElement
      });
    });

    setToc(items);
  };

  const scrollToSection = (element: HTMLElement) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const HIGHLIGHT_COLORS = [
    { color: '#fef08a', label: 'Amarillo', border: 'border-yellow-400' },
    { color: '#bbf7d0', label: 'Verde', border: 'border-green-400' },
    { color: '#bfdbfe', label: 'Azul', border: 'border-blue-400' },
    { color: '#fbcfe8', label: 'Rosa', border: 'border-pink-400' },
    { color: '#fed7aa', label: 'Naranja', border: 'border-orange-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-200px)] min-h-[600px] flex flex-col md:flex-row gap-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* === SIDEBAR: TABLE OF CONTENTS (INDEX) === */}
        <div className={`${isTocOpen ? 'w-full md:w-64' : 'w-12'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
                {isTocOpen ? (
                    <div className="flex items-center gap-2 text-gray-700">
                        <List size={18} />
                        <h3 className="font-bold text-sm uppercase tracking-wide">Índice</h3>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <List size={18} className="text-gray-500"/>
                    </div>
                )}
                <button onClick={() => setIsTocOpen(!isTocOpen)} className="text-gray-400 hover:text-gray-700">
                    {isTocOpen ? <ChevronRight size={18} className="rotate-180 md:rotate-0"/> : <Menu size={18}/>}
                </button>
            </div>
            
            {isTocOpen && (
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {toc.length === 0 ? (
                        <p className="text-xs text-gray-400 p-4 text-center italic">
                            Usa los botones H1 y H2 para crear secciones.
                        </p>
                    ) : (
                        toc.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.element)}
                                className={`w-full text-left p-2 rounded-lg text-xs hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-teal-700
                                    ${item.level === 1 ? 'font-bold' : 'pl-6 border-l-2 border-gray-200'}
                                `}
                            >
                                {item.text}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>

        {/* === MAIN CONTENT AREA === */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* TOOLBAR */}
            <div className="p-2 border-b border-gray-100 flex flex-wrap items-center gap-2 bg-white sticky top-0 z-10">
                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                    <button onClick={() => execCmd('formatBlock', 'H1')} className="p-2 hover:bg-white hover:shadow rounded text-gray-700" title="Título Principal (H1)">
                        <Heading1 size={18}/>
                    </button>
                    <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 hover:bg-white hover:shadow rounded text-gray-700" title="Subtítulo (H2)">
                        <Heading2 size={18}/>
                    </button>
                    <button onClick={() => execCmd('formatBlock', 'P')} className="p-2 hover:bg-white hover:shadow rounded text-gray-700" title="Párrafo Normal">
                        <Type size={18}/>
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                    <button onClick={() => execCmd('bold')} className="p-2 hover:bg-white hover:shadow rounded text-gray-700 font-bold" title="Negrita">
                        B
                    </button>
                    <button onClick={() => execCmd('italic')} className="p-2 hover:bg-white hover:shadow rounded text-gray-700 italic" title="Cursiva">
                        I
                    </button>
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-white hover:shadow rounded text-gray-700" title="Lista">
                        <List size={18}/>
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1.5 px-3">
                    <Highlighter size={16} className="text-gray-400 mr-1"/>
                    {HIGHLIGHT_COLORS.map((c) => (
                        <button
                            key={c.color}
                            onClick={() => handleHighlight(c.color)}
                            className={`w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition-transform ${c.border}`}
                            style={{ backgroundColor: c.color }}
                            title={`Subrayar ${c.label}`}
                        />
                    ))}
                    <button onClick={() => execCmd('removeFormat')} className="ml-2 p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded" title="Borrar Formato/Subrayado">
                        <Eraser size={16}/>
                    </button>
                </div>
            </div>

            {/* EDITOR CANVAS */}
            <div className="flex-1 relative bg-gray-50/30 overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto p-8 custom-scrollbar">
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        className="outline-none min-h-full max-w-4xl mx-auto prose prose-headings:font-sans prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-p:font-serif prose-p:text-gray-700 prose-p:leading-relaxed"
                        style={{ whiteSpace: 'pre-wrap' }} 
                    />
                </div>
            </div>
            
            <div className="px-6 py-2 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                <span>{topic}</span>
                <span>Palabras: {content ? content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length : 0}</span>
            </div>
        </div>

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            [contenteditable] h1 { margin-top: 1.5em; margin-bottom: 0.5em; color: #111; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.2em; }
            [contenteditable] h2 { margin-top: 1.2em; margin-bottom: 0.5em; color: #374151; }
            [contenteditable] ul { list-style-type: disc; padding-left: 1.5em; }
            [contenteditable]:empty:before { content: 'Pega o escribe tu texto aquí...'; color: #9ca3af; pointer-events: none; }
        `}</style>
    </div>
  );
};