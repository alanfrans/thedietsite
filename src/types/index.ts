// User Profile Types
export type DietType =
  | 'low-glycemic'
  | 'mediterranean'
  | 'keto'
  | 'paleo'
  | 'whole30'
  | 'intermittent-fasting'
  | 'dash'
  | 'vegan'
  | 'vegetarian'
  | 'high-protein'
  | 'low-fodmap'
  | 'flexitarian';

export type DietaryGoal = 'glucose-stability' | 'weight-loss' | 'weight-maintenance' | 'muscle-gain' | 'heart-health';

export type UnitsPreference = 'metric' | 'imperial';

export interface UserProfile {
  userId: string;
  dietType: DietType;
  dietaryGoals: DietaryGoal[];
  eatingSchedule: {
    breakfast: string; // e.g., "07:00"
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  allergies: string[];
  intolerances: string[];
  unitsPreference: UnitsPreference;
  fastingWindow?: {
    start: string; // e.g., "20:00"
    end: string; // e.g., "12:00"
  };
}

// Inventory Types
export type FoodCategory = 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'beverages' | 'condiments' | 'grains' | 'snacks';

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number | 'unknown';
  unit?: string;
  category: FoodCategory;
  fiberG: number;
  fatG: number;
  carbsG: number;
  proteinG: number;
  calories?: number;
  glycemicIndex?: number;
  servingSize?: string;
  expirationDate?: string;
  lastUpdated: string;
}

// Dietary History Types
export interface DietaryHistoryEntry {
  id: string;
  timestamp: string;
  itemName: string;
  itemId?: string;
  quantityConsumed: number;
  unit?: string;
  macrosConsumed: {
    fiberG: number;
    fatG: number;
    carbsG: number;
    proteinG: number;
    calories?: number;
  };
  dietaryRuleViolations: string[];
  glucoseRelevanceFlag: boolean;
}

// Diet Rule Types
export interface DietRule {
  id: string;
  dietType: DietType;
  ruleType: 'allowed' | 'restricted' | 'time-based' | 'sequencing' | 'macro-threshold' | 'daily-limit';
  description: string;
  condition: (params: DietRuleParams) => boolean;
  message: string;
}

export interface DietRuleParams {
  item: InventoryItem;
  currentTime: Date;
  profile: UserProfile;
  todayHistory: DietaryHistoryEntry[];
}

// Meal Suggestion Types
export interface MealSuggestion {
  item: InventoryItem;
  reason: string;
  score: number;
  warnings: string[];
}

// CSV Import Types
export interface CSVInventoryItem {
  item_name: string;
  quantity: string;
  unit: string;
  fiber_g: string;
  fat_g: string;
  carbs_g: string;
  protein_g: string;
  category: string;
}
