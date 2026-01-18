import type { DietType, DietRule, DietRuleParams, InventoryItem } from '../types';

// Constants for category checks
const NON_VEGAN_CATEGORIES = ['meat', 'dairy'];

// Helper functions for rule evaluation
const isHighProtein = (item: InventoryItem): boolean => item.proteinG >= 15;
const isHighFat = (item: InventoryItem): boolean => item.fatG >= 10;
const isVegetarian = (item: InventoryItem): boolean => item.category !== 'meat';
const isVegan = (item: InventoryItem): boolean => 
  !NON_VEGAN_CATEGORIES.includes(item.category);
const isLowGI = (item: InventoryItem): boolean => 
  item.glycemicIndex === undefined || item.glycemicIndex <= 55;
const isHighFiber = (item: InventoryItem): boolean => item.fiberG >= 3;

// Foods commonly restricted by diet type
const KETO_RESTRICTED = ['bread', 'pasta', 'rice', 'potato', 'sugar', 'fruit juice', 'candy', 'soda'];
const PALEO_RESTRICTED = ['bread', 'pasta', 'rice', 'beans', 'peanut', 'dairy', 'processed'];
const WHOLE30_RESTRICTED = ['sugar', 'alcohol', 'grain', 'legume', 'dairy', 'soy', 'carrageenan', 'sulfites'];
const LOW_FODMAP_RESTRICTED = ['garlic', 'onion', 'wheat', 'apple', 'pear', 'watermelon', 'honey', 'milk', 'beans'];
const DASH_ENCOURAGED = ['vegetable', 'fruit', 'whole grain', 'lean protein', 'nuts', 'beans'];

const containsAny = (name: string, keywords: string[]): boolean => {
  const lowerName = name.toLowerCase();
  return keywords.some(k => lowerName.includes(k.toLowerCase()));
};

