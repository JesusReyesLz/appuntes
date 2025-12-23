import React, { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { Reference } from '../types';

interface BibliographySectionProps {
  references: Reference[];
  onChange: (refs: Reference[]) => void;
  topicContext: string;
  notesContext: string;
}

export const BibliographySection: React.FC<BibliographySectionProps> = ({ references, onChange }) => {
  const [newRef, setNewRef] = useState<Partial<Reference>>({});

  const handleAdd = () => {
    if (!newRef.title) return;
    const ref: Reference = {
      id: Date.now().toString(),
      title: newRef.title,
      author: newRef.author || 'Desconocido',
      url: newRef.url || '',
      year: newRef.year || '',
    };
    onChange([...references, ref]);
    setNewRef({});
  };

  const handleDelete = (id: string) => {
    onChange(references.filter(r => r.id !== id));
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <BookOpen size={20} /> Bibliografía y Referencias
        </h3>
      </div>

      <div className="space-y-3 mb-4">
        {references.map((ref) => (
          <div key={ref.id} className="flex items-start justify-between bg-white p-3 rounded border border-gray-100 shadow-sm">
            <div className="text-sm">
              <span className="font-bold text-gray-800">{ref.author}</span>
              {ref.year && <span className="text-gray-500"> ({ref.year}). </span>}
              <span className="italic text-gray-700"> {ref.title}.</span>
              {ref.url && <a href={ref.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline ml-2 text-xs block truncate max-w-md">{ref.url}</a>}
            </div>
            <button 
              onClick={() => handleDelete(ref.id)} 
              className="text-gray-400 hover:text-red-500 no-print"
              title="Eliminar referencia"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {references.length === 0 && (
          <p className="text-sm text-gray-400 italic">No hay referencias añadidas.</p>
        )}
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 no-print">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2">
            <div className="md:col-span-5">
                <input
                    type="text"
                    placeholder="Título *"
                    className="w-full text-sm p-2 border rounded"
                    value={newRef.title || ''}
                    onChange={e => setNewRef({...newRef, title: e.target.value})}
                />
            </div>
            <div className="md:col-span-4">
                <input
                    type="text"
                    placeholder="Autor"
                    className="w-full text-sm p-2 border rounded"
                    value={newRef.author || ''}
                    onChange={e => setNewRef({...newRef, author: e.target.value})}
                />
            </div>
             <div className="md:col-span-3">
                <input
                    type="text"
                    placeholder="Año"
                    className="w-full text-sm p-2 border rounded"
                    value={newRef.year || ''}
                    onChange={e => setNewRef({...newRef, year: e.target.value})}
                />
            </div>
        </div>
        <div className="flex gap-2">
             <input
                type="text"
                placeholder="URL (opcional)"
                className="w-full text-sm p-2 border rounded"
                value={newRef.url || ''}
                onChange={e => setNewRef({...newRef, url: e.target.value})}
            />
            <button 
                onClick={handleAdd}
                disabled={!newRef.title}
                className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
            >
                <Plus size={16} /> Añadir
            </button>
        </div>
      </div>
    </div>
  );
};