import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { theme } from "../../styles/theme";

export function LoadingOverlay() {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 245, 246, 0.75)", // Semi-transparent warm pink backdrop
  },
});
