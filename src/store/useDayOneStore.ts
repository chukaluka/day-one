import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type HabitCategory =
  | "Personal"
  | "Learning"
  | "Health"
  | "Work"
  | "Fitness"
  | "Other";

export type HabitPriority = "Low" | "Medium" | "High";

export type Habit = {
  id: string;
  title: string;
  time: string;
  minimumMinutes: number;
  targetMinutes: number;
  days: number[];
  category: HabitCategory;
  priority: HabitPriority;
  isPaused: boolean;
  createdAt: string;
};

export type HabitInput = Omit<Habit, "id" | "createdAt" | "isPaused"> & {
  isPaused?: boolean;
};

type DayOneState = {
  habits: Habit[];
  completions: Record<string, string[]>;

  addHabit: (habit: HabitInput) => void;
  updateHabit: (id: string, updates: Partial<HabitInput>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitPaused: (id: string) => void;

  toggleCompletion: (habitId: string, date: string) => void;
  isComplete: (habitId: string, date: string) => boolean;
};

export const dateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

const starterHabits: Habit[] = [];

export const useDayOneStore = create<DayOneState>()(
  persist(
    (set, get) => ({
      habits: starterHabits,
      completions: {},

      addHabit: (habit) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              ...habit,
              id: `${Date.now()}`,
              isPaused: habit.isPaused ?? false,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateHabit: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, ...updates } : habit,
          ),
        })),

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
        })),

      toggleHabitPaused: (id) =>
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, isPaused: !habit.isPaused } : habit,
          ),
        })),

      toggleCompletion: (habitId, date) =>
        set((state) => {
          const current = state.completions[date] ?? [];

          const next = current.includes(habitId)
            ? current.filter((id) => id !== habitId)
            : [...current, habitId];

          return {
            completions: {
              ...state.completions,
              [date]: next,
            },
          };
        }),

      isComplete: (habitId, date) =>
        (get().completions[date] ?? []).includes(habitId),
    }),
    {
      name: "day-one-storage-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