// Diet Rules Collection
export const dietRules: DietRule[] = [
  // Low-Glycemic Diet Rules
  {
    id: 'low-gi-allowed',
    dietType: 'low-glycemic',
    ruleType: 'allowed',
    description: 'Prefer foods with low glycemic index',
    condition: ({ item }) => isLowGI(item),
    message: 'Great choice for blood sugar stability'
  },
  {
    id: 'low-gi-fiber',
    dietType: 'low-glycemic',
    ruleType: 'allowed',
    description: 'High fiber foods help stabilize glucose',
    condition: ({ item }) => isHighFiber(item),
    message: 'High fiber content helps with glucose control'
  },

  // Keto Diet Rules
  {
    id: 'keto-low-carb',
    dietType: 'keto',
    ruleType: 'macro-threshold',
    description: 'Foods must be very low in carbohydrates',
    condition: ({ item }) => item.carbsG <= 5 || (item.carbsG <= 10 && item.fiberG >= item.carbsG * 0.3),
    message: 'Fits keto carb limits'
  },
  {
    id: 'keto-high-fat',
    dietType: 'keto',
    ruleType: 'allowed',
    description: 'Prefer high-fat foods',
    condition: ({ item }) => isHighFat(item),
    message: 'Good fat source for keto'
  },
  {
    id: 'keto-restricted',
    dietType: 'keto',
    ruleType: 'restricted',
    description: 'Avoid high-carb foods',
    condition: ({ item }) => !containsAny(item.itemName, KETO_RESTRICTED),
    message: 'This food may be too high in carbs for keto'
  },

  // Mediterranean Diet Rules
  {
    id: 'med-vegetables',
    dietType: 'mediterranean',
    ruleType: 'allowed',
    description: 'Emphasize vegetables',
    condition: ({ item }) => item.category === 'produce',
    message: 'Great vegetable choice for Mediterranean diet'
  },
  {
    id: 'med-healthy-fats',
    dietType: 'mediterranean',
    ruleType: 'allowed',
    description: 'Include healthy fats',
    condition: ({ item }) => containsAny(item.itemName, ['olive', 'avocado', 'nuts', 'fish', 'salmon']),
    message: 'Excellent source of healthy fats'
  },

  // Paleo Diet Rules
  {
    id: 'paleo-whole-foods',
    dietType: 'paleo',
    ruleType: 'allowed',
    description: 'Emphasize whole, unprocessed foods',
    condition: ({ item }) => ['produce', 'meat'].includes(item.category),
    message: 'Whole food appropriate for Paleo'
  },
  {
    id: 'paleo-restricted',
    dietType: 'paleo',
    ruleType: 'restricted',
    description: 'Avoid grains, legumes, dairy, and processed foods',
    condition: ({ item }) => !containsAny(item.itemName, PALEO_RESTRICTED),
    message: 'This food is not typically allowed on Paleo'
  },

  // Whole30 Diet Rules
  {
    id: 'whole30-restricted',
    dietType: 'whole30',
    ruleType: 'restricted',
    description: 'No sugar, alcohol, grains, legumes, soy, or dairy',
    condition: ({ item }) => !containsAny(item.itemName, WHOLE30_RESTRICTED),
    message: 'This food is not allowed on Whole30'
  },
  {
    id: 'whole30-whole-foods',
    dietType: 'whole30',
    ruleType: 'allowed',
    description: 'Eat whole, unprocessed foods',
    condition: ({ item }) => ['produce', 'meat'].includes(item.category),
    message: 'Whole food appropriate for Whole30'
  },

  // Intermittent Fasting Rules
  {
    id: 'if-fasting-window',
    dietType: 'intermittent-fasting',
    ruleType: 'time-based',
    description: 'Check if currently in eating window',
    condition: ({ currentTime, profile }) => {
      if (!profile.fastingWindow) return true;
      const now = currentTime.getHours() * 60 + currentTime.getMinutes();
      const start = parseInt(profile.fastingWindow.start.split(':')[0]) * 60 + parseInt(profile.fastingWindow.start.split(':')[1]);
      const end = parseInt(profile.fastingWindow.end.split(':')[0]) * 60 + parseInt(profile.fastingWindow.end.split(':')[1]);
      
      // Handle overnight fasting (e.g., 20:00 to 12:00)
      if (start > end) {
        return now < start && now >= end;
      }
      return now >= end && now < start;
    },
    message: 'You are currently in your fasting window'
  },

  // DASH Diet Rules
  {
    id: 'dash-low-sodium',
    dietType: 'dash',
    ruleType: 'allowed',
    description: 'Emphasize low-sodium, nutrient-rich foods',
    condition: ({ item }) => containsAny(item.itemName, DASH_ENCOURAGED) || item.category === 'produce',
    message: 'Heart-healthy choice for DASH diet'
  },
  {
    id: 'dash-vegetables',
    dietType: 'dash',
    ruleType: 'allowed',
    description: 'Emphasize fruits and vegetables',
    condition: ({ item }) => item.category === 'produce' && isHighFiber(item),
    message: 'Excellent produce choice for DASH'
  },

  // Vegan Diet Rules
  {
    id: 'vegan-no-animal',
    dietType: 'vegan',
    ruleType: 'restricted',
    description: 'No animal products',
    condition: ({ item }) => isVegan(item),
    message: 'This food contains animal products'
  },
  {
    id: 'vegan-protein',
    dietType: 'vegan',
    ruleType: 'allowed',
    description: 'Plant-based protein sources',
    condition: ({ item }) => isVegan(item) && item.proteinG >= 5,
    message: 'Good plant-based protein source'
  },

  // Vegetarian Diet Rules
  {
    id: 'vegetarian-no-meat',
    dietType: 'vegetarian',
    ruleType: 'restricted',
    description: 'No meat',
    condition: ({ item }) => isVegetarian(item),
    message: 'This food contains meat'
  },

  // High-Protein Diet Rules
  {
    id: 'high-protein-priority',
    dietType: 'high-protein',
    ruleType: 'allowed',
    description: 'Prioritize high-protein foods',
    condition: ({ item }) => isHighProtein(item),
    message: 'Excellent protein source'
  },
  {
    id: 'high-protein-sequence',
    dietType: 'high-protein',
    ruleType: 'sequencing',
    description: 'Eat protein before carbs',
    condition: ({ item, todayHistory }) => {
      if (!isHighProtein(item)) return true;
      // Check if carbs were eaten before protein today
      const carbMeals = todayHistory.filter(h => h.macrosConsumed.carbsG > 15);
      const proteinMeals = todayHistory.filter(h => h.macrosConsumed.proteinG > 15);
      const lastCarbMeal = carbMeals[carbMeals.length - 1];
      const lastProteinMeal = proteinMeals[proteinMeals.length - 1];
      if (!lastCarbMeal) return true;
      if (!lastProteinMeal) return false; // Carbs eaten, no protein yet
      return new Date(lastProteinMeal.timestamp) < new Date(lastCarbMeal.timestamp);
    },
    message: 'Try to eat protein before carbs for better satiety'
  },

  // Low-FODMAP Diet Rules
  {
    id: 'low-fodmap-restricted',
    dietType: 'low-fodmap',
    ruleType: 'restricted',
    description: 'Avoid high-FODMAP foods',
    condition: ({ item }) => !containsAny(item.itemName, LOW_FODMAP_RESTRICTED),
    message: 'This food may be high in FODMAPs'
  },

  // Flexitarian Diet Rules
  {
    id: 'flexitarian-mostly-plants',
    dietType: 'flexitarian',
    ruleType: 'allowed',
    description: 'Emphasize plant-based foods with occasional meat',
    condition: ({ item, todayHistory }) => {
      if (item.category !== 'meat') return true;
      // Limit meat consumption
      const meatMealsToday = todayHistory.filter(h => 
        h.itemName.toLowerCase().includes('meat') || 
        h.itemName.toLowerCase().includes('chicken') ||
        h.itemName.toLowerCase().includes('beef')
      ).length;
      return meatMealsToday < 1;
    },
    message: 'Consider a plant-based alternative'
  }
];

