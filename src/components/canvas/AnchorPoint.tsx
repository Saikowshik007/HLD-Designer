import { Circle } from 'react-konva';
import type { DesignElement } from '@/types';

interface AnchorPointProps {
  element: DesignElement;
  anchor: 'top' | 'right' | 'bottom' | 'left';
  visible: boolean;
  onClick: () => void;
}

export const AnchorPoint = ({ element, anchor, visible, onClick }: AnchorPointProps) => {
  if (!visible) return null;

  const getPosition = () => {
    if (element.type === 'rectangle') {
      const w = element.width || 100;
      const h = element.height || 100;
      switch (anchor) {
        case 'top':
          return { x: element.x + w / 2, y: element.y };
        case 'right':
          return { x: element.x + w, y: element.y + h / 2 };
        case 'bottom':
          return { x: element.x + w / 2, y: element.y + h };
        case 'left':
          return { x: element.x, y: element.y + h / 2 };
      }
    } else if (element.type === 'circle') {
      const r = element.radius || 50;
      switch (anchor) {
        case 'top':
          return { x: element.x, y: element.y - r };
        case 'right':
          return { x: element.x + r, y: element.y };
        case 'bottom':
          return { x: element.x, y: element.y + r };
        case 'left':
          return { x: element.x - r, y: element.y };
      }
    }
    return { x: element.x, y: element.y };
  };

  const pos = getPosition();

  return (
    <Circle
      x={pos.x}
      y={pos.y}
      radius={6}
      fill="#0284c7"
      stroke="#ffffff"
      strokeWidth={2}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'crosshair';
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'default';
        }
      }}
    />
  );
};
