import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Shell } from "../../components/common/Shell";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { useAppContext } from "../../context/AppContext";
import { theme } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const COMPATIBILITY = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
  "AB+": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
  "AB-": ["A-", "B-", "O-", "AB-"]
};

export function HomeScreen() {
  const ctx = useAppContext();
  const [selectedGroup, setSelectedGroup] = useState("A+");

  return (
    <Shell title="Save Lives. Donate Blood.">
      {/* ── 1. Hero Section ── */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              Save Lives.{"\n"}
              <Text style={styles.heroTitleHighlight}>Donate Blood.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              BloodLink helps donors and hospitals coordinate urgent blood needs with eligibility checks, real-time alerts, and rewards.
            </Text>
          </View>
          <View style={styles.dropletIconContainer}>
            <Ionicons name="water" size={64} color={theme.colors.primary} />
            <View style={styles.dropletBackdrop} />
          </View>
        </View>

        <View style={styles.heroActionRow}>
          <Button
            label="Register"
            onPress={() => ctx.setRoute("register")}
            style={styles.heroBtnPrimary}
          />
          <Button
            label="Login"
            tone="outline"
            onPress={() => ctx.setRoute("login")}
            style={styles.heroBtnOutline}
          />
        </View>
      </View>

      {/* ── 2. Statistics Panel ── */}
      <View style={styles.statsPanel}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>10K+</Text>
          <Text style={styles.statLabel}>Donors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>500+</Text>
          <Text style={styles.statLabel}>Hospitals</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>50K+</Text>
          <Text style={styles.statLabel}>Lives Saved</Text>
        </View>
      </View>

      {/* ── 3. How It Works Section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.sectionSubtitle}>Simple steps to make a huge impact</Text>
      </View>

      <Card style={styles.stepCard}>
        <View style={styles.stepRow}>
          <View style={styles.stepIconContainer}>
            <Ionicons name="person-add" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>1. Register</Text>
            <Text style={styles.stepDescription}>
              Create your account as a donor or hospital. Set your blood group, city, and notifications.
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.stepCard}>
        <View style={styles.stepRow}>
          <View style={styles.stepIconContainer}>
            <Ionicons name="locate" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>2. Get Matched</Text>
            <Text style={styles.stepDescription}>
              Hospitals raise urgent SOS alerts. Eligible donors within radius are notified immediately.
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.stepCard}>
        <View style={styles.stepRow}>
          <View style={styles.stepIconContainer}>
            <Ionicons name="trophy" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>3. Donate & Earn</Text>
            <Text style={styles.stepDescription}>
              Schedule slots easily, complete your donation, save lives, and earn rewards and loyalty badges.
            </Text>
          </View>
        </View>
      </Card>

      {/* ── 4. Interactive Compatibility Section ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Blood Compatibility</Text>
        <Text style={styles.sectionSubtitle}>Tap a blood type to check donor compatibility</Text>
      </View>

      <Card style={styles.compatibilityCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupSelector}>
          {BLOOD_GROUPS.map((group) => {
            const isSelected = group === selectedGroup;
            return (
              <Pressable
                key={group}
                onPress={() => setSelectedGroup(group)}
                style={[
                  styles.groupChip,
                  isSelected && styles.groupChipSelected
                ]}
              >
                <Text style={[styles.groupChipText, isSelected && styles.groupChipTextSelected]}>
                  {group}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.compatibilityLabel}>Can receive from:</Text>
        <View style={styles.badgesContainer}>
          {COMPATIBILITY[selectedGroup].map((compatible) => (
            <View key={compatible} style={styles.badgePill}>
              <Text style={styles.badgeText}>{compatible}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* ── 5. Secondary Utility Navigation ── */}
      <View style={styles.utilitySection}>
        <Pressable
          style={styles.utilityItem}
          onPress={() => ctx.setRoute("publicSearch")}
        >
          <Ionicons name="search" size={20} color={theme.colors.primary} />
          <Text style={styles.utilityText}>Search Donors</Text>
        </Pressable>
        
        <View style={styles.utilitySeparator} />

        <Pressable
          style={styles.utilityItem}
          onPress={() => ctx.setRoute("contact")}
        >
          <Ionicons name="mail" size={20} color={theme.colors.primary} />
          <Text style={styles.utilityText}>Contact Support</Text>
        </Pressable>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  // ── Hero Section
  heroSection: {
    marginBottom: 24,
    paddingVertical: 8,
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1A1A2E",
    lineHeight: 36,
  },
  heroTitleHighlight: {
    color: theme.colors.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.colors.textSub,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  dropletIconContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dropletBackdrop: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(226, 30, 66, 0.08)",
    zIndex: -1,
  },
  heroActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  heroBtnPrimary: {
    flex: 1,
    marginTop: 0,
  },
  heroBtnOutline: {
    flex: 1,
    marginTop: 0,
  },

  // ── Stats Panel
  statsPanel: {
    flexDirection: "row",
    backgroundColor: "#1A1A2E", // sleek dark background
    borderRadius: theme.radius.card,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 28,
    ...theme.shadows.card,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    color: "#A0AEC0",
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },

  // ── Common Section Styles
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A2E",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "700",
    marginTop: 2,
  },

  // ── Step Cards
  stepCard: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(226, 30, 66, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1A1A2E",
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 13,
    color: theme.colors.textSub,
    lineHeight: 18,
    fontWeight: "600",
  },

  // ── Compatibility Section
  compatibilityCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  groupSelector: {
    gap: 8,
    paddingBottom: 4,
  },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  groupChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  groupChipText: {
    fontSize: 14,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  groupChipTextSelected: {
    color: "#FFFFFF",
  },
  compatibilityLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textSub,
    marginTop: 18,
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badgePill: {
    backgroundColor: "rgba(226, 30, 66, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(226, 30, 66, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 38,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.colors.primary,
  },

  // ── Secondary Utility Section
  utilitySection: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "space-around",
    ...theme.shadows.card,
    marginBottom: 12,
  },
  utilityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  utilityText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },
  utilitySeparator: {
    width: 1,
    height: 18,
    backgroundColor: theme.colors.border,
  },
});

