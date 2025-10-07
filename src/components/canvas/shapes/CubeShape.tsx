import { Path, Text, Rect } from 'react-konva';
import type { DesignElement } from '@/types';

interface CubeShapeProps {
  element: DesignElement;
  isSelected: boolean;
  isEditing: boolean;
}

export const CubeShape = ({ element, isSelected, isEditing }: CubeShapeProps) => {
  const width = element.width || 120;
  const height = element.height || 100;
  const depth = width * 0.3;

  // 3D cube isometric view
  const frontFace = `
    M ${depth} ${depth * 0.5}
    L ${depth + width} ${depth * 0.5}
    L ${depth + width} ${depth * 0.5 + height}
    L ${depth} ${depth * 0.5 + height}
    Z
  `;

  const topFace = `
    M ${depth} ${depth * 0.5}
    L ${depth + width} ${depth * 0.5}
    L ${width + depth * 2} ${0}
    L ${depth * 2} ${0}
    Z
  `;

  const rightFace = `
    M ${depth + width} ${depth * 0.5}
    L ${width + depth * 2} ${0}
    L ${width + depth * 2} ${height}
    L ${depth + width} ${depth * 0.5 + height}
    Z
  `;

  const totalWidth = width + depth * 2;
  const totalHeight = height + depth * 0.5;

  return (
    <>
      {/* Invisible hit area for edge detection */}
      <Rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        fill="rgba(0,0,0,0.01)"
        listening={true}
      />

      {/* Right face (darker) */}
      <Path
        data={rightFace}
        fill={element.fill ? `${element.fill}cc` : '#cccccccc'}
        stroke={isSelected ? '#0284c7' : element.stroke}
        strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
        listening={false}
      />

      {/* Top face (lighter) */}
      <Path
        data={topFace}
        fill={element.fill ? `${element.fill}ee` : '#eeeeeee'}
        stroke={isSelected ? '#0284c7' : element.stroke}
        strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
        listening={false}
      />

      {/* Front face (main color) */}
      <Path
        data={frontFace}
        fill={element.fill}
        stroke={isSelected ? '#0284c7' : element.stroke}
        strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
        listening={false}
      />

      {/* Text label */}
      {element.text && !isEditing && (
        <Text
          id={`text-${element.id}`}
          x={depth}
          y={depth * 0.5 + height / 2 - (element.fontSize || 14) / 2}
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
