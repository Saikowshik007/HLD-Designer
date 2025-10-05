import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LogOut, Save, FileText, FilePlus, Edit2, Settings } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { SettingsModal } from '@/components/settings/SettingsModal';

interface HeaderProps {
  onSave?: () => void;
  onShowDesigns?: () => void;
  onNewDesign?: () => void;
  designTitle: string;
  onTitleChange: (title: string) => void;
}

export const Header = ({ onSave, onShowDesigns, onNewDesign, designTitle, onTitleChange }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const { elements } = useCanvasStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(designTitle);
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  const handleTitleEdit = () => {
    setTempTitle(designTitle);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTempTitle(designTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary-600">HLD Designer</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              {isEditingTitle ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="font-medium px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              ) : (
                <button
                  onClick={handleTitleEdit}
                  className="font-medium px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 group"
                >
                  {designTitle}
                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              <span className="text-gray-400">•</span>
              <span>{elements.length} elements</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNewDesign && (
              <button
                onClick={onNewDesign}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <FilePlus className="w-4 h-4" />
                New Design
              </button>
            )}

            {onShowDesigns && (
              <button
                onClick={onShowDesigns}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                My Designs
              </button>
            )}

            {onSave && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}

            <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
              <span className="text-sm text-gray-700">
                {user?.displayName || user?.email}
              </span>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => logout()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  );
};
