# SMARTAQUA - Smart Aquarium IoT System for Home Use

## Overview

The Smart Aquarium Management IoT System is an intelligent aquarium monitoring and automation system that utilizes IoT technology, AI-driven recommendations, and mobile app control. The system collects real-time sensor data, processes it using an AI recommendation model, and controls the aquarium environment via ESP32.

## Features

- Real-time Sensor Monitoring: Tracks water quality parameters such as temperature, TDS, and turbulent.

- AI Recommendation Model (using KNN classifier): Provide fish species that could adapt to the current state of the tank.

- Automated Feeding System: Schedules and executes feeding times based on fish species and dietary needs.

- Remote Control via Mobile App: Allows users to control the filtration and feeding system remotely.

### Protocols Used:

- MQTT: For controlling devices (e.g., feeding control).

### Functional Flow

1. Read sensor data from aquarium.

2. Process data using the AI recommendation model.

3. Update the mobile app with the latest system status.

### System Updates & Maintenance

- Modify aquarium settings based on fish type data.

- Perform OTA firmware updates to enhance AI and system functionality.

### Demo Scenarios

- Monitor live water quality metrics via the mobile app.

- Schedule and execute automatic feeding.

- Recommend suitable fish type for current tank setting.

## Get started with SMARTAQUA

### Expo & Expo GO

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app, then connect with Expo GO (install via appstore):

   ```bash
   npx expo start
   ```

or to start with empty cache, use:

```bash
npx expo start --clean
```

or

```bash
npx expo start --tunnel --clean
```

### HiveMQ

Create a HiveMQ account, then change the following in [MqttContext.tsx](context/MqttContext.tsx)":

```bash
const MQTT_URL =
"wss://(your URL in hiveMQ):8884/mqtt";
const MQTT_USERNAME = "Your Username";
const MQTT_PASSWORD = "Your Password"
```

### Server

Now using https://smartaquarium-jmlc.onrender.com/fish-rcm for Fish Recommendation System, and https://smartaquarium-jmlc.onrender.com/fish for Fish Library

### IoT device

Change the "MQTT HiveMQ Cloud" in [IoT source file](test2.ino) similar to HiveMQ tutorial above, also change Wifi accordingly to your using Wifi, change before upload code to device!

## For more:

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

### Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
