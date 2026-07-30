/**
 * Text Preprocessing Module
 */

/**
 * Normalizes a text string by trimming, collapsing whitespace, and removing excessive punctuation.
 * @param {string} text - The raw text
 * @returns {string} Cleaned text
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/([.,!?])\1+/g, '$1'); // Remove excessive punctuation
}

/**
 * Checks if text is spam, noise, or auto-generated.
 * @param {string} text - The text to check
 * @returns {boolean} True if spam/noise, false otherwise
 */
export function isSpam(text) {
  if (!text) return true;
  
  const trimmed = text.trim();
  
  // Rule 1: Text shorter than 15 characters
  if (trimmed.length < 15) return true;
  
  // Rule 2: Text that's only emojis/symbols (no letters or numbers)
  if (!/[a-zA-Z0-9]/.test(trimmed)) return true;
  
  // Rule 3: Text that's only numbers
  if (/^\d+$/.test(trimmed.replace(/[\s.,-]/g, ''))) return true;
  
  // Rule 4: Common short/generic phrases often auto-generated
  const lowerText = trimmed.toLowerCase();
  const genericPhrases = ['good', 'nice', 'ok', 'okay', 'great', 'awesome', 'bad', 'terrible', 'very good', 'too good', 'not bad'];
  
  // If the text is *exactly* one of these generic phrases (ignoring punctuation)
  const cleanLower = lowerText.replace(/[^a-z]/g, '');
  const isGeneric = genericPhrases.some(phrase => phrase.replace(/\s/g, '') === cleanLower);
  if (isGeneric) return true;
  
  return false;
}

/**
 * Simple heuristic check to detect if text is likely English.
 * Checks if the majority of characters are ASCII letters.
 * @param {string} text - The text to check
 * @returns {'en' | 'other'} 'en' if likely English, otherwise 'other'
 */
export function detectLanguage(text) {
  if (!text) return 'other';
  // Strip spaces, numbers, and common punctuation for checking
  const lettersOnly = text.replace(/[^a-zA-Z]/g, '');
  const allChars = text.replace(/\s+/g, '');
  
  if (allChars.length === 0) return 'other';
  
  const ratio = lettersOnly.length / allChars.length;
  // If more than 50% of non-whitespace characters are standard English letters, assume 'en'
  return ratio > 0.5 ? 'en' : 'other';
}

/**
 * Preprocesses an array of feedback objects.
 * Filters spam/noise, normalizes text, removes exact duplicates, and ensures it's in English.
 * @param {Array<Object>} feedbackArray - Raw feedback objects
 * @returns {Array<Object>} Cleaned array of feedback objects
 */
export function preprocessFeedback(feedbackArray) {
  if (!Array.isArray(feedbackArray)) return [];
  
  const seenTexts = new Set();
  const cleanedFeedback = [];
  
  for (const item of feedbackArray) {
    if (!item || !item.text) continue;
    
    // Normalize text
    const normalizedText = normalizeText(item.text);
    
    // Check if spam
    if (isSpam(normalizedText)) continue;
    
    // Check language
    if (detectLanguage(normalizedText) !== 'en') continue;
    
    // Deduplicate by text content (case-insensitive)
    const lowerText = normalizedText.toLowerCase();
    if (seenTexts.has(lowerText)) continue;
    seenTexts.add(lowerText);
    
    // Assign normalized text back to item
    const cleanedItem = { ...item, text: normalizedText };
    cleanedFeedback.push(cleanedItem);
  }
  
  return cleanedFeedback;
}
