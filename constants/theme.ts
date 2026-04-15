export const theme = {
  colors: {
    background: "#0a0a0a", // Noir profond
    surface: "#121212", // Gris très sombre pour les cartes/lignes
    surfaceHighlight: "#1a1a1a",

    text: "#ffffff",
    textSecondary: "#888888",
    textMuted: "#555555",

    primary: "#00bfa5", // Vert "messagerie" pour Julie/Statuts
    error: "#ff5252",

    bubbleUser: "#222222", // Bulle joueur
    bubbleJulie: "#121212", // Bulle Julie

    border: "#111111",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
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
  },
};
