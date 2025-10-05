import type { LLMInsightRequest, LLMInsightResponse } from '@/types';
import { generateMermaidCode } from '@/utils/mermaidGenerator';

const API_URL = import.meta.env.VITE_LLM_API_URL || 'https://api.openai.com/v1/chat/completions';

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const llmService = {
  async getInsight(
    request: LLMInsightRequest,
    userApiKey: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<LLMInsightResponse> {
    if (!userApiKey) {
      return {
        insight: 'Error: LLM API key not configured. Please ensure you provided your API key during registration.',
        suggestions: [
          'Your API key was not found',
          'Please contact support or create a new account with a valid API key',
        ],
        timestamp: Date.now(),
      };
    }

    const mermaidCode = generateMermaidCode(request.designElements);

    const systemPrompt = `You are an expert system design interviewer and architect.
Your role is to provide insightful feedback on high-level design diagrams and answer questions about system design.
Analyze the current design state (provided as a Mermaid flowchart) and provide constructive feedback, identify potential issues, and suggest improvements.
Be specific, actionable, and educational in your responses.
The user's current design diagram is always provided with each request, and you should maintain conversation context from previous messages.

Current Design State (Mermaid Flowchart):
\`\`\`mermaid
${mermaidCode}
\`\`\`

${request.context?.topic ? `Topic: ${request.context.topic.title}\nCategory: ${request.context.topic.category}\n` : ''}

Remember to reference this design diagram when answering questions.`;

    // Build messages array with conversation history
    const messages: ConversationMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: request.question }
    ];

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
      }

      const data = await response.json();
      const insightText = data.choices[0]?.message?.content || 'No insight generated';

      const lines = insightText.split('\n').filter((line: string) => line.trim());
      const suggestions = lines
        .filter((line: string) => line.includes('•') || line.includes('-') || /^\d+\./.test(line))
        .map((line: string) => line.replace(/^[•\-\d.]\s*/, '').trim())
        .slice(0, 5);

      return {
        insight: insightText,
        suggestions: suggestions.length > 0 ? suggestions : ['Consider the scalability of your design', 'Think about data consistency', 'Plan for failure scenarios'],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting LLM insight:', error);

      return {
        insight: `Error: Unable to get insights at this time. ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestions: [
          'Ensure your LLM API is configured correctly',
          'Check your network connection',
          'Verify API key and endpoint',
        ],
        timestamp: Date.now(),
      };
    }
  },
};
