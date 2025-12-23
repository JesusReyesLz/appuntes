import React, { useState, useRef, useEffect } from 'react';
import { NotePage } from '../types';
import { BrainCircuit, Layout, Layers, HelpCircle, Sun, BookOpen, FileText, Type, AlignLeft, Eraser } from 'lucide-react';
import { BibliographySection } from './BibliographySection';
import { FlashcardSystem } from './FlashcardSystem';
import { QuizSystem } from './QuizSystem';
import { KWLBoard } from './KWLBoard';
import { SolarSchema } from './SolarSchema';
import { ReadingSection } from './ReadingSection';

interface CornellEditorProps {
  page: NotePage;
  onUpdate: (updatedPage: NotePage) => void;
}

type Tab = 'reading' | 'kwl' | 'notes' | 'solar' | 'quiz' | 'flashcards';

// ----------------------------------------------------------------------
// EXTRACTED COMPONENT TO FIX FOCUS BUG (CRITICAL)
// ----------------------------------------------------------------------
const CornellPaper = ({ page, onUpdate }: { page: NotePage, onUpdate: (field: keyof NotePage, value: any) => void }) => {
    const notesRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize for "Infinite Paper" feel
    useEffect(() => {
        if (notesRef.current) {
            notesRef.current.style.height = 'auto';
            notesRef.current.style.height = notesRef.current.scrollHeight + 'px';
        }
    }, [page.notes]);

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Toolbar Area */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between sticky top-0 z-10 print:hidden">
                <div className="flex gap-2 items-center px-2">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Herramientas:</span>
                     <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Negrita (Visual)"><Type size={16}/></button>
                     <button className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Alinear"><AlignLeft size={16}/></button>
                     <div className="w-px h-4 bg-gray-300 mx-1"></div>
                     <button 
                        onClick={() => onUpdate('notes', '')}
                        className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded flex items-center gap-2 text-xs font-medium" 
                        title="Borrar Notas"
                    >
                        <Eraser size={16}/> Limpiar
                    </button>
                </div>
            </div>

            {/* THE PAPER */}
            <div className="bg-paper shadow-xl min-h-[29.7cm] flex flex-col relative print:shadow-none print:w-full rounded-sm overflow-hidden border border-gray-300">
                {/* Header Section */}
                <div className="p-10 border-b-2 border-black flex justify-between items-start bg-[#fdfbf7]">
                    <div className="flex-1 mr-12">
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Tema de Estudio</label>
                        <input
                            type="text"
                            className="w-full text-4xl font-serif font-bold bg-transparent border-b-2 border-dashed border-gray-300 focus:border-purple-600 focus:outline-none pb-2 placeholder-gray-300 text-gray-900 transition-colors"
                            placeholder="Introduce el Título..."
                            value={page.title}
                            onChange={(e) => onUpdate('title', e.target.value)}
                        />
                    </div>
                    <div className="w-48 text-right">
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Fecha</label>
                        <input
                            type="date"
                            className="w-full text-right text-sm bg-transparent border-none focus:outline-none text-gray-600 font-mono font-medium"
                            value={page.date}
                            onChange={(e) => onUpdate('date', e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Cornell Grid */}
                <div className="flex-1 flex flex-col md:flex-row h-full relative bg-[#fdfbf7]">
                    {/* Left Column: Cues */}
                    <div className="md:w-[30%] border-r-2 border-cornell-red min-h-[800px] flex flex-col relative group p-8 print:border-red-500 bg-red-50/5">
                        <textarea
                            className="w-full h-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed font-bold text-gray-600 placeholder-red-200/50"
                            placeholder="Preguntas clave..."
                            value={page.cues}
                            onChange={(e) => onUpdate('cues', e.target.value)}
                        />
                    </div>

                    {/* Right Column: Notes (Lined Paper Effect) */}
                    <div className="md:w-[70%] relative group min-h-[800px] bg-white">
                        <div className="absolute inset-0 pointer-events-none opacity-20" 
                            style={{
                                backgroundImage: 'linear-gradient(#000000 1px, transparent 1px)',
                                backgroundSize: '100% 32px',
                                marginTop: '31px'
                            }}
                        ></div>
                        <textarea
                            ref={notesRef}
                            className="w-full h-full bg-transparent resize-none focus:outline-none text-base text-gray-900 font-serif placeholder-gray-300 p-0 pl-8 pt-[6px]"
                            style={{
                                lineHeight: '32px',
                                minHeight: '800px',
                                backgroundAttachment: 'local'
                            }}
                            placeholder="Comienza a escribir tus notas aquí. El papel crecerá automáticamente..."
                            value={page.notes}
                            onChange={(e) => onUpdate('notes', e.target.value)}
                        />
                    </div>
                </div>

                {/* Bottom Section: Summary */}
                <div className="border-t-2 border-black p-8 bg-gray-50/80 print:bg-transparent break-inside-avoid">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Resumen (Síntesis)</h3>
                    </div>
                    <textarea
                        className="w-full bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 resize-none focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all placeholder-gray-300 leading-relaxed shadow-sm"
                        rows={5}
                        placeholder="Escribe un resumen de 2-3 oraciones que condense lo más importante del tema..."
                        value={page.summary}
                        onChange={(e) => onUpdate('summary', e.target.value)}
                    />
                    
                    <BibliographySection 
                        references={page.references || []}
                        onChange={(refs) => onUpdate('references', refs)}
                        topicContext={page.title}
                        notesContext={page.notes}
                    />
                </div>
            </div>
        </div>
    );
};
// ----------------------------------------------------------------------


