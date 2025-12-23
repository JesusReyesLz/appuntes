import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, NotePage } from '../types';
import { sendMessageToNexus } from '../services/geminiService';
import { Send, Bot, User, Loader2, Sparkles, Command } from 'lucide-react';

interface StudyTutorProps {
  history: ChatMessage[];
  topic: string;
  onUpdateHistory: (history: ChatMessage[]) => void;
  onUpdatePage: (updates: Partial<NotePage>) => void;
}

export const StudyTutor: React.FC<StudyTutorProps> = ({ history, topic, onUpdateHistory, onUpdatePage }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Initial greeting if empty
  useEffect(() => {
    if (history.length === 0) {
      handleSend("Hola NEXUS, quiero empezar a estudiar.");
    }
  }, []);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    // 1. Optimistic UI update for user message
    const userMsg: ChatMessage = { role: 'user', text: text, timestamp: Date.now() };
    const historyWithUser = [...history, userMsg];
    
    onUpdateHistory(historyWithUser); 
    
    setInput('');
    setLoading(true);

    try {
      const { text: responseText, toolCalls } = await sendMessageToNexus(historyWithUser, text, topic);
      
      let finalAiText = responseText || "";
      let contentUpdates: Partial<NotePage> = {};
      let toolFeedback = "";

      // 2. Handle Tool Calls
      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
            if (call.name === 'update_study_material') {
                const args = call.args as any;
                
                // Direct String Assignments
                if (args.readingContent) contentUpdates.readingContent = args.readingContent;
                if (args.notes) contentUpdates.notes = args.notes;
                if (args.cues) contentUpdates.cues = args.cues;
                if (args.summary) contentUpdates.summary = args.summary;
                
                // Solar Schema (Now an Object, but state expects stringified JSON for compatibility with component)
                if (args.solarSchema) {
                   // If it's already an object, stringify it for the component state
                   const schemaVal = typeof args.solarSchema === 'object' ? JSON.stringify(args.solarSchema) : args.solarSchema;
                   contentUpdates.solarSchema = schemaVal;
                }
                
                // KWL Handling
                if (args.kwl) {
                    contentUpdates.kwl = { 
                        know: args.kwl.know || '', 
                        want: args.kwl.want || '', 
                        learned: '' 
                    };
                } else if (args.know || args.want) { // Fallback for old style
                    contentUpdates.kwl = {
                        know: args.know || '',
                        want: args.want || '',
                        learned: ''
                    }
                }

                // Quiz Handling (Direct Array)
                if (args.quiz && Array.isArray(args.quiz)) {
                     contentUpdates.quiz = args.quiz.map((i: any, idx: number) => ({
                        id: Date.now() + idx + 'q',
                        question: i.question || "",
                        answer: i.answer || ""
                    }));
                }

                // Flashcards Handling (Direct Array)
                if (args.flashcards && Array.isArray(args.flashcards)) {
                    contentUpdates.flashcards = args.flashcards.map((i: any, idx: number) => ({
                        id: Date.now() + idx + 'f',
                        front: i.front || "",
                        back: i.back || ""
                    }));
                }
                
                toolFeedback += "✅ He actualizado todas las secciones de tu libreta (Lectura, Apuntes, Esquema, Quiz y Flashcards).";
            }
        }
      }

      // 3. Construct Final Messages & Updates
      if (!finalAiText && toolFeedback) {
          finalAiText = toolFeedback;
      } else if (toolFeedback) {
          finalAiText += `\n\n${toolFeedback}`;
      }

      const aiMsg: ChatMessage = { 
        role: 'model', 
        text: finalAiText, 
        timestamp: Date.now() 
      };

      const finalHistory = [...historyWithUser, aiMsg];

      // 4. ATOMIC UPDATE
      const fullUpdatePackage: Partial<NotePage> = {
          ...contentUpdates,
          chatHistory: finalHistory
      };

      onUpdatePage(fullUpdatePackage);

    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = { 
        role: 'model', 
        text: "⚠️ Hubo un error de conexión con NEXUS. Por favor, intenta de nuevo.", 
        timestamp: Date.now() 
      };
      onUpdateHistory([...historyWithUser, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: "Generar TODO", cmd: "MODO GENERACIÓN TOTAL: Usa la herramienta update_study_material para llenar TODOS los campos ahora mismo: readingContent, kwl, notes, cues, summary, solarSchema, quiz (5 items) y flashcards (6 items)." },
    { label: "KWL", cmd: "/kwl" },
    { label: "Solar", cmd: "/solar" },
    { label: "Examen", cmd: "/examen" },
    { label: "Feynman", cmd: "/feynman" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">NEXUS AI</h2>
            <p className="text-purple-300 text-xs">Sistema de Aprendizaje Neuro-Adaptativo</p>
          </div>
        </div>
        <div className="text-gray-400 text-xs text-right hidden sm:block">
          Protocolo Solar<br/>Activo
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        {history.length === 0 && !loading && (
           <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
             <Sparkles size={48} className="mb-2" />
             <p>Iniciando protocolo...</p>
           </div>
        )}

        {history.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-purple-100 text-purple-700'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div 
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-white border border-gray-200 text-gray-800' 
                  : 'bg-white border border-purple-100 text-gray-800'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="animate-spin" size={14} />
              <span>NEXUS está pensando (planificando el contenido)...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
         {/* Quick Actions */}
         <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
            {quickActions.map(action => (
                <button
                    key={action.label}
                    onClick={() => handleSend(action.cmd)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
                >
                    <Command size={10} /> {action.label}
                </button>
            ))}
         </div>

        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu respuesta o usa los comandos..."
            className="w-full p-3 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none max-h-32 min-h-[50px] text-sm"
            rows={1}
            style={{ minHeight: '50px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};