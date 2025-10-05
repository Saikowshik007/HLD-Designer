import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDesignStore } from '@/store/designStore';
import { useCanvasStore } from '@/store/canvasStore';
import { FileText, Trash2, Clock, Plus } from 'lucide-react';
import clsx from 'clsx';

interface DesignsListProps {
  onDesignSelect: (designId: string) => void;
  onNewDesign: () => void;
  onClose: () => void;
}

export const DesignsList = ({ onDesignSelect, onNewDesign, onClose }: DesignsListProps) => {
  const { user } = useAuthStore();
  const { designs, loading, loadUserDesigns, deleteDesign } = useDesignStore();
  const { clearCanvas } = useCanvasStore();

  useEffect(() => {
    if (user) {
      loadUserDesigns(user.uid);
    }
  }, [user, loadUserDesigns]);

  const handleDesignClick = (designId: string) => {
    onDesignSelect(designId);
    onClose();
  };

  const handleNewDesign = () => {
    clearCanvas();
    onNewDesign();
    onClose();
  };

  const handleDeleteDesign = async (designId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this design?')) {
      await deleteDesign(designId);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">My Designs</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <button
            onClick={handleNewDesign}
            className="w-full p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 text-primary-600 font-medium mb-4"
          >
            <Plus className="w-5 h-5" />
            Create New Design
          </button>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading designs...</div>
          ) : designs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No designs yet. Create your first design!
            </div>
          ) : (
            <div className="space-y-3">
              {designs.map((design) => (
                <div
                  key={design.id}
                  onClick={() => handleDesignClick(design.id)}
                  className={clsx(
                    'p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer',
                    'flex items-center justify-between'
                  )}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-primary-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {design.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(design.updatedAt)}
                        </span>
                        <span>•</span>
                        <span>{design.elements.length} elements</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteDesign(design.id, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete design"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
