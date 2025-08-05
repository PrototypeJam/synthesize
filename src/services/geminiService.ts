import { GoogleGenerativeAI } from "@google/genai";
import { SUMMARY_PROMPT, SYNTHESIS_PROMPT } from '../constants';

const API_KEY_STORAGE_ID = 'gemini-api-key';
let ai: GoogleGenerativeAI | null = null;

export function initializeAi(apiKey: string) {
  if (!apiKey) {
    throw new Error("API key is required to initialize the AI service.");
  }
  // CORRECT: Using the proper GoogleGenerativeAI constructor
  ai = new GoogleGenerativeAI(apiKey);
  localStorage.setItem(API_KEY_STORAGE_ID, apiKey);
}

export function getApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_ID);
}

export function clearApiKey(): void {
    localStorage.removeItem(API_KEY_STORAGE_ID);
    ai = null;
}

function getAiInstance(): GoogleGenerativeAI {
    if (!ai) {
        throw new Error("AI Service not initialized. Please set your API key.");
    }
    return ai;
}

export async function fetchUrlContent(url: string): Promise<string> {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        const html = await response.text();
        
        // Strip HTML tags to reduce tokens and improve summary quality
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const text = doc.body.textContent || doc.body.innerText || html;
        
        return text.trim();
    } catch (error) {
        console.error("Error fetching URL content:", error);
        throw new Error(`Could not fetch content from ${url}. Try using "Paste Text" instead.`);
    }
}

export async function getSummary(content: string): Promise<string> {
    const aiInstance = getAiInstance();
    // CORRECT: No "models/" prefix needed for the model name
    const model = aiInstance.getGenerativeModel({ model: "gemini-2.5-flash" });
    try {
        // CORRECT: The SDK expects a simple string for this kind of prompt
        const result = await model.generateContent(
            `${SUMMARY_PROMPT}\n\nCONTENT:\n${content}`
        );
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error("Error in getSummary:", error);
        // Better error handling for the user
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            throw new Error("Model 'gemini-2.5-flash' not found. Try 'gemini-1.5-flash' if you don't have access to 2.5 yet.");
        }
        throw new Error("Failed to generate summary. Please check your API key and try again.");
    }
}

export async function getSynthesis(content1: string, content2: string): Promise<string> {
    const aiInstance = getAiInstance();
    const model = aiInstance.getGenerativeModel({ model: "gemini-2.5-flash" });
    const combinedContent = `Content 1:\n${content1}\n\n---\n\nContent 2:\n${content2}`;
    try {
        const result = await model.generateContent(
            `${SYNTHESIS_PROMPT}\n\n${combinedContent}`
        );
        const response = result.response;
        return response.text();
    } catch (error: any) {
        console.error("Error in getSynthesis:", error);
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            throw new Error("Model 'gemini-2.5-flash' not found. Try 'gemini-1.5-flash' if you don't have access to 2.5 yet.");
        }
        throw new Error("Failed to generate synthesis. Please check your API key and try again.");
    }
}
