// Script pour tester les données de reset
const initialState = {
  hasSeenIntro: false,
  lastSeenTimestamp: Date.now(),
  scriptIndex: 0,
  contactName: "Numéro Inconnu",
  theme: "dark",
  iaStress: 10,
  iaTrust: 50,
  juliePhase: "awake",
  julieWakeUpTime: undefined,
  firstMessageTimestamp: undefined,
};

console.log("Initial state for new game:");
console.log(JSON.stringify(initialState, null, 2));
