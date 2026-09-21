import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { theme } from "../../styles/theme";

/**
 * tone: "primary" | "outline" | "danger" | "ghost" | "success"
 */
export function Button({ label, onPress, tone = "primary", style, textStyle, disabled, loading = false }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        tone === "primary" && styles.primary,
        tone === "outline" && styles.outline,
        tone === "danger"  && styles.danger,
        tone === "ghost"   && styles.ghost,
        tone === "success" && styles.success,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={
            tone === "outline" || tone === "ghost"
              ? theme.colors.primary
              : "#FFFFFF"
          }
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            tone === "primary" && styles.textWhite,
            tone === "outline" && styles.textDark,
            tone === "danger"  && styles.textWhite,
            tone === "ghost"   && styles.textPrimary,
            tone === "success" && styles.textWhite,
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── Base — matches .btn-primary / .btn-outline min-height, padding
  base: {
    minHeight: 44,              // 2.75rem
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.button,
    paddingHorizontal: 16,      // 1rem
    paddingVertical: 11,        // 0.7rem
    marginTop: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },

  // ── Primary
  primary: {
    backgroundColor: theme.colors.primary, // Bright vibrant red
    borderColor: theme.colors.primary,
    ...theme.shadows.button,
  },

  // ── Outline
  outline: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary, // Red border for outline
    borderWidth: 1.5,
  },

  // ── Danger — matches .btn-danger
  danger: {
    backgroundColor: theme.colors.dangerBtn,    // #DC2626
    borderColor: theme.colors.dangerBtn,
    ...theme.shadows.buttonDanger,
  },

  // ── Success (for SOS accept)
  success: {
    backgroundColor: theme.colors.successBtn,   // #16A34A
    borderColor: theme.colors.successBtn,
    shadowColor: theme.colors.successBtnShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 5,
  },

  // ── Ghost — no background, primary text
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },

  // ── States
  pressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.45,
  },

  // ── Text
  text: {
    fontSize: 15,
    fontWeight: "800",
  },
  textWhite:    { color: "#FFFFFF" },
  textDark:     { color: theme.colors.primary }, // Red text for outline
  textPrimary:  { color: theme.colors.primary },
  textDisabled: { color: theme.colors.muted },
});
