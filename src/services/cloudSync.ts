import { AppState } from "react-native";

import { supabase } from "@/src/lib/supabase";
import { Habit, useDayOneStore } from "@/src/store/useDayOneStore";
import { useSettingsStore } from "@/src/store/useSettingsStore";

type CloudHabit = {
  id: string;
  title: string;
  time: string;
  minimum_minutes: number;
  target_minutes: number;
  days: number[];
  category: string | null;
  priority: string | null;
  is_paused: boolean;
  created_at: string;
  deleted_at: string | null;
};

type CloudCompletion = {
  habit_id: string;
  completed_on: string;
};

type SyncSnapshot = {
  habits: Map<string, Habit>;
  completions: Record<string, string[]>;
  appearance: string;
  hapticsEnabled: boolean;
};

const toHabit = (habit: CloudHabit): Habit => ({
  id: habit.id,
  title: habit.title,
  time: habit.time,
  minimumMinutes: habit.minimum_minutes,
  targetMinutes: habit.target_minutes,
  days: habit.days ?? [],
  category: (habit.category ?? "Other") as Habit["category"],
  priority: (habit.priority ?? "Medium") as Habit["priority"],
  isPaused: habit.is_paused ?? false,
  createdAt: habit.created_at,
});

const toCloudHabit = (habit: Habit, userId: string) => ({
  id: habit.id,
  user_id: userId,
  title: habit.title,
  time: habit.time,
  minimum_minutes: habit.minimumMinutes,
  target_minutes: habit.targetMinutes,
  days: habit.days,
  category: habit.category,
  priority: habit.priority,
  is_paused: habit.isPaused,
  created_at: habit.createdAt,
});

function getSnapshot(): SyncSnapshot {
  const dayOne = useDayOneStore.getState();
  const settings = useSettingsStore.getState();

  return {
    habits: new Map(
      dayOne.habits.map((habit) => [
        habit.id,
        {
          ...habit,
          days: [...habit.days],
        },
      ]),
    ),
    completions: Object.fromEntries(
      Object.entries(dayOne.completions).map(([date, ids]) => [date, [...ids]]),
    ),
    appearance: settings.appearance,
    hapticsEnabled: settings.hapticsEnabled,
  };
}

function completionKey(habitId: string, date: string) {
  return `${habitId}::${date}`;
}

// Initial login sync.
export async function syncUserData(userId: string) {
  const [habitsResult, completionsResult, settingsResult] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", userId),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_on")
      .eq("user_id", userId),
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (habitsResult.error) throw habitsResult.error;
  if (completionsResult.error) throw completionsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const cloudRows = (habitsResult.data ?? []) as CloudHabit[];
  const deletedHabitIds = new Set(
    cloudRows.filter((item) => item.deleted_at).map((item) => item.id),
  );
  const cloudHabits = cloudRows
    .filter((item) => !item.deleted_at)
    .map(toHabit);

  const cloudCompletions = (completionsResult.data ?? []) as CloudCompletion[];

  const localState = useDayOneStore.getState();

  // Merge habits. Local versions take priority for matching IDs.
  const mergedHabits = new Map<string, Habit>();

  cloudHabits.forEach((habit) => {
    mergedHabits.set(habit.id, habit);
  });

  localState.habits.forEach((habit) => {
    if (!deletedHabitIds.has(habit.id)) {
      mergedHabits.set(habit.id, habit);
    }
  });

  const habits = Array.from(mergedHabits.values());

  // Merge completion history without duplicates.
  const completions: Record<string, string[]> = {};

  cloudCompletions.forEach((completion) => {
    const date = completion.completed_on;

    if (!completions[date]) completions[date] = [];

    if (!completions[date].includes(completion.habit_id)) {
      completions[date].push(completion.habit_id);
    }
  });

  Object.entries(localState.completions).forEach(([date, ids]) => {
    if (!completions[date]) completions[date] = [];

    ids.forEach((id) => {
      if (!completions[date].includes(id)) {
        completions[date].push(id);
      }
    });
  });

  useDayOneStore.setState({ habits, completions });

  // Upload merged habits.
  if (habits.length > 0) {
    const { error } = await supabase
      .from("habits")
      .upsert(
        habits.map((habit) => ({
          ...toCloudHabit(habit, userId),
          deleted_at: null,
        })),
      );

    if (error) throw error;
  }

  // Upload merged completions.
  const activeHabitIds = new Set(habits.map((habit) => habit.id));
  const completionRows = Object.entries(completions).flatMap(([date, ids]) =>
    ids
      .filter((habitId) => activeHabitIds.has(habitId))
      .map((habitId) => ({
        user_id: userId,
        habit_id: habitId,
        completed_on: date,
      })),
  );

  if (completionRows.length > 0) {
    const { error } = await supabase
      .from("habit_completions")
      .upsert(completionRows, {
        onConflict: "habit_id,completed_on",
        ignoreDuplicates: true,
      });

    if (error) throw error;
  }

  // Load or create cloud settings.
  const cloudSettings = settingsResult.data;

  if (cloudSettings) {
    useSettingsStore.setState({
      appearance: cloudSettings.appearance,
      hapticsEnabled: cloudSettings.haptics_enabled,
    });
  } else {
    const localSettings = useSettingsStore.getState();

    const { error } = await supabase.from("user_settings").upsert({
      user_id: userId,
      appearance: localSettings.appearance,
      haptics_enabled: localSettings.hapticsEnabled,
    });

    if (error) throw error;
  }

  console.log("DAY ONE initial cloud sync completed.");
}

