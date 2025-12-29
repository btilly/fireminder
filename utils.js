// Fireminder - Utility Functions

// ===== FIBONACCI SEQUENCE =====
export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];

export function getFibIndex(value) {
  const idx = FIBONACCI.indexOf(value);
  return idx === -1 ? 1 : idx; // Default to index 1 (value 2)
}

export function getFibValue(index) {
  if (index < 0) return FIBONACCI[0];
  if (index >= FIBONACCI.length) return FIBONACCI[FIBONACCI.length - 1];
  return FIBONACCI[index];
}

export function getShorterInterval(current) {
  const idx = getFibIndex(current);
  return getFibValue(idx - 1);
}

export function getLongerInterval(current) {
  const idx = getFibIndex(current);
  return getFibValue(idx + 1);
}

// ===== DATE HELPERS =====
// IMPORTANT: All dates are LOCAL dates (user's timezone). No UTC conversion.
// We store dates as "YYYY-MM-DD" strings and compare them lexicographically.

/**
 * Parse a "YYYY-MM-DD" string as a LOCAL date (not UTC).
 * new Date("2025-12-30") parses as midnight UTC which causes off-by-one bugs.
 * This function creates midnight LOCAL time.
 */
export function parseLocalDate(dateStr) {
  if (dateStr instanceof Date) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

export function addDays(date, days) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(date1, date2) {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  const diffTime = d2 - d1;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a date as "YYYY-MM-DD" using LOCAL time (not UTC).
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ===== THEME MANAGEMENT =====
export const THEMES = ['light', 'dark', 'ocean', 'forest', 'rose', 'ember'];

export function getStoredTheme() {
  return localStorage.getItem('fireminder-theme') || 'light';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fireminder-theme', theme);
}

// ===== DISPLAY HELPERS =====
export function formatHistoryDate(dateStr) {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function formatDueDate(dateStr, today) {
  if (!dateStr) return 'Not scheduled';
  const days = daysBetween(today, dateStr);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `in ${days} days`;
}

