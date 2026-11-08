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
import { Link } from "expo-router";
import * as ExpoLinking from "expo-linking";

import { useTheme } from "@/src/theme";
import { supabase } from "@/src/lib/supabase";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Email required", "Enter your account email address.");
      return;
    }

    try {
      setLoading(true);

      // Generates the correct URL for Expo Go or a development build.
      const redirectUrl = ExpoLinking.createURL("reset-password");

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      Alert.alert(
        "Check your email",
        "We've sent a password reset link if an account exists for this email. Open the link on the device where DAY ONE is running.",
      );
    } catch (error) {
      Alert.alert(
        "Unable to send email",
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
        />

        <Text style={styles.title}>Forgot your password?</Text>

        <Text style={styles.subtitle}>
          It happens. Enter the email associated with your account and we'll
          send you a link to reset your password.
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

          <Pressable
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleResetRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Send reset link</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/login" style={styles.link}>
            Back to login
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
    title: {
      color: theme.text,
      fontSize: 29,
      fontWeight: "900",
      letterSpacing: -1,
    },
    subtitle: {
      color: theme.muted,
      fontSize: 13,
      lineHeight: 21,
      marginTop: 10,
      marginBottom: 28,
    },
    form: {
      gap: 12,
    },
    label: {
      color: theme.text,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
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
    button: {
      height: 54,
      backgroundColor: "#7547F5",
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },
    footer: {
      alignItems: "center",
      marginTop: 27,
    },
    link: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
