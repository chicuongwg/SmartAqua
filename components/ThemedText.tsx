import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

type TextType = 'default' | 'title' | 'subtitle' | 'small';

type Props = {
  children: React.ReactNode;
  type?: TextType;
  style?: TextStyle;
};

export default function ThemedText({ children, type = 'default', style }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Text
      style={[
        styles.text,
        isDark ? styles.darkText : styles.lightText,
        styles[type],
        style
      ]}>
      {children}
    </Text>
  );
}

// Keep the named export for backwards compatibility
export { ThemedText };

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
  lightText: {
    color: '#000000',
  },
  darkText: {
    color: '#ffffff',
  },
  default: {},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  small: {
    fontSize: 12,
  },
});