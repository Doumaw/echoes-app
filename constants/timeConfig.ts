/**
 * Configuration des durées du jeu
 * 
 * EN DEV : 1 heure réelle = 1 heure de jeu (pas de multiplicateur)
 * EN PROD : Les durées réelles s'appliquent
 */

const IS_DEV = true; // À passer à false pour la production

const DEV_BUSY_DURATION_MS: Record<number, number> = {
  5: 15 * 1000,
  10: 30 * 1000,
  15: 60 * 1000,
  20: 2 * 60 * 1000,
};

export const TIME_CONFIG = {
  // Multiplicateur de temps : en DEV, pas de multiplicateur (1x = temps réel)
  // En PROD, c'est aussi 1x (temps réel)
  timeMultiplier: 1, // DEV et PROD: temps réel

  // Durée totale du jeu avant plot twist (3 jours)
  plotTwistAfterMs: IS_DEV 
    ? 3 * 60 * 60 * 1000        // DEV : 3 heures réelles = 3 jours de jeu
    : 3 * 24 * 60 * 60 * 1000, // PROD : 3 jours réels,

  // Sommeil : Julie dort de 22h à 8h (durée : 10 heures)
  sleepSchedule: {
    startHour: 22,  // Heure d'endormissement
    endHour: 8,     // Heure du réveil (du jour suivant)
    sleepDurationMs: IS_DEV 
      ? 10 * 60 * 1000        // DEV : 10 minutes réelles = une nuit
      : 10 * 60 * 60 * 1000,  // PROD : 10 heures réelles
  },

  // Durées par défaut pour les phases
  phases: {
    awake: {
      minDurationMs: IS_DEV 
        ? 5 * 60 * 1000        // DEV : 5 minutes
        : 1 * 60 * 60 * 1000,  // PROD : 1 heure
    },
  },

  // Pour déboguer les phases
  debugMode: false,
  devCommandsEnabled: IS_DEV,
};

export function getTimeMultiplier() {
  return TIME_CONFIG.timeMultiplier;
}

export function isDev() {
  return IS_DEV;
}

export function getBusyDurationMs(durationMinutes: number) {
  if (IS_DEV) {
    return DEV_BUSY_DURATION_MS[durationMinutes] ?? durationMinutes * 15 * 1000;
  }

  return durationMinutes * 60 * 1000 * TIME_CONFIG.timeMultiplier;
}
