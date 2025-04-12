import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Switch,
  Modal,
  Platform,
  TouchableOpacity, // Ensure TouchableOpacity is imported
  ActivityIndicator, // Import ActivityIndicator for loading state
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { IconSymbol } from "./ui/IconSymbol";
import { Colors as ImportedColors } from "@/constants/Colors"; // Assuming you have Colors defined
import { useColorScheme } from "@/hooks/useColorScheme"; // Import useColorScheme

type FeedSchedule = {
  time: Date;
  enabled: boolean;
};

type Props = {
  onFeed: () => Promise<void>;
};

export default function AutoFeed({ onFeed }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const [isFeeding, setIsFeeding] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [feedSchedule, setFeedSchedule] = useState<FeedSchedule[]>([]); // Start with empty array
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState<
    number | null
  >(null);
  const [showTimePicker, setShowTimePicker] = useState(false); // State for Android picker visibility

  const triggerFeeding = async () => {
    if (isFeeding) return;
    setIsFeeding(true);
    try {
      await onFeed();
      // No need for setTimeout if onFeed handles the duration/feedback
    } catch (error) {
      console.error("Error during feeding:", error);
      // Add user feedback (Alert?)
    } finally {
      setIsFeeding(false); // Reset state after operation completes or fails
    }
  };

  const addSchedule = () => {
    const newSchedule: FeedSchedule = {
      time: new Date(), // Default to current time
      enabled: true,
    };
    const newIndex = feedSchedule.length;
    setFeedSchedule([...feedSchedule, newSchedule]);
    setSelectedScheduleIndex(newIndex);
    // Open modal or picker based on platform
    if (Platform.OS === "android") {
      setShowTimePicker(true); // Trigger Android picker directly
    } else {
      setScheduleModalVisible(true); // Open iOS modal
    }
  };

  const openScheduleEditor = (index: number) => {
    setSelectedScheduleIndex(index);
    if (Platform.OS === "android") {
      setShowTimePicker(true);
    } else {
      setScheduleModalVisible(true);
    }
  };

  const removeSchedule = (index: number) => {
    setFeedSchedule((currentSchedules) =>
      currentSchedules.filter((_, i) => i !== index)
    );
  };

  const updateSchedule = (
    index: number,
    updatedSchedule: Partial<FeedSchedule>
  ) => {
    setFeedSchedule((currentSchedules) =>
      currentSchedules.map((schedule, i) =>
        i === index ? { ...schedule, ...updatedSchedule } : schedule
      )
    );
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    // Hide picker on Android regardless of event type
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (
      date &&
      selectedScheduleIndex !== null &&
      selectedScheduleIndex >= 0 &&
      selectedScheduleIndex < feedSchedule.length
    ) {
      // For Android 'set' event or any iOS event with a date
      if (event.type === "set" || Platform.OS === "ios") {
        updateSchedule(selectedScheduleIndex, { time: date });
      }
    }

    // Close iOS modal only when 'Done' is pressed (implicitly handled by user)
    // No need to close modal here for iOS as picker is inside
  };

  // Check schedules effect remains the same
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date();
      feedSchedule.forEach((schedule) => {
        if (!schedule.enabled) return;

        const scheduleTime = new Date(schedule.time);
        // Check if current time matches schedule time (hour and minute)
        if (
          now.getHours() === scheduleTime.getHours() &&
          now.getMinutes() === scheduleTime.getMinutes()
        ) {
          // Add a check to prevent multiple triggers within the same minute
          // This requires storing the last triggered time, maybe outside this component or using refs
          console.log(
            `Triggering feed for schedule at ${scheduleTime.toLocaleTimeString()}`
          );
          triggerFeeding();
        }
      });
    };

    const interval = setInterval(checkSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [feedSchedule]); // Rerun effect if schedule changes

  // --- DateTimePicker Component ---
  const renderDateTimePicker = () => {
    if (
      selectedScheduleIndex === null ||
      !feedSchedule[selectedScheduleIndex]
    ) {
      return null; // Don't render if no valid index
    }
    const currentTime = feedSchedule[selectedScheduleIndex].time;

    return (
      <DateTimePicker
        value={currentTime}
        mode="time"
        is24Hour={true}
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={handleTimeChange}
        // Style the picker for better theme integration if possible
        // style={styles.dateTimePicker} // Add custom styles if needed
        // textColor={Colors[colorScheme].text} // Example for iOS text color
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header removed as it's likely part of the parent card */}

      {/* Feed Now Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.feedButton,
          isFeeding && styles.feedButtonDisabled,
        ]}
        onPress={triggerFeeding}
        disabled={isFeeding}
      >
        {isFeeding ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <IconSymbol name="paperplane.fill" size={16} color="#fff" />
        )}
        <ThemedText style={styles.actionButtonText}>
          {isFeeding ? "Feeding..." : "Feed Now"}
        </ThemedText>
      </TouchableOpacity>

      {/* Schedules Section */}
      <View style={styles.schedulesSection}>
        <View style={styles.schedulesHeader}>
          <ThemedText type="subtitle" style={styles.schedulesTitle}>
            Scheduled Feedings
          </ThemedText>
          <TouchableOpacity style={styles.addButton} onPress={addSchedule}>
            <IconSymbol
              name="plus.circle.fill"
              size={22}
              color={ImportedColors[colorScheme ?? "light"].tint}
            />
          </TouchableOpacity>
        </View>

        {feedSchedule.length === 0 ? (
          <ThemedText style={styles.noSchedulesText}>
            No scheduled feedings added yet.
          </ThemedText>
        ) : (
          <View style={styles.schedulesList}>
            {feedSchedule.map((schedule, index) => (
              <ThemedView
                key={index}
                style={[
                  styles.scheduleItem,
                  !schedule.enabled && styles.scheduleItemDisabled, // Style for disabled state
                ]}
              >
                <Switch
                  value={schedule.enabled}
                  onValueChange={(value) =>
                    updateSchedule(index, { enabled: value })
                  }
                  trackColor={{
                    false: "#767577",
                    true: ImportedColors[colorScheme ?? "light"].tint,
                  }}
                  thumbColor={schedule.enabled ? "#f4f3f4" : "#f4f3f4"}
                />
                <ThemedText style={styles.scheduleTime}>
                  {schedule.time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false, // Use 24-hour format for consistency
                  })}
                </ThemedText>
                <View style={styles.scheduleActions}>
                  <TouchableOpacity
                    onPress={() => openScheduleEditor(index)}
                    style={styles.iconButton}
                  >
                    <IconSymbol
                      name="pencil"
                      size={18}
                      color={ImportedColors[colorScheme ?? "light"].textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeSchedule(index)}
                    style={styles.iconButton}
                  >
                    <IconSymbol
                      name="trash"
                      size={18}
                      color={ImportedColors.error}
                    />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))}
          </View>
        )}
      </View>

      {/* --- Modals / Pickers --- */}

      {/* iOS Modal */}
      {Platform.OS === "ios" && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={scheduleModalVisible}
          onRequestClose={() => setScheduleModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Set Feeding Time
              </ThemedText>
              {renderDateTimePicker()}
              <TouchableOpacity
                style={[styles.actionButton, styles.modalDoneButton]}
                onPress={() => setScheduleModalVisible(false)}
              >
                <ThemedText style={styles.actionButtonText}>Done</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </Modal>
      )}

      {/* Android Picker Trigger */}
      {Platform.OS === "android" && showTimePicker && renderDateTimePicker()}
    </ThemedView>
  );
}

