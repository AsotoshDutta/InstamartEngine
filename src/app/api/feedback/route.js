import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * GET /api/feedback
 * Returns raw feedback data with pagination and filtering.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('feedback')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false });

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      metadata: {
        limit,
        offset,
        total: count, 
      }
    });

  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
