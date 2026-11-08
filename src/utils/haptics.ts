import * as Haptics from "expo-haptics";
import { useSettingsStore } from "@/src/store/useSettingsStore";

export async function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" = "light",
) {
  const enabled = useSettingsStore.getState().hapticsEnabled;

  if (!enabled) return;

  try {
    if (type === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const style =
        type === "light"
          ? Haptics.ImpactFeedbackStyle.Light
          : type === "medium"
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy;

      await Haptics.impactAsync(style);
    }
  } catch (error) {
    console.warn("Haptic feedback failed:", error);
  }
}
