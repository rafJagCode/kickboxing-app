export type CalendarSessionStatus = "PLANNED" | "COMPLETED" | "CANCELLED";
export type FileType = "pdf" | "img";

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface TrainingType {
  id: string;
  name: string;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  member_id: string;
  file_url: string;
  file_type: FileType;
  booking_date: string;
  created_at: string;
}

export interface CalendarSession {
  id: string;
  training_type_id: string;
  date: string; // ISO date 'YYYY-MM-DD'
  status: CalendarSessionStatus;
  created_at: string;
}

export interface Pass {
  id: string;
  member_id: string;
  training_type_id: string;
  start_date: string; // ISO date 'YYYY-MM-DD'
  total_entries: number;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  pass_id: string;
  date: string; // ISO timestamptz
}
