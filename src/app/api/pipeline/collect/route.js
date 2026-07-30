import { NextResponse } from 'next/server';
import { collectPlayStoreReviews } from '@/lib/collectors/playstore';
import { collectAppStoreReviews } from '@/lib/collectors/appstore';
import { collectRedditDiscussions } from '@/lib/collectors/reddit';
import { deduplicateFeedback, generateFeedbackStats } from '@/lib/collectors/normalize';
import { insertFeedback } from '@/lib/db/supabase';

/**
 * POST /api/pipeline/collect
 * Triggers data collection from all configured sources (Play Store, App Store, Reddit).
 * Normalizes, deduplicates, and stores results in Supabase.
 *
 * Security: Requires CRON_SECRET via Authorization header or query param.
 */
export async function POST(request) {
  try {
    // 1. Verify CRON_SECRET for security
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('cron_secret') || authHeader?.replace('Bearer ', '');

    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Call all collectors in parallel
    const [playStoreResult, appStoreResult, redditResult] = await Promise.allSettled([
      collectPlayStoreReviews(),
      collectAppStoreReviews(),
      collectRedditDiscussions()
    ]);

    const errors = [];
    let rawData = [];

    if (playStoreResult.status === 'fulfilled') {
      rawData = rawData.concat(playStoreResult.value);
    } else {
      errors.push({ source: 'play_store', error: playStoreResult.reason?.message });
      console.error('Play Store collection failed:', playStoreResult.reason);
    }

    if (appStoreResult.status === 'fulfilled') {
      rawData = rawData.concat(appStoreResult.value);
    } else {
      errors.push({ source: 'app_store', error: appStoreResult.reason?.message });
      console.error('App Store collection failed:', appStoreResult.reason);
    }

    if (redditResult.status === 'fulfilled') {
      rawData = rawData.concat(redditResult.value);
    } else {
      errors.push({ source: 'reddit', error: redditResult.reason?.message });
      console.error('Reddit collection failed:', redditResult.reason);
    }

    // 3. Normalize and deduplicate the combined results
    const deduplicatedData = deduplicateFeedback(rawData);
    const stats = generateFeedbackStats(deduplicatedData);

    // 4. Insert into Supabase (in batches of 500 to avoid payload limits)
    let totalInserted = 0;
    const BATCH_SIZE = 500;

    for (let i = 0; i < deduplicatedData.length; i += BATCH_SIZE) {
      const batch = deduplicatedData.slice(i, i + BATCH_SIZE);
      try {
        const inserted = await insertFeedback(batch);
        totalInserted += inserted.length;
      } catch (dbError) {
        console.error(`Failed to insert batch starting at index ${i}:`, dbError);
        errors.push({ source: 'database', error: dbError.message, batch_start: i });
      }
    }

    // 5. Return JSON with collection stats
    return NextResponse.json({
      success: true,
      totalCollected: rawData.length,
      totalDeduplicated: deduplicatedData.length,
      totalInserted,
      bySource: stats.countBySource,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Collection pipeline error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
