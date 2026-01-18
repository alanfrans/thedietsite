import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, DietType, DietaryGoal } from '../types';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';

const COOKIE_NAME = 'dietsite_profile';

const defaultProfile: UserProfile = {
  userId: '',
  dietType: 'mediterranean',
  dietaryGoals: ['weight-maintenance'],
  eatingSchedule: {
    breakfast: '07:00',
    lunch: '12:00',
    dinner: '18:00',
    snacks: ['10:00', '15:00']
  },
  allergies: [],
  intolerances: [],
  unitsPreference: 'metric'
};

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile from cookie on mount
  useEffect(() => {
    try {
      const stored = getCookie<UserProfile>(COOKIE_NAME);
      if (stored) {
        setProfileState(stored);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile from storage');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save profile to cookie whenever it changes
  const setProfile = useCallback((newProfile: UserProfile | ((prev: UserProfile | null) => UserProfile)) => {
    try {
      const updated = typeof newProfile === 'function' 
        ? newProfile(profile) 
        : newProfile;
      
      if (updated) {
        setCookie(COOKIE_NAME, updated);
        setProfileState(updated);
        setError(null);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile to storage');
    }
  }, [profile]);

  // Initialize a new profile
  const initProfile = useCallback((dietType: DietType, goals: DietaryGoal[] = ['weight-maintenance']) => {
    const newProfile: UserProfile = {
      ...defaultProfile,
      userId: generateUserId(),
      dietType,
      dietaryGoals: goals
    };
    setProfile(newProfile);
    return newProfile;
  }, [setProfile]);

  // Update specific profile fields
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  }, [profile, setProfile]);

  // Clear profile
  const clearProfile = useCallback(() => {
    removeCookie(COOKIE_NAME);
    setProfileState(null);
  }, []);

  // Check if profile exists
  const hasProfile = profile !== null;

  return {
    profile,
    loading,
    error,
    hasProfile,
    setProfile,
    initProfile,
    updateProfile,
    clearProfile
  };
}
