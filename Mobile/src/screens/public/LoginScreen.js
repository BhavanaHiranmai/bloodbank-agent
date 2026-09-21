import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { useAppContext, useForm } from "../../context/AppContext";
import { theme } from "../../styles/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function LoginScreen() {
  const ctx = useAppContext();
  const [form, setField] = useForm({ email: "", password: "" });

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
          <Text style={styles.subtitle}>Save lives by connecting with nearby donors</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>

          <Input
            label="Email Address"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            secureTextEntry
          />

          <View style={styles.forgotRow}>
            <Pressable onPress={() => ctx.setRoute("forgot")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          <Button
            label="Sign In"
            onPress={() => ctx.login(form.email, form.password)}
            style={styles.signInBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => ctx.setRoute("register")}>
            <Text style={styles.footerLink}> Sign Up</Text>
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
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  forgotText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  signInBtn: {
    marginTop: 10,
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

export default LoginScreen;
