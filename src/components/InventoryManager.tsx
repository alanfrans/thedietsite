import React, { useState } from 'react';
import type { InventoryItem, FoodCategory } from '../types';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onAdd: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => void;
  onRemove: (id: string) => void;
  onImportCSV: (csv: string) => { success: boolean; count: number };
}

const CATEGORIES: { value: FoodCategory; label: string; emoji: string }[] = [
  { value: 'produce', label: 'Produce', emoji: '🥬' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'meat', label: 'Meat/Protein', emoji: '🥩' },
  { value: 'pantry', label: 'Pantry', emoji: '🥫' },
  { value: 'frozen', label: 'Frozen', emoji: '🧊' },
  { value: 'beverages', label: 'Beverages', emoji: '🥤' },
  { value: 'condiments', label: 'Condiments', emoji: '🧂' },
  { value: 'grains', label: 'Grains', emoji: '🌾' },
  { value: 'snacks', label: 'Snacks', emoji: '🍿' }
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onAdd,
  onUpdate,
  onRemove,
  onImportCSV
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FoodCategory | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for adding new item
  const [newItem, setNewItem] = useState({
    itemName: '',
    quantity: '1',
    unit: '',
    category: 'pantry' as FoodCategory,
    fiberG: '0',
    fatG: '0',
    carbsG: '0',
    proteinG: '0',
    calories: '',
    expirationDate: ''
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      itemName: newItem.itemName,
      quantity: newItem.quantity ? parseFloat(newItem.quantity) : 'unknown',
      unit: newItem.unit || undefined,
      category: newItem.category,
      fiberG: parseFloat(newItem.fiberG) || 0,
      fatG: parseFloat(newItem.fatG) || 0,
      carbsG: parseFloat(newItem.carbsG) || 0,
      proteinG: parseFloat(newItem.proteinG) || 0,
      calories: newItem.calories ? parseFloat(newItem.calories) : undefined,
      expirationDate: newItem.expirationDate || undefined
    });
    setNewItem({
      itemName: '',
      quantity: '1',
      unit: '',
      category: 'pantry',
      fiberG: '0',
      fatG: '0',
      carbsG: '0',
      proteinG: '0',
      calories: '',
      expirationDate: ''
    });
    setShowAddForm(false);
  };

  const handleImport = () => {
    const result = onImportCSV(csvText);
    if (result.success) {
      alert(`Successfully imported ${result.count} items!`);
      setCsvText('');
      setShowImport(false);
    } else {
      alert('Failed to import items. Please check the CSV format.');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedInventory = filteredInventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<FoodCategory, InventoryItem[]>);

  return (
    <div className="inventory-manager">
      <div className="inventory-header">
        <h2>📦 Your Pantry</h2>
        <div className="inventory-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowImport(!showImport)}
          >
            📸 Import
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Add Item
          </button>
        </div>
      </div>

      {showImport && (
        <div className="import-section">
          <h3>Import from CSV</h3>
          <p>Paste CSV data from AI analysis or manual entry:</p>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Greek Yogurt,1,cup,0,5,9,17,dairy
Broccoli,2,cups,5,0,6,3,produce"
            rows={8}
          />
          <div className="import-actions">
            <button className="btn btn-primary" onClick={handleImport}>
              Import Items
            </button>
            <button className="btn btn-secondary" onClick={() => setShowImport(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <form className="add-item-form" onSubmit={handleAddItem}>
          <h3>Add New Item</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                value={newItem.itemName}
                onChange={e => setNewItem({ ...newItem, itemName: e.target.value })}
                required
                placeholder="e.g., Greek Yogurt"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newItem.category}
                onChange={e => setNewItem({ ...newItem, category: e.target.value as FoodCategory })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input
                type="text"
                value={newItem.unit}
                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="e.g., cups, lbs"
              />
            </div>
            <div className="form-group">
              <label>Fiber (g)</label>
              <input
                type="number"
                value={newItem.fiberG}
                onChange={e => setNewItem({ ...newItem, fiberG: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Fat (g)</label>
              <input
                type="number"
                value={newItem.fatG}
                onChange={e => setNewItem({ ...newItem, fatG: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Carbs (g)</label>
              <input
                type="number"
                value={newItem.carbsG}
                onChange={e => setNewItem({ ...newItem, carbsG: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Protein (g)</label>
              <input
                type="number"
                value={newItem.proteinG}
                onChange={e => setNewItem({ ...newItem, proteinG: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Calories (optional)</label>
              <input
                type="number"
                value={newItem.calories}
                onChange={e => setNewItem({ ...newItem, calories: e.target.value })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Expiration Date</label>
              <input
                type="date"
                value={newItem.expirationDate}
                onChange={e => setNewItem({ ...newItem, expirationDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Add Item</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="inventory-filters">
        <input
          type="search"
          placeholder="🔍 Search items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as FoodCategory | 'all')}
          className="category-filter"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.emoji} {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="inventory-list">
        {Object.entries(groupedInventory).map(([category, items]) => (
          <div key={category} className="category-section">
            <h3>
              {CATEGORIES.find(c => c.value === category)?.emoji} {' '}
              {CATEGORIES.find(c => c.value === category)?.label || category}
            </h3>
            <div className="items-grid">
              {items.map(item => (
                <div key={item.id} className="inventory-item">
                  {editingId === item.id ? (
                    <div className="item-edit">
                      <input
                        type="number"
                        defaultValue={item.quantity !== 'unknown' ? item.quantity : ''}
                        onChange={e => {
                          const val = e.target.value;
                          onUpdate(item.id, { 
                            quantity: val ? parseFloat(val) : 'unknown' 
                          });
                        }}
                        min="0"
                        step="0.1"
                      />
                      <button 
                        className="btn btn-small"
                        onClick={() => setEditingId(null)}
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="item-info">
                        <span className="item-name">{item.itemName}</span>
                        <span className="item-quantity">
                          {item.quantity === 'unknown' ? '?' : item.quantity} {item.unit || ''}
                        </span>
                      </div>
                      <div className="item-macros">
                        <span>C: {item.carbsG}g</span>
                        <span>P: {item.proteinG}g</span>
                        <span>F: {item.fatG}g</span>
                      </div>
                      <div className="item-actions">
                        <button 
                          className="btn btn-small btn-secondary"
                          onClick={() => setEditingId(item.id)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={() => onRemove(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredInventory.length === 0 && (
          <div className="empty-inventory">
            <p>📦 Your pantry is empty!</p>
            <p>Add items manually or import from a photo using AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};
