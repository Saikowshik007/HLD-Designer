import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { MousePointer, Trash2, ZoomIn, ZoomOut, Undo, Redo, StickyNote as StickyNoteIcon, Tag, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const CATEGORIES = [
  { id: 'functional' as const, label: 'Functional Requirements', color: '#fef3c7', stroke: '#fbbf24' },
  { id: 'non-functional' as const, label: 'Non-Functional Requirements', color: '#fecaca', stroke: '#f87171' },
  { id: 'notes' as const, label: 'Notes', color: '#d1fae5', stroke: '#34d399' },
  { id: 'general' as const, label: 'General', color: '#e0e7ff', stroke: '#818cf8' },
];

export const Toolbar = () => {
  const { tool, selectedId, elements, zoom, setTool, deleteElement, setZoom, undo, redo, canUndo, canRedo, updateElement } = useCanvasStore();
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedElement = elements.find(el => el.id === selectedId);
  const isStickyNoteSelected = selectedElement?.type === 'sticky-note';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select & Move' },
    { id: 'sticky-note' as const, icon: StickyNoteIcon, label: 'Sticky Note' },
  ];

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={clsx(
                'p-2 rounded-lg transition-colors relative',
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
              title={t.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {tool === 'select' && (
        <div className="text-sm text-gray-500">
          Drag to move • Double-click to edit text
        </div>
      )}

      {tool === 'sticky-note' && (
        <div className="text-sm text-gray-500">
          Click anywhere to add a sticky note
        </div>
      )}

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            canUndo()
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            canRedo()
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
          )}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-600 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {selectedId && (
        <div className="flex items-center gap-1">
          {isStickyNoteSelected && selectedElement && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-2 border border-gray-300"
                title="Change Category (C)"
              >
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {(selectedElement.category || 'general').replace('-', ' ').toUpperCase()}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] min-w-[280px]">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">SELECT CATEGORY</div>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          updateElement(selectedElement.id, { category: cat.id });
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2 transition-colors ${
                          (selectedElement.category || 'general') === cat.id ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm text-gray-700 flex-1">{cat.label}</span>
                        {(selectedElement.category || 'general') === cat.id && (
                          <span className="text-primary-600 text-sm font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => deleteElement(selectedId)}
            className="p-2 rounded-lg hover:bg-red-100 text-red-600"
            title="Delete Selected (Del)"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