/**
 * Get all rules for a specific diet type
 */
export function getRulesForDiet(dietType: DietType): DietRule[] {
  return dietRules.filter(rule => rule.dietType === dietType);
}

/**
 * Evaluate all rules for an item against the user's diet
 */
export function evaluateItem(params: DietRuleParams): { passed: boolean; messages: string[]; warnings: string[] } {
  const rules = getRulesForDiet(params.profile.dietType);
  const messages: string[] = [];
  const warnings: string[] = [];
  let passed = true;

  for (const rule of rules) {
    const result = rule.condition(params);
    
    if (rule.ruleType === 'restricted' || rule.ruleType === 'time-based') {
      if (!result) {
        passed = false;
        warnings.push(rule.message);
      }
    } else if (rule.ruleType === 'allowed' && result) {
      messages.push(rule.message);
    } else if (rule.ruleType === 'sequencing' && !result) {
      warnings.push(rule.message);
    }
  }

  return { passed, messages, warnings };
}

/**
 * Calculate daily macro totals from history
 */
export function calculateDailyMacros(history: DietRuleParams['todayHistory']): {
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  totalFiber: number;
  totalCalories: number;
} {
  return history.reduce((acc, entry) => ({
    totalCarbs: acc.totalCarbs + entry.macrosConsumed.carbsG,
    totalProtein: acc.totalProtein + entry.macrosConsumed.proteinG,
    totalFat: acc.totalFat + entry.macrosConsumed.fatG,
    totalFiber: acc.totalFiber + entry.macrosConsumed.fiberG,
    totalCalories: acc.totalCalories + (entry.macrosConsumed.calories || 0)
  }), { totalCarbs: 0, totalProtein: 0, totalFat: 0, totalFiber: 0, totalCalories: 0 });
}

/**
 * Check if item fits within remaining daily limits
 */
export function checkDailyLimits(
  item: InventoryItem,
  todayHistory: DietRuleParams['todayHistory'],
  dietType: DietType
): { fits: boolean; warnings: string[] } {
  const dailyMacros = calculateDailyMacros(todayHistory);
  const warnings: string[] = [];
  let fits = true;

  // Diet-specific daily limits
  const limits: Record<DietType, { carbs?: number; protein?: number; fat?: number }> = {
    'keto': { carbs: 50 },
    'low-glycemic': { carbs: 130 },
    'high-protein': { protein: 150 }, // minimum
    'mediterranean': {},
    'paleo': {},
    'whole30': {},
    'intermittent-fasting': {},
    'dash': {},
    'vegan': {},
    'vegetarian': {},
    'low-fodmap': {},
    'flexitarian': {}
  };

  const dietLimits = limits[dietType];

  if (dietLimits.carbs && dailyMacros.totalCarbs + item.carbsG > dietLimits.carbs) {
    fits = false;
    warnings.push(`This would exceed your daily carb limit of ${dietLimits.carbs}g`);
  }

  return { fits, warnings };
}
