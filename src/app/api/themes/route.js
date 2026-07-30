import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * GET endpoint to retrieve clustered themes.
 * Query params: relevance, limit, offset
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const relevance = searchParams.get('relevance');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('themes')
      .select('*')
      .order('review_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (relevance) {
      query = query.eq('relevance', relevance);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching themes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch themes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      metadata: { limit, offset }
    });
  } catch (error) {
    console.error('API /themes error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
