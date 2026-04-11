/**
 * Mock doctor chat — simulates an in-app conversation with a doctor
 * who has received the full call context from Maude.
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  role: "doctor" | "system";
  text: string;
}

export default function DoctorChat({ summary, patient, onBack }: DoctorChatProps) {
  const { locale } = useTranslation();
  const isFr = locale === "fr";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTyping, setShowTyping] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const firstName = patient.name.split(" ")[0];
  const doctorName = isFr ? "Dr. Claire Morel" : "Dr. Claire Morel";

  // Build context summary for the doctor
  const contextLines: string[] = [];
  if (summary.patient_state.pain_level && summary.patient_state.pain_level !== "unknown") {
    contextLines.push(isFr ? `Niveau de douleur : ${summary.patient_state.pain_level}` : `Pain level: ${summary.patient_state.pain_level}`);
  }
  if (summary.patient_state.mood && summary.patient_state.mood !== "unknown") {
    contextLines.push(isFr ? `Humeur : ${summary.patient_state.mood}` : `Mood: ${summary.patient_state.mood}`);
  }
  if (summary.patient_state.general) {
    contextLines.push(summary.patient_state.general);
  }

  const contextText = contextLines.length > 0
    ? contextLines.join(". ") + "."
    : (isFr ? "Appel de suivi post-intervention." : "Post-event follow-up call.");

  useEffect(() => {
    // Simulate doctor reading context and typing
    const systemMsg: ChatMessage = {
      role: "system",
      text: isFr
        ? `Maude a transféré le contexte de votre appel au ${doctorName}.`
        : `Maude transferred your call context to ${doctorName}.`,
    };

    const doctorMsg1: ChatMessage = {
      role: "doctor",
      text: isFr
        ? `Bonjour ${firstName}, je suis ${doctorName}. J'ai le compte-rendu de votre appel avec Maude.\n\n${contextText}\n\nComment puis-je vous aider ?`
        : `Hi ${firstName}, I'm ${doctorName}. I have the summary of your call with Maude.\n\n${contextText}\n\nHow can I help you?`,
    };

    // Show system message immediately
    setMessages([systemMsg]);

    // Doctor types for 1.5s then sends message
    const timer = setTimeout(() => {
      setShowTyping(false);
      setMessages([systemMsg, doctorMsg1]);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTyping]);

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
              {isFr ? "En ligne" : "Online"}
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
            ) : (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5C59F3] to-[#2F33A8] flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 14c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none border border-[#F0F0F2] px-3 py-2.5 max-w-[85%] shadow-sm">
                  <p className="text-[10px] font-semibold text-[#5C59F3] mb-1">{doctorName}</p>
                  <p className="text-[11px] text-[#3C3C43] leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            )
          ))}

          {/* Typing indicator */}
          {showTyping && (
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

        {/* Input bar (mock — not functional) */}
        <div className="bg-white border-t border-[#F0F0F2] px-4 py-3 pb-8 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F5F5F7] rounded-full px-4 py-2.5">
              <p className="text-[12px] text-[#C7C7CC]">{isFr ? "Votre message..." : "Your message..."}</p>
            </div>
            <button className="w-9 h-9 rounded-full bg-[#5C59F3] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
