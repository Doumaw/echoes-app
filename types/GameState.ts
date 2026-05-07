export type JuliePhase = "awake" | "asleep" | "busy" | "finalTwist";

export interface GameState {
  hasSeenIntro: boolean;
  lastSeenTimestamp: number;
  scriptIndex: number;
  contactName: string;
  theme: "light" | "dark";
  iaStress: number;
  iaTrust: number;
  juliePhase: JuliePhase;
  julieWakeUpTime?: number;
  firstMessageTimestamp?: number;
}
