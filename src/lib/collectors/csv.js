import crypto from 'crypto';

/**
 * Creates a simple hash for author anonymization.
 * @param {string} text The text to hash.
 * @returns {string|null} The hashed string, or null if input is missing.
 */
function simpleHash(text) {
  if (!text) return null;
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

/**
 * Processes parsed CSV/JSON data into the unified feedback schema.
 * @param {Array<Object>} jsonData - Array of parsed objects.
 * @returns {Promise<Array<Object>>} Array of normalized feedback objects.
 */
export async function processCSVData(jsonData) {
  if (!Array.isArray(jsonData)) {
    throw new Error('Input data must be an array of objects');
  }

  const batchTime = new Date().toISOString();

  const processed = jsonData.map((row) => {
    // Extract text from common fields
    const text = row.text || row.review || row.comment || row.content || '';
    
    // Parse rating safely
    let rating = null;
    if (row.rating !== undefined && row.rating !== null) {
      const parsed = parseInt(row.rating, 10);
      if (!isNaN(parsed)) {
        rating = parsed;
      }
    }

    // Parse date safely
    let date = null;
    if (row.date) {
      const parsedDate = new Date(row.date);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString();
      }
    }

    return {
      source: row.source || 'csv',
      text: String(text).trim(),
      rating,
      date,
      author_hash: row.author ? simpleHash(row.author) : null,
      metadata: {
        original_fields: Object.keys(row),
        import_batch: batchTime
      }
    };
  });

  // Filter out rows with empty text
  return processed.filter((item) => item.text && item.text.length > 0);
}

/**
 * Validates the raw parsed CSV data.
 * @param {Array<Object>} data - Array of parsed objects.
 * @returns {{valid: boolean, errors: string[]}} Validation result.
 */
export function validateCSVData(data) {
  const errors = [];

  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { valid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Data array is empty');
    return { valid: false, errors };
  }

  let missingTextCount = 0;
  for (const row of data) {
    if (!row || typeof row !== 'object') {
      errors.push('All rows must be objects');
      return { valid: false, errors };
    }
    const text = row.text || row.review || row.comment || row.content;
    if (!text || String(text).trim().length === 0) {
      missingTextCount++;
    }
  }

  if (missingTextCount === data.length) {
    errors.push('No valid text/review/comment/content field found in any row');
  } else if (missingTextCount > 0) {
    errors.push(`Warning: ${missingTextCount} rows are missing text and will be skipped`);
  }

  return {
    valid: errors.length === 0 || errors[0].startsWith('Warning'),
    errors
  };
}
