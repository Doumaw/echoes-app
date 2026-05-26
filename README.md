# Echoes

## Prérequis

- Node.js installé
- Expo Go installé sur le téléphone
- Expo Go à jour, compatible avec Expo SDK 54
- Une clé API OpenRouter

## Lancer l'application

Installe les dépendances :

```bash
npm install
```

Crée un fichier `.env` à la racine du projet :

```env
EXPO_PUBLIC_OPENROUTER_KEY=ta_cle_openrouter
```

Tu peux partir du modèle fourni :

```bash
cp .env.example .env
```

Sous Windows PowerShell :

```powershell
Copy-Item .env.example .env
```

Lance Expo :

```bash
npx expo start
```

Scanne le QR code avec Expo Go.

Si le téléphone ne charge pas l'application, essaie le mode tunnel :

```bash
npx expo start --tunnel
```

Si Expo garde un ancien cache ou affiche un comportement étrange :

```bash
npx expo start -c
```

## Commandes de démonstration

Ces commandes peuvent être envoyées directement dans le chat :

- `##reset` : remet la partie à zéro
- `##twist` : déclenche immédiatement la fin
- `##awake` : force le retour de Julie
- `##busy` : force Julie à passer hors ligne
- `##sleep` : force Julie à dormir
