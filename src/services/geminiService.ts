import { GoogleGenAI } from "@google/genai";
import { SUMMARY_PROMPT, SYNTHESIS_PROMPT } from '../constants';
import type { ModelId } from '../types';

// ======= CONFIG PLACEHOLDER =======
// IMPORTANT: set this to your deployed Worker base URL (no trailing slash).
// Example: "https://synthi-proxy.yourname.workers.dev"
const WORKER_BASE = "https://synthi-proxy.dazza.workers.dev";
// =================================

const API_KEY_STORAGE_ID = 'gemini-api-key';
const MODEL_STORAGE_ID = 'synthi-model';
let ai: GoogleGenAI | null = null;

export function initializeAi(apiKey: string) {
  if (!apiKey) throw new Error("API key is required to initialize the AI service.");
  ai = new GoogleGenAI({ apiKey });
  localStorage.setItem(API_KEY_STORAGE_ID, apiKey);
}

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_ID);
}
export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_ID);
  ai = null;
}
export function getAi(): GoogleGenAI {
  if (!ai) throw new Error("AI Service not initialized. Please set your API key.");
  return ai;
}

// Model persistence
export function saveModel(m: ModelId) {
  localStorage.setItem(MODEL_STORAGE_ID, m);
}
export function loadModel(): ModelId | null {
  const v = localStorage.getItem(MODEL_STORAGE_ID);
  if (v === 'gemini-2.5-pro' || v === 'gemini-2.5-flash' || v === 'gemini-2.5-flash-lite') return v;
  return null;
}

// ---- Cloudflare Worker fetch ----
export async function fetchUrlContent(url: string): Promise<string> {
  if (!WORKER_BASE || WORKER_BASE === 'YOUR_WORKER_URL_HERE') {
    throw new Error('Worker URL not configured. Set WORKER_BASE in geminiService.ts.');
  }
  const endpoint = `${WORKER_BASE}?url=${encodeURIComponent(url)}`;
  let res: Response;
  try {
    res = await fetch(endpoint, { method: 'GET' });
  } catch (e) {
    throw new Error(`Network error reaching content proxy. Try “Paste Text”.`);
  }
  if (!res.ok) {
    try {
      const j = await res.json();
      const msg = j?.error?.message || `Proxy error ${res.status}`;
      throw new Error(mapProxyError(res.status, msg));
    } catch {
      throw new Error(`Proxy error ${res.status}. Try “Paste Text”.`);
    }
  }
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  // Simple extraction; can be upgraded to Readability if needed.
  const text = doc.body?.textContent || doc.body?.innerText || html;
  const t = (text || '').trim();
  if (!t) throw new Error('PARSING_FAILED');
  return t;
}

function mapProxyError(status: number, msg: string): string {
  if (status === 403) return `403 from target site. Click “Open Original” or try again later.`;
  if (status === 404) return `404 from target site. Check the URL or use “Paste Text”.`;
  if (status === 400) return `Bad request to proxy: ${msg}`;
  if (status === 502) return `Upstream failed to respond. Retry or use “Paste Text”.`;
  return `Proxy error (${status}). ${msg}`;
}

// ---- Streaming generation ----
// Docs: generateContentStream returns async chunks; chunk.text contains streamed text. :contentReference[oaicite:14]{index=14}
export async function streamSummary(
  content: string,
  model: ModelId,
  onUpdate: (partial: string) => void
): Promise<string> {
  const gen = await getAi().models.generateContentStream({
    model,
    contents: `${SUMMARY_PROMPT}\n\nCONTENT:\n${content}`
  });
  let full = '';
  for await (const chunk of gen) {
    const t = (chunk as any)?.text || '';
    if (t) {
      full += t;
      onUpdate(full);
    }
  }
  return full;
}

export async function streamSynthesis(
  content1: string,
  content2: string,
  model: ModelId,
  onUpdate: (partial: string) => void
): Promise<string> {
  const combined = `Content 1:\n${content1}\n\n---\n\nContent 2:\n${content2}`;
  const gen = await getAi().models.generateContentStream({
    model,
    contents: `${SYNTHESIS_PROMPT}\n\n${combined}`
  });
  let full = '';
  for await (const chunk of gen) {
    const t = (chunk as any)?.text || '';
    if (t) {
      full += t;
      onUpdate(full);
    }
  }
  return full;
}

// ---- HN resolver (Firebase API) ----
export async function resolveHN(hnUrl: string): Promise<{ id?: string; title?: string; articleUrl?: string }> {
  const m = hnUrl.match(/news\.ycombinator\.com\/item\?id=(\d+)/);
  if (!m) return {};
  const id = m[1];
  const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
  if (!r.ok) return { id };
  const data = await r.json();
  return { id, title: data?.title, articleUrl: data?.url };
}

// ---- Markdown export with YAML frontmatter ----
export function buildMarkdown(params: {
  title: string;
  sections: Array<{ heading: string; body: string }>;
  model: ModelId;
  url1?: string;
  url2?: string;
  workerBase?: string;
  hnThreadUrl?: string;
  hnTitle?: string;
}) {
  const now = new Date().toISOString();
  const frontmatter = [
    '---',
    `app: Synthi`,
    `created: ${now}`,
    `model: ${params.model}`,
    params.url1 ? `source1: ${params.url1}` : null,
    params.url2 ? `source2: ${params.url2}` : null,
    params.hnThreadUrl ? `hn_thread: ${params.hnThreadUrl}` : null,
    params.hnTitle ? `hn_title: ${params.hnTitle}` : null,
    params.workerBase ? `fetch_proxy: ${params.workerBase}` : null,
    '---',
    ''
  ].filter(Boolean).join('\n');
  const body = [
    `# ${params.title}`,
    '',
    ...params.sections.flatMap(s => [`## ${s.heading}`, '', s.body, ''])
  ].join('\n');
  return frontmatter + body;
}