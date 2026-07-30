import { NextResponse } from 'next/server';
import { processCSVData, validateCSVData } from '@/lib/collectors/csv';
import { deduplicateFeedback } from '@/lib/collectors/normalize';
import { insertFeedback } from '@/lib/db/supabase';

/**
 * POST /api/feedback/upload
 * Accepts a JSON body with { data: [...] } — array of feedback objects
 * from CSV/JSON import. Validates, processes, deduplicates, and stores.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.data)) {
      return NextResponse.json(
        { error: 'Invalid payload. Expected JSON body: { data: [...] }' },
        { status: 400 }
      );
    }

    // 1. Validate
    const validation = validateCSVData(body.data);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // 2. Process (async — normalizes to unified schema)
    const processedData = await processCSVData(body.data);

    // 3. Deduplicate
    const deduplicatedData = deduplicateFeedback(processedData);

    // 4. Insert into Supabase
    let totalInserted = 0;
    if (deduplicatedData.length > 0) {
      try {
        const inserted = await insertFeedback(deduplicatedData);
        totalInserted = inserted.length;
      } catch (dbError) {
        console.error('Database insertion failed:', dbError);
        return NextResponse.json(
          { error: 'Database insertion failed', message: dbError.message },
          { status: 500 }
        );
      }
    }

    // 5. Return import stats
    return NextResponse.json({
      success: true,
      stats: {
        received: body.data.length,
        afterValidation: processedData.length,
        afterDedup: deduplicatedData.length,
        inserted: totalInserted
      },
      warnings: validation.errors.length > 0 ? validation.errors : undefined
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
