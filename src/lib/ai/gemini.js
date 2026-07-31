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
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.0-flash-lite'];

/**
 * Initializes and returns the Gemini model instance (lazy load)
 * @param {string} [systemInstruction] - Optional system instructions
 * @param {string} [modelName='gemini-3.6-flash'] - Model name to use
 * @returns {import('@google/generative-ai').GenerativeModel}
 */
export function getModel(systemInstruction = undefined, modelName = 'gemini-3.6-flash') {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Gemini API calls will fail.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  
  const modelConfig = {
    model: modelName,
  };
  
  if (systemInstruction) {
    modelConfig.systemInstruction = systemInstruction;
  }
  
  return genAI.getGenerativeModel(modelConfig);
}

/**
 * Calls Gemini API with model fallbacks and exponential backoff retry logic.
 * @param {Function} apiCallFactory - Function receiving (modelName) and returning API call Promise
 * @returns {Promise<any>}
 */
async function withModelFallback(apiCallFactory) {
  let lastErr = null;

  for (const modelName of FALLBACK_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await enforceRateLimit();
        return await apiCallFactory(modelName);
      } catch (error) {
        lastErr = error;
        console.warn(`[Gemini API] Call with ${modelName} failed (attempt ${attempt}/2): ${error.message}`);
        await sleep(1500 * attempt);
      }
    }
  }

  throw lastErr || new Error('All Gemini model fallbacks failed.');
}

/**
 * Generates JSON response from Gemini
 * @param {string} prompt - The user prompt
 * @param {string} [systemInstruction] - Optional system instructions
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function generateJSON(prompt, systemInstruction) {
  return withModelFallback(async (modelName) => {
    const model = getModel(systemInstruction, modelName);
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
  return withModelFallback(async (modelName) => {
    const model = getModel(systemInstruction, modelName);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return result.response.text();
  });
}
