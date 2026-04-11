/**
 * Post-call dashboard — displays the summary from the agent
 *
 * Owner: Dev 3
 */

"use client";

import Image from "next/image";
import { CallSummary } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { useAutoTranslate } from "@/lib/useAutoTranslate";
import PhoneFrame from "./PhoneFrame";
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

function MetricCard({ label, icon, value, unit, baseline, baselineUnit, trend, baselineLabel, formatNumber }: {
  label: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  baseline: number;
  baselineUnit?: string;
  trend: string;
  baselineLabel: string;
  formatNumber: (n: number) => string;
}) {
  const isAbove = value > baseline;
  const diff = Math.abs(value - baseline);
  const fmtValue = value > 999 ? formatNumber(value) : String(value);
  const fmtDiff = diff > 999 ? formatNumber(diff) : String(diff);
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#ECF1FC] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm text-[#9DA3BA]">{label}</p>
          <p className="text-xl font-bold text-[#282830]">
            {fmtValue}{unit}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <p className="text-xs text-[#9DA3BA]">{baselineLabel} {baseline}{baselineUnit || unit}</p>
          <p className={`text-sm font-semibold ${isAbove ? "text-[#FF6D39]" : "text-[#2AA79C]"}`}>
            {isAbove ? "+" : "-"}{fmtDiff}{baselineUnit || unit}
          </p>
        </div>
        <TrendArrow trend={trend} />
      </div>
    </div>
  );
}

export default function Dashboard({ summary: rawSummary, onBack }: DashboardProps) {
  const { t, formatNumber, locale } = useTranslation();
  const { translated: summary, isTranslating } = useAutoTranslate(rawSummary, locale);

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const alertConfig = {
    green: { class: "alert-green", label: t("alert.green"), icon: <CheckCircleIcon size={20} color="#1C6E67" /> },
    orange: { class: "alert-orange", label: t("alert.orange"), icon: <HeartPulseIcon size={20} color="#CF3302" /> },
    red: { class: "alert-red", label: t("alert.red"), icon: <HeartPulseIcon size={20} color="#CF3302" /> },
  };
  const alert = alertConfig[summary.alert_level];

  const actionLabels: Record<string, string> = {
    appointment: t("action.appointment"),
    followup_call: t("action.followup_call"),
    flag: t("action.flag"),
  };

  return (
    <PhoneFrame>
    <div className="bg-[#FFFCF5] min-h-full p-4 pb-8">
      <div className="pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Image src="/maude.png" alt="Maude" width={36} height={36} className="rounded-full" />
              <div className="h-5 w-px bg-[#ECF1FC]" />
              <h1 className="text-2xl font-bold text-[#282830]">{t("dashboard.title")}</h1>
            </div>
            <p className="text-[#9DA3BA]">
              {summary.patient_name} · {summary.date} · {fmtDuration(summary.duration_seconds)}
            </p>
          </div>
          <button onClick={onBack} className="alan-btn-primary px-6 py-3 flex items-center gap-2">
            <PhoneIcon size={16} color="white" />
            {t("dashboard.new_call")}
          </button>
        </div>

        {/* Translation indicator */}
        {isTranslating && (
          <div className="flex items-center gap-2 mb-4 text-sm text-[#5C59F3] bg-[#F0F3FF] px-4 py-2 rounded-lg w-fit">
            <div className="w-3 h-3 rounded-full bg-[#5C59F3] animate-pulse" />
            {locale === "fr" ? "Traduction en cours..." : "Translating..."}
          </div>
        )}

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
              {t("dashboard.medications")}
            </h2>
            {summary.medications_status.map((med, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#ECF1FC] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#282830]">{med.name}</p>
                  {med.remaining_days !== undefined && med.remaining_days !== null && (
                    <p className="text-xs text-[#9DA3BA]">{med.remaining_days} {t("dashboard.days_remaining")}</p>
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
                    {med.status === "completed" ? t("dashboard.done") : t("dashboard.in_progress")}
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
                {t("dashboard.wearable")}
              </h2>
              {summary.wearable_highlights.resting_hr && (
                <MetricCard
                  label={t("dashboard.resting_hr")}
                  icon={<HeartPulseIcon size={16} color="#5C59F3" />}
                  value={summary.wearable_highlights.resting_hr.value}
                  unit=" BPM"
                  baseline={summary.wearable_highlights.resting_hr.baseline}
                  trend={summary.wearable_highlights.resting_hr.trend}
                  baselineLabel={t("dashboard.baseline")}
                  formatNumber={formatNumber}
                />
              )}
              {summary.wearable_highlights.sleep_hours && (
                <MetricCard
                  label={t("dashboard.sleep")}
                  icon={<WatchIcon size={16} color="#5C59F3" />}
                  value={summary.wearable_highlights.sleep_hours.value}
                  unit="h"
                  baseline={summary.wearable_highlights.sleep_hours.baseline}
                  trend={summary.wearable_highlights.sleep_hours.trend}
                  baselineLabel={t("dashboard.baseline")}
                  formatNumber={formatNumber}
                />
              )}
              {summary.wearable_highlights.steps && (
                <MetricCard
                  label={t("dashboard.steps")}
                  icon={<CheckCircleIcon size={16} color="#5C59F3" />}
                  value={summary.wearable_highlights.steps.value}
                  unit=""
                  baseline={summary.wearable_highlights.steps.baseline}
                  trend={summary.wearable_highlights.steps.trend}
                  baselineLabel={t("dashboard.baseline")}
                  formatNumber={formatNumber}
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
                {t("dashboard.reimbursement")}
              </h2>
              <p className="text-sm text-[#464754] mb-4">{summary.reimbursement_discussed.procedure}</p>

              <div className="space-y-3">
                {summary.reimbursement_discussed.secu_rate !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9DA3BA]">{t("dashboard.secu")}</span>
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
                  <span className="text-sm font-semibold text-[#282830]">{t("dashboard.out_of_pocket")}</span>
                  <span className="text-lg font-bold text-[#282830]">
                    {summary.reimbursement_discussed.out_of_pocket.toFixed(2)}€
                  </span>
                </div>
              </div>

              {summary.reimbursement_discussed.direct_billing && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#5C59F3] bg-[#F0F3FF] px-3 py-2 rounded-lg">
                  <CheckCircleIcon size={14} color="#5C59F3" />
                  {t("dashboard.direct_billing")}
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
                {t("dashboard.actions")}
              </h2>
              {summary.actions.map((action, i) => {
                const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
                  appointment: { icon: <CalendarIcon size={14} color="#5C59F3" />, color: "bg-[#F0F3FF] text-[#5C59F3]" },
                  followup_call: { icon: <PhoneIcon size={14} color="#1C6E67" />, color: "bg-[#EBFAF9] text-[#1C6E67]" },
                  flag: { icon: <FlagIcon size={14} color="#CF3302" />, color: "bg-[#FFF3E5] text-[#CF3302]" },
                  sms_sent: { icon: <PhoneIcon size={14} color="#5C59F3" />, color: "bg-[#F0F3FF] text-[#5C59F3]" },
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
                          {actionLabels[action.type] || action.type}
                        </span>
                        {action.sms_sent && (
                          <span className="text-xs font-medium text-[#5C59F3] bg-[#F0F3FF] px-2 py-0.5 rounded">
                            {t("dashboard.sms_sent")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#282830]">{action.description}</p>
                      {action.scheduled_date && (
                        <p className="text-xs text-[#9DA3BA] mt-1">{t("dashboard.scheduled")} : {action.scheduled_date}</p>
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
    </PhoneFrame>
  );
}
