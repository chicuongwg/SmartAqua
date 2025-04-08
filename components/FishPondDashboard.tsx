import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTaoMqtt } from "@/hooks/useTaoMqtt";
import { Colors, Spacing, BorderRadius } from "@/constants/Colors";
import Button from "@/components/Button";

// Fish template data types
type WaterType = "lake" | "ocean";

type FishTemplate = {
  id: string;
  name: string;
  waterType: WaterType;
  turbidity: number;
  ph: number;
  temperature: number;
  tds: number; // Add this
};

// Current pond parameters
type PondParameters = {
  waterType: WaterType;
  turbidity: number;
  ph: number;
  temperature: number;
  tds: number; // Add this
};

// Comparison result
type ComparisonResult = {
  parameter: string;
  isMatch: boolean;
  message: string;
};

// Sample fish database - Replace with API call in production
const FISH_DATABASE: FishTemplate[] = [
  {
    id: "1",
    name: "Climbing Perch",
    waterType: "lake",
    turbidity: 20,
    ph: 7.0,
    temperature: 26,
    tds: 200, // Add this
  },
  {
    id: "2",
    name: "Common Carp",
    waterType: "lake",
    turbidity: 15,
    ph: 7.2,
    temperature: 23,
    tds: 150, // Add this
  },
  {
    id: "3",
    name: "Salmon",
    waterType: "lake",
    turbidity: 5,
    ph: 6.8,
    temperature: 15,
    tds: 100, // Add this
  },
  {
    id: "4",
    name: "Arowana",
    waterType: "lake",
    turbidity: 10,
    ph: 7.0,
    temperature: 28,
    tds: 180, // Add this
  },
  {
    id: "5",
    name: "Clownfish",
    waterType: "ocean",
    turbidity: 5,
    ph: 8.2,
    temperature: 26,
    tds: 300, // Add this
  },
  {
    id: "6",
    name: "Stingray",
    waterType: "ocean",
    turbidity: 10,
    ph: 8.0,
    temperature: 25,
    tds: 250, // Add this
  },
];

