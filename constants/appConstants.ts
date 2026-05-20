// Intro
export const FIRST_IA_MESSAGE = {
  introStartMessage: "Est-ce qu'il y a quelqu'un ?",
};

// Sommeil
export const FIRST_SLEEP_AFTER_MS = 6 * 60 * 60 * 1000;
export const NEXT_SLEEP_MIN_DELAY_MS = 6 * 60 * 60 * 1000;
export const NEXT_SLEEP_MAX_DELAY_MS = 10 * 60 * 60 * 1000;
export const SLEEP_DURATION_MIN_MS = 3 * 60 * 60 * 1000;
export const SLEEP_DURATION_MAX_MS = 5 * 60 * 60 * 1000;
export const DEMO_SLEEP_DURATION_MS = 10 * 60 * 1000;

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

export const BUSY_RETURN_MESSAGES = [
  "je suis revenue... tu es toujours la ?",
  "j'ai repris le tel... je peux te reparler",
  "je suis la... j'ai fini ce que j'essayais de faire",
];

// Twist final
export const FINAL_TWIST_MESSAGES = [
  "... attends... il y a quelque chose plus haut... je vois une lumiere je crois...",
  "🔔 ALERTE INFO: Le corps d'une jeune fille disparue en 2016 a été retrouvé dans une vieille mine désaffectée des Ardennes.",
  "Les autorites confirment qu'il s'agirait de Julie M., 24 ans, disparue lors d'une randonnee en 2016.",
];

// Commandes de démonstration
export type DemoCommandAction = "twist" | "reset" | "awake" | "busy" | "sleep";

export const DEMO_COMMANDS: Record<string, DemoCommandAction> = {
  "##twist": "twist",
  "##reset": "reset",
  "##awake": "awake",
  "##busy": "busy",
  "##sleep": "sleep",
};

// IA
export const AI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const AI_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";
export const ALLOWED_AI_DURATIONS = [0, 5, 10, 15, 20] as const;
export const ALLOWED_AI_NEXT_SITUATIONS = ["leg_freed", null] as const;

// Stockage / base de données
export const GAME_STATE_STORAGE_KEY = "ECHOES_GAME_STATE";
export const DATABASE_VERSION = 1;

// Temps et rythme du jeu
export const TIME_CONFIG = {
  timeMultiplier: 1,
  plotTwistAfterMs: 3 * 24 * 60 * 60 * 1000,
};
