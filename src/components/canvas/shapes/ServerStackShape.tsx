import { Group, Rect, Text, Circle } from 'react-konva';
import type { DesignElement } from '@/types';

interface ServerStackShapeProps {
  element: DesignElement;
  isSelected: boolean;
  isEditing: boolean;
}

export const ServerStackShape = ({ element, isSelected, isEditing }: ServerStackShapeProps) => {
  const width = element.width || 120;
  const height = element.height || 90;
  const layerHeight = height / 3;

  return (
    <>
      {/* Invisible hit area for edge detection */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="rgba(0,0,0,0.01)"
        listening={true}
      />

      {/* Three server layers */}
      {[0, 1, 2].map((layer) => (
        <Group key={layer}>
          <Rect
            y={layer * layerHeight}
            width={width}
            height={layerHeight - 4}
            fill={element.fill}
            stroke={isSelected ? '#0284c7' : element.stroke}
            strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
            cornerRadius={3}
            listening={false} // Hit area handles all interaction now
          />
          {/* LED indicators */}
          <Circle
            x={width - 15}
            y={layer * layerHeight + layerHeight / 2 - 2}
            radius={3}
            fill="#22c55e"
            listening={false}
          />
          <Circle
            x={width - 25}
            y={layer * layerHeight + layerHeight / 2 - 2}
            radius={3}
            fill="#22c55e"
            listening={false}
          />
        </Group>
      ))}

      {/* Text label */}
      {element.text && !isEditing && (
        <Text
          id={`text-${element.id}`}
          x={0}
          y={height / 2 - (element.fontSize || 14) / 2}
          width={width - 35}
          text={element.text}
          fontSize={element.fontSize || 14}
          fill="#000000"
          align="center"
          listening={false}
        />
      )}
    </>
  );
};
