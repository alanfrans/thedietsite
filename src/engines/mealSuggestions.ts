import type { InventoryItem, UserProfile, DietaryHistoryEntry, MealSuggestion } from '../types';
import { evaluateItem, checkDailyLimits } from './dietRules';

/**
 * Calculate a score for an inventory item based on multiple factors
 */
function calculateSuggestionScore(
  item: InventoryItem,
  profile: UserProfile,
  todayHistory: DietaryHistoryEntry[],
  currentTime: Date
): { score: number; reasons: string[]; warnings: string[] } {
  let score = 50; // Base score
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Evaluate against diet rules
  const ruleResult = evaluateItem({
    item,
    currentTime,
    profile,
    todayHistory
  });

  if (!ruleResult.passed) {
    score -= 40; // Heavy penalty for rule violations
    warnings.push(...ruleResult.warnings);
  } else {
    score += 20;
    reasons.push(...ruleResult.messages);
  }

  // 2. Check daily limits
  const limitResult = checkDailyLimits(item, todayHistory, profile.dietType);
  if (!limitResult.fits) {
    score -= 30;
    warnings.push(...limitResult.warnings);
  }

  // 3. Expiration urgency (eat soon items get priority)
  if (item.expirationDate) {
    const daysUntilExpiry = (new Date(item.expirationDate).getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 0) {
      score -= 100; // Expired
      warnings.push('This item has expired');
    } else if (daysUntilExpiry <= 2) {
      score += 25;
      reasons.push('Eat soon - expiring in ' + Math.ceil(daysUntilExpiry) + ' days');
    } else if (daysUntilExpiry <= 5) {
      score += 10;
      reasons.push('Consider eating soon - expires in ' + Math.ceil(daysUntilExpiry) + ' days');
    }
  }

  // 4. Glucose stability bonus (for relevant diets)
  if (profile.dietaryGoals.includes('glucose-stability')) {
    if (item.glycemicIndex !== undefined && item.glycemicIndex <= 55) {
      score += 15;
      reasons.push('Low glycemic index - good for blood sugar');
    }
    if (item.fiberG >= 3) {
      score += 10;
      reasons.push('High fiber helps stabilize glucose');
    }
    if (item.proteinG >= 10 && item.carbsG <= 10) {
      score += 10;
      reasons.push('Protein-rich with low carbs - stabilizes glucose');
    }
  }

  // 5. Meal timing appropriateness
  const hour = currentTime.getHours();
  const isBreakfastTime = hour >= 6 && hour < 10;
  const isLunchTime = hour >= 11 && hour < 14;
  const isDinnerTime = hour >= 17 && hour < 21;
  const isSnackTime = !isBreakfastTime && !isLunchTime && !isDinnerTime;

  if (isSnackTime && item.category === 'snacks') {
    score += 10;
    reasons.push('Good snack option');
  }

  // 6. Category variety - prefer items from categories not recently eaten
  const recentCategories = todayHistory
    .slice(-3)
    .map(h => h.itemName.toLowerCase());
  
  if (!recentCategories.some(name => name.includes(item.itemName.toLowerCase()))) {
    score += 5;
  }

  // 7. Quantity available
  if (item.quantity !== 'unknown' && item.quantity > 0) {
    score += 5;
  }

  return { score: Math.max(0, Math.min(100, score)), reasons, warnings };
}

/**
 * Generate meal suggestions from inventory
 */
export function generateSuggestions(
  inventory: InventoryItem[],
  profile: UserProfile,
  todayHistory: DietaryHistoryEntry[],
  currentTime: Date = new Date()
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = [];

  for (const item of inventory) {
    // Skip items with no quantity
    if (item.quantity !== 'unknown' && item.quantity <= 0) continue;
    
    // Skip condiments from suggestions
    if (item.category === 'condiments') continue;

    const { score, reasons, warnings } = calculateSuggestionScore(
      item,
      profile,
      todayHistory,
      currentTime
    );

    // Only suggest items with reasonable scores
    if (score >= 20) {
      suggestions.push({
        item,
        reason: reasons.length > 0 ? reasons.join('. ') : 'Available in your pantry',
        score,
        warnings
      });
    }
  }

  // Sort by score (highest first)
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions;
}

/**
 * Get the top N suggestions
 */
export function getTopSuggestions(
  inventory: InventoryItem[],
  profile: UserProfile,
  todayHistory: DietaryHistoryEntry[],
  count: number = 5,
  currentTime: Date = new Date()
): MealSuggestion[] {
  return generateSuggestions(inventory, profile, todayHistory, currentTime).slice(0, count);
}

/**
 * Quick check for "What can I eat right now?"
 */
export function getQuickSuggestion(
  inventory: InventoryItem[],
  profile: UserProfile,
  todayHistory: DietaryHistoryEntry[],
  currentTime: Date = new Date()
): MealSuggestion | null {
  const suggestions = getTopSuggestions(inventory, profile, todayHistory, 1, currentTime);
  return suggestions[0] || null;
}

/**
 * Filter suggestions by category
 */
export function getSuggestionsByCategory(
  inventory: InventoryItem[],
  profile: UserProfile,
  todayHistory: DietaryHistoryEntry[],
  category: InventoryItem['category'],
  currentTime: Date = new Date()
): MealSuggestion[] {
  const allSuggestions = generateSuggestions(inventory, profile, todayHistory, currentTime);
  return allSuggestions.filter(s => s.item.category === category);
}
