import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Props = {
  visible: boolean;
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
  achievementTitles: string[];
  onClose: () => void;
};

export function RewardCelebration({
  visible,
  xpEarned,
  levelUp,
  newLevel,
  achievementTitles,
  onClose,
}: Props) {
  const scale = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const xpTranslate = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.75);
    opacity.setValue(0);
    xpTranslate.setValue(15);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(xpTranslate, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    if (levelUp || achievementTitles.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [visible, levelUp, achievementTitles.length, scale, opacity, xpTranslate]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name={levelUp ? "trophy" : "checkmark-done"}
              size={35}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.eyebrow}>
            {levelUp ? "LEVEL UP!" : "COMMITMENT COMPLETE"}
          </Text>

          <Text style={styles.title}>
            {levelUp ? `Level ${newLevel}` : "You showed up!"}
          </Text>

          <Text style={styles.description}>
            Every small action is a vote for the person you're becoming.
          </Text>

          <Animated.View
            style={[
              styles.xpPill,
              { transform: [{ translateY: xpTranslate }] },
            ]}
          >
            <Ionicons name="flash" size={18} color="#E9A83B" />
            <Text style={styles.xpText}>+{xpEarned} XP</Text>
          </Animated.View>

          {levelUp && (
            <View style={styles.rewardRow}>
              <Ionicons name="star" size={17} color="#E9A83B" />
              <Text style={styles.rewardText}>
                You've reached level {newLevel}!
              </Text>
            </View>
          )}

          {achievementTitles.length > 0 && (
            <View style={styles.achievementSection}>
              <Text style={styles.achievementHeading}>
                ACHIEVEMENT UNLOCKED
              </Text>

              {achievementTitles.map((title) => (
                <View key={title} style={styles.rewardRow}>
                  <Ionicons name="medal" size={18} color="#E9A83B" />
                  <Text style={styles.rewardText}>{title}</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Keep going</Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(12, 9, 25, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 25,
    alignItems: "center",
    gap: 13,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: "#7547F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  eyebrow: {
    color: "#7547F5",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: "#211A35",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: "#817B91",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5D9",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 5,
  },
  xpText: {
    color: "#A36C00",
    fontSize: 19,
    fontWeight: "900",
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rewardText: {
    color: "#403653",
    fontSize: 12,
    fontWeight: "800",
  },
  achievementSection: {
    width: "100%",
    gap: 10,
    alignItems: "center",
    paddingTop: 8,
  },
  achievementHeading: {
    color: "#A36C00",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  button: {
    width: "100%",
    backgroundColor: "#7547F5",
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
