/**
 * Doctor chat — real Mistral-powered conversation with a doctor
 * who has received the full call context from Maude.
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { CallSummary } from "@/lib/types";
import { PatientProfile } from "@/lib/patients";
import { useTranslation } from "@/lib/i18n";
import PhoneFrame from "./PhoneFrame";

interface DoctorChatProps {
  summary: CallSummary;
  patient: PatientProfile;
  onBack: () => void;
}

interface ChatMessage {
  role: "doctor" | "user" | "system";
  text: string;
}

export default function DoctorChat({ summary, patient, onBack }: DoctorChatProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = patient.name.split(" ")[0];
  const doctorName = "Dr. Claire Morel";

  // Build call summary text for context
  const callSummaryText = [
    summary.summary,
    summary.patient_state.general,
    summary.patient_state.pain_level !== "unknown" ? `Pain: ${summary.patient_state.pain_level}` : "",
    summary.patient_state.mood !== "unknown" ? `Mood: ${summary.patient_state.mood}` : "",
    ...summary.medications_status.map((m) => `${m.name}: ${m.compliance}`),
  ].filter(Boolean).join(". ");

  // Initial doctor greeting via Mistral
  useEffect(() => {
    const systemMsg: ChatMessage = {
      role: "system",
      text: isFr
        ? `Maude a transféré le contexte de votre appel au ${doctorName}.`
        : `Maude transferred your call context to ${doctorName}.`,
    };
    setMessages([systemMsg]);

    // Get initial doctor greeting from Mistral
    (async () => {
      try {
        const res = await fetch("/api/doctor-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: isFr
              ? `[Le patient ${firstName} vient d'être mis en relation avec vous après un appel avec Maude. Présentez-vous et montrez que vous avez le contexte de l'appel. Soyez chaleureuse et concise.]`
              : `[The patient ${firstName} was just connected with you after a call with Maude. Introduce yourself and show you have the call context. Be warm and concise.]`
            }],
            patientName: patient.name,
            callSummary: callSummaryText,
            language: locale,
          }),
        });
        const data = await res.json();
        setMessages([systemMsg, { role: "doctor", text: data.reply }]);
      } catch {
        setMessages([systemMsg, {
          role: "doctor",
          text: isFr
            ? `Bonjour ${firstName}, je suis ${doctorName}. J'ai le contexte de votre appel avec Maude. Comment puis-je vous aider ?`
            : `Hi ${firstName}, I'm ${doctorName}. I have the context of your call with Maude. How can I help?`,
        }]);
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Build Mistral message history from chat
  function toMistralMessages() {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "doctor" ? "assistant" as const : "user" as const,
        content: m.text,
      }));
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);

    try {
      const history = toMistralMessages();
      history.push({ role: "user", content: text });

      const res = await fetch("/api/doctor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          patientName: patient.name,
          callSummary: callSummaryText,
          language: locale,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "doctor", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "doctor",
        text: isFr ? "Désolée, une erreur est survenue. Réessayez." : "Sorry, an error occurred. Please try again.",
      }]);
    }
    setIsLoading(false);
    inputRef.current?.focus();
  }

  return (
    <PhoneFrame>
      <div className="bg-[#FFFCF5] h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#F0F0F2] px-4 pt-10 pb-2.5 flex items-center gap-3 shrink-0">
          <button onClick={onBack} className="text-[#5C59F3]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5C59F3] to-[#2F33A8] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 14c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#282830]">{doctorName}</p>
            <p className="text-[10px] text-[#2AA79C] font-medium">
              {isLoading ? (isFr ? "En train d'écrire..." : "Typing...") : (isFr ? "En ligne" : "Online")}
            </p>
          </div>
          <div className="flex items-center gap-0.5 bg-[#EBFAF9] px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2AA79C]" />
            <span className="text-[9px] text-[#2AA79C] font-semibold">{isFr ? "Inclus" : "Included"}</span>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            msg.role === "system" ? (
              <div key={i} className="flex justify-center">
                <p className="text-[10px] text-[#8E8E93] bg-[#F5F5F7] px-3 py-1.5 rounded-full text-center">
                  {msg.text}
                </p>
              </div>
            ) : msg.role === "doctor" ? (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5C59F3] to-[#2F33A8] flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 14c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none border border-[#F0F0F2] px-3 py-2.5 max-w-[85%] shadow-sm">
                  <p className="text-[10px] font-semibold text-[#5C59F3] mb-1">{doctorName}</p>
                  <p className="text-[11px] text-[#3C3C43] leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-2 items-start justify-end">
                <div className="bg-[#5C59F3] rounded-2xl rounded-tr-none px-3 py-2.5 max-w-[85%] shadow-sm">
                  <p className="text-[11px] text-white leading-relaxed">{msg.text}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFE0C2] to-[#FECBA1] flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {firstName[0]}
                </div>
              </div>
            )
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5C59F3] to-[#2F33A8] flex items-center justify-center shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 14c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none border border-[#F0F0F2] px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#9DA3BA] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#9DA3BA] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#9DA3BA] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-[#F0F0F2] px-4 py-3 pb-8 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isFr ? "Votre message..." : "Your message..."}
              disabled={isLoading}
              className="flex-1 bg-[#F5F5F7] rounded-full px-4 py-2.5 text-[12px] text-[#282830] placeholder-[#C7C7CC] outline-none focus:ring-2 focus:ring-[#5C59F3]/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-full bg-[#5C59F3] flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </PhoneFrame>
  );
}
