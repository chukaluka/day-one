import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { useDayOneStore, dateKey } from "@/src/store/useDayOneStore";
import type { HabitCategory } from "@/src/store/useDayOneStore";

import { useTheme } from "@/src/theme";
import { getHabitStatus } from "@/src/utils/accountability";
import { RewardCelebration } from "@/src/components/RewardCelebration";
import { getGamificationStats } from "@/src/utils/gamification";

const todayLabel = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

const habitLooks: Record<
  HabitCategory,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    soft: string;
    label: string;
  }
> = {
  Learning: {
    icon: "code-slash",
    color: "#7547F5",
    soft: "#F0EAFE",
    label: "LEARNING",
  },
  Fitness: {
    icon: "barbell",
    color: "#F27B69",
    soft: "#FFF0EC",
    label: "FITNESS",
  },
  Personal: {
    icon: "sparkles",
    color: "#20A98B",
    soft: "#E6F8F2",
    label: "PERSONAL",
  },
  Health: {
    icon: "heart",
    color: "#E45B8C",
    soft: "#FCEAF1",
    label: "HEALTH",
  },
  Work: {
    icon: "briefcase",
    color: "#4288E8",
    soft: "#EAF2FF",
    label: "WORK",
  },
  Other: {
    icon: "star",
    color: "#E5A52E",
    soft: "#FFF6DF",
    label: "OTHER",
  },
};

