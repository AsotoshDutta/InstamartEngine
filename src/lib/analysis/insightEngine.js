import { generateJSON } from '../ai/gemini.js';
import { INSIGHTS_SYSTEM_PROMPT, buildInsightsUserPrompt } from '../ai/prompts/insights.js';
import { insertInsights } from '../db/supabase.js';

/**
 * Generates insights from a list of themes and stores them in the database.
 * @param {Array<Object>} themes - Array of theme objects.
 * @returns {Promise<{insights: Array<Object>, count: number}>}
 */
export async function generateInsights(themes) {
  try {
    if (!themes || themes.length === 0) {
      console.log('No themes provided for insight generation.');
      return { insights: [], count: 0 };
    }

    const userPrompt = buildInsightsUserPrompt(themes);

    // Call Gemini to generate insights as JSON
    const insights = await generateJSON(userPrompt, INSIGHTS_SYSTEM_PROMPT);

    if (!insights || !Array.isArray(insights)) {
      throw new Error('Invalid response from Gemini: Expected an array of insights.');
    }

    // Insert generated insights into Supabase
    const insertedInsights = await insertInsights(insights);

    return {
      insights: insertedInsights,
      count: insertedInsights?.length || 0,
    };
  } catch (error) {
    console.error('Error in generateInsights:', error);
    throw new Error(`Insight generation failed: ${error.message}`);
  }
}
