import { useState } from 'react';
import { componentTemplates, type ComponentTemplate } from '@/data/componentTemplates';
import { useCanvasStore } from '@/store/canvasStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export const ComponentPalette = () => {
  const { addElement } = useCanvasStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['storage', 'compute', 'network'])
  );

  const categories = [
    { id: 'client', label: 'Client & UI', icon: '👤' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'compute', label: 'Compute', icon: '⚙️' },
    { id: 'storage', label: 'Storage & Data', icon: '💾' },
    { id: 'other', label: 'Other', icon: '📋' },
  ];

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleComponentClick = (template: ComponentTemplate) => {
    const centerX = 400;
    const centerY = 300;
    const component = template.createComponent(centerX, centerY);
    addElement({
      ...component,
      id: `${template.id}-${Date.now()}`,
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        Components
      </h3>

      {categories.map((category) => {
        const templates = componentTemplates.filter(t => t.category === category.id);
        if (templates.length === 0) return null;

        const isExpanded = expandedCategories.has(category.id);

        return (
          <div key={category.id} className="mb-3">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-lg">{category.icon}</span>
              <span>{category.label}</span>
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-1 pl-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleComponentClick(template)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm',
                      'bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-300',
                      'rounded-lg transition-colors group'
                    )}
                    title={`Click to add ${template.name}`}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {template.icon}
                    </span>
                    <span className="text-gray-700 group-hover:text-primary-700 font-medium">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Click any component to add it to the canvas. Double-click shapes to edit labels.
        </p>
      </div>
    </div>
  );
};
