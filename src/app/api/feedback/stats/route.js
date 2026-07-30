import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * GET /api/feedback/stats
 * Returns aggregated stats for feedback.
 */
export async function GET() {
  try {
    const { data: feedbackData, error } = await supabase
      .from('feedback')
      .select('source, rating, date');

    if (error) throw error;

    let totalCount = 0;
    let bySource = {};
    let totalRating = 0;
    let ratingCount = 0;
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let dates = [];

    if (feedbackData) {
      totalCount = feedbackData.length;
      feedbackData.forEach(item => {
        bySource[item.source] = (bySource[item.source] || 0) + 1;
        
        if (item.rating) {
          totalRating += item.rating;
          ratingCount++;
          const r = Math.round(item.rating);
          if (r >= 1 && r <= 5) {
             ratingDistribution[r]++;
          }
        }
        
        if (item.date) {
            dates.push(new Date(item.date).getTime());
        }
      });
    }

    const avgRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : null;
    
    let dateRange = { min: null, max: null };
    if (dates.length > 0) {
        dateRange.min = new Date(Math.min(...dates)).toISOString();
        dateRange.max = new Date(Math.max(...dates)).toISOString();
    }

    return NextResponse.json({
      totalCount,
      bySource,
      averageRating: avgRating,
      ratingDistribution,
      dateRange
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
