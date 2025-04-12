import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { IconSymbol } from "./ui/IconSymbol";
import { AquariumData } from "@/context/MqttContext";

type WaterType = "lake" | "sea"; // Adjust if the actual values differ

// Define BorderRadius constants locally if not imported globally
const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
};

// --- Types ---
// Original Fish template (used for comparison logic)
// TODO: Consider moving this type to a shared types file if used elsewhere
type FishTemplate = {
  id: string;
  name: string;
  waterType: WaterType;
  turbidity: number;
  ph: number;
  temperature: number;
  tds: number;
};

// Comparison result type
type SeverityLevel = "good" | "warning" | "danger";
type ComparisonResult = {
  parameter: string;
  severity: SeverityLevel;
  message: string;
};
// --- End Types ---

// Helper function to translate water type
// TODO: Consider moving this to a shared utils file
const translateWaterType = (type: WaterType) => {
  return type === "lake" ? "Freshwater" : "Saltwater";
};

type ComparisonAnalysisProps = {
  selectedFish: FishTemplate | null;
  aquariumData: AquariumData;
  pondWaterType: WaterType;
};

export default function ComparisonAnalysis({
  selectedFish,
  aquariumData,
  pondWaterType,
}: ComparisonAnalysisProps) {
  const [comparisonResults, setComparisonResults] = useState<
    ComparisonResult[]
  >([]);

  // Compares selected fish parameters with current pond data
  useEffect(() => {
    if (!selectedFish || !aquariumData) {
      setComparisonResults([]); // Clear results if no fish or data
      return;
    }

    const results: ComparisonResult[] = [];

    // Compare water type
    results.push({
      parameter: "Water Type",
      severity: selectedFish.waterType === pondWaterType ? "good" : "danger",
      message:
        selectedFish.waterType === pondWaterType
          ? "Water type is suitable"
          : `${selectedFish.name} requires ${translateWaterType(
              selectedFish.waterType
            )}, current pond is ${translateWaterType(pondWaterType)}`,
    });

    // Compare pH
    if (aquariumData.ph !== undefined && aquariumData.ph !== null) {
      const phDifference = Math.abs(selectedFish.ph - aquariumData.ph);
      let phSeverity: SeverityLevel = "good";
      let phMessage = "pH level is suitable";
      if (phDifference > 0.5 && phDifference <= 1.0) {
        phSeverity = "warning";
        phMessage = `${selectedFish.name} prefers pH ${selectedFish.ph.toFixed(
          1 // Use selectedFish pH here
        )}, current pond is ${aquariumData.ph.toFixed(1)} (consider adjusting)`;
      } else if (phDifference > 1.0) {
        phSeverity = "danger";
        phMessage = `${selectedFish.name} requires pH ${selectedFish.ph.toFixed(
          1 // Use selectedFish pH here
        )}, current pond is ${aquariumData.ph.toFixed(1)} (critical mismatch)`;
      }
      results.push({
        parameter: "pH",
        severity: phSeverity,
        message: phMessage,
      });
    } else {
      results.push({
        parameter: "pH",
        severity: "warning",
        message: "Current pH data unavailable for comparison.",
      });
    }

    // Compare temperature
    if (
      aquariumData.temperature !== undefined &&
      aquariumData.temperature !== null
    ) {
      const tempDifference = Math.abs(
        selectedFish.temperature - aquariumData.temperature
      );
      let tempSeverity: SeverityLevel = "good";
      let tempMessage = "Temperature is suitable";
      if (tempDifference > 3 && tempDifference <= 5) {
        tempSeverity = "warning";
        tempMessage = `${
          selectedFish.name
        } prefers temperature of ${selectedFish.temperature.toFixed(
          1 // Use selectedFish temp here
        )}°C, current pond is ${aquariumData.temperature.toFixed(
          1
        )}°C (consider adjusting)`;
      } else if (tempDifference > 5) {
        tempSeverity = "danger";
        tempMessage = `${
          selectedFish.name
        } requires temperature of ${selectedFish.temperature.toFixed(
          1 // Use selectedFish temp here
        )}°C, current pond is ${aquariumData.temperature.toFixed(
          1
        )}°C (critical mismatch)`;
      }
      results.push({
        parameter: "Temperature",
        severity: tempSeverity,
        message: tempMessage,
      });
    } else {
      results.push({
        parameter: "Temperature",
        severity: "warning",
        message: "Current temperature data unavailable for comparison.",
      });
    }

    // Compare Turbidity
    if (
      aquariumData.turbidity !== undefined &&
      aquariumData.turbidity !== null
    ) {
      const turbidityDifference = Math.abs(
        selectedFish.turbidity - aquariumData.turbidity
      );
      let turbSeverity: SeverityLevel = "good";
      let turbMessage = "Turbidity is suitable";
      if (turbidityDifference > 5 && turbidityDifference <= 10) {
        turbSeverity = "warning";
        turbMessage = `${
          selectedFish.name
        } prefers turbidity of ${selectedFish.turbidity.toFixed(
          1 // Use selectedFish turbidity here
        )}%, current pond is ${aquariumData.turbidity.toFixed(
          1
        )}% (consider adjusting)`;
      } else if (turbidityDifference > 10) {
        turbSeverity = "danger";
        turbMessage = `${
          selectedFish.name
        } requires turbidity of ${selectedFish.turbidity.toFixed(
          1 // Use selectedFish turbidity here
        )}%, current pond is ${aquariumData.turbidity.toFixed(
          1
        )}% (critical mismatch)`;
      }
      results.push({
        parameter: "Turbidity",
        severity: turbSeverity,
        message: turbMessage,
      });
    } else {
      results.push({
        parameter: "Turbidity",
        severity: "warning",
        message: "Current turbidity data unavailable for comparison.",
      });
    }

    // Compare TDS
    if (aquariumData.tds !== undefined && aquariumData.tds !== null) {
      const tdsDifference = Math.abs(selectedFish.tds - aquariumData.tds);
      let tdsSeverity: SeverityLevel = "good";
      let tdsMessage = "TDS level is suitable";
      if (tdsDifference > 50 && tdsDifference <= 100) {
        tdsSeverity = "warning";
        tdsMessage = `${
          selectedFish.name
        } prefers TDS of ${selectedFish.tds.toFixed(
          0 // Use selectedFish TDS here
        )} ppm, current pond is ${aquariumData.tds.toFixed(
          0
        )} ppm (consider adjusting)`;
      } else if (tdsDifference > 100) {
        tdsSeverity = "danger";
        tdsMessage = `${
          selectedFish.name
        } requires TDS of ${selectedFish.tds.toFixed(
          0 // Use selectedFish TDS here
        )} ppm, current pond is ${aquariumData.tds.toFixed(
          0
        )} ppm (critical mismatch)`;
      }
      results.push({
        parameter: "TDS",
        severity: tdsSeverity,
        message: tdsMessage,
      });
    } else {
      results.push({
        parameter: "TDS",
        severity: "warning",
        message: "Current TDS data unavailable for comparison.",
      });
    }

    setComparisonResults(results); // Update state with comparison results
  }, [selectedFish, aquariumData, pondWaterType]); // Re-run comparison when these change

  // Render only if a fish is selected and results are available
  if (!selectedFish || comparisonResults.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.dataCard}>
      <ThemedView style={styles.cardHeader}>
        <IconSymbol name="checkmark.shield" size={20} color="#0a7ea4" />
        <ThemedText type="subtitle">Compatibility Analysis</ThemedText>
      </ThemedView>
      <ThemedView style={styles.comparisonResults}>
        {comparisonResults.map((result, index) => (
          <ThemedView
            key={index}
            style={[
              styles.comparisonItem,
              result.severity === "warning" && styles.warningItem,
              result.severity === "danger" && styles.dangerItem,
            ]}
          >
            <ThemedView style={styles.comparisonHeader}>
              <IconSymbol
                name={
                  result.severity === "good"
                    ? "checkmark.circle.fill"
                    : result.severity === "warning"
                    ? "exclamationmark.triangle.fill"
                    : "xmark.octagon.fill"
                }
                size={18}
                color={
                  result.severity === "good"
                    ? "#16a34a" // Green
                    : result.severity === "warning"
                    ? "#ea580c" // Orange
                    : "#dc2626" // Red
                }
              />
              <ThemedText style={styles.comparisonParameter}>
                {result.parameter}
              </ThemedText>
            </ThemedView>
            <ThemedText style={styles.comparisonMessage}>
              {result.message}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  dataCard: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#e5e5e5", // Consider using theme colors
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  comparisonResults: {
    gap: 8,
  },
  comparisonItem: {
    backgroundColor: "#f0f9ff", // Consider using theme colors
    padding: 12,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: "#0a7ea4", // Good color
  },
  warningItem: {
    backgroundColor: "#fff7ed", // Consider using theme colors
    borderLeftColor: "#ea580c", // Warning color
  },
  dangerItem: {
    backgroundColor: "#fef2f2", // Consider using theme colors
    borderLeftColor: "#dc2626", // Danger color
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  comparisonParameter: {
    fontSize: 14,
    fontWeight: "600",
  },
  comparisonMessage: {
    fontSize: 13,
    color: "#333", // Consider using theme colors
    paddingLeft: 26, // Indent message under icon/parameter
  },
});
