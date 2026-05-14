/**
 * Configuration des durées du jeu en rythme réel.
 */

export const TIME_CONFIG = {
  timeMultiplier: 1,

  plotTwistAfterMs: 3 * 24 * 60 * 60 * 1000,

  sleepSchedule: {
    startHour: 22,
    endHour: 8,
    sleepDurationMs: 10 * 60 * 60 * 1000,
  },

  phases: {
    awake: {
      minDurationMs: 1 * 60 * 60 * 1000,
    },
  },

  debugMode: false,
};

export function getTimeMultiplier() {
  return TIME_CONFIG.timeMultiplier;
}

export function getBusyDurationMs(durationMinutes: number) {
  return durationMinutes * 60 * 1000 * TIME_CONFIG.timeMultiplier;
}
