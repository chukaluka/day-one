import { useEffect, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLinking from "expo-linking";

import { useTheme } from "@/src/theme";
import { supabase } from "@/src/lib/supabase";

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const processedLinks = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;

    const verifyRecoveryLink = async (url: string) => {
      if (processedLinks.current.has(url)) return;

      processedLinks.current.add(url);

      try {
        const parsedUrl = new URL(url);

        const code = parsedUrl.searchParams.get("code");

        const hashParams = new URLSearchParams(
          parsedUrl.hash.replace(/^#/, ""),
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
        } else {
          throw new Error(
            "The reset link does not contain valid recovery information. Request a new one.",
          );
        }

        if (mounted) {
          setVerified(true);
          setVerificationError("");
        }
      } catch (error) {
        processedLinks.current.delete(url);

        if (mounted) {
          setVerificationError(
            error instanceof Error
              ? error.message
              : "This reset link may have expired. Request a new one.",
          );
        }
      } finally {
        if (mounted) setVerifying(false);
      }
    };

    const handleIncomingUrl = (url: string) => {
      verifyRecoveryLink(url);
    };

    const initialize = async () => {
      const initialUrl = await ExpoLinking.getInitialURL();

      if (initialUrl) {
        await verifyRecoveryLink(initialUrl);
      } else if (mounted) {
        setVerifying(false);
        setVerificationError(
          "No password reset link was received. Open the reset link from your email again.",
        );
      }
    };

    initialize();

    const subscription = ExpoLinking.addEventListener("url", ({ url }) => {
      handleIncomingUrl(url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert("Weak password", "Use at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "Your passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert(
        "Password updated",
        "Your password has been changed successfully.",
        [
          {
            text: "Go to login",
            onPress: async () => {
              await supabase.auth.signOut({ scope: "local" });
              router.replace("/(auth)/login");
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Unable to update password",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (verifying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.subtitle}>Verifying your reset link...</Text>
      </View>
    );
  }

  if (!verified) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Reset link unavailable</Text>

        <Text style={styles.subtitle}>
          {verificationError ||
            "This link may have expired or already been used."}
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.replace("/(auth)/forgot-password")}
        >
          <Text style={styles.buttonText}>Request another link</Text>
        </Pressable>
      </View>
    );
  }

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
        />

        <Text style={styles.brand}>DAY ONE</Text>
        <Text style={styles.title}>Create a new password.</Text>

        <Text style={styles.subtitle}>
          Choose a new password for your DAY ONE account.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>NEW PASSWORD</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="At least 8 characters"
              placeholderTextColor={theme.muted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((previous) => !previous)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color={theme.muted}
              />
            </Pressable>
          </View>

          <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your new password again"
              placeholderTextColor={theme.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((previous) => !previous)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color={theme.muted}
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, saving && { opacity: 0.7 }]}
            onPress={handleUpdatePassword}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Update password</Text>
            )}
          </Pressable>
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
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      padding: 25,
      gap: 16,
    },
    logo: {
      width: 65,
      height: 65,
      marginBottom: 15,
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
      fontSize: 29,
      fontWeight: "900",
      letterSpacing: -1,
      textAlign: "center",
    },
    subtitle: {
      color: theme.muted,
      fontSize: 13,
      lineHeight: 21,
      marginTop: 9,
      marginBottom: 27,
      textAlign: "center",
    },
    form: {
      gap: 12,
    },
    label: {
      color: theme.text,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      marginTop: 8,
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
      paddingHorizontal: 20,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },
  });
}
