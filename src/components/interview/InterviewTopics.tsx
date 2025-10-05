import { useState } from 'react';
import { interviewTopics, getTopicsByDifficulty, type InterviewTopic } from '@/data/interviewTopics';
import { Play, ChevronDown, ChevronRight } from 'lucide-react';

interface InterviewTopicsProps {
  onSelectTopic: (topic: InterviewTopic) => void;
  selectedTopic: InterviewTopic | null;
}

export const InterviewTopics = ({ onSelectTopic, selectedTopic }: InterviewTopicsProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    easy: true,
    medium: false,
    hard: false,
  });

  const toggleSection = (difficulty: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [difficulty]: !prev[difficulty],
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderTopics = (difficulty: 'easy' | 'medium' | 'hard') => {
    const topics = getTopicsByDifficulty(difficulty);

    return (
      <div key={difficulty} className="mb-2">
        <button
          onClick={() => toggleSection(difficulty)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          {expandedSections[difficulty] ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="capitalize">{difficulty}</span>
          <span className="ml-auto text-xs text-gray-500">({topics.length})</span>
        </button>

        {expandedSections[difficulty] && (
          <div className="ml-6 mt-1 space-y-1">
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedTopic?.id === topic.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  {selectedTopic?.id === topic.id && (
                    <Play className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary-600" fill="currentColor" />
                  )}
                  <span className="flex-1 leading-tight">{topic.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">💻 System Design Interview</h2>
        <p className="text-xs text-gray-500 mt-1">Select a topic to start</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {renderTopics('easy')}
        {renderTopics('medium')}
        {renderTopics('hard')}
      </div>

      {selectedTopic && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className={`px-3 py-2 rounded-md border ${getDifficultyColor(selectedTopic.difficulty)}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium uppercase">{selectedTopic.difficulty}</span>
            </div>
            <p className="text-xs leading-relaxed">{selectedTopic.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};
