import { describe, it, expect } from 'vitest';
import { parseCSV, mergeInventory, validateCSV, getAIPrompt } from '../utils/csvParser';
import type { InventoryItem } from '../types';

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse a valid CSV string', () => {
      const csv = `item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Greek Yogurt,1,cup,0,5,9,17,dairy
Broccoli,2,cups,5,0,6,3,produce`;

      const items = parseCSV(csv);

      expect(items).toHaveLength(2);
      expect(items[0].itemName).toBe('Greek Yogurt');
      expect(items[0].quantity).toBe(1);
      expect(items[0].unit).toBe('cup');
      expect(items[0].category).toBe('dairy');
      expect(items[0].proteinG).toBe(17);
      
      expect(items[1].itemName).toBe('Broccoli');
      expect(items[1].category).toBe('produce');
    });

    it('should handle quoted values with commas', () => {
      const csv = `item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
"Mixed Nuts, Unsalted",1,cup,3,14,8,6,snacks`;

      const items = parseCSV(csv);

      expect(items).toHaveLength(1);
      expect(items[0].itemName).toBe('Mixed Nuts, Unsalted');
    });

    it('should handle unknown quantity', () => {
      const csv = `item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Milk,unknown,gallon,0,8,12,8,dairy`;

      const items = parseCSV(csv);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe('unknown');
    });

    it('should return empty array for empty CSV', () => {
      const items = parseCSV('');
      expect(items).toHaveLength(0);
    });

    it('should return empty array for header-only CSV', () => {
      const csv = 'item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category';
      const items = parseCSV(csv);
      expect(items).toHaveLength(0);
    });

    it('should normalize category names', () => {
      const csv = `item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Apple,1,piece,4,0,25,0,fruit
Chicken,1,lb,0,3,0,30,protein
Bread,1,loaf,2,1,20,4,bread`;

      const items = parseCSV(csv);

      expect(items[0].category).toBe('produce'); // fruit -> produce
      expect(items[1].category).toBe('meat'); // protein -> meat
      expect(items[2].category).toBe('grains'); // bread -> grains
    });

    it('should generate unique IDs for each item', () => {
      const csv = `item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Item1,1,,0,0,0,0,pantry
Item2,1,,0,0,0,0,pantry`;

      const items = parseCSV(csv);

      expect(items[0].id).not.toBe(items[1].id);
      expect(items[0].id).toMatch(/^item_/);
    });
  });

  describe('validateCSV', () => {
    it('should validate a correct CSV', () => {
      const csv = `item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Test,1,cup,0,0,0,0,pantry`;

      const result = validateCSV(csv);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing required columns', () => {
      const csv = `item_name,quantity
Test,1`;

      const result = validateCSV(csv);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('fiber_g'))).toBe(true);
    });

    it('should report error for empty CSV', () => {
      const result = validateCSV('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CSV is empty');
    });
  });

  describe('mergeInventory', () => {
    it('should add new items to existing inventory', () => {
      const existing: InventoryItem[] = [
        {
          id: 'existing-1',
          itemName: 'Milk',
          quantity: 1,
          category: 'dairy',
          fiberG: 0,
          fatG: 8,
          carbsG: 12,
          proteinG: 8,
          lastUpdated: new Date().toISOString()
        }
      ];

      const newItems: InventoryItem[] = [
        {
          id: 'new-1',
          itemName: 'Eggs',
          quantity: 12,
          unit: 'pieces',
          category: 'dairy',
          fiberG: 0,
          fatG: 5,
          carbsG: 1,
          proteinG: 6,
          lastUpdated: new Date().toISOString()
        }
      ];

      const merged = mergeInventory(existing, newItems);

      expect(merged).toHaveLength(2);
      expect(merged.find(i => i.itemName === 'Milk')).toBeDefined();
      expect(merged.find(i => i.itemName === 'Eggs')).toBeDefined();
    });

    it('should merge quantities for duplicate items', () => {
      const existing: InventoryItem[] = [
        {
          id: 'existing-1',
          itemName: 'Milk',
          quantity: 1,
          category: 'dairy',
          fiberG: 0,
          fatG: 8,
          carbsG: 12,
          proteinG: 8,
          lastUpdated: new Date().toISOString()
        }
      ];

      const newItems: InventoryItem[] = [
        {
          id: 'new-1',
          itemName: 'Milk', // Same item
          quantity: 2,
          category: 'dairy',
          fiberG: 0,
          fatG: 8,
          carbsG: 12,
          proteinG: 8,
          lastUpdated: new Date().toISOString()
        }
      ];

      const merged = mergeInventory(existing, newItems);

      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(3); // 1 + 2
      expect(merged[0].id).toBe('existing-1'); // Keep original ID
    });

    it('should handle case-insensitive matching', () => {
      const existing: InventoryItem[] = [
        {
          id: 'existing-1',
          itemName: 'Greek Yogurt',
          quantity: 1,
          category: 'dairy',
          fiberG: 0,
          fatG: 5,
          carbsG: 9,
          proteinG: 17,
          lastUpdated: new Date().toISOString()
        }
      ];

      const newItems: InventoryItem[] = [
        {
          id: 'new-1',
          itemName: 'greek yogurt', // lowercase
          quantity: 2,
          category: 'dairy',
          fiberG: 0,
          fatG: 5,
          carbsG: 9,
          proteinG: 17,
          lastUpdated: new Date().toISOString()
        }
      ];

      const merged = mergeInventory(existing, newItems);

      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(3);
    });

    it('should handle unknown quantities', () => {
      const existing: InventoryItem[] = [
        {
          id: 'existing-1',
          itemName: 'Spices',
          quantity: 'unknown',
          category: 'condiments',
          fiberG: 0,
          fatG: 0,
          carbsG: 0,
          proteinG: 0,
          lastUpdated: new Date().toISOString()
        }
      ];

      const newItems: InventoryItem[] = [
        {
          id: 'new-1',
          itemName: 'Spices',
          quantity: 'unknown',
          category: 'condiments',
          fiberG: 0,
          fatG: 0,
          carbsG: 0,
          proteinG: 0,
          lastUpdated: new Date().toISOString()
        }
      ];

      const merged = mergeInventory(existing, newItems);

      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe('unknown');
    });
  });

  describe('getAIPrompt', () => {
    it('should return a non-empty prompt string', () => {
      const prompt = getAIPrompt();
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should include CSV format specification', () => {
      const prompt = getAIPrompt();
      expect(prompt).toContain('item_name');
      expect(prompt).toContain('quantity');
      expect(prompt).toContain('protein_g');
      expect(prompt).toContain('category');
    });

    it('should include example output', () => {
      const prompt = getAIPrompt();
      expect(prompt).toContain('Greek Yogurt');
      expect(prompt).toContain('dairy');
    });
  });
});
