import { useState } from 'react';
import { systemDesignTopics, getCategoryColor } from '@/data/systemDesignTopics';
import type { SystemDesignTopic } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface TopicsListProps {
  onQuestionClick: (question: string, topic: SystemDesignTopic) => void;
}

export const TopicsList = ({ onQuestionClick }: TopicsListProps) => {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        System Design Topics
      </h3>
      {systemDesignTopics.map((topic) => {
        const isExpanded = expandedTopics.has(topic.id);

        return (
          <div
            key={topic.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              onClick={() => toggleTopic(topic.id)}
              className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="mt-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{topic.title}</h4>
                  <span
                    className={clsx(
                      'text-xs px-2 py-1 rounded-full border',
                      getCategoryColor(topic.category)
                    )}
                  >
                    {topic.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{topic.description}</p>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  Common Questions:
                </h5>
                <ul className="space-y-2">
                  {topic.questions.map((question, index) => (
                    <li key={index}>
                      <button
                        onClick={() => onQuestionClick(question, topic)}
                        className="w-full text-left text-sm text-gray-700 hover:text-primary-600 hover:bg-white p-2 rounded transition-colors"
                      >
                        • {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
