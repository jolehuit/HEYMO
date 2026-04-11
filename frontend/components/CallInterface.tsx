/**
 * Call interface — LiveKit voice agent UI inside iPhone frame
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  VideoTrack,
  RoomAudioRenderer,
  useTextStream,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { PatientProfile } from "@/lib/patients";
import { CallSummary, LiveAlert } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import Dashboard from "./Dashboard";
import PhoneNotification from "./PhoneNotification";
import PatientActions from "./PatientActions";
import PhoneFrame from "./PhoneFrame";
import { AlertTriangleIcon, MicIcon, PhoneIcon } from "./AlanIcons";

interface CallInterfaceProps {
  patient: PatientProfile;
  onBack: () => void;
  onSummaryGenerated?: (summary: CallSummary) => void;
}

export default function CallInterface({ patient, onBack, onSummaryGenerated }: CallInterfaceProps) {
  const { t, locale } = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [postCallStep, setPostCallStep] = useState<"notification" | "actions" | "dashboard">("notification");
  const [callPhase, setCallPhase] = useState<"active" | "ending" | "done">("active");
  const collectedTranscriptions = useRef<string[]>([]);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: patient.id, language: locale }),
        });
        if (!response.ok) throw new Error("Failed to get token");
        const data = await response.json();
        setToken(data.token);
        setUrl(data.url);
        setIsConnecting(false);
      } catch {
        setError("Failed to connect. Check your LiveKit configuration.");
        setIsConnecting(false);
      }
    }
    fetchToken();
  }, [patient.id, locale]);

  const handleEndCall = useCallback(async () => {
    setCallPhase("ending");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptions: collectedTranscriptions.current,
          patientId: patient.id,
          patientName: patient.name,
          eventDescription: patient.eventDescription,
          medications: patient.medications || [],
          language: locale,
        }),
      });
      if (res.ok) {
        const { summary: data } = await res.json();
        setSummary(data);
        onSummaryGenerated?.(data);
      }
    } catch { /* fallback: no summary */ }
    setCallPhase("done");
  }, [patient, locale]);

  const handleTranscriptionUpdate = useCallback((texts: string[]) => {
    collectedTranscriptions.current = texts;
  }, []);

  // --- Error ---
  if (error) {
    return (
      <PhoneFrame>
        <div className="flex flex-col items-center justify-center h-full px-6 py-20">
          <div className="w-14 h-14 rounded-full bg-[#FFF3E5] flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon size={28} color="#FF6D39" />
          </div>
          <p className="text-[#282830] text-base font-semibold mb-2">{t("call.error_title")}</p>
          <p className="text-[#9DA3BA] text-xs mb-6 text-center">{error}</p>
          <button onClick={onBack} className="alan-btn-primary px-5 py-2.5 text-sm w-full">
            {t("call.error_back")}
          </button>
        </div>
      </PhoneFrame>
    );
  }

  // --- Loading ---
  if (isConnecting || !token || !url) {
    return (
      <PhoneFrame>
        <div className="flex flex-col items-center justify-center h-full px-6">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-[#5C59F3]/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-[#5C59F3]/5 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/maude.png" alt="Maude" width={80} height={80} style={{ width: 80, height: "auto" }} className="drop-shadow-lg animate-pulse" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-[#282830] mb-1">{t("call.connecting")}</h2>
          <p className="text-xs text-[#9DA3BA]">{t("call.connecting_hint")}</p>
        </div>
      </PhoneFrame>
    );
  }

  // --- Post-call flow ---
  if (summary) {
    if (postCallStep === "notification") {
      return (
        <PhoneNotification
          patientName={patient.name.split(" ")[0]}
          onOpen={() => setPostCallStep("actions")}
        />
      );
    }
    if (postCallStep === "actions") {
      return (
        <PatientActions
          summary={summary}
          patient={patient}
          onViewDashboard={() => setPostCallStep("dashboard")}
          onBack={onBack}
        />
      );
    }
    return <Dashboard summary={summary} onBack={onBack} />;
  }

  // --- Generating summary ---
  if (callPhase === "ending") {
    return (
      <PhoneFrame>
        <div className="flex flex-col items-center justify-center h-full px-6">
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-[#5C59F3]/10 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/maude.png" alt="Maude" width={70} height={70} style={{ width: 70, height: "auto" }} className="drop-shadow-lg" />
            </div>
          </div>
          <h2 className="text-base font-bold text-[#282830] mb-1">{t("call.generating_summary")}</h2>
          <p className="text-xs text-[#9DA3BA]">{t("call.generating_hint")}</p>
        </div>
      </PhoneFrame>
    );
  }

  // --- Active call in iPhone ---
  return (
    <PhoneFrame>
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect={true}
        audio={true}
        className="h-full"
      >
        <ActiveCallPhone patient={patient} onEndCall={handleEndCall} onTranscriptionUpdate={handleTranscriptionUpdate} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </PhoneFrame>
  );
}

/* ─── Active call inside phone ─── */
function ActiveCallPhone({
  patient,
  onEndCall,
  onTranscriptionUpdate,
}: {
  patient: PatientProfile;
  onEndCall: () => void;
  onTranscriptionUpdate: (texts: string[]) => void;
}) {
  const { t, locale } = useTranslation();
  const { state, audioTrack, videoTrack, agentTranscriptions } = useVoiceAssistant();
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [userTexts, setUserTexts] = useState<{ text: string; time: number }[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const { textStreams: liveUpdates } = useTextStream("live-updates");

  useEffect(() => {
    onTranscriptionUpdate(agentTranscriptions.map((t) => t.text));
  }, [agentTranscriptions, onTranscriptionUpdate]);

  // Browser speech recognition for user's voice
  useEffect(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = locale === "fr" ? "fr-FR" : "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            setUserTexts((prev) => [...prev, { text, time: Date.now() }]);
          }
        }
      }
    };

    recognition.onend = () => { try { recognition.start(); } catch { /* ignore */ } };

    try { recognition.start(); } catch { /* ignore */ }
    return () => { try { recognition.stop(); } catch { /* ignore */ } };
  }, [locale]);

  useEffect(() => {
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentTranscriptions, userTexts]);

  useEffect(() => {
    if (liveUpdates.length > 0) {
      try {
        const parsed = JSON.parse(liveUpdates[liveUpdates.length - 1].text) as LiveAlert;
        if (parsed.type === "alert") setAlerts((prev) => [...prev, parsed]);
      } catch { /* ignore */ }
    }
  }, [liveUpdates]);

  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isThinking = state === "thinking";
  const stateKey = `state.${state}` as const;

  const lastTranscription = agentTranscriptions.length > 0
    ? agentTranscriptions[agentTranscriptions.length - 1].text
    : null;

  const fmtDuration = `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full bg-[#FFFCF5]">
      {/* Call header — iOS style */}
      <div className="bg-white px-4 pt-10 pb-3 border-b border-[#ECF1FC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/maude.png" alt="Maude" width={24} height={24} style={{ width: 24, height: 24 }} className="rounded-full" />
            <span className="text-xs font-bold text-[#282830]">Maude</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking || isListening ? "bg-[#2AA79C]" : "bg-[#9DA3BA]"} animate-pulse`} />
            <span className="text-xs text-[#2AA79C] font-mono">{fmtDuration}</span>
          </div>
        </div>
      </div>

      {/* Main call area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-4">
        {/* Maude avatar */}
        <div className="relative mb-3">
          {isSpeaking && (
            <>
              <div className="absolute -inset-3 rounded-full bg-[#5C59F3]/10 animate-pulse" />
              <div className="absolute -inset-5 rounded-full bg-[#5C59F3]/5 animate-ping" />
            </>
          )}
          {isThinking && <div className="absolute -inset-3 rounded-full bg-[#FF9359]/10 animate-pulse" />}
          {isListening && <div className="absolute -inset-3 rounded-full bg-[#2AA79C]/10 animate-pulse" />}

          {videoTrack ? (
            <div className={`relative w-[100px] h-[100px] rounded-full overflow-hidden drop-shadow-xl transition-all duration-300 ${
              isSpeaking ? "ring-3 ring-[#5C59F3] ring-offset-2 scale-105" :
              isThinking ? "ring-3 ring-[#FF9359] ring-offset-2" :
              isListening ? "ring-3 ring-[#2AA79C] ring-offset-2" :
              "ring-2 ring-[#ECF1FC]"
            }`}>
              <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover" />
            </div>
          ) : (
            <Image src="/maude.png" alt="Maude" width={100} height={100}
              style={{ width: 100, height: "auto" }}
              className={`relative rounded-full drop-shadow-xl transition-all duration-300 ${
                isSpeaking ? "ring-3 ring-[#5C59F3] ring-offset-2 scale-105" :
                isThinking ? "ring-3 ring-[#FF9359] ring-offset-2" :
                isListening ? "ring-3 ring-[#2AA79C] ring-offset-2" :
                "ring-2 ring-[#ECF1FC]"
              }`}
            />
          )}
        </div>

        {/* State */}
        <div className={`flex items-center gap-1.5 mb-1 text-xs font-semibold ${
          isSpeaking ? "text-[#5C59F3]" : isThinking ? "text-[#FF9359]" : isListening ? "text-[#2AA79C]" : "text-[#9DA3BA]"
        }`}>
          {isListening && <MicIcon size={12} color="#2AA79C" />}
          {t(stateKey)}
        </div>

        {/* Live subtitle */}
        <div className="w-full h-10 flex items-center justify-center mb-2 px-2">
          {isSpeaking && lastTranscription && (
            <p className="text-[#282830] text-center text-xs font-medium leading-snug line-clamp-2">{lastTranscription}</p>
          )}
        </div>

        {/* Audio visualizer */}
        <div className="w-full h-12 mb-4">
          {audioTrack ? (
            <BarVisualizer state={state} trackRef={audioTrack} barCount={16} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center gap-0.5">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-0.5 bg-[#5C59F3]/15 rounded-full animate-pulse"
                  style={{ height: `${6 + Math.random() * 20}px`, animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        {alerts.map((alert, i) => (
          <div key={i} className={`${alert.level === "red" ? "alert-red" : "alert-orange"} rounded-xl px-3 py-2 mb-2 w-full flex items-start gap-2`}>
            <AlertTriangleIcon size={14} color={alert.level === "red" ? "#CF3302" : "#FF6D39"} className="mt-0.5 shrink-0" />
            <p className="text-[10px]">{alert.reason}</p>
          </div>
        ))}

        {/* Transcription — interleaved agent + user */}
        <div className="w-full bg-white rounded-2xl border border-[#ECF1FC] p-3 flex-1 max-h-44 overflow-y-auto">
          <h3 className="text-[9px] font-semibold text-[#9DA3BA] uppercase tracking-wider mb-2">{t("call.conversation")}</h3>
          <div className="space-y-2">
            {(() => {
              // Merge agent + user messages by approximate time order
              const agentMsgs = agentTranscriptions.map((seg, i) => ({
                role: "agent" as const, text: seg.text, order: i * 2,
              }));
              const userMsgs = userTexts.map((u, i) => ({
                role: "user" as const, text: u.text, order: i * 2 + 1,
              }));
              const allMsgs = [...agentMsgs, ...userMsgs].sort((a, b) => a.order - b.order);

              if (allMsgs.length === 0) {
                return <p className="text-[#9DA3BA] text-[10px] italic text-center py-2">{t("call.conversation_placeholder")}</p>;
              }

              return allMsgs.map((msg, i) => (
                msg.role === "agent" ? (
                  <div key={`a-${i}`} className="flex gap-2 items-start">
                    <Image src="/maude.png" alt="Maude" width={18} height={18} style={{ width: 18, height: 18 }} className="rounded-full shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#282830] bg-[#F0F3FF] rounded-xl rounded-tl-none px-2.5 py-1.5 leading-snug">{msg.text}</p>
                  </div>
                ) : (
                  <div key={`u-${i}`} className="flex gap-2 items-start justify-end">
                    <p className="text-[11px] text-[#282830] bg-[#EBFAF9] rounded-xl rounded-tr-none px-2.5 py-1.5 leading-snug">{msg.text}</p>
                    <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#FFE0C2] to-[#FECBA1] flex items-center justify-center text-[8px] shrink-0 mt-0.5">👩</div>
                  </div>
                )
              ));
            })()}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom — End call button iOS style */}
      <div className="px-5 pb-8 pt-3 flex justify-center">
        <button
          onClick={onEndCall}
          className="w-14 h-14 rounded-full bg-[#FF6D39] hover:bg-[#CF3302] transition-colors flex items-center justify-center shadow-lg active:scale-95"
        >
          <PhoneIcon size={22} color="white" />
        </button>
      </div>
    </div>
  );
}
