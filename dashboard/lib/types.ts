export type Business = {
  id: string;
  name: string;
  vertical: string;
  phone_number: string;
  onboarding_config: Record<string, unknown>;
  plan: string;
  created_at: string;
};

export type CallLog = {
  id: string;
  business_id: string;
  caller_number: string;
  duration_sec: number | null;
  transcript: string | null;
  summary: string | null;
  intent: string | null;
  escalated: boolean;
  timestamp: string;
};

export type Appointment = {
  id: string;
  business_id: string;
  patient_name: string;
  phone: string;
  appointment_datetime: string;
  notes: string | null;
};

export type AgentInstruction = {
  id: string;
  business_id: string;
  instruction: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
};
