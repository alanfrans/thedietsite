import LZString from 'lz-string';

const MAX_COOKIE_SIZE = 4000; // Leave some buffer below 4KB limit

export interface CookieOptions {
  maxAge?: number; // in seconds
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

const defaultOptions: CookieOptions = {
  maxAge: 365 * 24 * 60 * 60, // 1 year
  path: '/',
  sameSite: 'Strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:'
};

/**
 * Compress and encode data for cookie storage
 */
function compressData<T>(data: T): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompress and decode data from cookie storage
 */
function decompressData<T>(compressed: string): T | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Split data across multiple cookies if needed
 */
function splitIntoCookies(name: string, data: string): { name: string; value: string }[] {
  const cookies: { name: string; value: string }[] = [];
  let remaining = data;
  let index = 0;

  while (remaining.length > 0) {
    const chunk = remaining.slice(0, MAX_COOKIE_SIZE);
    remaining = remaining.slice(MAX_COOKIE_SIZE);
    cookies.push({
      name: remaining.length > 0 || index > 0 ? `${name}_${index}` : name,
      value: chunk
    });
    index++;
  }

  // Store the count of cookies for reconstruction
  if (cookies.length > 1) {
    cookies.unshift({
      name: `${name}_count`,
      value: String(cookies.length)
    });
  }

  return cookies;
}

/**
 * Reconstruct data from multiple cookies
 */
function reconstructFromCookies(name: string, getCookieFn: (name: string) => string | undefined): string | undefined {
  // Check if there's a count cookie indicating multiple parts
  const countValue = getCookieFn(`${name}_count`);
  
  if (countValue) {
    const count = parseInt(countValue, 10);
    let data = '';
    for (let i = 0; i < count; i++) {
      const chunk = getCookieFn(`${name}_${i}`);
      if (chunk === undefined) return undefined;
      data += chunk;
    }
    return data;
  }
  
  // Try single cookie first
  const single = getCookieFn(name);
  if (single !== undefined) return single;
  
  // Try _0 suffix in case it was split
  return getCookieFn(`${name}_0`);
}

/**
 * Get a cookie value by name
 */
function getRawCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.split('=');
    if (cookieName.trim() === name) {
      return rest.join('=');
    }
  }
  return undefined;
}

/**
 * Set a raw cookie
 */
function setRawCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  
  const opts = { ...defaultOptions, ...options };
  let cookie = `${name}=${value}`;
  
  if (opts.maxAge !== undefined) cookie += `; max-age=${opts.maxAge}`;
  if (opts.path) cookie += `; path=${opts.path}`;
  if (opts.sameSite) cookie += `; samesite=${opts.sameSite}`;
  if (opts.secure) cookie += '; secure';
  
  document.cookie = cookie;
}

/**
 * Delete a cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; max-age=0; path=/`;
}

/**
 * Clear all cookies with a specific prefix (for split cookies)
 */
function clearCookiesWithPrefix(prefix: string): void {
  if (typeof document === 'undefined') return;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName] = cookie.split('=');
    const trimmedName = cookieName.trim();
    if (trimmedName === prefix || trimmedName.startsWith(`${prefix}_`)) {
      deleteCookie(trimmedName);
    }
  }
}

/**
 * Set a cookie with compressed JSON data, splitting if needed
 */
export function setCookie<T>(name: string, data: T, options: CookieOptions = {}): void {
  // Clear any existing cookies with this prefix
  clearCookiesWithPrefix(name);
  
  const compressed = compressData(data);
  const cookieParts = splitIntoCookies(name, compressed);
  
  for (const part of cookieParts) {
    setRawCookie(part.name, part.value, options);
  }
}

/**
 * Get a cookie and decompress JSON data, reconstructing from multiple cookies if needed
 */
export function getCookie<T>(name: string): T | null {
  const compressed = reconstructFromCookies(name, getRawCookie);
  if (!compressed) return null;
  return decompressData<T>(compressed);
}

/**
 * Delete a cookie (and all its parts if split)
 */
export function removeCookie(name: string): void {
  clearCookiesWithPrefix(name);
}

/**
 * Clear all diet site cookies
 */
export function clearAllCookies(): void {
  removeCookie('dietsite_profile');
  removeCookie('dietsite_inventory');
  removeCookie('dietsite_history');
}

/**
 * Check if cookies are available
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    document.cookie = 'test=1; max-age=1';
    const enabled = document.cookie.includes('test=1');
    document.cookie = 'test=; max-age=0';
    return enabled;
  } catch {
    return false;
  }
}
