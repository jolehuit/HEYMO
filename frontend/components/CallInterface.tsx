/**
 * Call interface — LiveKit voice agent UI with real-time transcription.
 * Handles connection, audio visualization, and live transcription display.
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

        if (!response.ok) {
          throw new Error("Failed to get token");
        }

        const data = await response.json();
        setToken(data.token);
        setUrl(data.url);
        setIsConnecting(false);
      } catch (err) {
        setError("Failed to connect. Check your LiveKit configuration.");
        setIsConnecting(false);
      }
    }

    fetchToken();
  }, [patient.id]);

  const handleDisconnected = useCallback(() => {
    setCallEnded(true);
  }, []);

  const handleSummaryReceived = useCallback((data: CallSummary) => {
    setSummary(data);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Back to patient selection
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting || !token || !url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-6">
            <div className="w-24 h-24 rounded-full bg-purple-600/30 mx-auto flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-purple-600/50 animate-ping" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Connecting to your health agent...
          </h2>
          <p className="text-slate-400">
            Setting up a secure voice connection for {patient.name}
          </p>
          <p className="text-slate-500 text-sm mt-4">
            This may take 10-15 seconds on first connection
          </p>
        </div>
      </div>
    );
  }

  // Show dashboard after call ends
  if (callEnded && summary) {
    return <Dashboard summary={summary} onBack={onBack} />;
  }

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      audio={true}
      onDisconnected={handleDisconnected}
      className="min-h-screen"
    >
      <ActiveCall
        patient={patient}
        onBack={onBack}
        callEnded={callEnded}
        onSummaryReceived={handleSummaryReceived}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

/**
 * Active call view — shown while connected to the LiveKit room.
 */
function ActiveCall({
  patient,
  onBack,
  callEnded,
  onSummaryReceived,
}: {
  patient: PatientProfile;
  onBack: () => void;
  callEnded: boolean;
  onSummaryReceived: (data: CallSummary) => void;
}) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);

  // Listen for live updates (alerts) from the agent
  const { textStreams: liveUpdates } = useTextStream("live-updates");

  // Listen for the post-call summary
  const { textStreams: summaryStreams } = useTextStream("call-summary");

  // Process live alerts
  useEffect(() => {
    if (liveUpdates.length > 0) {
      const latest = liveUpdates[liveUpdates.length - 1];
      try {
        const parsed = JSON.parse(latest.text) as LiveAlert;
        if (parsed.type === "alert") {
          setAlerts((prev) => [...prev, parsed]);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [liveUpdates]);

  // Process summary when received
  useEffect(() => {
    if (summaryStreams.length > 0) {
      try {
        const parsed = JSON.parse(summaryStreams[0].text) as CallSummary;
        onSummaryReceived(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, [summaryStreams, onSummaryReceived]);

  // Agent state display
  const stateLabel: Record<string, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    "pre-connect-buffering": "Preparing...",
    failed: "Connection failed",
    initializing: "Agent waking up...",
    idle: "Ready",
    listening: "Listening",
    thinking: "Thinking...",
    speaking: "Speaking",
  };

  const stateColor: Record<string, string> = {
    disconnected: "bg-slate-500",
    connecting: "bg-yellow-500",
    "pre-connect-buffering": "bg-yellow-500",
    failed: "bg-red-500",
    initializing: "bg-yellow-500",
    idle: "bg-green-400",
    listening: "bg-green-500",
    thinking: "bg-blue-500",
    speaking: "bg-purple-500",
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-2xl">{patient.emoji}</span>
          <div>
            <h1 className="text-xl font-bold">{patient.name}</h1>
            <p className="text-sm text-slate-400">
              {patient.eventDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${stateColor[state] || "bg-slate-500"} animate-pulse`} />
            <span className="text-sm text-slate-300">{stateLabel[state] || state}</span>
          </div>
          <DisconnectButton className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-colors">
            End Call
          </DisconnectButton>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Audio visualizer */}
        <div className="w-full max-w-md h-48 mb-8">
          {audioTrack ? (
            <BarVisualizer
              state={state}
              trackRef={audioTrack}
              barCount={24}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-slate-500">
                {state === "connecting" || state === "initializing"
                  ? "Waiting for agent..."
                  : "No audio"}
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="w-full max-w-lg mb-6 space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`px-4 py-3 rounded-lg border ${
                  alert.level === "red"
                    ? "bg-red-900/30 border-red-700 text-red-300"
                    : "bg-orange-900/30 border-orange-700 text-orange-300"
                }`}
              >
                <span className="font-semibold uppercase text-xs">
                  {alert.level} alert
                </span>
                <p className="text-sm mt-1">{alert.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Transcription */}
        <div className="w-full max-w-lg">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Conversation
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {agentTranscriptions.map((t, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-purple-400 text-xs font-semibold mt-1 shrink-0">
                  ALAN
                </span>
                <p className="text-slate-300 text-sm">{t.text}</p>
              </div>
            ))}
            {agentTranscriptions.length === 0 && !callEnded && (
              <p className="text-slate-500 text-sm italic">
                {state === "connecting" || state === "initializing"
                  ? "Waiting for agent to connect..."
                  : "Conversation will appear here..."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 text-center">
        <p className="text-slate-600 text-xs">
          Powered by Mistral Voxtral + LiveKit | Your conversation is not recorded
        </p>
      </div>
    </div>
  );
}
