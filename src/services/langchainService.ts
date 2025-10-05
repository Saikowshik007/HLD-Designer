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

    const systemPrompt = `You are an expert system design interviewer and architect.
Your role is to provide insightful feedback on high-level design diagrams and answer questions about system design.
Analyze the current design state (provided as a Mermaid flowchart) and provide constructive feedback, identify potential issues, and suggest improvements.
Be specific, actionable, and educational in your responses.

Current Design State (Mermaid Flowchart):
\`\`\`mermaid
${mermaidCode}
\`\`\`

Remember to reference this design diagram when answering questions.`;

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
