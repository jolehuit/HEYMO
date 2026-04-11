/**
 * Shared types for the frontend.
 * These match the data contracts defined in the PRD.
 */

export interface CallSummary {
  patient_id: string;
  patient_name: string;
  date: string;
  duration_seconds: number;
  alert_level: "green" | "orange" | "red";
  summary: string;
  patient_state: {
    pain_level: string;
    mood: string;
    general: string;
  };
  medications_status: MedicationStatus[];
  wearable_highlights: WearableHighlights;
  actions: Action[];
  reimbursement_discussed: ReimbursementInfo | null;
  escalated: boolean;
}

export interface MedicationStatus {
  name: string;
  status: "completed" | "in_progress";
  compliance: string;
  remaining_days?: number;
}

export interface WearableHighlights {
  resting_hr: MetricData;
  sleep_hours: MetricData;
  steps: MetricData;
  risk_patterns: string[];
}

export interface MetricData {
  value: number;
  baseline: number;
  trend: string;
}

export interface Action {
  type: "appointment" | "followup_call" | "flag" | "sms_sent";
  description: string;
  status?: string;
  sms_sent?: boolean;
  scheduled_date?: string;
}

export interface ReimbursementInfo {
  procedure: string;
  average_price: number;
  secu_rate: number;
  secu_reimbursement: number;
  alan_reimbursement: number;
  out_of_pocket: number;
  direct_billing: boolean;
}

export interface LiveAlert {
  type: "alert";
  level: "orange" | "red";
  reason: string;
}
