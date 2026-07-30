import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * GET /api/pipeline/status
 * Returns pipeline status and basic stats.
 */
export async function GET() {
  try {
    // 1. Query the latest pipeline run
    const { data: latestRun, error: runError } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runError && runError.code !== 'PGRST116') { // Ignore no rows found error
      throw runError;
    }

    // 2. Query total feedback count and by source
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('source, rating');

    if (feedbackError) throw feedbackError;

    let totalFeedback = 0;
    let bySource = {};
    let totalRating = 0;
    let ratingCount = 0;

    if (feedbackData) {
      totalFeedback = feedbackData.length;
      feedbackData.forEach(item => {
        bySource[item.source] = (bySource[item.source] || 0) + 1;
        if (item.rating) {
          totalRating += item.rating;
          ratingCount++;
        }
      });
    }

    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : null;

    // 3. Return JSON
    return NextResponse.json({
      lastRun: latestRun || null,
      stats: {
        totalFeedback,
        bySource,
        avgRating
      }
    });

  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
