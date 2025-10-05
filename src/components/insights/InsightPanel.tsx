import { useState, FormEvent } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useAuthStore } from '@/store/authStore';
import { llmService } from '@/services/llmService';
import type { SystemDesignTopic, LLMInsightResponse } from '@/types';
import { Search, Loader2, Lightbulb } from 'lucide-react';

interface InsightPanelProps {
  currentTopic?: SystemDesignTopic;
}

export const InsightPanel = ({ currentTopic }: InsightPanelProps) => {
  const { elements } = useCanvasStore();
  const { user } = useAuthStore();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<LLMInsightResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await llmService.getInsight({
        designElements: elements,
        question: question.trim(),
        context: currentTopic ? { topic: currentTopic } : undefined,
      }, user?.llmApiKey || '');
      setInsight(response);
    } catch (error) {
      console.error('Failed to get insight:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Ask About Your Design
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your design... (e.g., 'How can I improve the scalability of this architecture?')"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting Insights...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Get Insights
              </>
            )}
          </button>
        </form>
      </div>

      {insight && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Insights
          </h3>

          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap">{insight.insight}</div>
          </div>

          {insight.suggestions.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Key Suggestions:
              </h4>
              <ul className="space-y-2">
                {insight.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 flex items-start gap-2"
                  >
                    <span className="text-primary-600 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-gray-500 text-right">
            {new Date(insight.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
