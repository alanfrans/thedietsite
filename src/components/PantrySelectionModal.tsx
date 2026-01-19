import React, { useState, useMemo } from 'react';
import type { InventoryItem, FoodCategory } from '../types';

interface PantrySelectionModalProps {
  inventory: InventoryItem[];
  onSelect: (item: InventoryItem) => void;
  onCancel: () => void;
}

export const PantrySelectionModal: React.FC<PantrySelectionModalProps> = ({
  inventory,
  onSelect,
  onCancel
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryEmoji = (category: FoodCategory): string => {
    const emojis: Record<FoodCategory, string> = {
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

  // Filter items by search query
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    
    const query = searchQuery.toLowerCase();
    return inventory.filter(item => 
      item.itemName.toLowerCase().includes(query)
    );
  }, [inventory, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<FoodCategory, InventoryItem[]> = {
      produce: [],
      dairy: [],
      meat: [],
      pantry: [],
      frozen: [],
      beverages: [],
      condiments: [],
      grains: [],
      snacks: []
    };

    filteredInventory.forEach(item => {
      groups[item.category].push(item);
    });

    // Return only non-empty categories
    return Object.entries(groups).filter(([, items]) => items.length > 0) as [FoodCategory, InventoryItem[]][];
  }, [filteredInventory]);

  return (
    <div className="modal-overlay">
      <div className="modal pantry-selection-modal">
        <h2>📝 Log What I Ate</h2>
        <p className="helper-text" style={{ textAlign: 'center', marginBottom: '16px' }}>
          Select an item from your pantry to log consumption
        </p>

        {/* Search Bar */}
        <div className="pantry-search">
          <input
            type="text"
            placeholder="🔍 Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        {/* Items grouped by category */}
        <div className="pantry-items-container">
          {groupedItems.length === 0 ? (
            <div className="empty-pantry-selection">
              <p>
                {searchQuery 
                  ? `No items found matching "${searchQuery}"` 
                  : 'Your pantry is empty. Add items in the Pantry tab.'}
              </p>
            </div>
          ) : (
            groupedItems.map(([category, items]) => (
              <div key={category} className="pantry-category-group">
                <h3 className="category-header">
                  <span className="category-emoji">{getCategoryEmoji(category)}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className="pantry-items-list">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="pantry-item"
                      onClick={() => onSelect(item)}
                    >
                      <div className="pantry-item-header">
                        <span className="pantry-item-name">{item.itemName}</span>
                        {item.quantity !== 'unknown' && (
                          <span className="pantry-item-quantity">
                            {item.quantity} {item.unit || 'units'}
                          </span>
                        )}
                      </div>
                      <div className="pantry-item-macros">
                        <span className="macro-pill">C: {item.carbsG}g</span>
                        <span className="macro-pill">P: {item.proteinG}g</span>
                        <span className="macro-pill">F: {item.fatG}g</span>
                        {item.fiberG > 0 && (
                          <span className="macro-pill">Fiber: {item.fiberG}g</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cancel Button */}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