export default function TodayScreen() {
  const theme = useTheme();

  const habits = useDayOneStore((state) => state.habits);
  const toggleCompletion = useDayOneStore((state) => state.toggleCompletion);
  const completions = useDayOneStore((state) => state.completions);

  const [reward, setReward] = useState<{
    xpEarned: number;
    levelUp: boolean;
    newLevel: number;
    achievementTitles: string[];
  } | null>(null);

  const today = dateKey();

  // IDs of habits already completed today.
  const completedIds = completions[today] ?? [];

  const todayHabits = useMemo(() => {
    return habits
      .filter(
        (habit) => !habit.isPaused && habit.days.includes(new Date().getDay()),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [habits]);

  const todayStatusCounts = useMemo(() => {
    const counts = {
      completed: 0,
      due: 0,
      upcoming: 0,
    };

    todayHabits.forEach((habit) => {
      const status = getHabitStatus(habit, today, completions);

      if (status === "completed") {
        counts.completed += 1;
      } else if (status === "due") {
        counts.due += 1;
      } else if (status === "upcoming") {
        counts.upcoming += 1;
      }
    });

    return counts;
  }, [todayHabits, today, completions]);

  const done = completedIds.filter((id) =>
    todayHabits.some((habit) => habit.id === id),
  ).length;

  const percent = todayHabits.length
    ? Math.round((done / todayHabits.length) * 100)
    : 0;

  const progress = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: percent,
      useNativeDriver: false,
      damping: 18,
      stiffness: 90,
    }).start();
  }, [percent, progress]);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const handleToggle = async (habitId: string) => {
    const isCurrentlyDone = completedIds.includes(habitId);

    try {
      if (isCurrentlyDone) {
        await Haptics.selectionAsync();

        // Unchecking never awards XP or opens a celebration.
        toggleCompletion(habitId, today);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics may be unavailable on some devices.
    }

    // Capture progress before completing the habit.
    const before = getGamificationStats(habits, completions, today);

    // Save the completion.
    toggleCompletion(habitId, today);

    // Zustand updates synchronously, so read the updated state.
    const updatedState = useDayOneStore.getState();

    const after = getGamificationStats(
      updatedState.habits,
      updatedState.completions,
      today,
    );

    const xpEarned = after.xp - before.xp;

    // Find achievements unlocked by this completion.
    const previousAchievements = new Set(
      before.achievements
        .filter((achievement) => achievement.unlocked)
        .map((achievement) => achievement.id),
    );

    const newlyUnlocked = after.achievements
      .filter(
        (achievement) =>
          achievement.unlocked && !previousAchievements.has(achievement.id),
      )
      .map((achievement) => achievement.title);

    // Only celebrate when actual XP has been earned.
    if (xpEarned > 0) {
      setReward({
        xpEarned,
        levelUp: after.level > before.level,
        newLevel: after.level,
        achievementTitles: newlyUnlocked,
      });
    }
  };

  const greeting =
    percent === 100
      ? "You showed up for yourself today."
      : percent >= 50
        ? "You have momentum. Keep it going."
        : "One small win can change your whole day.";

  const styles = makeStyles(theme);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.page,
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.topRow}>
          <View>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/images/adaptive-icon.png")}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="DAY ONE logo"
              />

              <Text style={styles.brand}>DAY ONE</Text>
            </View>
            <Text style={styles.date}>{todayLabel}</Text>
          </View>

          <Pressable style={styles.avatar} accessibilityLabel="Profile">
            <Ionicons name="person-outline" size={19} color={theme.text} />
          </Pressable>
        </View>

        <LinearGradient
          colors={["#7041F2", "#925DF8", "#B36AF0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTop}>
            <View style={styles.heroTag}>
              <View style={styles.liveDot} />
              <Text style={styles.heroTagText}>YOUR DAILY MOMENTUM</Text>
            </View>

            <View style={styles.streakPill}>
              <Ionicons name="flame" size={15} color="#FFD66B" />
              <Text style={styles.streakText}>Keep it alive</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Make today{"\n"}count.</Text>

          <Text style={styles.heroSub}>{greeting}</Text>

          <View style={styles.progressInfo}>
            <View>
              <Text style={styles.progressNumber}>
                {percent}
                <Text style={styles.percentSign}>%</Text>
              </Text>
              <Text style={styles.progressLabel}>DAILY COMPLETION</Text>
            </View>

            <View style={styles.progressCount}>
              <Text style={styles.progressCountNumber}>
                {done}/{todayHabits.length}
              </Text>
              <Text style={styles.progressCountLabel}>commitments</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroBottomText}>
              {percent === 100
                ? "All done. You kept your word!"
                : `${todayHabits.length - done} more ${
                    todayHabits.length - done === 1 ? "win" : "wins"
                  } waiting for you`}
            </Text>

            <Ionicons name="arrow-forward-circle" size={23} color="#FFFFFF" />
          </View>
        </LinearGradient>

        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <View
              style={[styles.quickStatIcon, { backgroundColor: "#FFF0E9" }]}
            >
              <Ionicons name="checkmark-done" size={18} color="#F27B69" />
            </View>

            <View>
              <Text style={styles.quickStatValue}>{done}</Text>
              <Text style={styles.quickStatLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.quickStatCard}>
            <View
              style={[styles.quickStatIcon, { backgroundColor: "#EDE7FF" }]}
            >
              <Ionicons name="time" size={18} color="#7547F5" />
            </View>

            <View>
              <Text style={styles.quickStatValue}>
                {todayHabits.length - done}
              </Text>
              <Text style={styles.quickStatLabel}>To go</Text>
            </View>
          </View>

          <View style={styles.quickStatCard}>
            <View
              style={[styles.quickStatIcon, { backgroundColor: "#E4F7EF" }]}
            >
              <Ionicons name="trophy" size={18} color="#20A98B" />
            </View>

            <View>
              <Text style={styles.quickStatValue}>
                {percent === 100 ? "100" : `${percent}`}
              </Text>
              <Text style={styles.quickStatLabel}>Daily score</Text>
            </View>
          </View>
        </View>

        <View style={styles.accountabilityCard}>
          <View style={styles.accountabilityHeader}>
            <View style={styles.accountabilityTitleRow}>
              <View style={styles.accountabilityIcon}>
                <Ionicons name="shield-checkmark" size={19} color="#7547F5" />
              </View>

              <View>
                <Text style={styles.accountabilityTitle}>
                  Daily accountability
                </Text>
                <Text style={styles.accountabilitySubtitle}>
                  Stay aware. Keep showing up.
                </Text>
              </View>
            </View>

            <Ionicons
              name="ellipsis-horizontal"
              size={19}
              color={theme.muted}
            />
          </View>

          <View style={styles.accountabilityStats}>
            <View style={styles.accountabilityStat}>
              <Text style={[styles.accountabilityNumber, { color: "#20A98B" }]}>
                {todayStatusCounts.completed}
              </Text>
              <Text style={styles.accountabilityLabel}>Completed</Text>
            </View>

            <View style={styles.accountabilityDivider} />

            <View style={styles.accountabilityStat}>
              <Text style={[styles.accountabilityNumber, { color: "#F27B69" }]}>
                {todayStatusCounts.due}
              </Text>
              <Text style={styles.accountabilityLabel}>Due now</Text>
            </View>

            <View style={styles.accountabilityDivider} />

            <View style={styles.accountabilityStat}>
              <Text style={[styles.accountabilityNumber, { color: "#7547F5" }]}>
                {todayStatusCounts.upcoming}
              </Text>
              <Text style={styles.accountabilityLabel}>Upcoming</Text>
            </View>
          </View>

          <View style={styles.accountabilityMessage}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={theme.accent}
            />

            <Text style={styles.accountabilityMessageText}>
              {todayStatusCounts.due > 0
                ? `You have ${todayStatusCounts.due} habit${
                    todayStatusCounts.due === 1 ? "" : "s"
                  } waiting for you. Take the next small step.`
                : todayStatusCounts.upcoming > 0
                  ? "You're on track. Your next commitments are coming up."
                  : todayHabits.length > 0
                    ? "You've handled today's commitments. Excellent work!"
                    : "Add a habit to start building your daily momentum."}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Your commitments</Text>
            <Text style={styles.sectionSubtitle}>
              Little by little, day by day.
            </Text>
          </View>

          <View style={styles.todayPill}>
            <Text style={styles.todayPillText}>TODAY</Text>
          </View>
        </View>

        {todayHabits.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sunny" size={25} color="#7547F5" />
            </View>

            <Text style={styles.emptyTitle}>A fresh page.</Text>

            <Text style={styles.emptyText}>
              No active habits scheduled for today. Enjoy the space or plan your
              next commitment.
            </Text>
          </View>
        ) : (
          todayHabits.map((habit) => {
            const complete = completedIds.includes(habit.id);
            const look = habitLooks[habit.category ?? "Other"];
            const status = getHabitStatus(habit, today, completions);

            const statusColor =
              status === "completed"
                ? "#20A98B"
                : status === "due"
                  ? "#F27B69"
                  : "#7547F5";

            const statusBackground =
              status === "completed"
                ? "#E4F7EF"
                : status === "due"
                  ? "#FFF0E9"
                  : "#EDE7FF";

            const statusLabel =
              status === "completed"
                ? "COMPLETED"
                : status === "due"
                  ? "DUE NOW"
                  : "UPCOMING";

            return (
              <Pressable
                key={habit.id}
                onPress={() => handleToggle(habit.id)}
                style={({ pressed }) => [
                  styles.habitCard,
                  complete && styles.habitCardDone,
                  pressed && styles.habitPressed,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: complete }}
              >
                <View
                  style={[styles.habitIcon, { backgroundColor: look.soft }]}
                >
                  <Ionicons name={look.icon} size={21} color={look.color} />
                </View>

                <View style={styles.habitMain}>
                  <View style={styles.habitCategoryRow}>
                    <Text style={styles.habitCategory}>{look.label}</Text>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusBackground },
                      ]}
                    >
                      <Text
                        style={[styles.statusBadgeText, { color: statusColor }]}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.habitTitle,
                      complete && styles.habitTitleDone,
                    ]}
                  >
                    {habit.title}
                  </Text>

                  <View style={styles.habitMetaRow}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={theme.muted}
                    />

                    <Text style={styles.habitMeta}>{habit.time}</Text>

                    <View style={styles.metaDot} />

                    <Text style={styles.habitMeta}>
                      {habit.targetMinutes} min goal
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.checkCircle,
                    complete && {
                      backgroundColor: look.color,
                      borderColor: look.color,
                    },
                  ]}
                >
                  {complete ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color={theme.muted}
                    />
                  )}
                </View>
              </Pressable>
            );
          })
        )}

        <View style={styles.promiseCard}>
          <LinearGradient
            colors={
              theme.background === "#141020"
                ? ["#2A2140", "#302044"]
                : ["#FFF0E9", "#F2ECFF"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promiseGradient}
          >
            <View style={styles.promiseIcon}>
              <Ionicons name="sparkles" size={19} color="#F0A63B" />
            </View>

            <View style={styles.promiseCopy}>
              <Text style={styles.promiseTitle}>
                Your only competition is yesterday.
              </Text>

              <Text style={styles.promiseText}>
                Missed a plan? Adjust it, show up again, and keep moving.
              </Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.footer}>SHOW UP FOR THE LIFE YOU WANT ✦</Text>
      </Animated.View>

      <RewardCelebration
        visible={!!reward}
        xpEarned={reward?.xpEarned ?? 0}
        levelUp={reward?.levelUp ?? false}
        newLevel={reward?.newLevel ?? 1}
        achievementTitles={reward?.achievementTitles ?? []}
        onClose={() => setReward(null)}
      />
    </ScrollView>
  );
}

