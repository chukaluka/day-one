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
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const styles = makeStyles(theme);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Login failed",
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

        <Text style={styles.title}>Welcome back.</Text>
        <Text style={styles.subtitle}>
          Your next chapter starts with showing up.
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

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>PASSWORD</Text>
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password")}
              hitSlop={8}
            >
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </Pressable>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={theme.muted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((previous) => !previous)}
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color={theme.muted}
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Log in</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to DAY ONE? </Text>
          <Link href="/(auth)/signup" style={styles.link}>
            Create an account
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
    brand: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 3,
      marginBottom: 28,
    },
    title: {
      color: theme.text,
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -1,
    },
    subtitle: {
      color: theme.muted,
      fontSize: 13,
      marginTop: 8,
      marginBottom: 32,
    },
    form: {
      gap: 11,
    },
    label: {
      color: theme.text,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      marginTop: 9,
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
    passwordLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 9,
    },
    forgotPassword: {
      color: theme.accent,
      fontSize: 11,
      fontWeight: "700",
    },
    passwordContainer: {
      height: 53,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      paddingLeft: 15,
      flexDirection: "row",
      alignItems: "center",
    },
    passwordInput: {
      flex: 1,
      height: "100%",
      color: theme.text,
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
      marginTop: 27,
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
