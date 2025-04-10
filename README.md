# Smart Aquarium Management IoT System

## Overview

The Smart Aquarium Management IoT System is an intelligent aquarium monitoring and automation system that utilizes IoT technology, AI-driven recommendations, and mobile app control. The system collects real-time sensor data, processes it using an AI recommendation model, and controls the aquarium environment via ESP32.

## Features

- Real-time Sensor Monitoring: Tracks water quality parameters such as temperature, TDS, turbulent.

- AI Recommendation Model: Provides suggestions based on sensor readings (e.g., water change alerts).

- Automated Feeding System: Schedules and executes feeding times based on fish species and dietary needs.

- Remote Control via Mobile App: Allows users to control the filtration and feeding system remotely.

## Protocols Used:

- MQTT: For controlling devices (e.g., feeding and filtration control).

## Functional Flow

1. Read sensor data from aquarium.

2. Process data using the AI recommendation model.

3. Update the mobile app with the latest system status.

## Routing Table

| Condition              | Action                                     |
| ---------------------- | ------------------------------------------ |
| Turb > 50%             | Alert user, suggest a partial water change |
| TDS > 300 ppm          | Alert user, suggest a partial water change |
| Scheduled Feeding Time | Activate feeder motor                      |

## System Updates & Maintenance

- Add/Remove fish species to update feeding schedules and maintenance routines.

- Adjust nutrition, medication, and probiotic recommendations.

- Modify aquarium settings based on fish type data.

- Perform OTA firmware updates to enhance AI and system functionality.

## Demo Scenarios

- Monitor live water quality metrics via the mobile app.

- Schedule and execute automatic feeding.

- Control the filtration system remotely from the mobile app.

## Get started with Expo

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app, then connect with Expo GO:

   ```bash
    npx expo start
   ```

or to start with debug, use:

```bash
npx expo start --clean
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## NodeJS server

To run server, cd to /server, then

```bash
node index.js
```
