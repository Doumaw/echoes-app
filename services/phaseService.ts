import { TIME_CONFIG } from "@/constants/timeConfig";
import { GameState } from "@/types/GameState";
import { createInitialGameState } from "@/services/gameStateService";

export const FINAL_TWIST_MESSAGES = [
  "... attends... il y a quelque chose plus haut... je vois une lumiere je crois...",
  "🔔 ALERTE INFO: Le corps d'une jeune fille disparue en 2016 a été retrouvé dans une vieille mine désaffectée des Ardennes.",
  "Les autorites confirment qu'il s'agirait de Julie M., 24 ans, disparue lors d'une randonnee en 2016.",
];

export const SLEEP_START_MESSAGES = [
  "j'arrive plus a garder les yeux ouverts... je pose le tel un moment...",
  "je tremble trop... je vais fermer les yeux un peu sinon je craque...",
  "je suis epuisee... je garde le tel contre moi mais je vais essayer de dormir un peu...",
];

export const SLEEP_END_MESSAGES = [
  "je me suis assoupie... je suis la... il fait encore plus froid maintenant",
  "je me suis reveillee en sursaut... j'ai cru entendre quelque chose...",
  "je suis reveillee... j'ai mal partout... mais je suis encore la",
];

export function pickRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getCurrentGameHour() {
  const now = new Date();
  const timeMs =
    now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000;
  return ((timeMs * TIME_CONFIG.timeMultiplier) / (60 * 60 * 1000)) % 24;
}

export function shouldJulieBeAsleep() {
  const currentHour = getCurrentGameHour();
  const { startHour, endHour } = TIME_CONFIG.sleepSchedule;

  if (startHour > endHour) {
    return currentHour >= startHour || currentHour < endHour;
  }

  return currentHour >= startHour && currentHour < endHour;
}

export function getNextWakeUpTime() {
  const { endHour } = TIME_CONFIG.sleepSchedule;
  const now = new Date();
  const wakeUpTime = new Date(now);
  wakeUpTime.setHours(endHour, 0, 0, 0);

  if (wakeUpTime <= now) {
    wakeUpTime.setDate(wakeUpTime.getDate() + 1);
  }

  return wakeUpTime.getTime();
}

export function shouldTriggerFinalTwist(gameState: GameState, now: number) {
  return Boolean(
    gameState.firstMessageTimestamp &&
      now - gameState.firstMessageTimestamp > TIME_CONFIG.plotTwistAfterMs &&
      gameState.juliePhase !== "finalTwist",
  );
}

export function shouldWakeFromBusy(gameState: GameState, now: number) {
  return Boolean(
    gameState.juliePhase === "busy" &&
      gameState.julieBusyUntil &&
      now >= gameState.julieBusyUntil,
  );
}

export function shouldWakeFromSleep(gameState: GameState, now: number) {
  return Boolean(
    gameState.juliePhase === "asleep" &&
      gameState.julieWakeUpTime &&
      now >= gameState.julieWakeUpTime,
  );
}

export function createResetGameState(gameState: GameState | null) {
  return createInitialGameState({
    contactName: gameState?.contactName,
    theme: gameState?.theme,
  });
}
