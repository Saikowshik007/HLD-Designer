import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { generateMermaidCode } from '@/utils/mermaidGenerator';
import type { DesignElement } from '@/types';

export class ConversationManager {
  private llm: ChatOpenAI;
  private conversationHistory: (HumanMessage | AIMessage)[] = [];
  private readonly MAX_MESSAGES = 6; // Keep last 3 exchanges

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.llm = new ChatOpenAI({
      apiKey: apiKey, // Use apiKey parameter, not openAIApiKey
      model: model,
      temperature: 0.7,
      maxTokens: 1000,
    });
  }

  async chat(question: string, designElements: DesignElement[]): Promise<string> {
    const mermaidCode = generateMermaidCode(designElements);

    const systemPrompt = `You are an expert system design architect providing concise, actionable feedback.

Current Design State (Mermaid Flowchart):
\`\`\`mermaid
${mermaidCode}
\`\`\`

Guidelines for responses:
- Keep responses concise and focused (3-5 key points maximum)
- Prioritize actionable improvements over general analysis
- Use bullet points for clarity
- Reference specific components from the diagram
- Suggest concrete additions (e.g., "Add a cache layer between API Gateway and Database")
- Identify critical missing components (e.g., "Missing: Authentication service, Database layer")
- Highlight potential bottlenecks or single points of failure

Format your response as:
**Quick Analysis:** [1-2 sentence overview]

**Key Issues:**
- [Issue 1]
- [Issue 2]

**Recommendations:**
- [Action 1]
- [Action 2]`;

    const messages = [
      new SystemMessage(systemPrompt),
      ...this.conversationHistory.slice(-this.MAX_MESSAGES),
      new HumanMessage(question),
    ];

    const response = await this.llm.invoke(messages);

    // Add to history
    this.conversationHistory.push(new HumanMessage(question));
    this.conversationHistory.push(new AIMessage(response.content.toString()));

    // Keep only recent messages
    if (this.conversationHistory.length > this.MAX_MESSAGES) {
      this.conversationHistory = this.conversationHistory.slice(-this.MAX_MESSAGES);
    }

    return response.content.toString();
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return this.conversationHistory;
  }
}

// Singleton pattern - one conversation manager per session
let conversationManager: ConversationManager | null = null;
let currentApiKey: string | null = null;
let currentModel: string | null = null;

export const getLangChainService = (apiKey: string, model: string = 'gpt-4o') => {
  // Recreate if API key or model changed
  if (!conversationManager || currentApiKey !== apiKey || currentModel !== model) {
    conversationManager = new ConversationManager(apiKey, model);
    currentApiKey = apiKey;
    currentModel = model;
  }
  return conversationManager;
};
