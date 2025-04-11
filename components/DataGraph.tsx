import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { AbstractChartConfig } from "react-native-chart-kit/dist/AbstractChart";
import { useMqtt } from "@/context/MqttContext";

// Define the structure for historical data points
export type DataPoint = {
  timestamp: number; // Unix timestamp (milliseconds)
  value: number;
};

// Define available time intervals
type TimeInterval = "5m" | "15m" | "30m" | "1h" | "8h" | "1d" | "1w";
const intervals: { key: TimeInterval; label: string; durationMs: number }[] = [
  { key: "5m", label: "5m", durationMs: 5 * 60 * 1000 },
  { key: "15m", label: "15m", durationMs: 15 * 60 * 1000 },
  { key: "30m", label: "30m", durationMs: 30 * 60 * 1000 },
  { key: "1h", label: "1h", durationMs: 60 * 60 * 1000 },
  { key: "8h", label: "8h", durationMs: 8 * 60 * 60 * 1000 },
  { key: "1d", label: "1d", durationMs: 24 * 60 * 60 * 1000 },
  { key: "1w", label: "1w", durationMs: 7 * 24 * 60 * 60 * 1000 },
];

// Define sensor types and their properties (color, unit)
const sensorConfig = {
  temperature: { color: "#ff6384", unit: "°C", name: "Temp" },
  ph: { color: "#36a2eb", unit: "", name: "pH" },
  tds: { color: "#ffcd56", unit: "ppm", name: "TDS" },
  turbidity: { color: "#4bc0c0", unit: "NTU", name: "Turbidity" }, // Or '%'
};
type SensorDataType = keyof typeof sensorConfig;

type Props = {
  title: string; // More general title like "Sensor History"
  // REMOVED: dataType, color, unit - component now handles all sensors
  // Optional: Pass thresholds if needed for background lines/styling
  // warningThresholds?: { [key in SensorDataType]?: number };
  // dangerThresholds?: { [key in SensorDataType]?: number };
};

