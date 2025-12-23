import React, { useState, useEffect, useMemo } from 'react';
import { Flashcard } from '../types';
import { Plus, Trash2, Play, RotateCw, X, Layers, Clock, AlertCircle } from 'lucide-react';

interface FlashcardSystemProps {
  cards: Flashcard[];
  notesContext: string;
  onUpdate: (cards: Flashcard[]) => void;
}

// Helper to format time until next review
const formatNextReview = (days: number): string => {
    if (days < 1) return '< 1d';
    if (days === 1) return '1d';
    return `${Math.round(days)}d`;
};

export const FlashcardSystem: React.FC<FlashcardSystemProps> = ({ cards, onUpdate }) => {
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '' });

  // Filter cards that are due for review
  const dueCardsCount = useMemo(() => {
      const now = Date.now();
      return cards.filter(c => !c.nextReview || c.nextReview <= now).length;
  }, [cards]);

  const addCard = () => {
    if (!newCard.front || !newCard.back) return;
    const card: Flashcard = {
        id: Date.now().toString(),
        front: newCard.front,
        back: newCard.back,
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        nextReview: Date.now(),
        state: 'new'
    };
    onUpdate([...cards, card]);
    setNewCard({ front: '', back: '' });
  };

  const removeCard = (id: string) => {
    onUpdate(cards.filter(c => c.id !== id));
  };

  // --- SRS ALGORITHM (Modified SM-2) ---
  const processRating = (card: Flashcard, quality: 0 | 3 | 4 | 5) => {
      // quality: 0 (Again), 3 (Hard), 4 (Good), 5 (Easy)
      
      let { interval = 0, repetitions = 0, easeFactor = 2.5 } = card;
      let nextReviewTimestamp = Date.now();

      if (quality < 3) {
          // FAILED (Again)
          repetitions = 0;
          interval = 0; // Reset to 0 days (review now/tomorrow)
      } else {
          // PASSED
          if (repetitions === 0) {
              interval = 1;
          } else if (repetitions === 1) {
              interval = 6;
          } else {
              interval = Math.round(interval * easeFactor);
          }
          repetitions++;
          
          // Adjust Ease Factor (SM-2 Formula)
          if (quality === 3) easeFactor = Math.max(1.3, easeFactor - 0.15); // Hard penalty
          if (quality === 5) easeFactor += 0.15; // Easy bonus
      }

      // Calculate next date (milliseconds)
      const daysInMs = interval * 24 * 60 * 60 * 1000;
      nextReviewTimestamp = Date.now() + daysInMs;

      // Update the card in the main list
      const updatedCard = {
          ...card,
          interval,
          repetitions,
          easeFactor,
          nextReview: nextReviewTimestamp,
          state: quality < 3 ? 'relearning' : 'review'
      };

      const updatedCardsList = cards.map(c => c.id === card.id ? updatedCard : c);
      onUpdate(updatedCardsList as Flashcard[]);

      // Move to next card in queue
      nextCard();
  };


  // --- STUDY MODE CONTROLLERS ---

  const startStudySession = (mode: 'due' | 'all') => {
    let queue = [];
    if (mode === 'due') {
        const now = Date.now();
        queue = cards.filter(c => !c.nextReview || c.nextReview <= now);
    } else {
        queue = [...cards];
    }

    if (queue.length === 0) return alert("¡No hay tarjetas pendientes para hoy! 🎉");
    
    // Sort logic: New cards mixed with reviews
    queue.sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));

    setStudyQueue(queue);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudyMode(true);
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentCardIndex < studyQueue.length - 1) {
      setTimeout(() => setCurrentCardIndex(curr => curr + 1), 150);
    } else {
        setIsStudyMode(false);
    }
  };

  // --- RENDER STUDY MODE ---
  if (isStudyMode && studyQueue.length > 0) {
    const currentCard = studyQueue[currentCardIndex];
    
    // Calculate projected intervals for UI buttons
    const calcNextInterval = (grade: number) => {
        let int = currentCard.interval || 0;
        let ef = currentCard.easeFactor || 2.5;
        let reps = currentCard.repetitions || 0;
        
        if (grade < 3) return 0; // < 1 min
        if (reps === 0) return 1;
        if (reps === 1) return 6;
        return Math.round(int * ef);
    };

    return (
      <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white/50">
            <div className="flex items-center gap-2 text-sm">
                <Clock size={16} /> Repaso Espaciado
            </div>
            <button 
                onClick={() => setIsStudyMode(false)}
                className="hover:text-white transition-colors p-2 bg-white/5 rounded-full"
            >
                <X size={24} />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-6 px-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">
                <span>Progreso de Sesión</span>
                <span>{currentCardIndex + 1} / {studyQueue.length}</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${((currentCardIndex + 1) / studyQueue.length) * 100}%` }}
                />
            </div>
        </div>

        {/* 3D Card Container */}
        <div 
            className="relative w-full max-w-xl aspect-[3/2] cursor-pointer group perspective-1000"
            onClick={() => !isFlipped && setIsFlipped(true)}
        >
            <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 border-b-8 border-gray-200">
                    <span className="absolute top-6 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold border border-gray-200 px-3 py-1 rounded-full">Pregunta</span>
                    <p className="text-2xl md:text-4xl font-serif text-gray-800 text-center font-medium leading-tight">{currentCard.front}</p>
                    <div className="absolute bottom-6 text-gray-400 text-xs flex items-center gap-2 animate-pulse">
                        <RotateCw size={14} /> Toca para ver respuesta
                    </div>
                </div>

                {/* Back */}
                <div 
                    className="absolute inset-0 backface-hidden bg-[#f8fafc] rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 border-b-8 border-purple-200 rotate-y-180"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <span className="absolute top-6 text-[10px] uppercase tracking-[0.2em] text-purple-500 font-bold border border-purple-200 px-3 py-1 rounded-full bg-purple-50">Respuesta</span>
                    <p className="text-xl md:text-2xl text-gray-800 leading-relaxed text-center font-medium">{currentCard.back}</p>
                </div>
            </div>
        </div>

        {/* SRS CONTROLS - Only visible when flipped */}
        <div className={`mt-10 grid grid-cols-4 gap-3 w-full max-w-xl transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            
            <button 
                onClick={() => processRating(currentCard, 0)}
                className="flex flex-col items-center justify-center py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
                <span className="text-sm font-bold">Mal</span>
                <span className="text-[10px] opacity-70">1 min</span>
            </button>

            <button 
                onClick={() => processRating(currentCard, 3)}
                className="flex flex-col items-center justify-center py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white transition-all active:scale-95"
            >
                <span className="text-sm font-bold">Difícil</span>
                <span className="text-[10px] opacity-70">{formatNextReview(calcNextInterval(3))}</span>
            </button>

            <button 
                onClick={() => processRating(currentCard, 4)}
                className="flex flex-col items-center justify-center py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
            >
                <span className="text-sm font-bold">Bien</span>
                <span className="text-[10px] opacity-70">{formatNextReview(calcNextInterval(4))}</span>
            </button>

            <button 
                onClick={() => processRating(currentCard, 5)}
                className="flex flex-col items-center justify-center py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all active:scale-95"
            >
                <span className="text-sm font-bold">Fácil</span>
                <span className="text-[10px] opacity-70">{formatNextReview(calcNextInterval(5))}</span>
            </button>
        </div>
        
        {!isFlipped && (
            <div className="mt-10 h-[68px] flex items-center justify-center">
                 <button 
                    onClick={() => setIsFlipped(true)}
                    className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
                >
                    Mostrar Respuesta
                </button>
            </div>
        )}

        <style>{`
            .perspective-1000 { perspective: 1000px; }
            .preserve-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .rotate-y-180 { transform: rotateY(180deg); }
        `}</style>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-[600px] rounded-xl shadow-sm border border-gray-200">
      
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Layers className="text-purple-600" />
                Sistema de Repaso (SRS)
            </h2>
            <p className="text-gray-500 text-sm mt-1">Algoritmo inteligente que ajusta la frecuencia según tu memoria.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             <div className="flex-1 md:flex-none bg-purple-50 border border-purple-100 rounded-lg p-3 flex flex-col items-center min-w-[100px]">
                 <span className="text-2xl font-bold text-purple-700 leading-none">{dueCardsCount}</span>
                 <span className="text-[10px] uppercase font-bold text-purple-400">Pendientes</span>
             </div>
             <div className="flex-1 md:flex-none bg-gray-50 border border-gray-100 rounded-lg p-3 flex flex-col items-center min-w-[100px]">
                 <span className="text-2xl font-bold text-gray-700 leading-none">{cards.length}</span>
                 <span className="text-[10px] uppercase font-bold text-gray-400">Total Deck</span>
             </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button 
                onClick={() => startStudySession('due')}
                disabled={dueCardsCount === 0}
                className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-between group relative overflow-hidden"
            >
                <div className="relative z-10 text-left">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition-colors">Comenzar Repaso Diario</h3>
                    <p className="text-gray-400 text-sm">
                        {dueCardsCount > 0 
                            ? `Tienes ${dueCardsCount} tarjetas que requieren atención hoy.` 
                            : '¡Estás al día! No hay tarjetas pendientes.'}
                    </p>
                </div>
                <div className="bg-white/10 p-4 rounded-full relative z-10 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Play size={32} fill="currentColor" className="ml-1"/>
                </div>
                
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-purple-900/50 transition-colors"></div>
            </button>

             <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl flex flex-col justify-center">
                 <h3 className="text-purple-800 font-bold mb-1">Modo Manual</h3>
                 <p className="text-xs text-purple-600 mb-0">Crea tus tarjetas a tu ritmo. Usa el formulario de abajo para añadir conceptos.</p>
             </div>
      </div>

      {/* Manual Entry */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-8 shadow-sm">
         <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2"><Plus size={14}/> Añadir Manualmente</h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
                 <input 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none text-sm transition-all"
                    placeholder="Pregunta (Frente)"
                    value={newCard.front}
                    onChange={e => setNewCard({...newCard, front: e.target.value})}
                />
            </div>
            <div className="md:col-span-5">
                <input 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none text-sm transition-all"
                    placeholder="Respuesta (Reverso)"
                    value={newCard.back}
                    onChange={e => setNewCard({...newCard, back: e.target.value})}
                />
            </div>
            <div className="md:col-span-2">
                 <button 
                    onClick={addCard}
                    disabled={!newCard.front || !newCard.back}
                    className="w-full h-full bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                    Añadir
                </button>
            </div>
        </div>
      </div>

      {/* Card List Table */}
      <div className="overflow-hidden border border-gray-200 rounded-xl">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3">Frente</th>
                    <th className="px-6 py-3 hidden sm:table-cell">Estado</th>
                    <th className="px-6 py-3 hidden md:table-cell">Próximo Repaso</th>
                    <th className="px-6 py-3 text-right">Acción</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {cards.map(card => {
                    const isDue = !card.nextReview || card.nextReview <= Date.now();
                    return (
                        <tr key={card.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 line-clamp-1">{card.front}</div>
                                <div className="text-gray-500 text-xs line-clamp-1 mt-0.5">{card.back}</div>
                            </td>
                            <td className="px-6 py-4 hidden sm:table-cell">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                    ${card.repetitions === 0 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                                `}>
                                    {card.repetitions === 0 ? 'Nuevo / Aprendiendo' : `Nivel ${card.repetitions}`}
                                </span>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell text-gray-500 font-mono text-xs">
                                {isDue 
                                    ? <span className="text-orange-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> AHORA</span> 
                                    : new Date(card.nextReview || Date.now()).toLocaleDateString()
                                }
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => removeCard(card.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {cards.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                            No hay tarjetas creadas aún.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};