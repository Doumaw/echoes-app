/**
 * Configuration des durées du jeu
 * 
 * EN DEV : 1 heure réelle = 1 jour de jeu (pour tester rapidement)
 * EN PROD : Les durées réelles s'appliquent
 */

const IS_DEV = true; // À passer à false pour la production

export const TIME_CONFIG = {
  // Multiplicateur de temps : en DEV, 1 heure = 1 jour
  // En PROD, c'est 1x (temps réel)
  timeMultiplier: IS_DEV ? 24 : 1,

  // Durée totale du jeu avant plot twist (3 jours)
  plotTwistAfterMs: IS_DEV 
    ? 3 * 60 * 60 * 1000        // DEV : 3 heures réelles = 3 jours de jeu
    : 3 * 24 * 60 * 60 * 1000, // PROD : 3 jours réels

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
};

export function getTimeMultiplier() {
  return TIME_CONFIG.timeMultiplier;
}

export function isDev() {
  return IS_DEV;
}
