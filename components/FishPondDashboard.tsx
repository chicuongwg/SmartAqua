import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import Button from "./Button"; // ALERT: Using custom Button component. Verify implementation.
import { IconSymbol } from "./ui/IconSymbol";
import { useMqtt } from "@/context/MqttContext"; // IMPORTANT: Using global MQTT context

// Define BorderRadius constants locally
const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
};

// Fish template data types
type WaterType = "lake" | "ocean";

// Fish template maintains more detailed parameters
type FishTemplate = {
  id: string;
  name: string;
  waterType: WaterType;
  turbidity: number;
  ph: number;
  temperature: number;
  tds: number;
};

// Comparison result
type SeverityLevel = "good" | "warning" | "danger";

type ComparisonResult = {
  parameter: string;
  severity: SeverityLevel;
  message: string;
};

export default function FishPondDashboard() {
  // Component state variables
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FishTemplate[]>([]);
  const [selectedFish, setSelectedFish] = useState<FishTemplate | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<
    ComparisonResult[]
  >([]);
  const [tankLength, setTankLength] = useState<string>(""); // Tank dimension state
  const [tankWidth, setTankWidth] = useState<string>(""); // Tank dimension state
  const [tankHeight, setTankHeight] = useState<string>(""); // Tank dimension state
  const [tankVolume, setTankVolume] = useState<number>(0); // Calculated tank volume
  const [showDimensionInputs, setShowDimensionInputs] =
    useState<boolean>(false); // ALERT: State variable 'showDimensionInputs' is declared but never used.

  // Sử dụng context MQTT toàn cục
  const {
    aquariumData, // IMPORTANT: Live data from MQTT
    waterType: pondWaterType,
    setWaterType: setPondWaterType,
    connect, // IMPORTANT: Function to connect MQTT
  } = useMqtt();

  // Chuyển đổi kiểu nước để hiển thị
  const translateWaterType = (type: WaterType) => {
    return type === "lake" ? "Freshwater" : "Saltwater";
  };

  // Hàm tìm kiếm cá (by name or triggers volume calculation)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If no name query, check if dimensions are entered for volume search
      if (tankLength && tankWidth && tankHeight) {
        calculateTankVolume(); // IMPORTANT: Trigger volume calculation and search
        return;
      }
      return; // No search query and no dimensions
    }

    // Search by name logic
    setIsLoading(true);
    setShowSearchResults(true);

    try {
      // ALERT: Simulating API call for name search. Replace with actual API/data source.
      setTimeout(() => {
        // Dummy data for demonstration
        const dummyResults: FishTemplate[] = [
          {
            id: "1",
            name: "Goldfish",
            waterType: "lake",
            turbidity: 10,
            ph: 7.5,
            temperature: 23,
            tds: 200,
          },
          {
            id: "2",
            name: "Betta Fish",
            waterType: "lake",
            turbidity: 5,
            ph: 7.0,
            temperature: 25,
            tds: 150,
          },
          {
            id: "3",
            name: "Clownfish",
            waterType: "ocean",
            turbidity: 2,
            ph: 8.2,
            temperature: 26,
            tds: 350,
          },
        ];

        // Filter results based on search query
        const filteredResults = dummyResults.filter((fish) =>
          fish.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setSearchResults(filteredResults);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error searching for fish:", error);
      setIsLoading(false);
    }
  };

  // Chọn loại cá và so sánh thông số
  const selectFish = (fish: FishTemplate) => {
    setSelectedFish(fish);
    setShowSearchResults(false);
    setSearchQuery(fish.name); // Update search input with selected fish name
    compareParameters(fish); // IMPORTANT: Trigger comparison
  };

  // So sánh thông số và đưa ra khuyến nghị
  const compareParameters = (fish: FishTemplate) => {
    // IMPORTANT: Core logic comparing selected fish needs vs. current pond data from MQTT
    const results: ComparisonResult[] = [];

    // Compare water type
    results.push({
      parameter: "Water Type",
      severity: fish.waterType === pondWaterType ? "good" : "danger",
      message:
        fish.waterType === pondWaterType
          ? "Water type is suitable"
          : `${fish.name} requires ${translateWaterType(
              fish.waterType
            )}, current pond is ${translateWaterType(pondWaterType)}`,
    });

    // Compare pH
    const phDifference = Math.abs(fish.ph - aquariumData.ph);
    let phSeverity: SeverityLevel = "good";
    let phMessage = "pH level is suitable";

    if (phDifference > 0.5 && phDifference <= 1.0) {
      phSeverity = "warning";
      phMessage = `${fish.name} prefers pH ${
        fish.ph
      }, current pond is ${aquariumData.ph.toFixed(1)} (consider adjusting)`;
    } else if (phDifference > 1.0) {
      phSeverity = "danger";
      phMessage = `${fish.name} requires pH ${
        fish.ph
      }, current pond is ${aquariumData.ph.toFixed(1)} (critical mismatch)`;
    }

    results.push({
      parameter: "pH",
      severity: phSeverity,
      message: phMessage,
    });

    // Compare temperature
    const tempDifference = Math.abs(
      fish.temperature - aquariumData.temperature
    );
    let tempSeverity: SeverityLevel = "good";
    let tempMessage = "Temperature is suitable";

    if (tempDifference > 3 && tempDifference <= 5) {
      tempSeverity = "warning";
      tempMessage = `${fish.name} prefers temperature of ${
        fish.temperature
      }°C, current pond is ${aquariumData.temperature.toFixed(
        1
      )}°C (consider adjusting)`;
    } else if (tempDifference > 5) {
      tempSeverity = "danger";
      tempMessage = `${fish.name} requires temperature of ${
        fish.temperature
      }°C, current pond is ${aquariumData.temperature.toFixed(
        1
      )}°C (critical mismatch)`;
    }

    results.push({
      parameter: "Temperature",
      severity: tempSeverity,
      message: tempMessage,
    });

    // Compare Turbidity
    const turbidityDifference = Math.abs(
      fish.turbidity - aquariumData.turbidity
    );
    let turbSeverity: SeverityLevel = "good";
    let turbMessage = "Turbidity is suitable";

    if (turbidityDifference > 5 && turbidityDifference <= 10) {
      turbSeverity = "warning";
      turbMessage = `${fish.name} prefers turbidity of ${
        fish.turbidity
      }%, current pond is ${aquariumData.turbidity.toFixed(
        1
      )}% (consider adjusting)`;
    } else if (turbidityDifference > 10) {
      turbSeverity = "danger";
      turbMessage = `${fish.name} requires turbidity of ${
        fish.turbidity
      }%, current pond is ${aquariumData.turbidity.toFixed(
        1
      )}% (critical mismatch)`;
    }

    results.push({
      parameter: "Turbidity",
      severity: turbSeverity,
      message: turbMessage,
    });

    // Compare TDS
    const tdsDifference = Math.abs(fish.tds - aquariumData.tds);
    let tdsSeverity: SeverityLevel = "good";
    let tdsMessage = "TDS level is suitable";

    if (tdsDifference > 50 && tdsDifference <= 100) {
      tdsSeverity = "warning";
      tdsMessage = `${fish.name} prefers TDS of ${
        fish.tds
      } ppm, current pond is ${aquariumData.tds.toFixed(
        0
      )} ppm (consider adjusting)`;
    } else if (tdsDifference > 100) {
      tdsSeverity = "danger";
      tdsMessage = `${fish.name} requires TDS of ${
        fish.tds
      } ppm, current pond is ${aquariumData.tds.toFixed(
        0
      )} ppm (critical mismatch)`;
    }

    results.push({
      parameter: "TDS",
      severity: tdsSeverity,
      message: tdsMessage,
    });

    setComparisonResults(results); // Update state with comparison results
  };

  // Cập nhật dữ liệu hồ cá
  const refreshPondData = () => {
    // Attempt MQTT connection if needed
    connect(); // IMPORTANT: Ensure MQTT is connected

    // Re-run comparison if a fish is selected
    if (selectedFish) {
      compareParameters(selectedFish);
    }
    // ALERT: Consider adding feedback if connection fails or data doesn't update.
  };

  // Calculate tank volume and trigger fish search based on size
  const calculateTankVolume = () => {
    // IMPORTANT: Validates inputs and calculates volume
    const length = parseFloat(tankLength);
    const width = parseFloat(tankWidth);
    const height = parseFloat(tankHeight);

    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      Alert.alert(
        "Invalid Input",
        "Please enter valid numbers for all dimensions"
      );
      return;
    }

    if (length <= 0 || width <= 0 || height <= 0) {
      Alert.alert("Invalid Input", "All dimensions must be greater than zero");
      return;
    }

    // Calculate volume in liters (assuming dimensions are in cm)
    const volumeInLiters = (length * width * height) / 1000;
    setTankVolume(volumeInLiters);

    // IMPORTANT: Trigger fish search based on calculated volume
    searchForCompatibleFish(volumeInLiters);
  };

  // Find compatible fish based on tank volume
  const searchForCompatibleFish = (volumeInLiters: number) => {
    // IMPORTANT: Logic to find fish suitable for the calculated volume
    setIsLoading(true);
    setShowSearchResults(true);

    try {
      // ALERT: Simulating API/KNN model call for volume-based search. Replace with actual logic.
      setTimeout(() => {
        // Example fish database with minimum tank size requirements
        const fishDatabase: Array<FishTemplate & { minTankSize: number }> = [
          {
            id: "1",
            name: "Goldfish",
            waterType: "lake",
            turbidity: 10,
            ph: 7.5,
            temperature: 23,
            tds: 200,
            minTankSize: 75, // Minimum 75 liters
          },
          {
            id: "2",
            name: "Betta Fish",
            waterType: "lake",
            turbidity: 5,
            ph: 7.0,
            temperature: 25,
            tds: 150,
            minTankSize: 20, // Minimum 20 liters
          },
          {
            id: "3",
            name: "Clownfish",
            waterType: "ocean",
            turbidity: 2,
            ph: 8.2,
            temperature: 26,
            tds: 350,
            minTankSize: 100, // Minimum 100 liters
          },
          {
            id: "4",
            name: "Guppy",
            waterType: "lake",
            turbidity: 3,
            ph: 7.2,
            temperature: 24,
            tds: 120,
            minTankSize: 10, // Minimum 10 liters
          },
          {
            id: "5",
            name: "Angelfish",
            waterType: "lake",
            turbidity: 7,
            ph: 6.8,
            temperature: 27,
            tds: 180,
            minTankSize: 80, // Minimum 80 liters
          },
        ];

        // Filter compatible fish based on tank size
        const compatibleFish = fishDatabase
          .filter((fish) => fish.minTankSize <= volumeInLiters)
          .map(({ minTankSize, ...rest }) => rest); // Remove minTankSize from results

        // Convert results to JSON for potential API usage
        const resultsJson = JSON.stringify(compatibleFish); // ALERT: resultsJson logged but not used elsewhere.
        console.log("Compatible fish JSON:", resultsJson);

        // Update state with results
        setSearchResults(compatibleFish);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error finding compatible fish:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to find compatible fish");
    }
  };

  // UI Component
  return (
    <ScrollView style={styles.scrollContainer}>
      {/* Tank Dimensions Input Card */}
      {/* IMPORTANT: Section for users to input tank size for recommendations */}
      <ThemedView style={styles.searchCard}>
        <ThemedView style={styles.cardHeader}>
          <IconSymbol name="cube" size={20} color="#0a7ea4" />
          <ThemedText type="subtitle">Find Fish by Tank Size</ThemedText>
        </ThemedView>

        <ThemedView style={styles.dimensionsContainer}>
          {/* Input fields for Length, Width, Height */}
          <ThemedView style={styles.dimensionInputRow}>
            <ThemedView style={styles.dimensionInputGroup}>
              <ThemedText style={styles.dimensionLabel}>Length (cm)</ThemedText>
              <TextInput
                style={styles.dimensionInput}
                value={tankLength}
                onChangeText={setTankLength}
                keyboardType="numeric"
                placeholder="0.0"
              />
            </ThemedView>

            <ThemedView style={styles.dimensionInputGroup}>
              <ThemedText style={styles.dimensionLabel}>Width (cm)</ThemedText>
              <TextInput
                style={styles.dimensionInput}
                value={tankWidth}
                onChangeText={setTankWidth}
                keyboardType="numeric"
                placeholder="0.0"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.dimensionInputRow}>
            <ThemedView style={styles.dimensionInputGroup}>
              <ThemedText style={styles.dimensionLabel}>
                Water Height (cm)
              </ThemedText>
              <TextInput
                style={styles.dimensionInput}
                value={tankHeight}
                onChangeText={setTankHeight}
                keyboardType="numeric"
                placeholder="0.0"
              />
            </ThemedView>

            <ThemedView
              style={[styles.dimensionInputGroup, styles.volumeDisplay]}
            >
              <ThemedText style={styles.dimensionLabel}>Volume</ThemedText>
              <ThemedText style={styles.volumeValue}>
                {tankVolume > 0 ? `${tankVolume.toFixed(1)} L` : "-"}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Button to trigger volume calculation and search */}
          <Button
            label="Find Compatible Fish"
            type="primary"
            size="medium"
            onPress={calculateTankVolume} // IMPORTANT: Calls volume calculation
            style={styles.dimensionButton}
          />
        </ThemedView>
      </ThemedView>

      {/* Container for the rest of the content */}
      <ThemedView style={styles.container}>
        {/* IMPORTANT: Section for users to search fish by name */}
        <ThemedView style={styles.searchCard}>
          <ThemedView style={styles.cardHeader}>
            <IconSymbol name="magnifyingglass" size={20} color="#0a7ea4" />
            <ThemedText type="subtitle">Find Compatible Fish</ThemedText>
          </ThemedView>

          <ThemedView style={styles.searchContainer}>
            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a fish..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {/* Search Button */}
            <TouchableOpacity
              onPress={handleSearch} // IMPORTANT: Calls name search or volume calculation
              style={styles.searchButton}
            >
              <ThemedText style={styles.searchButtonText}>Search</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Loading Indicator */}
          {isLoading && (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0a7ea4" />
              <ThemedText>Searching...</ThemedText>
            </ThemedView>
          )}

          {/* Search Results List (for name or volume search) */}
          {showSearchResults && searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => selectFish(item)} // IMPORTANT: Selects fish from results
                >
                  <ThemedText style={styles.resultName}>{item.name}</ThemedText>
                  <ThemedText style={styles.resultDetail}>
                    {translateWaterType(item.waterType)} • {item.temperature}°C
                    • pH {item.ph}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          )}

          {/* No Results Message */}
          {showSearchResults && searchResults.length === 0 && (
            <ThemedView style={styles.noResultsContainer}>
              <ThemedText>No fish found with that name.</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Hiển thị thông tin cá đã chọn */}
        {selectedFish && (
          <ThemedView style={styles.dataCard}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol name="fish" size={20} color="#0a7ea4" />
              <ThemedText type="subtitle">
                {selectedFish.name} Parameters
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parametersList}>
              <ThemedView style={styles.parameterItem}>
                <ThemedText style={styles.parameterLabel}>
                  Water Type:
                </ThemedText>
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
                <ThemedText style={styles.parameterLabel}>
                  TDS (ppm):
                </ThemedText>
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

        {/* IMPORTANT: Displays live data from MQTT context */}
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
            {/* Water Type Selector */}
            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>Water Type:</ThemedText>
              <ThemedView style={styles.waterTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.waterTypeButton,
                    pondWaterType === "lake" ? styles.selectedWaterType : null,
                  ]}
                  onPress={() => setPondWaterType("lake")} // IMPORTANT: Updates context state
                >
                  <ThemedText
                    style={[
                      styles.waterTypeText,
                      pondWaterType === "lake"
                        ? styles.selectedWaterTypeText
                        : null,
                    ]}
                  >
                    Freshwater
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.waterTypeButton,
                    pondWaterType === "ocean" ? styles.selectedWaterType : null,
                  ]}
                  onPress={() => setPondWaterType("ocean")} // IMPORTANT: Updates context state
                >
                  <ThemedText
                    style={[
                      styles.waterTypeText,
                      pondWaterType === "ocean"
                        ? styles.selectedWaterTypeText
                        : null,
                    ]}
                  >
                    Saltwater
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            {/* Display Temperature, pH, TDS, Turbidity from aquariumData */}
            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>
                Temperature (°C):
              </ThemedText>
              <ThemedText style={styles.parameterValue}>
                {aquariumData.temperature.toFixed(1)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>pH:</ThemedText>
              <ThemedText style={styles.parameterValue}>
                {aquariumData.ph.toFixed(1)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>TDS (ppm):</ThemedText>
              <ThemedText style={styles.parameterValue}>
                {aquariumData.tds.toFixed(0)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>
                Turbidity (%):
              </ThemedText>
              <ThemedText style={styles.parameterValue}>
                {aquariumData.turbidity.toFixed(1)}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Refresh Button */}
          <Button
            label="Refresh Data"
            type="primary"
            size="medium"
            onPress={refreshPondData} // IMPORTANT: Attempts MQTT connect and re-compares
            style={styles.refreshButton}
          />
        </ThemedView>

        {/* IMPORTANT: Shows compatibility analysis based on selected fish and current data */}
        {selectedFish && comparisonResults.length > 0 && (
          <ThemedView style={styles.dataCard}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol name="checkmark.shield" size={20} color="#0a7ea4" />
              <ThemedText type="subtitle">Compatibility Analysis</ThemedText>
            </ThemedView>

            <ThemedView style={styles.comparisonResults}>
              {/* Maps through comparisonResults to display each parameter's status */}
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
                          ? "#16a34a"
                          : result.severity === "warning"
                          ? "#ea580c"
                          : "#dc2626"
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
        )}
      </ThemedView>
    </ScrollView>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  // Giữ nguyên styles từ component cũ
  container: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  resultsList: {
    maxHeight: 200,
    marginTop: 8,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 14,
    color: "#666",
  },
  noResultsContainer: {
    padding: 16,
    alignItems: "center",
  },
  dataCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  parametersList: {
    gap: 8,
  },
  parameterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  parameterLabel: {
    fontSize: 14,
    color: "#666",
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  refreshButton: {
    marginTop: 16,
  },
  comparisonResults: {
    gap: 8,
  },
  comparisonItem: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: "#0a7ea4",
  },
  warningItem: {
    backgroundColor: "#fff7ed",
    borderLeftColor: "#ea580c",
  },
  dangerItem: {
    backgroundColor: "#fef2f2",
    borderLeftColor: "#dc2626",
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
    color: "#333",
    paddingLeft: 26,
  },
  waterTypeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  waterTypeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  selectedWaterType: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  waterTypeText: {
    fontSize: 14,
  },
  selectedWaterTypeText: {
    color: "#fff",
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
  dimensionsContainer: {
    gap: 16,
  },
  dimensionInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dimensionInputGroup: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  dimensionInput: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  dimensionButton: {
    marginTop: 8,
  },
  volumeDisplay: {
    justifyContent: "center",
  },
  volumeValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0a7ea4",
  },
});
