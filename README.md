# Nutrition

PWA mobile-first de suivi nutritionnel et de recettes. 100 % locale : toutes les données restent sur l'appareil (IndexedDB via Dexie), avec sauvegarde/restauration en un fichier JSON.

## Lancer

```bash
npm install
npm run dev      # développement
npm run build    # export statique dans out/, hébergeable partout (Vercel, Netlify, GitHub Pages)
```

## Organisation

- `src/theme/` : palette, tokens sémantiques et thèmes. Aucun composant n'utilise de couleur en dur : pour changer de palette, modifier `themes.ts`.
- `src/lib/db.ts` : schéma Dexie. `src/lib/backup.ts` : export/import JSON.
- `public/sw.js` : service worker (hors-ligne).

## Avancement

- [x] Phase 1 : socle, PWA, thèmes clair/sombre, navigation
- [x] Phase 2 : base locale et sauvegarde JSON (export, import fusion/remplacement, rappel périodique)
- [ ] Phase 3 : aliments CIQUAL hors-ligne
- [ ] Phase 4 : saisie au journal
- [ ] Phase 5 : Open Food Facts et scanner
- [ ] Phase 6 : recettes
- [ ] Phase 7 : favoris et copie de la veille
- [ ] Phase 8 : objectifs et TDEE adaptatif
- [ ] Phase 9 : poids depuis Apple Santé
- [ ] Phase 10 : tableau de bord desktop
- [ ] Phase 11 : couleurs personnalisées
