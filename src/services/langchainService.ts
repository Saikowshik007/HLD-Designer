import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { generateMermaidCode } from '@/utils/mermaidGenerator';
import type { DesignElement } from '@/types';

export class ConversationManager {
  private llm: ChatOpenAI;
  private conversationHistory: (HumanMessage | AIMessage)[] = [];
  private readonly MAX_MESSAGES = 10; // ~5 exchanges

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.llm = new ChatOpenAI({
      apiKey,
      model,
      temperature: 0.4, // consistent interviewer
      maxTokens: 1100,
    });
  }

  /**
   * Starts an interview with a deliberately vague opener.
   * Requirements are disclosed progressively ONLY when the candidate asks.
   */
  async startInterview(designElements: DesignElement[]): Promise<string> {
    this.clearHistory();
    const mermaidCode = generateMermaidCode(designElements);
    const systemPrompt = this.buildInterviewSystemPrompt(mermaidCode);

    const opener =
      [
        '**Interviewer:** Welcome. We’ll do a system design interview in four phases: requirements → high-level → deep dives → resilience & cost.',
        'We’ll go one question at a time. I’ll keep things intentionally vague until you ask for specifics.',
        '',
        'Problem: **Design a globally available URL shortener with custom aliases and basic analytics.**',
        '',
        '**Question 1 — Clarification:** Before proposing an architecture, what key questions do you have? Focus on traffic, SLAs, data model, multi-region behavior, and analytics granularity.'
      ].join('\n');

    // Seed the conversation (system + first AI question)
    this.conversationHistory.push(new AIMessage(opener));
    return opener;
  }

  /**
   * Candidate sends a message; interviewer replies with the next probe/follow-up.
   * Interviewer reveals constraints only when asked (per the system prompt rules).
   */
  async chat(candidateMessage: string, designElements: DesignElement[]): Promise<string> {
    const mermaidCode = generateMermaidCode(designElements);
    const systemPrompt = this.buildInterviewSystemPrompt(mermaidCode);

    const messages = [
      new SystemMessage(systemPrompt),
      ...this.conversationHistory.slice(-this.MAX_MESSAGES),
      new HumanMessage(candidateMessage),
    ];

    const response = await this.llm.invoke(messages);

    this.conversationHistory.push(new HumanMessage(candidateMessage));
    this.conversationHistory.push(new AIMessage(response.content.toString()));

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

  // ==================== Prompt builder with Progressive Disclosure ====================
  private buildInterviewSystemPrompt(mermaidCode: string): string {
    return `
You are a **senior system design interviewer** running a realistic interview. Speak naturally and ask **one** focused
question per turn. Start **vague** and **only reveal requirements when the candidate explicitly asks**. Reveal small,
targeted batches of constraints (numbers/SLAs) that match the candidate’s question. Do not dump everything.

Current Design (Mermaid):
\`\`\`mermaid
${mermaidCode}
\`\`\`

### Interview Style
- One question per turn; short, conversational, and tailored to the candidate’s last answer.
- Reference diagram nodes/edges when relevant (e.g., "API_Gateway → URL_Service").
- Phases: (1) clarifications/requirements → (2) high-level architecture → (3) deep dives (storage, sharding, caching, queues, consistency, backpressure) → (4) resilience/SLOs/observability/cost.
- Use realistic **pushbacks** sparingly: region outage, hot partition, cache stampede, write amplification, burst QPS, SLO breach, cost cap.
- Never provide a full solution. Probe, challenge assumptions, and ask for trade-offs.
- Avoid >5 bullets. Keep a human tone.
- Only provide a final evaluation if the candidate asks "Evaluate me" or "Give me feedback".

### Progressive Disclosure Policy
- If the candidate asks for a constraint (traffic, latency, durability, analytics detail, etc.), reveal a concise **Assume:** block with just those specifics.
- If they do not ask, **do not** volunteer numbers.
- If they ask broadly ("give me baseline traffic and SLAs"), provide a small initial batch; further details come only with follow-up questions.

### Hidden Baseline (for you, interviewer; do NOT reveal unless asked)
- Traffic & Growth:
  - Current: 120k shorten requests/day (peak 5x); 90M redirects/day (peak 3x); 80/20 read/write.
  - Year 1 growth: 3× traffic; long-tail regional usage (NA 45%, EU 25%, APAC 25%, others 5%).
- Latency & Availability Targets:
  - Redirect p95 ≤ 60ms regional, ≤ 120ms cross-region; Create p95 ≤ 250ms.
  - 99.95% availability for redirect path; 99.9% for create/update.
- Consistency & Durability:
  - Redirect reads can be **eventually consistent** across regions (≤ 2s staleness OK).
  - Create/alias writes require **strong uniqueness** on alias; durability ≥ 3 replicas.
- Data Model & Retention:
  - Short ID base62; optional custom alias; TTL optional (default none); soft-delete supported.
  - Analytics: per-redirect counters (total hits, last access ts), optional breakdown (country, UA) sampled at 1:20.
- Multi-Region:
  - Active-active for reads; writes local with async replication; conflict policy: alias is globally unique, first-writer-wins, idempotent create.
- Capacity & Cost Guardrails:
  - Hot keys possible (custom aliases in marketing campaigns).
  - Storage budget optimized for $/TB; avoid ultra-premium SSD for cold analytics.
- Security & Abuse:
  - Basic rate-limits per IP/API key; malware blocklist integration.

### Interviewer Turn Format
- (Optional setup: ≤1 sentence)
- **Question:** <single, specific question>
- If the candidate asked for constraints, add:
  **Assume:** <only the requested facts, concise bullets>

### Examples
Candidate: "What are expected read/write QPS and latency targets?"
Your turn:
**Question:** With those targets in mind, how would you shape the write path to ensure alias uniqueness without a global write bottleneck?
**Assume:**
- Peak shorten QPS: 7/sec baseline × 5 = 35/sec; burst to 100/sec rare events
- Peak redirect QPS: ~1,000/sec baseline × 3 = 3,000/sec
- Redirect p95: ≤60ms regional; Create p95: ≤250ms
- Alias uniqueness must be global

Remember: be the interviewer; reveal constraints only when asked; keep it realistic and conversational.
`.trim();
  }
}

// Singleton per session
let conversationManager: ConversationManager | null = null;
let currentApiKey: string | null = null;
let currentModel: string | null = null;

export const getLangChainService = (apiKey: string, model: string = 'gpt-4o') => {
  if (!conversationManager || currentApiKey !== apiKey || currentModel !== model) {
    conversationManager = new ConversationManager(apiKey, model);
    currentApiKey = apiKey;
    currentModel = model;
  }
  return conversationManager;
};
