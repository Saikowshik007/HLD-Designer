import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useDesignStore } from '@/store/designStore';
import { getLangChainService } from '@/services/langchainService';
import type { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatPanelProps {
  onResize?: () => void;
}

export const ChatPanel = ({ onResize }: ChatPanelProps) => {
  const { user } = useAuthStore();
  const { elements } = useCanvasStore();
  const { currentDesign, updateDesign } = useDesignStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when design changes
  useEffect(() => {
    if (currentDesign?.chatHistory) {
      const loadedMessages: Message[] = currentDesign.chatHistory.map((msg, idx) => ({
        id: `${msg.timestamp}-${idx}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(loadedMessages);
    } else {
      setMessages([]);
    }
  }, [currentDesign?.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragStartY(e.clientY);
    setDragStartHeight(panelHeight);
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate how much the mouse moved
      const deltaY = dragStartY - e.clientY; // Positive when dragging UP
      const newHeight = dragStartHeight + deltaY; // Add delta to make panel bigger when dragging up

      setPanelHeight(Math.max(200, Math.min(600, newHeight)));
      onResize?.();
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResize?.();
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dragStartY, dragStartHeight, onResize]);

  const handleSend = async () => {
    if (!input.trim() || !user?.llmApiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use LangChain for conversation management
      const langChainService = getLangChainService(user.llmApiKey, user.llmModel);
      const responseText = await langChainService.chat(input.trim(), elements);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        // Save to design
        if (currentDesign && user) {
          const chatHistory: ChatMessage[] = newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          }));
          updateDesign(user.uid, currentDesign.id, { chatHistory });
        }
        return newMessages;
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (user?.llmApiKey) {
      const langChainService = getLangChainService(user.llmApiKey, user.llmModel);
      langChainService.clearHistory();
      setMessages([]);

      // Clear from design
      if (currentDesign && user) {
        updateDesign(user.uid, currentDesign.id, { chatHistory: [] });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isCollapsed) {
    return (
      <div className="border-t border-gray-200 bg-white">
        <button
          onClick={() => {
            setIsCollapsed(false);
            setTimeout(() => onResize?.(), 0);
          }}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <ChevronUp className="w-4 h-4" />
          Show AI Assistant
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{ height: panelHeight }}
      className="border-t border-gray-200 bg-white flex flex-col"
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-1 bg-gray-200 hover:bg-primary-400 cursor-ns-resize transition-colors"
      />

      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <h3 className="font-semibold text-gray-800">AI Design Assistant</h3>
          <span className="text-xs text-gray-500">(LangChain)</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-1 hover:bg-gray-100 rounded"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={() => {
              setIsCollapsed(true);
              setTimeout(() => onResize?.(), 0);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">Ask me anything about your system design!</p>
            <p className="text-sm mt-2">I can help with architecture, scalability, best practices, and more.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your design..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
