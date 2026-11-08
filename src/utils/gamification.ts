import type { Habit } from "@/src/store/useDayOneStore";
import { dateKey } from "@/src/store/useDayOneStore";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
};

export type GamificationStats = {
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  levelProgress: number;
  totalCompletions: number;
  currentStreak: number;
  bestStreak: number;
  achievements: Achievement[];
};

const XP_PER_COMPLETION = 10;
const XP_PER_LEVEL = 100;

function getScheduledCompletionDates(
  habits: Habit[],
  completions: Record<string, string[]>,
): string[] {
  const validHabitIds = new Set(habits.map((habit) => habit.id));
  const dates: string[] = [];

  Object.entries(completions).forEach(([date, completedIds]) => {
    const weekday = new Date(`${date}T00:00:00`).getDay();

    const validCompletions = completedIds.filter((id) => {
      const habit = habits.find((item) => item.id === id);

      return (
        validHabitIds.has(id) &&
        !!habit &&
        habit.days.includes(weekday) &&
        date >= dateKey(new Date(habit.createdAt))
      );
    });

    if (validCompletions.length > 0) {
      dates.push(date);
    }
  });

  return dates.sort();
}

function getStreak(dates: string[], today: string): number {
  const dateSet = new Set(dates);
  const yesterdayDate = new Date(`${today}T00:00:00`);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  // If today has no completion yet, preserve yesterday's streak.
  let cursor = dateSet.has(today)
    ? new Date(`${today}T00:00:00`)
    : yesterdayDate;

  if (!dateSet.has(dateKey(cursor))) {
    return 0;
  }

  let streak = 0;

  while (dateSet.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getBestStreak(dates: string[]): number {
  const dateSet = new Set(dates);
  let best = 0;

  dates.forEach((date) => {
    const previous = new Date(`${date}T00:00:00`);
    previous.setDate(previous.getDate() - 1);

    // Only start counting at the beginning of a streak.
    if (dateSet.has(dateKey(previous))) return;

    let streak = 0;
    const cursor = new Date(`${date}T00:00:00`);

    while (dateSet.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    best = Math.max(best, streak);
  });

  return best;
}

export function getGamificationStats(
  habits: Habit[],
  completions: Record<string, string[]>,
  today = dateKey(),
): GamificationStats {
  const scheduledDates = getScheduledCompletionDates(habits, completions);

  const totalCompletions = Object.values(completions).reduce(
    (total, ids) => total + new Set(ids).size,
    0,
  );

  const xp = totalCompletions * XP_PER_COMPLETION;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_PER_LEVEL;
  const currentStreak = getStreak(scheduledDates, today);
  const bestStreak = getBestStreak(scheduledDates);

  const achievements: Achievement[] = [
    {
      id: "first-step",
      title: "First Step",
      description: "Complete your first habit.",
      icon: "footsteps",
      unlocked: totalCompletions >= 1,
      progress: Math.min(totalCompletions, 1),
      target: 1,
    },
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Complete 10 habits.",
      icon: "rocket",
      unlocked: totalCompletions >= 10,
      progress: Math.min(totalCompletions, 10),
      target: 10,
    },
    {
      id: "habit-builder",
      title: "Habit Builder",
      description: "Complete 50 habits.",
      icon: "construct",
      unlocked: totalCompletions >= 50,
      progress: Math.min(totalCompletions, 50),
      target: 50,
    },
    {
      id: "three-day-streak",
      title: "Three in a Row",
      description: "Show up for 3 consecutive days.",
      icon: "flame",
      unlocked: bestStreak >= 3,
      progress: Math.min(bestStreak, 3),
      target: 3,
    },
    {
      id: "seven-day-streak",
      title: "One Week Strong",
      description: "Show up for 7 consecutive days.",
      icon: "trophy",
      unlocked: bestStreak >= 7,
      progress: Math.min(bestStreak, 7),
      target: 7,
    },
    {
      id: "century",
      title: "Century Club",
      description: "Earn 100 XP.",
      icon: "star",
      unlocked: xp >= 100,
      progress: Math.min(xp, 100),
      target: 100,
    },
  ];

  return {
    xp,
    level,
    currentLevelXp,
    nextLevelXp: XP_PER_LEVEL,
    levelProgress: currentLevelXp / XP_PER_LEVEL,
    totalCompletions,
    currentStreak,
    bestStreak,
    achievements,
  };
}