function makeStyles(t: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    content: { paddingBottom: 28 },
    page: {
      paddingHorizontal: 20,
      paddingTop: 18,
      gap: 19,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 1,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    brandLogo: {
      width: 60,
      height: 60,
    },
    brand: {
      color: t.text,
      fontSize: 17,
      fontWeight: "900",
      letterSpacing: 2.1,
    },
    date: {
      color: t.muted,
      fontSize: 12,
      marginTop: 5,
      fontWeight: "500",
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: "center",
      justifyContent: "center",
    },
    hero: {
      borderRadius: 27,
      padding: 21,
      overflow: "hidden",
      minHeight: 268,
    },
    heroGlowOne: {
      position: "absolute",
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: "#FFFFFF",
      opacity: 0.08,
      right: -75,
      top: -85,
    },
    heroGlowTwo: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#FFB8E8",
      opacity: 0.13,
      right: 45,
      bottom: -85,
    },
    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    heroTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#8EF0C5",
    },
    heroTagText: {
      color: "#EDE5FF",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.35,
    },
    streakPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FFFFFF24",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    streakText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    heroTitle: {
      color: "#FFFFFF",
      fontSize: 34,
      lineHeight: 37,
      fontWeight: "900",
      letterSpacing: -1.2,
      marginTop: 19,
    },
    heroSub: {
      color: "#F0E9FF",
      fontSize: 12,
      marginTop: 7,
    },
    progressInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 20,
    },
    progressNumber: {
      color: "#FFFFFF",
      fontSize: 38,
      fontWeight: "900",
      letterSpacing: -1.5,
    },
    percentSign: { fontSize: 23 },
    progressLabel: {
      color: "#E9DEFF",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.2,
      marginTop: -2,
    },
    progressCount: {
      alignItems: "flex-end",
      paddingBottom: 4,
    },
    progressCountNumber: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },
    progressCountLabel: {
      color: "#E9DEFF",
      fontSize: 10,
      marginTop: 2,
    },
    progressTrack: {
      height: 8,
      borderRadius: 10,
      backgroundColor: "#FFFFFF35",
      overflow: "hidden",
      marginTop: 12,
    },
    progressFill: {
      height: "100%",
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
    },
    heroBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
    },
    heroBottomText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    quickStats: {
      flexDirection: "row",
      gap: 9,
    },
    quickStatCard: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: t.border,
      padding: 11,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    quickStatIcon: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    quickStatValue: {
      color: t.text,
      fontSize: 15,
      fontWeight: "900",
    },
    quickStatLabel: {
      color: t.muted,
      fontSize: 9,
      marginTop: 1,
    },
    accountabilityCard: {
      backgroundColor: t.card,
      borderRadius: 21,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 16,
    },
    accountabilityHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    accountabilityTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    accountabilityIcon: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor: t.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    accountabilityTitle: {
      color: t.text,
      fontSize: 13,
      fontWeight: "900",
    },
    accountabilitySubtitle: {
      color: t.muted,
      fontSize: 10,
      marginTop: 3,
    },
    accountabilityStats: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingVertical: 5,
    },
    accountabilityStat: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    accountabilityNumber: {
      fontSize: 25,
      fontWeight: "900",
    },
    accountabilityLabel: {
      color: t.muted,
      fontSize: 10,
      fontWeight: "600",
    },
    accountabilityDivider: {
      width: 1,
      height: 34,
      backgroundColor: t.border,
    },
    accountabilityMessage: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: t.accentSoft,
      padding: 10,
      borderRadius: 11,
    },
    accountabilityMessageText: {
      flex: 1,
      color: t.text,
      fontSize: 10,
      lineHeight: 15,
    },
    habitCategoryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 7,
    },
    statusBadgeText: {
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 1,
    },
    sectionTitle: {
      color: t.text,
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: -0.4,
    },
    sectionSubtitle: {
      color: t.muted,
      fontSize: 11,
      marginTop: 4,
    },
    todayPill: {
      backgroundColor: t.accentSoft,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 20,
    },
    todayPillText: {
      color: t.accent,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
    },
    habitCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 13,
      backgroundColor: t.card,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: t.border,
      minHeight: 79,
    },
    habitCardDone: {
      borderColor: "#20A98B80",
      backgroundColor: t.card,
    },
    habitPressed: {
      transform: [{ scale: 0.985 }],
      opacity: 0.9,
    },
    habitIcon: {
      width: 47,
      height: 47,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    habitMain: { flex: 1 },
    habitCategory: {
      color: t.muted,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.1,
      marginBottom: 3,
    },
    habitTitle: {
      color: t.text,
      fontSize: 13,
      fontWeight: "800",
    },
    habitTitleDone: {
      color: t.muted,
      textDecorationLine: "line-through",
    },
    habitMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 6,
    },
    habitMeta: {
      color: t.muted,
      fontSize: 10,
    },
    metaDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: t.muted,
      marginHorizontal: 1,
    },
    checkCircle: {
      width: 29,
      height: 29,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: t.border,
      alignItems: "center",
      justifyContent: "center",
    },
    promiseCard: {
      borderRadius: 18,
      overflow: "hidden",
      marginTop: 1,
    },
    promiseGradient: {
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    promiseIcon: {
      width: 37,
      height: 37,
      borderRadius: 13,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    promiseCopy: { flex: 1 },
    promiseTitle: {
      color: t.text,
      fontSize: 12,
      fontWeight: "900",
      marginBottom: 4,
    },
    promiseText: {
      color: t.muted,
      fontSize: 10,
      lineHeight: 15,
    },
    empty: {
      backgroundColor: t.card,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      gap: 7,
      borderWidth: 1,
      borderColor: t.border,
    },
    emptyIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      backgroundColor: "#F0EAFE",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 3,
    },
    emptyTitle: {
      color: t.text,
      fontSize: 16,
      fontWeight: "900",
    },
    emptyText: {
      color: t.muted,
      fontSize: 11,
      textAlign: "center",
    },
    footer: {
      color: t.muted,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.6,
      textAlign: "center",
      marginTop: 2,
      marginBottom: 5,
    },
  });
}
