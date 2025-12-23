import React from 'react';
import { KWLData } from '../types';
import { BookOpen } from 'lucide-react';

interface KWLBoardProps {
  data: KWLData;
  topic: string;
  onUpdate: (data: KWLData) => void;
}

export const KWLBoard: React.FC<KWLBoardProps> = ({ data, onUpdate }) => {
  const handleChange = (field: keyof KWLData, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-[600px] rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="text-blue-600" />
                    Ciclo KWL (Know - Want - Learned)
                </h2>
                <p className="text-gray-500 text-sm">Fase 1 (Prelectura) y Fase 4 (Postlectura).</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            {/* KNOW */}
            <div className="flex flex-col h-full bg-red-50/50 rounded-xl border border-red-100 overflow-hidden">
                <div className="bg-red-100 p-3 border-b border-red-200">
                    <h3 className="font-bold text-red-800 text-center">K - What I KNOW</h3>
                    <p className="text-xs text-red-600 text-center">Lo que sé (o creo saber)</p>
                </div>
                <textarea 
                    className="flex-1 w-full p-4 bg-transparent outline-none resize-none text-gray-700 text-sm leading-relaxed"
                    placeholder="Escribe aquí tus conocimientos previos..."
                    value={data.know}
                    onChange={(e) => handleChange('know', e.target.value)}
                />
            </div>

            {/* WANT */}
            <div className="flex flex-col h-full bg-yellow-50/50 rounded-xl border border-yellow-100 overflow-hidden">
                <div className="bg-yellow-100 p-3 border-b border-yellow-200">
                    <h3 className="font-bold text-yellow-800 text-center">W - What I WANT to know</h3>
                    <p className="text-xs text-yellow-700 text-center">Objetivos y Preguntas</p>
                </div>
                <textarea 
                    className="flex-1 w-full p-4 bg-transparent outline-none resize-none text-gray-700 text-sm leading-relaxed"
                    placeholder="¿Qué quieres aprender? Formula preguntas..."
                    value={data.want}
                    onChange={(e) => handleChange('want', e.target.value)}
                />
            </div>

            {/* LEARNED */}
            <div className="flex flex-col h-full bg-green-50/50 rounded-xl border border-green-100 overflow-hidden">
                <div className="bg-green-100 p-3 border-b border-green-200">
                    <h3 className="font-bold text-green-800 text-center">L - What I LEARNED</h3>
                    <p className="text-xs text-green-700 text-center">Conocimiento Adquirido (Fase 4)</p>
                </div>
                <textarea 
                    className="flex-1 w-full p-4 bg-transparent outline-none resize-none text-gray-700 text-sm leading-relaxed"
                    placeholder="Llena esto al finalizar el estudio..."
                    value={data.learned}
                    onChange={(e) => handleChange('learned', e.target.value)}
                />
            </div>
        </div>
    </div>
  );
};