import { AIProvider, AIModelOption, CandidateProfile, JobDetails } from '../../types';

export const AI_MODELS: Record<AIProvider, AIModelOption[]> = {
  gemini: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Recommended - Free Tier)', description: 'Fast, high quality, generous free tier' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Deep reasoning for complex questions' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Next-generation low-latency model' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o mini (Recommended)', description: 'Fast, cost-efficient, great for form filling' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'OpenAI flagship model' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High context window' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Top-tier natural writing quality' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast and responsive' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Extremely fast inference on Groq LPU' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Fast open-source mixture of experts' },
  ],
};

export const AI_KEY_LINKS: Record<AIProvider, { url: string; label: string }> = {
  gemini: {
    url: 'https://aistudio.google.com/app/apikey',
    label: 'Get free Gemini API Key (Google AI Studio)',
  },
  openai: {
    url: 'https://platform.openai.com/api-keys',
    label: 'Get OpenAI API Key',
  },
  anthropic: {
    url: 'https://console.anthropic.com/settings/keys',
    label: 'Get Anthropic Claude API Key',
  },
  groq: {
    url: 'https://console.groq.com/keys',
    label: 'Get free Groq API Key',
  },
};

/**
 * Execute AI text generation across Gemini, OpenAI, Claude, and Groq
 */
export async function executeAIRequest(
  provider: AIProvider,
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('API Key is missing. Please configure your AI Key in Settings.');
  }

  // 1. Google Gemini
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API error (${res.status})`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  // 2. OpenAI & Groq (OpenAI-compatible)
  if (provider === 'openai' || provider === 'groq') {
    const endpoint =
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `${provider.toUpperCase()} API error (${res.status})`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  // 3. Anthropic Claude
  if (provider === 'anthropic') {
    const endpoint = 'https://api.anthropic.com/v1/messages';
    const body: any = {
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    };
    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Claude API error (${res.status})`);
    }

    const data = await res.json();
    return data.content?.[0]?.text?.trim() || '';
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

/**
 * Quick connection test to verify API key and model selection
 */
export async function testAIConnection(
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string }> {
  try {
    const reply = await executeAIRequest(
      provider,
      apiKey,
      model,
      'Reply with single word: "Connected"',
      'You are a testing assistant. Keep response to one word.'
    );

    if (reply) {
      return {
        success: true,
        message: `Successfully connected to ${model}!`,
      };
    }
    return {
      success: false,
      message: 'Received empty response from AI model.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Connection failed. Please check your API key.',
    };
  }
}

/**
 * Generate customized answer for open-ended ATS questions based on candidate profile and job details
 */
export async function generateAnswerForATSQuestion(
  question: string,
  job: JobDetails,
  profile: CandidateProfile,
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<string> {
  const systemPrompt = `You are an expert career agent and application assistant. 
Draft a professional, compelling, and concise answer to the job application question based on the candidate's profile.
Do NOT use clichés. Speak in first person as the candidate. Keep it between 2 to 4 sentences unless specifically asked for more.`;

  const prompt = `Candidate Details:
Name: ${profile.firstName} ${profile.lastName}
Location: ${profile.location}
LinkedIn: ${profile.linkedinUrl}
GitHub: ${profile.githubUrl}
Portfolio: ${profile.portfolioUrl}
Work Authorization: ${profile.workAuthorization}

Target Job:
Role: ${job.title}
Company: ${job.company}
Location: ${job.location}

Application Question:
"${question}"

Your drafted response:`;

  return await executeAIRequest(provider, apiKey, model, prompt, systemPrompt);
}
