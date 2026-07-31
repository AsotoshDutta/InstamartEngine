import { createClient } from '@supabase/supabase-js';

/**
 * Lazy-initialized Supabase client singleton.
 * Avoids crashing at build time when env vars are not yet set.
 */
let _supabase = null;

export function getSupabase() {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL or Service Role Key is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }

  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

// Re-export as a getter for backward compatibility in API routes that import `supabase`
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  }
});

/**
 * Bulk insert an array of normalized feedback objects into the 'feedback' table.
 * @param {Array<Object>} feedbackArray - Array of normalized feedback objects.
 * @returns {Promise<Array>} - The inserted records.
 */
export async function insertFeedback(feedbackArray) {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackArray)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in insertFeedback:', error);
    throw error;
  }
}

/**
 * Return total count of feedback rows.
 * @returns {Promise<number>} - The total count of feedback rows.
 */
export async function getFeedbackCount() {
  try {
    const { count, error } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  } catch (error) {
    console.error('Error in getFeedbackCount:', error);
    throw error;
  }
}

/**
 * Get unprocessed feedback (processed=false).
 * @param {number} [limit=50] - The maximum number of records to return.
 * @returns {Promise<Array>} - Array of unprocessed feedback records.
 */
export async function getUnprocessedFeedback(limit = 50) {
  try {
    const { data: unprocessed, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('processed', false)
      .limit(limit);

    if (error) throw error;

    // Fallback: if no unprocessed feedback exists, return recent stored feedback
    if (!unprocessed || unprocessed.length === 0) {
      console.log('[Supabase] No unprocessed feedback found. Falling back to recent feedback...');
      const { data: recent, error: recentError } = await supabase
        .from('feedback')
        .select('*')
        .order('collected_at', { ascending: false })
        .limit(limit);

      if (recentError) throw recentError;
      return recent || [];
    }

    return unprocessed;
  } catch (error) {
    console.error('Error in getUnprocessedFeedback:', error);
    throw error;
  }
}

/**
 * Mark array of feedback IDs as processed=true.
 * @param {Array<string>} ids - Array of feedback UUIDs.
 * @returns {Promise<Array>} - The updated records.
 */
export async function markAsProcessed(ids) {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .update({ processed: true })
      .in('id', ids)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in markAsProcessed:', error);
    throw error;
  }
}

/**
 * Bulk insert themes into the 'themes' table.
 * @param {Array<Object>} themesArray - Array of theme objects.
 * @returns {Promise<Array>} - The inserted records.
 */
export async function insertThemes(themesArray) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanedThemes = themesArray.map(t => {
      const evidence_ids = Array.isArray(t.review_ids) 
        ? t.review_ids.filter(id => typeof id === 'string' && uuidRegex.test(id))
        : [];
      return {
        label: (t.label || t.title || 'Theme').substring(0, 255),
        description: t.description || '',
        review_count: typeof t.review_count === 'number' ? t.review_count : evidence_ids.length,
        avg_sentiment: typeof t.avg_sentiment === 'number' ? t.avg_sentiment : (t.avg_sentiment === 'positive' ? 1.0 : t.avg_sentiment === 'negative' ? -1.0 : 0.0),
        source_diversity: typeof t.source_diversity === 'number' ? t.source_diversity : 1,
        relevance: t.relevance || 'medium',
        evidence_ids: evidence_ids
      };
    });

    const { data, error } = await supabase
      .from('themes')
      .insert(cleanedThemes)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in insertThemes:', error);
    throw error;
  }
}

/**
 * Bulk insert insights into the 'insights' table.
 * @param {Array<Object>} insightsArray - Array of insight objects.
 * @returns {Promise<Array>} - The inserted records.
 */
export async function insertInsights(insightsArray) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanedInsights = insightsArray.map(ins => {
      const validThemeIds = Array.isArray(ins.theme_ids)
        ? ins.theme_ids.filter(id => typeof id === 'string' && uuidRegex.test(id))
        : [];
      return {
        title: (ins.title || 'Generated Insight').substring(0, 255),
        description: ins.description || '',
        evidence_count: ins.evidence_count || 0,
        impact: ins.impact || 'medium',
        confidence_score: typeof ins.confidence_score === 'number' ? ins.confidence_score : 80.0,
        strategic_question: ins.strategic_question || 'Q1',
        recommended_action: ins.recommended_action || ins.action || '',
        user_segment: ins.user_segment || 'all users',
        theme_ids: validThemeIds,
        validated: ins.validated !== undefined ? ins.validated : true
      };
    });

    const { data, error } = await supabase
      .from('insights')
      .insert(cleanedInsights)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in insertInsights:', error);
    throw error;
  }
}

/**
 * Insert a pipeline run log entry into the 'pipeline_runs' table.
 * @param {Object} runData - Pipeline run data (e.g., source, start_time, status).
 * @returns {Promise<Object>} - The inserted pipeline run record.
 */
export async function logPipelineRun(runData) {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .insert([runData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in logPipelineRun:', error);
    throw error;
  }
}

/**
 * Update a pipeline run log entry.
 * @param {string} id - The ID of the pipeline run.
 * @param {Object} updateData - The data to update (e.g., end_time, status, items_processed).
 * @returns {Promise<Object>} - The updated pipeline run record.
 */
export async function updatePipelineRun(id, updateData) {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updatePipelineRun:', error);
    throw error;
  }
}

/**
 * Get the most recent pipeline run.
 * @returns {Promise<Object|null>} - The most recent pipeline run record, or null if none.
 */
export async function getLatestPipelineRun() {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found error
    return data;
  } catch (error) {
    console.error('Error in getLatestPipelineRun:', error);
    throw error;
  }
}

/**
 * Get feedback filtered by source name.
 * @param {string} source - The source name (e.g., 'play_store', 'app_store').
 * @returns {Promise<Array>} - Array of feedback records for the specified source.
 */
export async function getFeedbackBySource(source) {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('source', source);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getFeedbackBySource:', error);
    throw error;
  }
}

/**
 * Get the most recent collected_at date for a source (for incremental collection).
 * @param {string} source - The source name.
 * @returns {Promise<string|null>} - ISO timestamp string of the latest collected_at or null if none.
 */
export async function getLastCollectedDate(source) {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('collected_at')
      .eq('source', source)
      .order('collected_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found error
    return data ? data.collected_at : null;
  } catch (error) {
    console.error('Error in getLastCollectedDate:', error);
    throw error;
  }
}
