import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Shell } from "../../components/common/Shell";
import { Card } from "../../components/common/Card";
import { Stat } from "../../components/common/Stat";
import { useAppContext, BLOOD_GROUPS } from "../../context/AppContext";
import { useLoader } from "../../utils/useLoader";
import { theme } from "../../styles/theme";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

export function HospitalDashboard({ tabs }) {
  const ctx = useAppContext();
  const [data, setData] = useState({ inventory: [], requests: [], expiry: [] });

  const loading = useLoader(ctx, async () => {
    const [inventory, requests, expiry] = await Promise.all([
      ctx.api("/inventory"),
      ctx.api("/blood-requests"),
      ctx.api("/inventory/expiry-alerts"),
    ]);
    setData({
      inventory: inventory.data || [],
      requests: requests.data || [],
      expiry: expiry.data || [],
    });
  });

  const totals = BLOOD_GROUPS.map((group) => ({
    group,
    units: data.inventory
      .filter((i) => i.bloodGroup === group)
      .reduce((sum, item) => sum + Number(item.units || 0), 0),
  }));

  const openReqCount = data.requests.filter((r) => r.status === "open").length;
  const fulfilledReqCount = data.requests.filter((r) => r.status === "fulfilled").length;

  const quickActions = [
    {
      label: "Inventory",
      icon: <FontAwesome5 name="warehouse" size={24} color={theme.colors.primary} />,
      route: "hospital:inventory",
    },
    {
      label: "Raise Request",
      icon: <MaterialCommunityIcons name="water-plus" size={28} color={theme.colors.primary} />,
      route: "hospital:raise",
    },
    {
      label: "Requests Log",
      icon: <FontAwesome5 name="clipboard-list" size={24} color={theme.colors.primary} />,
      route: "hospital:requests",
    },
    {
      label: "Donor Search",
      icon: <FontAwesome5 name="search" size={24} color={theme.colors.primary} />,
      route: "hospital:donorSearch",
    },
    {
      label: "Appointments",
      icon: <FontAwesome5 name="calendar-alt" size={24} color={theme.colors.primary} />,
      route: "hospital:appointments",
    },
    {
      label: "Expiry Alerts",
      icon: <FontAwesome5 name="exclamation-triangle" size={24} color={theme.colors.primary} />,
      route: "hospital:expiry",
    },
    {
      label: "Notifications",
      icon: <FontAwesome5 name="bell" size={24} color={theme.colors.primary} />,
      route: "hospital:notifications",
    },
    {
      label: "Profile",
      icon: <FontAwesome5 name="user-alt" size={24} color={theme.colors.primary} />,
      route: "hospital:profile",
    },
  ];

  return (
    <Shell title="Hospital dashboard" tabs={tabs} loading={loading}>
      {ctx.user?.isActive === false ? (
        <Card danger>
          <Text style={styles.dangerText}>
            Your account has been suspended. Reason:{" "}
            {ctx.user.suspensionReason || "No reason provided"}. Please contact support.
          </Text>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Blood Inventory Units</Text>
      <View style={styles.grid}>
        {totals.map((item) => (
          <Stat key={item.group} label={item.group} value={item.units} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Request & Alert Summary</Text>
      <View style={styles.grid}>
        <Stat label="Open Requests" value={openReqCount} />
        <Stat label="Fulfilled" value={fulfilledReqCount} />
        <Stat label="Expiry Alerts" value={data.expiry.length} />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        {quickActions.map((item, index) => (
          <Pressable
            key={index}
            style={styles.actionItem}
            onPress={() => ctx.setRoute(item.route)}
          >
            <View style={styles.actionCircle}>
              {item.icon}
            </View>
            <Text style={styles.actionLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  dangerText: {
    color: theme.colors.dangerText,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 10,
  },
  actionItem: {
    width: "48%",
    alignItems: "center",
    marginVertical: 12,
  },
  actionCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FAD9DD",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textSub,
    textAlign: "center",
  },
});
export default HospitalDashboard;
