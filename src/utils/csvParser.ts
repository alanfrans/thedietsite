import type { InventoryItem, FoodCategory } from '../types';

/**
 * Parse CSV text to inventory items
 */
export function parseCSV(csvText: string): InventoryItem[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  const items: InventoryItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const item = csvRowToInventoryItem(row);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Convert a CSV row object to an InventoryItem
 */
function csvRowToInventoryItem(row: Record<string, string>): InventoryItem | null {
  const name = row['item_name'] || row['name'] || row['item'];
  if (!name) return null;

  const category = normalizeCategory(row['category'] || 'pantry');
  
  return {
    id: generateId(),
    itemName: name,
    quantity: parseQuantity(row['quantity']),
    unit: row['unit'] || undefined,
    category,
    fiberG: parseFloat(row['fiber_g']) || 0,
    fatG: parseFloat(row['fat_g']) || 0,
    carbsG: parseFloat(row['carbs_g']) || 0,
    proteinG: parseFloat(row['protein_g']) || 0,
    calories: row['calories'] ? parseFloat(row['calories']) : undefined,
    glycemicIndex: row['glycemic_index'] ? parseFloat(row['glycemic_index']) : undefined,
    servingSize: row['serving_size'] || undefined,
    expirationDate: row['expiration_date'] || undefined,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Parse quantity value (can be number or "unknown")
 */
function parseQuantity(value: string | undefined): number | 'unknown' {
  if (!value || value.toLowerCase() === 'unknown') return 'unknown';
  const num = parseFloat(value);
  return isNaN(num) ? 'unknown' : num;
}

/**
 * Normalize category string to FoodCategory type
 */
function normalizeCategory(category: string): FoodCategory {
  const normalized = category.toLowerCase().trim();
  const categoryMap: Record<string, FoodCategory> = {
    'produce': 'produce',
    'vegetable': 'produce',
    'vegetables': 'produce',
    'fruit': 'produce',
    'fruits': 'produce',
    'dairy': 'dairy',
    'milk': 'dairy',
    'cheese': 'dairy',
    'yogurt': 'dairy',
    'meat': 'meat',
    'protein': 'meat',
    'poultry': 'meat',
    'fish': 'meat',
    'seafood': 'meat',
    'pantry': 'pantry',
    'dry goods': 'pantry',
    'canned': 'pantry',
    'frozen': 'frozen',
    'freezer': 'frozen',
    'beverages': 'beverages',
    'drinks': 'beverages',
    'condiments': 'condiments',
    'sauce': 'condiments',
    'sauces': 'condiments',
    'grains': 'grains',
    'bread': 'grains',
    'pasta': 'grains',
    'rice': 'grains',
    'snacks': 'snacks',
    'snack': 'snacks'
  };

  return categoryMap[normalized] || 'pantry';
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate the AI prompt for image analysis
 */
export function getAIPrompt(): string {
  return `Please identify all food items visible in this image and return them in CSV format with the following columns:
item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category

Guidelines:
- item_name: The name of the food item
- quantity: Estimated quantity (number or "unknown")
- unit: Unit of measurement (e.g., cup, lb, oz, pieces)
- fiber_g, fat_g, carbs_g, protein_g: Macronutrients per typical serving
- category: One of: produce, dairy, meat, pantry, frozen, beverages, condiments, grains, snacks

Example output:
item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Greek Yogurt,1,cup,0,5,9,17,dairy
Broccoli,2,cups,5,0,6,3,produce
Chicken Breast,1,lb,0,4,0,31,meat
Almonds,1,cup,12,49,21,21,snacks

Please provide accurate macronutrient values based on standard nutritional data.`;
}

/**
 * Merge new items into existing inventory
 */
export function mergeInventory(
  existing: InventoryItem[],
  newItems: InventoryItem[]
): InventoryItem[] {
  const merged = [...existing];

  for (const newItem of newItems) {
    // Find existing item with same name (case-insensitive)
    const existingIndex = merged.findIndex(
      item => item.itemName.toLowerCase() === newItem.itemName.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing item
      const existingItem = merged[existingIndex];
      merged[existingIndex] = {
        ...existingItem,
        ...newItem,
        id: existingItem.id, // Keep original ID
        quantity: combineQuantities(existingItem.quantity, newItem.quantity),
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Add new item
      merged.push(newItem);
    }
  }

  return merged;
}

/**
 * Combine quantities when merging items
 */
function combineQuantities(
  existing: number | 'unknown',
  newQty: number | 'unknown'
): number | 'unknown' {
  if (existing === 'unknown' && newQty === 'unknown') return 'unknown';
  if (existing === 'unknown') return newQty;
  if (newQty === 'unknown') return existing;
  return existing + newQty;
}

/**
 * Validate CSV format
 */
export function validateCSV(csvText: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const trimmed = csvText.trim();
  
  if (!trimmed) {
    errors.push('CSV is empty');
    return { valid: false, errors };
  }
  
  const lines = trimmed.split('\n');

  if (lines.length < 1 || !lines[0].trim()) {
    errors.push('CSV is empty');
    return { valid: false, errors };
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const requiredHeaders = ['item_name', 'quantity', 'fiber_g', 'fat_g', 'carbs_g', 'protein_g', 'category'];

  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      errors.push(`Missing required column: ${required}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
