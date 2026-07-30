import gplay from 'google-play-scraper';

/**
 * Creates a simple hash of a string for anonymization.
 * @param {string} str - The string to hash.
 * @returns {string|null} The hashed string or null if input is empty.
 */
function simpleHash(str) {
  if (!str) return null;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Collects reviews from the Google Play Store for Swiggy.
 * @param {Object} options - Options for the scraper.
 * @param {number} [options.num=100] - Number of reviews to fetch.
 * @param {number} [options.sort=gplay.sort.NEWEST] - Sort order.
 * @param {string} [options.lang='en'] - Language.
 * @param {string} [options.country='in'] - Country.
 * @returns {Promise<Array<Object>>} Array of normalized feedback objects.
 */
export async function collectPlayStoreReviews(options = {}) {
  const defaultOptions = {
    appId: 'in.swiggy.android',
    num: 100,
    sort: gplay.sort.NEWEST,
    lang: 'en',
    country: 'in',
  };

  const fetchOptions = { ...defaultOptions, ...options };

  try {
    const response = await gplay.reviews(fetchOptions);
    
    // Handle both newer { data: [...] } format and older [...] array format
    const reviews = Array.isArray(response) ? response : (response.data || []);

    return reviews.map((review) => {
      let dateIso = null;
      let replyDateIso = null;
      
      try {
        if (review.date) {
          dateIso = new Date(review.date).toISOString();
        }
      } catch (e) {
        // Fallback if date is unparseable
      }

      try {
        if (review.replyDate) {
          replyDateIso = new Date(review.replyDate).toISOString();
        }
      } catch (e) {
        // Fallback if reply date is unparseable
      }

      return {
        source: 'play_store',
        text: review.text || '',
        rating: review.score || null,
        date: dateIso,
        author_hash: simpleHash(review.userName),
        metadata: {
          app_version: review.version || null,
          thumbs_up: review.thumbsUp || 0,
          review_id: review.id || null,
          reply_text: review.replyText || null,
          reply_date: replyDateIso,
        },
        sentiment: null,
        category: null,
        theme_tags: null,
        relevance: null,
        processed: false
      };
    });
  } catch (error) {
    console.error('Error fetching Google Play Store reviews:', error);
    return [];
  }
}

/**
 * Fetches basic app information from the Google Play Store.
 * @returns {Promise<Object|null>} App information object or null on failure.
 */
export async function getAppInfo() {
  try {
    return await gplay.app({
      appId: 'in.swiggy.android',
      lang: 'en',
      country: 'in'
    });
  } catch (error) {
    console.error('Error fetching Google Play Store app info:', error);
    return null;
  }
}
