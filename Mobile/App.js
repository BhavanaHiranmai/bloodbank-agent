import "./src/styles/themeEngine";
import React, { useEffect, useRef } from "react";
import { View, Text, Modal, StyleSheet, Animated, Vibration, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppProvider, useAppContext } from "./src/context/AppContext";
import { theme } from "./src/styles/theme";
import * as Notifications from "expo-notifications";
import "./app/tasks/sosTask";
import { SOSAlarmModal } from "./src/components/SOSAlarmModal";

// Common layout/card elements
import { LoadingOverlay } from "./src/components/common/LoadingOverlay";
import { Button } from "./src/components/common/Button";

// Public Screens
import { HomeScreen } from "./src/screens/public/HomeScreen";
import { LoginScreen } from "./src/screens/public/LoginScreen";
import { RegisterScreen } from "./src/screens/public/RegisterScreen";
import { ForgotPasswordScreen } from "./src/screens/public/ForgotPasswordScreen";
import { PublicSearchScreen } from "./src/screens/public/PublicSearchScreen";
import { ContactScreen } from "./src/screens/public/ContactScreen";

// Donor Screens
import { DonorDashboard } from "./src/screens/donor/DonorDashboard";
import { DonorProfile } from "./src/screens/donor/DonorProfile";
import { EligibilityScreen } from "./src/screens/donor/EligibilityScreen";
import { AppointmentScreen } from "./src/screens/donor/AppointmentScreen";
import { DonationHistoryScreen } from "./src/screens/donor/DonationHistoryScreen";
import { BadgesScreen } from "./src/screens/donor/BadgesScreen";
import { NotificationsScreen } from "./src/screens/donor/NotificationsScreen";
import { NearbyRequestsScreen } from "./src/screens/donor/NearbyRequestsScreen";
import { RaiseRequestScreen } from "./src/screens/donor/RaiseRequestScreen";

// Hospital Screens
import { PendingApproval } from "./src/screens/hospital/PendingApproval";
import { HospitalDashboard } from "./src/screens/hospital/HospitalDashboard";
import { InventoryScreen } from "./src/screens/hospital/InventoryScreen";
import { RequestsScreen } from "./src/screens/hospital/RequestsScreen";
import { HospitalAppointmentsScreen } from "./src/screens/hospital/HospitalAppointmentsScreen";
import { ExpiryScreen } from "./src/screens/hospital/ExpiryScreen";
import { HospitalProfile } from "./src/screens/hospital/HospitalProfile";

// Admin Screens
import { AdminDashboardScreen } from "./src/screens/admin/AdminDashboardScreen";
import { UserManagementScreen } from "./src/screens/admin/UserManagementScreen";
import { AdminInventoryScreen } from "./src/screens/admin/AdminInventoryScreen";
import { AnalyticsScreen } from "./src/screens/admin/AnalyticsScreen";
import { BroadcastScreen } from "./src/screens/admin/BroadcastScreen";
import { SettingsScreen } from "./src/screens/admin/SettingsScreen";
import { ReportsScreen } from "./src/screens/admin/ReportsScreen";

// Chat Screen
import { ChatScreen } from "./src/screens/chat/ChatScreen";
import { ChatsListScreen } from "./src/screens/chat/ChatsListScreen";

const donorTabs = [
  ["Dashboard", "donor:dashboard"],
  ["Profile", "donor:profile"],
  ["Eligibility", "donor:eligibility"],
  ["Appointments", "donor:appointments"],
  ["History", "donor:history"],
  ["Badges", "donor:badges"],
  ["Notifications", "donor:notifications"],
  ["Nearby", "donor:nearby"],
  ["SOS", "donor:sos"],
].map(([label, route]) => ({ label, route }));

const hospitalTabs = [
  ["Dashboard", "hospital:dashboard"],
  ["Inventory", "hospital:inventory"],
  ["Raise", "hospital:raise"],
  ["Requests", "hospital:requests"],
  ["Donor search", "hospital:donorSearch"],
  ["Appointments", "hospital:appointments"],
  ["Expiry", "hospital:expiry"],
  ["Profile", "hospital:profile"],
  ["Notifications", "hospital:notifications"],
].map(([label, route]) => ({ label, route }));

