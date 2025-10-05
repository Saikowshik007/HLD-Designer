import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

interface SettingsModalProps {
  onClose: () => void;
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (Recommended)', description: 'Most capable, best for complex designs' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster and cheaper, good for simple questions' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation, reliable' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fastest and cheapest' },
];

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const { user } = useAuthStore();
  const [apiKey, setApiKey] = useState(user?.llmApiKey || '');
  const [selectedModel, setSelectedModel] = useState(user?.llmModel || 'gpt-4o');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setApiKey(user.llmApiKey || '');
      setSelectedModel(user.llmModel || 'gpt-4o');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !apiKey.trim()) {
      setMessage({ type: 'error', text: 'API key is required' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await authService.updateUserSettings(user.uid, {
        llmApiKey: apiKey.trim(),
        llmModel: selectedModel,
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => {
        onClose();
        // Reload to apply new settings
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Key Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-2 text-sm text-gray-500">
              Your API key is stored securely in Firebase and never shared. Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              AI Model
            </label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedModel === model.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{model.name}</div>
                    <div className="text-sm text-gray-600">{model.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !apiKey.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
