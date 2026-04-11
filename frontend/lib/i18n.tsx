/**
 * Lightweight i18n system — FR/EN
 * No external dependency, just React context + dictionaries.
 *
 * Owner: Dev 3
 */

"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Locale = "fr" | "en";

const dictionaries = {
  fr: {
    // PatientSelector
    "landing.subtitle": "Suivi vocal intelligent pour les membres santé.",
    "landing.cta_hint": "Sélectionnez un profil patient pour démarrer un appel.",
    "landing.start_call": "Démarrer l'appel",
    "landing.powered_by": "Propulsé par",
    "landing.years_old": "ans",

    // CallInterface — loading
    "call.connecting": "Maude se prépare...",
    "call.connecting_hint": "Cela peut prendre 10 à 15 secondes lors de la première connexion",
    "call.error_title": "Connexion échouée",
    "call.error_back": "Retour à la sélection",
    "call.generating_summary": "Maude rédige le résumé...",
    "call.generating_hint": "Analyse de la conversation et préparation du rapport",
    "call.skip": "Passer et revenir",

    // CallInterface — active
    "call.end": "Raccrocher",
    "call.conversation": "Conversation",
    "call.conversation_placeholder": "La conversation apparaîtra ici...",

    // Agent states
    "state.disconnected": "Déconnecté",
    "state.connecting": "Connexion...",
    "state.initializing": "Réveil de l'agent...",
    "state.idle": "Prêt",
    "state.listening": "Écoute",
    "state.thinking": "Réflexion...",
    "state.speaking": "Parle",
    "state.pre-connect-buffering": "Préparation...",
    "state.failed": "Échoué",

    // Alert levels
    "alert.green": "Tout va bien",
    "alert.orange": "Attention requise",
    "alert.red": "Urgent",
    "alert.label": "alerte",

    // Dashboard
    "dashboard.title": "Résumé de l'appel",
    "dashboard.new_call": "Nouvel appel",
    "dashboard.medications": "Médicaments",
    "dashboard.wearable": "Données santé",
    "dashboard.reimbursement": "Remboursement",
    "dashboard.actions": "Actions",
    "dashboard.days_remaining": "jours restants",
    "dashboard.done": "Terminé",
    "dashboard.in_progress": "En cours",
    "dashboard.baseline": "réf.",
    "dashboard.secu": "Sécurité sociale",
    "dashboard.out_of_pocket": "Reste à charge",
    "dashboard.direct_billing": "Tiers payant disponible — pas d'avance de frais",
    "dashboard.sms_sent": "SMS envoyé",
    "dashboard.scheduled": "Prévu le",
    "dashboard.resting_hr": "Fréquence cardiaque au repos",
    "dashboard.sleep": "Sommeil",
    "dashboard.steps": "Pas quotidiens",

    // Action types
    "action.appointment": "Rendez-vous",
    "action.followup_call": "Rappel",
    "action.flag": "Signalement",
    "action.sms_sent": "SMS envoyé",

    // Patient info sheet
    "patient.info": "Fiche patient",
    "patient.followup_booked": "✓ Réservé",
    "patient.followup_not_booked": "✗ Pas encore réservé",
    "patient.communication": "Style de communication",

    // Patient event types
    "event.Post-surgery": "Post-opératoire",
    "event.Chronic condition": "Maladie chronique",
    "event.Pregnancy": "Grossesse",

    // Patient descriptions
    "desc.Right knee arthroscopy": "Arthroscopie du genou droit",
    "desc.Type 2 diabetes follow-up": "Suivi diabète de type 2",
    "desc.Second trimester check-up (22 weeks)": "Suivi 2e trimestre (22 semaines)",
  },

  en: {
    // PatientSelector
    "landing.subtitle": "AI-powered voice follow-up for health members.",
    "landing.cta_hint": "Select a patient profile to start a care call.",
    "landing.start_call": "Start Call",
    "landing.powered_by": "Powered by",
    "landing.years_old": "years old",

    // CallInterface — loading
    "call.connecting": "Maude is getting ready...",
    "call.connecting_hint": "This may take 10-15 seconds on first connection",
    "call.error_title": "Connection failed",
    "call.error_back": "Back to patient selection",
    "call.generating_summary": "Maude is writing the summary...",
    "call.generating_hint": "Analyzing the conversation and preparing your report",
    "call.skip": "Skip and go back",

    // CallInterface — active
    "call.end": "End Call",
    "call.conversation": "Conversation",
    "call.conversation_placeholder": "Conversation will appear here...",

    // Agent states
    "state.disconnected": "Disconnected",
    "state.connecting": "Connecting...",
    "state.initializing": "Agent waking up...",
    "state.idle": "Ready",
    "state.listening": "Listening",
    "state.thinking": "Thinking...",
    "state.speaking": "Speaking",
    "state.pre-connect-buffering": "Buffering...",
    "state.failed": "Failed",

    // Alert levels
    "alert.green": "All Clear",
    "alert.orange": "Needs Attention",
    "alert.red": "Urgent",
    "alert.label": "alert",

    // Dashboard
    "dashboard.title": "Call Summary",
    "dashboard.new_call": "New Call",
    "dashboard.medications": "Medications",
    "dashboard.wearable": "Wearable Data",
    "dashboard.reimbursement": "Reimbursement",
    "dashboard.actions": "Actions",
    "dashboard.days_remaining": "days remaining",
    "dashboard.done": "Done",
    "dashboard.in_progress": "In progress",
    "dashboard.baseline": "baseline",
    "dashboard.secu": "Social security",
    "dashboard.out_of_pocket": "Out of pocket",
    "dashboard.direct_billing": "Direct billing available — no upfront cost",
    "dashboard.sms_sent": "SMS sent",
    "dashboard.scheduled": "Scheduled",
    "dashboard.resting_hr": "Resting Heart Rate",
    "dashboard.sleep": "Sleep",
    "dashboard.steps": "Daily Steps",

    // Action types
    "action.appointment": "Appointment",
    "action.followup_call": "Follow-up call",
    "action.flag": "Flag",
    "action.sms_sent": "SMS sent",

    // Patient info sheet
    "patient.info": "Patient Info",
    "patient.followup_booked": "✓ Booked",
    "patient.followup_not_booked": "✗ Not booked",
    "patient.communication": "Communication style",

    // Patient event types (identity — no translation needed)
    "event.Post-surgery": "Post-surgery",
    "event.Chronic condition": "Chronic condition",
    "event.Pregnancy": "Pregnancy",

    // Patient descriptions (identity)
    "desc.Right knee arthroscopy": "Right knee arthroscopy",
    "desc.Type 2 diabetes follow-up": "Type 2 diabetes follow-up",
    "desc.Second trimester check-up (22 weeks)": "Second trimester check-up (22 weeks)",
  },
} as const;

type TranslationKey = keyof typeof dictionaries.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  formatNumber: (n: number) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");

  const t = useCallback(
    (key: TranslationKey): string => {
      return dictionaries[locale][key] || dictionaries.en[key] || key;
    },
    [locale]
  );

  const formatNumber = useCallback(
    (n: number): string => {
      return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US").format(n);
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatNumber }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
