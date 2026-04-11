/**
 * Hook to auto-translate dynamic content (CallSummary) via Mistral.
 * Only translates when locale differs from the source language (en).
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect } from "react";
import { CallSummary } from "@/lib/types";
import { Locale } from "@/lib/i18n";

interface TranslatableFields {
  summary: string;
  patient_state: {
    pain_level: string;
    mood: string;
    general: string;
  };
  medications: { name: string; compliance: string }[];
  actions: { description: string }[];
  risk_patterns: string[];
  procedure: string | null;
}

function extractTranslatable(s: CallSummary): TranslatableFields {
  return {
    summary: s.summary,
    patient_state: s.patient_state,
    medications: s.medications_status.map((m) => ({
      name: m.name,
      compliance: m.compliance,
    })),
    actions: s.actions.map((a) => ({ description: a.description })),
    risk_patterns: s.wearable_highlights?.risk_patterns || [],
    procedure: s.reimbursement_discussed?.procedure || null,
  };
}

function applyTranslation(original: CallSummary, translated: TranslatableFields): CallSummary {
  return {
    ...original,
    summary: translated.summary ?? original.summary,
    patient_state: translated.patient_state ?? original.patient_state,
    medications_status: original.medications_status.map((m, i) => ({
      ...m,
      name: translated.medications?.[i]?.name ?? m.name,
      compliance: translated.medications?.[i]?.compliance ?? m.compliance,
    })),
    actions: original.actions.map((a, i) => ({
      ...a,
      description: translated.actions?.[i]?.description ?? a.description,
    })),
    wearable_highlights: {
      ...original.wearable_highlights,
      risk_patterns: translated.risk_patterns ?? original.wearable_highlights?.risk_patterns ?? [],
    },
    reimbursement_discussed: original.reimbursement_discussed
      ? {
          ...original.reimbursement_discussed,
          procedure: translated.procedure ?? original.reimbursement_discussed.procedure,
        }
      : null,
  };
}

export function useAutoTranslate(summary: CallSummary, locale: Locale) {
  const [translated, setTranslated] = useState<CallSummary>(summary);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // No translation needed for English (source language)
    if (locale === "en") {
      setTranslated(summary);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    async function translate() {
      try {
        const fields = extractTranslatable(summary);
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fields, targetLang: locale }),
        });

        if (!response.ok) {
          setTranslated(summary);
          return;
        }

        const { translated: result } = await response.json();
        if (!cancelled && result) {
          setTranslated(applyTranslation(summary, result));
        }
      } catch {
        if (!cancelled) setTranslated(summary);
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    }

    translate();
    return () => { cancelled = true; };
  }, [summary, locale]);

  return { translated, isTranslating };
}
