/**
 * Theme Extraction Orchestrator
 * Ties together preprocessing, AI classification, clustering, and storage.
 */

import { getUnprocessedFeedback, markAsProcessed, insertThemes, supabase } from '../db/supabase.js';
import { preprocessFeedback } from './preprocess.js';
import { processFeedbackInBatches } from '../ai/batchProcessor.js';
import { generateJSON } from '../ai/gemini.js';
import { SUMMARIZE_SYSTEM_PROMPT, buildSummarizeUserPrompt } from '../ai/prompts/summarize.js';
import { generateInsights } from './insightEngine.js';
import { calculateConfidenceScore, scoreAllInsights } from '../validation/confidenceScorer.js';
import { applyGuardrails } from '../validation/guardrails.js';
import { checkCrossSourceCorroboration } from '../validation/crossSourceCheck.js';

/**
 * Runs the full theme extraction pipeline.
 * @param {Object} options - Configuration options
 * @param {number} [options.limit=500] - Max feedback items to process
 * @returns {Promise<Object>} Results: { classified_count, themes_count, themes, summary, errors }
 */
export async function runThemeExtraction(options = {}) {
  const limit = options.limit || 500;
  const startTime = Date.now();

  const results = {
    classified_count: 0,
    themes_count: 0,
    themes: [],
    summary: null,
    insights_count: 0,
    insights: [],
    validated: false,
    errors: []
  };

  try {
    // ── Step 1: Fetch unprocessed feedback ──────────────────────────
    console.log(`[ThemeEngine] Step 1: Fetching up to ${limit} unprocessed feedback...`);
    const rawFeedback = await getUnprocessedFeedback(limit);

    if (!rawFeedback || rawFeedback.length === 0) {
      console.log('[ThemeEngine] No unprocessed feedback found. Exiting.');
      return results;
    }
    console.log(`[ThemeEngine] Fetched ${rawFeedback.length} unprocessed items.`);

    // ── Step 2: Preprocess — filter spam, clean text ────────────────
    console.log(`[ThemeEngine] Step 2: Preprocessing ${rawFeedback.length} feedback items...`);
    const cleanedFeedback = preprocessFeedback(rawFeedback);
    console.log(`[ThemeEngine] Preprocessing complete. Retained ${cleanedFeedback.length} valid items.`);

    if (cleanedFeedback.length === 0) {
      console.log('[ThemeEngine] All items were filtered as spam/noise. Marking as processed...');
      const ids = rawFeedback.map(f => f.id);
      await markAsProcessed(ids);
      return results;
    }

    // ── Step 3: Classify + Cluster via AI ───────────────────────────
    console.log(`[ThemeEngine] Step 3: Processing feedback in batches (classify + cluster)...`);
    const { classified, themes } = await processFeedbackInBatches(cleanedFeedback);

    results.classified_count = classified.length;
    results.themes_count = themes.length;
    results.themes = themes;

    // ── Step 4: Update classified feedback in Supabase ──────────────
    if (classified.length > 0) {
      console.log(`[ThemeEngine] Step 4: Updating ${classified.length} classified feedback rows in parallel...`);

      const UPDATE_CHUNK = 25;
      for (let i = 0; i < classified.length; i += UPDATE_CHUNK) {
        const chunk = classified.slice(i, i + UPDATE_CHUNK);
        await Promise.all(chunk.map(async item => {
          try {
            await supabase
              .from('feedback')
              .update({
                sentiment: item.sentiment || null,
                category: item.category || null,
                theme_tags: item.theme_tags || null,
                relevance: item.relevance || null,
                processed: true
              })
              .eq('id', item.id);
          } catch (err) {
            console.error(`[ThemeEngine] Update error for ${item.id}:`, err.message);
          }
        }));
      }
    }

    // ── Step 5: Insert themes into Supabase ─────────────────────────
    if (themes.length > 0) {
      console.log(`[ThemeEngine] Step 5: Inserting ${themes.length} themes into Supabase...`);
      try {
        await insertThemes(themes);
        console.log(`[ThemeEngine] Themes inserted successfully.`);
      } catch (themeError) {
        console.error(`[ThemeEngine] Error inserting themes:`, themeError.message);
        results.errors.push(`Theme insertion error: ${themeError.message}`);
      }
    }

    // ── Step 6: Mark all fetched feedback as processed ──────────────
    console.log(`[ThemeEngine] Step 6: Marking ${rawFeedback.length} feedback items as processed...`);
    const allIds = rawFeedback.map(f => f.id);
    await markAsProcessed(allIds);

    // ── Step 7: Generate summary ────────────────────────────────────
    if (themes.length > 0) {
      console.log(`[ThemeEngine] Step 7: Generating pipeline summary...`);
      try {
        const summarizePrompt = buildSummarizeUserPrompt(themes, cleanedFeedback.length);
        const summaryResult = await generateJSON(summarizePrompt, SUMMARIZE_SYSTEM_PROMPT);
        results.summary = summaryResult;
        console.log(`[ThemeEngine] Summary generated.`);
      } catch (sumError) {
        console.error(`[ThemeEngine] Error generating summary:`, sumError.message);
        results.errors.push(`Summary generation error: ${sumError.message}`);
      }
    }

    // ── Step 8: Generate and Validate Insights ──────────────────────
    if (themes.length > 0) {
      console.log(`[ThemeEngine] Step 8: Generating insights...`);
      try {
        const { insights: generatedInsights } = await generateInsights(themes);
        
        // Cross-source validation on themes
        checkCrossSourceCorroboration(themes);
        
        // Score all insights with confidence
        const scoredInsights = scoreAllInsights(generatedInsights || [], themes);
        
        // Apply statistical guardrails
        const guardrailResults = applyGuardrails(themes, scoredInsights);
        
        if (guardrailResults.warnings.length > 0) {
          console.log(`[ThemeEngine] Validation warnings: ${guardrailResults.warnings.length}`);
          guardrailResults.warnings.forEach(w => console.log(`  ⚠ ${w}`));
        }
        
        results.insights_count = scoredInsights.length;
        results.insights = scoredInsights;
        results.validated = true;
        results.validation = {
          valid_insights: guardrailResults.validInsights.length,
          flagged_insights: guardrailResults.flaggedInsights.length,
          warnings: guardrailResults.warnings
        };
        console.log(`[ThemeEngine] ✅ ${scoredInsights.length} insights generated and validated.`);
      } catch (insightError) {
        console.error(`[ThemeEngine] Error generating insights:`, insightError.message);
        results.errors.push(`Insight generation error: ${insightError.message}`);
      }
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`[ThemeEngine] ✅ Pipeline complete in ${elapsed.toFixed(2)}s. Classified: ${classified.length}, Themes: ${themes.length}`);

    return results;
  } catch (error) {
    console.error(`[ThemeEngine] ❌ Pipeline failed:`, error);
    results.errors.push(error.message);
    return results;
  }
}
