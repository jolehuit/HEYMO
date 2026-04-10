/**
 * Call interface — LiveKit voice agent UI (BOILERPLATE)
 *
 * Owner: Dev 3
 *
 * This component:
 * 1. Fetches a token from /api/token (with patient_id)
 * 2. Connects to a LiveKit room
 * 3. Shows audio visualizer + agent state + live transcription
 * 4. Listens for text streams from the agent (alerts + summary)
 * 5. Shows Dashboard when call ends
 *
 * TODO(Dev3): Polish the call UI — better visualizer, better state display.
 * TODO(Dev3): Handle edge cases — connection errors, agent timeout, etc.
 * TODO(Dev3): Add cold start UX — animation while agent wakes up (~10-20s).
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

  // Fetch token on mount
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button onClick={onBack} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg">
            Back to patient selection
          </button>
        </div>
      </div>
    );
  }

  // --- Loading state ---
  // TODO(Dev3): Make this a nice animation for the cold start wait
  if (isConnecting || !token || !url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-purple-600/50 animate-ping mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Connecting to your health agent...</h2>
          <p className="text-slate-400">This may take 10-15 seconds on first connection</p>
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
      className="min-h-screen"
    >
      <ActiveCall patient={patient} callEnded={callEnded} onSummaryReceived={handleSummaryReceived} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

/**
 * Active call view — rendered inside the LiveKitRoom context.
 */
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

  // --- Text streams from the agent ---
  const { textStreams: liveUpdates } = useTextStream("live-updates");
  const { textStreams: summaryStreams } = useTextStream("call-summary");

  // Process live alerts
  useEffect(() => {
    if (liveUpdates.length > 0) {
      try {
        const parsed = JSON.parse(liveUpdates[liveUpdates.length - 1].text) as LiveAlert;
        if (parsed.type === "alert") setAlerts((prev) => [...prev, parsed]);
      } catch { /* ignore */ }
    }
  }, [liveUpdates]);

  // Process summary
  useEffect(() => {
    if (summaryStreams.length > 0) {
      try {
        onSummaryReceived(JSON.parse(summaryStreams[0].text) as CallSummary);
      } catch { /* ignore */ }
    }
  }, [summaryStreams, onSummaryReceived]);

  // --- Agent state labels ---
  // TODO(Dev3): Make the state display more visual — icons, colors, transitions
  const stateLabels: Record<string, string> = {
    disconnected: "Disconnected", connecting: "Connecting...",
    initializing: "Agent waking up...", idle: "Ready",
    listening: "Listening", thinking: "Thinking...", speaking: "Speaking",
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{patient.emoji}</span>
          <div>
            <h1 className="text-xl font-bold">{patient.name}</h1>
            <p className="text-sm text-slate-400">{patient.eventDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{stateLabels[state] || state}</span>
          <DisconnectButton className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold">
            End Call
          </DisconnectButton>
        </div>
      </div>

      {/* Audio visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md h-48 mb-8">
          {audioTrack ? (
            <BarVisualizer state={state} trackRef={audioTrack} barCount={24} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Waiting for agent...
            </div>
          )}
        </div>

        {/* TODO(Dev3): Show alerts in a more prominent way */}
        {alerts.map((alert, i) => (
          <div key={i} className="px-4 py-3 rounded-lg bg-orange-900/30 border border-orange-700 text-orange-300 mb-2 w-full max-w-lg">
            <span className="font-semibold text-xs uppercase">{alert.level} alert</span>
            <p className="text-sm mt-1">{alert.reason}</p>
          </div>
        ))}

        {/* Transcription */}
        <div className="w-full max-w-lg">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Conversation</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {agentTranscriptions.map((t, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-purple-400 text-xs font-semibold mt-1 shrink-0">ALAN</span>
                <p className="text-slate-300 text-sm">{t.text}</p>
              </div>
            ))}
            {agentTranscriptions.length === 0 && !callEnded && (
              <p className="text-slate-500 text-sm italic">Conversation will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
