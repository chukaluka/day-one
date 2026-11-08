import { useColorScheme } from "react-native";
import { useSettingsStore } from "./store/useSettingsStore";

const light = {
  background: "#F7F5FF",
  card: "#FFFFFF",
  text: "#201A35",
  muted: "#827B96",
  border: "#EAE5F5",
  accent: "#7547F5",
  accentSoft: "#EFE9FF",
  danger: "#F26B78",
  warning: "#E9A23B",
  surface: "#F1EDFF",
};

const dark = {
  background: "#141020",
  card: "#211A32",
  text: "#F8F5FF",
  muted: "#AAA0C0",
  border: "#382D50",
  accent: "#A98BFF",
  accentSoft: "#33264F",
  danger: "#FF8793",
  warning: "#FFC66D",
  surface: "#2B2240",
};

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const appearance = useSettingsStore((state) => state.appearance);

  const isDark =
    appearance === "system"
      ? systemColorScheme === "dark"
      : appearance === "dark";

  return isDark ? dark : light;
}
