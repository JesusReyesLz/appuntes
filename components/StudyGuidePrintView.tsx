import React from 'react';
import { NotePage } from '../types';
import { Sun, BookOpen, BrainCircuit, Layers, FileText, Scissors, GraduationCap, Quote, Link as LinkIcon, Calendar, Hash, CheckCircle2, Circle } from 'lucide-react';

interface StudyGuidePrintViewProps {
  page: NotePage;
}

// --- VISUALIZADOR DE ESQUEMA SOLAR ESTILO "LÍNEA DE METRO" ---
const SolarAtlasView = ({ jsonContent }: { jsonContent: string }) => {
    let rootData = null;
    try {
        if (jsonContent) rootData = JSON.parse(jsonContent);
    } catch (e) { return null; }

    if (!rootData) return (
        <div className="border-2 border-dashed border-gray-300 p-8 rounded-xl text-center text-gray-400 italic bg-gray-50">
            El Esquema Solar no se ha generado para este tema.
        </div>
    );

    const renderNode = (node: any, level: number, isLast: boolean = false) => {
        const hasChildren = node.children && node.children.length > 0;
        
        return (
            <div key={node.id || Math.random()} className="relative pl-0">
                {/* Connector Line Vertical (Only for children) */}
                <div className="flex group">
                    {/* LEFT COLUMN: VISUALIZERS */}
                    <div className="flex flex-col items-center mr-6 relative min-w-[40px]">
                        
                         {/* Vertical Line passing through */}
                        {level > 0 && !isLast && (
                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -ml-[1px] bg-gray-300 z-0"></div>
                        )}
                        {level > 0 && isLast && (
                            <div className="absolute top-0 h-4 left-1/2 w-0.5 -ml-[1px] bg-gray-300 z-0"></div>
                        )}

                        {/* Node Dot */}
                        <div className={`relative z-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm
                            ${level === 0 ? 'w-16 h-16 bg-black text-white mb-6' : 
                              level === 1 ? 'w-10 h-10 bg-white border-4 border-black text-black mt-1' : 
                              level === 2 ? 'w-4 h-4 bg-gray-400 mt-2' : 
                              'w-2 h-2 bg-gray-300 mt-2.5'}
                        `}>
                            {level === 0 && <Sun size={32} strokeWidth={1.5} />}
                            {level === 1 && <span className="text-sm font-black">{node.label.charAt(0)}</span>}
                        </div>
                        
                        {/* Vertical line continuing down if parent has more children */}
                        {hasChildren && level === 0 && (
                             <div className="flex-1 w-1 bg-black mt-[-10px] z-0"></div>
                        )}
                        {hasChildren && level > 0 && (
                            <div className="flex-1 w-0.5 bg-gray-300"></div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: CONTENT */}
                    <div className={`flex-1 pb-8 ${level === 0 ? 'pt-2' : ''}`}>
                        <div className={`border-b border-gray-100 pb-4 ${level === 0 ? 'border-b-4 border-black pb-8' : ''}`}>
                             <h4 className={`font-sans leading-tight
                                ${level === 0 ? 'text-5xl font-black uppercase tracking-tighter mb-2' : ''}
                                ${level === 1 ? 'text-xl font-bold uppercase tracking-wide text-gray-900' : ''}
                                ${level === 2 ? 'text-sm font-bold text-gray-800' : ''}
                                ${level === 3 ? 'text-xs font-medium text-gray-600' : ''}
                             `}>
                                {node.label}
                             </h4>
                             {node.description && (
                                <p className={`font-serif text-justify leading-snug mt-1
                                    ${level === 0 ? 'text-xl font-light text-gray-600' : ''}
                                    ${level === 1 ? 'text-sm text-gray-600' : ''}
                                    ${level > 1 ? 'text-xs text-gray-500 italic' : ''}
                                `}>
                                    {node.description}
                                </p>
                             )}
                        </div>

                        {/* RECURSION */}
                        {hasChildren && (
                            <div className={`mt-4 ${level === 0 ? 'border-l-4 border-black pl-8 ml-[-43px]' : 'pl-0'}`}>
                                {node.children.map((child: any, idx: number) => 
                                    renderNode(child, level + 1, idx === node.children.length - 1)
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white">
            {renderNode(rootData, 0)}
        </div>
    );
};

export const StudyGuidePrintView: React.FC<StudyGuidePrintViewProps> = ({ page }) => {
  return (
    <div className="max-w-[21cm] mx-auto bg-white text-black font-sans leading-relaxed print:w-full print:max-w-none">
        
        {/* =======================
            PORTADA (MAGAZINE STYLE)
           ======================= */}
        <div className="h-[29.7cm] flex flex-col relative page-break overflow-hidden border-8 border-double border-black m-0 p-0">
             
             {/* Pattern Background */}
             <div className="absolute inset-0 opacity-[0.03]" 
                  style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
             </div>

             {/* Top Banner */}
             <div className="bg-black text-white p-12 pt-20 relative z-10">
                <div className="flex justify-between items-start mb-12">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center">
                            <GraduationCap size={32} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-70">Study Dossier</span>
                            <span className="text-2xl font-black tracking-tighter">NEXUS</span>
                        </div>
                     </div>
                     <div className="text-right">
                         <div className="inline-block border border-white/30 px-4 py-1 rounded-full text-[10px] font-mono mb-2">
                             ID: {page.id.substring(0,8).toUpperCase()}
                         </div>
                         <div className="text-4xl font-black opacity-20">2024</div>
                     </div>
                </div>

                <h1 className="text-7xl font-black leading-[0.85] tracking-tighter mb-8 break-words text-white mix-blend-difference">
                    {page.title}
                </h1>
                
                <div className="w-full h-2 bg-white mb-8"></div>
                
                <div className="flex gap-12 text-sm font-medium opacity-80 font-mono">
                    <div>
                        <span className="block text-[10px] uppercase opacity-50">Fecha</span>
                        {page.date}
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase opacity-50">Autor</span>
                        Estudiante
                    </div>
                     <div>
                        <span className="block text-[10px] uppercase opacity-50">Método</span>
                        Cornell + Solar
                    </div>
                </div>
             </div>

             {/* Middle Content */}
             <div className="flex-1 p-12 flex flex-col justify-center relative z-10">
                 {page.summary && (
                     <div className="relative">
                         <Quote className="absolute -top-6 -left-6 text-gray-100 transform -scale-x-100" size={120} />
                         <p className="text-3xl font-serif italic text-gray-800 leading-snug relative z-10 text-justify">
                            "{page.summary}"
                         </p>
                         <div className="w-24 h-2 bg-black mt-8"></div>
                     </div>
                 )}
             </div>

             {/* Bottom Index */}
             <div className="p-12 pb-20 bg-gray-50 border-t-4 border-black">
                 <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Contenido del Reporte</h3>
                 <div className="grid grid-cols-2 gap-y-4 gap-x-12 text-sm font-bold">
                     <div className="flex justify-between border-b border-gray-300 pb-2"><span>01. Mapa Mental Solar</span> <span>p.2</span></div>
                     <div className="flex justify-between border-b border-gray-300 pb-2"><span>02. Contexto KWL</span> <span>p.3</span></div>
                     <div className="flex justify-between border-b border-gray-300 pb-2"><span>03. Apuntes Cornell</span> <span>p.4</span></div>
                     <div className="flex justify-between border-b border-gray-300 pb-2"><span>04. Banco de Preguntas</span> <span>p.X</span></div>
                 </div>
             </div>
        </div>

        {/* =======================
            1. MAPA MENTAL (INFOGRAPHIC STYLE)
           ======================= */}
        <div className="py-12 px-8 page-break">
            <div className="flex items-end justify-between border-b-8 border-black mb-12 pb-2">
                <h2 className="text-6xl font-black tracking-tighter uppercase">01.<br/>Mapa Mental</h2>
                <Sun size={64} strokeWidth={1} className="mb-2"/>
            </div>
            
            <SolarAtlasView jsonContent={page.solarSchema} />
        </div>

        {/* =======================
            2. CONTEXTO KWL (DASHBOARD STYLE)
           ======================= */}
        <section className="py-12 px-8 page-break bg-gray-50 h-[29.7cm]">
            <div className="flex items-end justify-between border-b-4 border-black mb-8 pb-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase">02. Contexto KWL</h2>
                <div className="text-xs font-mono font-bold uppercase border border-black px-2 py-1 bg-white">Pre & Post Estudio</div>
            </div>

            <div className="flex flex-col gap-6 h-full pb-20">
                {/* KNOW CARD */}
                <div className="flex-1 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-lg flex flex-col">
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-dashed border-gray-200 pb-2">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black">K</div>
                        <h3 className="font-bold text-lg uppercase tracking-wide">Conocimiento Previo</h3>
                    </div>
                    <div className="flex-1 font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">{page.kwl.know}</div>
                </div>

                {/* WANT CARD */}
                <div className="flex-1 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-lg flex flex-col">
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-dashed border-gray-200 pb-2">
                        <div className="w-8 h-8 bg-white border-2 border-black text-black rounded-full flex items-center justify-center font-black">W</div>
                        <h3 className="font-bold text-lg uppercase tracking-wide">Objetivos & Dudas</h3>
                    </div>
                    <div className="flex-1 font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">{page.kwl.want}</div>
                </div>

                 {/* LEARNED CARD */}
                 <div className="flex-1 bg-black text-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] p-6 rounded-lg flex flex-col">
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-dashed border-gray-700 pb-2">
                        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-black">L</div>
                        <h3 className="font-bold text-lg uppercase tracking-wide">Aprendizaje Consolidado</h3>
                    </div>
                    <div className="flex-1 font-serif text-gray-200 leading-relaxed whitespace-pre-wrap">{page.kwl.learned}</div>
                </div>
            </div>
        </section>

        {/* =======================
            3. APUNTES CORNELL (CLEAN ACADEMIC)
           ======================= */}
        <section className="py-12 px-8 page-break">
             <div className="flex items-end justify-between border-b-8 border-gray-200 mb-8 pb-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase text-gray-400">03. Cornell Notes</h2>
                <BrainCircuit size={32} className="text-gray-400"/>
            </div>
            
            <div className="border-t-4 border-black">
                 {/* Layout Grid */}
                 <div className="grid grid-cols-[28%_72%] min-h-[800px]">
                     
                     {/* Cues Column */}
                     <div className="border-r-2 border-gray-300 pr-6 py-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
                            <Circle size={8} fill="currentColor"/> Conceptos Clave
                        </h3>
                        <div className="font-sans font-bold text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                            {page.cues}
                        </div>
                     </div>

                     {/* Notes Column */}
                     <div className="pl-8 py-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Circle size={8} fill="currentColor"/> Desarrollo del Tema
                        </h3>
                        <div className="font-serif text-base text-justify leading-8 text-gray-900 whitespace-pre-wrap" 
                             style={{backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '100% 32px', lineHeight: '32px'}}>
                            {page.notes}
                        </div>
                     </div>
                 </div>

                 {/* Summary Box */}
                 <div className="bg-gray-100 p-8 border-l-4 border-black mt-4 break-inside-avoid">
                     <h3 className="font-black text-sm uppercase tracking-widest mb-3">Síntesis Final</h3>
                     <p className="font-serif italic text-gray-800">{page.summary}</p>
                 </div>
            </div>
        </section>

        {/* =======================
            4. LECTURA BASE (TEXTBOOK STYLE)
           ======================= */}
        {page.readingContent && (
            <section className="py-12 px-8 page-break">
                <div className="flex items-center gap-4 mb-8">
                     <div className="bg-black text-white px-3 py-1 text-sm font-bold uppercase tracking-widest">Fuente</div>
                     <h2 className="text-2xl font-bold uppercase tracking-tight">Lectura de Referencia</h2>
                </div>
                
                <div className="border-t border-b border-black py-8">
                    <div className="text-justify text-xs leading-6 text-gray-900 columns-2 gap-12 font-serif prose prose-h1:text-xl prose-h1:font-sans prose-h1:font-black prose-h1:uppercase prose-h1:mt-4 prose-p:indent-4">
                        <div dangerouslySetInnerHTML={{ __html: page.readingContent }} />
                    </div>
                </div>
            </section>
        )}

        {/* =======================
            5. REPASO (CARDS GRID)
           ======================= */}
        <section className="py-12 px-8 bg-gray-900 text-white min-h-[29.7cm]">
             <div className="flex items-end justify-between border-b-4 border-white mb-12 pb-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase">04. Recursos</h2>
                <Layers size={32} />
            </div>

            {/* Quiz */}
            {page.quiz.length > 0 && (
                <div className="mb-16 break-inside-avoid">
                    <h3 className="font-black text-xl mb-6 uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <CheckCircle2 size={20}/> Banco de Preguntas
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {page.quiz.map((q, i) => (
                            <div key={i} className="bg-gray-800 p-4 rounded border border-gray-700 break-inside-avoid flex gap-4">
                                <div className="font-mono text-gray-500 font-bold text-xl">0{i+1}</div>
                                <div>
                                    <p className="font-bold text-white mb-2">{q.question}</p>
                                    <div className="flex items-start gap-2 text-sm text-gray-300 font-serif italic border-l-2 border-green-500 pl-3">
                                        <span className="not-italic font-sans text-[10px] font-bold uppercase text-green-500 mt-1">R:</span> 
                                        {q.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Flashcards */}
            {page.flashcards.length > 0 && (
                <div className="break-inside-avoid">
                    <div className="flex items-center justify-between mb-6">
                         <h3 className="font-black text-xl uppercase tracking-widest text-gray-400 flex items-center gap-2">
                             <Scissors size={20}/> Flashcards (Recortables)
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {page.flashcards.map((f, i) => (
                            <div key={i} className="bg-white text-black p-0 min-h-[140px] relative rounded break-inside-avoid overflow-hidden">
                                {/* Dotted Cut Line */}
                                <div className="absolute inset-0 border-2 border-dashed border-gray-400 m-1 rounded-sm pointer-events-none"></div>
                                
                                <div className="h-1/2 border-b border-dashed border-gray-300 flex items-center justify-center p-4">
                                     <strong className="text-center font-black uppercase text-sm">{f.front}</strong>
                                </div>
                                <div className="h-1/2 flex items-center justify-center p-4 bg-gray-50">
                                     <p className="text-center text-xs font-serif italic leading-tight text-gray-600">{f.back}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>

        {/* Footer */}
        <div className="text-center py-8 font-mono text-[10px] uppercase text-gray-400">
             NEXUS Manual Learning System • {new Date().getFullYear()}
        </div>
    </div>
  );
};