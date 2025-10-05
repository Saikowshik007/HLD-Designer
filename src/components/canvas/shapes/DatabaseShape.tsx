import { Rect, Ellipse, Path, Text, Line } from 'react-konva';
import type { DesignElement } from '@/types';

interface DatabaseShapeProps {
  element: DesignElement;
  isSelected: boolean;
  isEditing: boolean;
}

export const DatabaseShape = ({ element, isSelected, isEditing }: DatabaseShapeProps) => {
  const width = element.width || 120;
  const height = element.height || 100;
  const ellipseHeight = height * 0.15; // Top ellipse height

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

      {/* Cylinder body - fill */}
      <Path
        data={`M 0 ${ellipseHeight} L 0 ${height - ellipseHeight} Q ${width / 2} ${height} ${width} ${height - ellipseHeight} L ${width} ${ellipseHeight} Q ${width / 2} ${ellipseHeight * 2} 0 ${ellipseHeight} Z`}
        fill={element.fill}
        listening={false}
      />

      {/* Bottom ellipse */}
      <Ellipse
        x={width / 2}
        y={height - ellipseHeight}
        radiusX={width / 2}
        radiusY={ellipseHeight}
        fill={element.fill}
        stroke={isSelected ? '#0284c7' : element.stroke}
        strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
        listening={false}
      />

      {/* Cylinder body - left line */}
      <Line
        points={[0, ellipseHeight, 0, height - ellipseHeight]}
        stroke={isSelected ? '#0284c7' : element.stroke}
        strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
        listening={false}
      />

      {/* Cylinder body - right line */}
      <Line
        points={[width, ellipseHeight, width, height - ellipseHeight]}
        stroke={isSelected ? '#0284c7' : element.stroke}
        strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
        listening={false}
      />

      {/* Top ellipse */}
      <Ellipse
        x={width / 2}
        y={ellipseHeight}
        radiusX={width / 2}
        radiusY={ellipseHeight}
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
