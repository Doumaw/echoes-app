import { DemoCommandAction } from "@/types/DemoCommandAction";

// Intro
export const FIRST_IA_MESSAGE = "Est-ce qu'il y a quelqu'un ?";

// Durées utiles 
export const MINUTE_MS = 60 * 1000;
const FIVE_MINUTES_MS = 5 * MINUTE_MS;
const HOUR_MS = 60 * 60 * 1000;
const THREE_HOURS_MS = 3 * HOUR_MS;
const FIVE_HOURS_MS = 5 * HOUR_MS;
const SIX_HOURS_MS = 6 * HOUR_MS;
const TEN_HOURS_MS = 10 * HOUR_MS;
const DAY_MS = 24 * HOUR_MS;
const THREE_DAYS_MS = 3 * DAY_MS;

// Sommeil
export const FIRST_SLEEP_AFTER_MS = SIX_HOURS_MS;
export const NEXT_SLEEP_MIN_DELAY_MS = SIX_HOURS_MS;
export const NEXT_SLEEP_MAX_DELAY_MS = TEN_HOURS_MS;
export const SLEEP_DURATION_MIN_MS = THREE_HOURS_MS;
export const SLEEP_DURATION_MAX_MS = FIVE_HOURS_MS;
export const DEMO_SLEEP_DURATION_MS = FIVE_MINUTES_MS;

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
export const PLOT_TWIST_AFTER_MS = THREE_DAYS_MS;
export const FINAL_TWIST_MESSAGES = [
  "... attends... il y a quelque chose plus haut... je vois une lumiere je crois...",
  "🔔 ALERTE INFO: Le corps d'une jeune fille disparue en 2016 a été retrouvé dans une vieille mine désaffectée des Ardennes.",
  "Les autorites confirment qu'il s'agirait de Julie M., 24 ans, disparue lors d'une randonnee en 2016.",
];

// Commandes de démonstration
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
