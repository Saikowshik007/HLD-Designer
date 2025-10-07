import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Arrow, Group, Line } from 'react-konva';
import { useCanvasStore } from '@/store/canvasStore';
import type { DesignElement } from '@/types';
import Konva from 'konva';
import { StickyNote } from './StickyNote';
import { DatabaseShape } from './shapes/DatabaseShape';
import { ServerStackShape } from './shapes/ServerStackShape';
import { CloudShape } from './shapes/CloudShape';
import { HexagonShape } from './shapes/HexagonShape';
import { DiamondShape } from './shapes/DiamondShape';
import { CubeShape } from './shapes/CubeShape';

interface CanvasProps {
  width: number;
  height: number;
}

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
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

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

  const findNearestSideFromCenter = (element: DesignElement): 'left' | 'right' | 'top' | 'bottom' => {
    // Find the side closest to the center of the element
    const isRectangular = element.type === 'rectangle' || element.type === 'database' ||
                          element.type === 'server-stack' || element.type === 'cloud' ||
                          element.type === 'hexagon' || element.type === 'diamond' || element.type === 'cube';

    if (isRectangular) {
      // For rectangular shapes, default to right side
      return 'right';
    } else if (element.type === 'circle') {
      // For circles, default to right side
      return 'right';
    }
    return 'right';
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
    } else if (element.type === 'rectangle' || element.type === 'database' || element.type === 'server-stack' ||
               element.type === 'hexagon' || element.type === 'diamond' || element.type === 'cube') {
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
    const isRectangular = element.type === 'rectangle' || element.type === 'database' ||
                          element.type === 'server-stack' || element.type === 'cloud' ||
                          element.type === 'hexagon' || element.type === 'diamond' || element.type === 'cube';
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

    // Check if Ctrl (or Cmd on Mac) is pressed
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Start dragging connector with Ctrl+Click
      e.cancelBubble = true;
      const side = findNearestSideFromCenter(element);
      const point = getConnectionPoint(element, side);

      setDraggingConnector({
        startElementId: element.id,
        startAnchor: side,
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
      // Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
      const canvasX = (pos.x - stagePos.x) / zoom;
      const canvasY = (pos.y - stagePos.y) / zoom;

      setDraggingConnector({
        ...draggingConnector,
        currentX: canvasX,
        currentY: canvasY,
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
        // currentX and currentY are already in canvas coordinates
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
        onMouseDown={(e) => {
          e.cancelBubble = true;
          handleMouseDown(element, e);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          selectElement(element.id);
        }}
        onDragStart={(e) => {
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
          e.cancelBubble = true;
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
        onMouseUp={(e) => {
          e.cancelBubble = true;
          handleMouseUp(element);
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (!stage || draggingConnector) return;

          const group = e.target.findAncestor('Group') as Konva.Group;
          if (!group) return;

          const container = stage.container();
          container.style.cursor = 'move';

          // Subtle hover effect
          group.to({
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 0.15,
          });
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

        {element.type === 'hexagon' && (
          <HexagonShape element={element} isSelected={isSelected} isEditing={isEditing} />
        )}

        {element.type === 'diamond' && (
          <DiamondShape element={element} isSelected={isSelected} isEditing={isEditing} />
        )}

        {element.type === 'cube' && (
          <CubeShape element={element} isSelected={isSelected} isEditing={isEditing} />
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
    <div
      className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        draggable={false}
        onMouseDown={(e) => {
          // Only start panning if clicking on the stage (not on a shape)
          if (e.target === e.target.getStage()) {
            const stage = stageRef.current;
            if (stage) {
              stage.draggable(true);
              setIsPanning(true);
            }
          }
        }}
        onMouseUp={() => {
          const stage = stageRef.current;
          if (stage) {
            stage.draggable(false);
            setIsPanning(false);
          }
          handleMouseUp(null);
        }}
        onDragEnd={(e) => {
          setStagePos({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onMouseEnter={(e) => {
          if (!isPanning) {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'grab';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
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
      >
        <Layer>
          {connectors.map(renderConnector)}
          {shapes.map(renderShape)}

          {/* Empty canvas instructions - fade when elements exist */}
          {elements.length === 0 && (
            <Group opacity={0.8}>
              <Text
                x={width / (2 * zoom) - 200}
                y={height / (2 * zoom) - 100}
                width={400}
                text="Welcome to HLD Designer!"
                fontSize={28}
                fontStyle="bold"
                fill="#374151"
                align="center"
                listening={false}
              />
              <Text
                x={width / (2 * zoom) - 250}
                y={height / (2 * zoom) - 50}
                width={500}
                text="Get started by adding components from the left panel"
                fontSize={16}
                fill="#6b7280"
                align="center"
                listening={false}
              />
              <Text
                x={width / (2 * zoom) - 250}
                y={height / (2 * zoom) + 20}
                width={500}
                text="💡 Tips:"
                fontSize={14}
                fontStyle="bold"
                fill="#374151"
                align="center"
                listening={false}
              />
              <Text
                x={width / (2 * zoom) - 250}
                y={height / (2 * zoom) + 45}
                width={500}
                text={"• Click & drag shapes to move them\n• Ctrl+Click to create connectors\n• Double-click to edit labels\n• Ctrl+Scroll to zoom\n• Click & drag canvas to pan"}
                fontSize={13}
                fill="#6b7280"
                align="center"
                lineHeight={1.6}
                listening={false}
              />
            </Group>
          )}
        </Layer>

        {/* Separate layer for temporary connector line (always on top) */}
        <Layer>
          {draggingConnector && (
            <>
              <Line
                points={[
                  draggingConnector.startX,
                  draggingConnector.startY,
                  draggingConnector.currentX,
                  draggingConnector.currentY,
                ]}
                stroke="#0284c7"
                strokeWidth={3}
                dash={[10, 5]}
                listening={false}
              />
              {/* Endpoint indicator circle */}
              <Circle
                x={draggingConnector.currentX}
                y={draggingConnector.currentY}
                radius={6}
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth={2}
                listening={false}
              />
              {/* Start point indicator circle */}
              <Circle
                x={draggingConnector.startX}
                y={draggingConnector.startY}
                radius={5}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth={2}
                listening={false}
              />
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
};
