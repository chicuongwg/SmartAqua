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
import { IconSymbol } from "./ui/IconSymbol"; // Assuming you have an Icon component

// Define the structure for historical data points
export type DataPoint = {
  timestamp: number; // Unix timestamp (milliseconds)
  value: number;
};

// Define available time intervals
type TimeInterval = "1m" | "5m" | "15m" | "1h" | "3h"; // Updated type
const intervals: { key: TimeInterval; label: string; durationMs: number }[] = [
  { key: "1m", label: "1 min", durationMs: 1 * 60 * 1000 }, // Added 1 minute
  { key: "5m", label: "5 min", durationMs: 5 * 60 * 1000 }, // Kept 5 minutes
  { key: "15m", label: "15 min", durationMs: 15 * 60 * 1000 }, // Kept 15 minutes
  { key: "1h", label: "1 hour", durationMs: 60 * 60 * 1000 }, // Kept 1 hour
  { key: "3h", label: "3 hours", durationMs: 3 * 60 * 60 * 1000 }, // Added 3 hours
];

// Define sensor types and their properties (color, unit)
const sensorConfig = {
  temperature: { color: "#ff6384", unit: "°C", name: "Temp" },
  ph: { color: "#36a2eb", unit: "", name: "pH" },
  tds: { color: "#ffcd56", unit: "ppm", name: "TDS" },
  turbidity: { color: "#4bc0c0", unit: "NTU", name: "Turbidity" },
};
type SensorDataType = keyof typeof sensorConfig;

type Props = {
  title: string;
};

