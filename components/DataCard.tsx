import React from 'react';
// Fix the imports - use standard React Native imports instead of internal paths
import { View, Platform, StyleSheet } from 'react-native';
// Use proper imports with '@/' alias to avoid path resolution issues
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Props = {
  title: string;
  value: number | undefined;
  unit: string;
  icon: "house.fill" | "paperplane.fill" | "chevron.left.forwardslash.chevron.right" | "chevron.right" | "thermometer" | "water" | "molecule" | "eyedropper" | "chart.line.uptrend.xyaxis";
};

export default function DataCard({ title, value, unit, icon }: Props) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.iconContainer}>
        <IconSymbol name={icon} size={24} color="#0a7ea4" />
      </View>
      <ThemedText type="subtitle">{title}</ThemedText>
      <View style={styles.valueContainer}>
        <ThemedText style={styles.value}>
          {value !== undefined ? value.toString() : '--'}
        </ThemedText>
        <ThemedText style={styles.unit}>{unit}</ThemedText>
      </View>
    </ThemedView>
  );
}

// Also export as named export for backward compatibility
export { DataCard };

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // Use the new boxShadow property for iOS
    ...Platform.select({
      ios: {
        boxShadow: '0px 1px 1.5px rgba(0, 0, 0, 0.2)'
      },
      // Keep using elevation for Android (it doesn't support boxShadow)
      android: {
        elevation: 2
      },
      // For web
      default: {
        boxShadow: '0px 1px 1.5px rgba(0, 0, 0, 0.2)'
      }
    }),
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
  },
  unit: {
    marginLeft: 4,
    fontSize: 12,
    opacity: 0.7,
  },
});