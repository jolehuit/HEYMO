# Dev2 — API Integrations

## Fichiers modifies

| Fichier | Changement |
|---------|-----------|
| `agent/tools.py` | Linkup API (remboursements) + Thryve API (wearables) avec fallback mock |
| `agent/agent.py` | Ajout `send_sms_reminder()` + `get_patient_context()` function tools |

## Scripts de test

### 1. Tester Linkup (remboursements)
```bash
export LINKUP_API_KEY=your_key
python Dev2/test_linkup.py
```

### 2. Tester Thryve (wearables)
```bash
export THRYVE_API_KEY=your_key
export THRYVE_APP_ID=your_app_id
python Dev2/test_thryve.py
```

## Variables d'environnement requises (.env)

```
LINKUP_API_KEY=xxx      # Pour les donnees de remboursement
THRYVE_API_KEY=xxx      # Pour les donnees wearables
THRYVE_APP_ID=xxx       # App ID Thryve
```

## Comportement

- Si les API keys sont presentes et les APIs repondent → donnees reelles
- Si les API keys manquent ou les APIs echouent → fallback automatique sur mock data
- Le comportement est identique pour la demo dans les deux cas
