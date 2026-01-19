import React from 'react';
import type { DietType, DietaryGoal } from '../types';

interface ProfileSetupProps {
  onComplete: (dietType: DietType, goals: DietaryGoal[]) => void;
}

const DIET_TYPES: { value: DietType; label: string; description: string }[] = [
  { value: 'low-glycemic', label: 'Low-Glycemic', description: 'Focus on blood sugar stability' },
  { value: 'mediterranean', label: 'Mediterranean', description: 'Balanced diet with healthy fats' },
  { value: 'keto', label: 'Keto', description: 'Very low carb, high fat' },
  { value: 'paleo', label: 'Paleo', description: 'Whole foods, no processed items' },
  { value: 'whole30', label: 'Whole30', description: '30-day elimination diet' },
  { value: 'intermittent-fasting', label: 'Intermittent Fasting', description: 'Time-restricted eating' },
  { value: 'dash', label: 'DASH', description: 'Heart-healthy, low sodium' },
  { value: 'vegan', label: 'Vegan', description: 'No animal products' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat' },
  { value: 'high-protein', label: 'High-Protein', description: 'Emphasis on protein intake' },
  { value: 'low-fodmap', label: 'Low-FODMAP', description: 'Digestive health focused' },
  { value: 'flexitarian', label: 'Flexitarian', description: 'Mostly plant-based with occasional meat' }
];

const DIETARY_GOALS: { value: DietaryGoal; label: string }[] = [
  { value: 'glucose-stability', label: 'Blood Sugar Stability' },
  { value: 'weight-loss', label: 'Weight Loss' },
  { value: 'weight-maintenance', label: 'Weight Maintenance' },
  { value: 'muscle-gain', label: 'Muscle Gain' },
  { value: 'heart-health', label: 'Heart Health' }
];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [selectedDiet, setSelectedDiet] = React.useState<DietType>('mediterranean');
  const [selectedGoals, setSelectedGoals] = React.useState<DietaryGoal[]>(['weight-maintenance']);

  const toggleGoal = (goal: DietaryGoal) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoals.length === 0) {
      alert('Please select at least one dietary goal');
      return;
    }
    onComplete(selectedDiet, selectedGoals);
  };

  return (
    <div className="profile-setup">
      <h2>👋 Welcome to Diet Site</h2>
      <p>Let's set up your dietary preferences to get personalized meal suggestions.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>🥗 Choose Your Diet Type</h3>
          <div className="diet-grid">
            {DIET_TYPES.map(diet => (
              <label 
                key={diet.value} 
                className={`diet-option ${selectedDiet === diet.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="dietType"
                  value={diet.value}
                  checked={selectedDiet === diet.value}
                  onChange={() => setSelectedDiet(diet.value)}
                />
                <span className="diet-label">{diet.label}</span>
                <span className="diet-description">{diet.description}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>🎯 Select Your Goals</h3>
          <div className="goals-list">
            {DIETARY_GOALS.map(goal => (
              <label 
                key={goal.value} 
                className={`goal-option ${selectedGoals.includes(goal.value) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedGoals.includes(goal.value)}
                  onChange={() => toggleGoal(goal.value)}
                />
                <span>{goal.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-large">
          Get Started 🚀
        </button>
      </form>
    </div>
  );
};
