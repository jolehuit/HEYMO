# Script de Demo HeyMo — Sophie Martin

> Ce script guide le juge (qui joue Sophie) pour declencher toutes les fonctionnalites de Maude.
> Langue : **Francais** (selectionner FR avant de commencer)

---

## Avant la demo

1. Ouvrir `localhost:3000` en plein ecran
2. Verifier que la langue est sur **FR** (toggle en haut a droite)
3. L'ecran affiche l'app Alan — tab "Aujourd'hui"
4. Attendre 3-4 secondes → la notification de Maude apparait en bas
5. Cliquer **"Accepter"**

---

## Pendant l'appel — Reponses du juge (Sophie)

### Phase 1 — Ouverture (Maude parle en premier)

**Maude dit :** "Bonjour Sophie, c'est Maude, votre assistant sante Alan. Je vous appelle pour prendre de vos nouvelles apres votre arthroscopie du genou droit du 26 mars. Comment vous sentez-vous ?"

**Sophie repond :**
> "Bonjour Maude. Ca va un peu mieux mais j'ai encore mal au genou, surtout la nuit. J'ai du mal a dormir a cause de la douleur."

💡 **Ce que ca declenche :** Maude detecte la douleur + probleme de sommeil. Elle devrait utiliser `flag_alert` et proposer de parler a un medecin.

---

### Phase 2 — Medicaments

**Maude va demander pour les medicaments.**

**Sophie repond :**
> "Le Ketoprofen j'ai fini, ca allait. Par contre le Lovenox, les piqures c'est pas facile. J'ai des bleus au niveau du ventre. C'est normal ?"

💡 **Ce que ca declenche :**
- Maude appelle `get_side_effects` pour le Lovenox → confirme que les bleus sont un effet secondaire courant
- CTA "Effets secondaires" s'affiche a l'ecran pendant l'appel

---

### Phase 3 — Rendez-vous chirurgien

**Maude va demander si le suivi chirurgien est pris.**

**Sophie repond :**
> "Non, j'ai pas encore pris rendez-vous avec mon chirurgien. Je sais pas trop ou aller en fait."

💡 **Ce que ca declenche :**
- Maude appelle `find_nearby_provider("chirurgien orthopediste")` → recherche Linkup
- CTA "Chirurgien orthopediste — Paris 11e" s'affiche avec les resultats
- Maude propose d'afficher ca a l'ecran

**Sophie peut ajouter :**
> "Et il y a une pharmacie pas loin pour renouveler mon Lovenox ?"

💡 **Ce que ca declenche :**
- Maude appelle `find_nearby_provider("pharmacie")` → recherche Linkup
- CTA "Pharmacie — Paris 11e" s'affiche

---

### Phase 4 — Remboursement

**Sophie demande :**
> "D'ailleurs, est-ce que mon arthroscopie est bien remboursee ? Il me reste combien a payer ?"

💡 **Ce que ca declenche :**
- Maude appelle `get_reimbursement_info("arthroscopie genou")` → recherche Linkup
- CTA "Remboursement — arthroscopie genou" s'affiche avec le detail secu/alan/reste
- La section remboursement apparaitra dans le recap apres l'appel

---

### Phase 5 — Donnees sante (wearable)

**Si Maude n'en parle pas spontanement, Sophie peut demander :**
> "J'ai vu que je marchais beaucoup moins qu'avant, c'est normal ?"

💡 **Ce que ca declenche :**
- Maude mentionne les donnees wearable (pas/sommeil/FC)
- Elle peut proposer de voir les donnees a l'ecran

---

### Phase 6 — Mise en relation medecin

**Sophie dit :**
> "En fait je suis un peu inquiete pour la douleur la nuit. Est-ce que je pourrais en parler a un medecin ?"

💡 **Ce que ca declenche :**
- Maude appelle `connect_with_doctor("douleur post-operatoire nocturne")`
- CTA "Mise en relation avec un medecin" s'affiche
- La section "Parler a un medecin" apparaitra dans le recap avec le contexte de l'appel

---

### Phase 7 — Cloture

**Maude va faire un resume et proposer de raccrocher.**

**Sophie repond :**
> "Merci Maude, c'est tres utile. Bonne journee !"

**→ Cliquer le bouton rouge pour raccrocher**

---

## Apres l'appel — Ce qui s'affiche

### Ecran "Recapitulatif"

Le recap montre UNIQUEMENT ce qui a ete dit pendant l'appel :

1. **Resume de Maude** — resume automatique de la conversation
2. **Actions programmees** — RDV chirurgien (avec creneaux cliquables), rappel si cree
3. **Parler a un medecin** — si `connect_with_doctor` a ete appele → bouton "Demarrer le chat"
4. **Professionnels recommandes** — resultats Linkup (chirurgien, pharmacie) + medecins proches
5. **Remboursement** — secu/alan/reste a charge (si discute)
6. **Medicaments en cours** — Lovenox avec jours restants (cliquable pour voir dosage)
7. **Services Alan** — Teleconsult, Alan Map, Remboursements

### Chat medecin

Si on clique "Demarrer le chat" :
- Dr. Claire Morel apparait en ligne
- Elle a le contexte de l'appel Maude
- Elle commence par saluer Sophie et mentionner le resume

### Tab Maude (en bas de l'app)

Apres l'appel, cliquer sur l'avatar Maude dans la barre de navigation :
- Dernier appel avec date + resume
- Badge d'alerte (orange si douleur signalee)
- Actions en attente
- Medicaments en cours
- Donnees sante (BPM, sommeil, pas)

---

## Points cles pour les juges

| Fonctionnalite | Comment la montrer |
|---|---|
| **Integration app Alan** | L'appel arrive DANS l'app, pas en dehors |
| **Proactivite** | Maude appelle Sophie, pas l'inverse |
| **Tools en temps reel** | Les CTAs s'affichent pendant l'appel |
| **Medecins proches** | Linkup cherche des vrais praticiens |
| **Remboursement** | Chiffres concrets secu/alan |
| **Mise en relation medecin** | Transition fluide appel → chat |
| **Recap personalise** | Tout vient de l'appel, rien de generique |
| **Bilingue** | Switcher FR/EN avant l'appel |
| **Wearable** | Donnees sante mentionnees naturellement |
| **Post-appel** | Actions cliquables, creneaux, pharmacie |

---

## Si quelque chose ne marche pas

| Probleme | Solution |
|---|---|
| Maude ne parle pas | Attendre 15-20s (cold start LiveKit) |
| Pas de son | Verifier que le micro n'est pas mute dans le navigateur |
| Summary loading infini | Cliquer "Passer" — le recap sera genere par Mistral |
| Erreur de connexion | Rafraichir la page et recommencer |
| CTA ne s'affiche pas | Normal si l'agent n'a pas appele le tool correspondant |
