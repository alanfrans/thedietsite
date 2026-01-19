import React from 'react';
import type { MealSuggestion, InventoryItem } from '../types';

interface SuggestionCardProps {
  suggestion: MealSuggestion;
  onSelect: (item: InventoryItem) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onSelect }) => {
  const { item, reason, score, warnings } = suggestion;

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#4CAF50';
    if (score >= 50) return '#FF9800';
    return '#f44336';
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      produce: '🥬',
      dairy: '🥛',
      meat: '🥩',
      pantry: '🥫',
      frozen: '🧊',
      beverages: '🥤',
      condiments: '🧂',
      grains: '🌾',
      snacks: '🍿'
    };
    return emojis[category] || '🍽️';
  };

  return (
    <div className="suggestion-card" onClick={() => onSelect(item)}>
      <div className="suggestion-header">
        <span className="category-emoji">{getCategoryEmoji(item.category)}</span>
        <h3 className="item-name">{item.itemName}</h3>
        <div 
          className="score-badge" 
          style={{ backgroundColor: getScoreColor(score) }}
        >
          {score}
        </div>
      </div>
      
      <div className="suggestion-macros">
        <span className="macro">🥬 {item.fiberG}g fiber</span>
        <span className="macro">🧈 {item.fatG}g fat</span>
        <span className="macro">🍞 {item.carbsG}g carbs</span>
        <span className="macro">🥩 {item.proteinG}g protein</span>
      </div>

      <p className="suggestion-reason">{reason}</p>

      {warnings.length > 0 && (
        <div className="suggestion-warnings">
          {warnings.map((warning, index) => (
            <p key={index} className="warning">⚠️ {warning}</p>
          ))}
        </div>
      )}

      {item.quantity !== 'unknown' && (
        <p className="quantity-info">
          {item.quantity} {item.unit || 'units'} available
        </p>
      )}

      <button className="btn btn-eat">Eat This</button>
    </div>
  );
};

interface SuggestionListProps {
  suggestions: MealSuggestion[];
  onSelect: (item: InventoryItem) => void;
  emptyMessage?: string;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({ 
  suggestions, 
  onSelect, 
  emptyMessage = "No suggestions available. Try adding items to your inventory!" 
}) => {
  if (suggestions.length === 0) {
    return (
      <div className="empty-suggestions">
        <p>🍽️ {emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="suggestion-list">
      {suggestions.map((suggestion, index) => (
        <SuggestionCard 
          key={suggestion.item.id || index}
          suggestion={suggestion}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
