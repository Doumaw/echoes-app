export interface Message {
  id: string;
  text: string;
  createdAt: number;
  isUser: number; // 0 (IA) ou 1 (Joueur)
}
