import { Path, Text, Rect } from 'react-konva';
import type { DesignElement } from '@/types';

interface CloudShapeProps {
  element: DesignElement;
  isSelected: boolean;
  isEditing: boolean;
}

export const CloudShape = ({ element, isSelected, isEditing }: CloudShapeProps) => {
  const width = element.width || 140;
  const height = element.height || 80;

  // Cloud SVG path scaled to fit dimensions
  const cloudPath = `
    M ${width * 0.25} ${height * 0.6}
    Q ${width * 0.15} ${height * 0.6} ${width * 0.15} ${height * 0.45}
    Q ${width * 0.15} ${height * 0.25} ${width * 0.35} ${height * 0.2}
    Q ${width * 0.40} ${height * 0.05} ${width * 0.55} ${height * 0.15}
    Q ${width * 0.75} ${height * 0.05} ${width * 0.85} ${height * 0.3}
    Q ${width * 0.95} ${height * 0.35} ${width * 0.90} ${height * 0.55}
    Q ${width * 0.90} ${height * 0.75} ${width * 0.70} ${height * 0.75}
    L ${width * 0.30} ${height * 0.75}
    Q ${width * 0.18} ${height * 0.75} ${width * 0.25} ${height * 0.6}
    Z
  `;

  return (
    <>
      {/* Invisible hit area for edge detection - uses very low opacity instead of transparent */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="rgba(0,0,0,0.01)"
        listening={true}
      />

      <Path
        data={cloudPath}
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
          y={height * 0.4}
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
