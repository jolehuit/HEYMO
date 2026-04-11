/**
 * Call interface — LiveKit voice agent UI
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
import { AlertTriangleIcon, MicIcon, PillIcon, CalendarIcon, PhoneIcon } from "./AlanIcons";

interface CallInterfaceProps {
  patient: PatientProfile;
  onBack: () => void;
}

const SUMMARY_TIMEOUT = 30_000;

export default function CallInterface({ patient, onBack }: CallInterfaceProps) {
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
    console.log("[HEYMO] End call — generating summary from transcriptions");
    setCallPhase("ending");

    // Generate summary client-side from collected transcriptions
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
        console.log("[HEYMO] Summary generated!", data.alert_level);
        setSummary(data);
        setCallPhase("done");
      } else {
        console.error("[HEYMO] Summary API error:", await res.text());
        setCallPhase("done");
      }
    } catch (e) {
      console.error("[HEYMO] Summary generation failed:", e);
      setCallPhase("done");
    }
  }, [patient, locale]);

  const handleTranscriptionUpdate = useCallback((texts: string[]) => {
    collectedTranscriptions.current = texts;
  }, []);

  // --- Error state ---
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5]">
        <div className="text-center alan-card p-10 max-w-md">
          <div className="w-14 h-14 rounded-full bg-[#FFF3E5] flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon size={28} color="#FF6D39" />
          </div>
          <p className="text-[#282830] text-lg font-semibold mb-2">{t("call.error_title")}</p>
          <p className="text-[#9DA3BA] text-sm mb-6">{error}</p>
          <button onClick={onBack} className="alan-btn-primary px-6 py-3 w-full">
            {t("call.error_back")}
          </button>
        </div>
      </div>
    );
  }

  // --- Loading state (cold start) ---
  if (isConnecting || !token || !url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5]">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-[#5C59F3]/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-[#5C59F3]/5 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/maude.png" alt="Maude" width={90} height={90} className="drop-shadow-lg animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#282830] mb-2">{t("call.connecting")}</h2>
          <p className="text-[#9DA3BA]">{t("call.connecting_hint")}</p>
        </div>
      </div>
    );
  }

  // --- Post-call flow (outside LiveKitRoom) ---
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
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5]">
        <div className="text-center">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-[#5C59F3]/10 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/maude.png" alt="Maude" width={80} height={80} className="drop-shadow-lg" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[#282830] mb-2">{t("call.generating_summary")}</h2>
          <p className="text-[#9DA3BA] mb-6">{t("call.generating_hint")}</p>
        </div>
      </div>
    );
  }

  // --- Active call ---
  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      audio={true}
      className="min-h-screen bg-[#FFFCF5]"
    >
      <ActiveCall patient={patient} onEndCall={handleEndCall} onTranscriptionUpdate={handleTranscriptionUpdate} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

/* ─── Patient info sheet (sidebar) ─── */
function PatientInfoSheet({ patient }: { patient: PatientProfile }) {
  const { t } = useTranslation();
  return (
    <div className="alan-card p-4 text-sm space-y-3 h-fit">
      <div className="flex items-center gap-2 pb-2 border-b border-[#ECF1FC]">
        <span className="text-2xl">{patient.emoji}</span>
        <div>
          <p className="font-bold text-[#282830]">{patient.name}</p>
          <p className="text-xs text-[#9DA3BA]">{patient.age} {t("landing.years_old")} · {patient.plan}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-wider mb-1">{t(`event.${patient.eventType}` as never) || patient.eventType}</p>
        <p className="text-[#282830] font-medium">{t(`desc.${patient.eventDescription}` as never) || patient.eventDescription}</p>
        <p className="text-xs text-[#9DA3BA]">{patient.eventDate}{patient.provider ? ` · ${patient.provider}` : ""}</p>
      </div>
      {patient.followupRequired && (
        <div className="flex items-start gap-2">
          <CalendarIcon size={14} color="#5C59F3" className="mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-[#282830]">{patient.followupRequired}</p>
            <span className={`text-xs font-semibold ${patient.followupBooked ? "text-[#2AA79C]" : "text-[#FF6D39]"}`}>
              {patient.followupBooked ? t("patient.followup_booked") : t("patient.followup_not_booked")}
            </span>
          </div>
        </div>
      )}
      {patient.medications && patient.medications.length > 0 && (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <PillIcon size={14} color="#5C59F3" />
            <span className="text-xs font-semibold text-[#9DA3BA] uppercase">{t("dashboard.medications")}</span>
          </div>
          {patient.medications.map((med, i) => (
            <div key={i} className="py-1 border-b border-[#ECF1FC] last:border-0">
              <p className="text-xs font-medium text-[#282830]">{med.name}</p>
              <p className="text-xs text-[#9DA3BA]">{med.dosage} · {med.remaining_days > 0 ? `${med.remaining_days}j` : t("dashboard.done")}</p>
            </div>
          ))}
        </div>
      )}
      {patient.communicationStyle && (
        <div className="text-xs text-[#9DA3BA] italic pt-1 border-t border-[#ECF1FC]">
          💬 {patient.communicationStyle}
        </div>
      )}
    </div>
  );
}