// --- Styles ---
// Define Colors object for easier access (replace with your actual Colors constant)
const Colors = {
  light: {
    text: "#000",
    textMuted: "#6c757d",
    background: "#fff",
    tint: "#0a7ea4", // Primary action color
    border: "#ccc",
    cardBackground: "rgba(0, 0, 0, 0.05)",
    disabled: "#9ca3af", // Muted gray for disabled elements
  },
  dark: {
    text: "#fff",
    textMuted: "#adb5bd",
    background: "#000",
    tint: "#0a7ea4", // Or a lighter blue for dark mode
    border: "#444",
    cardBackground: "rgba(255, 255, 255, 0.1)",
    disabled: "#555",
  },
  error: "#dc2626", // Consistent error color (e.g., for delete)
  success: "#22c55e", // Success color (e.g., for feed button)
};

const styles = StyleSheet.create({
  container: {
    // Removed padding/margin as it's likely handled by parent card
    // borderRadius: 10, // Handled by parent
    // borderWidth: 1, // Handled by parent
    // borderColor: '#e5e5e5', // Handled by parent
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16, // Space below button
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  feedButton: {
    backgroundColor: Colors.success, // Green for feed
  },
  feedButtonDisabled: {
    backgroundColor: Colors.light.disabled, // Use disabled color
  },
  schedulesSection: {
    marginTop: 16, // Space above schedules section
  },
  schedulesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4, // Slight horizontal padding for alignment
  },
  schedulesTitle: {
    // Already using type="subtitle"
  },
  addButton: {
    padding: 4, // Make icon easier to tap
  },
  noSchedulesText: {
    textAlign: "center",
    marginTop: 16,
    // color: Colors.light.textMuted, // Use theme muted color
    opacity: 0.7,
    fontStyle: "italic",
  },
  schedulesList: {
    gap: 10, // Space between schedule items
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    // backgroundColor: Colors.light.cardBackground, // Use theme card background
    backgroundColor: "rgba(0,0,0,0.05)", // Keeping original for now
    gap: 10, // Internal spacing
  },
  scheduleItemDisabled: {
    opacity: 0.6, // Dim disabled schedules
  },
  scheduleTime: {
    flex: 1, // Take up remaining space
    fontSize: 16,
    fontWeight: "500",
  },
  scheduleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 6, // Hit area for icons
  },
  // --- Modal Styles ---
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)", // Darker backdrop
  },
  modalContent: {
    width: "85%", // Slightly wider modal
    maxWidth: 350, // Max width for larger screens
    padding: 24, // More padding
    borderRadius: 12,
    alignItems: "center",
    gap: 20, // More gap between elements
    // Use theme background
    // backgroundColor: Colors.light.background,
  },
  modalTitle: {
    marginBottom: 8, // Space below title
  },
  modalDoneButton: {
    backgroundColor: Colors.light.tint, // Use theme tint
    width: "100%", // Make button full width of modal content
    marginTop: 8, // Space above done button
    marginBottom: 0, // Reset default margin
  },
  // Optional: Style DateTimePicker if needed
  // dateTimePicker: {
  //   width: '100%',
  //   height: 180, // Adjust height for iOS spinner
  // },
});
