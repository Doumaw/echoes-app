export interface GameState {
  hasSeenIntro: boolean;
  lastSeenTimestamp: number;
  scriptIndex: number;
  contactName: string;
  theme: 'light' | 'dark';
  iaStress: number;
  iaTrust: number;
}