export const CornellEditor: React.FC<CornellEditorProps> = ({ page, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('notes');

  const handleUpdate = (field: keyof NotePage, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  const TabButton = ({ id, label, icon: Icon, activeColor }: { id: Tab, label: string, icon: any, activeColor: string }) => {
    const isActive = activeTab === id;
    return (
        <button 
            onClick={() => setActiveTab(id)}
            className={`
                group flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden flex-shrink-0
                ${isActive ? `${activeColor} text-white shadow-lg shadow-purple-900/10 scale-100 ring-2 ring-offset-2 ring-offset-gray-100 ring-transparent` : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'}
            `}
        >
            <Icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
            {label}
            {isActive && <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
        {/* Modern Tab Navigation */}
        <div className="w-full mb-6 print:hidden">
            <div className="flex overflow-x-auto pb-4 pt-2 px-1 gap-3 no-scrollbar snap-x">
                <TabButton id="reading" label="Lectura" icon={FileText} activeColor="bg-teal-600" />
                <TabButton id="kwl" label="KWL Board" icon={BookOpen} activeColor="bg-blue-600" />
                <TabButton id="notes" label="Apuntes" icon={Layout} activeColor="bg-gray-900" />
                <TabButton id="solar" label="Esquema Solar" icon={Sun} activeColor="bg-amber-500" />
                <TabButton id="quiz" label="Quiz" icon={HelpCircle} activeColor="bg-indigo-600" />
                <TabButton id="flashcards" label="Flashcards" icon={Layers} activeColor="bg-pink-600" />
            </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'reading' && (
                <ReadingSection 
                    content={page.readingContent || ''}
                    topic={page.title}
                    onUpdate={(content) => handleUpdate('readingContent', content)}
                />
            )}

            {activeTab === 'kwl' && (
                <KWLBoard 
                    data={page.kwl || { know: '', want: '', learned: '' }}
                    topic={page.title}
                    onUpdate={(kwl) => handleUpdate('kwl', kwl)}
                />
            )}
            
            <div className={activeTab === 'notes' ? 'block' : 'hidden'}>
                <CornellPaper page={page} onUpdate={handleUpdate} />
            </div>
            
            {activeTab === 'solar' && (
                <SolarSchema 
                    content={page.solarSchema || ''}
                    topic={page.title}
                    notesContext={page.readingContent + '\n' + page.notes}
                    onUpdate={(content) => handleUpdate('solarSchema', content)}
                />
            )}
            
            {activeTab === 'quiz' && (
                <QuizSystem 
                    quiz={page.quiz || []} 
                    notesContext={page.readingContent + '\n' + page.notes}
                    onUpdate={(newQuiz) => handleUpdate('quiz', newQuiz)}
                />
            )}

            {activeTab === 'flashcards' && (
                <FlashcardSystem 
                    cards={page.flashcards || []}
                    notesContext={page.readingContent + '\n' + page.notes}
                    onUpdate={(newCards) => handleUpdate('flashcards', newCards)}
                />
            )}
        </div>
    </div>
  );
};