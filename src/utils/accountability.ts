import type { Habit } from "@/src/store/useDayOneStore";

export type HabitStatus =
  | "upcoming"
  | "due"
  | "completed"
  | "missed"
  | "paused"
  | "not-scheduled";

type AccountabilitySummary = {
  total: number;
  completed: number;
  due: number;
  upcoming: number;
  missed: number;
  paused: number;
};

export function getHabitStatus(
  habit: Habit,
  date: string,
  completions: Record<string, string[]>,
  now: Date = new Date(),
): HabitStatus {
  const scheduledDate = new Date(`${date}T00:00:00`);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const createdDate = new Date(habit.createdAt);

  const createdDay = new Date(
    createdDate.getFullYear(),
    createdDate.getMonth(),
    createdDate.getDate(),
  );

  // Habit must already exist on the selected date.
  if (scheduledDate < createdDay) {
    return "not-scheduled";
  }

  // Habit must be scheduled for the selected weekday.
  if (!habit.days.includes(scheduledDate.getDay())) {
    return "not-scheduled";
  }

  // A paused habit is paused for today or future dates.
  // Historical dates are still evaluated normally.
  if (habit.isPaused && scheduledDate >= today) {
    return "paused";
  }

  // Check completion.
  if ((completions[date] ?? []).includes(habit.id)) {
    return "completed";
  }

  // Future dates.
  if (scheduledDate > today) {
    return "upcoming";
  }

  // Past scheduled dates that were not completed.
  if (scheduledDate < today) {
    return "missed";
  }

  // Today's scheduled habit.
  const [hour, minute] = habit.time.split(":").map(Number);

  const reminderTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
  );

  return now >= reminderTime ? "due" : "upcoming";
}

export function getAccountabilitySummary(
  habits: Habit[],
  date: string,
  completions: Record<string, string[]>,
  now: Date = new Date(),
): AccountabilitySummary {
  const summary: AccountabilitySummary = {
    total: 0,
    completed: 0,
    due: 0,
    upcoming: 0,
    missed: 0,
    paused: 0,
  };

  habits.forEach((habit) => {
    const status = getHabitStatus(habit, date, completions, now);

    if (status === "not-scheduled") return;

    summary.total += 1;

    if (status === "completed") {
      summary.completed += 1;
    } else if (status === "due") {
      summary.due += 1;
    } else if (status === "upcoming") {
      summary.upcoming += 1;
    } else if (status === "missed") {
      summary.missed += 1;
    } else if (status === "paused") {
      summary.paused += 1;
    }
  });

  return summary;
}
