/**
 * SEO Content Analyzer
 * Analyzes blog content for SEO optimization opportunities
 */

export interface SeoAnalysisResult {
  score: number; // 0-100
  keywordDensity: number; // percentage
  wordCount: number;
  readabilityScore: number;
  headingStructure: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasH1WithKeyword: boolean;
    h2sWithKeyword: number;
    h3sWithKeyword: number;
  };
  checks: SeoCheck[];
  suggestions: string[];
}

export interface SeoCheck {
  id: string;
  name: string;
  passed: boolean;
  importance: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  details?: string;
}

export interface ContentAnalysisInput {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string; // HTML content
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  externalSources?: { url: string; title?: string }[];
}

// Strip HTML tags for text analysis
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Count words in text
function countWords(text: string): number {
  const cleanText = stripHtml(text);
  return cleanText.split(/\s+/).filter(word => word.length > 0).length;
}

// Calculate keyword density
function calculateKeywordDensity(content: string, keyword: string): number {
  if (!keyword || keyword.trim().length === 0) return 0;
  
  const text = stripHtml(content).toLowerCase();
  const keywordLower = keyword.toLowerCase();
  const words = text.split(/\s+/);
  const keywordWords = keywordLower.split(/\s+/);
  
  let occurrences = 0;
  
  if (keywordWords.length === 1) {
    // Single word keyword
    occurrences = words.filter(w => w.includes(keywordLower)).length;
  } else {
    // Multi-word keyword (phrase)
    const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    occurrences = matches ? matches.length : 0;
  }
  
  const totalWords = words.length;
  return totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
}

// Extract headings from HTML content
function extractHeadings(html: string): { tag: string; text: string }[] {
  const headings: { tag: string; text: string }[] = [];
  const regex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      tag: match[1].toLowerCase(),
      text: stripHtml(match[2])
    });
  }
  
  return headings;
}

// Calculate Flesch-Kincaid readability score (simplified)
function calculateReadability(text: string): number {
  const cleanText = stripHtml(text);
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  // Count syllables (simplified)
  const syllableCount = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllableCount / words.length;
  
  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, score));
}

// Count syllables in a word (simplified English)
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let prevIsVowel = false;
  
  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevIsVowel) count++;
    prevIsVowel = isVowel;
  }
  
  // Adjust for silent e
  if (word.endsWith('e') && count > 1) count--;
  
  return Math.max(1, count);
}

// Check if keyword appears in text
function containsKeyword(text: string, keyword: string): boolean {
  if (!keyword) return false;
  const textLower = text.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  return textLower.includes(keywordLower);
}

