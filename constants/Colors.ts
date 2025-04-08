/**
 * Hệ thống màu sắc cho ứng dụng SmartAqua
 */

// Màu chính
const primaryColor = '#0a7ea4';
const dangerColor = '#dc2626'; 
const successColor = '#22c55e';
const warningColor = '#f59e0b';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#ffffff',
    backgroundSecondary: 'rgba(0,0,0,0.02)',
    tint: primaryColor,
    icon: '#687076',
    border: '#e5e5e5',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
    primary: primaryColor,
    danger: dangerColor,
    success: successColor,
    warning: warningColor,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    backgroundSecondary: 'rgba(255,255,255,0.05)',
    tint: '#ffffff',
    icon: '#9BA1A6',
    border: '#333333',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#ffffff',
    primary: primaryColor,
    danger: dangerColor,
    success: successColor,
    warning: warningColor,
  },
};

// Kích thước và spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Border radius
export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

// Shadows
export const Shadows = {
  light: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
  },
  dark: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 2,
    },
  },
};
