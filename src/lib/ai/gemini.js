import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let lastCallTime = 0;
const MIN_GAP_MS = 2000; // 2.0 seconds rate limit gap

/**
 * Sleeps for a specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enforces rate limiting by waiting if necessary before the next call
 * @returns {Promise<void>}
 */
async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < MIN_GAP_MS) {
    await sleep(MIN_GAP_MS - timeSinceLastCall);
  }
  lastCallTime = Date.now();
}

/**
 * Initializes and returns the Gemini model instance (lazy load)
 * @param {string} [systemInstruction] - Optional system instructions
 * @returns {import('@google/generative-ai').GenerativeModel}
 */
export function getModel(systemInstruction = undefined) {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Gemini API calls will fail.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  
  const modelConfig = {
    model: 'gemini-2.0-flash',
  };
  
  if (systemInstruction) {
    modelConfig.systemInstruction = systemInstruction;
  }
  
  return genAI.getGenerativeModel(modelConfig);
}

/**
 * Calls Gemini API with retry logic and exponential backoff
 * @param {Function} apiCall - Function that makes the actual API call
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>}
 */
async function withRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await enforceRateLimit();
      return await apiCall();
    } catch (error) {
      console.error(`Gemini API call failed (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff: 2s, 4s, etc.
      const backoffMs = Math.pow(2, attempt) * 1000;
      await sleep(backoffMs);
    }
  }
}

/**
 * Generates JSON response from Gemini
 * @param {string} prompt - The user prompt
 * @param {string} [systemInstruction] - Optional system instructions
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function generateJSON(prompt, systemInstruction) {
  return withRetry(async () => {
    const model = getModel(systemInstruction);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });
    const text = result.response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', text);
      throw new Error('Invalid JSON response from Gemini');
    }
  });
}

/**
 * Generates plain text response from Gemini
 * @param {string} prompt - The user prompt
 * @param {string} [systemInstruction] - Optional system instructions
 * @returns {Promise<string>} - Text response
 */
export async function generateText(prompt, systemInstruction) {
  return withRetry(async () => {
    const model = getModel(systemInstruction);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return result.response.text();
  });
}
