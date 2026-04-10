/**
 * Post-call dashboard — displays the structured summary from the agent.
 * Receives data via LiveKit text stream after the call ends.
 *
 * Owner: Dev 3
 */

"use client";

import { CallSummary } from "@/lib/types";

interface DashboardProps {
  summary: CallSummary;
  onBack: () => void;
}

export default function Dashboard({ summary, onBack }: DashboardProps) {
  const alertColors = {
    green: { bg: "bg-green-900/30", border: "border-green-700", text: "text-green-300", label: "All Clear" },
    orange: { bg: "bg-orange-900/30", border: "border-orange-700", text: "text-orange-300", label: "Needs Attention" },
    red: { bg: "bg-red-900/30", border: "border-red-700", text: "text-red-300", label: "Urgent" },
  };
  const alert = alertColors[summary.alert_level];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const trendIcon = (trend: string) => {
    if (trend.includes("elevated") || trend.includes("declining") || trend.includes("reduced"))
      return "⚠️";
    if (trend === "stable") return "✅";
    return "📊";
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Call Summary</h1>
            <p className="text-slate-400 mt-1">
              {summary.patient_name} — {summary.date} —{" "}
              {formatDuration(summary.duration_seconds)}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-colors"
          >
            New Call
          </button>
        </div>

        {/* Alert banner */}
        <div className={`${alert.bg} ${alert.border} border rounded-xl p-4 mb-6 flex items-center gap-3`}>
          <div className={`text-2xl`}>
            {summary.alert_level === "green" ? "✅" : summary.alert_level === "orange" ? "⚠️" : "🚨"}
          </div>
          <div>
            <p className={`font-bold ${alert.text}`}>{alert.label}</p>
            <p className="text-sm text-slate-300">{summary.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient State */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🩺</span> Patient State
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Pain Level</span>
                <span className="font-medium">{summary.patient_state.pain_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mood</span>
                <span className="font-medium">{summary.patient_state.mood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">General</span>
                <span className="font-medium">{summary.patient_state.general}</span>
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>💊</span> Medications
            </h2>
            <div className="space-y-3">
              {summary.medications_status.map((med, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{med.name}</p>
                    <p className="text-xs text-slate-500">
                      {med.status === "completed" ? "Course completed" : `${med.remaining_days} days remaining`}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      med.compliance === "full"
                        ? "bg-green-900/50 text-green-300"
                        : "bg-orange-900/50 text-orange-300"
                    }`}
                  >
                    {med.compliance}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Wearable Data */}
          {summary.wearable_highlights && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>⌚</span> Wearable Data (7 days)
              </h2>
              <div className="space-y-4">
                {summary.wearable_highlights.resting_hr && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-sm">Resting Heart Rate</span>
                      <span className="text-sm">
                        {trendIcon(summary.wearable_highlights.resting_hr.trend)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {summary.wearable_highlights.resting_hr.value}
                      </span>
                      <span className="text-slate-500 text-sm">BPM</span>
                      <span className="text-slate-500 text-xs">
                        (baseline: {summary.wearable_highlights.resting_hr.baseline})
                      </span>
                    </div>
                  </div>
                )}
                {summary.wearable_highlights.sleep_hours && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-sm">Sleep</span>
                      <span className="text-sm">
                        {trendIcon(summary.wearable_highlights.sleep_hours.trend)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {summary.wearable_highlights.sleep_hours.value}
                      </span>
                      <span className="text-slate-500 text-sm">hrs/night</span>
                      <span className="text-slate-500 text-xs">
                        (baseline: {summary.wearable_highlights.sleep_hours.baseline})
                      </span>
                    </div>
                  </div>
                )}
                {summary.wearable_highlights.steps && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-sm">Daily Steps</span>
                      <span className="text-sm">
                        {trendIcon(summary.wearable_highlights.steps.trend)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {summary.wearable_highlights.steps.value.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-sm">steps</span>
                      <span className="text-slate-500 text-xs">
                        (baseline: {summary.wearable_highlights.steps.baseline.toLocaleString()})
                      </span>
                    </div>
                  </div>
                )}
                {summary.wearable_highlights.risk_patterns.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Risk Patterns</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.wearable_highlights.risk_patterns.map((pattern, i) => (
                        <span
                          key={i}
                          className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded-full"
                        >
                          {pattern.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reimbursement */}
          {summary.reimbursement_discussed && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>💶</span> Reimbursement
              </h2>
              <div className="space-y-3">
                <p className="text-slate-300 font-medium">
                  {summary.reimbursement_discussed.procedure}
                </p>
                <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total cost</span>
                    <span className="font-bold">
                      {summary.reimbursement_discussed.average_price.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Social security</span>
                    <span className="text-green-400">
                      -{summary.reimbursement_discussed.secu_reimbursement.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alan covers</span>
                    <span className="text-purple-400">
                      -{summary.reimbursement_discussed.alan_reimbursement.toFixed(2)}€
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="font-bold">You pay</span>
                    <span className="font-bold text-xl">
                      {summary.reimbursement_discussed.out_of_pocket.toFixed(2)}€
                    </span>
                  </div>
                </div>
                {summary.reimbursement_discussed.direct_billing && (
                  <p className="text-green-400 text-sm">
                    ✓ Direct billing available — no upfront payment needed
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {summary.actions.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📋</span> Actions & Next Steps
            </h2>
            <div className="space-y-3">
              {summary.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-slate-900 rounded-lg p-3"
                >
                  <span className="text-lg">
                    {action.type === "appointment"
                      ? "📅"
                      : action.type === "followup_call"
                        ? "📞"
                        : "🚩"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{action.description}</p>
                    {action.scheduled_date && (
                      <p className="text-xs text-slate-500">
                        Scheduled: {action.scheduled_date}
                      </p>
                    )}
                  </div>
                  {action.sms_sent && (
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded-full">
                      SMS sent
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 mb-4">
          <p className="text-slate-600 text-xs">
            Data sourced from Thryve (wearables) and Linkup (reimbursement) |
            Powered by Mistral + LiveKit
          </p>
        </div>
      </div>
    </div>
  );
}
