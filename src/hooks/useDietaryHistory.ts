import { useState, useEffect, useCallback } from 'react';
import type { DietaryHistoryEntry, InventoryItem } from '../types';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';

const COOKIE_NAME = 'dietsite_history';
const MAX_HISTORY_ENTRIES = 100; // Limit to prevent cookie overflow

export function useDietaryHistory() {
  const [history, setHistoryState] = useState<DietaryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load history from cookie on mount
  useEffect(() => {
    try {
      const stored = getCookie<DietaryHistoryEntry[]>(COOKIE_NAME);
      if (stored && Array.isArray(stored)) {
        setHistoryState(stored);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load dietary history from storage');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save history to cookie
  const saveHistory = useCallback((entries: DietaryHistoryEntry[]) => {
    try {
      // Keep only the most recent entries
      const trimmed = entries.slice(-MAX_HISTORY_ENTRIES);
      setCookie(COOKIE_NAME, trimmed);
      setHistoryState(trimmed);
      setError(null);
    } catch (err) {
      console.error('Error saving history:', err);
      setError('Failed to save dietary history to storage');
    }
  }, []);

  // Log consumption of an item
  const logConsumption = useCallback((
    item: InventoryItem,
    quantityConsumed: number,
    ruleViolations: string[] = [],
    glucoseRelevant: boolean = false
  ) => {
    const entry: DietaryHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      itemName: item.itemName,
      itemId: item.id,
      quantityConsumed,
      unit: item.unit,
      macrosConsumed: {
        fiberG: (item.fiberG / (item.quantity === 'unknown' ? 1 : item.quantity || 1)) * quantityConsumed,
        fatG: (item.fatG / (item.quantity === 'unknown' ? 1 : item.quantity || 1)) * quantityConsumed,
        carbsG: (item.carbsG / (item.quantity === 'unknown' ? 1 : item.quantity || 1)) * quantityConsumed,
        proteinG: (item.proteinG / (item.quantity === 'unknown' ? 1 : item.quantity || 1)) * quantityConsumed,
        calories: item.calories 
          ? (item.calories / (item.quantity === 'unknown' ? 1 : item.quantity || 1)) * quantityConsumed 
          : undefined
      },
      dietaryRuleViolations: ruleViolations,
      glucoseRelevanceFlag: glucoseRelevant
    };

    saveHistory([...history, entry]);
    return entry;
  }, [history, saveHistory]);

  // Get today's history
  const getTodayHistory = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= today;
    });
  }, [history]);

  // Get history for a specific date
  const getHistoryForDate = useCallback((date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startOfDay && entryDate <= endOfDay;
    });
  }, [history]);

  // Get daily macro summary
  const getDailyMacros = useCallback((date: Date = new Date()) => {
    const dayHistory = getHistoryForDate(date);
    
    return dayHistory.reduce((acc, entry) => ({
      totalFiber: acc.totalFiber + entry.macrosConsumed.fiberG,
      totalFat: acc.totalFat + entry.macrosConsumed.fatG,
      totalCarbs: acc.totalCarbs + entry.macrosConsumed.carbsG,
      totalProtein: acc.totalProtein + entry.macrosConsumed.proteinG,
      totalCalories: acc.totalCalories + (entry.macrosConsumed.calories || 0)
    }), {
      totalFiber: 0,
      totalFat: 0,
      totalCarbs: 0,
      totalProtein: 0,
      totalCalories: 0
    });
  }, [getHistoryForDate]);

  // Get recent violations
  const getRecentViolations = useCallback((days: number = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return history.filter(entry => 
      new Date(entry.timestamp) >= cutoff && 
      entry.dietaryRuleViolations.length > 0
    );
  }, [history]);

  // Clear all history
  const clearHistory = useCallback(() => {
    removeCookie(COOKIE_NAME);
    setHistoryState([]);
  }, []);

  // Delete a specific entry
  const deleteEntry = useCallback((id: string) => {
    const filtered = history.filter(entry => entry.id !== id);
    saveHistory(filtered);
  }, [history, saveHistory]);

  return {
    history,
    loading,
    error,
    logConsumption,
    getTodayHistory,
    getHistoryForDate,
    getDailyMacros,
    getRecentViolations,
    clearHistory,
    deleteEntry
  };
}
