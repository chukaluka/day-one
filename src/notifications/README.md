# Notifications — next implementation step

The Expo Notifications package is included in the project dependencies and plugin configuration.

Next:
1. Request notification permission with `Notifications.requestPermissionsAsync()`.
2. Create an Android notification channel.
3. Schedule one local notification per active habit.
4. Reconcile scheduled notifications whenever a habit is added or edited.
5. Add notification actions for complete, snooze and reschedule.

Important: notification delivery depends on OS permissions and platform behaviour. Test on physical iOS and Android devices; Expo Go has limitations for some notification features.