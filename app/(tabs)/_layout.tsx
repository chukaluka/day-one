import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme";
import { useDayOneStore } from "@/src/store/useDayOneStore";
import { syncHabitReminders } from "@/src/services/notifications";

export default function TabLayout() {
  const theme = useTheme();
  const habits = useDayOneStore((s) => s.habits);

  useEffect(() => {
    syncHabitReminders(habits).catch((error) => {
      console.warn("Unable to sync habit reminders:", error);
    });
  }, [habits]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 66,
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="sunny"
              color={String(color ?? "#827B96")}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="checkbox"
              color={String(color ?? "#827B96")}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bar-chart"
              color={String(color ?? "#827B96")}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="options"
              color={String(color ?? "#827B96")}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
