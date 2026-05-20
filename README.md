# Echoes

Echoes est un MVP de jeu narratif sous forme de messagerie, développé avec React Native et Expo.

Le joueur échange avec Julie, une jeune femme piégée dans une crevasse. Le but est de créer une expérience immersive, proche d'une vraie application de chat, avec des réponses dynamiques, des périodes hors ligne, du sommeil, des actions différées et un twist final commun.

## Fonctionnement

- messages stockés localement en SQLite
- état global du jeu stocké en AsyncStorage
- réponses générées par IA via OpenRouter
- système de phases pour Julie : disponible, occupée, endormie, fin de jeu
- thème sombre / clair
- commandes de démonstration pour accélérer certains états pendant la soutenance

## Lancer le projet

```bash
npm install
npx expo start
```

## Structure du projet

- `app/` : écrans
- `components/` : composants UI
- `hooks/` : logique React
- `services/` : logique métier, stockage, IA
- `constants/` : constantes globales
- `types/` : types TypeScript

## Commandes de démonstration

- `##reset` : remet la partie à zéro
- `##twist` : déclenche immédiatement la fin
- `##awake` : force le retour de Julie
- `##busy` : force Julie à passer hors ligne
- `##sleep` : force Julie à dormir

## Remarques

Le projet est pensé comme un MVP étudiant : l'objectif principal est l'immersion, la clarté de l'architecture et la démonstration d'un flux narratif interactif crédible.
