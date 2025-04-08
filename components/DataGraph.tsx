import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";

type Props = {
  title: string;
  data: number[];
  labels: string[];
  color: string;
  unit: string;
};

export default function DataGraph({ title, data, labels, color, unit }: Props) {
  // Use useWindowDimensions instead of hardcoded width
  const { width } = useWindowDimensions();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{title}</ThemedText>

      {/* Remove the fixed width and allow it to flex within its parent */}
      <View
        style={[styles.graphPlaceholder, { backgroundColor: color + "20" }]}
      >
        <ThemedText style={styles.placeholderText}>
          Graph visualization would be displayed here
        </ThemedText>
        <ThemedText style={styles.placeholderSubtext}>
          {data.length > 0
            ? `Latest value: ${data[data.length - 1]} ${unit}`
            : "No data available"}
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
    padding: 0, // Remove padding here to prevent double-padding
    borderRadius: 16,
    alignItems: "center",
    width: "100%", // Ensure container takes full width of parent
  },
  graphPlaceholder: {
    marginVertical: 8,
    borderRadius: 16,
    width: "100%", // Use percentage instead of fixed width
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  placeholderText: {
    textAlign: "center",
    fontStyle: "italic",
  },
  placeholderSubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  unitText: {
    fontSize: 12,
    opacity: 0.7,
    alignSelf: "flex-start",
    marginTop: 4,
  },
});