// Count external links in content
function countExternalLinks(html: string): number {
  const regex = /<a[^>]+href=["']https?:\/\/[^"']+["'][^>]*>/gi;
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

// Count internal links in content
function countInternalLinks(html: string): number {
  const regex = /<a[^>]+href=["']\/[^"']+["'][^>]*>/gi;
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

// Main analysis function
export function analyzeSeoContent(input: ContentAnalysisInput): SeoAnalysisResult {
  const checks: SeoCheck[] = [];
  const suggestions: string[] = [];
  
  const { title, metaTitle, metaDescription, content, primaryKeyword, secondaryKeywords, externalSources } = input;
  
  // Word count
  const wordCount = countWords(content);
  
  // Keyword density
  const keywordDensity = primaryKeyword ? calculateKeywordDensity(content, primaryKeyword) : 0;
  
  // Readability
  const readabilityScore = calculateReadability(content);
  
  // Extract headings
  const headings = extractHeadings(content);
  const h1s = headings.filter(h => h.tag === 'h1');
  const h2s = headings.filter(h => h.tag === 'h2');
  const h3s = headings.filter(h => h.tag === 'h3');
  
  // Check if headings contain keyword
  const hasH1WithKeyword = primaryKeyword ? h1s.some(h => containsKeyword(h.text, primaryKeyword)) : false;
  const h2sWithKeyword = primaryKeyword ? h2s.filter(h => containsKeyword(h.text, primaryKeyword)).length : 0;
  const h3sWithKeyword = primaryKeyword ? h3s.filter(h => containsKeyword(h.text, primaryKeyword)).length : 0;
  
  // Links
  const externalLinkCount = countExternalLinks(content);
  const internalLinkCount = countInternalLinks(content);
  
  // =====================
  // SEO CHECKS
  // =====================
  
  // 1. Title contains keyword
  checks.push({
    id: 'title-keyword',
    name: 'Primair keyword in titel',
    passed: primaryKeyword ? containsKeyword(title, primaryKeyword) : false,
    importance: 'critical',
    message: primaryKeyword 
      ? (containsKeyword(title, primaryKeyword) 
        ? `✓ Titel bevat "${primaryKeyword}"` 
        : `✗ Titel mist het keyword "${primaryKeyword}"`)
      : '? Geen primair keyword gedefinieerd',
  });
  
  // 2. Meta title length
  const metaTitleLen = (metaTitle || title).length;
  checks.push({
    id: 'meta-title-length',
    name: 'Meta titel lengte (50-65 tekens)',
    passed: metaTitleLen >= 50 && metaTitleLen <= 65,
    importance: 'high',
    message: `Meta titel: ${metaTitleLen} tekens`,
    details: metaTitleLen < 50 ? 'Te kort - voeg meer beschrijving toe' : metaTitleLen > 65 ? 'Te lang - wordt afgeknipt in Google' : 'Perfect!'
  });
  
  // 3. Meta description length
  const metaDescLen = (metaDescription || '').length;
  checks.push({
    id: 'meta-description-length',
    name: 'Meta beschrijving lengte (150-160 tekens)',
    passed: metaDescLen >= 150 && metaDescLen <= 160,
    importance: 'high',
    message: `Meta beschrijving: ${metaDescLen} tekens`,
    details: metaDescLen < 150 ? 'Te kort - voeg meer details toe' : metaDescLen > 160 ? 'Te lang - wordt afgeknipt' : 'Perfect!'
  });
  
  // 4. Meta description contains keyword
  checks.push({
    id: 'meta-description-keyword',
    name: 'Keyword in meta beschrijving',
    passed: primaryKeyword && metaDescription ? containsKeyword(metaDescription, primaryKeyword) : false,
    importance: 'high',
    message: primaryKeyword 
      ? (metaDescription && containsKeyword(metaDescription, primaryKeyword)
        ? `✓ Meta beschrijving bevat "${primaryKeyword}"`
        : `✗ Meta beschrijving mist "${primaryKeyword}"`)
      : '? Geen primair keyword'
  });
  
  // 5. H1 contains keyword
  checks.push({
    id: 'h1-keyword',
    name: 'H1 bevat primair keyword',
    passed: hasH1WithKeyword,
    importance: 'critical',
    message: hasH1WithKeyword 
      ? '✓ H1 bevat het primaire keyword'
      : '✗ H1 mist het primaire keyword'
  });
  
  // 6. H2 structure
  checks.push({
    id: 'h2-structure',
    name: 'H2 koppen met keywords',
    passed: h2sWithKeyword >= 2,
    importance: 'medium',
    message: `${h2sWithKeyword}/${h2s.length} H2s bevatten keyword`,
    details: `Minimaal 2 H2s moeten het keyword bevatten`
  });
  
  // 7. Keyword density (1-2% is optimal)
  checks.push({
    id: 'keyword-density',
    name: 'Keyword density (1-2%)',
    passed: keywordDensity >= 1 && keywordDensity <= 2,
    importance: 'high',
    message: `Keyword density: ${keywordDensity.toFixed(2)}%`,
    details: keywordDensity < 1 
      ? 'Te laag - voeg keyword meer toe' 
      : keywordDensity > 2 
        ? 'Te hoog - risico op keyword stuffing' 
        : 'Perfect!'
  });
  
  // 8. Word count
  checks.push({
    id: 'word-count',
    name: 'Woord aantal (min 1500)',
    passed: wordCount >= 1500,
    importance: 'medium',
    message: `${wordCount} woorden`,
    details: wordCount < 1500 ? 'Langere content rankt vaak beter' : 'Goede lengte!'
  });
  
  // 9. Internal links
  checks.push({
    id: 'internal-links',
    name: 'Interne links (min 3)',
    passed: internalLinkCount >= 3,
    importance: 'high',
    message: `${internalLinkCount} interne links`,
    details: internalLinkCount < 3 ? 'Voeg meer interne links toe' : 'Goed!'
  });
  
  // 10. External/Source links
  checks.push({
    id: 'external-links',
    name: 'Externe bronnen (2-5)',
    passed: externalLinkCount >= 2 && externalLinkCount <= 5,
    importance: 'medium',
    message: `${externalLinkCount} externe links`,
    details: externalLinkCount < 2 
      ? 'Voeg betrouwbare bronnen toe voor autoriteit' 
      : externalLinkCount > 5 
        ? 'Mogelijk te veel externe links' 
        : 'Perfect!'
  });
  
  // 11. Readability
  checks.push({
    id: 'readability',
    name: 'Leesbaarheid (Flesch score)',
    passed: readabilityScore >= 50,
    importance: 'medium',
    message: `Readability score: ${readabilityScore.toFixed(0)}`,
    details: readabilityScore < 50 ? 'Tekst kan eenvoudiger' : readabilityScore > 70 ? 'Zeer leesbaar!' : 'Acceptabel'
  });
  
  // 12. First paragraph contains keyword
  const firstParagraphMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const firstParagraph = firstParagraphMatch ? stripHtml(firstParagraphMatch[1]) : '';
  const firstParaHasKeyword = primaryKeyword ? containsKeyword(firstParagraph, primaryKeyword) : false;
  
  checks.push({
    id: 'first-paragraph-keyword',
    name: 'Keyword in eerste alinea',
    passed: firstParaHasKeyword,
    importance: 'high',
    message: firstParaHasKeyword 
      ? '✓ Eerste alinea bevat keyword'
      : '✗ Voeg keyword toe aan eerste alinea'
  });
  
  // =====================
  // GENERATE SUGGESTIONS
  // =====================
  
  const failedChecks = checks.filter(c => !c.passed);
  
  failedChecks.forEach(check => {
    switch (check.id) {
      case 'title-keyword':
        suggestions.push(`Voeg "${primaryKeyword}" toe aan de titel`);
        break;
      case 'h1-keyword':
        suggestions.push(`Zorg dat de H1 (titel) "${primaryKeyword}" bevat`);
        break;
      case 'h2-structure':
        suggestions.push(`Herschrijf H2 koppen om "${primaryKeyword}" of gerelateerde termen te bevatten`);
        break;
      case 'keyword-density':
        if (keywordDensity < 1) {
          suggestions.push(`Voeg "${primaryKeyword}" nog ${Math.ceil((wordCount * 0.01) - (wordCount * keywordDensity / 100))}x toe`);
        } else if (keywordDensity > 2) {
          suggestions.push(`Verminder gebruik van "${primaryKeyword}" om keyword stuffing te voorkomen`);
        }
        break;
      case 'internal-links':
        suggestions.push('Voeg meer interne links toe naar gerelateerde content');
        break;
      case 'external-links':
        if (externalSources && externalSources.length > 0) {
          suggestions.push(`Gebruik ${Math.min(3, externalSources.length)} bronnen als externe links`);
        } else {
          suggestions.push('Voeg 2-3 externe links toe naar betrouwbare bronnen');
        }
        break;
      case 'first-paragraph-keyword':
        suggestions.push(`Begin de eerste alinea met "${primaryKeyword}"`);
        break;
    }
  });
  
  // =====================
  // CALCULATE SCORE
  // =====================
  
  let score = 0;
  const weights = {
    critical: 20,
    high: 15,
    medium: 10,
    low: 5
  };
  
  let maxScore = 0;
  checks.forEach(check => {
    const weight = weights[check.importance];
    maxScore += weight;
    if (check.passed) score += weight;
  });
  
  const finalScore = Math.round((score / maxScore) * 100);
  
  return {
    score: finalScore,
    keywordDensity,
    wordCount,
    readabilityScore,
    headingStructure: {
      h1Count: h1s.length,
      h2Count: h2s.length,
      h3Count: h3s.length,
      hasH1WithKeyword,
      h2sWithKeyword,
      h3sWithKeyword
    },
    checks,
    suggestions
  };
}

// Export helper functions for individual use
export { stripHtml, countWords, calculateKeywordDensity, extractHeadings, countExternalLinks, countInternalLinks };
