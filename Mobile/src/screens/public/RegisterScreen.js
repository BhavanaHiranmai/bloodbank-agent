import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Segment } from "../../components/common/Segment";
import { PickerRow } from "../../components/common/PickerRow";
import { useAppContext, useForm, BLOOD_GROUPS } from "../../context/AppContext";
import { theme } from "../../styles/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function RegisterScreen() {
  const ctx = useAppContext();
  const [form, setField] = useForm({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    otp: "",
    role: "donor",
    bloodGroup: "O+",
    dob: "",
    gender: "male",
    emergencyContact: "",
    age: "",
    city: "",
    hospitalName: "",
    address: "",
    pincode: "",
    licenseNumber: "",
  });

  const [sendingOtp, setSendingOtp] = useState(false);

  const sendOtp = async () => {
    if (!form.email || !form.phoneNumber) {
      Alert.alert("Missing details", "Please enter your email and phone number to request an OTP.");
      return;
    }
    try {
      setSendingOtp(true);
      const data = await ctx.api("/auth/send-otp", {
        method: "POST",
        body: { email: form.email, phoneNumber: form.phoneNumber },
      });
      Alert.alert(
        "OTP sent",
        data.data?.otp
          ? `Development OTP: ${data.data.otp}`
          : "Check your email.",
      );
    } catch (err) {
      Alert.alert("OTP failed", err.message);
    } finally {
      setSendingOtp(false);
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
          <Text style={styles.subtitle}>Join our network and help save lives today</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>

          <Segment
            value={form.role}
            options={["donor", "hospital"]}
            onChange={(v) => setField("role", v)}
          />

          <View style={styles.divider} />

          <Input
            label={form.role === "hospital" ? "Contact First Name" : "First Name"}
            value={form.firstName}
            onChangeText={(v) => setField("firstName", v)}
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChangeText={(v) => setField("lastName", v)}
          />
          <Input
            label="Email Address"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Phone Number"
            value={form.phoneNumber}
            onChangeText={(v) => setField("phoneNumber", v)}
            keyboardType="phone-pad"
          />

          <View style={styles.otpRow}>
            <Button
              label="Request OTP"
              tone="outline"
              onPress={sendOtp}
              loading={sendingOtp}
              style={styles.otpBtn}
            />
          </View>

          <Input
            label="OTP Code"
            value={form.otp}
            onChangeText={(v) => setField("otp", v)}
            keyboardType="numeric"
          />
          <Input
            label="Password"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            secureTextEntry
          />
          <Input
            label="City"
            value={form.city}
            onChangeText={(v) => setField("city", v)}
          />

          {/* Conditional donor inputs */}
          {form.role === "donor" ? (
            <>
              <PickerRow
                label="Blood Group"
                value={form.bloodGroup}
                options={BLOOD_GROUPS}
                onChange={(v) => setField("bloodGroup", v)}
              />
              <Input
                label="Date of Birth (YYYY-MM-DD)"
                value={form.dob}
                onChangeText={(v) => setField("dob", v)}
                placeholder="1995-08-24"
              />
              <PickerRow
                label="Gender"
                value={form.gender}
                options={["male", "female", "other"]}
                onChange={(v) => setField("gender", v)}
              />
              <Input
                label="Emergency Contact Number"
                value={form.emergencyContact}
                onChangeText={(v) => setField("emergencyContact", v)}
                keyboardType="phone-pad"
              />
              <Input
                label="Age"
                value={form.age}
                onChangeText={(v) => setField("age", v)}
                keyboardType="numeric"
              />
            </>
          ) : null}

          {/* Conditional hospital inputs */}
          {form.role === "hospital" ? (
            <>
              <Input
                label="Hospital Name"
                value={form.hospitalName}
                onChangeText={(v) => setField("hospitalName", v)}
              />
              <Input
                label="Full Address"
                value={form.address}
                onChangeText={(v) => setField("address", v)}
                multiline
              />
              <Input
                label="Pincode"
                value={form.pincode}
                onChangeText={(v) => setField("pincode", v)}
                keyboardType="numeric"
              />
              <Input
                label="License/Registration Number"
                value={form.licenseNumber}
                onChangeText={(v) => setField("licenseNumber", v)}
              />
            </>
          ) : null}

          <Button
            label="Create Account"
            onPress={() => ctx.register(form)}
            style={styles.submitBtn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
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
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: 16,
  },
  otpRow: {
    alignItems: "flex-start",
    marginBottom: 6,
  },
  otpBtn: {
    marginTop: 4,
    marginBottom: 6,
    minHeight: 38,
  },
  submitBtn: {
    marginTop: 18,
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

export default RegisterScreen;
