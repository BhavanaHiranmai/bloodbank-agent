import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Shell } from "../../components/common/Shell";
import { DeferredBanner } from "../../components/common/DeferredBanner";
import { useAppContext, empty } from "../../context/AppContext";
import { useLoader } from "../../utils/useLoader";
import { theme } from "../../styles/theme";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

export function DonorDashboard({ tabs }) {
  const ctx = useAppContext();
  const [data, setData] = useState(null);

  const loading = useLoader(ctx, async () => {
    const [eligibility, stats, history, notifications] = await Promise.all([
      ctx.api("/eligibility/status"),
      ctx.api("/loyalty/my-stats"),
      ctx.api("/donations/my-history"),
      ctx.api("/notifications"),
    ]);
    setData({
      eligibility: eligibility.data || empty.eligibility,
      stats: stats.data || empty.donorStats,
      donations: history.data || [],
      notifications: notifications.data || [],
    });
  }, [ctx.eligibilityTick, ctx.donationTick]);

  const menuItems = [
    {
      label: "Emergency SOS",
      icon: <MaterialCommunityIcons name="alert-decagram" size={38} color={theme.colors.primary} />,
      route: "donor:sos",
    },
    {
      label: "People in Need",
      icon: <FontAwesome5 name="hand-holding-heart" size={32} color={theme.colors.primary} />,
      route: "donor:nearby",
    },
    {
      label: "Blood Bank",
      icon: <FontAwesome5 name="hospital" size={32} color={theme.colors.primary} />,
      route: "donor:appointments",
    },
    {
      label: "Eligibility Check",
      icon: <FontAwesome5 name="heartbeat" size={32} color={theme.colors.primary} />,
      route: "donor:eligibility",
    },
    {
      label: "Donation History",
      icon: <FontAwesome5 name="history" size={32} color={theme.colors.primary} />,
      route: "donor:history",
    },
    {
      label: "My Badges",
      icon: <FontAwesome5 name="trophy" size={32} color={theme.colors.primary} />,
      route: "donor:badges",
    },
    {
      label: "Notifications",
      icon: <FontAwesome5 name="bell" size={32} color={theme.colors.primary} />,
      route: "donor:notifications",
    },
    {
      label: "Profile",
      icon: <FontAwesome5 name="user-alt" size={32} color={theme.colors.primary} />,
      route: "donor:profile",
    },
  ];

  return (
    <Shell title="Dashboard" tabs={tabs} loading={loading}>
      <DeferredBanner eligibility={data?.eligibility} />
      <View style={styles.gridContainer}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            style={styles.gridItem}
            onPress={() => ctx.setRoute(item.route)}
          >
            <View style={styles.circle}>
              {item.icon}
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: 16,
  },
  gridItem: {
    width: "48%",
    alignItems: "center",
    marginVertical: 16,
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FAD9DD", // soft pink border matching custom theme
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textSub,
    textAlign: "center",
  },
});

export default DonorDashboard;
