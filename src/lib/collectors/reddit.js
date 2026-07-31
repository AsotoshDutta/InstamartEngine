import crypto from 'crypto';

/**
 * Creates a simple hash for author anonymization.
 * @param {string} author - The author's username.
 * @returns {string|null} The hashed author string.
 */
function hashAuthor(author) {
  if (!author || author === '[deleted]') return null;
  return crypto.createHash('sha256').update(author).digest('hex');
}

/**
 * Sleeps for a given number of milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches JSON from Reddit API with proper headers and error handling.
 * @param {string} url - The Reddit API URL to fetch.
 * @returns {Promise<any>} The parsed JSON response.
 */
async function fetchReddit(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Collects discussions from Reddit across multiple subreddits and search queries.
 * @param {Object} options - Configuration options.
 * @param {string[]} [options.subreddits] - Optional list of subreddits to search.
 * @param {string[]} [options.queries] - Optional list of search queries.
 * @param {number} [options.limit=50] - Limit of posts per query.
 * @returns {Promise<Array<Object>>} Array of normalized feedback objects.
 */
export async function collectRedditDiscussions(options = {}) {
  const SUBREDDITS = options.subreddits || ['bangalore', 'india', 'Indiasocial'];
  const QUERIES = options.queries || ['swiggy instamart', 'instamart delivery', 'instamart category', 'instamart items missing'];
  const limit = options.limit || 25;

  const results = [];
  const seenIds = new Set();

  // Try global Reddit search first for highest yield
  try {
    const globalUrl = `https://www.reddit.com/search.json?q=swiggy+instamart&sort=relevance&limit=30`;
    console.log(`Searching Reddit globally for "swiggy instamart"...`);
    const globalData = await fetchReddit(globalUrl);
    const globalPosts = globalData?.data?.children || [];

    for (const postWrapper of globalPosts) {
      const post = postWrapper.data;
      if (post && post.id && !seenIds.has(post.id) && post.title && post.title !== '[deleted]') {
        seenIds.add(post.id);
        results.push({
          source: 'reddit',
          text: `${post.title}\n\n${post.selftext || ''}`.trim(),
          rating: null,
          date: new Date(post.created_utc * 1000).toISOString(),
          author_hash: hashAuthor(post.author),
          metadata: {
            subreddit: post.subreddit,
            post_id: post.id,
            upvotes: post.ups,
            type: 'post',
            url: post.url,
            num_comments: post.num_comments
          }
        });
      }
    }
  } catch (globalErr) {
    console.warn(`Global Reddit search warning: ${globalErr.message}`);
  }

  for (const subreddit of SUBREDDITS) {
    for (const query of QUERIES) {
      try {
        console.log(`Searching r/${subreddit} for "${query}"...`);
        const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}&restrict_sr=on`;
        const searchData = await fetchReddit(searchUrl);
        await sleep(500); // 500ms delay to keep collection fast

        const posts = searchData?.data?.children || [];

        for (const postWrapper of posts) {
          const post = postWrapper.data;
          
          // Filter out deleted/removed posts
          if (
            post.author === '[deleted]' || 
            post.selftext === '[removed]' || 
            post.selftext === '[deleted]' ||
            post.title === '[removed]' ||
            post.title === '[deleted]'
          ) {
            continue;
          }

          if (!seenIds.has(post.id)) {
            seenIds.add(post.id);
            results.push({
              source: 'reddit',
              text: `${post.title}\n\n${post.selftext}`.trim(),
              rating: null,
              date: new Date(post.created_utc * 1000).toISOString(),
              author_hash: hashAuthor(post.author),
              metadata: {
                subreddit: post.subreddit,
                post_id: post.id,
                upvotes: post.ups,
                type: 'post',
                url: post.url,
                num_comments: post.num_comments
              }
            });
          }

          // Fetch top-level comments for active discussions (min 3 comments)
          if (post.num_comments >= 3) {
            try {
              // Constructing comment API URL using the permalink
              const commentsUrl = `https://www.reddit.com${post.permalink}.json`;
              const commentsData = await fetchReddit(commentsUrl);
              await sleep(500); // 500ms delay between comment fetches

              // Reddit comments JSON returns an array where index 1 contains the comments
              const comments = commentsData[1]?.data?.children || [];
              
              for (const commentWrapper of comments) {
                const comment = commentWrapper.data;
                
                // Filter out non-comments (like 'more') and deleted/removed comments
                if (
                  !comment.id || 
                  comment.author === '[deleted]' || 
                  comment.body === '[removed]' || 
                  comment.body === '[deleted]'
                ) {
                  continue;
                }
                
                if (!seenIds.has(comment.id)) {
                  seenIds.add(comment.id);
                  results.push({
                    source: 'reddit',
                    text: comment.body,
                    rating: null,
                    date: new Date(comment.created_utc * 1000).toISOString(),
                    author_hash: hashAuthor(comment.author),
                    metadata: {
                      subreddit: comment.subreddit || subreddit,
                      post_id: post.id,
                      comment_id: comment.id,
                      upvotes: comment.ups,
                      type: 'comment'
                    }
                  });
                }
              }
            } catch (commentError) {
              console.error(`Error fetching comments for post ${post.id}:`, commentError.message);
              // Continue to next post even if comments fail
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching Reddit data for r/${subreddit} with query "${query}":`, error.message);
        // Skip this combination and continue with others
      }
    }
  }

  return results;
}
