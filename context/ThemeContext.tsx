import React, { createContext, useContext, ReactNode } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

type ThemeContextType = {
  colorScheme: "light" | "dark";
  colors: typeof Colors.light | typeof Colors.dark;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useRNColorScheme() ?? "light";
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <ThemeContext.Provider value={{ colorScheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
