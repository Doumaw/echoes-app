export interface Message {
  id: string;
  text: string;
  createdAt: number;
  isUser: number; // 0 (IA) ou 1 (Joueur)
  isRead: number; // 0 (pas encore traité par Julie / pas encore vu), 1 (traité / vu)
}
