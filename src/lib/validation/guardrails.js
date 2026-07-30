/**
 * Guardrails validation for themes and insights
 */

/**
 * Validates a single theme against guardrails.
 * @param {Object} theme - The theme object to validate
 * @returns {Object} { isValid, flags }
 */
export function validateTheme(theme) {
  const flags = [];
  const reviews = theme.reviews || [];
  
  // Guardrail 1: Minimum 3 reviews before a theme is considered valid
  if (reviews.length < 3) {
    flags.push(`Insufficient evidence: theme has only ${reviews.length} reviews (minimum 3 required).`);
  }

  // Guardrail 4: Flag themes with <60% sentiment agreement
  if (reviews.length > 0) {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    reviews.forEach(r => {
      const sentiment = r.sentiment ? r.sentiment.toLowerCase() : 'neutral';
      counts[sentiment] = (counts[sentiment] || 0) + 1;
    });
    const maxCount = Math.max(counts.positive, counts.negative, counts.neutral);
    const agreementRatio = maxCount / reviews.length;
    
    if (agreementRatio < 0.6) {
      flags.push(`Low sentiment agreement: only ${(agreementRatio * 100).toFixed(1)}% of reviews agree on sentiment (minimum 60% expected).`);
    }
  } else {
    flags.push("No reviews available to calculate sentiment agreement.");
  }

  return {
    isValid: flags.length === 0,
    flags
  };
}

/**
 * Validates a single insight against guardrails.
 * @param {Object} insight - The insight object to validate
 * @param {Array<Object>} allThemes - Array of all theme objects for resolving references
 * @returns {Object} { isValid, flags }
 */
export function validateInsight(insight, allThemes = []) {
  const flags = [];
  
  // Resolve related themes
  let relatedThemes = [];
  if (insight.themes && Array.isArray(insight.themes)) {
    if (insight.themes.length > 0 && typeof insight.themes[0] === 'object') {
      relatedThemes = insight.themes;
    } else {
      relatedThemes = allThemes.filter(t => insight.themes.includes(t.id));
    }
  } else if (insight.theme_ids && Array.isArray(insight.theme_ids)) {
    relatedThemes = allThemes.filter(t => insight.theme_ids.includes(t.id));
  }

  // Guardrail 2: Minimum 2 themes before an insight is valid
  if (relatedThemes.length < 2) {
    flags.push(`Insufficient themes: insight is supported by only ${relatedThemes.length} theme(s) (minimum 2 required).`);
  }

  // Extract all reviews from related themes
  let allReviews = [];
  relatedThemes.forEach(theme => {
    if (theme.reviews && Array.isArray(theme.reviews)) {
      allReviews = allReviews.concat(theme.reviews);
    }
  });

  // Guardrail 3: Flag insights where >80% evidence comes from a single source
  if (allReviews.length > 0) {
    const sourceCounts = {};
    allReviews.forEach(r => {
      const source = r.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const maxSourceCount = Math.max(...Object.values(sourceCounts));
    const singleSourceRatio = maxSourceCount / allReviews.length;

    if (singleSourceRatio > 0.8) {
      flags.push(`Source imbalance: ${(singleSourceRatio * 100).toFixed(1)}% of evidence comes from a single source (should not exceed 80%).`);
    }
  }

  return {
    isValid: flags.length === 0,
    flags
  };
}

/**
 * Applies guardrails to arrays of themes and insights.
 * @param {Array<Object>} themes - Array of themes
 * @param {Array<Object>} insights - Array of insights
 * @returns {Object} Result object containing valid/flagged items and warnings
 */
export function applyGuardrails(themes = [], insights = []) {
  const validThemes = [];
  const flaggedThemes = [];
  const validInsights = [];
  const flaggedInsights = [];
  const warnings = [];

  // Process Themes
  themes.forEach(theme => {
    const { isValid, flags } = validateTheme(theme);
    const themeWithFlags = { ...theme, flags };
    
    if (isValid) {
      validThemes.push(themeWithFlags);
    } else {
      flaggedThemes.push(themeWithFlags);
      warnings.push(`Theme "${theme.id || theme.name || 'Unknown'}" flagged: ${flags.join(' ')}`);
    }
  });

  // Process Insights
  insights.forEach(insight => {
    const { isValid, flags } = validateInsight(insight, themes);
    const insightWithFlags = { ...insight, flags };

    if (isValid) {
      validInsights.push(insightWithFlags);
    } else {
      flaggedInsights.push(insightWithFlags);
      warnings.push(`Insight "${insight.id || insight.title || 'Unknown'}" flagged: ${flags.join(' ')}`);
    }
  });

  return {
    validThemes,
    validInsights,
    flaggedThemes,
    flaggedInsights,
    warnings
  };
}
