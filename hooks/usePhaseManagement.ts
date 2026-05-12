import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";
import { TIME_CONFIG } from "../constants/timeConfig";
import { GameState } from "../types/GameState";
import { Message } from "../types/Message";

const FINAL_TWIST_MESSAGE =
  "🔔 ALERTE: Le corps d'une jeune fille disparue en 2016 a été retrouvé dans une vieille mine désaffectée.";

/**
 * Hook pour gérer :
 * - Les transitions de phase (awake -> asleep/busy -> awake)
 * - Le sommeil automatique (22h-8h)
 * - Le système de busy avec timer
 * - Le traitement de la file d'attente des messages
 */
export function usePhaseManagement(
  gameState: GameState | null,
  saveGameState: (updates: Partial<GameState>) => Promise<void>,
) {
  const db = useSQLiteContext();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerFinalTwist = useCallback(async () => {
    await saveGameState({
      juliePhase: "finalTwist",
      julieBusyUntil: undefined,
      julieWakeUpTime: undefined,
      busyReason: undefined,
      pendingMessageIds: [],
    });

    await db.runAsync(
      `INSERT INTO messages (id, text, createdAt, isUser, isRead) VALUES (?, ?, ?, ?, ?)`,
      [Date.now().toString(), FINAL_TWIST_MESSAGE, Date.now(), 0, 1],
    );
  }, [db, saveGameState]);

  const resetGame = useCallback(async () => {
    await db.runAsync("DELETE FROM messages");
    await saveGameState({
      hasSeenIntro: false,
      lastSeenTimestamp: Date.now(),
      scriptIndex: 0,
      contactName: gameState?.contactName || "Numéro Inconnu",
      theme: gameState?.theme || "dark",
      iaStress: 10,
      iaTrust: 50,
      juliePhase: "awake",
      julieSituation: "trapped",
      julieWakeUpTime: undefined,
      julieBusyUntil: undefined,
      busyReason: undefined,
      firstMessageTimestamp: undefined,
      pendingMessageIds: [],
    });
  }, [db, gameState?.contactName, gameState?.theme, saveGameState]);

  /**
   * Marquer les messages de Julie comme "lus"
   */
  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    try {
      const placeholders = messageIds.map(() => "?").join(",");
      await db.runAsync(
        `UPDATE messages SET isRead = 1 WHERE id IN (${placeholders})`,
        messageIds,
      );
    } catch (error) {
      console.error("Erreur marquage messages lus", error);
    }
  }, [db]);

  /**
   * Obtenir l'heure actuelle du jour (heure de jeu affectée par le multiplicateur)
   */
  const getCurrentGameHour = useCallback((): number => {
    const now = new Date();
    const timeMs = now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000;
    return (timeMs * TIME_CONFIG.timeMultiplier) / (60 * 60 * 1000) % 24;
  }, []);

  /**
   * Vérifier si Julie doit être endormie selon son horaire (22h-8h)
   */
  const shouldJulieBeAsleep = useCallback((): boolean => {
    const currentHour = getCurrentGameHour();
    const { startHour, endHour } = TIME_CONFIG.sleepSchedule;
    
    // Si startHour > endHour (ex: 22-8), c'est une plage nocturne
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    }
    return currentHour >= startHour && currentHour < endHour;
  }, [getCurrentGameHour]);

  /**
   * Calculer quand Julie doit se réveiller
   */
  const getNextWakeUpTime = useCallback((): number => {
    const { endHour } = TIME_CONFIG.sleepSchedule;
    const now = new Date();
    const wakeUpTime = new Date(now);
    wakeUpTime.setHours(endHour, 0, 0, 0);

    // Si l'heure de réveil a déjà passé aujourd'hui, c'est demain
    if (wakeUpTime <= now) {
      wakeUpTime.setDate(wakeUpTime.getDate() + 1);
    }

    return wakeUpTime.getTime();
  }, []);

  /**
   * Passer Julie en mode "busy" avec durée
   */
  const setBusy = useCallback(
    async (durationMinutes: number, reason?: string) => {
      if (!gameState) return;
      
      const now = Date.now();
      // Appliquer le multiplicateur de temps pour obtenir la vraie durée
      const actualDurationMs = durationMinutes * 60 * 1000 * TIME_CONFIG.timeMultiplier;
      const busynessUntil = now + actualDurationMs;

      await saveGameState({
        juliePhase: "busy",
        julieBusyUntil: busynessUntil,
        busyReason: reason,
      });
    },
    [gameState, saveGameState],
  );

  /**
   * Vérifier et mettre à jour les transitions de phase
   * Ne pas appliquer le sommeil automatique si hasSeenIntro est false (début du jeu)
   */
  const checkPhaseTransitions = useCallback(async () => {
    if (!gameState) return;

    const now = Date.now();
    const {
      juliePhase,
      julieBusyUntil,
      julieWakeUpTime,
      firstMessageTimestamp,
      hasSeenIntro,
    } = gameState;

    // Plot twist après 3 jours
    if (
      firstMessageTimestamp &&
      now - firstMessageTimestamp > TIME_CONFIG.plotTwistAfterMs &&
      juliePhase !== "finalTwist"
    ) {
      console.log("[usePhaseManagement] Plot twist triggered!");
      await triggerFinalTwist();
      return;
    }

    // Fin du mode busy
    if (juliePhase === "busy" && julieBusyUntil && now >= julieBusyUntil) {
      console.log("[usePhaseManagement] Busy ended, Julie is awake");
      await saveGameState({
        juliePhase: "awake",
        julieBusyUntil: undefined,
        busyReason: undefined,
      });
      return;
    }

    // Fin du sommeil
    if (
      juliePhase === "asleep" &&
      julieWakeUpTime &&
      now >= julieWakeUpTime
    ) {
      console.log("[usePhaseManagement] Julie woke up");
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
      });
      return;
    }

    // Sommeil automatique SEULEMENT après le premier message (hasSeenIntro = true)
    // DÉSACTIVÉ POUR LE MVP
    /*
    if (hasSeenIntro && juliePhase === "awake" && shouldJulieBeAsleep()) {
      console.log("[usePhaseManagement] Time to sleep (22h+)");
      const wakeUpTime = getNextWakeUpTime();
      await saveGameState({
        juliePhase: "asleep",
        julieWakeUpTime: wakeUpTime,
      });
      return;
    }
    */

    // Réveil automatique selon l'horaire
    if (juliePhase === "asleep" && !shouldJulieBeAsleep()) {
      console.log("[usePhaseManagement] Time to wake up");
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
      });
    }
  }, [gameState, saveGameState, shouldJulieBeAsleep, getNextWakeUpTime, triggerFinalTwist]);

  /**
   * Setup du timer pour vérifier les transitions régulièrement
   */
  useEffect(() => {
    checkPhaseTransitions();

    // Vérifier toutes les 10 secondes
    timerRef.current = setInterval(checkPhaseTransitions, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkPhaseTransitions]);

  return {
    setBusy,
    markMessagesAsRead,
    checkPhaseTransitions,
    shouldJulieBeAsleep,
    getCurrentGameHour,
    triggerFinalTwist,
    resetGame,
  };
}
