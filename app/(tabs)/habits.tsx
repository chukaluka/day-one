import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import type {
  Habit,
  HabitCategory,
  HabitPriority,
} from "@/src/store/useDayOneStore";
import { useDayOneStore } from "@/src/store/useDayOneStore";
import { useTheme } from "@/src/theme";
import {
  requestNotificationPermissions,
  syncHabitReminders,
} from "@/src/services/notifications";

const weekdays = [
  { label: "M", day: 1, full: "Monday" },
  { label: "T", day: 2, full: "Tuesday" },
  { label: "W", day: 3, full: "Wednesday" },
  { label: "T", day: 4, full: "Thursday" },
  { label: "F", day: 5, full: "Friday" },
  { label: "S", day: 6, full: "Saturday" },
  { label: "S", day: 0, full: "Sunday" },
];

const categories: HabitCategory[] = [
  "Personal",
  "Learning",
  "Health",
  "Work",
  "Fitness",
  "Other",
];

const priorities: HabitPriority[] = ["Low", "Medium", "High"];

const categoryIcons: Record<HabitCategory, keyof typeof Ionicons.glyphMap> = {
  Personal: "person-outline",
  Learning: "book-outline",
  Health: "heart-outline",
  Work: "briefcase-outline",
  Fitness: "barbell-outline",
  Other: "sparkles-outline",
};

const getScheduleLabel = (days: number[]) => {
  if (days.length === 7) return "Every day";

  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) {
    return "Weekdays";
  }

  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return "Weekends";
  }

  return weekdays
    .filter((item) => days.includes(item.day))
    .map((item) => item.full.slice(0, 3))
    .join(", ");
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getTimeDate = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date;
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
};

