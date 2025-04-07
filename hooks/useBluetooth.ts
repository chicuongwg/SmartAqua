import { useState, useEffect } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// Replace these with your actual ESP32 UUIDs
const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const ESP32_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

let bleManager: BleManager | null = null;

// Mock BLE functionality for development in Expo Go
const isMockMode = true; // Set to true when using Expo Go

export function useBluetooth() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (!isMockMode) {
      bleManager = new BleManager(NativeModules.BleModule);
    }
    
    return () => {
      if (bleManager) {
        bleManager.destroy();
      }
    };
  }, []);

  async function requestPermissions() {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Bluetooth Permission',
          message: 'SmartAqua needs access to your location for Bluetooth scanning',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Location permission denied');
      }

      // For Android 12+
      if (Platform.Version >= 31) {
        const bluetoothScanGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: 'Bluetooth Scan Permission',
            message: 'SmartAqua needs permission to scan for Bluetooth devices',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        const bluetoothConnectGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: 'Bluetooth Connect Permission',
            message: 'SmartAqua needs permission to connect to Bluetooth devices',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (
          bluetoothScanGranted !== PermissionsAndroid.RESULTS.GRANTED ||
          bluetoothConnectGranted !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          throw new Error('Bluetooth permissions denied');
        }
      }
    }
  }

  // Mock scan that returns fake data after a delay
  async function scanForDevices() {
    if (isMockMode) {
      setIsScanning(true);
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsScanning(false);
      return 'mock-device-id';
    }
    if (!bleManager) return;
    
    try {
      await requestPermissions();
      
      setIsScanning(true);
      setDevices([]);
      
      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setIsScanning(false);
          return;
        }
        
        if (device && device.name) {
          // Filter for ESP32 devices - adjust filter as needed
          if (device.name.includes('ESP32')) {
            setDevices(prevDevices => {
              const exists = prevDevices.some(d => d.id === device.id);
              if (!exists) {
                return [...prevDevices, device];
              }
              return prevDevices;
            });
          }
        }
      });
      
      // Stop scanning after 10 seconds
      setTimeout(() => {
        bleManager?.stopDeviceScan();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Failed to scan:', error);
      setIsScanning(false);
    }
  }

  async function connectToDevice(deviceId: string) {
    if (isMockMode) {
      const mockDevice = {
        id: deviceId,
        name: 'ESP32-Mock'
      };
      setConnectedDevice(mockDevice as Device);
      return mockDevice;
    }
    if (!bleManager) return null;
    
    try {
      const device = await bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      return null;
    }
  }

  async function readData() {
    if (isMockMode) {
      // Return mock aquarium data
      return 'TEMP:25.4;PH:7.2;TDS:500;TURB:200';
    }
    if (!connectedDevice) return null;
    
    try {
      const characteristic = await connectedDevice.readCharacteristicForService(
        ESP32_SERVICE_UUID,
        ESP32_CHARACTERISTIC_UUID
      );
      
      return characteristic.value 
        ? Buffer.from(characteristic.value, 'base64').toString('ascii')
        : null;
    } catch (error) {
      console.error('Read error:', error);
      return null;
    }
  }

  async function sendCommand(command: string) {
    if (isMockMode) {
      // Mock implementation - simulate sending command
      console.log(`Mock sending command: ${command}`);
      return true;
    }
    
    if (!connectedDevice) return false;
    
    try {
      // In a real implementation, you would encode and write the command to the characteristic
      await connectedDevice.writeCharacteristicWithResponseForService(
        ESP32_SERVICE_UUID,
        ESP32_CHARACTERISTIC_UUID,
        Buffer.from(command).toString('base64')
      );
      return true;
    } catch (error) {
      console.error('Command error:', error);
      return false;
    }
  }

  async function disconnect() {
    if (isMockMode) {
      setConnectedDevice(null);
      return;
    }
    if (connectedDevice) {
      try {
        await connectedDevice.cancelConnection();
        setConnectedDevice(null);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  return {
    isScanning,
    devices,
    scanForDevices,
    connectToDevice,
    connectedDevice,
    readData,
    disconnect,
    sendCommand, // Add this
  };
}