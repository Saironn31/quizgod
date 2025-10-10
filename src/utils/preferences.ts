export type PreferenceKey =
  | 'quizzes_search'
  | 'quizzes_subjectFilter'
  | 'classes_sortBy'
  | 'leaderboard_sortBy'
  | 'friends_search';

export const loadPreference = (key: PreferenceKey) => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load preference', key, e);
    return null;
  }
};

export const savePreference = (key: PreferenceKey, value: any) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save preference', key, e);
  }
};

export const clearPreference = (key: PreferenceKey) => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear preference', key, e);
  }
};