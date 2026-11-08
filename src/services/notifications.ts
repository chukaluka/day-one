import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Habit } from "@/src/store/useDayOneStore";

export const NOTIFICATION_CHANNEL_ID = "day-one-reminders";

const APP_IDENTIFIER = "day-one";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "DAY ONE Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7547F5",
      sound: "default",
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return requestedPermission.granted;
}

async function cancelDayOneReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const ourReminders = scheduled.filter(
    (notification) => notification.content.data?.app === APP_IDENTIFIER,
  );

  await Promise.all(
    ourReminders.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

async function scheduleHabitReminder(habit: Habit) {
  const [hour, minute] = habit.time.split(":").map(Number);

  for (const day of habit.days) {
    // JavaScript: Sunday = 0.
    // Expo weekly trigger: Sunday = 1.
    const expoWeekday = day + 1;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${habit.title}`,
        body: `Your minimum is ${habit.minimumMinutes} minutes. Your target is ${habit.targetMinutes} minutes. Show up for yourself today.`,
        sound: "default",
        data: {
          app: APP_IDENTIFIER,
          habitId: habit.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: expoWeekday,
        hour,
        minute,
        ...(Platform.OS === "android"
          ? { channelId: NOTIFICATION_CHANNEL_ID }
          : {}),
      },
    });
  }
}

let syncQueue: Promise<void> = Promise.resolve();

export function syncHabitReminders(habits: Habit[]): Promise<void> {
  // Keep repeated updates in order so an older sync cannot
  // overwrite a newer habit schedule.
  syncQueue = syncQueue
    .catch(() => undefined)
    .then(async () => {
      const permission = await Notifications.getPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      await cancelDayOneReminders();

      const activeHabits = habits.filter(
        (habit) => !habit.isPaused && habit.days.length > 0,
      );

      for (const habit of activeHabits) {
        await scheduleHabitReminder(habit);
      }
    });

  return syncQueue;
}
