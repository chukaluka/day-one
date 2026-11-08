import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme";
import {
  AppearancePreference,
  useSettingsStore,
} from "@/src/store/useSettingsStore";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/useAuthStore";

const appearanceOptions: {
  label: string;
  value: AppearancePreference;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "System", value: "system", icon: "phone-portrait-outline" },
  { label: "Light", value: "light", icon: "sunny-outline" },
  { label: "Dark", value: "dark", icon: "moon-outline" },
];

export default function SettingsScreen() {
  const t = useTheme();

  const appearance = useSettingsStore((state) => state.appearance);
  const setAppearance = useSettingsStore((state) => state.setAppearance);

  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore(
    (state) => state.setHapticsEnabled,
  );

  const [notificationsEnabled, setNotificationsEnabled] = useState<
    boolean | null
  >(null);

  const [canAskAgain, setCanAskAgain] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out of DAY ONE?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await signOut();
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert(
              "Logout failed",
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
            );
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: t.background,
    },
    content: {
      padding: 20,
      paddingTop: 26,
      paddingBottom: 40,
      gap: 20,
    },
    header: {
      gap: 5,
      marginBottom: 4,
    },
    kicker: {
      color: t.accent,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    title: {
      color: t.text,
      fontSize: 28,
      fontWeight: "800",
    },
    subtitle: {
      color: t.muted,
      fontSize: 13,
      lineHeight: 19,
    },
    section: {
      gap: 10,
    },
    sectionTitle: {
      color: t.muted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
      gap: 14,
    },
    heading: {
      color: t.text,
      fontSize: 14,
      fontWeight: "700",
    },
    body: {
      color: t.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    appearanceOptions: {
      flexDirection: "row",
      gap: 8,
    },
    appearanceOption: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
      gap: 7,
    },
    selectedOption: {
      borderColor: t.accent,
      backgroundColor: t.accentSoft,
    },
    optionText: {
      color: t.muted,
      fontSize: 11,
      fontWeight: "700",
    },
    selectedOptionText: {
      color: t.accent,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    settingInfo: {
      flex: 1,
      gap: 4,
    },
    iconContainer: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: t.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    notificationButton: {
      backgroundColor: t.accent,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    notificationButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      color: t.muted,
      fontSize: 11,
      fontWeight: "600",
    },
    aboutCard: {
      backgroundColor: t.accentSoft,
      borderRadius: 18,
      padding: 18,
      alignItems: "center",
      gap: 8,
    },
    logo: {
      color: t.accent,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 2,
    },
    version: {
      color: t.muted,
      fontSize: 11,
    },
    tagline: {
      color: t.text,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },

    logoutButton: {
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.danger,
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    logoutButtonText: {
      color: t.danger,
      fontSize: 13,
      fontWeight: "800",
    },
    accountEmail: {
      color: t.muted,
      fontSize: 12,
    },
  });

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const permission = await Notifications.getPermissionsAsync();

      setNotificationsEnabled(permission.granted);
      setCanAskAgain(permission.canAskAgain);
    } catch (error) {
      console.warn("Could not check notification permissions:", error);
    }
  };

  const handleNotificationPermission = async () => {
    if (loadingNotifications) return;

    try {
      setLoadingNotifications(true);

      const currentPermission = await Notifications.getPermissionsAsync();

      if (currentPermission.granted) {
        setNotificationsEnabled(true);
        return;
      }

      if (!currentPermission.canAskAgain) {
        Alert.alert(
          "Notifications disabled",
          "Please enable notifications for DAY ONE in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );

        return;
      }

      const permission = await Notifications.requestPermissionsAsync();

      setNotificationsEnabled(permission.granted);
      setCanAskAgain(permission.canAskAgain);

      if (!permission.granted) {
        Alert.alert(
          "Permission not granted",
          "DAY ONE needs notification permission to send your habit reminders.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Something went wrong",
        "We could not update your notification permissions.",
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  const notificationStatus = notificationsEnabled
    ? "Notifications enabled"
    : notificationsEnabled === false
      ? "Notifications disabled"
      : "Checking notification status...";

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>MAKE IT YOURS</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Set up DAY ONE to work the way you do.
        </Text>
      </View>

      {/* APPEARANCE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.card}>
          <View>
            <Text style={styles.heading}>App theme</Text>
            <Text style={styles.body}>
              Choose how DAY ONE looks on your device.
            </Text>
          </View>

          <View style={styles.appearanceOptions}>
            {appearanceOptions.map((option) => {
              const selected = appearance === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setAppearance(option.value)}
                  style={[
                    styles.appearanceOption,
                    selected && styles.selectedOption,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={selected ? t.accent : t.muted}
                  />

                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* NOTIFICATIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={t.accent}
              />
            </View>

            <View style={styles.settingInfo}>
              <Text style={styles.heading}>Habit reminders</Text>
              <Text style={styles.body}>
                Allow DAY ONE to remind you about scheduled habits.
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: notificationsEnabled ? "#36B37E" : t.warning,
                },
              ]}
            />

            <Text style={styles.statusText}>{notificationStatus}</Text>
          </View>

          {!notificationsEnabled && (
            <Pressable
              onPress={handleNotificationPermission}
              disabled={loadingNotifications}
              style={[
                styles.notificationButton,
                loadingNotifications && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.notificationButtonText}>
                {loadingNotifications
                  ? "Please wait..."
                  : "Enable notifications"}
              </Text>
            </Pressable>
          )}

          <Text style={styles.body}>
            Your scheduled habit reminders are managed separately from your
            device notification permission.
          </Text>
        </View>
      </View>

      {/* EXPERIENCE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={t.accent}
              />
            </View>

            <View style={styles.settingInfo}>
              <Text style={styles.heading}>Haptic feedback</Text>
              <Text style={styles.body}>
                Enable vibration feedback when interacting with the app.
              </Text>
            </View>

            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{
                false: t.border,
                true: t.accent,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* ACCOUNTABILITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accountability</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="trending-up-outline" size={20} color={t.accent} />
            </View>

            <View style={styles.settingInfo}>
              <Text style={styles.heading}>Stay accountable</Text>
              <Text style={styles.body}>
                DAY ONE tracks completed commitments, missed days, consistency
                and recovery. Missing a day is feedback, not the end of your
                progress.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ABOUT */}
      <View style={styles.section}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            <View style={styles.settingInfo}>
              <Text style={styles.heading}>Signed in as</Text>
              <Text style={styles.accountEmail}>
                {user?.email ?? "No email available"}
              </Text>
            </View>

            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              style={[styles.logoutButton, loggingOut && { opacity: 0.6 }]}
            >
              <Ionicons name="log-out-outline" size={19} color={t.danger} />

              <Text style={styles.logoutButtonText}>
                {loggingOut ? "Logging out..." : "Log out"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.aboutCard}>
          <Text style={styles.logo}>DAY ONE</Text>

          <Text style={styles.tagline}>
            Small actions. Repeated daily. Real change.
          </Text>

          <Text style={styles.version}>
            Version {Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