export default function DataGraph({ title }: Props) {
  const { width } = useWindowDimensions();
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>("1h");

  const mqttContext = useMqtt();
  const temperatureHistory = mqttContext.temperatureHistory ?? [];
  const phHistory = mqttContext.phHistory ?? [];
  const tdsHistory = mqttContext.tdsHistory ?? [];
  const turbidityHistory = mqttContext.turbidityHistory ?? [];

  const filteredDatasets = useMemo(() => {
    const now = Date.now();
    const selectedDuration =
      intervals.find((i) => i.key === selectedInterval)?.durationMs ??
      intervals[3].durationMs;
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

  const chartData = useMemo(() => {
    const allFiltered = Object.values(filteredDatasets);
    const longestDataset = allFiltered.reduce(
      (longest, current) =>
        current.length > longest.length ? current : longest,
      []
    );

    if (longestDataset.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = longestDataset.map((point, index) => {
      const numLabels = Math.min(longestDataset.length, 6); // Show max ~6 labels
      if (
        index === 0 ||
        index === longestDataset.length - 1 ||
        (longestDataset.length > 1 &&
          index % Math.ceil((longestDataset.length - 1) / (numLabels - 1)) ===
            0)
      ) {
        const date = new Date(point.timestamp);
        // Default to 1 hour in ms if interval not found, then calculate hours
        const durationMs =
          intervals.find((i) => i.key === selectedInterval)?.durationMs ??
          60 * 60 * 1000;
        const durationHours = durationMs / (60 * 60 * 1000);
        if (durationHours >= 48) {
          // Show date for multi-day intervals
          return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
            .getDate()
            .toString()
            .padStart(2, "0")}`;
        } else {
          // Show time for shorter intervals
          return `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        }
      }
      return "";
    });

    const datasets = (Object.keys(sensorConfig) as SensorDataType[])
      .map((key) => {
        const dataPoints = filteredDatasets[key];
        // Ensure dataPoints is an array even if filteredDatasets[key] is undefined/null
        const safeDataPoints = Array.isArray(dataPoints) ? dataPoints : [];
        const dataValues = safeDataPoints.map((point) => point.value);

        // Pad data to match the longest dataset length for consistent x-axis
        const paddedData = dataValues.concat(
          Array(Math.max(0, labels.length - dataValues.length)).fill(null) // Use null for gaps
        );
        // Ensure the final array length matches the labels array length
        const finalData = paddedData.slice(0, labels.length);

        // Only include dataset if it has actual numbers (not just nulls)
        if (finalData.every((val) => val === null)) return null;

        return {
          key: key, // Keep track of the original sensor key
          data: finalData,
          color: (opacity = 1) => {
            // Handle potential hex color string from config
            const baseColor = sensorConfig[key].color;
            if (baseColor.startsWith("#")) {
              // Basic hex to rgba conversion (assuming #RRGGBB format)
              const r = parseInt(baseColor.slice(1, 3), 16);
              const g = parseInt(baseColor.slice(3, 5), 16);
              const b = parseInt(baseColor.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
            // Assume it's already rgba or similar format that supports opacity replacement
            return baseColor.replace(
              /rgba?\((\s*\d+\s*,){2}\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/,
              `rgba($1, ${opacity})`
            );
          },
          strokeWidth: 2.5,
        };
      })
      .filter((ds): ds is NonNullable<typeof ds> => ds !== null);

    // Filter out datasets that ended up with no valid data points (redundant check, but safe)
    const validDatasets = datasets.filter((ds) =>
      ds.data.some((d) => typeof d === "number")
    );

    return {
      labels: labels,
      datasets: validDatasets.map(({ key, ...rest }) => rest), // Remove the temporary key before passing to chart
      legend: validDatasets.map((ds) => sensorConfig[ds.key].name), // Generate legend from valid datasets
    };
  }, [filteredDatasets, selectedInterval]);

  const chartConfig: AbstractChartConfig = {
    backgroundColor: "#f8f9fa", // Light gray background for chart area
    backgroundGradientFrom: "#f8f9fa",
    backgroundGradientTo: "#f8f9fa",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Primary blue for grid/axis lines
    labelColor: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`, // Dark gray labels
    style: {
      borderRadius: 12, // Match container border radius
    },
    propsForDots: {
      r: "4", // Slightly larger dots
      strokeWidth: "0", // No stroke on dots
      // Dot color is inherited from dataset color
    },
    propsForBackgroundLines: {
      strokeDasharray: "3,3", // Dashed grid lines
      stroke: "rgba(0, 122, 255, 0.2)", // Lighter blue for grid lines
    },
  };

  const chartWidth = width - 32; // Container padding (16 * 2)
  // Updated hasData check
  const hasData = chartData.datasets.some((ds) =>
    ds.data.some((d) => d !== null)
  );

  return (
    <ThemedView style={styles.container}>
      {/* Title is now part of the parent component's section header */}
      {/* <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText> */}

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
      <View style={styles.chartWrapper}>
        {hasData ? (
          <LineChart
            // Pass the prepared chartData
            data={{
              labels: chartData.labels,
              datasets: chartData.datasets,
              legend: chartData.legend, // Use the generated legend
            }}
            width={chartWidth}
            height={260} // Increased height for better spacing and legend
            chartConfig={chartConfig}
            bezier // Smoother lines
            style={styles.chartStyle}
            withInnerLines={true} // Show inner grid lines (now dashed)
            withOuterLines={true}
            fromZero={false}
            // verticalLabelRotation={30} // Only if labels overlap significantly
            // hidePointsAtIndex={[]}
            legendOffset={10} // Push legend down slightly
            yAxisInterval={1} // Auto interval calculation
            segments={4} // Suggest number of horizontal grid lines
            formatYLabel={(yLabel) => {
              const num = parseFloat(yLabel);
              return isNaN(num)
                ? ""
                : num.toFixed(chartConfig.decimalPlaces ?? 1);
            }}
            paddingRight={35} // Ensure right-most label/point is visible
            paddingTop={10} // Add padding above chart lines
          />
        ) : (
          <View
            style={[styles.placeholder, { height: 260, width: chartWidth }]}
          >
            <IconSymbol name="chart.bar.xaxis" size={40} color="#adb5bd" />
            <ThemedText style={styles.placeholderText}>
              No data available for the selected period ({selectedInterval}).
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

// Keep the named export
export { DataGraph };

const styles = StyleSheet.create({
  container: {
    // Removed marginVertical, handled by parent card spacing
    // Removed paddingBottom, handled by chartWrapper
    borderRadius: 12, // Match parent card radius
    alignItems: "center",
    width: "100%",
    backgroundColor: "transparent", // Use parent card background
    // Removed shadow, handled by parent card
  },
  // Removed title style as title is now external
  intervalSelector: {
    width: "100%",
    marginBottom: 12, // Space between buttons and chart
    marginTop: 4, // Small space above buttons if title was removed
  },
  intervalSelectorContent: {
    paddingHorizontal: 16, // Align with card padding
    gap: 8,
  },
  intervalButton: {
    paddingVertical: 8, // Slightly larger touch area
    paddingHorizontal: 14,
    borderRadius: 20, // Pill shape
    backgroundColor: "rgba(224, 224, 224, 0.7)", // Softer background
    borderWidth: 1,
    borderColor: "rgba(200, 200, 200, 0.5)",
  },
  selectedIntervalButton: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  intervalButtonText: {
    fontSize: 14, // Slightly larger text
    color: "#444", // Darker gray text
    fontWeight: "500",
  },
  selectedIntervalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  chartWrapper: {
    // Added wrapper for chart/placeholder background and padding
    width: "100%",
    backgroundColor: "#f8f9fa", // Light background specifically for the chart area
    borderRadius: 12,
    paddingVertical: 10, // Padding inside the chart background area
    overflow: "hidden", // Clip chart edges to border radius
  },
  chartStyle: {
    // marginVertical: 0, // Remove margin, use wrapper padding
    borderRadius: 12, // Match wrapper radius
    // paddingRight is now a prop in LineChart component
  },
  placeholder: {
    borderRadius: 12, // Match wrapper radius
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa", // Match chart background
    gap: 10, // Space between icon and text
  },
  placeholderText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#6c757d", // Bootstrap's gray color
    fontSize: 14,
  },
});