export default function FishPondDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FishTemplate[]>([]);
  const [selectedFish, setSelectedFish] = useState<FishTemplate | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pondParameters, setPondParameters] = useState<PondParameters>({
    waterType: "lake",
    turbidity: 0,
    ph: 0,
    temperature: 0,
    tds: 0,
  });
  const [comparisonResults, setComparisonResults] = useState<
    ComparisonResult[]
  >([]);

  // Subscribe to MQTT topics to get real-time pond data
  const mqttClient = useTaoMqtt("mqtt://broker.hivemq.com:1883", "", {
    clientId: `fish-pond-dash-${Math.random().toString(16).slice(2, 8)}`,
  });

  // Subscribe to topics when connected
  useEffect(() => {
    if (mqttClient.isConnected) {
      mqttClient.subscribe("smart-aqua/temp");
      mqttClient.subscribe("smart-aqua/ph");
      mqttClient.subscribe("smart-aqua/tds");
      mqttClient.subscribe("smart-aqua/turbidity");
    }
  }, [mqttClient.isConnected]);

  // Process MQTT messages to update pond parameters
  useEffect(() => {
    if (mqttClient.messages.length > 0) {
      const newData = { ...pondParameters };

      const latestMessages = mqttClient.messages.slice(-10);
      latestMessages.forEach((msg) => {
        const value = parseFloat(msg.message);
        if (!isNaN(value)) {
          if (msg.topic === "smart-aqua/temp") newData.temperature = value;
          else if (msg.topic === "smart-aqua/ph") newData.ph = value;
          else if (msg.topic === "smart-aqua/tds")
            newData.tds = value; // Add this
          else if (msg.topic === "smart-aqua/turbidity")
            newData.turbidity = value;
        }
      });

      setPondParameters(newData);
    }
  }, [mqttClient.messages]);

  // Search function
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length > 1) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        const filteredResults = FISH_DATABASE.filter((fish) =>
          fish.name.toLowerCase().includes(text.toLowerCase())
        );
        setSearchResults(filteredResults);
        setShowSearchResults(true);
        setIsLoading(false);
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Select fish and compare parameters
  const selectFish = (fish: FishTemplate) => {
    setSelectedFish(fish);
    setShowSearchResults(false);
    setSearchQuery(fish.name);

    // Compare fish template with pond parameters
    compareParameters(fish);
  };

  // Helper function to translate water type to English
  const translateWaterType = (type: WaterType): string => {
    return type === "lake" ? "freshwater" : "saltwater";
  };

  // Compare parameters and generate warnings
  const compareParameters = (fish: FishTemplate) => {
    const results: ComparisonResult[] = [];

    // Compare water type
    results.push({
      parameter: "Water Type",
      isMatch: fish.waterType === pondParameters.waterType,
      message:
        fish.waterType === pondParameters.waterType
          ? "Water type is suitable"
          : `${fish.name} requires ${translateWaterType(
              fish.waterType
            )}, current pond is ${translateWaterType(
              pondParameters.waterType
            )}`,
    });

    // Compare pH
    const phDifference = Math.abs(fish.ph - pondParameters.ph);
    results.push({
      parameter: "pH",
      isMatch: phDifference <= 0.5,
      message:
        phDifference <= 0.5
          ? "pH level is suitable"
          : `${fish.name} requires pH ${
              fish.ph
            }, current pond is ${pondParameters.ph.toFixed(1)}`,
    });

    // Compare temperature
    const tempDifference = Math.abs(
      fish.temperature - pondParameters.temperature
    );
    results.push({
      parameter: "Temperature",
      isMatch: tempDifference <= 3,
      message:
        tempDifference <= 3
          ? "Temperature is suitable"
          : `${fish.name} requires temperature of ${
              fish.temperature
            }°C, current pond is ${pondParameters.temperature.toFixed(1)}°C`,
    });

    // Compare turbidity
    const turbidityDifference = Math.abs(
      fish.turbidity - pondParameters.turbidity
    );
    results.push({
      parameter: "Turbidity",
      isMatch: turbidityDifference <= 5,
      message:
        turbidityDifference <= 5
          ? "Turbidity is suitable"
          : `${fish.name} requires turbidity of ${
              fish.turbidity
            }%, current pond is ${pondParameters.turbidity.toFixed(1)}%`,
    });

    // Compare TDS
    const tdsDifference = Math.abs(fish.tds - pondParameters.tds);
    results.push({
      parameter: "TDS",
      isMatch: tdsDifference <= 50, // 50 ppm tolerance
      message:
        tdsDifference <= 50
          ? "TDS level is suitable"
          : `${fish.name} requires TDS of ${
              fish.tds
            } ppm, current pond is ${pondParameters.tds.toFixed(0)} ppm`,
    });

    setComparisonResults(results);
  };

  // Refresh pond data
  const refreshPondData = () => {
    if (!mqttClient.isConnected) {
      mqttClient.connect();
    }

    // If a fish is selected, re-compare after refresh
    if (selectedFish) {
      compareParameters(selectedFish);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.sectionHeader}>
        <IconSymbol name="water" size={22} color="#0a7ea4" />
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Fish Compatibility
        </ThemedText>
      </ThemedView>

      {/* Search Section */}
      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for fish..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {isLoading && (
          <ActivityIndicator
            size="small"
            color="#0a7ea4"
            style={styles.searchSpinner}
          />
        )}
      </ThemedView>

      {/* Search Results */}
      {showSearchResults && (
        <ThemedView style={styles.searchResultsContainer}>
          {searchResults.length === 0 ? (
            <ThemedText style={styles.noResultsText}>
              No fish species found
            </ThemedText>
          ) : (
            <ScrollView
              style={styles.searchResultsList}
              nestedScrollEnabled={true}
            >
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchResultItem}
                  onPress={() => selectFish(item)}
                >
                  <ThemedText>{item.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ThemedView>
      )}

      {/* Selected Fish Template */}
      {selectedFish && (
        <ThemedView style={styles.dataCard}>
          <ThemedView style={styles.cardHeader}>
            <IconSymbol name="water" size={20} color="#0a7ea4" />
            <ThemedText type="subtitle">
              Standard parameters for {selectedFish.name}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.parametersList}>
            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>Water Type:</ThemedText>
              <ThemedText style={styles.parameterValue}>
                {translateWaterType(selectedFish.waterType)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>
                Temperature (°C):
              </ThemedText>
              <ThemedText style={styles.parameterValue}>
                {selectedFish.temperature}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>pH:</ThemedText>
              <ThemedText style={styles.parameterValue}>
                {selectedFish.ph}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>TDS (ppm):</ThemedText>
              <ThemedText style={styles.parameterValue}>
                {selectedFish.tds}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>
                Turbidity (%):
              </ThemedText>
              <ThemedText style={styles.parameterValue}>
                {selectedFish.turbidity}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}

      {/* Pond Parameters */}
      <ThemedView style={styles.dataCard}>
        <ThemedView style={styles.cardHeader}>
          <IconSymbol
            name="chart.line.uptrend.xyaxis"
            size={20}
            color="#0a7ea4"
          />
          <ThemedText type="subtitle">Current Pond Parameters</ThemedText>
        </ThemedView>

        <ThemedView style={styles.parametersList}>
          <ThemedView style={styles.parameterItem}>
            <ThemedText style={styles.parameterLabel}>Water Type:</ThemedText>
            <ThemedText style={styles.parameterValue}>
              {translateWaterType(pondParameters.waterType)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.parameterItem}>
            <ThemedText style={styles.parameterLabel}>
              Temperature (°C):
            </ThemedText>
            <ThemedText style={styles.parameterValue}>
              {pondParameters.temperature.toFixed(1)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.parameterItem}>
            <ThemedText style={styles.parameterLabel}>pH:</ThemedText>
            <ThemedText style={styles.parameterValue}>
              {pondParameters.ph.toFixed(1)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.parameterItem}>
            <ThemedText style={styles.parameterLabel}>TDS (ppm):</ThemedText>
            <ThemedText style={styles.parameterValue}>
              {pondParameters.tds.toFixed(0)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.parameterItem}>
            <ThemedText style={styles.parameterLabel}>
              Turbidity (%):
            </ThemedText>
            <ThemedText style={styles.parameterValue}>
              {pondParameters.turbidity.toFixed(1)}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <Button
          label="Refresh Data"
          type="primary"
          size="medium"
          onPress={refreshPondData}
          style={styles.refreshButton}
        />
      </ThemedView>

      {/* Comparison Results */}
      {selectedFish && comparisonResults.length > 0 && (
        <ThemedView style={styles.comparisonCard}>
          <ThemedView style={styles.cardHeader}>
            <IconSymbol name="molecule" size={20} color="#0a7ea4" />
            <ThemedText type="subtitle">Comparison Results</ThemedText>
          </ThemedView>

          {comparisonResults.map((result, index) => (
            <ThemedView
              key={index}
              style={[
                styles.comparisonItem,
                result.isMatch
                  ? styles.matchingParameter
                  : styles.mismatchParameter,
              ]}
            >
              <ThemedView style={styles.comparisonStatus}>
                {result.isMatch ? (
                  <IconSymbol name="water" size={16} color="#22c55e" />
                ) : (
                  <IconSymbol name="water" size={16} color="#dc2626" />
                )}
              </ThemedView>
              <ThemedView style={styles.comparisonDetails}>
                <ThemedText style={styles.comparisonParameter}>
                  {result.parameter}
                </ThemedText>
                <ThemedText
                  style={{
                    ...styles.comparisonMessage,
                    ...(result.isMatch
                      ? styles.matchingText
                      : styles.warningText),
                  }}
                >
                  {result.message}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Styles remain unchanged
  container: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    marginBottom: 24,
    backgroundColor: "rgba(0,0,0,0)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  searchSpinner: {
    position: "absolute",
    right: 12,
  },
  searchResultsContainer: {
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: BorderRadius.md,
    backgroundColor: "#fff",
  },
  searchResultsList: {
    padding: 8,
  },
  searchResultItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  noResultsText: {
    padding: 16,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.7,
  },
  dataCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  parametersList: {
    gap: 8,
  },
  parameterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  parameterLabel: {
    fontWeight: "500",
  },
  parameterValue: {
    fontWeight: "600",
  },
  refreshButton: {
    marginTop: 12,
  },
  comparisonCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: 16,
  },
  comparisonItem: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  matchingParameter: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  mismatchParameter: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  comparisonStatus: {
    marginRight: 12,
    marginTop: 2,
  },
  comparisonDetails: {
    flex: 1,
  },
  comparisonParameter: {
    fontWeight: "600",
    marginBottom: 4,
  },
  comparisonMessage: {
    fontSize: 14,
  },
  matchingText: {
    color: "#22c55e",
  },
  warningText: {
    color: "#dc2626",
  },
});