const adminTabs = [
  ["Dashboard", "admin:dashboard"],
  ["Users", "admin:users"],
  ["Inventory", "admin:inventory"],
  ["Requests", "admin:requests"],
  ["Analytics", "admin:analytics"],
  ["Broadcast", "admin:broadcast"],
  ["Settings", "admin:settings"],
  ["Reports", "admin:reports"],
].map(([label, route]) => ({ label, route }));

function AppInner() {
  const {
    user,
    route,
    setRoute,
    loading,
    booting,
    activeSos,
    setActiveSos,
    respondToSos,
    sosAlarmVisible,
    setSosAlarmVisible,
    sosAlarmData
  } = useAppContext();

  // Pulse animation for critical alarms
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isCritical = activeSos && activeSos.data?.urgency === "critical";
    if (isCritical) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [activeSos, pulseAnim]);

  // Tap listener for background SOS alerts
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && (data.type === "sos_alert" || data.urgency === "critical")) {
        setActiveSos({
          title: "🚨 BLOOD NEEDED URGENTLY",
          message: `${data.bloodGroup || ""} blood needed nearby — Tap to respond`,
          data: data,
        });
        setRoute("donor:nearby");
      }
    });
    return () => {
      subscription.remove();
    };
  }, [setActiveSos, setRoute]);

  if (booting) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingOverlay />
      </SafeAreaView>
    );
  }

  // Resolve screen to show
  let content = null;

  if (!user) {
    // Public Flow
    if (route === "login") content = <LoginScreen />;
    else if (route === "register") content = <RegisterScreen />;
    else if (route === "forgot") content = <ForgotPasswordScreen />;
    else if (route === "publicSearch") content = <PublicSearchScreen />;
    else if (route === "contact") content = <ContactScreen />;
    else content = <HomeScreen />;
  } else {
    // Authenticated Flow
    if (route.startsWith("chat:")) {
      const rId = route.split(":")[1];
      content = <ChatScreen requestId={rId} />;
    } else if (user.role === "donor") {
      // Donor screens
      if (route === "donor:profile") content = <DonorProfile tabs={donorTabs} />;
      else if (route === "donor:eligibility") content = <EligibilityScreen tabs={donorTabs} />;
      else if (route === "donor:appointments") content = <AppointmentScreen tabs={donorTabs} />;
      else if (route === "donor:history") content = <DonationHistoryScreen tabs={donorTabs} />;
      else if (route === "donor:badges") content = <BadgesScreen tabs={donorTabs} />;
      else if (route === "donor:notifications") content = <NotificationsScreen tabs={donorTabs} />;
      else if (route === "donor:nearby") content = <NearbyRequestsScreen tabs={donorTabs} />;
      else if (route === "donor:chats") content = <ChatsListScreen tabs={donorTabs} />;
      else if (route === "donor:sos") content = <RaiseRequestScreen tabs={donorTabs} donorSos />;
      else content = <DonorDashboard tabs={donorTabs} />;
    } else if (user.role === "hospital") {
      // Hospital screens
      if (user.isApproved === false) {
        content = <PendingApproval tabs={hospitalTabs} />;
      } else if (route === "hospital:inventory") {
        content = <InventoryScreen tabs={hospitalTabs} />;
      } else if (route === "hospital:raise") {
        content = <RaiseRequestScreen tabs={hospitalTabs} />;
      } else if (route === "hospital:requests") {
        content = <RequestsScreen tabs={hospitalTabs} />;
      } else if (route === "hospital:donorSearch") {
        content = <PublicSearchScreen tabs={hospitalTabs} />;
      } else if (route === "hospital:appointments") {
        content = <HospitalAppointmentsScreen tabs={hospitalTabs} />;
      } else if (route === "hospital:expiry") {
        content = <ExpiryScreen tabs={hospitalTabs} />;
      } else if (route === "hospital:profile") {
        content = <HospitalProfile tabs={hospitalTabs} />;
      } else if (route === "hospital:notifications") {
        content = <NotificationsScreen tabs={hospitalTabs} />;
      } else if (route === "hospital:chats") {
        content = <ChatsListScreen tabs={hospitalTabs} />;
      } else {
        content = <HospitalDashboard tabs={hospitalTabs} />;
      }
    } else {
      // Admin screens
      if (route === "admin:users") content = <UserManagementScreen tabs={adminTabs} />;
      else if (route === "admin:inventory") content = <AdminInventoryScreen tabs={adminTabs} />;
      else if (route === "admin:requests") content = <RequestsScreen tabs={adminTabs} admin />;
      else if (route === "admin:analytics") content = <AnalyticsScreen tabs={adminTabs} />;
      else if (route === "admin:broadcast") content = <BroadcastScreen tabs={adminTabs} />;
      else if (route === "admin:settings") content = <SettingsScreen tabs={adminTabs} />;
      else if (route === "admin:reports") content = <ReportsScreen tabs={adminTabs} />;
      else content = <AdminDashboardScreen tabs={adminTabs} />;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {loading && <LoadingOverlay />}
      {content}

      {activeSos ? (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalShade}>
            {(() => {
              const isAlarm = activeSos.data?.urgency === "critical";
              const alarmBg = pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#DC2626", "#7F1D1D"],
              });

              return (
                <Animated.View
                  style={[
                    styles.modalCard,
                    isAlarm
                      ? {
                          backgroundColor: alarmBg,
                          borderColor: "#EF4444",
                          borderWidth: 3,
                        }
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.eyebrow,
                      isAlarm
                        ? {
                            color: "#FFF",
                            opacity: 0.9,
                            fontSize: 13,
                            letterSpacing: 1,
                          }
                        : null,
                    ]}
                  >
                    {isAlarm ? "🚨 SOS EMERGENCY ALERT 🚨" : "Emergency SOS nearby"}
                  </Text>
                  <Text
                    style={[
                      styles.cardTitle,
                      isAlarm ? { color: "#FFF", fontSize: 22, fontWeight: "900" } : null,
                    ]}
                  >
                    {activeSos.title}
                  </Text>
                  <Text style={[styles.body, isAlarm ? { color: "#FFF", fontSize: 16 } : null]}>
                    {activeSos.message}
                  </Text>
                  <Text
                    style={[
                      styles.body,
                      isAlarm ? { color: "#FFF", fontWeight: "900", fontSize: 18 } : null,
                    ]}
                  >
                    Blood Group: {activeSos.data?.bloodGroup} |{" "}
                    {activeSos.data?.distance || "Distance pending"}
                  </Text>
                  <View style={styles.row}>
                    <Button
                      label="Accept"
                      onPress={() => respondToSos("accept")}
                      style={[
                        styles.modalBtn,
                        isAlarm
                          ? {
                              backgroundColor: "#FFF",
                              borderColor: "#FFF",
                            }
                          : null,
                      ]}
                      textStyle={
                        isAlarm
                          ? {
                              color: "#B81531",
                              fontWeight: "900",
                              fontSize: 16,
                            }
                          : null
                      }
                    />
                    <Button
                      label="Decline"
                      tone={isAlarm ? "ghost" : "outline"}
                      onPress={() => respondToSos("decline")}
                      style={[
                        styles.modalBtn,
                        isAlarm
                          ? {
                              backgroundColor: "rgba(255,255,255,0.2)",
                              borderColor: "rgba(255,255,255,0.2)",
                            }
                          : null,
                      ]}
                      textStyle={isAlarm ? { color: "#FFF", fontWeight: "700" } : null}
                    />
                    <Button
                      label="Dismiss"
                      tone="ghost"
                      onPress={() => setActiveSos(null)}
                      style={styles.modalBtn}
                      textStyle={[
                        styles.dismissText,
                        isAlarm ? { color: "rgba(255,255,255,0.7)" } : null,
                      ]}
                    />
                  </View>
                </Animated.View>
              );
            })()}
          </View>
        </Modal>
      ) : null}

      <SOSAlarmModal
        visible={sosAlarmVisible}
        requestData={sosAlarmData}
        onClose={() => setSosAlarmVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => {
    // Register notification channel for SOS alerts
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("sos_channel", {
        name: "SOS Blood Alerts",
        importance: Notifications.AndroidImportance.MAX,
        sound: "sos_alarm.mp3",
        vibrationPattern: [0, 500, 200, 500],
        enableVibrate: true,
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }).catch((err) => console.log("[App] Failed to set notification channel:", err.message));
    }

    // Register background task async
    Notifications.registerTaskAsync("SOS_BACKGROUND_HANDLER")
      .then(() => console.log("[App] SOS Background task registered successfully"))
      .catch((err) => console.log("[App] Failed to register background task:", err.message));
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  modalShade: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 16,
    ...theme.shadows.card,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 8,
  },
  body: {
    color: theme.colors.text,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    marginTop: 0,
    minHeight: 40,
  },
  dismissText: {
    color: theme.colors.muted,
  },
});
