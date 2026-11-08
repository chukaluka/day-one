import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppearancePreference = "system" | "light" | "dark";

type SettingsState = {
  appearance: AppearancePreference;
  hapticsEnabled: boolean;
  setAppearance: (appearance: AppearancePreference) => void;
  setHapticsEnabled: (enabled: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appearance: "light",
      hapticsEnabled: true,

      setAppearance: (appearance) => set({ appearance }),

      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: "day-one-settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