/* ─── Active call view ─── */
function ActiveCall({
  patient,
  onEndCall,
  onTranscriptionUpdate,
}: {
  patient: PatientProfile;
  onEndCall: () => void;
  onTranscriptionUpdate: (texts: string[]) => void;
}) {
  const { t } = useTranslation();
  const { state, audioTrack, videoTrack, agentTranscriptions } = useVoiceAssistant();
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const { textStreams: liveUpdates } = useTextStream("live-updates");

  // Collect transcriptions for summary generation
  useEffect(() => {
    onTranscriptionUpdate(agentTranscriptions.map((t) => t.text));
  }, [agentTranscriptions, onTranscriptionUpdate]);

  useEffect(() => {
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentTranscriptions]);

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
    <div className="min-h-screen flex flex-col bg-[#FFFCF5]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#ECF1FC]">
        <div className="flex items-center gap-3">
          <Image src="/maude.png" alt="Maude" width={28} height={28} className="rounded-full" />
          <span className="text-sm font-bold text-[#282830]">HeyMo</span>
          <div className="h-4 w-px bg-[#ECF1FC]" />
          <PhoneIcon size={14} color="#2AA79C" />
          <span className="text-sm text-[#2AA79C] font-mono">{fmtDuration}</span>
        </div>
        <button
          onClick={onEndCall}
          className="px-4 py-2 bg-[#FF6D39] hover:bg-[#CF3302] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <PhoneIcon size={14} color="white" />
          {t("call.end")}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex">
        {/* Left — Patient info */}
        <div className="w-72 shrink-0 p-4 border-r border-[#ECF1FC] overflow-y-auto hidden md:block">
          <p className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-wider mb-3">📋 {t("patient.info")}</p>
          <PatientInfoSheet patient={patient} />
        </div>

        {/* Center — Call */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
          {/* Avatar */}
          <div className="relative mb-4">
            {isSpeaking && (
              <>
                <div className="absolute -inset-4 rounded-full bg-[#5C59F3]/10 animate-pulse" />
                <div className="absolute -inset-6 rounded-full bg-[#5C59F3]/5 animate-ping" />
              </>
            )}
            {isThinking && <div className="absolute -inset-4 rounded-full bg-[#FF9359]/10 animate-pulse" />}
            {isListening && <div className="absolute -inset-4 rounded-full bg-[#2AA79C]/10 animate-pulse" />}

            {videoTrack ? (
              <div className={`relative w-[130px] h-[130px] rounded-full overflow-hidden drop-shadow-xl transition-all duration-300 ${
                isSpeaking ? "ring-4 ring-[#5C59F3] ring-offset-2 scale-105" :
                isThinking ? "ring-4 ring-[#FF9359] ring-offset-2" :
                isListening ? "ring-4 ring-[#2AA79C] ring-offset-2" :
                "ring-2 ring-[#ECF1FC]"
              }`}>
                <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover" />
              </div>
            ) : (
              <Image src="/maude.png" alt="Maude" width={130} height={130}
                className={`relative rounded-full drop-shadow-xl transition-all duration-300 ${
                  isSpeaking ? "ring-4 ring-[#5C59F3] ring-offset-2 scale-105" :
                  isThinking ? "ring-4 ring-[#FF9359] ring-offset-2" :
                  isListening ? "ring-4 ring-[#2AA79C] ring-offset-2" :
                  "ring-2 ring-[#ECF1FC]"
                }`}
              />
            )}
          </div>

          {/* State */}
          <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${
            isSpeaking ? "text-[#5C59F3]" : isThinking ? "text-[#FF9359]" : isListening ? "text-[#2AA79C]" : "text-[#9DA3BA]"
          }`}>
            {isListening && <MicIcon size={16} color="#2AA79C" />}
            {t(stateKey)}
          </div>

          {/* Live subtitle */}
          <div className="w-full max-w-md h-12 flex items-center justify-center mb-4">
            {isSpeaking && lastTranscription && (
              <p className="text-[#282830] text-center text-base font-medium animate-pulse">{lastTranscription}</p>
            )}
          </div>

          {/* Audio visualizer */}
          <div className="w-full max-w-xs h-14 mb-6">
            {audioTrack ? (
              <BarVisualizer state={state} trackRef={audioTrack} barCount={20} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-1 bg-[#5C59F3]/15 rounded-full animate-pulse"
                    style={{ height: `${8 + Math.random() * 24}px`, animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="w-full max-w-md mb-4">
              {alerts.map((alert, i) => (
                <div key={i} className={`${alert.level === "red" ? "alert-red" : "alert-orange"} rounded-xl px-4 py-2.5 mb-2 flex items-start gap-2`}>
                  <AlertTriangleIcon size={16} color={alert.level === "red" ? "#CF3302" : "#FF6D39"} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-xs uppercase">{alert.level} {t("alert.label")}</span>
                    <p className="text-sm mt-0.5">{alert.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Transcription */}
          <div className="w-full max-w-md alan-card p-4 max-h-48 overflow-y-auto">
            <h3 className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-wider mb-2">{t("call.conversation")}</h3>
            <div className="space-y-2.5">
              {agentTranscriptions.map((seg, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <Image src="/maude.png" alt="Maude" width={22} height={22} className="rounded-full shrink-0 mt-0.5" />
                  <p className="text-[#282830] text-sm bg-[#F0F3FF] rounded-xl rounded-tl-none px-3 py-1.5">{seg.text}</p>
                </div>
              ))}
              {agentTranscriptions.length === 0 && (
                <p className="text-[#9DA3BA] text-sm italic text-center py-3">{t("call.conversation_placeholder")}</p>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
