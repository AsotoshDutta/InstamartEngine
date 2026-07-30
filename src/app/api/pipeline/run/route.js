import { NextResponse } from 'next/server';
import { collectPlayStoreReviews } from '@/lib/collectors/playstore';
import { collectAppStoreReviews } from '@/lib/collectors/appstore';
import { collectRedditDiscussions } from '@/lib/collectors/reddit';
import { deduplicateFeedback, generateFeedbackStats } from '@/lib/collectors/normalize';
import { insertFeedback, logPipelineRun, updatePipelineRun } from '@/lib/db/supabase';
import { runThemeExtraction } from '@/lib/analysis/themeEngine';

/**
 * GET /api/pipeline/run
 * Full pipeline cron target. Vercel cron calls this via GET daily.
 *
 * Step 1: Collect data from all sources
 * Step 2: (Phase 2 placeholder) AI analysis & theme extraction
 * Step 3: Log run results to Supabase
 *
 * Security: Requires CRON_SECRET via Authorization header.
 */
export async function GET(request) {
  let pipelineRun = null;

  try {
    // 1. Verify CRON_SECRET from authorization header or query param
    const authHeader = request.headers.get('authorization');
    const cronSecret = authHeader?.replace('Bearer ', '');
    const url = new URL(request.url);
    const cronSecretParam = url.searchParams.get('cron_secret');
    const cronSecretEnv = process.env.CRON_SECRET;

    const isAuthValid = cronSecret === cronSecretEnv;
    const isParamValid = cronSecretParam === cronSecretEnv;

    if (cronSecretEnv && !isAuthValid && !isParamValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log the pipeline run start
    pipelineRun = await logPipelineRun({
      status: 'running',
      reviews_collected: 0,
      themes_extracted: 0,
      insights_generated: 0
    });

    // 2. Step 1: Collect from all sources
    const [playStoreResult, appStoreResult, redditResult] = await Promise.allSettled([
      collectPlayStoreReviews(),
      collectAppStoreReviews(),
      collectRedditDiscussions()
    ]);

    let rawData = [];
    const sourceErrors = [];

    if (playStoreResult.status === 'fulfilled') {
      rawData = rawData.concat(playStoreResult.value);
    } else {
      sourceErrors.push(`play_store: ${playStoreResult.reason?.message}`);
    }
    if (appStoreResult.status === 'fulfilled') {
      rawData = rawData.concat(appStoreResult.value);
    } else {
      sourceErrors.push(`app_store: ${appStoreResult.reason?.message}`);
    }
    if (redditResult.status === 'fulfilled') {
      rawData = rawData.concat(redditResult.value);
    } else {
      sourceErrors.push(`reddit: ${redditResult.reason?.message}`);
    }

    // Normalize & deduplicate
    const deduplicatedData = deduplicateFeedback(rawData);
    const stats = generateFeedbackStats(deduplicatedData);

    // Insert into Supabase (batched)
    let totalInserted = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < deduplicatedData.length; i += BATCH_SIZE) {
      const batch = deduplicatedData.slice(i, i + BATCH_SIZE);
      try {
        const inserted = await insertFeedback(batch);
        totalInserted += inserted.length;
      } catch (dbError) {
        console.error(`Batch insert error at index ${i}:`, dbError.message);
      }
    }

    // 3. Step 2: AI Analysis & Theme Extraction
    let analysisResults = null;
    if (totalInserted > 0) {
      console.log('[Pipeline] Running Phase 2: AI analysis & theme extraction...');
      try {
        analysisResults = await runThemeExtraction();
        console.log(`[Pipeline] Analysis complete: ${analysisResults.classified_count} classified, ${analysisResults.themes_count} themes`);
      } catch (analysisError) {
        console.error('[Pipeline] Analysis failed:', analysisError.message);
        sourceErrors.push(`analysis: ${analysisError.message}`);
      }
    } else {
      console.log('[Pipeline] No new data inserted, skipping analysis.');
    }

    // 4. Update pipeline run log
    if (pipelineRun) {
      await updatePipelineRun(pipelineRun.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        reviews_collected: totalInserted,
        themes_extracted: analysisResults?.themes_count || 0,
        error_log: sourceErrors.length > 0 ? sourceErrors.join('; ') : null
      });
    }

    // 5. Return run summary
    return NextResponse.json({
      success: true,
      runId: pipelineRun?.id,
      status: 'completed',
      summary: {
        collection: {
          totalRaw: rawData.length,
          totalDeduplicated: deduplicatedData.length,
          totalInserted,
          bySource: stats.countBySource
        },
        analysis: analysisResults ? {
          classified: analysisResults.classified_count,
          themes: analysisResults.themes_count,
          summary: analysisResults.summary
        } : null,
        errors: sourceErrors.length > 0 ? sourceErrors : undefined
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pipeline run error:', error);

    // Log failure
    if (pipelineRun) {
      try {
        await updatePipelineRun(pipelineRun.id, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_log: error.message
        });
      } catch (_) { /* ignore logging error */ }
    }

    return NextResponse.json({ error: 'Pipeline run failed', message: error.message }, { status: 500 });
  }
}
