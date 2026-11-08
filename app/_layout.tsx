import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { useTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useDayOneStore } from "@/src/store/useDayOneStore";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { syncUserData, startAutoSync } from "@/src/services/cloudSync";

function waitForStoreHydration(
  store: typeof useDayOneStore | typeof useSettingsStore,
): Promise<void> {
  if (store.persist.hasHydrated()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    store.persist.onFinishHydration(() => resolve());
  });
}

export default function RootLayout() {
  const theme = useTheme();

  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const syncedUserId = useRef<string | null>(null);
  const syncingUserId = useRef<string | null>(null);

  // Initialize Supabase authentication.
  useEffect(() => {
    initializeAuth().catch((error) => {
      console.warn("Unable to initialize authentication:", error);
    });
  }, [initializeAuth]);

  // Sync local data with Supabase after authentication.

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      syncedUserId.current = null;
      syncingUserId.current = null;
      return;
    }

    if (syncedUserId.current === user.id || syncingUserId.current === user.id) {
      return;
    }

    let cancelled = false;
    let stopAutoSync: (() => void) | undefined;

    const sync = async () => {
      try {
        syncingUserId.current = user.id;

        await Promise.all([
          waitForStoreHydration(useDayOneStore),
          waitForStoreHydration(useSettingsStore),
        ]);

        if (cancelled) return;

        await syncUserData(user.id);

        if (cancelled) return;

        syncedUserId.current = user.id;

        // Start listening for changes after initial sync.
        stopAutoSync = startAutoSync(user.id);

        console.log("DAY ONE automatic syncing is active.");
      } catch (error) {
        console.warn("DAY ONE cloud sync failed:", error);
      } finally {
        if (syncingUserId.current === user.id) {
          syncingUserId.current = null;
        }
      }
    };

    sync();

    return () => {
      cancelled = true;
      stopAutoSync?.();
    };
  }, [initialized, user?.id]);

  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.background === "#141020" ? "light" : "dark"} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
