/**
 * Theme Extraction Orchestrator
 * Ties together preprocessing, AI classification, clustering, and storage.
 */

import { getUnprocessedFeedback, markAsProcessed, insertThemes } from '@/lib/db/supabase';
import { supabase } from '@/lib/db/supabase';
import { preprocessFeedback } from './preprocess';
import { processFeedbackInBatches } from '@/lib/ai/batchProcessor';
import { generateJSON } from '@/lib/ai/gemini';
import { SUMMARIZE_SYSTEM_PROMPT, buildSummarizeUserPrompt } from '@/lib/ai/prompts/summarize';
import { generateInsights } from '@/lib/analysis/insightEngine';
import { calculateConfidenceScore, scoreAllInsights } from '@/lib/validation/confidenceScorer';
import { applyGuardrails } from '@/lib/validation/guardrails';
import { checkCrossSourceCorroboration } from '@/lib/validation/crossSourceCheck';

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
      console.log(`[ThemeEngine] Step 4: Updating ${classified.length} classified feedback rows...`);

      // Build upsert records to update sentiment/category/tags on each feedback row
      const updates = classified.map(item => ({
        id: item.id,
        sentiment: item.sentiment || null,
        category: item.category || null,
        theme_tags: item.theme_tags || null,
        relevance: item.relevance || null,
        processed: true
      }));

      // Upsert in batches of 200 to avoid payload limits
      const UPSERT_BATCH = 200;
      for (let i = 0; i < updates.length; i += UPSERT_BATCH) {
        const batch = updates.slice(i, i + UPSERT_BATCH);
        try {
          const { error: updateError } = await supabase
            .from('feedback')
            .upsert(batch, { onConflict: 'id' });

          if (updateError) {
            console.error(`[ThemeEngine] Upsert error at batch ${i}:`, updateError.message);
            results.errors.push(`Feedback upsert error: ${updateError.message}`);
          }
        } catch (upsertErr) {
          console.error(`[ThemeEngine] Upsert exception at batch ${i}:`, upsertErr.message);
          results.errors.push(`Feedback upsert exception: ${upsertErr.message}`);
        }
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
