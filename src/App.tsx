import { useState } from 'react';
import './App.css';
import { useProfile } from './hooks/useProfile';
import { useInventory } from './hooks/useInventory';
import { useDietaryHistory } from './hooks/useDietaryHistory';
import { getTopSuggestions } from './engines/mealSuggestions';
import { evaluateItem } from './engines/dietRules';
import { ProfileSetup } from './components/ProfileSetup';
import { SuggestionList } from './components/SuggestionCard';
import { InventoryManager } from './components/InventoryManager';
import { AIIngestion } from './components/AIIngestion';
import { ConsumptionModal } from './components/ConsumptionModal';
import { PantrySelectionModal } from './components/PantrySelectionModal';
import { DailyProgress } from './components/DailyProgress';
import type { InventoryItem, DietType, DietaryGoal } from './types';
import { clearAllCookies } from './utils/cookies';

type Tab = 'home' | 'inventory' | 'import' | 'settings';

function App() {
  const { profile, loading: profileLoading, hasProfile, initProfile, updateProfile, clearProfile } = useProfile();
  const { inventory, loading: inventoryLoading, addItem, updateItem, removeItem, reduceQuantity, finishItem, importFromCSV } = useInventory();
  const { logConsumption, getTodayHistory, getDailyMacros } = useDietaryHistory();
  
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showPantrySelectionModal, setShowPantrySelectionModal] = useState(false);

  // Compute suggestions directly (memoized pattern)
  const todayHistory = getTodayHistory();
  const suggestions = profile && inventory.length > 0
    ? getTopSuggestions(inventory, profile, todayHistory, 10)
    : [];

  const handleProfileSetup = (dietType: DietType, goals: DietaryGoal[]) => {
    initProfile(dietType, goals);
  };

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowConsumptionModal(true);
  };

  const handlePantryItemSelect = (item: InventoryItem) => {
    setShowPantrySelectionModal(false);
    setSelectedItem(item);
    setShowConsumptionModal(true);
  };

  const handleConsumption = (finished: boolean, quantityConsumed: number) => {
    if (!selectedItem || !profile) return;

    // Evaluate diet rules for any violations
    const ruleResult = evaluateItem({
      item: selectedItem,
      currentTime: new Date(),
      profile,
      todayHistory: getTodayHistory()
    });

    // Log consumption
    logConsumption(
      selectedItem,
      quantityConsumed,
      ruleResult.warnings,
      profile.dietaryGoals.includes('glucose-stability')
    );

    // Update inventory
    if (finished) {
      finishItem(selectedItem.id);
    } else {
      reduceQuantity(selectedItem.id, quantityConsumed);
    }

    setShowConsumptionModal(false);
    setSelectedItem(null);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAllCookies();
      clearProfile();
      window.location.reload();
    }
  };

  // Loading state
  if (profileLoading || inventoryLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">🍽️</div>
        <p>Loading Diet Site...</p>
      </div>
    );
  }

  // Profile setup for new users
  if (!hasProfile) {
    return (
      <div className="app">
        <ProfileSetup onComplete={handleProfileSetup} />
      </div>
    );
  }

  const dailyMacros = getDailyMacros();

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>🥗 Diet Site</h1>
        <p className="diet-badge">{profile?.dietType.replace('-', ' ').toUpperCase()}</p>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'home' && (
          <div className="home-tab">
            <button 
              className="btn btn-primary btn-large btn-what-can-i-eat"
              onClick={() => {
                if (suggestions.length > 0) {
                  handleItemSelect(suggestions[0].item);
                }
              }}
              disabled={suggestions.length === 0}
            >
              🍽️ What Can I Eat Right Now?
            </button>

            <button
              className="btn btn-secondary btn-large btn-log-what-i-ate"
              onClick={() => setShowPantrySelectionModal(true)}
              disabled={inventory.length === 0}
            >
              📝 Log What I Ate
            </button>

            <DailyProgress 
              todayHistory={todayHistory}
              dailyMacros={dailyMacros}
              dietType={profile?.dietType || 'mediterranean'}
            />

            <section className="suggestions-section">
              <h2>✨ Top Suggestions</h2>
              <SuggestionList 
                suggestions={suggestions}
                onSelect={handleItemSelect}
              />
            </section>
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            onAdd={addItem}
            onUpdate={updateItem}
            onRemove={removeItem}
            onImportCSV={importFromCSV}
          />
        )}

        {activeTab === 'import' && (
          <AIIngestion onImport={importFromCSV} />
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>⚙️ Settings</h2>
            
            <div className="settings-section">
              <h3>Diet Type</h3>
              <select 
                value={profile?.dietType}
                onChange={e => updateProfile({ dietType: e.target.value as DietType })}
              >
                <option value="low-glycemic">Low-Glycemic</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
                <option value="whole30">Whole30</option>
                <option value="intermittent-fasting">Intermittent Fasting</option>
                <option value="dash">DASH</option>
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="high-protein">High-Protein</option>
                <option value="low-fodmap">Low-FODMAP</option>
                <option value="flexitarian">Flexitarian</option>
              </select>
            </div>

            <div className="settings-section">
              <h3>Units</h3>
              <select
                value={profile?.unitsPreference}
                onChange={e => updateProfile({ unitsPreference: e.target.value as 'metric' | 'imperial' })}
              >
                <option value="metric">Metric (g, kg)</option>
                <option value="imperial">Imperial (oz, lb)</option>
              </select>
            </div>

            <div className="settings-section danger-zone">
              <h3>⚠️ Danger Zone</h3>
              <button className="btn btn-danger" onClick={handleClearData}>
                🗑️ Clear All Data
              </button>
              <p className="helper-text">This will delete your profile, inventory, and dietary history.</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="nav-icon">📦</span>
          <span className="nav-label">Pantry</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <span className="nav-icon">📸</span>
          <span className="nav-label">Import</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </nav>

      {/* Consumption Modal */}
      {showConsumptionModal && selectedItem && (
        <ConsumptionModal
          itemName={selectedItem.itemName}
          onConfirm={handleConsumption}
          onCancel={() => {
            setShowConsumptionModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Pantry Selection Modal */}
      {showPantrySelectionModal && (
        <PantrySelectionModal
          inventory={inventory}
          onSelect={handlePantryItemSelect}
          onCancel={() => setShowPantrySelectionModal(false)}
        />
      )}
    </div>
  );
}

export default App;
