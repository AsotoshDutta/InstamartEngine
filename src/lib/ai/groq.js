import Groq from 'groq-sdk';

let groqClient = null;

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Initializes and returns the Groq client (lazy initialization)
 */
export function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('[Groq AI] GROQ_API_KEY is not set. Will fall back to Gemini if available.');
    }
    groqClient = new Groq({ apiKey: apiKey || '' });
  }
  return groqClient;
}

/**
 * Generates JSON response from Groq using Llama-3.3-70b-versatile
 * @param {string} prompt - User prompt
 * @param {string} [systemInstruction] - System instructions
 * @param {string} [model='llama-3.3-70b-versatile'] - Model name
 * @returns {Promise<any>} Parsed JSON response
 */
export async function generateJSONWithGroq(prompt, systemInstruction, model = 'llama-3.3-70b-versatile') {
  try {
    const client = getGroqClient();
    const messages = [];

    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
      messages,
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(content);
      // If wrapper object has an array inside (e.g. { data: [...] } or { items: [...] }), unwrap if needed
      return parsed.items || parsed.data || parsed.themes || parsed.insights || parsed.classified || parsed;
    } catch (parseError) {
      console.error('[Groq AI] JSON parse error:', parseError, 'Content:', content);
      throw new Error('Invalid JSON response from Groq model');
    }
  } catch (error) {
    console.error(`[Groq AI] Error with model ${model}:`, error.message);
    throw error;
  }
}
