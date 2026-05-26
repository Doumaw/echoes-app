# Echoes

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

Lance l'application avec Expo :

```bash
npx expo start
```

## Commandes de démonstration

Ces commandes peuvent être envoyées directement dans le chat :

- `##reset` : remet la partie à zéro
- `##twist` : déclenche immédiatement la fin
- `##awake` : force le retour de Julie
- `##busy` : force Julie à passer hors ligne
- `##sleep` : force Julie à dormir
