import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, FoodCategory } from '../types';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';
import { parseCSV, mergeInventory } from '../utils/csvParser';

const COOKIE_NAME = 'dietsite_inventory';

export function useInventory() {
  const [inventory, setInventoryState] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load inventory from cookie on mount
  useEffect(() => {
    try {
      const stored = getCookie<InventoryItem[]>(COOKIE_NAME);
      if (stored && Array.isArray(stored)) {
        setInventoryState(stored);
      }
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('Failed to load inventory from storage');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save inventory to cookie
  const saveInventory = useCallback((items: InventoryItem[]) => {
    try {
      setCookie(COOKIE_NAME, items);
      setInventoryState(items);
      setError(null);
    } catch (err) {
      console.error('Error saving inventory:', err);
      setError('Failed to save inventory to storage');
    }
  }, []);

  // Add a new item
  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      lastUpdated: new Date().toISOString()
    };
    saveInventory([...inventory, newItem]);
    return newItem;
  }, [inventory, saveInventory]);

  // Update an existing item
  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    const updated = inventory.map(item =>
      item.id === id
        ? { ...item, ...updates, lastUpdated: new Date().toISOString() }
        : item
    );
    saveInventory(updated);
  }, [inventory, saveInventory]);

  // Remove an item
  const removeItem = useCallback((id: string) => {
    const filtered = inventory.filter(item => item.id !== id);
    saveInventory(filtered);
  }, [inventory, saveInventory]);

  // Reduce item quantity (after consumption)
  const reduceQuantity = useCallback((id: string, amount: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    if (item.quantity === 'unknown') {
      // Can't reduce unknown quantity
      return;
    }

    const newQuantity = Math.max(0, item.quantity - amount);
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateItem(id, { quantity: newQuantity });
    }
  }, [inventory, removeItem, updateItem]);

  // Mark item as finished
  const finishItem = useCallback((id: string) => {
    removeItem(id);
  }, [removeItem]);

  // Import items from CSV
  const importFromCSV = useCallback((csvText: string, merge: boolean = true) => {
    try {
      const newItems = parseCSV(csvText);
      if (newItems.length === 0) {
        setError('No valid items found in CSV');
        return { success: false, count: 0 };
      }

      const finalItems = merge 
        ? mergeInventory(inventory, newItems)
        : newItems;
      
      saveInventory(finalItems);
      return { success: true, count: newItems.length };
    } catch (err) {
      console.error('Error importing CSV:', err);
      setError('Failed to parse CSV data');
      return { success: false, count: 0 };
    }
  }, [inventory, saveInventory]);

  // Get items by category
  const getByCategory = useCallback((category: FoodCategory) => {
    return inventory.filter(item => item.category === category);
  }, [inventory]);

  // Get items expiring soon (within days)
  const getExpiringSoon = useCallback((days: number = 3) => {
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return inventory.filter(item => {
      if (!item.expirationDate) return false;
      const expiry = new Date(item.expirationDate);
      return expiry <= threshold && expiry >= now;
    });
  }, [inventory]);

  // Search items by name
  const searchItems = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return inventory.filter(item => 
      item.itemName.toLowerCase().includes(lowerQuery)
    );
  }, [inventory]);

  // Clear all inventory
  const clearInventory = useCallback(() => {
    removeCookie(COOKIE_NAME);
    setInventoryState([]);
  }, []);

  return {
    inventory,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    reduceQuantity,
    finishItem,
    importFromCSV,
    getByCategory,
    getExpiringSoon,
    searchItems,
    clearInventory
  };
}
