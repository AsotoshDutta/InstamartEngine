import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * GET endpoint to retrieve generated insights.
 * Query params: impact, limit, offset
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const impact = searchParams.get('impact');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('insights')
      .select('*')
      .order('confidence_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (impact) {
      query = query.eq('impact', impact);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching insights:', error);
      return NextResponse.json(
        { error: 'Failed to fetch insights', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      metadata: { limit, offset }
    });
  } catch (error) {
    console.error('API /insights error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
