export const themes = {
  dark: {
    name: 'Dark Mode',
    colors: {
      primary: '#fbbf24', // Subtle Amber
      secondary: '#d97706',
      background: '#0f172a', // Deep Slate/Blue
      surface: '#1e293b', // Lighter Slate
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: 'rgba(255,255,255,0.06)',
      card: '#1e293b',
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
