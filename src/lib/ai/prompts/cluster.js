/**
 * @fileoverview Prompts for clustering classified feedback into themes.
 */

export const CLUSTER_SYSTEM_PROMPT = `You are a strategic product analyst working on Swiggy Instamart's AI-Powered Discovery Engine.
Your task is to analyze a batch of classified user reviews and group them into meaningful, actionable themes.
Aim to identify 5 to 15 distinct themes.

Each theme should answer or relate to one of the following strategic questions:
Q1: Why do users repeatedly buy from the same categories?
Q2: What prevents users from exploring new categories?
Q3: How do users discover products today?
Q4: What role do habits play in shopping behavior?
Q5: What information do users need before trying a new category?
Q6: What frustrations emerge repeatedly?
Q7: Which user segments are more likely to experiment?
Q8: What unmet needs emerge consistently?

For EACH theme, output a JSON object with the following schema:
- "label": A short, descriptive name (e.g., "Reorder Feature Creates Habit Lock-in")
- "description": A 2-3 sentence summary of the theme and its implications
- "review_ids": An array of review IDs that belong to this theme
- "review_count": The number of reviews in this theme
- "avg_sentiment": The general sentiment of the theme as a string (one of: "positive", "negative", "neutral", "mixed")
- "source_diversity": The number of unique sources (e.g., play_store, app_store, reddit) among the reviews in this theme
- "relevance": Relevance to the cross-category adoption goal (one of: "high", "medium", "low")
- "strategic_question": Which strategic question (Q1-Q8) this theme primarily relates to (e.g., "Q2")
- "representative_quotes": An array of 2-3 verbatim quotes from the reviews that best illustrate this theme

Return ONLY a JSON array containing these theme objects. Ensure valid JSON format.`;

/**
 * Builds the user prompt for clustering classified feedback.
 * @param {Array<{id: string, text: string, source: string, sentiment: string, category: string, theme_tags: string[]}>} classifiedFeedback
 * @returns {string} The formatted user prompt.
 */
export function buildClusterUserPrompt(classifiedFeedback) {
  if (!classifiedFeedback || classifiedFeedback.length === 0) {
    return 'Analyze the following 0 reviews:';
  }

  const items = classifiedFeedback
    .map(item => {
      const truncatedText = item.text && item.text.length > 200
        ? item.text.substring(0, 200) + '...'
        : (item.text || '');
      return JSON.stringify({
        id: item.id,
        source: item.source,
        sentiment: item.sentiment,
        category: item.category,
        tags: item.theme_tags,
        text: truncatedText
      });
    })
    .join('\n');

  return `Analyze the following ${classifiedFeedback.length} classified reviews about Swiggy Instamart and cluster them into themes:\n\n${items}`;
}
