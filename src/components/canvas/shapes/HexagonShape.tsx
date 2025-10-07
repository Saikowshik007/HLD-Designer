import { Path, Text, Rect } from 'react-konva';
import type { DesignElement } from '@/types';

interface HexagonShapeProps {
  element: DesignElement;
  isSelected: boolean;
  isEditing: boolean;
}

export const HexagonShape = ({ element, isSelected, isEditing }: HexagonShapeProps) => {
  const width = element.width || 120;
  const height = element.height || 100;

  // Calculate hexagon points
  const hexPath = `
    M ${width * 0.25} ${0}
    L ${width * 0.75} ${0}
    L ${width} ${height * 0.5}
    L ${width * 0.75} ${height}
    L ${width * 0.25} ${height}
    L ${0} ${height * 0.5}
    Z
  `;

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

      <Path
        data={hexPath}
        fill={element.fill}
        stroke={isSelected ? '#0284c7' : element.stroke}
        strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
        listening={false}
      />

      {/* Text label */}
      {element.text && !isEditing && (
        <Text
          id={`text-${element.id}`}
          x={0}
          y={height / 2 - (element.fontSize || 14) / 2}
          width={width}
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
