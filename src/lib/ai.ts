/**
 * Worm AI Layer — OpenRouter Integration
 *
 * Uses OpenRouter to provide AI-powered analysis on decentralized feedback.
 * Model: google/gemini-2.0-flash-thinking-exp (fast & free tier available)
 *
 * API Key: stored in localStorage as 'worm_openrouter_key' (set in Settings page)
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export type AIInsight = {
  type: 'consensus' | 'priority' | 'sentiment' | 'cluster';
  title: string;
  summary: string;
  details: string[];
  score?: number; // 0-100
};

export type AIAnalysisResult = {
  consensusPoints: string[];
  sentimentScore: number; // -1 to 1
  prioritizedIssues: { issue: string; frequency: number; severity: 'low' | 'medium' | 'high' }[];
  suggestedActions: string[];
  clusters: { label: string; items: string[] }[];
  rawSummary: string;
};

function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('worm_openrouter_key');
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function saveApiKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('worm_openrouter_key', key);
  }
}

async function openRouterChat(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('OpenRouter API key not set. Go to Settings → AI to configure.');

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://worm.app',
      'X-Title': 'Worm Decentralized Feedback',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Analyze a batch of form submissions and return AI insights.
 */
export async function analyzeSubmissions(
  formTitle: string,
  submissions: Array<Record<string, unknown>>
): Promise<AIAnalysisResult> {
  const systemPrompt = `You are an expert feedback analyst for a decentralized feedback platform called Worm.
Analyze the provided form submissions and return a JSON response with this exact structure:
{
  "consensusPoints": ["string array of key recurring themes"],
  "sentimentScore": 0.0,
  "prioritizedIssues": [{"issue": "string", "frequency": 1, "severity": "low|medium|high"}],
  "suggestedActions": ["actionable recommendations"],
  "clusters": [{"label": "cluster name", "items": ["related feedback items"]}],
  "rawSummary": "A 2-3 sentence executive summary"
}
Return ONLY valid JSON. No markdown, no explanation.`;

  const submissionText = submissions
    .slice(0, 50) // limit to 50 for token efficiency
    .map((s, i) => `Submission ${i + 1}: ${JSON.stringify(s)}`)
    .join('\n');

  const userMessage = `Form Title: "${formTitle}"\nTotal Submissions: ${submissions.length}\n\nSubmissions:\n${submissionText}`;

  const raw = await openRouterChat(systemPrompt, userMessage);

  try {
    // Strip markdown code blocks if present
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean) as AIAnalysisResult;
  } catch {
    // Fallback minimal result
    return {
      consensusPoints: ['Unable to parse AI response'],
      sentimentScore: 0,
      prioritizedIssues: [],
      suggestedActions: [raw.slice(0, 200)],
      clusters: [],
      rawSummary: raw.slice(0, 500),
    };
  }
}

/**
 * Score a single submission for priority (impact + urgency).
 */
export async function scoreSubmission(
  submission: Record<string, unknown>
): Promise<{ score: number; reason: string; tags: string[] }> {
  const systemPrompt = `You are a triage assistant. Score the following feedback submission from 0-100 where:
- 0-30: Low priority (general comments, positive feedback)
- 31-60: Medium priority (minor issues, suggestions)
- 61-100: High priority (bugs, blockers, critical issues)
Return JSON only: {"score": number, "reason": "one sentence", "tags": ["tag1","tag2"]}`;

  const raw = await openRouterChat(systemPrompt, JSON.stringify(submission));

  try {
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean);
  } catch {
    return { score: 50, reason: 'Could not parse AI score', tags: [] };
  }
}

/**
 * Generate AI-powered follow-up question for a partial submission.
 */
export async function generateFollowUp(
  formTitle: string,
  partialAnswers: Record<string, unknown>
): Promise<string> {
  const systemPrompt = `You are an empathetic feedback collection assistant for "${formTitle}".
Based on the user's partial responses, generate ONE concise, relevant follow-up question (max 20 words).
Return only the question text, no quotes, no explanation.`;

  return openRouterChat(systemPrompt, JSON.stringify(partialAnswers));
}

/**
 * Detect duplicate / similar submissions.
 */
export async function detectDuplicates(
  submissions: Array<Record<string, unknown>>
): Promise<{ groups: Array<{ indices: number[]; similarity: string }> }> {
  const systemPrompt = `Analyze these submissions and identify groups of highly similar or duplicate responses.
Return JSON: {"groups": [{"indices": [0,1,2], "similarity": "brief explanation"}]}
Only include groups with 2+ similar items. Return empty groups array if no duplicates found.`;

  const raw = await openRouterChat(systemPrompt, JSON.stringify(submissions.slice(0, 30)));

  try {
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean);
  } catch {
    return { groups: [] };
  }
}
