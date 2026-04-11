# Plan d'action — Retour Alan

> Feedback reçu le 11 avril 2026. Ce plan adresse les 7 points remontés par l'équipe Alan.

## Contexte — Le feedback Alan

1. Il faut s'intégrer à **tous les services Alan** (cliniques, partenaires pro, etc.)
2. Il faut que ça s'intègre totalement à **MO** (l'app Alan)
3. Il faut des **call to actions** pour l'utilisateur après l'appel
4. Il faut penser **intégration à ce qu'Alan fait déjà**
5. Il faut penser à **après l'appel** — suivi dans l'app, propositions
6. Il faut **penser utilisateur**
7. L'appel doit être **comme si c'était notre mère qui nous appelait** — bienveillant, humain, Alan

## État actuel des branches

| Branche | Contenu |
|---|---|
| `main` | Agent complet (Maude, bilingue FR/EN, LemonSlice avatar, LLM summary, live alerts, auto-hangup 3min). Frontend d'origine (PatientSelector → Call → Dashboard admin). |
| `claude/voice-ai-health-followup-YTtvx` | = main + gros ajouts frontend : PhoneNotification post-appel, PatientActions avec CTAs, flow notification → actions → dashboard, i18n FR/EN complet, LanguageSelector, patient info sheet pendant l'appel, auto-translate, summary timeout. |
| `dev2` | Agent régressé (pas Maude, pas bilingue, pas avatar). MAIS 2 tools neufs : `find_nearby_provider` (Linkup) + `request_teleconsultation`. Champ `location` dans patients.json. |

## Utilisation actuelle de Linkup

Linkup est un moteur de recherche web temps réel pour LLMs. Actuellement utilisé pour **une seule chose** : chercher les taux de remboursement sécu (`tools.py` → `get_reimbursement_info`). La branche dev2 ajoute un 2e usage (recherche de praticiens) non mergé.

Linkup peut chercher sur le web mais **ne peut pas interagir** avec des systèmes (pas de prise de RDV, pas d'accès aux comptes membres). Pour les données services Alan, on utilise des données statiques enrichies dans `patients.json` + Linkup en complément pour le dynamique.

## Écosystème Alan — Ce qu'on doit connaître

L'app Alan (ce qu'ils appellent "MO" en interne) comprend :

| Service | Description |
|---|---|
| **Mo** | Assistant IA chat intégré (9h-23h). Répond aux questions santé, validé par un médecin sous 15min. 81% d'adoption, 4.6/5. Notre projet Maude = l'extension vocale proactive de Mo. |
| **Clinique Alan** | Chat/vidéo avec généralistes, psychologues, pédiatres, kinés, diététiciens, sexologues, dermato. Sans RDV, sans reste à charge, 7j/7. |
| **Alan Map** | Carte interactive de praticiens. Filtres par spécialité, estimation remboursement, indication tiers-payant. |
| **Téléconsultation** | Via Livi. Ordonnance possible. Incluse dans Alan Blue. |
| **Remboursements** | Fil chronologique (part Sécu / Alan / reste à charge). Envoi facture par photo. Virement instantané. 90% en < 24h. |
| **Carte tiers-payant** | Dématérialisée, QR code, ajout Apple/Google Wallet. Valide en pharmacie. |
| **Alan Play** | Gamification santé : marche, méditation, berries (points), défis entre collègues, niveaux. Lancé mai 2025. |
| **Alan Walk** | Compteur de pas gamifié. Berries convertibles en dons ou réductions Alan Shop. |
| **Alan Shop** | Marketplace santé/bien-être. Withings, Biolane, etc. Catégories : nutrition, sommeil, stress, fertilité. Tarifs préférentiels membres. |

Services arrêtés : Alan Baby (fermé fév. 2022), Alan Mind (intégré dans Clinique Alan — psychologues).

---

## 0. Merge et stabilisation

| # | Tâche | Détail |
|---|---|---|
| 0.1 | Merger `claude/` → `main` | La base. Tout le frontend amélioré est sur cette branche. |
| 0.2 | Cherry-pick les 2 tools de `dev2` | `find_nearby_provider` + `request_teleconsultation` dans `agent.py` de main. Ne PAS prendre le reste de dev2 (régressions agent). |
| 0.3 | Ajouter `location` dans `patients.json` | `"location": "Paris 15e"` pour chaque patient (utilisé par `find_nearby_provider`). |
| 0.4 | Tester le flow complet | Agent deploy + frontend deploy. Vérifier : sélection patient → appel → notification → actions → dashboard. |

---

## 1. Vue pré-appel "App Alan" (intégration MO)

> Répond au feedback : "Il faut que ça s'intègre totalement à MO" + "Penser utilisateur"

**Problème** : L'entrée actuelle est un PatientSelector de hackathon. Le juge Alan ne voit pas comment ça s'intègre dans leur app.

**Solution** : Ajouter un mockup d'écran d'accueil Alan entre la sélection patient et l'appel, avec une notification entrante "Maude souhaite vous appeler".

### Flow cible

