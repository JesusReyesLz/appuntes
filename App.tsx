import React, { useState, useEffect } from 'react';
import { Plus, Printer, Save, Trash2, Menu, X, Book, Eraser, FileDown, ArrowLeft, Download } from 'lucide-react';
import { NotePage } from './types';
import { CornellEditor } from './components/CornellEditor';
import { StudyGuidePrintView } from './components/StudyGuidePrintView';

const STORAGE_KEY = 'cornell-notebook-data';

export default function App() {
  const [pages, setPages] = useState<NotePage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPrintPreview, setIsPrintPreview] = useState(false); 

  // Robust UUID generator
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  };

  const createNewPageObject = (): NotePage => ({
      id: generateUUID(),
      title: 'Nuevo Tema',
      date: new Date().toISOString().split('T')[0],
      readingContent: '',
      cues: '',
      notes: '',
      summary: '',
      references: [],
      quiz: [],
      flashcards: [],
      kwl: { know: '', want: '', learned: '' },
      solarSchema: '',
      createdAt: Date.now(),
  });

  // LOAD & SANITIZE DATA
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          
          const seenIds = new Set();
          let dataWasCorrupted = false;

          const cleanPages = parsed.map((p: any) => {
            // Check for duplicate or missing IDs
            let pid = p.id;
            if (!pid || seenIds.has(pid)) {
                pid = generateUUID(); // Assign new ID
                dataWasCorrupted = true;
            }
            seenIds.add(pid);

            return {
                ...p,
                id: pid,
                kwl: p.kwl || { know: '', want: '', learned: '' },
                solarSchema: p.solarSchema || '',
                quiz: p.quiz || [],
                flashcards: p.flashcards || [],
                references: p.references || [],
                readingContent: p.readingContent || '',
                cues: p.cues || '',
                summary: p.summary || ''
            };
          });
          
          setPages(cleanPages);
          
          // Ensure active page exists
          if (!activePageId || !cleanPages.find((p: any) => p.id === activePageId)) {
             setActivePageId(cleanPages[0].id);
          }

          // Force save if we fixed IDs
          if (dataWasCorrupted) {
             localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanPages));
          }

        } else {
            // Init with 1 empty page if array was empty
            const blank = createNewPageObject();
            setPages([blank]);
            setActivePageId(blank.id);
        }
      } catch (e) {
        console.error("Error loading data", e);
        const blank = createNewPageObject();
        setPages([blank]);
        setActivePageId(blank.id);
      }
    } else {
      // First time user
      const blank = createNewPageObject();
      setPages([blank]);
      setActivePageId(blank.id);
    }
  }, []);

  // Sync to Storage (Automatic backup)
  useEffect(() => {
    if (pages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    }
  }, [pages]);

  const createPage = () => {
    const newPage = createNewPageObject();
    const updatedPages = [newPage, ...pages];
    setPages(updatedPages);
    setActivePageId(newPage.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deletePage = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar este tema permanentemente?')) return;
    const remainingPages = pages.filter(p => p.id !== idToRemove);
    if (remainingPages.length === 0) {
        const blank = createNewPageObject();
        setPages([blank]);
        setActivePageId(blank.id);
    } else {
        setPages(remainingPages);
        if (activePageId === idToRemove) {
             setActivePageId(remainingPages[0].id);
        }
    }
  };
  
  const handleNuclearReset = () => {
      if(confirm("🚨 ¿ESTÁS SEGURO?\n\nEsto borrará TODOS tus temas y apuntes para siempre. Esta acción no se puede deshacer.")) {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
      }
  }

  const updateActivePage = (updatedPage: NotePage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pages, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `nexus_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportMarkdown = () => {
    if (!activePage) return;
    const p = activePage;
    const md = `
# ${p.title}
**Fecha:** ${p.date}

## Resumen Ejecutivo
${p.summary}

---

## 1. Tabla KWL (Contexto)
**Lo que sabía (Know):**
${p.kwl.know}

**Lo que quería saber (Want):**
${p.kwl.want}

**Lo que aprendí (Learned):**
${p.kwl.learned}

---

## 2. Apuntes Cornell
### Conceptos Clave
${p.cues.split('\n').map(l => `- ${l}`).join('\n')}

### Notas Principales
${p.notes}

---

## 3. Lectura Base
${p.readingContent}

---

## 4. Auto-Evaluación (Quiz)
${p.quiz.map((q, i) => `**P${i+1}. ${q.question}**\nR: ${q.answer}\n`).join('\n')}

## 5. Glosario (Flashcards)
${p.flashcards.map(f => `- **${f.front}**: ${f.back}`).join('\n')}
    `;

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md.trim());
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${p.title.replace(/\s+/g, '_')}_NEXUS.md`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const activePage = pages.find(p => p.id === activePageId);

  // --- PRINT PREVIEW MODE (RENDERED INSTEAD OF MAIN APP) ---
  if (isPrintPreview && activePage) {
      return (
          <div className="bg-white min-h-screen">
              {/* Navbar only visible on screen, hidden on print */}
              <div className="print:hidden sticky top-0 z-50 bg-gray-900 text-white p-4 shadow-lg flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                          onClick={() => setIsPrintPreview(false)}
                          className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors text-sm"
                      >
                          <ArrowLeft size={18} /> Volver a Editar
                      </button>
                      <span className="font-bold border-l border-gray-700 pl-3 hidden sm:inline">Vista Previa</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      <div className="text-right hidden lg:block">
                          <p className="text-sm font-bold text-yellow-400">Instrucciones:</p>
                          <p className="text-xs text-gray-400">En la ventana que se abre, selecciona <br/> "Destino: Guardar como PDF".</p>
                      </div>
                      <button 
                          onClick={handlePrintTrigger}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all animate-pulse"
                      >
                          <Download size={20} /> Guardar como PDF
                      </button>
                  </div>
              </div>

              {/* The Printable Document */}
              <div className="p-8 print:p-0 bg-gray-100 print:bg-white min-h-screen flex justify-center">
                   <div className="printable-content shadow-2xl print:shadow-none w-full max-w-[21cm] bg-white print:w-full">
                        <StudyGuidePrintView page={activePage} />
                   </div>
              </div>
          </div>
      );
  }

  // --- NORMAL APP MODE ---
  return (
    <>
        {/* Main Application - HIDDEN WHEN PRINTING */}
        <div className="flex h-screen overflow-hidden bg-[#f3f4f6] font-sans print:hidden">
        <aside 
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-gray-300 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-2xl md:shadow-none flex flex-col border-r border-gray-800`}
        >
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0f172a]">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight">
                <div className="bg-purple-600 p-1.5 rounded-lg">
                    <Book className="text-white w-5 h-5" />
                </div>
                <span>NEXUS<span className="text-purple-400 font-light">Study</span></span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                <X size={24} />
            </button>
            </div>

            <div className="p-4">
            <button 
                type="button"
                onClick={createPage}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-95 border border-purple-500/20"
            >
                <Plus size={20} /> Nuevo Tema
            </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 pb-20">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-1 mt-2">Biblioteca</h3>
            
            {pages.map((page) => (
                <div
                key={page.id}
                className={`flex items-stretch rounded-xl overflow-hidden transition-all duration-200 border border-transparent group ${
                    activePageId === page.id 
                    ? 'bg-gray-800 shadow-lg border-purple-500/30' 
                    : 'hover:bg-gray-800/50'
                }`}
                >
                <button
                    type="button"
                    className="flex-1 flex flex-col items-start justify-center p-3 pl-4 text-left focus:outline-none min-w-0"
                    onClick={() => {
                    setActivePageId(page.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                >
                    <span className={`font-medium truncate text-sm block w-full ${activePageId === page.id ? 'text-white' : 'text-gray-300'}`}>
                        {page.title || 'Sin Título'}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5 font-mono block">
                        {page.date}
                    </span>
                </button>
                <div className={`flex-none flex items-center justify-center border-l ${activePageId === page.id ? 'border-gray-700' : 'border-gray-700/20'}`}>
                    <button 
                    type="button"
                    onClick={(e) => deletePage(e, page.id)}
                    className="h-full px-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center justify-center"
                    title="Eliminar tema"
                    >
                    <Trash2 size={16} className="pointer-events-none" />
                    </button>
                </div>
                </div>
            ))}
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-[#0f172a] space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Online
                    </div>
                    <button 
                        onClick={handleNuclearReset}
                        className="text-xs text-gray-600 hover:text-red-400 flex items-center gap-1 transition-colors"
                        title="Borrar TODOS los datos (Reseteo de fábrica)"
                    >
                        <Eraser size={12} /> Reset
                    </button>
                </div>
            </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative bg-[#f3f4f6]">
            <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 shrink-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-lg">
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-800 hidden sm:block truncate max-w-lg tracking-tight">
                    {activePage?.title || 'Selecciona un tema'}
                </h1>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden md:flex"
                    title="Descargar como Markdown (para Obsidian/Notion)"
                >
                    <FileDown size={18} />
                </button>
                <button 
                    onClick={handleExportJSON}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Guardar copia de seguridad (JSON)"
                >
                    <Save size={18} />
                </button>
                <button 
                    onClick={() => setIsPrintPreview(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-lg shadow-md transition-all active:scale-95"
                >
                    <Printer size={18} />
                    <span className="hidden sm:inline">Exportar PDF</span>
                </button>
            </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {activePage ? (
                <CornellEditor page={activePage} onUpdate={updateActivePage} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <Book size={48} className="text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-500">Selecciona un tema o crea uno nuevo</p>
                <p className="text-sm text-gray-400">NEXUS te espera para comenzar a estudiar.</p>
                </div>
            )}
            </div>
        </main>

        {isSidebarOpen && (
            <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
            />
        )}
        </div>

        {/* PRINT LAYER - VISIBLE ONLY WHEN PRINTING (Ctrl+P) */}
        <div className="hidden print:block print:w-full">
            {activePage && <StudyGuidePrintView page={activePage} />}
        </div>
    </>
  );
}