// Automatic syncing after the initial login sync.
export function startAutoSync(userId: string) {
  let previous = getSnapshot();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let syncQueue = Promise.resolve();

  const syncChanges = () => {
    syncQueue = syncQueue
      .then(async () => {
        const current = getSnapshot();

        // 1. Upload current habits.
        const currentHabits = Array.from(current.habits.values());

        if (currentHabits.length > 0) {
          const { error } = await supabase
            .from("habits")
            .upsert(
              currentHabits.map((habit) => ({
                ...toCloudHabit(habit, userId),
                deleted_at: null,
              })),
            );

          if (error) throw error;
        }

        // 2. Delete habits removed locally.
        const removedHabitIds = Array.from(previous.habits.keys()).filter(
          (id) => !current.habits.has(id),
        );

        if (removedHabitIds.length > 0) {
          const { error } = await supabase
            .from("habits")
            .update({ deleted_at: new Date().toISOString() })
            .eq("user_id", userId)
            .in("id", removedHabitIds);

          if (error) throw error;
        }

        // 3. Upload current completion history.
        const activeHabitIds = new Set(current.habits.keys());
        const completionRows = Object.entries(current.completions).flatMap(
          ([date, ids]) =>
            ids
              .filter((habitId) => activeHabitIds.has(habitId))
              .map((habitId) => ({
                user_id: userId,
                habit_id: habitId,
                completed_on: date,
              })),
        );

        if (completionRows.length > 0) {
          const { error } = await supabase
            .from("habit_completions")
            .upsert(completionRows, {
              onConflict: "habit_id,completed_on",
              ignoreDuplicates: true,
            });

          if (error) throw error;
        }

        // 4. Remove completion records unchecked locally.
        const currentCompletionKeys = new Set(
          Object.entries(current.completions).flatMap(([date, ids]) =>
            ids.map((id) => completionKey(id, date)),
          ),
        );

        const previousCompletions = Object.entries(
          previous.completions,
        ).flatMap(([date, ids]) => ids.map((id) => ({ habitId: id, date })));

        for (const item of previousCompletions) {
          if (
            !currentCompletionKeys.has(completionKey(item.habitId, item.date))
          ) {
            const { error } = await supabase
              .from("habit_completions")
              .delete()
              .eq("user_id", userId)
              .eq("habit_id", item.habitId)
              .eq("completed_on", item.date);

            if (error) throw error;
          }
        }

        // 5. Sync settings.
        if (
          current.appearance !== previous.appearance ||
          current.hapticsEnabled !== previous.hapticsEnabled
        ) {
          const { error } = await supabase.from("user_settings").upsert({
            user_id: userId,
            appearance: current.appearance,
            haptics_enabled: current.hapticsEnabled,
          });

          if (error) throw error;
        }

        // Only update the snapshot after every operation succeeds.
        previous = current;

        console.log("DAY ONE changes synced.");
      })
      .catch((error) => {
        console.warn("DAY ONE automatic sync failed:", error);
      });

    return syncQueue;
  };

  const scheduleSync = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      syncChanges();
    }, 600);
  };

  // Listen for habit and completion changes.
  const unsubscribeDayOne = useDayOneStore.subscribe(scheduleSync);

  // Listen for appearance and haptics changes.
  const unsubscribeSettings = useSettingsStore.subscribe(scheduleSync);

  // Retry pending changes when the app returns to the foreground.
  const appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      scheduleSync();
    }
  });

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    unsubscribeDayOne();
    unsubscribeSettings();
    appStateSubscription.remove();
  };
}