```
PatientSelector (choix scénario, pour la démo)
  → Écran "App Alan" (mockup accueil MO)
    → Notification entrante "Maude souhaite prendre de vos nouvelles"
      → [Accepter l'appel] [Programmer un créneau] [Préférer le chat]
        → Call
          → Notification sortante (déjà fait)
            → Actions patient (déjà fait)
              → Dashboard admin (déjà fait)
```

### Sous-tâches

| # | Tâche | Fichier |
|---|---|---|
| 1.1 | Composant `AlanHomeScreen` | Nouveau `components/AlanHomeScreen.tsx` — Mockup écran accueil Alan : header "Alan", carte tiers-payant simplifiée, section Mo, berries. Design inspiré App Store screenshots. |
| 1.2 | Composant `IncomingCallNotification` | Nouveau `components/IncomingCallNotification.tsx` — Notification push : "Maude — Suivi santé. Suite à votre arthroscopie du 26 mars. [Accepter] [Reporter] [Chat]" |
| 1.3 | Rewire le flow | `app/page.tsx` — PatientSelector → AlanHomeScreen → IncomingCallNotification → CallInterface → ... |
| 1.4 | i18n | `lib/i18n.tsx` — Ajouter les traductions pour les nouveaux écrans. |

---

## 2. CTAs contextuels post-appel

> Répond au feedback : "Call to actions pour l'utilisateur" + "Après l'appel, qu'est-ce que ça a rajouté"

**Problème** : PatientActions (branche claude/) a 2 boutons génériques ("Téléconsultation", "Mon espace Alan") + des créneaux mockés. Ça ne reflète pas ce qui s'est dit pendant l'appel et ça ne pointe pas vers les vrais services Alan.

**Solution** : Générer des CTAs dynamiques à partir du `CallSummary`, mappés aux services Alan.

### Exemples de CTAs par patient

**Sophie (post-chirurgie genou)** :
- "Trouver un kiné sur Alan Map" → lien Alan Map filtré kiné + Paris 15e
- "Renouveler Lovenox" → lien Clinique Alan (renouvellement ordonnance)
- "RDV chirurgien avant le 25 avril" → créneaux proposés
- "Remboursement arthroscopie" → lien détail remboursement

**Marc (diabète)** :
- "Prise de sang avant le 15 mai" → lien Alan Map labo + Paris 12e
- "Voir mes résultats HbA1c" → lien espace santé
- "Glucomètre connecté" → lien Alan Shop (Withings)

**Lea (grossesse)** :
- "RDV écho morpho avant le 20 avril" → créneaux proposés
- "RDV test glucose avant le 30 avril" → créneaux proposés
- "Programme grossesse Alan" → lien programme dédié

### Sous-tâches

| # | Tâche | Fichier |
|---|---|---|
| 2.1 | Enrichir le type `Action` | `lib/types.ts` — Ajouter `cta?: { label: string; url: string; service: "alan_map" \| "clinique_alan" \| "teleconsult" \| "reimbursement" \| "alan_shop" }` |
| 2.2 | Logique de CTAs côté agent | `agent.py` → `generate_summary()` — Générer des CTAs à partir des actions de l'appel + profil patient. |
| 2.3 | Mapping services Alan | Nouveau `lib/alanServices.ts` — Mapping : spécialité → URL Alan Map, type d'action → deeplink, etc. |
| 2.4 | Refonte PatientActions | `components/PatientActions.tsx` — Sections : résumé Maude, prochaines étapes (CTAs dynamiques), services Alan recommandés, feedback. |

---

## 3. Enrichir les données patient avec les services Alan

> Répond au feedback : "S'intégrer à tous les services" + "Penser intégration à ce qu'Alan fait déjà"

**Problème** : `patients.json` ne contient que des données médicales. L'agent ne connaît aucun service Alan.

**Solution** : Ajouter un bloc `alan_services` par patient + un catalogue global.

### Sous-tâches

| # | Tâche | Fichier |
|---|---|---|
| 3.1 | Ajouter `location` | `patients.json` — `"location": "Paris 15e"` par patient |
| 3.2 | Ajouter `alan_services` par patient | `patients.json` — Bloc contextuel (voir exemple ci-dessous) |
| 3.3 | Catalogue global services | Nouveau `agent/alan_services.json` — Tous les services Alan avec descriptions FR/EN |
| 3.4 | Injecter dans le system prompt | `playbook.py` → `build_system_prompt()` — Nouvelle section `SERVICES ALAN DISPONIBLES` |

### Exemple `alan_services` pour Sophie

```json
"alan_services": {
  "clinique_alan": {
    "relevant_specialists": ["kinésithérapeute", "médecin généraliste"],
    "description_fr": "Consultez sans rendez-vous, 7j/7, sans reste à charge"
  },
  "alan_map_nearby": [
    {"specialty": "Chirurgien orthopédiste", "name": "Dr. Petit", "address": "Paris 15e", "tiers_payant": true},
    {"specialty": "Kinésithérapeute", "name": "Cabinet Mouvement", "address": "Paris 15e", "tiers_payant": true}
  ],
  "teleconsultation": {
    "included": true,
    "wait_time": "< 30 min"
  },
  "programmes": [
    {"name": "Retour actif post-chirurgie", "type": "rééducation"}
  ],
  "alan_shop": [
    {"product": "Genouillère Thuasne", "category": "confort", "discount": "15%"}
  ]
}
```

