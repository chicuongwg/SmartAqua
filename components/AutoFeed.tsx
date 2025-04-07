import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Switch, Modal, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { IconSymbol } from './ui/IconSymbol';

type FeedSchedule = {
  time: Date;
  enabled: boolean;
};

type Props = {
  onFeed: () => Promise<void>;
};

export default function AutoFeed({ onFeed }: Props) {
  const [isFeeding, setIsFeeding] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [feedSchedule, setFeedSchedule] = useState<FeedSchedule[]>([
    { time: new Date(), enabled: false }
  ]);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState<number | null>(null);

  const triggerFeeding = async () => {
    if (isFeeding) return; // Prevent multiple feeding operations
    
    setIsFeeding(true);
    try {
      await onFeed();
      
      // Set a timeout to simulate the feeding process
      setTimeout(() => {
        setIsFeeding(false);
      }, 3000); // 3 seconds for feeding animation
    } catch (error) {
      console.error('Error during feeding:', error);
      setIsFeeding(false);
    }
  };
  
  const addSchedule = () => {
    const newSchedule: FeedSchedule = { 
      time: new Date(),
      enabled: true
    };
    setFeedSchedule([...feedSchedule, newSchedule]);
  };
  
  const removeSchedule = (index: number) => {
    const newSchedules = [...feedSchedule];
    newSchedules.splice(index, 1);
    setFeedSchedule(newSchedules);
  };
  
  const updateSchedule = (index: number, updatedSchedule: Partial<FeedSchedule>) => {
    const newSchedules = [...feedSchedule];
    newSchedules[index] = { ...newSchedules[index], ...updatedSchedule };
    setFeedSchedule(newSchedules);
  };
  
  // Check if it's time to feed based on schedules
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date();
      feedSchedule.forEach((schedule) => {
        if (!schedule.enabled) return;
        
        const scheduleTime = new Date(schedule.time);
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const scheduleHours = scheduleTime.getHours();
        const scheduleMinutes = scheduleTime.getMinutes();
        
        // Check if current time matches schedule time (within 1 minute)
        if (currentHours === scheduleHours && currentMinutes === scheduleMinutes) {
          triggerFeeding();
        }
      });
    };
    
    // Check schedules every minute
    const interval = setInterval(checkSchedules, 60000);
    return () => clearInterval(interval);
  }, [feedSchedule]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol name="water" size={24} color="#0a7ea4" />
        <ThemedText type="subtitle">Fish Feeder</ThemedText>
      </ThemedView>
      
      <TouchableOpacity 
        style={[styles.feedButton, isFeeding && styles.feedButtonDisabled]}
        onPress={triggerFeeding}
        disabled={isFeeding}>
        <ThemedText style={styles.buttonText}>
          {isFeeding ? 'Feeding...' : 'Feed Now'}
        </ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.scheduleButton}
        onPress={() => {
          setSelectedScheduleIndex(null);
          setScheduleModalVisible(true);
        }}>
        <ThemedText style={styles.buttonText}>
          Schedule Feeding
        </ThemedText>
      </TouchableOpacity>
      
      {/* Schedules List */}
      <ThemedView style={styles.schedulesList}>
        <ThemedText>Active Schedules:</ThemedText>
        {feedSchedule.map((schedule, index) => (
          <ThemedView key={index} style={styles.scheduleItem}>
            <Switch 
              value={schedule.enabled}
              onValueChange={(value) => updateSchedule(index, { enabled: value })}
            />
            <ThemedText>
              {schedule.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
            <TouchableOpacity 
              onPress={() => {
                setSelectedScheduleIndex(index);
                setScheduleModalVisible(true);
              }}
              style={styles.editButton}>
              <ThemedText style={styles.editButtonText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => removeSchedule(index)}
              style={styles.deleteButton}>
              <ThemedText style={styles.deleteButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ))}
        
        {feedSchedule.length < 5 && (
          <TouchableOpacity 
            onPress={addSchedule}
            style={styles.addScheduleButton}>
            <ThemedText style={styles.addScheduleText}>+ Add Schedule</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Schedule Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={scheduleModalVisible}
        onRequestClose={() => setScheduleModalVisible(false)}>
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">Set Feeding Time</ThemedText>
            
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={selectedScheduleIndex !== null ? 
                  feedSchedule[selectedScheduleIndex].time : new Date()}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event: any, date?: Date) => {
                  if (date && selectedScheduleIndex !== null) {
                    updateSchedule(selectedScheduleIndex, { time: date });
                  }
                }}
              />
            ) : (
              <DateTimePicker
                value={selectedScheduleIndex !== null ? 
                  feedSchedule[selectedScheduleIndex].time : new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  setScheduleModalVisible(false);
                  if (event.type === 'set' && date && selectedScheduleIndex !== null) {
                    updateSchedule(selectedScheduleIndex, { time: date });
                  }
                }}
              />
            )}
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setScheduleModalVisible(false)}>
              <ThemedText style={styles.buttonText}>Done</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  feedButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  scheduleButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  schedulesList: {
    marginTop: 16,
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  editButton: {
    paddingHorizontal: 8,
  },
  editButtonText: {
    color: '#0a7ea4',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    color: '#dc2626',
  },
  addScheduleButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#9ca3af',
  },
  addScheduleText: {
    color: '#0a7ea4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 16,
  },
  modalButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
});