export default function HabitsScreen() {
  const t = useTheme();

  const habits = useDayOneStore((s) => s.habits);
  const addHabit = useDayOneStore((s) => s.addHabit);
  const updateHabit = useDayOneStore((s) => s.updateHabit);
  const deleteHabit = useDayOneStore((s) => s.deleteHabit);
  const toggleHabitPaused = useDayOneStore((s) => s.toggleHabitPaused);

  const [visible, setVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [target, setTarget] = useState(30);
  const [minimum, setMinimum] = useState(10);
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [category, setCategory] = useState<HabitCategory>("Personal");
  const [priority, setPriority] = useState<HabitPriority>("Medium");

  const [showTimePicker, setShowTimePicker] = useState(false);

  const styles = makeStyles(t);

  const activeHabits = habits.filter((habit) => !habit.isPaused);
  const pausedHabits = habits.filter((habit) => habit.isPaused);

  const resetForm = () => {
    setEditingHabit(null);
    setTitle("");
    setTime("08:00");
    setTarget(30);
    setMinimum(10);
    setDays([0, 1, 2, 3, 4, 5, 6]);
    setCategory("Personal");
    setPriority("Medium");
    setShowTimePicker(false);
  };

  const openCreateModal = () => {
    resetForm();
    setVisible(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setTime(habit.time);
    setTarget(habit.targetMinutes);
    setMinimum(habit.minimumMinutes);
    setDays(habit.days);
    setCategory(habit.category ?? "Personal");
    setPriority(habit.priority ?? "Medium");
    setShowTimePicker(false);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setShowTimePicker(false);
  };

  const toggleDay = (day: number) => {
    setDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  };

  const changeTarget = (amount: number) => {
    const nextTarget = Math.min(1440, Math.max(5, target + amount));

    setTarget(nextTarget);
    setMinimum((current) => Math.min(current, nextTarget));
  };

  const changeMinimum = (amount: number) => {
    setMinimum((current) => Math.min(target, Math.max(5, current + amount)));
  };

  const handlePause = (habit: Habit) => {
    if (habit.isPaused) {
      toggleHabitPaused(habit.id);
      return;
    }

    Alert.alert(
      "Pause this habit?",
      "Pausing temporarily removes this habit from your active commitments and stops its reminders. Your existing completion history will be kept. You can resume it whenever you're ready.",
      [
        {
          text: "Keep active",
          style: "cancel",
        },
        {
          text: "Pause habit",
          onPress: () => toggleHabitPaused(habit.id),
        },
      ],
    );
  };

  const save = async () => {
    if (!title.trim()) {
      return Alert.alert("Add a name", "Give this habit a clear name.");
    }

    if (minimum > target || minimum < 5 || target < 5) {
      return Alert.alert(
        "Check the duration",
        "Your minimum duration must be at least 5 minutes and cannot exceed your target.",
      );
    }

    if (days.length === 0) {
      return Alert.alert(
        "Choose your days",
        "Select at least one day for this habit.",
      );
    }

    const habitData = {
      title: title.trim(),
      time,
      targetMinutes: target,
      minimumMinutes: minimum,
      days: [...days].sort((a, b) => a - b),
      category,
      priority,
    };

    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
    } else {
      addHabit(habitData);
    }

    closeModal();
    resetForm();

    try {
      const granted = await requestNotificationPermissions();

      if (granted) {
        await syncHabitReminders(useDayOneStore.getState().habits);
      } else {
        Alert.alert(
          "Reminders are off",
          "Your habit was saved, but notifications are not enabled. You can enable them in your device settings.",
        );
      }
    } catch (error) {
      console.warn("Notification setup failed:", error);

      Alert.alert(
        "Habit saved",
        "Your habit was saved, but we could not set up its reminder.",
      );
    }
  };

  const confirmDelete = (habit: Habit) => {
    Alert.alert(
      "Delete habit?",
      `Are you sure you want to delete "${habit.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHabit(habit.id),
        },
      ],
    );
  };

  const renderDurationPicker = (
    label: string,
    description: string,
    value: number,
    onChange: (amount: number) => void,
    minimumValue: number,
    maximumValue: number,
  ) => (
    <View style={styles.durationContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.fieldDescription}>{description}</Text>

      <View style={styles.durationPicker}>
        <Pressable
          disabled={value <= minimumValue}
          onPress={() => onChange(-5)}
          style={[
            styles.durationButton,
            value <= minimumValue && styles.disabledButton,
          ]}
        >
          <Ionicons name="remove" size={20} color={t.accent} />
        </Pressable>

        <View style={styles.durationValueContainer}>
          <Text style={styles.durationValue}>{formatDuration(value)}</Text>
          <Text style={styles.durationCaption}>5-minute increments</Text>
        </View>

        <Pressable
          disabled={value >= maximumValue}
          onPress={() => onChange(5)}
          style={[
            styles.durationButton,
            value >= maximumValue && styles.disabledButton,
          ]}
        >
          <Ionicons name="add" size={20} color={t.accent} />
        </Pressable>
      </View>
    </View>
  );

  const renderHabit = (habit: Habit) => (
    <View
      key={habit.id}
      style={[styles.card, habit.isPaused && styles.pausedCard]}
    >
      <View style={styles.cardTop}>
        <View style={styles.icon}>
          <Ionicons
            name={categoryIcons[habit.category ?? "Personal"]}
            color={t.accent}
            size={20}
          />
        </View>

        <View style={styles.habitInfo}>
          <Text style={styles.habit}>{habit.title}</Text>
          <Text style={styles.meta}>Reminder: {formatTime(habit.time)}</Text>
          <Text style={styles.meta}>
            Target: {formatDuration(habit.targetMinutes)} · Minimum:{" "}
            {formatDuration(habit.minimumMinutes)}
          </Text>
          <Text style={styles.meta}>{getScheduleLabel(habit.days)}</Text>
        </View>

        <Pressable
          onPress={() => openEditModal(habit)}
          hitSlop={10}
          style={styles.iconButton}
        >
          <Ionicons name="create-outline" size={20} color={t.muted} />
        </Pressable>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{habit.category ?? "Personal"}</Text>
        </View>

        <View
          style={[styles.tag, habit.priority === "High" && styles.highPriority]}
        >
          <Text
            style={[
              styles.tagText,
              habit.priority === "High" && styles.highPriorityText,
            ]}
          >
            {habit.priority ?? "Medium"} priority
          </Text>
        </View>

        {habit.isPaused && (
          <View style={styles.pausedTag}>
            <Text style={styles.pausedTagText}>Paused</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => handlePause(habit)}
        >
          <Ionicons
            name={habit.isPaused ? "play-outline" : "pause-outline"}
            color={t.accent}
            size={16}
          />
          <Text style={styles.actionText}>
            {habit.isPaused ? "Resume" : "Pause"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => confirmDelete(habit)}
        >
          <Ionicons name="trash-outline" color="#EF6461" size={16} />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>BUILD YOUR ROUTINE</Text>
        <Text style={styles.title}>Your habits</Text>
        <Text style={styles.subtitle}>
          Make each commitment specific, scheduled and achievable.
        </Text>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryNumber}>{activeHabits.length}</Text>
            <Text style={styles.summaryLabel}>Active habits</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryNumber}>{pausedHabits.length}</Text>
            <Text style={styles.summaryLabel}>Paused habits</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryNumber}>{habits.length}</Text>
            <Text style={styles.summaryLabel}>Total habits</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active commitments</Text>
          <Text style={styles.sectionCount}>{activeHabits.length}</Text>
        </View>

        {activeHabits.length > 0 ? (
          activeHabits.map(renderHabit)
        ) : (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" color={t.muted} size={28} />
            <Text style={styles.emptyTitle}>No active habits yet</Text>
            <Text style={styles.emptyText}>
              Add a habit to start building your routine.
            </Text>
          </View>
        )}

        {pausedHabits.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Paused habits</Text>
              <Text style={styles.sectionCount}>{pausedHabits.length}</Text>
            </View>

            {pausedHabits.map(renderHabit)}
          </>
        )}
      </ScrollView>

      <Pressable onPress={openCreateModal} style={styles.addButton}>
        <Ionicons name="add" color="#FFFFFF" size={21} />
        <Text style={styles.addText}>Add a habit</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  {editingHabit ? "Edit commitment" : "New commitment"}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Small steps. Consistent progress.
                </Text>
              </View>

              <Pressable onPress={closeModal} hitSlop={10}>
                <Ionicons name="close" size={24} color={t.text} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              <Text style={styles.label}>HABIT NAME</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Study Python"
                placeholderTextColor={t.muted}
                style={styles.input}
              />

              <Text style={styles.label}>REMINDER TIME</Text>
              <Text style={styles.fieldDescription}>
                When should DAY ONE remind you to start this habit?
              </Text>

              <Pressable
                onPress={() => setShowTimePicker((current) => !current)}
                style={styles.timeButton}
              >
                <View style={styles.timeButtonLeft}>
                  <Ionicons name="alarm-outline" size={21} color={t.accent} />
                  <Text style={styles.timeButtonText}>{formatTime(time)}</Text>
                </View>

                <Ionicons
                  name={showTimePicker ? "chevron-up" : "chevron-down"}
                  size={19}
                  color={t.muted}
                />
              </Pressable>

              {showTimePicker && (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={getTimeDate(time)}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      if (selectedDate && event.type !== "dismissed") {
                        const hours = String(selectedDate.getHours()).padStart(
                          2,
                          "0",
                        );

                        const minutes = String(
                          selectedDate.getMinutes(),
                        ).padStart(2, "0");

                        setTime(`${hours}:${minutes}`);
                      }

                      if (Platform.OS !== "ios") {
                        setShowTimePicker(false);
                      }
                    }}
                    style={styles.nativeTimePicker}
                  />

                  {Platform.OS === "ios" && (
                    <Pressable
                      onPress={() => setShowTimePicker(false)}
                      style={styles.pickerDone}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {renderDurationPicker(
                "TARGET DURATION",
                "Your ideal time for completing this habit. This is the goal you're working towards.",
                target,
                changeTarget,
                5,
                1440,
              )}

              {renderDurationPicker(
                "MINIMUM DURATION",
                "The smallest amount of effort that counts as completing this habit, even on a busy day.",
                minimum,
                changeMinimum,
                5,
                target,
              )}

              <Text style={styles.label}>SCHEDULE</Text>
              <Text style={styles.fieldDescription}>
                Choose the days you want to work on this habit.
              </Text>

              <View style={styles.daysRow}>
                {weekdays.map((item) => {
                  const selected = days.includes(item.day);

                  return (
                    <Pressable
                      key={item.day}
                      onPress={() => toggleDay(item.day)}
                      style={[
                        styles.dayButton,
                        selected && styles.dayButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>CATEGORY</Text>
              <View style={styles.optionsWrap}>
                {categories.map((item) => {
                  const selected = category === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[styles.option, selected && styles.optionSelected]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>PRIORITY</Text>
              <View style={styles.priorityRow}>
                {priorities.map((item) => {
                  const selected = priority === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setPriority(item)}
                      style={[
                        styles.priorityButton,
                        selected && styles.optionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.pauseInfo}>
                <Ionicons
                  name="pause-circle-outline"
                  size={19}
                  color={t.accent}
                />
                <Text style={styles.pauseInfoText}>
                  Need a temporary break? You can pause a habit at any time. It
                  will leave your active commitments and its reminders will
                  stop. Your history stays saved
                </Text>
              </View>

              <Pressable onPress={save} style={styles.save}>
                <Text style={styles.saveText}>
                  {editingHabit ? "Save changes" : "Create habit"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(t: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: t.background,
    },
    content: {
      padding: 20,
      paddingTop: 26,
      gap: 13,
      paddingBottom: 105,
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
      marginBottom: 7,
    },
    summary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 17,
      paddingVertical: 17,
      marginBottom: 9,
    },
    summaryNumber: {
      color: t.text,
      fontSize: 22,
      fontWeight: "800",
      textAlign: "center",
    },
    summaryLabel: {
      color: t.muted,
      fontSize: 10,
      marginTop: 3,
    },
    summaryDivider: {
      width: 1,
      height: 34,
      backgroundColor: t.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 5,
      marginBottom: 2,
    },
    sectionTitle: {
      color: t.text,
      fontSize: 15,
      fontWeight: "800",
    },
    sectionCount: {
      color: t.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    card: {
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 15,
      gap: 12,
    },
    pausedCard: {
      opacity: 0.7,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    icon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: t.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    habitInfo: {
      flex: 1,
    },
    habit: {
      color: t.text,
      fontWeight: "700",
      fontSize: 14,
      marginBottom: 4,
    },
    meta: {
      color: t.muted,
      fontSize: 11,
      marginTop: 3,
    },
    iconButton: {
      padding: 5,
    },
    cardDetails: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    tag: {
      backgroundColor: t.background,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    tagText: {
      color: t.muted,
      fontSize: 10,
      fontWeight: "700",
    },
    highPriority: {
      backgroundColor: "#EF646118",
    },
    highPriorityText: {
      color: "#EF6461",
    },
    pausedTag: {
      backgroundColor: "#E5A33A20",
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    pausedTagText: {
      color: "#D89A32",
      fontSize: 10,
      fontWeight: "700",
    },
    cardActions: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: t.border,
      paddingTop: 10,
      gap: 20,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 3,
    },
    actionText: {
      color: t.accent,
      fontSize: 12,
      fontWeight: "700",
    },
    deleteText: {
      color: "#EF6461",
      fontSize: 12,
      fontWeight: "700",
    },
    empty: {
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
      backgroundColor: t.card,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 16,
      gap: 9,
    },
    emptyTitle: {
      color: t.text,
      fontSize: 14,
      fontWeight: "700",
    },
    emptyText: {
      color: t.muted,
      fontSize: 12,
      textAlign: "center",
    },
    addButton: {
      position: "absolute",
      bottom: 18,
      left: 20,
      right: 20,
      height: 52,
      borderRadius: 16,
      backgroundColor: t.accent,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    addText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 14,
    },
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "#0008",
    },
    sheet: {
      backgroundColor: t.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 25,
      maxHeight: "92%",
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    sheetTitle: {
      color: t.text,
      fontSize: 20,
      fontWeight: "800",
    },
    sheetSubtitle: {
      color: t.muted,
      fontSize: 11,
      marginTop: 3,
    },
    formContent: {
      gap: 10,
      paddingBottom: 8,
    },
    label: {
      color: t.muted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
      marginTop: 7,
    },
    input: {
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 12,
      color: t.text,
      fontSize: 14,
    },
    fieldDescription: {
      color: t.muted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: -5,
      marginBottom: 2,
    },
    timeButton: {
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeButtonLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    timeButtonText: {
      color: t.text,
      fontSize: 16,
      fontWeight: "700",
    },
    timePickerContainer: {
      backgroundColor: t.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      padding: 8,
      alignItems: "center",
    },
    nativeTimePicker: {
      alignSelf: "center",
    },
    pickerDone: {
      alignSelf: "flex-end",
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    pickerDoneText: {
      color: t.accent,
      fontWeight: "800",
    },
    durationContainer: {
      gap: 7,
    },
    durationPicker: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      padding: 9,
    },
    durationButton: {
      width: 39,
      height: 39,
      borderRadius: 11,
      backgroundColor: t.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    disabledButton: {
      opacity: 0.35,
    },
    durationValueContainer: {
      alignItems: "center",
      flex: 1,
    },
    durationValue: {
      color: t.text,
      fontSize: 17,
      fontWeight: "800",
    },
    durationCaption: {
      color: t.muted,
      fontSize: 9,
      marginTop: 3,
    },
    daysRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 5,
    },
    dayButton: {
      width: 37,
      height: 37,
      borderRadius: 12,
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: "center",
      justifyContent: "center",
    },
    dayButtonSelected: {
      backgroundColor: t.accent,
      borderColor: t.accent,
    },
    dayText: {
      color: t.muted,
      fontSize: 12,
      fontWeight: "700",
    },
    dayTextSelected: {
      color: "#FFFFFF",
    },
    optionsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    option: {
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    optionSelected: {
      backgroundColor: t.accentSoft,
      borderColor: t.accent,
    },
    optionText: {
      color: t.muted,
      fontSize: 11,
      fontWeight: "700",
    },
    optionTextSelected: {
      color: t.accent,
    },
    priorityRow: {
      flexDirection: "row",
      gap: 8,
    },
    priorityButton: {
      flex: 1,
      alignItems: "center",
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingVertical: 11,
    },
    pauseInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
      backgroundColor: t.accentSoft,
      borderRadius: 12,
      padding: 12,
      marginTop: 7,
    },
    pauseInfoText: {
      flex: 1,
      color: t.muted,
      fontSize: 11,
      lineHeight: 17,
    },
    save: {
      backgroundColor: t.accent,
      borderRadius: 13,
      padding: 15,
      alignItems: "center",
      marginTop: 4,
    },
    saveText: {
      color: "#FFFFFF",
      fontWeight: "800",
    },
  });
}
