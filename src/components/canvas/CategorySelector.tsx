import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';

interface CategorySelectorProps {
  elementId: string;
  currentCategory: 'functional' | 'non-functional' | 'notes' | 'general';
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'functional' as const, label: 'Functional Requirements', color: '#fef3c7' },
  { id: 'non-functional' as const, label: 'Non-Functional Requirements', color: '#fecaca' },
  { id: 'notes' as const, label: 'Notes', color: '#d1fae5' },
  { id: 'general' as const, label: 'General', color: '#e0e7ff' },
];

export const CategorySelector = ({ elementId, currentCategory, onClose }: CategorySelectorProps) => {
  const { updateElement } = useCanvasStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = (category: 'functional' | 'non-functional' | 'notes' | 'general') => {
    updateElement(elementId, { category });
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[250px]"
    >
      <div className="p-2">
        <div className="text-xs font-semibold text-gray-500 px-2 py-1">SELECT CATEGORY</div>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2 ${
              currentCategory === cat.id ? 'bg-gray-50' : ''
            }`}
          >
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-sm text-gray-700">{cat.label}</span>
            {currentCategory === cat.id && (
              <span className="ml-auto text-primary-600 text-xs">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
