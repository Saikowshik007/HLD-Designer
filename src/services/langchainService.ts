import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { generateMermaidCode } from '@/utils/mermaidGenerator';
import type { DesignElement } from '@/types';
import type { InterviewTopic } from '@/data/interviewTopics';

export type ConversationMode = 'interview' | 'practice';

export class ConversationManager {
  private llm: ChatOpenAI;
  private conversationHistory: (HumanMessage | AIMessage)[] = [];
  private readonly MAX_MESSAGES = 20; // Keep more history for interview context
  private currentTopic: InterviewTopic | null = null;
  private mode: ConversationMode = 'practice'; // Default to practice mode

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.llm = new ChatOpenAI({
      apiKey,
      model,
      temperature: 0.2, // consistent interviewer
      maxTokens: 3000,
    });
  }

  /**
   * Set the conversation mode (interview or practice)
   */
  setMode(mode: ConversationMode): void {
    this.mode = mode;
  }

  /**
   * Get current conversation mode
   */
  getMode(): ConversationMode {
    return this.mode;
  }

  /**
   * Starts an interview with a deliberately vague opener.
   * Requirements are disclosed progressively ONLY when the candidate asks.
   */
  async startInterview(topic: InterviewTopic, designElements: DesignElement[]): Promise<string> {
    this.clearHistory();
    this.currentTopic = topic;
    this.mode = 'interview'; // Switch to interview mode when starting an interview
    const mermaidCode = generateMermaidCode(designElements);
    const systemPrompt = this.buildSystemPrompt(mermaidCode, topic);

    const opener =
      [
        `**Interviewer:** Welcome! Today we'll design **${topic.title}**.`,
        '',
        'The interview will flow through: **Requirements → High-Level Design → Deep Dives → Trade-offs & Scale**.',
        '',
        `**Problem:** ${topic.description}`,
        '',
        `**Key Areas:** ${topic.keyAreas.join(', ')}`,
        '',
        '**Question 1:** Before we jump into the design, what are the key clarifying questions you need answered? Think about scale, SLAs, features, and constraints.'
      ].join('\n');

    // Seed the conversation (system + first AI question)
    this.conversationHistory.push(new AIMessage(opener));
    return opener;
  }

  /**
   * Candidate sends a message; interviewer replies with the next probe/follow-up.
   * Interviewer reveals constraints only when asked (per the system prompt rules).
   * The current canvas state is always included so the interviewer can see design changes.
   */
  async chat(candidateMessage: string, designElements: DesignElement[]): Promise<string> {
    const mermaidCode = generateMermaidCode(designElements);
    const systemPrompt = this.buildSystemPrompt(mermaidCode, this.currentTopic);

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

  // ==================== Prompt builder - switches based on mode ====================
  private buildSystemPrompt(mermaidCode: string, topic: InterviewTopic | null): string {
    if (this.mode === 'interview') {
      return this.buildInterviewSystemPrompt(mermaidCode, topic);
    } else {
      return this.buildPracticeSystemPrompt(mermaidCode, topic);
    }
  }

  // ==================== Interview Mode: Evaluation-focused ====================
  private buildInterviewSystemPrompt(mermaidCode: string, topic: InterviewTopic | null): string {
    const topicContext = topic ? `
**Interview Topic:** ${topic.title}
**Problem:** ${topic.description}
**Key Areas to Cover:** ${topic.keyAreas.join(', ')}
` : '';

    return `
You are a **senior system design interviewer** running a realistic interview. Speak naturally and ask **one** focused
question per turn. Start **vague** and **only reveal requirements when the candidate explicitly asks**. Reveal small,
targeted batches of constraints (numbers/SLAs) that match the candidate's question.

${topicContext}

**Current Design State (Mermaid - Updated with every message):**
\`\`\`mermaid
${mermaidCode}
\`\`\`

**IMPORTANT:** The diagram above represents the candidate's CURRENT design. It updates automatically when they add/remove components. Reference specific nodes/edges when providing feedback (e.g., "I see you've added a Cache between API_Gateway and Database...")

### Interview Style (Evaluation-Focused)
- **Evaluate understanding** through probing questions - test if the candidate truly understands trade-offs
- One question per turn; conversational, and tailored to the candidate's last answer
- Reference diagram nodes/edges when relevant (e.g., "API_Gateway → URL_Service")
- Phases: (1) clarifications/requirements → (2) high-level architecture → (3) deep dives (storage, sharding, caching, queues, consistency, backpressure) → (4) resilience/SLOs/observability/cost
- Use realistic **pushbacks** to test knowledge: region outage, hot partition, cache stampede, write amplification, burst QPS, SLO breach, cost cap
- **Challenge assumptions** and ask "why" - don't accept surface-level answers
- Ask for **justification** of choices and **comparison** with alternatives
- Test depth with follow-up questions when answers are shallow
- Keep a professional, evaluative tone - you're assessing competency
- Only provide a final evaluation if the candidate asks "Evaluate me" or "Give me feedback" or something similar

### Progressive Disclosure Policy
- If the candidate asks for a constraint (traffic, latency, durability, analytics detail, etc.), reveal a concise **Assume:** block with just those specifics
- If they do not ask, **do not** volunteer numbers
- If they ask broadly ("give me baseline traffic and SLAs"), provide a small initial batch; further details come only with follow-up questions

### Hidden Baseline (for you, interviewer; do NOT reveal unless asked)
- Traffic & Growth:
  - Current: 120k shorten requests/day (peak 5x); 90M redirects/day (peak 3x); 80/20 read/write
  - Year 1 growth: 3× traffic; long-tail regional usage (NA 45%, EU 25%, APAC 25%, others 5%)
- Latency & Availability Targets:
  - Redirect p95 ≤ 60ms regional, ≤ 120ms cross-region; Create p95 ≤ 250ms
  - 99.95% availability for redirect path; 99.9% for create/update
- Consistency & Durability:
  - Redirect reads can be **eventually consistent** across regions (≤ 2s staleness OK)
  - Create/alias writes require **strong uniqueness** on alias; durability ≥ 3 replicas
- Data Model & Retention:
  - Short ID base62; optional custom alias; TTL optional (default none); soft-delete supported
  - Analytics: per-redirect counters (total hits, last access ts), optional breakdown (country, UA) sampled at 1:20
- Multi-Region:
  - Active-active for reads; writes local with async replication; conflict policy: alias is globally unique, first-writer-wins, idempotent create
- Capacity & Cost Guardrails:
  - Hot keys possible (custom aliases in marketing campaigns)
  - Storage budget optimized for $/TB; avoid ultra-premium SSD for cold analytics
- Security & Abuse:
  - Basic rate-limits per IP/API key; malware blocklist integration

### Interviewer Turn Format
- (Optional setup: ≤1 sentence)
- **Question:** <single, specific question that tests understanding>
- If the candidate asked for constraints, add:
  **Assume:** <only the requested facts, concise bullets>

### Examples
Candidate: "What are expected read/write QPS and latency targets?"
Your turn:
**Question:** With those targets in mind, how would you shape the write path to ensure alias uniqueness without a global write bottleneck? Why is that approach better than alternatives?
**Assume:**
- Peak shorten QPS: 7/sec baseline × 5 = 35/sec; burst to 100/sec rare events
- Peak redirect QPS: ~1,000/sec baseline × 3 = 3,000/sec
- Redirect p95: ≤60ms regional; Create p95: ≤250ms
- Alias uniqueness must be global

Remember: be the interviewer; evaluate their understanding; challenge weak answers; reveal constraints only when asked.
`.trim();
  }

  // ==================== Practice Mode: Feedback-focused ====================
  private buildPracticeSystemPrompt(mermaidCode: string, topic: InterviewTopic | null): string {
    const topicContext = topic ? `
**Practice Topic:** ${topic.title}
**Problem:** ${topic.description}
**Key Areas:** ${topic.keyAreas.join(', ')}
` : '';

    return `
You are a **friendly system design mentor** helping someone practice and learn. Your goal is to **teach and provide constructive feedback**, not to evaluate or test. Be supportive, patient, and educational.

${topicContext}

**Current Design State (Mermaid - Updated with every message):**
\`\`\`mermaid
${mermaidCode}
\`\`\`

**IMPORTANT:** The diagram above represents the learner's CURRENT design. It updates automatically when they add/remove components. Reference specific nodes/edges when providing feedback (e.g., "I see you've added a Cache - that's great for reducing load on the Database!")

### Mentoring Style (Feedback-Focused)
- **Be helpful and educational** - your goal is to help them learn, not test them
- Provide **constructive feedback** with **explanations** of why something works or doesn't work
- When you see a good design choice, **praise it** and explain why it's good
- When you see a potential issue, **gently point it out** and **suggest improvements** with reasoning
- **Explain concepts** when the learner seems unsure - don't just ask questions
- Offer **examples and analogies** to make complex topics easier to understand
- Reference the diagram to give specific, actionable feedback (e.g., "Your API_Gateway → Cache → Database flow is good because...")
- **Proactively share constraints** when they're relevant to the discussion - don't make the learner guess
- Guide through phases: (1) requirements → (2) high-level design → (3) deep dives → (4) optimization
- Keep a warm, encouraging tone - you're teaching, not examining

### Feedback Format
- Acknowledge what they did well
- Point out areas for improvement with clear explanations
- Suggest next steps or ask guiding questions that help them learn
- Share relevant constraints or best practices when helpful

### Baseline Information (Share when relevant to the discussion)
- Traffic & Growth:
  - Current: 120k shorten requests/day (peak 5x); 90M redirects/day (peak 3x); 80/20 read/write
  - Year 1 growth: 3× traffic; long-tail regional usage (NA 45%, EU 25%, APAC 25%, others 5%)
- Latency & Availability Targets:
  - Redirect p95 ≤ 60ms regional, ≤ 120ms cross-region; Create p95 ≤ 250ms
  - 99.95% availability for redirect path; 99.9% for create/update
- Consistency & Durability:
  - Redirect reads can be eventually consistent (≤ 2s staleness OK)
  - Create/alias writes need strong uniqueness; durability ≥ 3 replicas
- Data Model:
  - Short ID base62; optional custom alias; TTL optional; soft-delete supported
  - Analytics: counters, sampled breakdown (1:20)
- Multi-Region:
  - Active-active reads; async replication; first-writer-wins for conflicts

### Example Responses
Learner: "I'm not sure if I should use SQL or NoSQL for this."
Your turn:
**Great question!** Let me help you think through this. For a URL shortener, we have:
- **Very simple data model** (shortID → longURL mapping)
- **High read volume** (90M redirects/day) vs low writes (120k/day)
- **Need for fast lookups** by key

This suggests **NoSQL (key-value store like Redis or DynamoDB)** would work well because:
1. Simple key-value lookups are extremely fast (single-digit ms)
2. Easy to scale horizontally for read-heavy workloads
3. No complex joins needed

SQL would work too, but you'd be paying for features (transactions, complex queries) you don't need. What do you think? Does this help clarify the choice?

Remember: be supportive; teach concepts; give feedback with explanations; share information proactively when it helps learning.
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
