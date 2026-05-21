export type JuliePhase = "awake" | "asleep" | "busy" | "finalTwist";

export type JulieSituation = "trapped" | "leg_freed";

export interface GameState {
  hasSeenIntro: boolean;
  contactName: string;
  theme: "light" | "dark";
  iaStress: number;
  iaTrust: number;
  juliePhase: JuliePhase;
  julieSituation: JulieSituation;
  julieWakeUpTime?: number;
  nextSleepAt?: number;
  julieBusyUntil?: number; 
  busyReason?: string; 
  firstMessageTimestamp?: number;
  pendingMessageIds?: string[]; 
}
