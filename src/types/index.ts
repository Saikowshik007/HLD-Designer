export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  llmApiKey?: string;
  llmModel?: string;
  voiceLanguage?: string;
  voiceAutoSpeak?: boolean;
  voiceRate?: number;
  voicePitch?: number;
}

export interface DesignElement {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'connector' | 'sticky-note' | 'database' | 'cylinder' | 'cloud' | 'server-stack' | 'hexagon' | 'diamond' | 'cube';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  // For connectors
  startElementId?: string;
  endElementId?: string;
  startAnchor?: 'top' | 'right' | 'bottom' | 'left';
  endAnchor?: 'top' | 'right' | 'bottom' | 'left';
  // For sticky notes
  category?: 'functional' | 'non-functional' | 'notes' | 'general';
  // For custom shapes
  shapeType?: 'database' | 'server' | 'cache' | 'queue' | 'cloud' | 'storage';
}

export interface Design {
  id: string;
  userId: string;
  title: string;
  elements: DesignElement[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    description?: string;
    tags?: string[];
  };
}

export interface SystemDesignTopic {
  id: string;
  title: string;
  description: string;
  questions: string[];
  category: 'requirements' | 'architecture' | 'scaling' | 'data' | 'api' | 'security' | 'monitoring';
}

export interface LLMInsightRequest {
  designElements: DesignElement[];
  question: string;
  context?: {
    topic?: SystemDesignTopic;
    previousInsights?: string[];
  };
}

export interface LLMInsightResponse {
  insight: string;
  suggestions: string[];
  timestamp: number;
}

export interface CanvasState {
  elements: DesignElement[];
  selectedId: string | null;
  tool: 'select' | 'rectangle' | 'circle' | 'text' | 'connector' | 'sticky-note';
  zoom: number;
  connectingFrom: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface DesignState {
  currentDesign: Design | null;
  designs: Design[];
  loading: boolean;
  error: string | null;
}
