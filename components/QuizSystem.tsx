import React, { useState } from 'react';
import { QuizItem } from '../types';
import { CheckCircle, HelpCircle, ChevronDown, ChevronUp, Trash2, Plus, PenTool } from 'lucide-react';

interface QuizSystemProps {
  quiz: QuizItem[];
  notesContext: string;
  onUpdate: (quiz: QuizItem[]) => void;
}

export const QuizSystem: React.FC<QuizSystemProps> = ({ quiz, onUpdate }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newQ, setNewQ] = useState({ question: '', answer: '' });

  const handleAddQuestion = () => {
    if (!newQ.question || !newQ.answer) return;
    const newItem: QuizItem = {
      id: Date.now().toString(),
      question: newQ.question,
      answer: newQ.answer,
      userAnswer: '',
    };
    onUpdate([...quiz, newItem]);
    setNewQ({ question: '', answer: '' });
  };

  const handleDelete = (id: string) => {
    onUpdate(quiz.filter(q => q.id !== id));
  };

  const handleAnswerChange = (id: string, text: string) => {
    onUpdate(quiz.map(q => q.id === id ? { ...q, userAnswer: text } : q));
  };

  const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-[600px] rounded-xl shadow-sm border border-gray-200">
         <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="text-indigo-600" />
                    Cuestionario de Repaso
                </h2>
                <p className="text-gray-500 text-sm">Crea tus propias preguntas para autoevaluarte.</p>
            </div>
        </div>

        {/* Manual Add Form */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-8">
            <h3 className="text-xs font-bold uppercase text-indigo-500 mb-3 flex items-center gap-2">
                <Plus size={14}/> Añadir Pregunta Manualmente
            </h3>
            <div className="grid grid-cols-1 gap-3">
                <input 
                    className="w-full p-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                    placeholder="Escribe la pregunta..."
                    value={newQ.question}
                    onChange={e => setNewQ({...newQ, question: e.target.value})}
                />
                <textarea 
                    className="w-full p-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none"
                    rows={2}
                    placeholder="Escribe la respuesta correcta (para comparar después)..."
                    value={newQ.answer}
                    onChange={e => setNewQ({...newQ, answer: e.target.value})}
                />
                <button 
                    onClick={handleAddQuestion}
                    disabled={!newQ.question || !newQ.answer}
                    className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                >
                    Añadir Pregunta
                </button>
            </div>
        </div>

        <div className="space-y-6">
            {quiz.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </span>
                                <h3 className="text-lg font-medium text-gray-800 pt-1">{item.question}</h3>
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                        
                        <div className="ml-11">
                            <textarea 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm bg-white"
                                rows={3}
                                placeholder="Escribe tu respuesta aquí..."
                                value={item.userAnswer || ''}
                                onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                            />
                            
                            <div className="flex justify-end items-center mt-3">
                                <button 
                                    onClick={() => toggleExpand(item.id)}
                                    className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs uppercase font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {expandedId === item.id ? 'Ocultar Solución' : 'Comparar Respuesta'}
                                    {expandedId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Correct Answer Section */}
                    {expandedId === item.id && (
                        <div className="border-t border-gray-200 p-5 bg-white block animate-in slide-in-from-top-2">
                           <div className="ml-11">
                                <div>
                                    <span className="text-xs uppercase font-bold text-green-600 block mb-1 flex items-center gap-1">
                                        <CheckCircle size={12}/> Respuesta Correcta
                                    </span>
                                    <p className="text-gray-800 text-sm bg-green-50 p-3 rounded-lg border border-green-100">{item.answer}</p>
                                </div>
                           </div>
                        </div>
                    )}
                </div>
            ))}
            
            {quiz.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-400 mb-2">No hay preguntas creadas.</p>
                    <p className="text-sm text-gray-500">Usa el formulario de arriba para añadir preguntas a tu examen.</p>
                </div>
            )}
        </div>
    </div>
  );
};