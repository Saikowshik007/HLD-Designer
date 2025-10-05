import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LogOut, Save, FileText, FilePlus, Edit2, Settings, Menu, X } from 'lucide-react';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-primary-600 whitespace-nowrap">HLD Designer</h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 min-w-0">
              <FileText className="w-4 h-4 flex-shrink-0" />
              {isEditingTitle ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="font-medium px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 w-full max-w-xs"
                  autoFocus
                />
              ) : (
                <button
                  onClick={handleTitleEdit}
                  className="font-medium px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 group truncate"
                >
                  <span className="truncate">{designTitle}</span>
                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              )}
              <span className="text-gray-400">•</span>
              <span className="whitespace-nowrap">{elements.length} elements</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3">
            {onNewDesign && (
              <button
                onClick={onNewDesign}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <FilePlus className="w-4 h-4" />
                <span className="hidden xl:inline">New Design</span>
              </button>
            )}

            {onShowDesigns && (
              <button
                onClick={onShowDesigns}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="hidden xl:inline">My Designs</span>
                <span className="xl:hidden">Designs</span>
              </button>
            )}

            {onSave && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden xl:inline">Save</span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
              <span className="text-sm text-gray-700 hidden xl:inline truncate max-w-[150px]">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 space-y-2">
            {/* Title Edit on Mobile */}
            <div className="md:hidden flex items-center gap-2 text-sm text-gray-600 mb-3">
              <FileText className="w-4 h-4 flex-shrink-0" />
              {isEditingTitle ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="font-medium px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1"
                  autoFocus
                />
              ) : (
                <button
                  onClick={handleTitleEdit}
                  className="font-medium px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1 group flex-1"
                >
                  <span className="truncate">{designTitle}</span>
                  <Edit2 className="w-3 h-3 flex-shrink-0" />
                </button>
              )}
            </div>

            {onNewDesign && (
              <button
                onClick={() => {
                  onNewDesign();
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <FilePlus className="w-4 h-4" />
                New Design
              </button>
            )}

            {onShowDesigns && (
              <button
                onClick={() => {
                  onShowDesigns();
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                My Designs
              </button>
            )}

            {onSave && (
              <button
                onClick={() => {
                  handleSave();
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}

            <button
              onClick={() => {
                setShowSettings(true);
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            <div className="pt-2 border-t border-gray-200">
              <div className="px-4 py-2 text-sm text-gray-700 truncate">
                {user?.displayName || user?.email}
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  );
};
