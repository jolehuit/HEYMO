/**
 * Post-call dashboard — displays the summary JSON from the agent (BOILERPLATE)
 *
 * Owner: Dev 3
 *
 * This receives a CallSummary JSON (see lib/types.ts) from the agent
 * via LiveKit text stream after the call ends.
 *
 * TODO(Dev3): Make this look great. This is what the judge sees after the call.
 * TODO(Dev3): Add visual indicators for alert levels (green/orange/red).
 * TODO(Dev3): Show wearable data with trends (arrows, colors).
 * TODO(Dev3): Show reimbursement breakdown clearly (who pays what).
 */

"use client";

import { CallSummary } from "@/lib/types";

interface DashboardProps {
  summary: CallSummary;
  onBack: () => void;
}

export default function Dashboard({ summary, onBack }: DashboardProps) {
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Call Summary</h1>
            <p className="text-slate-400 mt-1">
              {summary.patient_name} — {summary.date} — {formatDuration(summary.duration_seconds)}
            </p>
          </div>
          <button onClick={onBack} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold">
            New Call
          </button>
        </div>

        {/* Alert level */}
        <div className={`rounded-xl p-4 mb-6 border ${
          summary.alert_level === "green" ? "bg-green-900/30 border-green-700" :
          summary.alert_level === "orange" ? "bg-orange-900/30 border-orange-700" :
          "bg-red-900/30 border-red-700"
        }`}>
          <p className="font-bold">{summary.alert_level === "green" ? "All Clear" : summary.alert_level === "orange" ? "Needs Attention" : "Urgent"}</p>
          <p className="text-sm text-slate-300">{summary.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Medications */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold mb-4">Medications</h2>
            {/* TODO(Dev3): Show compliance status, remaining days, visual indicators */}
            {summary.medications_status.map((med, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-700 last:border-0">
                <span className="text-sm">{med.name}</span>
                <span className="text-xs text-slate-400">{med.status}</span>
              </div>
            ))}
          </div>

          {/* Wearable data */}
          {summary.wearable_highlights && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold mb-4">Wearable Data</h2>
              {/* TODO(Dev3): Show values with baselines, trend arrows, risk badges */}
              {summary.wearable_highlights.resting_hr && (
                <div className="py-2">
                  <span className="text-slate-400 text-sm">Heart Rate: </span>
                  <span className="font-bold">{summary.wearable_highlights.resting_hr.value} BPM</span>
                  <span className="text-slate-500 text-xs"> (baseline {summary.wearable_highlights.resting_hr.baseline})</span>
                </div>
              )}
              {summary.wearable_highlights.sleep_hours && (
                <div className="py-2">
                  <span className="text-slate-400 text-sm">Sleep: </span>
                  <span className="font-bold">{summary.wearable_highlights.sleep_hours.value}h</span>
                  <span className="text-slate-500 text-xs"> (baseline {summary.wearable_highlights.sleep_hours.baseline}h)</span>
                </div>
              )}
              {summary.wearable_highlights.steps && (
                <div className="py-2">
                  <span className="text-slate-400 text-sm">Steps: </span>
                  <span className="font-bold">{summary.wearable_highlights.steps.value.toLocaleString()}</span>
                  <span className="text-slate-500 text-xs"> (baseline {summary.wearable_highlights.steps.baseline.toLocaleString()})</span>
                </div>
              )}
            </div>
          )}

          {/* Reimbursement */}
          {summary.reimbursement_discussed && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold mb-4">Reimbursement</h2>
              {/* TODO(Dev3): Nice breakdown — sécu, alan, out-of-pocket, direct billing badge */}
              <p className="text-sm">{summary.reimbursement_discussed.procedure}</p>
              <p className="text-2xl font-bold mt-2">{summary.reimbursement_discussed.out_of_pocket.toFixed(2)}€ out of pocket</p>
            </div>
          )}

          {/* Actions */}
          {summary.actions.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold mb-4">Actions</h2>
              {/* TODO(Dev3): Show action types with icons, scheduled dates, SMS badges */}
              {summary.actions.map((action, i) => (
                <div key={i} className="py-2 border-b border-slate-700 last:border-0">
                  <span className="text-xs text-slate-500 uppercase">{action.type}</span>
                  <p className="text-sm">{action.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
