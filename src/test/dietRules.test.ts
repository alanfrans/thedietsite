import { describe, it, expect } from 'vitest';
import { dietRules, getRulesForDiet, evaluateItem, checkDailyLimits, calculateDailyMacros } from '../engines/dietRules';
import type { InventoryItem, UserProfile, DietaryHistoryEntry } from '../types';

// Helper to create a test item
function createTestItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'test-item-1',
    itemName: 'Test Food',
    quantity: 1,
    category: 'pantry',
    fiberG: 5,
    fatG: 10,
    carbsG: 15,
    proteinG: 20,
    lastUpdated: new Date().toISOString(),
    ...overrides
  };
}

// Helper to create a test profile
function createTestProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: 'test-user',
    dietType: 'mediterranean',
    dietaryGoals: ['weight-maintenance'],
    eatingSchedule: {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      snacks: ['10:00', '15:00']
    },
    allergies: [],
    intolerances: [],
    unitsPreference: 'metric',
    ...overrides
  };
}

describe('Diet Rules Engine', () => {
  describe('dietRules', () => {
    it('should have at least 10 diet types covered', () => {
      const dietTypes = new Set(dietRules.map(r => r.dietType));
      expect(dietTypes.size).toBeGreaterThanOrEqual(10);
    });

    it('should have rules for all major diet types', () => {
      const requiredDiets = ['keto', 'mediterranean', 'vegan', 'vegetarian', 'paleo', 'low-glycemic', 'high-protein'];
      requiredDiets.forEach(diet => {
        const rulesForDiet = dietRules.filter(r => r.dietType === diet);
        expect(rulesForDiet.length, `Diet ${diet} should have rules`).toBeGreaterThan(0);
      });
    });
  });

  describe('getRulesForDiet', () => {
    it('should return rules for a specific diet type', () => {
      const ketoRules = getRulesForDiet('keto');
      expect(ketoRules.length).toBeGreaterThan(0);
      ketoRules.forEach(rule => {
        expect(rule.dietType).toBe('keto');
      });
    });

    it('should return empty array for unknown diet type', () => {
      // @ts-expect-error Testing with invalid diet type
      const rules = getRulesForDiet('unknown-diet');
      expect(rules).toEqual([]);
    });
  });

  describe('evaluateItem', () => {
    it('should pass low-carb items for keto diet', () => {
      const item = createTestItem({ carbsG: 3, fatG: 20, proteinG: 15 });
      const profile = createTestProfile({ dietType: 'keto' });
      
      const result = evaluateItem({
        item,
        currentTime: new Date(),
        profile,
        todayHistory: []
      });

      expect(result.passed).toBe(true);
    });

    it('should fail vegetarian items containing meat', () => {
      const item = createTestItem({ category: 'meat', itemName: 'Chicken Breast' });
      const profile = createTestProfile({ dietType: 'vegetarian' });
      
      const result = evaluateItem({
        item,
        currentTime: new Date(),
        profile,
        todayHistory: []
      });

      expect(result.passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should pass vegan items for vegan diet', () => {
      const item = createTestItem({ category: 'produce', itemName: 'Broccoli' });
      const profile = createTestProfile({ dietType: 'vegan' });
      
      const result = evaluateItem({
        item,
        currentTime: new Date(),
        profile,
        todayHistory: []
      });

      expect(result.passed).toBe(true);
    });

    it('should fail dairy items for vegan diet', () => {
      const item = createTestItem({ category: 'dairy', itemName: 'Milk' });
      const profile = createTestProfile({ dietType: 'vegan' });
      
      const result = evaluateItem({
        item,
        currentTime: new Date(),
        profile,
        todayHistory: []
      });

      expect(result.passed).toBe(false);
    });

    it('should provide positive messages for diet-appropriate items', () => {
      const item = createTestItem({ category: 'produce', itemName: 'Spinach', fiberG: 5 });
      const profile = createTestProfile({ dietType: 'mediterranean' });
      
      const result = evaluateItem({
        item,
        currentTime: new Date(),
        profile,
        todayHistory: []
      });

      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('checkDailyLimits', () => {
    it('should warn when approaching carb limit on keto', () => {
      const item = createTestItem({ carbsG: 30 });
      const history: DietaryHistoryEntry[] = [
        {
          id: 'h1',
          timestamp: new Date().toISOString(),
          itemName: 'Previous meal',
          quantityConsumed: 1,
          macrosConsumed: { fiberG: 0, fatG: 10, carbsG: 25, proteinG: 20 },
          dietaryRuleViolations: [],
          glucoseRelevanceFlag: false
        }
      ];
      
      const result = checkDailyLimits(item, history, 'keto');
      
      expect(result.fits).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('carb limit');
    });

    it('should pass when within daily limits', () => {
      const item = createTestItem({ carbsG: 5 });
      const history: DietaryHistoryEntry[] = [
        {
          id: 'h1',
          timestamp: new Date().toISOString(),
          itemName: 'Previous meal',
          quantityConsumed: 1,
          macrosConsumed: { fiberG: 0, fatG: 10, carbsG: 10, proteinG: 20 },
          dietaryRuleViolations: [],
          glucoseRelevanceFlag: false
        }
      ];
      
      const result = checkDailyLimits(item, history, 'keto');
      
      expect(result.fits).toBe(true);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('calculateDailyMacros', () => {
    it('should sum up macros from history', () => {
      const history: DietaryHistoryEntry[] = [
        {
          id: 'h1',
          timestamp: new Date().toISOString(),
          itemName: 'Breakfast',
          quantityConsumed: 1,
          macrosConsumed: { fiberG: 5, fatG: 10, carbsG: 20, proteinG: 15, calories: 200 },
          dietaryRuleViolations: [],
          glucoseRelevanceFlag: false
        },
        {
          id: 'h2',
          timestamp: new Date().toISOString(),
          itemName: 'Lunch',
          quantityConsumed: 1,
          macrosConsumed: { fiberG: 8, fatG: 15, carbsG: 30, proteinG: 25, calories: 350 },
          dietaryRuleViolations: [],
          glucoseRelevanceFlag: false
        }
      ];

      const result = calculateDailyMacros(history);

      expect(result.totalFiber).toBe(13);
      expect(result.totalFat).toBe(25);
      expect(result.totalCarbs).toBe(50);
      expect(result.totalProtein).toBe(40);
      expect(result.totalCalories).toBe(550);
    });

    it('should return zeros for empty history', () => {
      const result = calculateDailyMacros([]);

      expect(result.totalFiber).toBe(0);
      expect(result.totalFat).toBe(0);
      expect(result.totalCarbs).toBe(0);
      expect(result.totalProtein).toBe(0);
      expect(result.totalCalories).toBe(0);
    });
  });
});
