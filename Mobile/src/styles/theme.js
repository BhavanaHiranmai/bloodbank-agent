// ─── BloodLink Design System — mirrors index.css exactly ─────────────────────

export const theme = {
  colors: {
    // Brand
    primary:     "#E21E42",   // InstaBlood / RedFlow Vibrant red
    primaryDark: "#B81531",   // Darker red for active/pressed gradients
    accent:      "#E21E42",

    // Backgrounds
    bg:          "#FFF5F6",   // Warm soft pinkish-tinted white background
    surface:     "#FFFFFF",
    surfaceTint: "#FFF0F2",
    darkBg:      "#1A1A2E",   // --dark-bg
    cardBg:      "#16213E",   // --card-bg
    navy:        "#1A1A2E",   // --navy

    // Borders / Text
    border:      "#FAD9DD",   // Light pinkish border
    borderLight: "#FCE8EB",
    text:        "#2D3748",
    textSub:     "#4A5568",
    muted:       "#A0AEC0",

    // Focus ring
    ring:        "rgba(226, 30, 66, 0.16)",

    // Status — success
    successBg:     "#E6F4EA",
    successBorder: "#B7E1CD",
    successText:   "#137333",
    successBtn:    "#1E8E3E",
    successBtnShadow: "rgba(30, 142, 62, 0.22)",

    // Status — warning
    warningBg:     "#FFFBEB",
    warningBorder: "#FDE68A",
    warningText:   "#B45309",

    // Status — danger
    dangerBg:     "#FCE8E6",
    dangerBorder: "#FAD2CF",
    dangerText:   "#C5221F",
    dangerBtn:    "#D93025",
    dangerBtnShadow: "rgba(217, 48, 37, 0.16)",

    // Status — info
    infoBg:     "#E8F0FE",
    infoBorder: "#D2E3FC",
    infoText:   "#1A73E8",

    // Chat bubbles
    bubbleOther: "#F1F3F4",
    bubbleMine:  "#FFF0F2",

    // Misc
    avatarBg:   "#FEE2E2",
    skeletonA:  "#E2E8F0",
    skeletonB:  "#FFF0F2",   // soft pink instead of gray
    softGray:   "#F8FAFC",
    slate:      "#64748B",
  },

  // ── Shadows — matching box-shadow values from index.css ──────────────────────
  shadows: {
    card: {
      shadowColor:   "#0F172A",
      shadowOffset:  { width: 0, height: 14 },
      shadowOpacity: 0.07,
      shadowRadius:  34,
      elevation:     6,
    },
    cardHover: {
      shadowColor:   "#0F172A",
      shadowOffset:  { width: 0, height: 18 },
      shadowOpacity: 0.09,
      shadowRadius:  42,
      elevation:     8,
    },
    button: {
      shadowColor:   "rgba(192, 57, 43, 0.18)",
      shadowOffset:  { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius:  22,
      elevation:     5,
    },
    buttonDanger: {
      shadowColor:   "#DC2626",
      shadowOffset:  { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius:  22,
      elevation:     4,
    },
    buttonOutline: {
      shadowColor:   "#0F172A",
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius:  2,
      elevation:     1,
    },
    sidebarActive: {
      shadowColor:   "rgba(229, 62, 62, 0.18)",
      shadowOffset:  { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius:  22,
      elevation:     4,
    },
    sosPanel: {
      shadowColor:   "#000000",
      shadowOffset:  { width: 0, height: 28 },
      shadowOpacity: 0.35,
      shadowRadius:  80,
      elevation:     20,
    },
    profileMenu: {
      shadowColor:   "#0F172A",
      shadowOffset:  { width: 0, height: 18 },
      shadowOpacity: 0.16,
      shadowRadius:  42,
      elevation:     12,
    },
  },

  // ── Border radii ─────────────────────────────────────────────────────────────
  radius: {
    card:   20,    // highly rounded premium card corners
    button: 999,   // pill buttons everywhere
    input:  14,    // smooth text input corners
    chip:   10,
    tab:    999,
    pill:   999,
    badge:  999,
    bubble: 16,
  },

  // ── Spacing scale ─────────────────────────────────────────────────────────────
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  // ── Typography ────────────────────────────────────────────────────────────────
  type: {
    eyebrow:   { fontSize: 11, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
    label:     { fontSize: 14, fontWeight: "800" },
    body:      { fontSize: 15, fontWeight: "700", lineHeight: 23 },
    caption:   { fontSize: 13, fontWeight: "700" },
    small:     { fontSize: 12, fontWeight: "800" },
    h1:        { fontSize: 26, fontWeight: "900", lineHeight: 34 },
    h2:        { fontSize: 20, fontWeight: "900" },
    h3:        { fontSize: 17, fontWeight: "900" },
    statValue: { fontSize: 24, fontWeight: "900" },
    statLabel: { fontSize: 12, fontWeight: "800" },
  },
};
