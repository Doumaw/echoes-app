const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const typography = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    title: 28,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    bold: "700" as const,
  },
};

export const darkTheme = {
  colors: {
    background: "#0a0a0a",
    surface: "#121212",
    surfaceHighlight: "#1a1a1a",
    text: "#ffffff",
    textSecondary: "#888888",
    textMuted: "#555555",
    primary: "#00bfa5",
    error: "#ff5252",
    bubbleUser: "#00bfa5",
    bubbleJulie: "#121212",
    bubbleUserText: "#000000",
    bubbleUserMeta: "rgba(0, 0, 0, 0.55)",
    readIndicatorUnread: "rgba(0, 0, 0, 0.4)",
    readIndicatorRead: "#0b6b5c",
    border: "#111111",
  },
  spacing,
  typography,
};

export const lightTheme = {
  colors: {
    background: "#f5f7fa",
    surface: "#ffffff",
    surfaceHighlight: "#e8edf2",
    text: "#16191d",
    textSecondary: "#5f6b76",
    textMuted: "#8a96a1",
    primary: "#00bfa5",
    error: "#d64b4b",
    bubbleUser: "#00d3b7",
    bubbleJulie: "#ffffff",
    bubbleUserText: "#04211c",
    bubbleUserMeta: "rgba(4, 33, 28, 0.6)",
    readIndicatorUnread: "rgba(4, 33, 28, 0.4)",
    readIndicatorRead: "#0b6b5c",
    border: "#d8dde3",
  },
  spacing,
  typography,
};

export type AppTheme = typeof darkTheme;
export type ThemeMode = "dark" | "light";

export function getTheme(mode: ThemeMode = "dark"): AppTheme {
  return mode === "light" ? lightTheme : darkTheme;
}

export const theme = darkTheme;
