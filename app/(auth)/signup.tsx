import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Image } from "react-native";

export default function SignupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const styles = makeStyles(theme);

  const handleSignup = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak password", "Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);

      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Check your email",
          "Your account has been created. Verify your email before logging in.",
          [
            {
              text: "Go to login",
              onPress: () => router.replace("/(auth)/login"),
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert(
        "Sign up failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/adaptive-icon.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="DAY ONE logo"
        />

        <Text style={styles.title}>Start with day one.</Text>
        <Text style={styles.subtitle}>
          Build better habits, one commitment at a time.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="At least 8 characters"
              placeholderTextColor={theme.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((previous) => !previous)}
              hitSlop={10}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color={theme.muted}
              />
            </Pressable>
          </View>

          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password again"
              placeholderTextColor={theme.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((previous) => !previous)}
              hitSlop={10}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color={theme.muted}
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Log in
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      padding: 25,
    },
    content: {
      width: "100%",
      maxWidth: 440,
      alignSelf: "center",
    },
    logo: {
      width: 100,
      height: 100,
    },
    logoText: {
      color: "#FFFFFF",
      fontSize: 32,
      fontWeight: "900",
    },
    brand: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 3,
      marginBottom: 28,
    },
    title: {
      color: theme.text,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: -1,
    },
    subtitle: {
      color: theme.muted,
      fontSize: 13,
      marginTop: 8,
      marginBottom: 27,
    },
    form: {
      gap: 11,
    },
    label: {
      color: theme.text,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      marginTop: 7,
    },
    input: {
      height: 53,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      color: theme.text,
      paddingHorizontal: 15,
      fontSize: 14,
    },
    passwordContainer: {
      height: 53,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    passwordInput: {
      flex: 1,
      height: "100%",
      color: theme.text,
      paddingHorizontal: 15,
      fontSize: 14,
    },
    eyeButton: {
      height: "100%",
      width: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    button: {
      height: 54,
      backgroundColor: "#7547F5",
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 17,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 25,
    },
    footerText: {
      color: theme.muted,
      fontSize: 12,
    },
    link: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "800",
    },
  });
}
