import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Shell } from "../../components/common/Shell";
import { Card } from "../../components/common/Card";
import { Stat } from "../../components/common/Stat";
import { Button } from "../../components/common/Button";
import { List } from "../../components/common/List";
import { useAppContext, titleCase } from "../../context/AppContext";
import { useLoader } from "../../utils/useLoader";
import { theme } from "../../styles/theme";
import { FontAwesome5 } from "@expo/vector-icons";

export function AdminDashboardScreen({ tabs }) {
  const ctx = useAppContext();
  const [data, setData] = useState(null);

  const loading = useLoader(ctx, async () => {
    const [stats, analytics, inventory] = await Promise.all([
      ctx.api("/admin/stats"),
      ctx.api("/admin/analytics"),
      ctx.api("/admin/inventory"),
    ]);
    setData({
      stats: stats.data,
      analytics: analytics.data,
      inventory: inventory.data,
    });
  });

  const statKeys = [
    "totalUsers",
    "totalDonors",
    "totalHospitals",
    "totalBloodUnits",
    "requestsToday",
    "fulfilledToday",
    "pendingHospitalApprovals",
  ];

  const quickActions = [
    {
      label: "Users",
      icon: <FontAwesome5 name="users" size={24} color={theme.colors.primary} />,
      route: "admin:users",
    },
    {
      label: "Inventory",
      icon: <FontAwesome5 name="warehouse" size={24} color={theme.colors.primary} />,
      route: "admin:inventory",
    },
    {
      label: "Requests Log",
      icon: <FontAwesome5 name="clipboard-list" size={24} color={theme.colors.primary} />,
      route: "admin:requests",
    },
    {
      label: "Analytics",
      icon: <FontAwesome5 name="chart-bar" size={24} color={theme.colors.primary} />,
      route: "admin:analytics",
    },
    {
      label: "Broadcast Alert",
      icon: <FontAwesome5 name="bullhorn" size={24} color={theme.colors.primary} />,
      route: "admin:broadcast",
    },
    {
      label: "System Settings",
      icon: <FontAwesome5 name="cog" size={24} color={theme.colors.primary} />,
      route: "admin:settings",
    },
    {
      label: "Reports",
      icon: <FontAwesome5 name="file-contract" size={24} color={theme.colors.primary} />,
      route: "admin:reports",
    },
  ];

  return (
    <Shell title="Admin dashboard" tabs={tabs} loading={loading}>
      <Text style={styles.sectionTitle}>System Metrics</Text>
      <View style={styles.grid}>
        {statKeys.map((key) => (
          <Stat
            key={key}
            label={titleCase(key)}
            value={data?.stats?.[key] || 0}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Critical Blood Shortages</Text>
      <List
        data={data?.inventory?.critical || []}
        empty="No critical shortages in the system."
        renderItem={(item) => (
          <Card danger>
            <Text style={styles.cardTitle}>{item.bloodGroup} Shortage Alert</Text>
            <Button
              label="Broadcast Alert"
              tone="outline"
              onPress={() => ctx.setRoute(`admin:broadcast:${item.bloodGroup}`)}
              style={styles.broadcastBtn}
            />
          </Card>
        )}
      />

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
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.dangerText,
    marginBottom: 6,
  },
  broadcastBtn: {
    marginTop: 8,
    minHeight: 38,
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
export default AdminDashboardScreen;
