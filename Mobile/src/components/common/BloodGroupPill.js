import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../styles/theme";

export function BloodGroupPill({ group }) {
  return (
    <View style={styles.bloodPill}>
      <Text style={styles.bloodPillText}>{group}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bloodPill: {
    backgroundColor: "#FFE8EC", // Soft pink badge background
    borderRadius: theme.radius.pill, // Fully rounded
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FAD9DD",
  },
  bloodPillText: {
    color: theme.colors.primary, // Vibrant red text
    fontWeight: "900",
    fontSize: 14,
  },
});
