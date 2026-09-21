import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useAppContext } from "../../context/AppContext";
import { theme } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";

export function Shell({ title, children, tabs = [], loading = false }) {
  const ctx = useAppContext();

  return (
    <View style={styles.screen}>
      {/* ── Top bar ───────────────────────────────────── */}
      <View style={styles.topbar}>
        {ctx.canGoBack ? (
          <Pressable style={styles.backBtn} onPress={ctx.goBack}>
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
        ) : null}

        <View style={styles.headerLeft}>
          {/* Brand eyebrow — matches .sidebar-link branding */}
          <View style={styles.brandRow}>
            <View style={styles.avatarDot} />
            <Text style={styles.brandText}>BloodLink</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>

        {ctx.user ? (
          <View style={styles.headerRight}>
            {ctx.user.role !== "admin" ? (
              <>
                <Pressable
                  style={styles.notifyBtn}
                  onPress={() => ctx.setRoute(`${ctx.user.role}:chats`)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  style={styles.notifyBtn}
                  onPress={() => ctx.setRoute(`${ctx.user.role}:notifications`)}
                >
                  <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                </Pressable>
              </>
            ) : null}
            <Pressable style={styles.logoutBtn} onPress={ctx.logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ── Connection banner ──────────────────────────── */}
      {ctx.serverStatus === "disconnected" ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠ Cannot reach server</Text>
        </View>
      ) : null}



      {/* ── Page content ─────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          loading && styles.loadingContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            size="large"
            style={styles.spinner}
          />
        ) : (
          children
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  // ── Top bar
  topbar: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: theme.spacing.base,
    backgroundColor: theme.colors.primary, // Solid brand red header!
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backBtn: {
    paddingRight: 8,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  avatarDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF", // White brand dot
  },
  brandText: {
    ...theme.type.eyebrow,
    color: "#FFFFFF", // White brand text
  },
  title: {
    ...theme.type.h2,
    color: "#FFFFFF", // White header title
    marginTop: 1,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999, // Pill shape
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  logoutText: {
    ...theme.type.caption,
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifyBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Offline banner
  offlineBanner: {
    backgroundColor: theme.colors.warningBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.warningBorder,
    paddingVertical: 7,
    paddingHorizontal: theme.spacing.base,
    alignItems: "center",
  },
  offlineText: {
    ...theme.type.caption,
    color: theme.colors.warningText,
    fontWeight: "900",
  },


  // ── Content scroll
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.base,
    paddingBottom: 48,
  },
  loadingContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    marginVertical: 40,
  },
});
