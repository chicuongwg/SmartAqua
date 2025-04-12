import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  useColorScheme, // Import useColorScheme
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol"; // Assuming you have this
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors as ThemeColors } from "@/constants/Colors"; // Import Colors for theme

// Type for the API response data
type FishInfo = {
  Aggression: string;
  Availability: string;
  Behavior: string;
  "Breeding Difficulty": string;
  Difficulty: string;
  "Fish Name": string;
  "Max Size": string;
  "Minimum Tank Size": string;
  Temperature: string;
  "pH Range": string;
};

const API_URL = "https://smartaquarium-jmlc.onrender.com/fish";

export default function FishLibraryScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light"; // Get current theme
  const [searchTerm, setSearchTerm] = useState("");
  const [fishData, setFishData] = useState<FishInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert("Input Required", "Please enter a fish name to search.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFishData(null); // Clear previous results

    try {
      console.log(`🔍 Searching for: ${searchTerm}`);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: searchTerm.trim() }),
      });

      console.log(`🚦 API Response Status: ${response.status}`);

      if (!response.ok) {
        // Try to get error message from response body if possible
        let errorMsg = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg; // Use message from API if available
          console.error("API Error Response:", errorData);
        } catch (e) {
          // Ignore if response body is not JSON or empty
          console.error("Could not parse error response body:", e);
        }
        // Handle specific case where fish might not be found
        if (response.status === 404) {
          errorMsg = `Fish named "${searchTerm.trim()}" not found.`;
        }
        throw new Error(errorMsg);
      }

      const data: FishInfo = await response.json();
      console.log("✅ API Response Data:", data);
      setFishData(data);
    } catch (err: any) {
      console.error("❌ API Call Failed:", err);
      setError(err.message || "An unexpected error occurred.");
      Alert.alert(
        "Search Failed",
        err.message || "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Determine border and placeholder colors based on theme
  const inputBorderColor = ThemeColors[colorScheme].border;
  const placeholderTextColor = ThemeColors[colorScheme].textMuted;
  const inputTextColor = ThemeColors[colorScheme].text;
  const inputBackgroundColor = ThemeColors[colorScheme].inputBackground;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside input
    >
      <ThemedText type="title" style={styles.pageTitle}>
        Fish Library
      </ThemedText>

      {/* Search Input and Button */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              borderColor: inputBorderColor,
              color: inputTextColor,
              backgroundColor: inputBackgroundColor,
            },
          ]}
          placeholder="Enter fish name (e.g., Clownfish)"
          placeholderTextColor={placeholderTextColor}
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch} // Allow searching via keyboard return key
          returnKeyType="search"
          autoCapitalize="words" // Capitalize first letter of words
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="magnifyingglass" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content Area: Placeholder, Loading, Error, or Results */}
      <View style={styles.contentArea}>
        {isLoading ? (
          // Loading Indicator
          <View style={styles.centeredContainer}>
            <ActivityIndicator
              size="large"
              color={ThemeColors[colorScheme].tint}
            />
            <ThemedText style={styles.statusText}>Searching...</ThemedText>
          </View>
        ) : error ? (
          // Error Message
          <ThemedView style={styles.errorContainer}>
            <IconSymbol
              name="exclamationmark.triangle.fill" // Use filled icon for errors
              size={30}
              color={ThemeColors.error} // Use a defined error color from the theme import
            />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : fishData ? (
          // Fish Data Display
          <ThemedView style={styles.resultsCard}>
            <ThemedText type="subtitle" style={styles.fishName}>
              {fishData["Fish Name"]}
            </ThemedText>
            <View style={styles.detailGrid}>
              {Object.entries(fishData)
                .filter(([key]) => key !== "Fish Name") // Don't repeat the name
                .map(([key, value]) => (
                  <View key={key} style={styles.detailItem}>
                    <ThemedText style={styles.detailLabel}>{key}:</ThemedText>
                    <ThemedText style={styles.detailValue}>{value}</ThemedText>
                  </View>
                ))}
            </View>
          </ThemedView>
        ) : (
          // Initial Placeholder / No Results
          <View style={styles.centeredContainer}>
            <IconSymbol
              name="book.closed"
              size={40}
              color={ThemeColors[colorScheme].textMuted}
            />
            <ThemedText style={styles.statusText}>
              Enter a fish name above to search the library.
            </ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Define Colors object for easier access (replace with your actual Colors constant)
const Colors = {
  light: {
    text: "#000",
    textMuted: "#6c757d",
    background: "#fff",
    tint: "#0a7ea4",
    border: "#ccc",
    inputBackground: "rgba(0, 0, 0, 0.05)",
  },
  dark: {
    text: "#fff",
    textMuted: "#adb5bd",
    background: "#000",
    tint: "#0a7ea4", // Or a lighter blue for dark mode
    border: "#444",
    inputBackground: "rgba(255, 255, 255, 0.1)",
  },
  error: "#dc2626", // Consistent error color
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32, // Extra padding at the bottom
    flexGrow: 1, // Ensure content can fill height if needed
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 48, // Slightly taller input
    borderWidth: 1.5, // Slightly thicker border
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: Colors.light.tint, // Use theme tint color
    padding: 12, // Make button square-ish
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    width: 48,
  },
  contentArea: {
    flex: 1, // Allow this area to grow and center content vertically
    justifyContent: "center", // Center content vertically in this area
  },
  centeredContainer: {
    // For loading and placeholder
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  statusText: {
    // Used for loading and placeholder text
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    marginVertical: 32, // Give more vertical space
    padding: 20, // More padding
    borderRadius: 8,
    backgroundColor: "rgba(220, 38, 38, 0.1)", // Light red background
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.3)",
    alignItems: "center",
    gap: 10, // Increased gap
  },
  errorText: {
    color: Colors.error, // Red text color
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500", // Slightly bolder error text
  },
  resultsCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    // Use theme colors for border and background
    // borderColor: Colors[colorScheme].border,
    // backgroundColor: Colors[colorScheme].inputBackground, // Or a card-specific background
    borderColor: "rgba(229, 229, 229, 0.5)", // Keeping original for now
    backgroundColor: "rgba(0,0,0,0.1)", // Keeping original for now
  },
  fishName: {
    fontSize: 24, // Larger fish name
    fontWeight: "bold",
    marginBottom: 20, // More space below name
    textAlign: "center",
    color: Colors.light.tint, // Use theme tint
  },
  detailGrid: {
    // Simple vertical list for now
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Align items top if text wraps
    paddingVertical: 10, // Increased padding
    borderBottomWidth: 1,
    // Use theme border color
    // borderBottomColor: Colors[colorScheme].border,
    borderBottomColor: "rgba(229, 229, 229, 0.2)", // Keeping original for now
    gap: 8, // Add gap between label and value
  },
  detailLabel: {
    fontSize: 15,
    // Use theme muted text color
    // color: Colors[colorScheme].textMuted,
    color: "#aaa", // Keeping original for now
    fontWeight: "500",
    flexBasis: "40%", // Give label a fixed basis percentage
    flexShrink: 0, // Prevent label from shrinking
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1, // Allow value text to wrap if needed
    flexBasis: "60%", // Allow value to take remaining space
  },
});
