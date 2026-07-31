import { generateJSON } from './gemini.js';
import { CLASSIFY_SYSTEM_PROMPT, buildClassifyUserPrompt } from './prompts/classify.js';
import { CLUSTER_SYSTEM_PROMPT, buildClusterUserPrompt } from './prompts/cluster.js';

/**
 * Classifies a batch of feedback objects
 * @param {Array<Object>} feedbackBatch - Array of feedback objects (max 25)
 * @returns {Promise<Array<Object>>} - Array of classified feedback results
 */
export async function classifyBatch(feedbackBatch) {
  if (!feedbackBatch || feedbackBatch.length === 0) return [];
  
  const prompt = buildClassifyUserPrompt(feedbackBatch);
  const response = await generateJSON(prompt, CLASSIFY_SYSTEM_PROMPT);
  
  // Normalize array-like responses
  return Array.isArray(response) ? response : (response.results || response.data || []);
}

/**
 * Clusters classified feedback into themes
 * @param {Array<Object>} classifiedFeedback - Array of classified feedback
 * @returns {Promise<Array<Object>>} - Array of theme objects
 */
export async function clusterThemes(classifiedFeedback) {
  if (!classifiedFeedback || classifiedFeedback.length === 0) return [];
  
  const prompt = buildClusterUserPrompt(classifiedFeedback);
  const response = await generateJSON(prompt, CLUSTER_SYSTEM_PROMPT);
  
  // Normalize array-like responses
  return Array.isArray(response) ? response : (response.themes || response.results || []);
}

/**
 * Orchestrates the processing of feedback in batches and clustering
 * @param {Array<Object>} feedbackArray - All feedback to process
 * @param {number} batchSize - Number of items per batch (default 25)
 * @returns {Promise<{classified: Array<Object>, themes: Array<Object>}>}
 */
export async function processFeedbackInBatches(feedbackArray, batchSize = 40) {
  const classified = [];
  const totalBatches = Math.ceil(feedbackArray.length / batchSize);
  
  console.log(`Starting processing of ${feedbackArray.length} items in ${totalBatches} batches.`);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const batch = feedbackArray.slice(start, start + batchSize);
    
    console.log(`Processing batch ${i + 1}/${totalBatches}...`);
    try {
      const results = await classifyBatch(batch);
      classified.push(...results);
      console.log(`Batch ${i + 1} completed successfully.`);
    } catch (error) {
      console.error(`Error processing batch ${i + 1}:`, error.message);
      // Skip failed batch and continue
    }
  }

  let themes = [];
  if (classified.length > 0) {
    console.log(`Clustering themes from ${classified.length} classified items...`);
    try {
      themes = await clusterThemes(classified);
      console.log('Clustering completed successfully.');
    } catch (error) {
      console.error('Error clustering themes:', error.message);
    }
  }

  return { classified, themes };
}
