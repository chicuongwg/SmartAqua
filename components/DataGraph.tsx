import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

type Props = {
  title: string;
  data: number[];
  labels: string[];
  color: string;
  unit: string;
};

export default function DataGraph({ title, data, labels, color, unit }: Props) {
  // Placeholder component - in a real app, you'd import and use a charting library
  // like react-native-chart-kit, react-native-svg-charts, or victory-native
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <View style={[styles.graphPlaceholder, { backgroundColor: color + '20' }]}>
        <ThemedText style={styles.placeholderText}>
          Graph visualization would be displayed here
        </ThemedText>
        <ThemedText style={styles.placeholderSubtext}>
          {data.length > 0 ? `Latest value: ${data[data.length - 1]} ${unit}` : 'No data available'}
        </ThemedText>
      </View>
      <ThemedText style={styles.unitText}>{`Unit: ${unit}`}</ThemedText>
    </ThemedView>
  );
}

// Keep the named export for backwards compatibility
export { DataGraph };

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  graphPlaceholder: {
    marginVertical: 8,
    borderRadius: 16,
    width: Dimensions.get('window').width - 64,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  placeholderSubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  unitText: {
    fontSize: 12,
    opacity: 0.7,
    alignSelf: 'flex-start',
    marginTop: 4,
  }
});