declare module '@react-native-community/datetimepicker' {
  import { ComponentType } from 'react';
  
  export interface DateTimePickerEvent {
    type: 'set' | 'dismissed';
    nativeEvent: {
      timestamp?: number;
    };
  }
  
  export interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime' | 'countdown';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    is24Hour?: boolean;
    [key: string]: any;
  }
  
  declare const DateTimePicker: ComponentType<DateTimePickerProps>;
  
  export default DateTimePicker;
}