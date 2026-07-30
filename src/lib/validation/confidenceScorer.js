/**
 * Confidence Scorer for Insights
 */

/**
 * Calculates a confidence score (0-100) for an insight based on evidence, diversity, and consistency.
 * 
 * Formula:
 * confidence = (
 *   evidence_weight   * min(evidence_count / 50, 1.0)     // 40%
 * + diversity_weight  * (unique_sources / total_sources)  // 30%
 * + consistency_weight * sentiment_agreement_ratio        // 30%
 * ) * 100
 * 
 * @param {Object} insight - The insight object (should contain themes or theme_ids)
 * @param {Array<Object>} allThemes - Array of all available themes
 * @returns {number} Confidence score from 0 to 100, rounded to 1 decimal
 */
export function calculateConfidenceScore(insight, allThemes = []) {
  const evidence_weight = 0.40;
  const diversity_weight = 0.30;
  const consistency_weight = 0.30;
  const total_sources = 4; // play_store, app_store, reddit, csv

  // Resolve related themes for this insight
  let relatedThemes = [];
  if (insight.themes && Array.isArray(insight.themes)) {
    if (insight.themes.length > 0 && typeof insight.themes[0] === 'object') {
      relatedThemes = insight.themes;
    } else {
      relatedThemes = allThemes.filter(t => insight.themes.includes(t.id));
    }
  } else if (insight.theme_ids && Array.isArray(insight.theme_ids)) {
    relatedThemes = allThemes.filter(t => insight.theme_ids.includes(t.id));
  } else {
    // Fallback if structure is different
    relatedThemes = allThemes;
  }

  // Aggregate all reviews from related themes
  let allReviews = [];
  relatedThemes.forEach(theme => {
    if (theme.reviews && Array.isArray(theme.reviews)) {
      allReviews = allReviews.concat(theme.reviews);
    }
  });

  const evidence_count = allReviews.length;

  // Calculate unique sources
  const sources = new Set(allReviews.map(r => r.source).filter(Boolean));
  const unique_sources = sources.size;

  // Calculate sentiment agreement ratio
  let sentiment_agreement_ratio = 0;
  if (evidence_count > 0) {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    allReviews.forEach(r => {
      // Default to neutral if not present
      const sentiment = r.sentiment ? r.sentiment.toLowerCase() : 'neutral';
      counts[sentiment] = (counts[sentiment] || 0) + 1;
    });
    
    // Find the dominant sentiment count
    const maxCount = Math.max(counts.positive, counts.negative, counts.neutral);
    sentiment_agreement_ratio = maxCount / evidence_count;
  }

  const score = (
    evidence_weight * Math.min(evidence_count / 50, 1.0) +
    diversity_weight * (unique_sources / total_sources) +
    consistency_weight * sentiment_agreement_ratio
  ) * 100;

  return Number(score.toFixed(1));
}

/**
 * Returns a human-readable label for a given confidence score.
 * @param {number} score - Confidence score (0-100)
 * @returns {string} 'high', 'medium', or 'low'
 */
export function getConfidenceLabel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Calculates and attaches confidence scores to an array of insights.
 * @param {Array<Object>} insights - Array of insight objects
 * @param {Array<Object>} themes - Array of all theme objects
 * @returns {Array<Object>} Array of insights with confidence_score field added
 */
export function scoreAllInsights(insights, themes) {
  return insights.map(insight => {
    const score = calculateConfidenceScore(insight, themes);
    return {
      ...insight,
      confidence_score: score,
      confidence_label: getConfidenceLabel(score)
    };
  });
}
