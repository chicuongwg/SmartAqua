import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors as ThemeColors } from "@/constants/Colors";
import { getFishInfo } from "@/services/FishService"; // Import hàm getFishInfo từ service

// Type cho dữ liệu cá
type FishInfo = {
  Aggression: string;
  Availability: string;
  Behavior: string;
  "Breeding Difficulty": string;
  Difficulty: string;
  "Fish Name": string;
  "Max Size": string;
  "Minimum Tank Size": string;
  "pH Range": string;
  Temperature: string;
};

// Kiểu trả về có thể là FishInfo hoặc lỗi
type FishServiceResponse =
  | FishInfo
  | { error: string; multipleMatches?: boolean; matches?: string[] };

export default function FishLibraryScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [fishData, setFishData] = useState<FishServiceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert("Input Required", "Please enter a fish name to search.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFishData(null);

    try {
      const result = getFishInfo(searchTerm.trim()) as FishServiceResponse;

      if ("error" in result && !result.multipleMatches) {
        throw new Error(result.error);
      }
      setFishData(result);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      Alert.alert("Search Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Theme colors
  const colors = ThemeColors[colorScheme];
  const inputBorderColor = colors.border;
  const placeholderTextColor = colors.textSecondary;
  const inputTextColor = colors.text;
  const inputBackgroundColor = colors.background;
  const cardBackgroundColor = "white"; // Đặt nền trắng cho phần dữ liệu cá
  const cardBorderColor = "#ddd"; // Màu viền nhẹ cho khung
  const detailLabelColor = "#444"; // Màu chữ label tối
  const detailValueColor = "#000"; // Màu chữ giá trị đậm hơn
  const fishNameColor = "#007AFF"; // Màu xanh dương cho tên cá

  // Hàm render thông tin cá
  const renderFishInfo = (fish: FishInfo) => (
    <View
      style={[
        styles.resultsCard,
        { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
      ]}
    >
      <ThemedText
        type="subtitle"
        style={[styles.fishName, { color: fishNameColor }]}
      >
        {fish["Fish Name"]}
      </ThemedText>
      <View style={styles.detailGrid}>
        {Object.entries(fish)
          .filter(([key]) => key !== "Fish Name")
          .map(([key, value]) => (
            <View
              key={key}
              style={[
                styles.detailItem,
                { borderBottomColor: cardBorderColor },
              ]}
            >
              <ThemedText
                style={[styles.detailLabel, { color: detailLabelColor }]}
              >
                {key}:
              </ThemedText>
              <ThemedText
                style={[styles.detailValue, { color: detailValueColor }]}
              >
                {value}
              </ThemedText>
            </View>
          ))}
      </View>
    </View>
  );

  // Render khi có nhiều kết quả trùng
  const renderMultipleMatches = (matches: string[]) => (
    <View
      style={[
        styles.resultsCard,
        { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
      ]}
    >
      <ThemedText style={[styles.message, { color: detailValueColor }]}>
        Found multiple fish matching '{searchTerm}':
      </ThemedText>
      {matches.map((name, idx) => (
        <ThemedText
          key={idx}
          style={[styles.matchItem, { color: detailValueColor }]}
        >
          - {name}
        </ThemedText>
      ))}
    </View>
  );

  // Render lỗi
  const renderError = (errorMessage: string) => (
    <View
      style={[
        styles.errorContainer,
        {
          borderColor: colors.danger,
          backgroundColor: colors.backgroundSecondary,
        },
      ]}
    >
      <IconSymbol
        name="exclamationmark.triangle.fill"
        size={30}
        color={colors.danger}
      />
      <ThemedText style={{ ...styles.errorText, color: colors.danger }}>
        {errorMessage}
      </ThemedText>
    </View>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedText type="title" style={styles.pageTitle}>
        Fish Library
      </ThemedText>

      {/* Search bar */}
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
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="words"
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            { backgroundColor: colors.tint },
            isLoading && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {isLoading ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.statusText}>Searching...</ThemedText>
          </View>
        ) : error ? (
          renderError(error)
        ) : fishData ? (
          // Nếu nhiều kết quả thì show danh sách, ngược lại show cá
          "multipleMatches" in fishData && fishData.multipleMatches ? (
            renderMultipleMatches(fishData.matches ?? [])
          ) : (
            renderFishInfo(fishData as FishInfo)
          )
        ) : (
          <View style={styles.centeredContainer}>
            <IconSymbol
              name="book.closed"
              size={40}
              color={colors.textSecondary}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
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
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  contentArea: {
    marginTop: 16,
  },
  centeredContainer: {
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
  errorContainer: {
    marginVertical: 32,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  resultsCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  fishName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  detailGrid: {},
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "500",
    flexBasis: "45%",
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
    flexBasis: "55%",
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  matchItem: {
    fontSize: 14,
    paddingLeft: 10,
    marginBottom: 4,
  },
});
