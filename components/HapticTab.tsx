import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Use simplified props since type resolution is causing issues
type TabButtonProps = {
  children: React.ReactNode;
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  onPressIn?: (event: any) => void;
  style?: any;
  [key: string]: any;
};

export default function HapticTab(props: TabButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      {...props}
      onPressIn={(event) => {
      if (Platform.OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
        props.onPressIn?.(event);
      }}
    />
  );
}

// Keep the named export for backward compatibility
export { HapticTab };
