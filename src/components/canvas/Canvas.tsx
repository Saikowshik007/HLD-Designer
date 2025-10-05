import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Arrow, Group, Line } from 'react-konva';
import { useCanvasStore } from '@/store/canvasStore';
import type { DesignElement } from '@/types';
import Konva from 'konva';
import { StickyNote } from './StickyNote';
import { DatabaseShape } from './shapes/DatabaseShape';
import { ServerStackShape } from './shapes/ServerStackShape';
import { CloudShape } from './shapes/CloudShape';

interface CanvasProps {
  width: number;
  height: number;
}

const EDGE_THRESHOLD = 15; // pixels from edge to trigger connector mode

export const Canvas = ({ width, height }: CanvasProps) => {
  const {
    elements,
    selectedId,
    tool,
    zoom,
    addElement,
    updateElement,
    selectElement,
    setTool,
    setZoom,
  } = useCanvasStore();

  const stageRef = useRef<Konva.Stage>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [draggingConnector, setDraggingConnector] = useState<{
    startElementId: string;
    startAnchor: 'left' | 'right' | 'top' | 'bottom';
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Handle Ctrl+Scroll for zoom
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const scaleBy = 1.1;
        const oldZoom = zoom;
        const newZoom = e.deltaY < 0
          ? Math.min(2, oldZoom * scaleBy)
          : Math.max(0.5, oldZoom / scaleBy);

        setZoom(newZoom);
      }
    };

    const container = stage.container();
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, setZoom]);

  const isNearEdge = (element: DesignElement, localX: number, localY: number): 'left' | 'right' | 'top' | 'bottom' | null => {
    // Sticky notes don't support connectors
    if (element.type === 'sticky-note') return null;

    // Database, server-stack, and cloud shapes use rectangular edge detection
    if (element.type === 'rectangle' || element.type === 'database' || element.type === 'server-stack' || element.type === 'cloud') {
      const w = element.width || 120;
      const h = element.height || 80;

      // Calculate distance to each edge
      const distLeft = localX;
      const distRight = w - localX;
      const distTop = localY;
      const distBottom = h - localY;

      // Find the minimum distance
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      // Only return an edge if we're within EDGE_THRESHOLD of it
      if (minDist > EDGE_THRESHOLD) return null;

      // Return the closest edge
      if (minDist === distLeft) return 'left';
      if (minDist === distRight) return 'right';
      if (minDist === distTop) return 'top';
      if (minDist === distBottom) return 'bottom';
    } else if (element.type === 'circle') {
      const r = element.radius || 50;
      const dx = localX - r;
      const dy = localY - r;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (Math.abs(dist - r) < EDGE_THRESHOLD) {
        // Near the edge of circle
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? 'right' : 'left';
        } else {
          return dy > 0 ? 'bottom' : 'top';
        }
      }
    }
    return null;
  };

  const getConnectionPoint = (element: DesignElement, side: 'left' | 'right' | 'top' | 'bottom') => {
    if (element.type === 'cloud') {
      // Cloud shape has organic edges, adjust connection points to cloud boundary
      const w = element.width || 140;
      const h = element.height || 80;
      switch (side) {
        case 'left': return { x: element.x + w * 0.15, y: element.y + h * 0.5 };
        case 'right': return { x: element.x + w * 0.85, y: element.y + h * 0.45 };
        case 'top': return { x: element.x + w * 0.5, y: element.y + h * 0.15 };
        case 'bottom': return { x: element.x + w * 0.5, y: element.y + h * 0.75 };
      }
    } else if (element.type === 'rectangle' || element.type === 'database' || element.type === 'server-stack') {
      const w = element.width || 120;
      const h = element.height || 80;
      switch (side) {
        case 'left': return { x: element.x, y: element.y + h / 2 };
        case 'right': return { x: element.x + w, y: element.y + h / 2 };
        case 'top': return { x: element.x + w / 2, y: element.y };
        case 'bottom': return { x: element.x + w / 2, y: element.y + h };
      }
    } else if (element.type === 'circle') {
      const r = element.radius || 50;
      const cx = element.x + r;
      const cy = element.y + r;
      switch (side) {
        case 'left': return { x: cx - r, y: cy };
        case 'right': return { x: cx + r, y: cy };
        case 'top': return { x: cx, y: cy - r };
        case 'bottom': return { x: cx, y: cy + r };
      }
    }
    return { x: element.x, y: element.y };
  };

  const findNearestSide = (element: DesignElement, targetX: number, targetY: number): 'left' | 'right' | 'top' | 'bottom' => {
    const isRectangular = element.type === 'rectangle' || element.type === 'database' || element.type === 'server-stack' || element.type === 'cloud';
    const centerX = isRectangular
      ? element.x + (element.width || 120) / 2
      : element.x + (element.radius || 50);
    const centerY = isRectangular
      ? element.y + (element.height || 80) / 2
      : element.y + (element.radius || 50);

    const dx = targetX - centerX;
    const dy = targetY - centerY;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'bottom' : 'top';
    }
  };

  const handleMouseDown = (element: DesignElement, e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Check for double-click
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      // Double-click detected - don't start drag or edge detection
      lastClickTimeRef.current = 0;
      setEditingTextId(element.id);
      selectElement(null);
      e.cancelBubble = true;
      return;
    }
    lastClickTimeRef.current = now;

    const group = e.target.findAncestor('Group') as Konva.Group;
    if (!group) return;

    const localPos = group.getRelativePointerPosition();
    if (!localPos) return;

    const edge = isNearEdge(element, localPos.x, localPos.y);

    if (edge) {
      // Start dragging connector from edge
      e.cancelBubble = true;
      const point = getConnectionPoint(element, edge);

      setDraggingConnector({
        startElementId: element.id,
        startAnchor: edge,
        startX: point.x,
        startY: point.y,
        currentX: point.x,
        currentY: point.y,
      });

      const container = stage.container();
      container.style.cursor = 'crosshair';
    } else {
      // Normal drag to move
      selectElement(element.id);
    }
  };

  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (draggingConnector) {
      setDraggingConnector({
        ...draggingConnector,
        currentX: pos.x,
        currentY: pos.y,
      });
    }
  };

  const handleMouseUp = (targetElement: DesignElement | null) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (draggingConnector) {
      const container = stage.container();
      container.style.cursor = 'default';

      // Only create connector if target is valid (not sticky-note, not same element)
      if (targetElement &&
          targetElement.id !== draggingConnector.startElementId &&
          targetElement.type !== 'sticky-note') {
        const endSide = findNearestSide(targetElement, draggingConnector.currentX, draggingConnector.currentY);
        const endPoint = getConnectionPoint(targetElement, endSide);

        const connector: DesignElement = {
          id: `connector-${Date.now()}`,
          type: 'connector',
          x: 0,
          y: 0,
          startElementId: draggingConnector.startElementId,
          endElementId: targetElement.id,
          startAnchor: draggingConnector.startAnchor,
          endAnchor: endSide,
          points: [draggingConnector.startX, draggingConnector.startY, endPoint.x, endPoint.y],
          stroke: '#1f2937',
          strokeWidth: 2,
        };

        addElement(connector);
      }

      setDraggingConnector(null);
    }
  };

  const handleTextEdit = (elementId: string, element: DesignElement) => {
    const stage = stageRef.current;
    if (!stage) {
      console.log('No stage found');
      return;
    }

    const textNode = stage.findOne(`#text-${elementId}`);
    if (!textNode) {
      console.log('No text node found for', elementId);
      // If no text node, calculate position from element directly
      const stageBox = stage.container().getBoundingClientRect();

      let textX = element.x;
      let textY = element.y;

      if (element.type === 'rectangle') {
        textX = (element.x + (element.width || 120) / 2) * zoom;
        textY = (element.y + (element.height || 80) / 2) * zoom;
      } else if (element.type === 'circle') {
        textX = (element.x + (element.radius || 50)) * zoom;
        textY = (element.y + (element.radius || 50)) * zoom;
      } else if (element.type === 'sticky-note') {
        textX = (element.x + 8) * zoom;
        textY = (element.y + 30) * zoom;
      }

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      textarea.value = element.text || '';
      textarea.style.position = 'absolute';
      textarea.style.top = stageBox.top + textY + 'px';
      textarea.style.left = stageBox.left + textX + 'px';
      textarea.style.transform = 'translate(-50%, -50%)';
      textarea.style.fontSize = (element.fontSize || 14) * zoom + 'px';
      textarea.style.border = '2px solid #0284c7';
      textarea.style.padding = '4px';
      textarea.style.background = 'white';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.borderRadius = '4px';
      textarea.style.zIndex = '10000';
      textarea.style.width = element.type === 'sticky-note' ? ((element.width || 200) - 16) * zoom + 'px' : 150 * zoom + 'px';
      textarea.style.height = element.type === 'sticky-note' ? ((element.height || 150) - 40) * zoom + 'px' : 'auto';
      textarea.style.textAlign = element.type === 'sticky-note' ? 'left' : 'center';
      textarea.style.fontFamily = 'Arial, sans-serif';
      textarea.style.transform = element.type === 'sticky-note' ? 'none' : 'translate(-50%, -50%)';

      setTimeout(() => {
        textarea.focus();
        textarea.select();
      }, 0);

      const removeTextarea = () => {
        if (document.body.contains(textarea)) {
          updateElement(elementId, { text: textarea.value || 'Label' });
          setEditingTextId(null);
          document.body.removeChild(textarea);
        }
      };

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          removeTextarea();
        }
        if (e.key === 'Escape') {
          removeTextarea();
        }
      });

      textarea.addEventListener('blur', removeTextarea);
      return;
    }

    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = element.text || '';
    textarea.style.position = 'absolute';
    textarea.style.top = stageBox.top + textPosition.y + 'px';
    textarea.style.left = stageBox.left + textPosition.x + 'px';
    textarea.style.fontSize = (element.fontSize || 14) * zoom + 'px';
    textarea.style.border = '2px solid #0284c7';
    textarea.style.padding = '4px';
    textarea.style.background = 'white';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.borderRadius = '4px';
    textarea.style.zIndex = '10000';
    textarea.style.width = 150 * zoom + 'px';
    textarea.style.textAlign = 'center';
    textarea.style.fontFamily = 'Arial, sans-serif';

    setTimeout(() => {
      textarea.focus();
      textarea.select();
    }, 0);

    const removeTextarea = () => {
      if (document.body.contains(textarea)) {
        updateElement(elementId, { text: textarea.value || 'Label' });
        setEditingTextId(null);
        document.body.removeChild(textarea);
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        removeTextarea();
      }
      if (e.key === 'Escape') {
        removeTextarea();
      }
    });

    textarea.addEventListener('blur', removeTextarea);
  };

  useEffect(() => {
    if (editingTextId) {
      const element = elements.find(el => el.id === editingTextId);
      if (element) {
        handleTextEdit(editingTextId, element);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTextId, elements]);

  // Update connector positions when shapes move
  useEffect(() => {
    const connectors = elements.filter(el => el.type === 'connector');

    connectors.forEach(connector => {
      if (connector.startElementId && connector.endElementId) {
        const startEl = elements.find(el => el.id === connector.startElementId);
        const endEl = elements.find(el => el.id === connector.endElementId);

        if (startEl && endEl) {
          const startPoint = getConnectionPoint(startEl, connector.startAnchor || 'right');
          const endPoint = getConnectionPoint(endEl, connector.endAnchor || 'left');

          const newPoints = [startPoint.x, startPoint.y, endPoint.x, endPoint.y];
          const currentPoints = connector.points || [];

          const hasChanged = newPoints.some((point, idx) =>
            Math.abs(point - (currentPoints[idx] || 0)) > 0.5
          );

          if (hasChanged) {
            updateElement(connector.id, { points: newPoints });
          }
        }
      }
    });
  }, [elements.filter(el => el.type !== 'connector').map(el => `${el.id}-${el.x}-${el.y}`).join(',')]);

  const renderShape = (element: DesignElement) => {
    if (element.type === 'connector') return null;

    const isEditing = editingTextId === element.id;
    const isSelected = selectedId === element.id;

    // Render sticky notes separately
    if (element.type === 'sticky-note') {
      return (
        <StickyNote
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={() => {
            selectElement(element.id);
          }}
          onDragEnd={(e: any) => {
            updateElement(element.id, {
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          onDblClick={() => {
            setEditingTextId(element.id);
          }}
        />
      );
    }

    return (
      <Group
        key={element.id}
        x={element.x}
        y={element.y}
        draggable={!draggingConnector}
        onClick={(e) => {
          e.cancelBubble = true;
          selectElement(element.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          selectElement(element.id);
        }}
        onDragStart={(e) => {
          const group = e.target as Konva.Group;
          const localPos = group.getRelativePointerPosition();
          if (!localPos) return;

          const edge = isNearEdge(element, localPos.x, localPos.y);
          if (edge) {
            // Prevent drag when starting from edge (we want connector instead)
            e.target.stopDrag();
            e.cancelBubble = true;
            return;
          }

          e.target.to({
            scaleX: 1.05,
            scaleY: 1.05,
            shadowOffsetX: 8,
            shadowOffsetY: 8,
            shadowBlur: 15,
            shadowOpacity: 0.4,
            duration: 0.1,
          });
        }}
        onDragEnd={(e) => {
          e.target.to({
            scaleX: 1,
            scaleY: 1,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowBlur: 0,
            shadowOpacity: 0,
            duration: 0.2,
          });
          updateElement(element.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onMouseDown={(e) => handleMouseDown(element, e)}
        onMouseUp={() => handleMouseUp(element)}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (!stage || draggingConnector) return;

          const group = e.target.findAncestor('Group') as Konva.Group;
          if (!group) return;

          const localPos = group.getRelativePointerPosition();
          if (!localPos) return;

          const edge = isNearEdge(element, localPos.x, localPos.y);
          const container = stage.container();

          if (edge) {
            container.style.cursor = 'crosshair';
          } else {
            container.style.cursor = 'move';
            // Subtle hover effect
            group.to({
              scaleX: 1.02,
              scaleY: 1.02,
              duration: 0.15,
            });
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (!stage || draggingConnector) return;
          const container = stage.container();
          container.style.cursor = 'default';

          // Reset hover effect
          const group = e.target.findAncestor('Group') as Konva.Group;
          if (group) {
            group.to({
              scaleX: 1,
              scaleY: 1,
              duration: 0.15,
            });
          }
        }}
      >
        {element.type === 'rectangle' && (
          <>
            <Rect
              x={0}
              y={0}
              width={element.width || 120}
              height={element.height || 80}
              fill={element.fill}
              stroke={isSelected ? '#0284c7' : element.stroke}
              strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
            />
            {element.text && !isEditing && (
              <Text
                id={`text-${element.id}`}
                x={0}
                y={(element.height || 80) / 2 - (element.fontSize || 14) / 2}
                width={element.width || 120}
                text={element.text}
                fontSize={element.fontSize || 14}
                fill="#000000"
                align="center"
                listening={false}
              />
            )}
          </>
        )}

        {element.type === 'circle' && (
          <>
            <Circle
              x={(element.radius || 50)}
              y={(element.radius || 50)}
              radius={element.radius || 50}
              fill={element.fill}
              stroke={isSelected ? '#0284c7' : element.stroke}
              strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
            />
            {element.text && !isEditing && (
              <Text
                id={`text-${element.id}`}
                x={0}
                y={(element.radius || 50) - (element.fontSize || 14) / 2}
                width={(element.radius || 50) * 2}
                text={element.text}
                fontSize={element.fontSize || 14}
                fill="#000000"
                align="center"
                listening={false}
              />
            )}
          </>
        )}

        {element.type === 'database' && (
          <DatabaseShape element={element} isSelected={isSelected} isEditing={isEditing} />
        )}

        {element.type === 'server-stack' && (
          <ServerStackShape element={element} isSelected={isSelected} isEditing={isEditing} />
        )}

        {element.type === 'cloud' && (
          <CloudShape element={element} isSelected={isSelected} isEditing={isEditing} />
        )}

        {element.type === 'text' && (
          <Text
            x={0}
            y={0}
            text={isEditing ? '' : element.text}
            fontSize={element.fontSize}
            fill={element.fill}
          />
        )}
      </Group>
    );
  };

  const renderConnector = (element: DesignElement) => {
    if (element.type !== 'connector' || !element.points || element.points.length !== 4) {
      return null;
    }

    const isSelected = selectedId === element.id;

    return (
      <Arrow
        key={element.id}
        points={element.points}
        stroke={isSelected ? '#0284c7' : (element.stroke || '#1f2937')}
        strokeWidth={isSelected ? 4 : (element.strokeWidth || 2)}
        fill={isSelected ? '#0284c7' : (element.stroke || '#1f2937')}
        pointerLength={10}
        pointerWidth={10}
        tension={0.3}
        onClick={(e) => {
          e.cancelBubble = true;
          selectElement(element.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          selectElement(element.id);
        }}
        onMouseEnter={(e) => {
          const target = e.target;
          target.to({
            strokeWidth: isSelected ? 5 : 3,
            duration: 0.15,
          });
        }}
        onMouseLeave={(e) => {
          const target = e.target;
          target.to({
            strokeWidth: isSelected ? 4 : 2,
            duration: 0.15,
          });
        }}
      />
    );
  };

  const shapes = elements.filter(el => el.type !== 'connector');
  const connectors = elements.filter(el => el.type === 'connector');

  return (
    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        onClick={() => {
          if (tool === 'sticky-note') {
            const stage = stageRef.current;
            if (!stage) return;

            const pos = stage.getPointerPosition();
            if (!pos) return;

            const newNote: DesignElement = {
              id: `sticky-note-${Date.now()}`,
              type: 'sticky-note',
              x: pos.x / zoom,
              y: pos.y / zoom,
              width: 200,
              height: 150,
              text: 'Add your requirements or notes here...',
              fontSize: 14,
              category: 'general',
            };

            addElement(newNote);
            setTool('select');
          } else {
            selectElement(null);
            setEditingTextId(null);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => handleMouseUp(null)}
      >
        <Layer>
          {connectors.map(renderConnector)}
          {shapes.map(renderShape)}

          {/* Show temporary connector line while dragging */}
          {draggingConnector && (
            <Line
              points={[
                draggingConnector.startX,
                draggingConnector.startY,
                draggingConnector.currentX,
                draggingConnector.currentY,
              ]}
              stroke="#0284c7"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};
