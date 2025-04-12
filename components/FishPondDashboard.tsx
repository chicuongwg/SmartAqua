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
  useColorScheme,
} from "react-native";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import Button from "./Button";
import { IconSymbol } from "./ui/IconSymbol";
import { useMqtt } from "@/context/MqttContext";
import { Colors } from "@/constants/Colors";
import ComparisonAnalysis from "./ComparisonAnalysis"; // Import the new component

// Define BorderRadius constants locally
const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
};

// --- Types ---
type WaterType = "lake" | "ocean";

// Original Fish template (used for comparison logic)
// TODO: Consider moving this type to a shared types file
type FishTemplate = {
  id: string;
  name: string;
  waterType: WaterType;
  turbidity: number;
  ph: number;
  temperature: number;
  tds: number;
};

// Type for the response from your recommendation server
type RecommendedFish = {
  "Est. Quantity": number;
  "Max Size (cm)": number;
  Name: string;
  "Tank Size": number;
  Temp: number;
};

// --- End Types ---

// IMPORTANT: Replace with your actual API URL
const RECOMMENDATION_API_URL =
  "https://smartaquarium-jmlc.onrender.com/fish-rcm";

export default function FishPondDashboard() {
  const colorScheme = useColorScheme() ?? "light";

  // --- State Variables ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecommendedFish[]>([]);
  const [selectedFish, setSelectedFish] = useState<FishTemplate | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // REMOVED: comparisonResults state
  const [tankLength, setTankLength] = useState<string>("");
  const [tankWidth, setTankWidth] = useState<string>("");
  const [tankHeight, setTankHeight] = useState<string>("");
  const [tankVolume, setTankVolume] = useState<number>(0);
  const [showDimensionInputs, setShowDimensionInputs] =
    useState<boolean>(false);
  // --- End State Variables ---

  // --- Hooks ---
  const {
    aquariumData,
    waterType: pondWaterType,
    setWaterType: setPondWaterType,
    connect,
  } = useMqtt();
  // --- End Hooks ---

  // Handles search input submission (either name search or triggers volume calculation)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If no name query, check if dimensions are entered for volume search
      if (tankLength && tankWidth && tankHeight) {
        calculateTankVolume(); // IMPORTANT: Trigger volume calculation and API call
        return;
      }
      return; // No search query and no dimensions
    }

    // --- Name Search Logic ---
    setIsLoading(true);
    setShowSearchResults(true);
    setSearchResults([]); // Clear previous API results

    try {
      // ALERT: Name search functionality is currently simulated and doesn't fetch real data.
      // TODO: Implement actual API call for searching fish by name.
      setTimeout(() => {
        console.log(`Simulating name search for: ${searchQuery}`);
        setSearchResults([]); // Keep results empty for now
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error searching for fish by name:", error);
      Alert.alert("Search Error", "Failed to search for fish by name.");
      setIsLoading(false);
    }
  };

  // Sets the selected fish for comparison
  // ALERT: Expects FishTemplate. Selecting from RecommendedFish results requires adaptation.
  const selectFish = (fish: FishTemplate) => {
    setSelectedFish(fish);
    setSearchQuery(fish.name);
    // REMOVED: compareParameters(fish); // Comparison is now handled by the component
  };

  // Refreshes pond data and re-runs comparison if a fish is selected
  const refreshPondData = () => {
    connect(); // IMPORTANT: Ensure MQTT is connected
    // REMOVED: Comparison is now handled by the component via useEffect
    // if (selectedFish) {
    //   compareParameters(selectedFish);
    // }
    // ALERT: Consider adding feedback if connection fails or data doesn't update.
  };

  // --- API Call Function ---
  const fetchRecommendedFish = async (
    length: number,
    width: number,
    height: number,
    temperature: number
  ) => {
    setIsLoading(true);
    setShowSearchResults(true);
    setSearchResults([]);

    const payload = { length, width, height, temperature };
    console.log("Sending data to recommendation API:", payload);

    try {
      const response = await fetch(RECOMMENDATION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      const recommendedFishData: RecommendedFish[] = await response.json();
      console.log("Received recommendations:", recommendedFishData);
      setSearchResults(recommendedFishData); // IMPORTANT: Update state with API results
    } catch (error) {
      console.error("Error fetching fish recommendations:", error);
      Alert.alert(
        "API Error",
        "Failed to get fish recommendations. Check console."
      );
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  // --- End API Call Function ---

  // Validates dimension inputs and triggers the API call
  const calculateTankVolume = () => {
    // IMPORTANT: Input validation
    const length = parseFloat(tankLength);
    const width = parseFloat(tankWidth);
    const height = parseFloat(tankHeight);

    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      Alert.alert("Invalid Input", "Please enter valid numbers for dimensions");
      return;
    }
    if (length <= 0 || width <= 0 || height <= 0) {
      Alert.alert("Invalid Input", "Dimensions must be greater than zero");
      return;
    }

    const volumeInLiters = (length * width * height) / 1000;
    setTankVolume(volumeInLiters);

    // IMPORTANT: Get current temperature from MQTT data
    const currentTemperature = aquariumData.temperature;
    if (currentTemperature === undefined || currentTemperature === null) {
      Alert.alert("Missing Data", "Current temperature data unavailable.");
      return;
    }

    // IMPORTANT: Trigger API call
    fetchRecommendedFish(length, width, height, currentTemperature);
  };

  // --- UI Component ---
  return (
    <ScrollView style={styles.scrollContainer}>
      {/* Tank Dimensions Input Card */}
      <ThemedView style={styles.searchCard}>
        <ThemedView style={styles.cardHeader}>
          <IconSymbol name="cube" size={20} color={Colors[colorScheme].tint} />
          <ThemedText type="subtitle">Find Fish by Tank Size</ThemedText>
        </ThemedView>
        <ThemedView style={styles.dimensionsContainer}>
          {/* Input fields for Length, Width, Height */}
          <ThemedView style={styles.dimensionInputRow}>
            <ThemedView style={styles.dimensionInputGroup}>
              <ThemedText style={styles.dimensionLabel}>Length (cm)</ThemedText>
              <TextInput
                style={[
                  styles.dimensionInput,
                  { color: Colors[colorScheme].text }, // 3. Apply theme text color
                ]}
                value={tankLength}
                onChangeText={setTankLength}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={Colors[colorScheme].textSecondary} // Also theme placeholder
              />
            </ThemedView>
            <ThemedView style={styles.dimensionInputGroup}>
              <ThemedText style={styles.dimensionLabel}>Width (cm)</ThemedText>
              <TextInput
                style={[
                  styles.dimensionInput,
                  { color: Colors[colorScheme].text }, // 3. Apply theme text color
                ]}
                value={tankWidth}
                onChangeText={setTankWidth}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={Colors[colorScheme].textSecondary} // Also theme placeholder
              />
            </ThemedView>
          </ThemedView>
          <ThemedView style={styles.dimensionInputRow}>
            <ThemedView style={styles.dimensionInputGroup}>
              <ThemedText style={styles.dimensionLabel}>
                Water Height (cm)
              </ThemedText>
              <TextInput
                style={[
                  styles.dimensionInput,
                  { color: Colors[colorScheme].text }, // 3. Apply theme text color
                ]}
                value={tankHeight}
                onChangeText={setTankHeight}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={Colors[colorScheme].textSecondary} // Also theme placeholder
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
          {/* Button triggers volume calculation and API call */}
          <Button
            label="Get Fish Recommendations"
            type="primary"
            size="medium"
            onPress={calculateTankVolume} // IMPORTANT: Calls API trigger
            style={styles.dimensionButton}
            disabled={isLoading}
          />
        </ThemedView>

        {/* Selected Fish Details (based on FishTemplate) */}
        {selectedFish && (
          <ThemedView style={styles.dataCard}>
            {/* TODO: Add UI to display selectedFish details if needed */}
            <ThemedText>Selected: {selectedFish.name}</ThemedText>
          </ThemedView>
        )}

        {/* --- Display API Results --- */}
        {/* Loading Indicator (specific for API call) */}
        {isLoading &&
          !selectedFish && ( // Show only if loading API results
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0a7ea4" />
              <ThemedText>Getting recommendations...</ThemedText>
            </ThemedView>
          )}

        {/* API Search Results List (RecommendedFish[]) */}
        {showSearchResults && !isLoading && searchResults.length > 0 && (
          <ThemedView style={styles.dataCard}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol name="list.bullet" size={20} color="#0a7ea4" />
              <ThemedText type="subtitle">Recommended Fish</ThemedText>
            </ThemedView>
            {/* IMPORTANT: Displaying results from the recommendation API */}
            {searchResults.map((item, index) => (
              <ThemedView key={index} style={styles.resultItem}>
                <ThemedText style={styles.resultName}>{item.Name}</ThemedText>
                <ThemedText style={styles.resultDetail}>
                  Est. Qty: {item["Est. Quantity"]} • Max Size:{" "}
                  {item["Max Size (cm)"]} cm
                </ThemedText>
                <ThemedText style={styles.resultDetail}>
                  Min Tank: {item["Tank Size"]} L • Rec. Temp: {item.Temp}°C
                </ThemedText>
                {/* ALERT: Selecting these items requires adapting selectFish function */}
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {/* No API Results Message */}
        {showSearchResults &&
          !isLoading &&
          searchResults.length === 0 &&
          !selectedFish && ( // Show only if API returned no results
            <ThemedView style={styles.noResultsContainer}>
              <ThemedText>
                No recommendations found for these parameters.
              </ThemedText>
            </ThemedView>
          )}
        {/* --- End Display API Results --- */}

        {/* Current Pond Parameters */}
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
                {/* Use optional chaining and nullish coalescing */}
                {aquariumData.temperature?.toFixed(1) ?? "-"}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>pH:</ThemedText>
              <ThemedText style={styles.parameterValue}>
                {/* Use optional chaining and nullish coalescing */}
                {aquariumData.ph?.toFixed(1) ?? "-"}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>TDS (ppm):</ThemedText>
              <ThemedText style={styles.parameterValue}>
                {/* Use optional chaining and nullish coalescing */}
                {aquariumData.tds?.toFixed(0) ?? "-"}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.parameterItem}>
              <ThemedText style={styles.parameterLabel}>
                Turbidity (%):
              </ThemedText>
              <ThemedText style={styles.parameterValue}>
                {/* Use optional chaining and nullish coalescing */}
                {aquariumData.turbidity?.toFixed(1) ?? "-"}
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

        {/* Compatibility Analysis */}
        <ComparisonAnalysis
          selectedFish={selectedFish}
          aquariumData={aquariumData}
          pondWaterType={pondWaterType}
        />
      </ThemedView>
    </ScrollView>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  // ... styles remain unchanged ...
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
    marginTop: 16,
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
    marginTop: 16, // Add margin top here
  },
  dataCard: {
    marginTop: 16, // Add margin top to create space above the card
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
    marginBottom: 16,
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
