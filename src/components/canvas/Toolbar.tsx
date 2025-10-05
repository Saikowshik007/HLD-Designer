import { useCanvasStore } from '@/store/canvasStore';
import { MousePointer, Trash2, ZoomIn, ZoomOut, Undo, Redo, StickyNote as StickyNoteIcon, Tag } from 'lucide-react';
import clsx from 'clsx';

interface ToolbarProps {
  onCategoryClick?: () => void;
}

export const Toolbar = ({ onCategoryClick }: ToolbarProps) => {
  const { tool, selectedId, elements, zoom, setTool, deleteElement, setZoom, undo, redo, canUndo, canRedo } = useCanvasStore();

  const selectedElement = elements.find(el => el.id === selectedId);
  const isStickyNoteSelected = selectedElement?.type === 'sticky-note';

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
          {isStickyNoteSelected && onCategoryClick && (
            <button
              onClick={onCategoryClick}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-2"
              title="Change Category (C)"
            >
              <Tag className="w-4 h-4" />
              <span className="text-sm font-medium">
                {(selectedElement.category || 'general').replace('-', ' ').toUpperCase()}
              </span>
            </button>
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
