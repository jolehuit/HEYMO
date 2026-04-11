# HEYMO Frontend — Plan de travail Dev 3

## Regles de travail

- **Scope**: Uniquement `frontend/` — ne jamais toucher `agent/`, `Documentation/`, `pitch/`
- **Changements structurels/logique**: Toujours proposer AVANT d'appliquer (quoi, pourquoi, impact)
- **Changements UI/UX/styling**: Peuvent etre appliques directement
- **Tests**: Tester chaque fonctionnalite visuellement avant de passer a la suivante
- **Brand**: Respecter strictement la charte graphique Alan (voir palette ci-dessous)
- **Git**: Commits atomiques par fonctionnalite

---

## Palette Alan officielle

| Role | Couleur | Hex |
|------|---------|-----|
| Primary CTA / Accent | Java Green | `#22E39E` |
| Secondary Accent | Dodger Blue | `#2E94FA` |
| Accent chaud | Persimmon Orange | `#FF7045` |
| Dark Primary | Deep Teal | `#083749` |
| Text Dark | Mine Shaft | `#302929` |
| Background | White | `#FFFFFF` |
| Background Light | Off-white | `#F9F9F9` |
| Gray | Light Gray | `#F2F2F2` |

> **IMPORTANT**: Le CSS actuel utilise du violet (#5b21b6) — ce n'est PAS Alan. Alan = vert + bleu.

---

## Fonctionnalites (ordre de priorite)

### F1 — Refonte charte graphique Alan (globals.css + layout)
> Fondation pour tout le reste

- [ ] Remplacer les CSS variables par les vraies couleurs Alan
- [ ] Passer en theme clair (fond blanc/creme, pas dark mode slate)
- [ ] Appliquer la typographie system-ui Alan
- [ ] Ajouter le logo Alan dans le layout (header)
- [ ] Definir les classes utilitaires recurrentes

### F2 — PatientSelector (landing page)
> Premier ecran vu par les juges

- [ ] Redesign des cartes patients avec style Alan (warm, friendly)
- [ ] Header avec branding Alan + titre "HeyMo"
- [ ] Gradient/couleurs par type de plan (Alan Green / Alan Blue)
- [ ] Animations d'entree fluides
- [ ] Responsive (mobile-first)
- [ ] Hover states et feedback visuel

### F3 — CallInterface (ecran d'appel)
> Coeur de la demo

- [ ] Animation de chargement branded pendant le cold start (10-20s)
- [ ] Visualiseur audio ameliore (waveform style Alan)
- [ ] Affichage patient + etat avec icones et couleurs
- [ ] Transcription live stylisee
- [ ] Alertes prominentes avec icones (orange/red)
- [ ] Bouton fin d'appel bien visible
- [ ] Transitions d'etat fluides (connecting → active → ended)

### F4 — Dashboard (resume post-appel)
> Ce que le juge voit apres l'appel — doit impressionner

- [ ] Card medications avec indicateurs visuels (progress bars, pills)
- [ ] Card wearables avec fleches de tendance, badges de risque
- [ ] Card remboursement avec breakdown visuel (secu/alan/reste)
- [ ] Card actions avec icones par type, badges SMS, dates
- [ ] Badge niveau d'alerte (vert/orange/rouge) bien visible
- [ ] Layout 2 colonnes optimise
- [ ] Bouton "Nouvel appel" pour revenir a la selection

### F5 — Polish UX global
> Finitions

- [ ] Micro-animations et transitions entre pages
- [ ] Loading states coherents
- [ ] Messages d'erreur user-friendly
- [ ] Accessibilite (contrast, focus states)
- [ ] Favicon + meta tags Alan
