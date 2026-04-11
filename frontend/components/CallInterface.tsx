/**
 * Call interface — LiveKit voice agent UI
 *
 * Owner: Dev 3
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  DisconnectButton,
  useTextStream,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { PatientProfile } from "@/lib/patients";
import { CallSummary, LiveAlert } from "@/lib/types";
import Dashboard from "./Dashboard";
import { AlanMarmot } from "./AlanLogo";
import { MicIcon, AlertTriangleIcon } from "./AlanIcons";

interface CallInterfaceProps {
  patient: PatientProfile;
  onBack: () => void;
}

export default function CallInterface({ patient, onBack }: CallInterfaceProps) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callEnded, setCallEnded] = useState(false);
  const [summary, setSummary] = useState<CallSummary | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: patient.id }),
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
  }, [patient.id]);

  const handleDisconnected = useCallback(() => setCallEnded(true), []);
  const handleSummaryReceived = useCallback((data: CallSummary) => setSummary(data), []);

  // --- Error state ---
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5]">
        <div className="text-center alan-card p-10 max-w-md">
          <div className="w-14 h-14 rounded-full bg-[#FFF3E5] flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon size={28} color="#FF6D39" />
          </div>
          <p className="text-[#282830] text-lg font-semibold mb-2">Connection failed</p>
          <p className="text-[#9DA3BA] text-sm mb-6">{error}</p>
          <button onClick={onBack} className="alan-btn-primary px-6 py-3 w-full">
            Back to patient selection
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
          {/* Marmot face pulsing */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-[#5C59F3]/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-[#5C59F3]/10 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <AlanMarmot size="lg" color="#5C59F3" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#282830] mb-2">Connecting to your health agent...</h2>
          <p className="text-[#9DA3BA]">This may take 10-15 seconds on first connection</p>
          <div className="flex items-center justify-center gap-2 mt-6 bg-[#F0F3FF] px-4 py-2 rounded-full">
            <span className="text-2xl">{patient.emoji}</span>
            <span className="text-[#464754] font-medium">{patient.name}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- Dashboard after call ends ---
  if (callEnded && summary) {
    return <Dashboard summary={summary} onBack={onBack} />;
  }

  // --- Active call ---
  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      audio={true}
      onDisconnected={handleDisconnected}
      className="min-h-screen bg-[#FFFCF5]"
    >
      <ActiveCall patient={patient} callEnded={callEnded} onSummaryReceived={handleSummaryReceived} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function ActiveCall({
  patient,
  callEnded,
  onSummaryReceived,
}: {
  patient: PatientProfile;
  callEnded: boolean;
  onSummaryReceived: (data: CallSummary) => void;
}) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);

  const { textStreams: liveUpdates } = useTextStream("live-updates");
  const { textStreams: summaryStreams } = useTextStream("call-summary");

  useEffect(() => {
    if (liveUpdates.length > 0) {
      try {
        const parsed = JSON.parse(liveUpdates[liveUpdates.length - 1].text) as LiveAlert;
        if (parsed.type === "alert") setAlerts((prev) => [...prev, parsed]);
      } catch { /* ignore */ }
    }
  }, [liveUpdates]);

  useEffect(() => {
    if (summaryStreams.length > 0) {
      try {
        onSummaryReceived(JSON.parse(summaryStreams[0].text) as CallSummary);
      } catch { /* ignore */ }
    }
  }, [summaryStreams, onSummaryReceived]);

  const stateConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    disconnected: { label: "Disconnected", color: "text-[#9DA3BA]", dotColor: "bg-[#9DA3BA]" },
    connecting: { label: "Connecting...", color: "text-[#FF9359]", dotColor: "bg-[#FF9359]" },
    initializing: { label: "Agent waking up...", color: "text-[#FF9359]", dotColor: "bg-[#FF9359]" },
    idle: { label: "Ready", color: "text-[#5C59F3]", dotColor: "bg-[#5C59F3]" },
    listening: { label: "Listening", color: "text-[#5C59F3]", dotColor: "bg-[#5C59F3]" },
    thinking: { label: "Thinking...", color: "text-[#FF9359]", dotColor: "bg-[#FF9359]" },
    speaking: { label: "Speaking", color: "text-[#5C59F3]", dotColor: "bg-[#5C59F3]" },
  };

  const currentState = stateConfig[state] || { label: state, color: "text-[#9DA3BA]", dotColor: "bg-[#9DA3BA]" };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#ECF1FC]">
        <div className="flex items-center gap-4">
          <AlanMarmot size="sm" color="#5C59F3" />
          <div className="h-6 w-px bg-[#ECF1FC]" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">{patient.emoji}</span>
            <div>
              <h1 className="text-lg font-bold text-[#282830]">{patient.name}</h1>
              <p className="text-sm text-[#9DA3BA]">{patient.eventDescription}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium flex items-center gap-2 ${currentState.color}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${currentState.dotColor}`} />
            {currentState.label}
          </span>
          <DisconnectButton className="px-5 py-2.5 bg-[#FF6D39] hover:bg-[#CF3302] text-white rounded-xl text-sm font-semibold transition-colors">
            End Call
          </DisconnectButton>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Audio visualizer */}
        <div className="w-full max-w-md h-48 mb-8">
          {audioTrack ? (
            <BarVisualizer state={state} trackRef={audioTrack} barCount={24} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#5C59F3]/10 animate-pulse scale-150" />
                <div className="relative bg-[#F0F3FF] rounded-full p-6">
                  <MicIcon size={32} color="#5C59F3" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live alerts */}
        {alerts.map((alert, i) => (
          <div key={i} className={`${alert.level === "red" ? "alert-red" : "alert-orange"} rounded-xl px-5 py-3 mb-3 w-full max-w-lg flex items-start gap-3`}>
            <AlertTriangleIcon size={18} color={alert.level === "red" ? "#CF3302" : "#FF6D39"} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-xs uppercase">{alert.level} alert</span>
              <p className="text-sm mt-0.5">{alert.reason}</p>
            </div>
          </div>
        ))}

        {/* Transcription */}
        <div className="w-full max-w-lg mt-4">
          <h3 className="text-xs font-semibold text-[#9DA3BA] uppercase tracking-wider mb-3">Conversation</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {agentTranscriptions.map((t, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="shrink-0 mt-0.5">
                  <AlanMarmot size="sm" color="#5C59F3" />
                </div>
                <p className="text-[#282830] text-sm">{t.text}</p>
              </div>
            ))}
            {agentTranscriptions.length === 0 && !callEnded && (
              <p className="text-[#9DA3BA] text-sm italic">Conversation will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
