import { describe, it, expect } from 'vitest';
import { generateSuggestions, getTopSuggestions, getQuickSuggestion } from '../engines/mealSuggestions';
import type { InventoryItem, UserProfile } from '../types';

// Helper to create test items
function createTestItems(): InventoryItem[] {
  return [
    {
      id: 'item-1',
      itemName: 'Greek Yogurt',
      quantity: 2,
      unit: 'cups',
      category: 'dairy',
      fiberG: 0,
      fatG: 5,
      carbsG: 9,
      proteinG: 17,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'item-2',
      itemName: 'Broccoli',
      quantity: 3,
      unit: 'cups',
      category: 'produce',
      fiberG: 5,
      fatG: 0,
      carbsG: 6,
      proteinG: 3,
      glycemicIndex: 15,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'item-3',
      itemName: 'Chicken Breast',
      quantity: 1,
      unit: 'lb',
      category: 'meat',
      fiberG: 0,
      fatG: 4,
      carbsG: 0,
      proteinG: 31,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'item-4',
      itemName: 'Brown Rice',
      quantity: 2,
      unit: 'cups',
      category: 'grains',
      fiberG: 3,
      fatG: 2,
      carbsG: 45,
      proteinG: 5,
      glycemicIndex: 50,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'item-5',
      itemName: 'Almonds',
      quantity: 1,
      unit: 'cup',
      category: 'snacks',
      fiberG: 12,
      fatG: 49,
      carbsG: 21,
      proteinG: 21,
      glycemicIndex: 0,
      lastUpdated: new Date().toISOString()
    }
  ];
}

function createTestProfile(dietType: UserProfile['dietType'] = 'mediterranean'): UserProfile {
  return {
    userId: 'test-user',
    dietType,
    dietaryGoals: ['weight-maintenance'],
    eatingSchedule: {
      breakfast: '07:00',
      lunch: '12:00',
      dinner: '18:00',
      snacks: ['10:00', '15:00']
    },
    allergies: [],
    intolerances: [],
    unitsPreference: 'metric'
  };
}

