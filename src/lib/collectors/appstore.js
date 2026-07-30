import store from 'app-store-scraper';
import crypto from 'crypto';

/**
 * Generates a simple hash for author anonymization.
 * @param {string} authorName - The original author name.
 * @returns {string|null} - The SHA-256 hash of the author name, or null if missing.
 */
function hashAuthor(authorName) {
  if (!authorName) return null;
  return crypto.createHash('sha256').update(authorName.toString()).digest('hex');
}

/**
 * Collects reviews from the Apple App Store for the Swiggy app.
 * Maps the collected reviews to the unified feedback schema.
 * 
 * @param {Object} options - Options for fetching reviews.
 * @param {number} [options.pages=3] - Number of pages to fetch (default: 3).
 * @param {number} [options.sort] - Sorting method (default: store.sort.RECENT).
 * @param {string} [options.country='in'] - Country code (default: 'in').
 * @returns {Promise<Array<Object>>} - Array of normalized feedback objects.
 */
export async function collectAppStoreReviews(options = {}) {
  try {
    const pages = options.pages || 3;
    const sort = options.sort || store.sort.RECENT;
    const country = options.country || 'in';
    const appId = 989540920; // Swiggy App ID on iOS

    let allReviews = [];

    // App Store scraper fetches by page
    for (let page = 1; page <= pages; page++) {
      try {
        const pageReviews = await store.reviews({
          id: appId,
          sort: sort,
          country: country,
          page: page
        });

        if (pageReviews && pageReviews.length > 0) {
          allReviews = allReviews.concat(pageReviews);
        } else {
          // If a page returns no reviews, stop fetching
          break;
        }
      } catch (pageError) {
        console.warn(`[AppStore Collector] Error fetching page ${page}:`, pageError.message);
        // Break on error to avoid unnecessary failing requests
        break;
      }
    }

    // Map to unified feedback schema
    const normalizedReviews = allReviews.map(review => {
      // Ensure date is a valid ISO string
      let dateString = null;
      try {
        if (review.updated) {
          dateString = new Date(review.updated).toISOString();
        }
      } catch (e) {
        dateString = null;
      }

      return {
        source: 'app_store',
        text: review.text,
        rating: review.score || null,
        date: dateString,
        author_hash: hashAuthor(review.userName),
        metadata: {
          title: review.title,
          review_id: review.id,
          version: review.version,
          vote_count: review.voteCount
        }
      };
    });

    console.log(`[AppStore Collector] Successfully collected ${normalizedReviews.length} reviews.`);
    return normalizedReviews;
  } catch (error) {
    console.error('[AppStore Collector] Critical error during review collection:', error);
    return [];
  }
}
