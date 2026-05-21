export interface Message {
  id: string;
  text: string;
  createdAt: number;
  isUser: number; // 0 -> IA et 1 -> Joueur
  isIaRead: number; // 0 -> pas encore traité par Julie et 1 -> traité par Julie
}
