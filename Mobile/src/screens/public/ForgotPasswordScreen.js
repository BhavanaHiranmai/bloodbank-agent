import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { useAppContext, useForm } from "../../context/AppContext";
import { theme } from "../../styles/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function ForgotPasswordScreen() {
  const ctx = useAppContext();
  const [step, setStep] = useState("email");
  const [form, setField] = useForm({ email: "", token: "", newPassword: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (step === "email" && !form.email) {
      Alert.alert("Missing details", "Please enter your email address.");
      return;
    }
    if (step === "reset" && (!form.token || !form.newPassword)) {
      Alert.alert("Missing details", "Please enter both the reset code and your new password.");
      return;
    }
    try {
      setSubmitting(true);
      if (step === "email") {
        await ctx.api("/auth/forgot-password", {
          method: "POST",
          body: { email: form.email },
        });
        setStep("reset");
        Alert.alert("Reset code sent", "Check your email inbox.");
      } else {
        await ctx.api("/auth/reset-password", {
          method: "POST",
          body: { token: form.token, newPassword: form.newPassword },
        });
        Alert.alert("Password reset", "Your password has been successfully reset. You can log in now.");
        ctx.setRoute("login");
      }
    } catch (err) {
      Alert.alert("Reset failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="water" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.brand}>BloodLink</Text>
          <Text style={styles.subtitle}>Reset your credentials safely and securely</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reset Password</Text>

          {step === "email" ? (
            <Input
              label="Email Address"
              value={form.email}
              onChangeText={(v) => setField("email", v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          ) : null}

          {step === "reset" ? (
            <>
              <Input
                label="Reset Code"
                value={form.token}
                onChangeText={(v) => setField("token", v)}
              />
              <Input
                label="New Password"
                value={form.newPassword}
                onChangeText={(v) => setField("newPassword", v)}
                secureTextEntry
              />
            </>
          ) : null}

          <Button
            label={step === "email" ? "Send Reset Code" : "Update Password"}
            onPress={submit}
            loading={submitting}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password?</Text>
          <Pressable onPress={() => ctx.setRoute("login")}>
            <Text style={styles.footerLink}> Log In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  brand: {
    ...theme.type.h1,
    color: theme.colors.primary,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textSub,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 24,
    elevation: 5,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  cardTitle: {
    ...theme.type.h2,
    color: theme.colors.text,
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textSub,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.primary,
  },
});

export default ForgotPasswordScreen;
