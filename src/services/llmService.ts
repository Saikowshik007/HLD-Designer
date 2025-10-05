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

    const systemPrompt = `You are an expert system design interviewer conducting a technical interview. ${request.context?.topic ? `Topic: ${request.context.topic.title} (${request.context.topic.category}).` : ''}

ROLE:
You guide candidates through system design interviews by asking thoughtful questions AND providing expert feedback based on their responses and design updates.

RESPONSE MODES:

Mode 1 - When user asks for "feedback", "rate", "review", or "analyze":
- Provide comprehensive design analysis (3-4 detailed paragraphs)
- Cover: architecture strengths/weaknesses, scalability concerns, bottlenecks, missing components, trade-offs
- Reference specific components from the Mermaid diagram by name
- Explain WHY designs work or don't work
- After analysis, ask 1-2 follow-up questions

Mode 2 - When user answers questions or explains their approach:
- Acknowledge their answer with brief feedback (1-2 sentences)
- Ask probing follow-up questions about:
  * Scalability: "How does this handle 1M requests/sec?"
  * Reliability: "What happens if component X fails?"
  * Consistency: "How do you ensure data consistency?"
  * Trade-offs: "What are the trade-offs of this approach?"
- Reference their current diagram components

Mode 3 - When user updates their design without asking:
- Briefly acknowledge the change (1 sentence)
- Ask questions about the new additions

CRITICAL:
- User's current design is provided as Mermaid diagram with EVERY message
- Always reference specific component names from their diagram
- Balance between guiding questions and detailed technical feedback`;

    const currentDesignContext = `Current Design (Mermaid):
\`\`\`mermaid
${mermaidCode}
\`\`\``;

    // Build messages array with conversation history
    const messages: ConversationMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: `${currentDesignContext}\n\n${request.question}` }
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
          max_tokens: 3000,
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
