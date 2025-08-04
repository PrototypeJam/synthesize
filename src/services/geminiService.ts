import { GoogleGenAI } from "@google/genai";
import { SUMMARY_PROMPT, SYNTHESIS_PROMPT } from '../constants';

const API_KEY_STORAGE_ID = 'gemini-api-key';
let ai: GoogleGenAI | null = null;

export function initializeAi(apiKey: string) {
  if (!apiKey) {
    throw new Error("API key is required to initialize the AI service.");
  }
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

function getAiInstance(): GoogleGenAI {
    if (!ai) {
        throw new Error("AI Service not initialized. Please set your API key.");
    }
    return ai;
}

async function fetchUrlContent(url: string): Promise<string> {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Error fetching URL content:", error);
        throw new Error(`Could not fetch content from ${url}. The server may be down or blocking requests.`);
    }
}

export async function getSummary(content: string): Promise<string> {
    const aiInstance = getAiInstance();
    try {
        const result = await aiInstance.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${SUMMARY_PROMPT}\n\nCONTENT:\n${content}`
        });
        return result.text;
    } catch (error) {
        console.error("Error in getSummary:", error);
        throw new Error("Failed to generate summary from the AI model.");
    }
}

export async function getSynthesis(content1: string, content2: string): Promise<string> {
    const aiInstance = getAiInstance();
    const combinedContent = `Content 1:\n${content1}\n\n---\n\nContent 2:\n${content2}`;
    try {
        const result = await aiInstance.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${SYNTHESIS_PROMPT}\n\n${combinedContent}`
        });
        return result.text;
    } catch (error) {
        console.error("Error in getSynthesis:", error);
        throw new Error("Failed to generate synthesis from the AI model.");
    }
}

export { fetchUrlContent };