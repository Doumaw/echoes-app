export interface Message {
  id: string;
  text: string;
  createdAt: number;
  isUser: number; // 0 (Julie) ou 1 (Joueur)
}
