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

const VOICE_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'en-IN', name: 'English (India)' },
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'hi-IN', name: 'Hindi' },
];

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const { user } = useAuthStore();
  const [apiKey, setApiKey] = useState(user?.llmApiKey || '');
  const [selectedModel, setSelectedModel] = useState(user?.llmModel || 'gpt-4o');
  const [voiceLanguage, setVoiceLanguage] = useState(user?.voiceLanguage || 'en-US');
  const [voiceAutoSpeak, setVoiceAutoSpeak] = useState(user?.voiceAutoSpeak || false);
  const [voiceRate, setVoiceRate] = useState(user?.voiceRate || 0.95);
  const [voicePitch, setVoicePitch] = useState(user?.voicePitch || 1.1);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setApiKey(user.llmApiKey || '');
      setSelectedModel(user.llmModel || 'gpt-4o');
      setVoiceLanguage(user.voiceLanguage || 'en-US');
      setVoiceAutoSpeak(user.voiceAutoSpeak || false);
      setVoiceRate(user.voiceRate || 0.95);
      setVoicePitch(user.voicePitch || 1.1);
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
        voiceLanguage,
        voiceAutoSpeak,
        voiceRate,
        voicePitch,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
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

          {/* Voice Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice Settings</h3>

            {/* Voice Language */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Speech Recognition Language
              </label>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {VOICE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Select your accent/language for better voice recognition accuracy
              </p>
            </div>

            {/* Auto-speak */}
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceAutoSpeak}
                  onChange={(e) => setVoiceAutoSpeak(e.target.checked)}
                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Auto-speak AI responses
                  </div>
                  <div className="text-sm text-gray-600">
                    Automatically read AI responses aloud using text-to-speech
                  </div>
                </div>
              </label>
            </div>

            {/* Voice Speed */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Speech Speed: {voiceRate.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slower (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Faster (2.0x)</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Lower = slower, more deliberate | Higher = faster, more energetic (Recommended: 0.9-1.0)
              </p>
            </div>

            {/* Voice Pitch */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Voice Pitch: {voicePitch.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Lower (0.5)</span>
                <span>Normal (1.0)</span>
                <span>Higher (2.0)</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Lower = deeper, more authoritative | Higher = warmer, more friendly (Recommended: 1.0-1.2)
              </p>
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
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
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
