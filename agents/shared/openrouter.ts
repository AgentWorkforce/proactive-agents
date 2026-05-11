/**
 * Thin OpenRouter wrapper. OpenRouter speaks the OpenAI chat-completions
 * API, so this is a single fetch with no SDK dependency — keeps the bundle
 * tiny on Cloudflare Workers.
 *
 * Model choice is centralised here. Cheap-and-good default for clustering
 * and structured-output tasks; swap one constant if it ever needs upgrading.
 */

export const DEFAULT_MODEL = "google/gemini-2.5-flash";

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

export type CompletionOptions = {
  apiKey: string;
  model?: string;
  messages: ChatMessage[];
  /** Force JSON output. Most modern models honour this. */
  jsonMode?: boolean;
  /** 0–2. Default 0.2 for analytical tasks. */
  temperature?: number;
  signal?: AbortSignal;
};

export async function complete(opts: CompletionOptions): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      // Optional but nice — OpenRouter shows it in their dashboard
      "HTTP-Referer": "https://proactiveagents.dev",
      "X-Title": "Proactive Agents",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new Error(`openrouter ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message: string };
  };
  if (data.error) throw new Error(`openrouter: ${data.error.message}`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("openrouter: empty response");
  return text;
}

/** Convenience: prompt the model for a JSON object, parse, validate shape. */
export async function completeJson<T = unknown>(
  opts: Omit<CompletionOptions, "jsonMode">,
): Promise<T> {
  const text = await complete({ ...opts, jsonMode: true });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`openrouter returned non-JSON despite jsonMode: ${text.slice(0, 200)}`);
  }
}