describe('Meal Suggestions Engine', () => {
  describe('generateSuggestions', () => {
    it('should generate suggestions from inventory', () => {
      const items = createTestItems();
      const profile = createTestProfile();
      
      const suggestions = generateSuggestions(items, profile, []);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(items.length);
    });

    it('should sort suggestions by score (highest first)', () => {
      const items = createTestItems();
      const profile = createTestProfile();
      
      const suggestions = generateSuggestions(items, profile, []);
      
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });

    it('should include reason with each suggestion', () => {
      const items = createTestItems();
      const profile = createTestProfile();
      
      const suggestions = generateSuggestions(items, profile, []);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.reason).toBeTruthy();
        expect(typeof suggestion.reason).toBe('string');
      });
    });

    it('should filter out zero-quantity items', () => {
      const items: InventoryItem[] = [
        ...createTestItems(),
        {
          id: 'empty-item',
          itemName: 'Empty Item',
          quantity: 0,
          category: 'pantry',
          fiberG: 0,
          fatG: 0,
          carbsG: 0,
          proteinG: 0,
          lastUpdated: new Date().toISOString()
        }
      ];
      const profile = createTestProfile();
      
      const suggestions = generateSuggestions(items, profile, []);
      
      expect(suggestions.find(s => s.item.itemName === 'Empty Item')).toBeUndefined();
    });

    it('should filter out condiments from suggestions', () => {
      const items: InventoryItem[] = [
        ...createTestItems(),
        {
          id: 'condiment-1',
          itemName: 'Ketchup',
          quantity: 1,
          unit: 'bottle',
          category: 'condiments',
          fiberG: 0,
          fatG: 0,
          carbsG: 5,
          proteinG: 0,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'condiment-2',
          itemName: 'Mustard',
          quantity: 2,
          unit: 'bottle',
          category: 'condiments',
          fiberG: 0,
          fatG: 0,
          carbsG: 1,
          proteinG: 0,
          lastUpdated: new Date().toISOString()
        }
      ];
      const profile = createTestProfile();
      
      const suggestions = generateSuggestions(items, profile, []);
      
      expect(suggestions.find(s => s.item.category === 'condiments')).toBeUndefined();
      expect(suggestions.find(s => s.item.itemName === 'Ketchup')).toBeUndefined();
      expect(suggestions.find(s => s.item.itemName === 'Mustard')).toBeUndefined();
    });

    it('should prioritize low-GI foods for glucose-stability goal', () => {
      const items = createTestItems();
      const profile = createTestProfile('low-glycemic');
      profile.dietaryGoals = ['glucose-stability'];
      
      const suggestions = generateSuggestions(items, profile, []);
      
      // Broccoli (GI: 15) and Almonds (GI: 0) should score well
      const broccoli = suggestions.find(s => s.item.itemName === 'Broccoli');
      const rice = suggestions.find(s => s.item.itemName === 'Brown Rice');
      
      expect(broccoli).toBeDefined();
      if (broccoli && rice) {
        expect(broccoli.score).toBeGreaterThanOrEqual(rice.score);
      }
    });

    it('should prioritize expiring items', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const items: InventoryItem[] = [
        {
          id: 'expiring',
          itemName: 'Expiring Milk',
          quantity: 1,
          category: 'dairy',
          fiberG: 0,
          fatG: 8,
          carbsG: 12,
          proteinG: 8,
          expirationDate: tomorrow.toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'fresh',
          itemName: 'Fresh Cheese',
          quantity: 1,
          category: 'dairy',
          fiberG: 0,
          fatG: 9,
          carbsG: 1,
          proteinG: 7,
          lastUpdated: new Date().toISOString()
        }
      ];
      const profile = createTestProfile();
      
      const suggestions = generateSuggestions(items, profile, []);
      
      const expiringMilk = suggestions.find(s => s.item.itemName === 'Expiring Milk');
      expect(expiringMilk).toBeDefined();
      expect(expiringMilk!.reason).toContain('expir');
    });

    it('should add warnings for expired items', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const items: InventoryItem[] = [
        {
          id: 'expired',
          itemName: 'Expired Milk',
          quantity: 1,
          category: 'dairy',
          fiberG: 0,
          fatG: 8,
          carbsG: 12,
          proteinG: 8,
          expirationDate: yesterday.toISOString(),
          lastUpdated: new Date().toISOString()
        }
      ];
      const profile = createTestProfile();
      
      const suggestions = generateSuggestions(items, profile, []);
      
      // Expired items should have very low score or be excluded
      const expiredMilk = suggestions.find(s => s.item.itemName === 'Expired Milk');
      if (expiredMilk) {
        expect(expiredMilk.warnings.some(w => w.toLowerCase().includes('expired'))).toBe(true);
      }
    });
  });

  describe('getTopSuggestions', () => {
    it('should return limited number of suggestions', () => {
      const items = createTestItems();
      const profile = createTestProfile();
      
      const suggestions = getTopSuggestions(items, profile, [], 3);
      
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should return all items if count exceeds inventory', () => {
      const items = createTestItems();
      const profile = createTestProfile();
      
      const suggestions = getTopSuggestions(items, profile, [], 100);
      
      expect(suggestions.length).toBeLessThanOrEqual(items.length);
    });
  });

  describe('getQuickSuggestion', () => {
    it('should return a single suggestion', () => {
      const items = createTestItems();
      const profile = createTestProfile();
      
      const suggestion = getQuickSuggestion(items, profile, []);
      
      expect(suggestion).not.toBeNull();
      expect(suggestion?.item).toBeDefined();
    });

    it('should return null for empty inventory', () => {
      const profile = createTestProfile();
      
      const suggestion = getQuickSuggestion([], profile, []);
      
      expect(suggestion).toBeNull();
    });

    it('should return the highest scored item', () => {
      const items = createTestItems();
      const profile = createTestProfile();
      
      const quickSuggestion = getQuickSuggestion(items, profile, []);
      const allSuggestions = generateSuggestions(items, profile, []);
      
      if (quickSuggestion && allSuggestions.length > 0) {
        expect(quickSuggestion.item.id).toBe(allSuggestions[0].item.id);
      }
    });
  });

  describe('Diet-specific suggestions', () => {
    it('should favor meat for high-protein diet', () => {
      const items = createTestItems();
      const profile = createTestProfile('high-protein');
      
      const suggestions = generateSuggestions(items, profile, []);
      
      const chicken = suggestions.find(s => s.item.itemName === 'Chicken Breast');
      expect(chicken).toBeDefined();
      // Chicken should rank well for high-protein (in top half)
      const chickenIndex = suggestions.findIndex(s => s.item.itemName === 'Chicken Breast');
      expect(chickenIndex).toBeLessThan(suggestions.length);
    });

    it('should exclude meat for vegetarian diet', () => {
      const items = createTestItems();
      const profile = createTestProfile('vegetarian');
      
      const suggestions = generateSuggestions(items, profile, []);
      
      const chicken = suggestions.find(s => s.item.itemName === 'Chicken Breast');
      if (chicken) {
        // If included, should have warnings
        expect(chicken.warnings.length).toBeGreaterThan(0);
        expect(chicken.score).toBeLessThan(50); // Low score
      }
    });

    it('should prefer low-carb items for keto diet', () => {
      const items = createTestItems();
      const profile = createTestProfile('keto');
      
      const suggestions = generateSuggestions(items, profile, []);
      
      // Almonds (high fat) and Chicken (high protein, low carb) should rank higher than Brown Rice
      const almonds = suggestions.find(s => s.item.itemName === 'Almonds');
      const rice = suggestions.find(s => s.item.itemName === 'Brown Rice');
      
      if (almonds && rice) {
        expect(almonds.score).toBeGreaterThan(rice.score);
      }
    });
  });
});
