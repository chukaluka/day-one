import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useDayOneStore, dateKey } from "@/src/store/useDayOneStore";

import { useTheme } from "@/src/theme";
import { ProgressBar } from "@/src/components/ProgressBar";
import {
  getHabitStatus,
  getAccountabilitySummary,
} from "@/src/utils/accountability";
import { getGamificationStats } from "@/src/utils/gamification";

const getLastSevenDays = () => {
  const dates: Date[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  return dates;
};

const getDayLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

const getDateLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export default function StatsScreen() {
  const t = useTheme();

  const habits = useDayOneStore((s) => s.habits);
  const completions = useDayOneStore((s) => s.completions);
  const toggleCompletion = useDayOneStore((s) => s.toggleCompletion);

  const today = dateKey();

  const [selectedDate, setSelectedDate] = useState(today);

  const weekDates = useMemo(() => getLastSevenDays(), []);

  const weeklyHistory = useMemo(() => {
    return weekDates.map((date) => {
      const key = dateKey(date);

      const summary = getAccountabilitySummary(habits, key, completions);

      const percentage =
        summary.total > 0
          ? Math.round((summary.completed / summary.total) * 100)
          : 0;

      return {
        key,
        date,
        summary,
        percentage,
      };
    });
  }, [weekDates, habits, completions]);

  const gamification = useMemo(
    () => getGamificationStats(habits, completions, today),
    [habits, completions, today],
  );

  const selectedSummary = useMemo(
    () => getAccountabilitySummary(habits, selectedDate, completions),
    [habits, selectedDate, completions],
  );

  const selectedHabits = useMemo(() => {
    return habits
      .map((habit) => ({
        habit,
        status: getHabitStatus(habit, selectedDate, completions),
      }))
      .filter(({ status }) => status !== "not-scheduled")
      .sort((a, b) => a.habit.time.localeCompare(b.habit.time));
  }, [habits, selectedDate, completions]);

  const activeHabits = habits.filter((habit) => !habit.isPaused);

  const weeklyCompleted = weeklyHistory.reduce(
    (total, day) => total + day.summary.completed,
    0,
  );

  const weeklyMissed = weeklyHistory.reduce(
    (total, day) => total + day.summary.missed,
    0,
  );

  const weeklyTotal = weeklyHistory.reduce(
    (total, day) => total + day.summary.total,
    0,
  );

  const weeklyPercentage =
    weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

  const isToday = selectedDate === today;

  const handleRecovery = (habitId: string, habitTitle: string) => {
    Alert.alert(
      "Recover this commitment?",
      `Did you actually complete "${habitTitle}" on ${selectedDate}? You can record it here.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, I completed it",
          onPress: () => {
            toggleCompletion(habitId, selectedDate);
          },
        },
      ],
    );
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
      gap: 18,
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
      fontWeight: "900",
    },
    subtitle: {
      color: t.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: -10,
    },
    card: {
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 20,
      padding: 17,
      gap: 12,
    },
    cardTitle: {
      color: t.text,
      fontSize: 14,
      fontWeight: "800",
    },
    label: {
      color: t.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.7,
    },
    number: {
      color: t.text,
      fontSize: 29,
      fontWeight: "900",
    },
    body: {
      color: t.muted,
      fontSize: 11,
      lineHeight: 17,
    },
    metricRow: {
      flexDirection: "row",
      gap: 10,
    },
    metricCard: {
      flex: 1,
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 17,
      padding: 14,
      gap: 7,
    },
    metricIcon: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.accentSoft,
    },
    weekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 7,
      marginTop: 5,
    },
    dayColumn: {
      flex: 1,
      alignItems: "center",
      gap: 7,
    },
    dayButton: {
      width: "100%",
      alignItems: "center",
      gap: 7,
      paddingVertical: 9,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "transparent",
    },
    selectedDay: {
      backgroundColor: t.accentSoft,
      borderColor: t.accent,
    },
    dayLabel: {
      color: t.muted,
      fontSize: 9,
      fontWeight: "700",
    },
    dayNumber: {
      color: t.text,
      fontSize: 11,
      fontWeight: "800",
    },
    barTrack: {
      width: 7,
      height: 48,
      borderRadius: 10,
      backgroundColor: t.border,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    barFill: {
      width: "100%",
      borderRadius: 10,
      backgroundColor: t.accent,
    },
    selectedDateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    selectedDateText: {
      color: t.text,
      fontSize: 17,
      fontWeight: "900",
    },
    summaryRow: {
      flexDirection: "row",
      gap: 8,
    },
    summaryItem: {
      flex: 1,
      backgroundColor: t.background,
      padding: 11,
      borderRadius: 12,
      gap: 5,
    },
    summaryNumber: {
      fontSize: 20,
      fontWeight: "900",
    },
    summaryLabel: {
      color: t.muted,
      fontSize: 9,
      fontWeight: "700",
    },
    habitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    habitIcon: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor: t.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    habitInfo: {
      flex: 1,
      gap: 4,
    },
    habitTitle: {
      color: t.text,
      fontSize: 12,
      fontWeight: "800",
    },
    habitTime: {
      color: t.muted,
      fontSize: 10,
    },
    statusText: {
      fontSize: 9,
      fontWeight: "800",
    },
    recoveryButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: t.accentSoft,
    },
    recoveryText: {
      color: t.accent,
      fontSize: 9,
      fontWeight: "900",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 8,
    },
    emptyText: {
      color: t.text,
      fontSize: 13,
      fontWeight: "800",
    },
    emptyDescription: {
      color: t.muted,
      fontSize: 11,
      textAlign: "center",
      lineHeight: 17,
    },
    levelCard: {
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 20,
      padding: 17,
      gap: 13,
    },
    levelTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    levelBadge: {
      backgroundColor: t.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
    },
    levelBadgeText: {
      color: t.accent,
      fontSize: 11,
      fontWeight: "900",
    },
    levelTitle: {
      color: t.text,
      fontSize: 20,
      fontWeight: "900",
    },
    levelDescription: {
      color: t.muted,
      fontSize: 11,
    },
    xpRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    xpText: {
      color: t.text,
      fontSize: 11,
      fontWeight: "800",
    },
    streakRow: {
      flexDirection: "row",
      gap: 10,
    },
    streakCard: {
      flex: 1,
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 15,
      gap: 8,
    },
    streakNumber: {
      color: t.text,
      fontSize: 26,
      fontWeight: "900",
    },
    streakLabel: {
      color: t.muted,
      fontSize: 10,
      fontWeight: "700",
    },
    sectionTitle: {
      color: t.text,
      fontSize: 17,
      fontWeight: "900",
    },
    achievementGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    achievementCard: {
      width: "48%",
      flexGrow: 1,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 16,
      padding: 13,
      gap: 8,
    },
    achievementIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: t.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    achievementTitle: {
      color: t.text,
      fontSize: 11,
      fontWeight: "900",
    },
    achievementDescription: {
      color: t.muted,
      fontSize: 10,
      lineHeight: 15,
    },
    achievementProgress: {
      color: t.accent,
      fontSize: 9,
      fontWeight: "800",
    },
  });

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.kicker}>MEASURE WHAT MATTERS</Text>

      <Text style={styles.title}>Your progress</Text>

      <Text style={styles.subtitle}>
        Every small commitment adds up. Here's how your week is going.
      </Text>

      {/* Weekly overview */}
      <View style={styles.card}>
        <Text style={styles.label}>LAST 7 DAYS</Text>

        <View style={styles.selectedDateRow}>
          <Text style={styles.cardTitle}>Weekly consistency</Text>
          <Text style={[styles.number, { color: t.accent }]}>
            {weeklyPercentage}%
          </Text>
        </View>

        <ProgressBar progress={weeklyPercentage / 100} />

        <Text style={styles.body}>
          {weeklyCompleted} completed out of {weeklyTotal} scheduled
          commitments.
        </Text>

        <View style={styles.weekRow}>
          {weeklyHistory.map((day) => {
            const selected = selectedDate === day.key;

            return (
              <View key={day.key} style={styles.dayColumn}>
                <Pressable
                  onPress={() => setSelectedDate(day.key)}
                  style={[styles.dayButton, selected && styles.selectedDay]}
                >
                  <Text style={styles.dayLabel}>{getDayLabel(day.date)}</Text>

                  <Text style={styles.dayNumber}>{day.date.getDate()}</Text>

                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${day.percentage}%`,
                          backgroundColor:
                            day.percentage === 100 ? "#20A98B" : t.accent,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.dayLabel}>{day.percentage}%</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quick metrics */}
      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Ionicons name="checkmark-circle" size={18} color="#20A98B" />
          </View>

          <Text style={styles.label}>COMPLETED</Text>
          <Text style={styles.number}>{weeklyCompleted}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Ionicons name="refresh-circle" size={18} color="#F27B69" />
          </View>

          <Text style={styles.label}>MISSED</Text>
          <Text style={styles.number}>{weeklyMissed}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Ionicons name="flame" size={18} color="#E9A83B" />
          </View>

          <Text style={styles.label}>ACTIVE</Text>
          <Text style={styles.number}>{activeHabits.length}</Text>
        </View>
      </View>

      {/* Level and XP */}
      <View style={styles.levelCard}>
        <View style={styles.levelTop}>
          <View style={{ gap: 5 }}>
            <Text style={styles.label}>YOUR DAY ONE LEVEL</Text>
            <Text style={styles.levelTitle}>Level {gamification.level}</Text>
            <Text style={styles.levelDescription}>
              Keep showing up. Keep growing.
            </Text>
          </View>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{gamification.xp} XP</Text>
          </View>
        </View>

        <ProgressBar progress={gamification.levelProgress} />

        <View style={styles.xpRow}>
          <Text style={styles.xpText}>
            {gamification.currentLevelXp} / {gamification.nextLevelXp} XP
          </Text>

          <Text style={styles.label}>
            {gamification.nextLevelXp - gamification.currentLevelXp} XP TO NEXT
            LEVEL
          </Text>
        </View>
      </View>

      {/* Streaks */}
      <View style={styles.streakRow}>
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={23} color="#F27B69" />
          <Text style={styles.streakNumber}>{gamification.currentStreak}</Text>
          <Text style={styles.streakLabel}>CURRENT STREAK</Text>
        </View>

        <View style={styles.streakCard}>
          <Ionicons name="trophy" size={23} color="#E9A83B" />
          <Text style={styles.streakNumber}>{gamification.bestStreak}</Text>
          <Text style={styles.streakLabel}>BEST STREAK</Text>
        </View>
      </View>

      {/* Achievements */}
      <View style={{ gap: 12 }}>
        <View style={styles.selectedDateRow}>
          <Text style={styles.sectionTitle}>Achievements</Text>

          <Text style={styles.label}>
            {gamification.achievements.filter((item) => item.unlocked).length}
            {" / "}
            {gamification.achievements.length} UNLOCKED
          </Text>
        </View>

        <View style={styles.achievementGrid}>
          {gamification.achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                !achievement.unlocked && { opacity: 0.55 },
              ]}
            >
              <View style={styles.achievementIcon}>
                <Ionicons
                  name={achievement.icon as keyof typeof Ionicons.glyphMap}
                  size={19}
                  color={achievement.unlocked ? t.accent : t.muted}
                />
              </View>

              <Text style={styles.achievementTitle}>{achievement.title}</Text>

              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>

              <Text style={styles.achievementProgress}>
                {achievement.unlocked
                  ? "UNLOCKED"
                  : `${achievement.progress} / ${achievement.target}`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Selected day history */}
      <View style={styles.card}>
        <View style={styles.selectedDateRow}>
          <View style={{ gap: 4 }}>
            <Text style={styles.label}>DAILY HISTORY</Text>
            <Text style={styles.selectedDateText}>
              {isToday
                ? "Today"
                : getDateLabel(new Date(`${selectedDate}T00:00:00`))}
            </Text>
          </View>

          <Ionicons name="calendar-outline" size={22} color={t.accent} />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: "#20A98B" }]}>
              {selectedSummary.completed}
            </Text>
            <Text style={styles.summaryLabel}>COMPLETED</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: "#F27B69" }]}>
              {selectedSummary.missed}
            </Text>
            <Text style={styles.summaryLabel}>MISSED</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: t.accent }]}>
              {selectedSummary.upcoming + selectedSummary.due}
            </Text>
            <Text style={styles.summaryLabel}>
              {isToday ? "REMAINING" : "OTHER"}
            </Text>
          </View>
        </View>

        <ProgressBar
          progress={
            selectedSummary.total > 0
              ? selectedSummary.completed / selectedSummary.total
              : 0
          }
        />

        {selectedHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={30} color={t.muted} />
            <Text style={styles.emptyText}>Nothing scheduled</Text>
            <Text style={styles.emptyDescription}>
              There are no commitments scheduled for this day.
            </Text>
          </View>
        ) : (
          selectedHabits.map(({ habit, status }) => {
            const isMissed = status === "missed";
            const isCompleted = status === "completed";
            const isPaused = status === "paused";

            return (
              <View key={habit.id} style={styles.habitRow}>
                <View style={styles.habitIcon}>
                  <Ionicons
                    name={
                      isCompleted
                        ? "checkmark-circle"
                        : isMissed
                          ? "time-outline"
                          : isPaused
                            ? "pause-circle-outline"
                            : "ellipse-outline"
                    }
                    size={19}
                    color={
                      isCompleted ? "#20A98B" : isMissed ? "#F27B69" : t.accent
                    }
                  />
                </View>

                <View style={styles.habitInfo}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>

                  <Text style={styles.habitTime}>
                    {habit.time} · {habit.targetMinutes} min target
                  </Text>

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isCompleted
                          ? "#20A98B"
                          : isMissed
                            ? "#F27B69"
                            : t.muted,
                      },
                    ]}
                  >
                    {isCompleted
                      ? "COMPLETED"
                      : isMissed
                        ? "MISSED"
                        : isPaused
                          ? "PAUSED"
                          : status === "due"
                            ? "DUE NOW"
                            : "UPCOMING"}
                  </Text>
                </View>

                {isMissed && (
                  <Pressable
                    style={styles.recoveryButton}
                    onPress={() => handleRecovery(habit.id, habit.title)}
                  >
                    <Text style={styles.recoveryText}>RECOVER</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Active habits */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your routine</Text>

        <Text style={styles.body}>
          You currently have {activeHabits.length} active habits and{" "}
          {habits.length - activeHabits.length} paused habits. Keep building a
          routine that works for you.
        </Text>
      </View>
    </ScrollView>
  );
}
