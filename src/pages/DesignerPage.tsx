import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDesignStore } from '@/store/designStore';
import { useCanvasStore } from '@/store/canvasStore';
import { Header } from '@/components/layout/Header';
import { Toolbar } from '@/components/canvas/Toolbar';
import { Canvas } from '@/components/canvas/Canvas';
import { ComponentPalette } from '@/components/canvas/ComponentPalette';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { DesignsList } from '@/components/design/DesignsList';
import { InterviewTopics } from '@/components/interview/InterviewTopics';
import type { InterviewTopic } from '@/data/interviewTopics';
import { Shapes, MessageSquare } from 'lucide-react';
export const DesignerPage = () => {
  const { user } = useAuthStore();
  const { currentDesign, saveDesign, loadDesign, loadLastDesign, createNewDesign } = useDesignStore();
  const { elements, loadElements, undo, redo, canUndo, canRedo, selectedId, deleteElement } = useCanvasStore();
  const [showDesignsList, setShowDesignsList] = useState(false);
  const [designTitle, setDesignTitle] = useState('Untitled Design');
  const [canvasSize, setCanvasSize] = useState({ width: 1400, height: 900 });
  const [leftPanelTab, setLeftPanelTab] = useState<'components' | 'interview'>('components');
  const [selectedTopic, setSelectedTopic] = useState<InterviewTopic | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const hasUnsavedChanges = useRef(false);
  const isInitialLoad = useRef(true);
  const lastLoadedDesignId = useRef<string | null>(null);

  // Load last design on initial mount
  useEffect(() => {
    if (user) {
      loadLastDesign(user.uid);
    }
  }, [user, loadLastDesign]);

  // Update canvas elements when design changes (but not on save updates)
  useEffect(() => {
    if (currentDesign) {
      // Only reload if it's a different design
      if (currentDesign.id !== lastLoadedDesignId.current) {
        loadElements(currentDesign.elements);
        setDesignTitle(currentDesign.title);
        isInitialLoad.current = true;
        lastLoadedDesignId.current = currentDesign.id;
      }
    } else {
      loadElements([]);
      setDesignTitle('Untitled Design');
      isInitialLoad.current = true;
      lastLoadedDesignId.current = null;
    }
  }, [currentDesign, loadElements]);

  // Track changes (mark as unsaved when elements or title change)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    hasUnsavedChanges.current = true;
  }, [elements, designTitle]); // Track both elements and title

  // Save only when there are unsaved changes to canvas
  useEffect(() => {
    if (!hasUnsavedChanges.current || !user || elements.length === 0) {
      return;
    }

    const saveTimeout = setTimeout(async () => {
      if (hasUnsavedChanges.current) {
        await saveDesign(user.uid, elements, designTitle);
        hasUnsavedChanges.current = false;
      }
    }, 1000); // Wait 1 second after last canvas change

    return () => clearTimeout(saveTimeout);
  }, [elements, user, saveDesign, designTitle]); // designTitle in deps but doesn't trigger hasUnsavedChanges

  const updateCanvasSize = useCallback(() => {
    if (canvasContainerRef.current) {
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Keyboard shortcuts for undo/redo, delete, and category selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
      // Delete: Delete or Backspace key
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Don't delete if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteElement(selectedId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, selectedId, deleteElement, elements]);

  const handleSave = useCallback(async () => {
    if (user) {
      await saveDesign(user.uid, elements, designTitle);
    }
  }, [user, elements, designTitle, saveDesign]);

  const handleDesignSelect = async (designId: string) => {
    await loadDesign(designId);
  };

  const handleNewDesign = () => {
    createNewDesign();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        onSave={handleSave}
        onShowDesigns={() => setShowDesignsList(true)}
        onNewDesign={handleNewDesign}
        designTitle={designTitle}
        onTitleChange={setDesignTitle}
      />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setLeftPanelTab('components')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                leftPanelTab === 'components'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shapes className="w-4 h-4" />
              Components
            </button>
            <button
              onClick={() => setLeftPanelTab('interview')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                leftPanelTab === 'interview'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Interview
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {leftPanelTab === 'components' ? (
              <ComponentPalette />
            ) : (
              <InterviewTopics
                onSelectTopic={setSelectedTopic}
                selectedTopic={selectedTopic}
              />
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <Toolbar />
          <div ref={canvasContainerRef} className="flex-1 bg-gray-50 flex items-center justify-center overflow-hidden">
            <Canvas width={canvasSize.width} height={canvasSize.height} />
          </div>
          <div className="flex-shrink-0">
            <ChatPanel onResize={updateCanvasSize} selectedTopic={selectedTopic} />
          </div>
        </main>
      </div>

      {showDesignsList && (
        <DesignsList
          onDesignSelect={handleDesignSelect}
          onNewDesign={handleNewDesign}
          onClose={() => setShowDesignsList(false)}
        />
      )}
    </div>
  );
};