---

## 4. Réécriture du playbook — ton "empathie maman"

> Répond au feedback : "Un appel comme si c'était notre mère qui nous appelait"

**Problème** : Le playbook actuel est un script en 7 étapes chronométrées. C'est structuré mais mécanique. Pas le ton d'une personne qui se soucie de vous.

**Solution** : Réécrire le playbook avec une approche conversationnelle guidée par l'empathie.

### Principes

| Comportement "maman" | Traduction agent |
|---|---|
| Elle ne suit pas un script | Flow libre guidé par des intentions, pas des étapes |
| Elle rebondit sur ce que tu dis | Si le patient dit qu'il dort mal → creuser, pas passer aux médicaments |
| Elle se souvient | "La dernière fois le Ketoprofen vous donnait mal à l'estomac, ça va mieux ?" |
| Elle donne des conseils pratiques | "Mettez un coussin sous le genou la nuit" (tips validés, pas du médical) |
| Elle propose de l'aide concrète | "Je peux vous envoyer le lien pour prendre RDV" (pas juste "vous devriez") |
| Elle ne pose pas 15 questions | Elle demande comment tu vas, VRAIMENT, et le reste vient naturellement |

### Sous-tâches

| # | Tâche | Fichier |
|---|---|---|
| 4.1 | Réécrire IDENTITY | `playbook.py` — "Tu appelles [prénom] comme une amie bienveillante. Pas un script, une conversation." |
| 4.2 | Remplacer les steps par des intentions | `playbook.py` — Au lieu de "Step 3 — MEDICATIONS (30s)" → "Si c'est le bon moment, demande naturellement comment ça se passe avec le traitement." |
| 4.3 | Ajouter section services Alan | `playbook.py` — "Quand tu peux aider concrètement, propose un service Alan : Clinique pour parler à un médecin, Alan Map pour trouver un praticien, SMS rappel pour un RDV." |
| 4.4 | Ajouter le "proposer, pas informer" | `playbook.py` — "Ne dis pas 'vous devriez prendre RDV'. Dis 'je vous envoie le lien tout de suite ?'. Chaque problème = une action concrète que TU proposes." |

---

## 5. Tools agent — services Alan

> Répond au feedback : "S'intégrer à tous les services"

### Sous-tâches

| # | Tâche | Fichier |
|---|---|---|
| 5.1 | Merger `find_nearby_provider` depuis dev2 | `agent.py` — Recherche Linkup de praticiens + mention Alan Map/tiers-payant |
| 5.2 | Merger `request_teleconsultation` depuis dev2 | `agent.py` — Déclenchement téléconsult Alan |
| 5.3 | Nouveau tool `recommend_alan_service` | `agent.py` — Retourne les services Alan pertinents depuis le bloc `alan_services` du patient |
| 5.4 | (Bonus) Tool `search_alan_info` | `agent.py` — Linkup query sur `alan.com` pour les questions hors scope des données statiques |

---

## 6. Feedback utilisateur

| # | Tâche | Fichier |
|---|---|---|
| 6.1 | Composant feedback | `PatientActions.tsx` — En bas : "Cet appel vous a été utile ? [👍] [👎]" + commentaire optionnel |
| 6.2 | Type feedback | `lib/types.ts` — `feedback?: { helpful: boolean; comment?: string }` dans CallSummary |

---

## 7. Dashboard admin amélioré

| # | Tâche | Fichier |
|---|---|---|
| 7.1 | Traduire en FR | `Dashboard.tsx` — Utiliser le système i18n existant |
| 7.2 | Section "CTAs envoyés" | `Dashboard.tsx` — Montrer quels CTAs ont été envoyés au patient |
| 7.3 | Transcript complet | `Dashboard.tsx` — Option dépliable pour la conversation |

---

## Priorisation

```
CRITIQUE — Sans ça la démo rate le feedback Alan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  0. Merge claude/ + cherry-pick dev2 tools
  4. Playbook empathie "maman"
  1. Vue pré-appel "App Alan" (mockup MO)
  3. Enrichir patients.json avec services Alan

IMPORTANT — Rend la démo crédible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. CTAs contextuels dynamiques
  5. Tools services Alan dans l'agent
  4.3 Services Alan dans le playbook

BONUS — Polish
━━━━━━━━━━━━━
  6. Feedback utilisateur
  7. Dashboard admin traduit + enrichi
```

### Chemin critique

```
0 (merge) → 4 (playbook) → 1 (vue pré-appel) → 3 (données services) → 2 (CTAs dynamiques)
```

Le merge débloque tout. Le playbook change l'impression immédiatement (c'est du texte). La vue pré-appel montre l'intégration MO. Les données services alimentent les CTAs.
