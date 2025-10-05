import { Group, Rect, Text } from 'react-konva';
import type { DesignElement } from '@/types';

interface StickyNoteProps {
  element: DesignElement;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: any) => void;
  onDblClick: () => void;
}

const CATEGORY_COLORS = {
  'functional': '#fef3c7', // yellow
  'non-functional': '#fecaca', // red
  'notes': '#d1fae5', // green
  'general': '#e0e7ff', // indigo
};

const CATEGORY_STROKE = {
  'functional': '#fbbf24',
  'non-functional': '#f87171',
  'notes': '#34d399',
  'general': '#818cf8',
};

export const StickyNote = ({ element, isSelected, onSelect, onDragEnd, onDblClick }: StickyNoteProps) => {
  const width = element.width || 200;
  const height = element.height || 150;
  const category = element.category || 'general';
  const fill = CATEGORY_COLORS[category];
  const stroke = CATEGORY_STROKE[category];

  return (
    <Group
      x={element.x}
      y={element.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
    >
      {/* Shadow effect */}
      <Rect
        x={3}
        y={3}
        width={width}
        height={height}
        fill="rgba(0,0,0,0.1)"
        cornerRadius={2}
        listening={false}
      />

      {/* Main sticky note */}
      <Rect
        width={width}
        height={height}
        fill={fill}
        stroke={isSelected ? '#2563eb' : stroke}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={2}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
      />

      {/* Top fold effect */}
      <Rect
        x={width - 25}
        y={0}
        width={25}
        height={25}
        fill={stroke}
        opacity={0.3}
        cornerRadius={[0, 2, 0, 0]}
        listening={false}
      />

      {/* Category label */}
      <Text
        x={8}
        y={8}
        text={category.toUpperCase()}
        fontSize={10}
        fontStyle="bold"
        fill={stroke}
        opacity={0.7}
        listening={false}
      />

      {/* Content text */}
      <Text
        x={8}
        y={30}
        width={width - 16}
        height={height - 40}
        text={element.text || 'Double-click to edit'}
        fontSize={element.fontSize || 14}
        fill="#374151"
        wrap="word"
        align="left"
        verticalAlign="top"
        listening={false}
      />
    </Group>
  );
};
