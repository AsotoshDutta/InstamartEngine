/**
 * Normalizes a text string by cleaning whitespace, URLs, and emails.
 * @param {string} text - The raw text to normalize.
 * @returns {string} The cleaned text.
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // Replace URLs with [URL]
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  cleaned = cleaned.replace(urlRegex, '[URL]');

  // Replace email addresses with [EMAIL]
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  cleaned = cleaned.replace(emailRegex, '[EMAIL]');

  // Remove excessive line breaks (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  return cleaned.trim();
}

/**
 * Deduplicates and cleans an array of feedback objects.
 * @param {Array<Object>} feedbackArray - Array of feedback objects.
 * @returns {Array<Object>} The cleaned and deduplicated array.
 */
export function deduplicateFeedback(feedbackArray) {
  if (!Array.isArray(feedbackArray)) return [];

  const seenTexts = new Set();
  const result = [];

  for (const item of feedbackArray) {
    if (!item.text) continue;

    // Apply normalization to text for deduplication and cleaning
    const cleanedText = normalizeText(item.text);

    // Remove text shorter than 10 characters
    if (cleanedText.length < 10) continue;

    const lowercased = cleanedText.toLowerCase();

    if (!seenTexts.has(lowercased)) {
      seenTexts.add(lowercased);
      // Update text with cleaned version
      result.push({
        ...item,
        text: cleanedText
      });
    }
  }

  return result;
}

/**
 * Generates statistics from an array of feedback objects.
 * @param {Array<Object>} feedbackArray - Array of feedback objects.
 * @returns {Object} Statistics including total count, count by source, avg rating, and date range.
 */
export function generateFeedbackStats(feedbackArray) {
  if (!Array.isArray(feedbackArray) || feedbackArray.length === 0) {
    return {
      totalCount: 0,
      countBySource: {},
      avgRating: null,
      dateRange: { earliest: null, latest: null }
    };
  }

  const countBySource = {};
  let totalRating = 0;
  let ratingCount = 0;
  let earliest = null;
  let latest = null;

  for (const item of feedbackArray) {
    // Count by source
    const source = item.source || 'unknown';
    countBySource[source] = (countBySource[source] || 0) + 1;

    // Calculate average rating
    if (typeof item.rating === 'number') {
      totalRating += item.rating;
      ratingCount++;
    }

    // Determine date range
    if (item.date) {
      const itemDate = new Date(item.date).getTime();
      if (!isNaN(itemDate)) {
        if (earliest === null || itemDate < earliest) {
          earliest = itemDate;
        }
        if (latest === null || itemDate > latest) {
          latest = itemDate;
        }
      }
    }
  }

  const avgRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : null;

  return {
    totalCount: feedbackArray.length,
    countBySource,
    avgRating,
    dateRange: {
      earliest: earliest ? new Date(earliest).toISOString() : null,
      latest: latest ? new Date(latest).toISOString() : null
    }
  };
}
