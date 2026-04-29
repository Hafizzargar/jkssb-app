export const themes = {
  dark: {
    name: 'Dark Mode',
    colors: {
      primary: '#635BFF', // Modern Indigo/Purple
      secondary: '#4A42DB',
      background: '#13131A', // Very dark slate/purple
      surface: '#1C1C26', // Lighter dark shade for cards
      text: '#FFFFFF',
      textMuted: '#8E8E9F',
      placeholder: '#4B4B5E', // Distinctly darker than text and muted text
      border: 'rgba(255,255,255,0.08)',
      card: '#1C1C26',
      error: '#ef4444',
      success: '#22c55e',
    }
  },
  light: {
    name: 'Light Mode',
    colors: {
      primary: '#f59e0b',
      secondary: '#d97706',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: 'rgba(0,0,0,0.05)',
      card: '#ffffff',
      error: '#ef4444',
      success: '#16a34a',
    }
  },
  read: {
    name: 'Read Mode',
    colors: {
      primary: '#92400e',
      secondary: '#78350f',
      background: '#fef3c7', // Warm Cream
      surface: '#fae8b0',
      text: '#451a03',
      textMuted: '#92400e80',
      border: 'rgba(0,0,0,0.05)',
      card: '#fae8b0',
      error: '#dc322f',
      success: '#859900',
    }
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};
