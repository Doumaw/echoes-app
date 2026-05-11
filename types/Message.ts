export interface Message {
  id: string;
  text: string;
  createdAt: number;
  isUser: number; // 0 (IA) ou 1 (Joueur)
  isRead: number; // 0 (non lu) ou 1 (lu) - pour les messages de Julie seulement
}
