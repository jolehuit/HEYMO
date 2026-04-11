/**
 * Post-call dashboard — displays the summary from the agent
 *
 * Owner: Dev 3
 */

"use client";

import { CallSummary } from "@/lib/types";
import AlanLogo from "./AlanLogo";
import { PillIcon, WatchIcon, WalletIcon, ClipboardIcon, CalendarIcon, PhoneIcon, FlagIcon, CheckCircleIcon, HeartPulseIcon } from "./AlanIcons";

interface DashboardProps {
  summary: CallSummary;
  onBack: () => void;
}

function TrendArrow({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-[#FF6D39] text-sm font-bold">↑</span>;
  if (trend === "down") return <span className="text-[#5C59F3] text-sm font-bold">↓</span>;
  return <span className="text-[#2AA79C] text-sm font-bold">→</span>;
}

function MetricCard({ label, icon, value, unit, baseline, baselineUnit, trend }: {
  label: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  baseline: number;
  baselineUnit?: string;
  trend: string;
}) {
  const isAbove = value > baseline;
  const diff = Math.abs(value - baseline);
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#ECF1FC] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm text-[#9DA3BA]">{label}</p>
          <p className="text-xl font-bold text-[#282830]">
            {typeof value === "number" && value > 999 ? value.toLocaleString() : value}{unit}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <p className="text-xs text-[#9DA3BA]">baseline {baseline}{baselineUnit || unit}</p>
          <p className={`text-sm font-semibold ${isAbove ? "text-[#FF6D39]" : "text-[#2AA79C]"}`}>
            {isAbove ? "+" : "-"}{typeof diff === "number" && diff > 999 ? diff.toLocaleString() : diff}{baselineUnit || unit}
          </p>
        </div>
        <TrendArrow trend={trend} />
      </div>
    </div>
  );
}

export default function Dashboard({ summary, onBack }: DashboardProps) {
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const alertConfig = {
    green: { class: "alert-green", label: "All Clear", icon: <CheckCircleIcon size={20} color="#1C6E67" /> },
    orange: { class: "alert-orange", label: "Needs Attention", icon: <HeartPulseIcon size={20} color="#CF3302" /> },
    red: { class: "alert-red", label: "Urgent", icon: <HeartPulseIcon size={20} color="#CF3302" /> },
  };
  const alert = alertConfig[summary.alert_level];

  return (
    <div className="min-h-screen p-8 bg-[#FFFCF5]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <AlanLogo size="sm" color="#5C59F3" />
              <div className="h-5 w-px bg-[#ECF1FC]" />
              <h1 className="text-2xl font-bold text-[#282830]">Call Summary</h1>
            </div>
            <p className="text-[#9DA3BA]">
              {summary.patient_name} · {summary.date} · {formatDuration(summary.duration_seconds)}
            </p>
          </div>
          <button onClick={onBack} className="alan-btn-primary px-6 py-3 flex items-center gap-2">
            <PhoneIcon size={16} color="white" />
            New Call
          </button>
        </div>

        {/* Alert level banner */}
        <div className={`${alert.class} rounded-xl p-5 mb-6`}>
          <div className="flex items-center gap-3">
            {alert.icon}
            <div>
              <p className="font-bold">{alert.label}</p>
              <p className="text-sm mt-0.5 opacity-80">{summary.summary}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Medications */}
          <div className="alan-card p-6">
            <h2 className="text-lg font-bold text-[#282830] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center">
                <PillIcon size={18} color="#5C59F3" />
              </div>
              Medications
            </h2>
            {summary.medications_status.map((med, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#ECF1FC] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#282830]">{med.name}</p>
                  {med.remaining_days !== undefined && med.remaining_days !== null && (
                    <p className="text-xs text-[#9DA3BA]">{med.remaining_days} days remaining</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {med.compliance && (
                    <span className="text-xs font-medium text-[#2AA79C] bg-[#EBFAF9] px-2 py-0.5 rounded-full">
                      {med.compliance}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    med.status === "completed"
                      ? "bg-[#ECF1FC] text-[#464754]"
                      : "bg-[#F0F3FF] text-[#5C59F3]"
                  }`}>
                    {med.status === "completed" ? "Done" : "In progress"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Wearable data */}
          {summary.wearable_highlights && (
            <div className="alan-card p-6">
              <h2 className="text-lg font-bold text-[#282830] mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center">
                  <WatchIcon size={18} color="#5C59F3" />
                </div>
                Wearable Data
              </h2>
              {summary.wearable_highlights.resting_hr && (
                <MetricCard
                  label="Resting Heart Rate"
                  icon={<HeartPulseIcon size={16} color="#5C59F3" />}
                  value={summary.wearable_highlights.resting_hr.value}
                  unit=" BPM"
                  baseline={summary.wearable_highlights.resting_hr.baseline}
                  trend={summary.wearable_highlights.resting_hr.trend}
                />
              )}
              {summary.wearable_highlights.sleep_hours && (
                <MetricCard
                  label="Sleep"
                  icon={<WatchIcon size={16} color="#5C59F3" />}
                  value={summary.wearable_highlights.sleep_hours.value}
                  unit="h"
                  baseline={summary.wearable_highlights.sleep_hours.baseline}
                  trend={summary.wearable_highlights.sleep_hours.trend}
                />
              )}
              {summary.wearable_highlights.steps && (
                <MetricCard
                  label="Daily Steps"
                  icon={<CheckCircleIcon size={16} color="#5C59F3" />}
                  value={summary.wearable_highlights.steps.value}
                  unit=""
                  baseline={summary.wearable_highlights.steps.baseline}
                  trend={summary.wearable_highlights.steps.trend}
                />
              )}
              {summary.wearable_highlights.risk_patterns && summary.wearable_highlights.risk_patterns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#ECF1FC]">
                  {summary.wearable_highlights.risk_patterns.map((risk, i) => (
                    <span key={i} className="inline-block text-xs font-medium bg-[#FFF3E5] text-[#CF3302] px-3 py-1 rounded-full mr-2 mb-1">
                      ⚠ {risk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reimbursement */}
          {summary.reimbursement_discussed && (
            <div className="alan-card p-6">
              <h2 className="text-lg font-bold text-[#282830] mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center">
                  <WalletIcon size={18} color="#5C59F3" />
                </div>
                Reimbursement
              </h2>
              <p className="text-sm text-[#464754] mb-4">{summary.reimbursement_discussed.procedure}</p>

              <div className="space-y-3">
                {summary.reimbursement_discussed.secu_rate !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9DA3BA]">Securite sociale</span>
                    <span className="text-sm font-semibold text-[#282830]">
                      {summary.reimbursement_discussed.secu_reimbursement?.toFixed(2)}€
                    </span>
                  </div>
                )}
                {summary.reimbursement_discussed.alan_reimbursement !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9DA3BA]">Alan</span>
                    <span className="text-sm font-semibold text-[#5C59F3]">
                      {summary.reimbursement_discussed.alan_reimbursement?.toFixed(2)}€
                    </span>
                  </div>
                )}
                <div className="border-t border-[#ECF1FC] pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#282830]">Out of pocket</span>
                  <span className="text-lg font-bold text-[#282830]">
                    {summary.reimbursement_discussed.out_of_pocket.toFixed(2)}€
                  </span>
                </div>
              </div>

              {summary.reimbursement_discussed.direct_billing && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#5C59F3] bg-[#F0F3FF] px-3 py-2 rounded-lg">
                  <CheckCircleIcon size={14} color="#5C59F3" />
                  Direct billing available — no upfront cost
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {summary.actions.length > 0 && (
            <div className="alan-card p-6">
              <h2 className="text-lg font-bold text-[#282830] mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center">
                  <ClipboardIcon size={18} color="#5C59F3" />
                </div>
                Actions
              </h2>
              {summary.actions.map((action, i) => {
                const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
                  appointment: { icon: <CalendarIcon size={14} color="#5C59F3" />, color: "bg-[#F0F3FF] text-[#5C59F3]" },
                  followup_call: { icon: <PhoneIcon size={14} color="#1C6E67" />, color: "bg-[#EBFAF9] text-[#1C6E67]" },
                  flag: { icon: <FlagIcon size={14} color="#CF3302" />, color: "bg-[#FFF3E5] text-[#CF3302]" },
                };
                const config = typeConfig[action.type] || { icon: null, color: "bg-[#F5F8FE] text-[#464754]" };

                return (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-[#ECF1FC] last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0 mt-0.5">
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${config.color}`}>
                          {action.type.replace("_", " ")}
                        </span>
                        {action.sms_sent && (
                          <span className="text-xs font-medium text-[#5C59F3] bg-[#F0F3FF] px-2 py-0.5 rounded">
                            SMS sent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#282830]">{action.description}</p>
                      {action.scheduled_date && (
                        <p className="text-xs text-[#9DA3BA] mt-1">Scheduled: {action.scheduled_date}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
