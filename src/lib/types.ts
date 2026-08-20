export type QuestionType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "scale_1_10"
  | "date"
  | "number";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface QuestionItem {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For radio, select, checkbox
  helpText?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  questions: QuestionItem[];
}

export interface AnamnesisTemplateData {
  id: string;
  title: string;
  description: string;
  version: number;
  isActive: boolean;
  sections: FormSection[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
  };
}

export interface PatientData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  gender?: string;
  occupation?: string;
  maritalStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionData {
  id: string;
  patientId: string;
  patient: PatientData;
  templateId: string;
  templateTitle?: string;
  template?: {
    id: string;
    title: string;
    version: number;
  };
  templateVersion: number;
  templateSnapshot: FormSection[];
  answers: Record<string, any>;
  chiefComplaint?: string;
  status: "pending" | "in_review" | "approved" | "archived";
  clinicalNotes?: string;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contracts?: ContractData[];
}

export interface ContractData {
  id: string;
  patientId: string;
  patient?: PatientData;
  submissionId?: string | null;
  title: string;
  therapistName: string;
  therapistDoc: string;
  therapistAddress: string;
  sessionPrice: number;
  frequency: string;
  durationMinutes: number;
  paymentMethod: string;
  cancellationPolicy: string;
  customClauses?: string;
  status: "draft" | "generated" | "signed";
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  crp: string;
  phone: string;
  notificationEmail: string;
  clinicName: string;
  address: string;
}
