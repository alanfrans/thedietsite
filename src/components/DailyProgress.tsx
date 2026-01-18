import React from 'react';
import type { DietaryHistoryEntry } from '../types';

interface DailyMacros {
  totalFiber: number;
  totalFat: number;
  totalCarbs: number;
  totalProtein: number;
  totalCalories: number;
}

interface DailyProgressProps {
  todayHistory: DietaryHistoryEntry[];
  dailyMacros: DailyMacros;
  dietType: string;
}

export const DailyProgress: React.FC<DailyProgressProps> = ({
  todayHistory,
  dailyMacros,
  dietType
}) => {
  // Daily targets based on diet type
  const getTargets = () => {
    const defaults = { carbs: 250, protein: 50, fat: 65, fiber: 25, calories: 2000 };
    
    switch (dietType) {
      case 'keto':
        return { carbs: 50, protein: 75, fat: 150, fiber: 25, calories: 1800 };
      case 'low-glycemic':
        return { carbs: 130, protein: 60, fat: 70, fiber: 35, calories: 2000 };
      case 'high-protein':
        return { carbs: 200, protein: 150, fat: 65, fiber: 25, calories: 2200 };
      case 'mediterranean':
        return { carbs: 200, protein: 60, fat: 80, fiber: 30, calories: 2000 };
      default:
        return defaults;
    }
  };

  const targets = getTargets();

  const getProgressPercent = (current: number, target: number) => 
    Math.min(100, Math.round((current / target) * 100));

  const getProgressColor = (percent: number, isMaxLimit: boolean = false) => {
    if (isMaxLimit) {
      // For limits like carbs on keto
      if (percent >= 100) return '#f44336'; // over limit
      if (percent >= 80) return '#FF9800'; // approaching limit
      return '#4CAF50'; // within limit
    }
    // For targets like protein
    if (percent >= 80) return '#4CAF50'; // hitting target
    if (percent >= 50) return '#FF9800'; // making progress
    return '#2196F3'; // starting out
  };

  const isLimitDiet = ['keto', 'low-glycemic'].includes(dietType);

  return (
    <div className="daily-progress">
      <h3>📊 Today's Progress</h3>
      
      <div className="macro-bars">
        <div className="macro-bar-item">
          <div className="macro-label">
            <span>🍞 Carbs</span>
            <span>{Math.round(dailyMacros.totalCarbs)}g / {targets.carbs}g</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${getProgressPercent(dailyMacros.totalCarbs, targets.carbs)}%`,
                backgroundColor: getProgressColor(
                  getProgressPercent(dailyMacros.totalCarbs, targets.carbs),
                  isLimitDiet
                )
              }}
            />
          </div>
        </div>

        <div className="macro-bar-item">
          <div className="macro-label">
            <span>🥩 Protein</span>
            <span>{Math.round(dailyMacros.totalProtein)}g / {targets.protein}g</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${getProgressPercent(dailyMacros.totalProtein, targets.protein)}%`,
                backgroundColor: getProgressColor(
                  getProgressPercent(dailyMacros.totalProtein, targets.protein)
                )
              }}
            />
          </div>
        </div>

        <div className="macro-bar-item">
          <div className="macro-label">
            <span>🧈 Fat</span>
            <span>{Math.round(dailyMacros.totalFat)}g / {targets.fat}g</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${getProgressPercent(dailyMacros.totalFat, targets.fat)}%`,
                backgroundColor: getProgressColor(
                  getProgressPercent(dailyMacros.totalFat, targets.fat)
                )
              }}
            />
          </div>
        </div>

        <div className="macro-bar-item">
          <div className="macro-label">
            <span>🥬 Fiber</span>
            <span>{Math.round(dailyMacros.totalFiber)}g / {targets.fiber}g</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${getProgressPercent(dailyMacros.totalFiber, targets.fiber)}%`,
                backgroundColor: getProgressColor(
                  getProgressPercent(dailyMacros.totalFiber, targets.fiber)
                )
              }}
            />
          </div>
        </div>
      </div>

      {todayHistory.length > 0 && (
        <div className="today-meals">
          <h4>Today's Meals</h4>
          <ul>
            {todayHistory.map(entry => (
              <li key={entry.id}>
                <span className="meal-time">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="meal-name">{entry.itemName}</span>
                <span className="meal-macros">
                  C: {Math.round(entry.macrosConsumed.carbsG)}g | 
                  P: {Math.round(entry.macrosConsumed.proteinG)}g | 
                  F: {Math.round(entry.macrosConsumed.fatG)}g
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {todayHistory.length === 0 && (
        <p className="no-meals">No meals logged today yet. Tap a suggestion to log your first meal!</p>
      )}
    </div>
  );
};
