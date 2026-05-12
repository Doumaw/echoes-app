export type JuliePhase = "awake" | "asleep" | "busy" | "finalTwist";

export type JulieSituation = "trapped" | "leg_freed" | "climbing" | "escaped";

export interface GameState {
  hasSeenIntro: boolean;
  lastSeenTimestamp: number;
  scriptIndex: number;
  contactName: string;
  theme: "light" | "dark";
  iaStress: number;
  iaTrust: number;
  juliePhase: JuliePhase;
  julieSituation: JulieSituation;
  julieWakeUpTime?: number;
  julieBusyUntil?: number; // Timestamp quand Julie redevient disponible
  busyReason?: string; // Optionnel : ce que Julie est en train de faire
  firstMessageTimestamp?: number;
  pendingMessageIds?: string[]; // IDs des messages en attente de traitement
}
