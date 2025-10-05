import type { DesignElement } from '@/types';

/**
 * Converts design elements to Mermaid flowchart syntax
 */
export const generateMermaidCode = (elements: DesignElement[]): string => {
  const shapes = elements.filter(el => el.type !== 'connector');
  const connectors = elements.filter(el => el.type === 'connector');
  const stickyNotes = elements.filter(el => el.type === 'sticky-note');

  // Create a mapping of element IDs to readable node identifiers
  const nodeMap = new Map<string, string>();
  shapes.forEach((shape, index) => {
    nodeMap.set(shape.id, `node${index}`);
  });

  // Start with flowchart definition
  let mermaidCode = 'flowchart TD\n';

  // Add sticky notes as comments at the top
  if (stickyNotes.length > 0) {
    mermaidCode += '\n    %% === REQUIREMENTS & NOTES ===\n';
    stickyNotes.forEach(note => {
      const category = (note.category || 'general').toUpperCase();
      const text = (note.text || '').replace(/\n/g, ' ').substring(0, 100);
      mermaidCode += `    %% [${category}] ${text}\n`;
    });
    mermaidCode += '    %% =============================\n\n';
  }

  // Add node definitions with labels
  shapes.forEach(shape => {
    const nodeId = nodeMap.get(shape.id);
    const label = shape.text || 'Component';

    // Determine shape type in Mermaid syntax
    let nodeDefinition = '';
    switch (shape.type) {
      case 'rectangle':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      case 'circle':
        nodeDefinition = `    ${nodeId}((${label}))`;
        break;
      case 'database':
        nodeDefinition = `    ${nodeId}[(${label})]`;
        break;
      case 'cloud':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      case 'server-stack':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      case 'text':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      default:
        nodeDefinition = `    ${nodeId}[${label}]`;
    }

    if (nodeDefinition) {
      mermaidCode += nodeDefinition + '\n';
    }
  });

  // Add connections
  connectors.forEach(connector => {
    if (connector.startElementId && connector.endElementId) {
      const startNode = nodeMap.get(connector.startElementId);
      const endNode = nodeMap.get(connector.endElementId);

      if (startNode && endNode) {
        mermaidCode += `    ${startNode} --> ${endNode}\n`;
      }
    }
  });

  return mermaidCode;
};

/**
 * Generates a more detailed Mermaid code with styling information
 */
export const generateDetailedMermaidCode = (elements: DesignElement[]): string => {
  const shapes = elements.filter(el => el.type !== 'connector');
  const connectors = elements.filter(el => el.type === 'connector');

  const nodeMap = new Map<string, string>();
  shapes.forEach((shape, index) => {
    nodeMap.set(shape.id, `node${index}`);
  });

  let mermaidCode = 'flowchart TD\n';

  // Add node definitions
  shapes.forEach(shape => {
    const nodeId = nodeMap.get(shape.id);
    const label = shape.text || 'Component';

    let nodeDefinition = '';
    switch (shape.type) {
      case 'rectangle':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      case 'circle':
        nodeDefinition = `    ${nodeId}((${label}))`;
        break;
      case 'database':
        nodeDefinition = `    ${nodeId}[(${label})]`;
        break;
      case 'cloud':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      case 'server-stack':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      case 'text':
        nodeDefinition = `    ${nodeId}[${label}]`;
        break;
      default:
        nodeDefinition = `    ${nodeId}[${label}]`;
    }

    if (nodeDefinition) {
      mermaidCode += nodeDefinition + '\n';
    }
  });

  // Add connections
  connectors.forEach(connector => {
    if (connector.startElementId && connector.endElementId) {
      const startNode = nodeMap.get(connector.startElementId);
      const endNode = nodeMap.get(connector.endElementId);

      if (startNode && endNode) {
        mermaidCode += `    ${startNode} --> ${endNode}\n`;
      }
    }
  });

  // Add styling for nodes based on their fill color
  const styleMap = new Map<string, string[]>();
  shapes.forEach(shape => {
    const nodeId = nodeMap.get(shape.id);
    if (nodeId && shape.fill) {
      const fill = shape.fill;
      if (!styleMap.has(fill)) {
        styleMap.set(fill, []);
      }
      styleMap.get(fill)?.push(nodeId);
    }
  });

  // Add style definitions
  let styleIndex = 0;
  styleMap.forEach((nodes, color) => {
    const styleName = `style${styleIndex}`;
    mermaidCode += `\n    classDef ${styleName} fill:${color}\n`;
    mermaidCode += `    class ${nodes.join(',')} ${styleName}\n`;
    styleIndex++;
  });

  return mermaidCode;
};
