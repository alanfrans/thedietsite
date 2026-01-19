import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setCookie, getCookie, removeCookie, clearAllCookies, areCookiesEnabled } from '../utils/cookies';

describe('Cookie Utils', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;max-age=0;path=/');
    });
  });

  afterEach(() => {
    // Clean up after each test
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;max-age=0;path=/');
    });
  });

  describe('setCookie and getCookie', () => {
    it('should store and retrieve a simple object', () => {
      const data = { name: 'test', value: 123 };
      setCookie('test_cookie', data);
      const retrieved = getCookie<typeof data>('test_cookie');
      expect(retrieved).toEqual(data);
    });

    it('should store and retrieve an array', () => {
      const data = [1, 2, 3, 'a', 'b', 'c'];
      setCookie('test_array', data);
      const retrieved = getCookie<typeof data>('test_array');
      expect(retrieved).toEqual(data);
    });

    it('should store and retrieve nested objects', () => {
      const data = {
        user: { name: 'John', age: 30 },
        preferences: { diet: 'keto', goals: ['weight-loss'] }
      };
      setCookie('test_nested', data);
      const retrieved = getCookie<typeof data>('test_nested');
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent cookie', () => {
      const retrieved = getCookie('non_existent');
      expect(retrieved).toBeNull();
    });

    it('should compress data for storage', () => {
      const largeData = { items: Array(100).fill({ name: 'item', value: 12345 }) };
      setCookie('test_large', largeData);
      const retrieved = getCookie<typeof largeData>('test_large');
      expect(retrieved).toEqual(largeData);
    });
  });

  describe('removeCookie', () => {
    it('should remove a cookie', () => {
      const data = { test: true };
      setCookie('to_remove', data);
      expect(getCookie('to_remove')).toEqual(data);
      
      removeCookie('to_remove');
      expect(getCookie('to_remove')).toBeNull();
    });
  });

  describe('clearAllCookies', () => {
    it('should clear all diet site cookies', () => {
      setCookie('dietsite_profile', { userId: '123' });
      setCookie('dietsite_inventory', [{ id: '1' }]);
      setCookie('dietsite_history', [{ id: '1' }]);

      clearAllCookies();

      expect(getCookie('dietsite_profile')).toBeNull();
      expect(getCookie('dietsite_inventory')).toBeNull();
      expect(getCookie('dietsite_history')).toBeNull();
    });
  });

  describe('areCookiesEnabled', () => {
    it('should return true when cookies are enabled', () => {
      expect(areCookiesEnabled()).toBe(true);
    });
  });
});
