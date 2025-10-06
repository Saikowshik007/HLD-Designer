import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Trash2, Play, Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useDesignStore } from '@/store/designStore';
import { getLangChainService, type ConversationMode } from '@/services/langchainService';
import { getVoiceService } from '@/services/voiceService';
import { chatService, type ChatMessage } from '@/services/chatService';
import type { InterviewTopic } from '@/data/interviewTopics';
import ReactMarkdown from 'react-markdown';


interface ChatPanelProps {
  onResize?: () => void;
  selectedTopic: InterviewTopic | null;
}

export const ChatPanel = ({ onResize, selectedTopic }: ChatPanelProps) => {
  const { user } = useAuthStore();
  const { elements } = useCanvasStore();
  const { currentDesign } = useDesignStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(user?.voiceAutoSpeak || false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>('practice');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceService = useRef(getVoiceService(user?.voiceLanguage || 'en-US')).current;
  const isSpaceHeldRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when design changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentDesign && user) {
        try {
          const loadedMessages = await chatService.getMessagesForDesign(user.uid, currentDesign.id);
          setMessages(loadedMessages);
          setInterviewStarted(loadedMessages.length > 0);
        } catch (error) {
          console.error('Error loading messages:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
        setInterviewStarted(false);
      }
    };

    loadMessages();
  }, [currentDesign?.id, user]);

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
    if (!input.trim() || !user?.llmApiKey || !currentDesign) return;

    const userMessageContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to Firebase
      const userMessage = await chatService.saveMessage(
        user.uid,
        currentDesign.id,
        'user',
        userMessageContent
      );

      setMessages((prev) => [...prev, userMessage]);

      // Use LangChain for conversation management
      const langChainService = getLangChainService(user.llmApiKey, user.llmModel);
      langChainService.setMode(conversationMode); // Set mode before chat
      const responseText = await langChainService.chat(userMessageContent, elements);

      // Save assistant message to Firebase
      const assistantMessage = await chatService.saveMessage(
        user.uid,
        currentDesign.id,
        'assistant',
        responseText
      );

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Save error message to Firebase
      if (currentDesign && user) {
        const errorMessage = await chatService.saveMessage(
          user.uid,
          currentDesign.id,
          'assistant',
          `Error: ${error instanceof Error ? error.message : 'Please try again.'}`
        );
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedTopic || !user?.llmApiKey || !currentDesign) return;

    setIsLoading(true);
    try {
      const langChainService = getLangChainService(user.llmApiKey, user.llmModel);
      const welcomeMessage = await langChainService.startInterview(selectedTopic, elements);

      // Save welcome message to Firebase
      const assistantMessage = await chatService.saveMessage(
        user.uid,
        currentDesign.id,
        'assistant',
        welcomeMessage
      );

      setMessages([assistantMessage]);
      setInterviewStarted(true);
    } catch (error) {
      console.error('Start interview error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (user?.llmApiKey && currentDesign) {
      const langChainService = getLangChainService(user.llmApiKey, user.llmModel);
      langChainService.clearHistory();
      setMessages([]);
      setInterviewStarted(false);

      // Delete all messages from Firebase
      try {
        await chatService.deleteMessagesForDesign(user.uid, currentDesign.id);
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to send (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      voiceService.stopRecording();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);

    try {
      const transcription = await voiceService.startRecording();
      if (transcription && transcription.trim()) {
        // Append to existing input with a space separator if there's already text
        setInput(prev => prev.trim() ? `${prev} ${transcription}` : transcription);
        // Focus textarea after transcription so Enter can send
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
      setIsRecording(false);
      isSpaceHeldRef.current = false;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to record audio';
      if (!errorMsg.includes('No speech detected') && !errorMsg.includes('Recording stopped')) {
        alert(errorMsg);
      }
      setIsRecording(false);
      isSpaceHeldRef.current = false;
    }
  };

  const toggleAutoSpeak = () => {
    if (autoSpeak) {
      voiceService.stopSpeaking();
    }
    setAutoSpeak(!autoSpeak);
  };

  // Update voice service language when user settings change
  useEffect(() => {
    if (user?.voiceLanguage) {
      voiceService.setLanguage(user.voiceLanguage);
    }
  }, [user?.voiceLanguage]);

  // Update auto-speak when user settings change
  useEffect(() => {
    setAutoSpeak(user?.voiceAutoSpeak || false);
  }, [user?.voiceAutoSpeak]);

  // Auto-speak assistant responses when autoSpeak is enabled
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !isLoading) {
        voiceService.speak(lastMessage.content, {
          rate: user?.voiceRate || 0.95,
          pitch: user?.voicePitch || 1.1,
        });
      }
    }
  }, [messages, autoSpeak, isLoading, user?.voiceRate, user?.voicePitch]);

  // Global spacebar shortcut for voice input (when not in textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate if space is pressed and we're not in the textarea
      if (
        e.code === 'Space' &&
        document.activeElement !== textareaRef.current &&
        !isSpaceHeldRef.current &&
        !isRecording &&
        !isLoading
      ) {
        e.preventDefault();
        isSpaceHeldRef.current = true;
        handleMicClick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Stop recording when space is released (only if we started it with space)
      if (e.code === 'Space' && isSpaceHeldRef.current && isRecording) {
        e.preventDefault();
        isSpaceHeldRef.current = false;
        // Explicitly stop the recording
        voiceService.stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.dispose();
    };
  }, []);

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
      className="border-t border-gray-200 bg-white flex flex-col w-full"
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-1 bg-gray-200 hover:bg-primary-400 cursor-ns-resize transition-colors"
      />

      {/* Header */}
      <div className="px-3 sm:px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">AI Design Assistant</h3>
          <span className="text-xs text-gray-500 hidden sm:inline">(LangChain)</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded p-0.5 mr-1">
            <button
              onClick={() => setConversationMode('practice')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                conversationMode === 'practice'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Practice Mode: Helpful feedback and learning"
            >
              Practice
            </button>
            <button
              onClick={() => setConversationMode('interview')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                conversationMode === 'interview'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Interview Mode: Evaluation and testing"
            >
              Interview
            </button>
          </div>
          <button
            onClick={toggleAutoSpeak}
            className={`p-1 hover:bg-gray-100 rounded ${autoSpeak ? 'bg-primary-100' : ''}`}
            title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
          >
            {autoSpeak ? (
              <Volume2 className="w-4 h-4 text-primary-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-600" />
            )}
          </button>
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
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {messages.length === 0 && selectedTopic && !interviewStarted && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">Ready to start: {selectedTopic.title}</p>
            <p className="text-sm mt-2 mb-4">{selectedTopic.description}</p>
            <button
              onClick={handleStartInterview}
              disabled={isLoading || !user?.llmApiKey}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Interview
            </button>
          </div>
        )}

        {messages.length === 0 && !selectedTopic && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">Select an Interview Topic</p>
            <p className="text-sm mt-2">Choose a topic from the left panel to begin your system design interview.</p>
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
      <div className="p-2 sm:p-4 border-t border-gray-200">
        <div className="flex gap-1 sm:gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening...'
                : 'Type (Enter to send, Shift+Enter for new line) or hold Space to speak...'
            }
            className="flex-1 px-2 sm:px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            rows={2}
            disabled={isLoading || isRecording}
          />
          <button
            onClick={handleMicClick}
            disabled={isLoading}
            className={`px-2 sm:px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            title={isRecording ? 'Stop listening' : 'Start voice input (Chrome)'}
          >
            {isRecording ? (
              <Square className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isRecording}
            className="px-2 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