export default function DataGraph({
  title,
}: // warningThresholds,
// dangerThresholds,
Props) {
  const { width } = useWindowDimensions();
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>("1h");

  // --- Get all historical data from MQTT Context ---
  // Access properties directly and provide defaults in case they don't exist on the context type/value
  const mqttContext = useMqtt();
  const temperatureHistory = mqttContext.temperatureHistory ?? [];
  const phHistory = mqttContext.phHistory ?? [];
  const tdsHistory = mqttContext.tdsHistory ?? [];
  const turbidityHistory = mqttContext.turbidityHistory ?? [];

  // --- Filter all datasets based on the selected interval ---
  const filteredDatasets = useMemo(() => {
    const now = Date.now();
    const selectedDuration =
      intervals.find((i) => i.key === selectedInterval)?.durationMs ??
      intervals[3].durationMs; // Default to 1h
    const startTime = now - selectedDuration;

    const filterAndSort = (data: DataPoint[]) => {
      const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
      return sorted.filter((point) => point.timestamp >= startTime);
    };

    return {
      temperature: filterAndSort(temperatureHistory),
      ph: filterAndSort(phHistory),
      tds: filterAndSort(tdsHistory),
      turbidity: filterAndSort(turbidityHistory),
    };
  }, [
    selectedInterval,
    temperatureHistory,
    phHistory,
    tdsHistory,
    turbidityHistory,
  ]);
  // --- End filtering data ---

  // --- Prepare data for the multi-line chart ---
  const chartData = useMemo(() => {
    // Find the dataset with the most points to determine labels
    // This is a simple strategy; more complex alignment might be needed
    const allFiltered = Object.values(filteredDatasets);
    const longestDataset = allFiltered.reduce(
      (longest, current) =>
        current.length > longest.length ? current : longest,
      []
    );

    if (longestDataset.length === 0) {
      return { labels: [], datasets: [] }; // No data to display
    }

    // Generate labels based on the longest dataset's timestamps
    const labels = longestDataset.map((point, index) => {
      if (
        index === 0 ||
        index === longestDataset.length - 1 ||
        index % Math.ceil(longestDataset.length / 5) === 0
      ) {
        const date = new Date(point.timestamp);
        return `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      }
      return "";
    });

    // Create dataset objects for the chart
    const datasets = (Object.keys(sensorConfig) as SensorDataType[])
      .map((key) => {
        const dataPoints = filteredDatasets[key];
        // IMPORTANT: Ensure data array length matches label length.
        // This simple approach might misalign data if timestamps don't match perfectly.
        // A more robust solution would involve resampling or aligning data points to common timestamps.
        // For now, we just use the values, which might lead to visual shifts if data points are sparse.
        const dataValues = dataPoints.map((point) => point.value);

        // Pad data if shorter than labels (basic alignment)
        const paddedData = dataValues.concat(
          Array(Math.max(0, labels.length - dataValues.length)).fill(null)
        );
        // Truncate data if longer than labels
        const finalData = paddedData.slice(0, labels.length);

        if (dataPoints.length === 0) return null; // Don't add empty datasets

        return {
          data: finalData, // Use potentially padded/truncated data
          color: (opacity = 1) => sensorConfig[key].color, // Get color from config
          strokeWidth: 2,
          // Optional: Add legend name here if not using chart legend prop
          // legend: sensorConfig[key].name
        };
      })
      .filter((ds): ds is NonNullable<typeof ds> => ds !== null); // Remove null entries

    return {
      labels: labels,
      datasets: datasets,
      legend: (Object.keys(sensorConfig) as SensorDataType[]).map(
        (key) => sensorConfig[key].name // Add legend names
      ),
    };
  }, [filteredDatasets]); // Depends on filtered data for all sensors
  // --- End preparing chart data ---

  // Chart configuration
  const chartConfig: AbstractChartConfig = {
    backgroundColor: "#1cc910", // Not really visible with gradient
    backgroundGradientFrom: "#ffffff", // White background start
    backgroundGradientTo: "#ffffff", // White background end
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Label/axis color
    labelColor: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`, // Darker labels
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "3", // Smaller dots for multiple lines
      strokeWidth: "1",
      // stroke: color, // Stroke is now dataset-specific
    },
    // Disable yAxisSuffix as units differ
    // yAxisSuffix: ` ${unit}`,
  };

  const chartWidth = width - 32; // Adjust based on container padding

  // Check if there's any data to display across all datasets
  const hasData = chartData.datasets.some((ds) => ds.data.length > 0);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>

      {/* Interval Selection Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.intervalSelector}
        contentContainerStyle={styles.intervalSelectorContent}
      >
        {intervals.map((interval) => (
          <TouchableOpacity
            key={interval.key}
            style={[
              styles.intervalButton,
              selectedInterval === interval.key &&
                styles.selectedIntervalButton,
            ]}
            onPress={() => setSelectedInterval(interval.key)}
          >
            <ThemedText
              style={[
                styles.intervalButtonText,
                selectedInterval === interval.key &&
                  styles.selectedIntervalButtonText,
              ]}
            >
              {interval.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chart Area */}
      {hasData ? (
        <LineChart
          data={chartData}
          width={chartWidth}
          height={250} // Slightly taller for legend
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
          // yAxisSuffix is removed as units differ
          withInnerLines={false} // Optional: Hide inner grid lines
          withOuterLines={true} // Optional: Show outer grid lines
          fromZero={false} // Adjust based on expected data range
          // verticalLabelRotation={30} // Optional: Rotate x-axis labels if needed
          // hidePointsAtIndex={[]} // Optional: Hide dots if too cluttered
          legendOffset={-10} // Adjust legend position if needed
        />
      ) : (
        <View style={[styles.placeholder, { height: 250, width: chartWidth }]}>
          <ThemedText style={styles.placeholderText}>
            No data available for the selected period ({selectedInterval}).
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

// Keep the named export
export { DataGraph };

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingBottom: 16, // Add padding at the bottom
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    marginTop: 16, // More space at the top
    marginBottom: 8,
    fontWeight: "600",
  },
  intervalSelector: {
    width: "100%",
    marginBottom: 10,
  },
  intervalSelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  intervalButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
  },
  selectedIntervalButton: {
    backgroundColor: "#0a7ea4",
  },
  intervalButtonText: {
    fontSize: 13,
    color: "#333",
  },
  selectedIntervalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  chartStyle: {
    // marginVertical: 8, // Removed vertical margin
    borderRadius: 16,
    paddingRight: 35, // Add padding to prevent y-axis label cutoff
  },
  placeholder: {
    // marginVertical: 8, // Removed vertical margin
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#666",
  },
});
