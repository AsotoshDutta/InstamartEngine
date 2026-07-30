/**
 * Cross-source corroboration check
 */

/**
 * Checks how many unique sources a theme's reviews come from.
 * Adds `cross_source_validated` and `source_breakdown` to each theme.
 * @param {Array<Object>} themes - Array of themes to check
 * @returns {Array<Object>} Themes array with added fields
 */
export function checkCrossSourceCorroboration(themes = []) {
  return themes.map(theme => {
    const reviews = theme.reviews || [];
    const source_breakdown = {
      play_store: 0,
      app_store: 0,
      reddit: 0,
      csv: 0
    };

    // Populate source breakdown
    reviews.forEach(review => {
      const source = review.source;
      if (source && source_breakdown[source] !== undefined) {
        source_breakdown[source] += 1;
      } else if (source) {
        // In case there are unexpected sources
        source_breakdown[source] = (source_breakdown[source] || 0) + 1;
      }
    });

    // Count unique sources
    const uniqueSourcesCount = Object.values(source_breakdown).filter(count => count > 0).length;

    return {
      ...theme,
      cross_source_validated: uniqueSourcesCount >= 2,
      source_breakdown
    };
  });
}

/**
 * Returns a 0-1 score based on how evenly distributed across sources the reviews are.
 * Perfect distribution gives 1.0, single source gives 0.0.
 * @param {Array<string>|Object} sources - Array of source strings or a source_breakdown object
 * @returns {number} Diversity score (0.0 to 1.0)
 */
export function getSourceDiversityScore(sources) {
  let breakdown = {};
  let totalReviews = 0;

  if (Array.isArray(sources)) {
    sources.forEach(source => {
      breakdown[source] = (breakdown[source] || 0) + 1;
      totalReviews += 1;
    });
  } else if (typeof sources === 'object' && sources !== null) {
    breakdown = sources;
    totalReviews = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  }

  if (totalReviews === 0) return 0;

  const uniqueSources = Object.keys(breakdown).filter(k => breakdown[k] > 0);
  const N = uniqueSources.length;

  if (N <= 1) return 0;

  // Use Normalized Shannon Entropy for distribution evenness
  // H = - sum(p_i * ln(p_i))
  // Normalized H = H / ln(N)
  let entropy = 0;
  uniqueSources.forEach(source => {
    const p = breakdown[source] / totalReviews;
    if (p > 0) {
      entropy -= p * Math.log(p);
    }
  });

  const maxEntropy = Math.log(N);
  
  // If maxEntropy is 0 (shouldn't happen since N > 1), return 0
  const normalizedScore = maxEntropy === 0 ? 0 : entropy / maxEntropy;
  
  return Number(normalizedScore.toFixed(3));
}
