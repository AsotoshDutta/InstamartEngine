/**
 * API Route: POST /api/pipeline/analyze
 */

import { NextResponse } from 'next/server';
import { runThemeExtraction } from '@/lib/analysis/themeEngine';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const cronSecretParam = url.searchParams.get('cron_secret');
    const cronSecretEnv = process.env.CRON_SECRET;

    // Verify CRON_SECRET from authorization header or query param
    const isAuthHeaderValid = authHeader === `Bearer ${cronSecretEnv}`;
    const isQueryParamValid = cronSecretParam === cronSecretEnv;

    if (!cronSecretEnv || (!isAuthHeaderValid && !isQueryParamValid)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Call runThemeExtraction
    const results = await runThemeExtraction();

    return NextResponse.json({
      success: true,
      classified_count: results.classified_count,
      themes_count: results.themes_count,
      themes: results.themes,
      summary: results.summary,
      timestamp: new Date().toISOString(),
      errors: results.errors.length > 0 ? results.errors : undefined
    });

  } catch (error) {
    console.error('[API] Error in /api/pipeline/analyze:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
